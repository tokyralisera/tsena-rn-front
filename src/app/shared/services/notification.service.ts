import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  private defaultDuration = 5000; // 5 secondes

  constructor() {}


  success(titleOrMessage: string, message?: string, duration?: number): void {
    if (message === undefined) {
      this.show('success', 'Succès', titleOrMessage, duration);
    } else {
      this.show('success', titleOrMessage, message, duration);
    }
  }


  error(titleOrMessage: string, message?: string, duration?: number): void {
    if (message === undefined) {
      this.show('error', 'Erreur', titleOrMessage, duration);
    } else {
      this.show('error', titleOrMessage, message, duration);
    }
  }


  warning(titleOrMessage: string, message?: string, duration?: number): void {
    if (message === undefined) {
      this.show('warning', 'Attention', titleOrMessage, duration);
    } else {
      this.show('warning', titleOrMessage, message, duration);
    }
  }


  info(titleOrMessage: string, message?: string, duration?: number): void {
    if (message === undefined) {
      this.show('info', 'Information', titleOrMessage, duration);
    } else {
      this.show('info', titleOrMessage, message, duration);
    }
  }


  show(
    type: NotificationType,
    title: string,
    message: string,
    duration: number = this.defaultDuration,
    dismissible: boolean = true
  ): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      duration,
      dismissible
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    //? Auto-dismiss après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, duration);
    }
  }


  dismiss(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }


  clear(): void {
    this.notificationsSubject.next([]);
  }


  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}