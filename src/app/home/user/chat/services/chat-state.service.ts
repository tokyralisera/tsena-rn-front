// src/app/home/user/chat/services/chat-state.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Conversation, Message, UserInfo } from '../models/chat.models';
import { WebsocketService } from './websocket.service';
import { ChatService } from './chat.service';

@Injectable({
    providedIn: 'root',
})
export class ChatStateService {
    private websocketService = inject(WebsocketService);
    private chatService = inject(ChatService);

    // State Signals
    private _conversations = signal<Conversation[]>([]);
    private _activeConversationId = signal<number | null>(null);
    private _messages = signal<Message[]>([]);
    private _isLoadingConversations = signal(false);
    private _isLoadingMessages = signal(false);
    private _unreadCount = signal(0);
    private _typingUsers = signal<Map<number, UserInfo>>(new Map());
    private _currentUser = signal<UserInfo | null>(null);
    private _isWebSocketReady = signal(false); // NOUVEAU

    // Computed Signals
    conversations = this._conversations.asReadonly();
    activeConversationId = this._activeConversationId.asReadonly();
    messages = this._messages.asReadonly();
    isLoadingConversations = this._isLoadingConversations.asReadonly();
    isLoadingMessages = this._isLoadingMessages.asReadonly();
    unreadCount = this._unreadCount.asReadonly();
    typingUsers = this._typingUsers.asReadonly();
    currentUser = this._currentUser.asReadonly();

    activeConversation = computed(() => {
        const id = this._activeConversationId();
        return this._conversations().find((c) => c.id === id) || null;
    });

    sortedConversations = computed(() => {
        return [...this._conversations()].sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    });

    constructor() { }

    /**
     * Initialiser les listeners WebSocket (à appeler après connexion)
     */
    initializeWebSocketListeners(): void {
        if (this._isWebSocketReady()) {
            console.log('WebSocket listeners already initialized');
            return;
        }

        if (!this.websocketService.isConnected()) {
            console.warn('WebSocket not connected yet');
            return;
        }

        this.setupWebSocketListeners();
        this._isWebSocketReady.set(true);
        console.log('✅ WebSocket listeners initialized');
    }

    /**
     * Définir l'utilisateur actuel
     */
    setCurrentUser(user: UserInfo): void {
        this._currentUser.set(user);
    }

    /**
     * Charger les conversations
     */
    async loadConversations(): Promise<void> {
        this._isLoadingConversations.set(true);
        try {
            const response = await this.chatService.getConversations().toPromise();
            if (response) {
                this._conversations.set(response.data);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            this._isLoadingConversations.set(false);
        }
    }

    /**
     * Charger les messages d'une conversation
     */
    async loadMessages(conversationId: number): Promise<void> {
        this._isLoadingMessages.set(true);
        try {
            const response = await this.chatService
                .getMessages(conversationId)
                .toPromise();
            if (response) {
                this._messages.set(response.data);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            this._isLoadingMessages.set(false);
        }
    }

    /**
     * Définir la conversation active
     */
    setActiveConversation(conversationId: number): void {
        const currentId = this._activeConversationId();

        // Quitter l'ancienne conversation
        if (currentId && currentId !== conversationId) {
            this.websocketService.leaveConversation(currentId);
        }

        // Définir la nouvelle conversation
        this._activeConversationId.set(conversationId);
        this._messages.set([]);

        // Rejoindre la nouvelle conversation
        this.websocketService.joinConversation(conversationId);

        // Charger les messages
        this.loadMessages(conversationId);

        // Marquer comme lu
        this.websocketService.markAsRead(conversationId);
        this.chatService.markAsRead(conversationId).subscribe();
    }

    /**
     * Envoyer un message
     */
    sendMessage(conversationId: number, contenu: string): void {
        this.websocketService.sendMessage({ conversationId, contenu });
    }

    /**
     * Ajouter un message localement
     */
    addMessage(message: Message): void {
        const current = this._messages();
        this._messages.set([...current, message]);
    }

    /**
     * Mettre à jour une conversation
     */
    updateConversation(conversation: Conversation): void {
        const conversations = this._conversations();
        const index = conversations.findIndex((c) => c.id === conversation.id);

        if (index !== -1) {
            const updated = [...conversations];
            updated[index] = { ...updated[index], ...conversation };
            this._conversations.set(updated);
        } else {
            this._conversations.set([conversation, ...conversations]);
        }
    }

    /**
     * Indiquer qu'on est en train de taper
     */
    sendTyping(conversationId: number, isTyping: boolean): void {
        this.websocketService.sendTyping(conversationId, isTyping);
    }

    /**
     * Charger le nombre de messages non lus
     */
    async loadUnreadCount(): Promise<void> {
        try {
            const response = await this.chatService.getUnreadCount().toPromise();
            if (response) {
                this._unreadCount.set(response.count);
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    }

    refreshOnReconnect(): void {
        console.log('♻️ Refresh on reconnect');

        // Recharger les conversations
        this.loadConversations();

        // Si conversation active, recharger les messages
        const activeConv = this.activeConversation();
        if (activeConv) {
            this.loadMessages(activeConv.id);
        }
    }

    /**
     * Configuration des listeners WebSocket
     */
    private setupWebSocketListeners(): void {
        // Nouveau message reçu
        this.websocketService.onMessageReceived().subscribe((event) => {
            console.log('Message received:', event);

            if (event.conversationId === this._activeConversationId()) {
                this.addMessage(event.message);
                this.websocketService.markAsRead(event.conversationId);
            } else {
                this._unreadCount.update((count) => count + 1);
            }

            this.loadConversations();
        });

        // Message envoyé confirmé
        this.websocketService.onMessageSent().subscribe((event) => {
            console.log('Message sent:', event);
            if (event.message.conversationId === this._activeConversationId()) {
                const messages = this._messages();
                if (!messages.find((m) => m.id === event.message.id)) {
                    this.addMessage(event.message);
                }
            }
        });

        // Quelqu'un est en train de taper
        this.websocketService.onUserTyping().subscribe((event) => {
            console.log('User typing:', event);
            const typingMap = new Map(this._typingUsers());

            if (event.isTyping) {
                typingMap.set(event.userId, event.userInfo);
            } else {
                typingMap.delete(event.userId);
            }

            this._typingUsers.set(typingMap);

            if (event.isTyping) {
                setTimeout(() => {
                    const currentMap = new Map(this._typingUsers());
                    currentMap.delete(event.userId);
                    this._typingUsers.set(currentMap);
                }, 3000);
            }
        });

        // Messages lus
        this.websocketService.onMessagesRead().subscribe((event) => {
            console.log('Messages read:', event);
            if (event.conversationId === this._activeConversationId()) {
                const messages = this._messages().map((m) => ({
                    ...m,
                    isRead: true,
                }));
                this._messages.set(messages);
            }
        });

        // Notification de nouveau message
        this.websocketService.onNewMessageNotification().subscribe((event) => {
            console.log('New message notification:', event);
            this._unreadCount.update((count) => count + 1);
            this.loadConversations();
        });

        // Erreurs
        this.websocketService.onError().subscribe((error) => {
            console.error('WebSocket error:', error);
        });
    }

    /**
     * Nettoyer au destroy
     */
    ngOnDestroy(): void {
        const currentId = this._activeConversationId();
        if (currentId) {
            this.websocketService.leaveConversation(currentId);
        }
    }
}