import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatWindowComponent } from '../components/chat-window/chat-window.component';
import { ChatStateService } from '../services/chat-state.service';
import { WebsocketService } from '../services/websocket.service';
import { ChatListComponent } from '../components/chat-list/chat-list.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, ChatWindowComponent, ChatListComponent],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss'
})
export class ChatPageComponent implements OnInit, OnDestroy {
  private chatState = inject(ChatStateService);
  private websocketService = inject(WebsocketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  activeConversation = this.chatState.activeConversation;
  isConnected = false;

  // Mobile view state
  showChatWindow = false;

  // 🆕 État pour l'auto-ouverture
  private pendingConversationId: number | null = null;

  async ngOnInit(): Promise<void> {
    console.log('🚀 ChatPage ngOnInit');

    const userStr = localStorage.getItem('user_data');
    const token = localStorage.getItem('auth_token');

    console.log('👤 User:', userStr);
    console.log('🔑 Token:', token ? 'présent' : 'absent');

    if (!userStr || !token) {
      console.error('❌ Pas de user ou token');
      return;
    }

    const user = JSON.parse(userStr);
    console.log('✅ User parsed:', user);

    this.chatState.setCurrentUser({
      id: user.id,
      nomUtilisateur: user.nomUtilisateur,
      prenomUtilisateur: user.prenomUtilisateur,
    });

    // ÉTAPE 1: Capturer le queryParam AVANT de charger les conversations
    this.route.queryParams.subscribe(params => {
      const conversationId = params['conversation']; // ⚠️ Changé de 'conversationId' à 'conversation'
      if (conversationId) {
        this.pendingConversationId = Number(conversationId);
        console.log('🎯 Conversation à ouvrir:', this.pendingConversationId);
      }
    });

    // Connecter au WebSocket
    console.log('🔌 Tentative de connexion WebSocket...');
    this.connectWebSocket(token);

    //  ÉTAPE 2: Charger les conversations et attendre
    await this.chatState.loadConversations();
    await this.chatState.loadUnreadCount();

    // ÉTAPE 3: Si on a une conversation en attente, l'ouvrir
    if (this.pendingConversationId) {
      setTimeout(() => {
        console.log('✅ Auto-ouverture de la conversation:', this.pendingConversationId);
        this.onConversationSelected(this.pendingConversationId!);
        
        // Nettoyer le queryParam de l'URL (optionnel)
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
        
        this.pendingConversationId = null;
      }, 500);
    }
  }

  ngOnDestroy(): void {
    // Déconnecter du WebSocket
    this.websocketService.disconnect();
  }

  private connectWebSocket(token: string): void {
    this.websocketService.connect(token);

    // Observer l'état de connexion
    this.websocketService.onConnectionStatus().subscribe((connected) => {
      this.isConnected = connected;
      console.log('WebSocket connection status:', connected);

      if (connected) {
        setTimeout(() => {
          this.chatState.initializeWebSocketListeners();
          this.chatState.refreshOnReconnect();
        }, 500);
      }
    });
  }

  onConversationSelected(conversationId: number): void {
    console.log('💬 Conversation sélectionnée ID:', conversationId);
    this.chatState.setActiveConversation(conversationId);

    // En mode mobile, afficher la fenêtre de chat
    if (window.innerWidth < 768) {
      this.showChatWindow = true;
    }
  }

  onBackToList(): void {
    this.showChatWindow = false;
  }
}