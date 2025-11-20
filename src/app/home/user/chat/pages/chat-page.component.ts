// src/app/home/user/chat/pages/chat-page.component.ts
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

  ngOnInit(): void {
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

  // Connecter au WebSocket
  console.log('🔌 Tentative de connexion WebSocket...');
  this.connectWebSocket(token);

  // Charger les conversations
  this.chatState.loadConversations();
  this.chatState.loadUnreadCount();

  this.route.queryParams.subscribe(params => {
    const conversationId = params['conversationId'];
    if (conversationId) {
      setTimeout(() => {
        this.onConversationSelected(Number(conversationId));
      }, 500);
    }
  });
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
        }, 500);
      }
    });

  }

  onConversationSelected(conversationId: number): void {
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