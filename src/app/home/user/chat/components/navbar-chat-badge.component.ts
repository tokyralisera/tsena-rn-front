import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatStateService } from '../services/chat-state.service';
import { WebsocketService } from '../services/websocket.service';


@Component({
  selector: 'app-navbar-chat-badge',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a 
      routerLink="/chat" 
      class="btn btn-ghost btn-circle relative"
      title="Messages"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        class="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>
      
      @if (unreadCount() > 0) {
        <span class="absolute top-1 right-1 badge badge-primary badge-sm">
          {{ unreadCount() > 99 ? '99+' : unreadCount() }}
        </span>
      }
    </a>
  `,
  styles: []
})
export class NavbarChatBadgeComponent implements OnInit {
  private chatState = inject(ChatStateService);
  private websocketService = inject(WebsocketService);

  unreadCount = this.chatState.unreadCount;

  ngOnInit(): void {
    // Charger le nombre initial de messages non lus
    this.chatState.loadUnreadCount();

    // Connecter au WebSocket si on a un token
    const token = localStorage.getItem('auth_token');
    if (token && !this.websocketService.isConnected()) {
      this.websocketService.connect(token);
      
      // Définir l'utilisateur actuel
      const userStr = localStorage.getItem('user_data');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.chatState.setCurrentUser({
          id: user.id,
          nomUtilisateur: user.nomUtilisateur,
          prenomUtilisateur: user.prenomUtilisateur,
        });
      }
    }

    // Rafraîchir le count toutes les 30 secondes
    setInterval(() => {
      this.chatState.loadUnreadCount();
    }, 30000);
  }
}

// Intégration dans votre navbar existante :
/*
<div class="navbar bg-base-100">
  <div class="flex-1">
    <a class="btn btn-ghost text-xl">ROADMARKET</a>
  </div>
  <div class="flex-none gap-2">
    <!-- Autres boutons -->
    <app-navbar-chat-badge></app-navbar-chat-badge>
    <!-- Profil, etc. -->
  </div>
</div>
*/