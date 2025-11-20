import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStateService } from '../../services/chat-state.service';
import { Conversation } from '../../models/chat.models';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent implements OnInit {
  private chatState = inject(ChatStateService);

  // Signals
  conversations = this.chatState.sortedConversations;
  isLoading = this.chatState.isLoadingConversations;
  activeConversationId = this.chatState.activeConversationId;
  currentUser = this.chatState.currentUser;

  // Output event
  conversationSelected = output<number>();

  ngOnInit(): void {
    this.chatState.loadConversations();
  }

  onSelectConversation(conversationId: number): void {
    this.conversationSelected.emit(conversationId);
  }

  getOtherUser(conversation: Conversation) {
    const currentUserId = this.currentUser()?.id;
    return conversation.initiatorId === currentUserId
      ? conversation.recipient
      : conversation.initiator;
  }

  getLastMessage(conversation: Conversation): string {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'Aucun message';
    }
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    return lastMsg.contenu.length > 50
      ? lastMsg.contenu.substring(0, 50) + '...'
      : lastMsg.contenu;
  }

  formatTime(date: Date): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return messageDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  trackByConversationId(index: number, conversation: Conversation): number {
    return conversation.id;
  }
}