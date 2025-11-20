export interface UserInfo {
    id: number;
    nomUtilisateur: string;
    prenomUtilisateur: string;
}

export interface Conversation {
    id: number;
    titre: string;
    publicationId: number;
    initiatorId: number;
    recipientId: number;
    initiator: UserInfo;
    recipient: UserInfo;
    lastReadByInitiator?: Date;
    lastReadByRecipient?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    messages?: Message[];
    _count?: {
        messages: number;
    };
    unreadCount?: number;
}

export interface Message {
    id: number;
    contenu: string;
    conversationId: number;
    senderId: number;
    sender: UserInfo;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Publication {
    id: number;
    titre: string;
    description: string;
    type: 'OFFRE' | 'DEMANDE';
    statut: string;
    images?: PublicationImage[];
    ville?: any;
    offre?: any;
    demande?: any;
}

export interface PublicationImage {
    id: number;
    url: string;
}

// WebSocket Events
export interface SocketAuthData {
    userId: number;
    userInfo: UserInfo;
}

export interface SocketMessageData {
    conversationId: number;
    contenu: string;
}

export interface SocketTypingData {
    conversationId: number;
    isTyping: boolean;
}

export interface MessageReceivedEvent {
    message: Message;
    conversationId: number;
}

export interface UserTypingEvent {
    userId: number;
    userInfo: UserInfo;
    conversationId: number;
    isTyping: boolean;
}

export interface ConversationListResponse {
    data: Conversation[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface MessagesListResponse {
    data: Message[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}