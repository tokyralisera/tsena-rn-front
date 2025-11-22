import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/chat`;

  /**
   * Créer ou récupérer une conversation à partir d'une publication
   * Si une conversation existe déjà, elle sera retournée
   */
  createConversation(publicationId: number): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/conversations`, {
      publicationId,
    });
  }

  /**
   * 🆕 Initier une conversation avec contexte et message automatique
   * Utilisé quand un utilisateur clique sur "L'offre m'intéresse"
   */
  initiateConversationWithContext(
    publicationId: number,
    publicationTitre: string,
    publicationType: 'OFFRE' | 'DEMANDE'
  ): Observable<{ conversation: Conversation; message?: Message }> {
    const messageTemplate = publicationType === 'OFFRE'
      ? `Bonjour, je suis intéressé(e) par votre offre "${publicationTitre}". Pouvons-nous discuter des détails ?`
      : `Bonjour, j'ai peut-être ce que vous cherchez concernant "${publicationTitre}". Je souhaiterais en discuter avec vous.`;

    return this.http.post<{ conversation: Conversation; message?: Message }>(
      `${this.apiUrl}/conversations/initiate`,
      {
        publicationId,
        messageInitial: messageTemplate,
      }
    );
  }

  /**
   * Rediriger vers le chat avec une conversation active
   */
  navigateToConversation(conversationId: number): void {
    this.router.navigate(['/home/chat'], {
      queryParams: { conversation: conversationId },
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