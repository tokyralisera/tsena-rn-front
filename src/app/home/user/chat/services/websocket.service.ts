// src/app/features/chat/services/websocket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, fromEvent } from 'rxjs';

import {
    MessageReceivedEvent,
    UserTypingEvent,
    SocketAuthData,
    SocketMessageData,
} from '../models/chat.models';

@Injectable({
    providedIn: 'root',
})
export class WebsocketService {
    private socket: Socket | null = null;
    private connected$ = new Subject<boolean>();
    private authenticated$ = new Subject<boolean>();

    constructor() { }

    /**
     * Se connecter au serveur WebSocket
     */
    connect(token: string): void {
        if (this.socket?.connected) {
            console.log('Already connected');
            return;
        }

        const socketUrl = 'http://localhost:3000';

        console.log('🔌 Connecting to WebSocket:', `${socketUrl}/chat`);
        console.log('🔑 With token:', token.substring(0, 20) + '...');

        this.socket = io(`${socketUrl}/chat`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 20000,
        });

        this.setupSocketListeners();
    }

    /**
     * Se déconnecter du serveur WebSocket
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected$.next(false);
        }
    }

    /**
     * Vérifier si connecté
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Observable de l'état de connexion
     */
    onConnectionStatus(): Observable<boolean> {
        return this.connected$.asObservable();
    }

    /**
     * Observable de l'état d'authentification
     */
    onAuthenticationStatus(): Observable<boolean> {
        return this.authenticated$.asObservable();
    }

    /**
     * S'authentifier (si nécessaire)
     */
    authenticate(data: SocketAuthData): void {
        if (!this.socket) return;
        this.socket.emit('authenticate', data);
    }

    /**
     * Rejoindre une conversation
     */
    joinConversation(conversationId: number): void {
        if (!this.socket) return;
        this.socket.emit('join_conversation', { conversationId });
    }

    /**
     * Quitter une conversation
     */
    leaveConversation(conversationId: number): void {
        if (!this.socket) return;
        this.socket.emit('leave_conversation', { conversationId });
    }

    /**
     * Envoyer un message
     */
    sendMessage(data: SocketMessageData): void {
        if (!this.socket) return;
        this.socket.emit('send_message', data);
    }

    /**
     * Indiquer qu'on est en train de taper
     */
    sendTyping(conversationId: number, isTyping: boolean): void {
        if (!this.socket) return;
        this.socket.emit('typing', { conversationId, isTyping });
    }

    /**
     * Marquer comme lu
     */
    markAsRead(conversationId: number): void {
        if (!this.socket) return;
        this.socket.emit('mark_as_read', { conversationId });
    }

    /**
     * Écouter les nouveaux messages
     */
    onMessageReceived(): Observable<MessageReceivedEvent> {
        if (!this.socket) throw new Error('Socket not connected');
        return fromEvent(this.socket, 'message_received');
    }

    /**
     * Écouter la confirmation d'envoi
     */
    onMessageSent(): Observable<any> {
        if (!this.socket) throw new Error('Socket not connected');
        return fromEvent(this.socket, 'message_sent');
    }

    /**
     * Écouter quand quelqu'un tape
     */
    onUserTyping(): Observable<UserTypingEvent> {
        if (!this.socket) throw new Error('Socket not connected');
        return fromEvent(this.socket, 'user_typing');
    }

    /**
     * Écouter quand les messages sont lus
     */
    onMessagesRead(): Observable<any> {
        if (!this.socket) throw new Error('Socket not connected');
        return fromEvent(this.socket, 'messages_read');
    }

    /**
     * Écouter les notifications de nouveaux messages
     */
    onNewMessageNotification(): Observable<any> {
        if (!this.socket) throw new Error('Socket not connected');
        return fromEvent(this.socket, 'new_message_notification');
    }

    /**
     * Écouter les erreurs
     */
    onError(): Observable<any> {
        if (!this.socket) throw new Error('Socket not connected');
        return fromEvent(this.socket, 'error');
    }

    /**
     * Configuration des listeners de base
     */
    private setupSocketListeners(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected:', this.socket?.id);
            this.connected$.next(true);
        });

        this.socket.on('connected', (data: any) => {
            console.log('✅ Connected event received:', data);
        });

        this.socket.on('authenticated', (data: any) => {
            console.log('✅ Authenticated:', data);
            this.authenticated$.next(true);
        });

        this.socket.on('disconnect', (reason: string) => {
            console.log('⚠️ WebSocket disconnected:', reason);
            this.connected$.next(false);

            if (reason === 'io server disconnect') {
                console.log('🔄 Reconnecting...');
                setTimeout(() => {
                    this.socket?.connect();
                }, 1000);
            }
        });

        this.socket.on('connect_error', (error: Error) => {
            console.error('❌ Connection error:', error);
            this.connected$.next(false);
        });

        this.socket.on('joined_conversation', (data: any) => {
            console.log('✅ Joined conversation:', data);
        });

        this.socket.on('left_conversation', (data: any) => {
            console.log('👋 Left conversation:', data);
        });

    }
}