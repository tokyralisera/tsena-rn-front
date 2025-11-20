import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    Conversation,
    ConversationListResponse,
    Message,
    MessagesListResponse,
    Publication,
} from '../models/chat.models';
import { environment } from '../../../../../environment/environment';


@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/chat`;

    /**
     * Créer ou récupérer une conversation
     */
    createConversation(publicationId: number): Observable<Conversation> {
        return this.http.post<Conversation>(`${this.apiUrl}/conversations`, {
            publicationId,
        });
    }

    /**
     * Récupérer toutes les conversations de l'utilisateur
     */
    getConversations(page = 1, limit = 20): Observable<ConversationListResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        return this.http.get<ConversationListResponse>(
            `${this.apiUrl}/conversations`,
            { params }
        );
    }

    /**
     * Récupérer une conversation spécifique
     */
    getConversation(conversationId: number): Observable<Conversation> {
        return this.http.get<Conversation>(
            `${this.apiUrl}/conversations/${conversationId}`
        );
    }

    /**
     * Récupérer les messages d'une conversation
     */
    getMessages(
        conversationId: number,
        page = 1,
        limit = 50
    ): Observable<MessagesListResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        return this.http.get<MessagesListResponse>(
            `${this.apiUrl}/conversations/${conversationId}/messages`,
            { params }
        );
    }

    /**
     * Récupérer la publication liée à une conversation
     */
    getConversationPublication(conversationId: number): Observable<Publication> {
        return this.http.get<Publication>(
            `${this.apiUrl}/conversations/${conversationId}/publication`
        );
    }

    /**
     * Envoyer un message (REST, utilisé comme fallback)
     */
    sendMessage(conversationId: number, contenu: string): Observable<Message> {
        return this.http.post<Message>(`${this.apiUrl}/messages`, {
            conversationId,
            contenu,
        });
    }

    /**
     * Marquer une conversation comme lue
     */
    markAsRead(conversationId: number): Observable<Conversation> {
        return this.http.patch<Conversation>(
            `${this.apiUrl}/conversations/${conversationId}/read`,
            {}
        );
    }

    /**
     * Obtenir le nombre total de messages non lus
     */
    getUnreadCount(): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
    }
}