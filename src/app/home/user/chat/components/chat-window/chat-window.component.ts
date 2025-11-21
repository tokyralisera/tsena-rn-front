import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, Publication } from '../../models/chat.models';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatService } from '../../services/chat.service';


@Component({
    selector: 'app-chat-window',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-window.component.html',
    styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
    private chatState = inject(ChatStateService);
    private chatService = inject(ChatService);

    @ViewChild('messagesContainer') messagesContainer!: ElementRef;

    // Signals
    activeConversation = this.chatState.activeConversation;
    messages = this.chatState.messages;
    isLoadingMessages = this.chatState.isLoadingMessages;
    typingUsers = this.chatState.typingUsers;
    currentUser = this.chatState.currentUser;

    // Local state
    messageInput = '';
    publication: Publication | null = null;
    showPublicationModal = false;
    isLoadingPublication = false;
    private shouldScrollToBottom = false;
    private typingTimeout: any;

    constructor() {
        // Auto-scroll when new messages arrive
        effect(() => {
            const msgs = this.messages();
            if (msgs.length > 0) {
                this.shouldScrollToBottom = true;
            }
        });

        // NOUVEAU : Log pour déboguer
        effect(() => {
            const activeConv = this.activeConversation();
            console.log('🔍 Active conversation changed:', activeConv ? `ID: ${activeConv.id}` : 'null');
        });
    }

    ngOnInit(): void { }

    ngAfterViewChecked(): void {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    ngOnDestroy(): void {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
    }

    sendMessage(): void {
        const content = this.messageInput.trim();
        if (!content || !this.activeConversation()) return;

        const conversationId = this.activeConversation()!.id;
        this.chatState.sendMessage(conversationId, content);
        this.messageInput = '';
        this.shouldScrollToBottom = true;
    }

    handleEnterKey(event: KeyboardEvent): void {
        if (!event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    onTyping(): void {
        const conversation = this.activeConversation();
        if (!conversation) return;

        this.chatState.sendTyping(conversation.id, true);

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.chatState.sendTyping(conversation.id, false);
        }, 1000);
    }

    isMyMessage(message: Message): boolean {
        return message.senderId === this.currentUser()?.id;
    }

    formatMessageTime(date: Date): string {
        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    formatMessageDate(date: Date): string {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return "Aujourd'hui";
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Hier';
        } else {
            return messageDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        }
    }

    shouldShowDateSeparator(currentMsg: Message, previousMsg?: Message): boolean {
        if (!previousMsg) return true;

        const currentDate = new Date(currentMsg.createdAt).toDateString();
        const previousDate = new Date(previousMsg.createdAt).toDateString();

        return currentDate !== previousDate;
    }

    getTypingUsersText(): string {
        const users = Array.from(this.typingUsers().values());
        if (users.length === 0) return '';
        if (users.length === 1) {
            return `${users[0].prenomUtilisateur} est en train d'écrire...`;
        }
        return 'Plusieurs personnes écrivent...';
    }

    async loadPublication(): Promise<void> {
        const conversation = this.activeConversation();
        if (!conversation) return;

        this.isLoadingPublication = true;
        try {
            this.publication = await this.chatService
                .getConversationPublication(conversation.id)
                .toPromise() || null;
            this.showPublicationModal = true;
        } catch (error) {
            console.error('Error loading publication:', error);
        } finally {
            this.isLoadingPublication = false;
        }
    }

    closePublicationModal(): void {
        this.showPublicationModal = false;
    }

    goToPublication(): void {
        if (this.publication) {
            // Navigate to publication page
            const type = this.publication.type === 'OFFRE' ? 'offres' : 'demandes';
            window.location.href = `/publications/${type}/${this.publication.id}`;
        }
    }

    private scrollToBottom(): void {
        try {
            if (this.messagesContainer) {
                this.messagesContainer.nativeElement.scrollTop =
                    this.messagesContainer.nativeElement.scrollHeight;
            }
        } catch (err) {
            console.error('Error scrolling to bottom:', err);
        }
    }

    trackByMessageId(index: number, message: Message): number {
        return message.id;
    }
}