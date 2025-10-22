import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  show(notification: Notification) {
    this.notificationSubject.next({
      ...notification,
      duration: notification.duration || 5000,
    });

    setTimeout(() => {
      this.clear();
    }, notification.duration || 5000);
  }

  clear() {
    this.notificationSubject.next(null);
  }

  success(message: string, title: string = 'Succès') {
    this.show({ type: 'success', message, title });
  }

  error(message: string, title: string = 'Erreur') {
    this.show({ type: 'error', message, title });
  }

  warning(message: string, title: string = 'Attention') {
    this.show({ type: 'warning', message, title });
  }

  info(message: string, title: string = 'Information') {
    this.show({ type: 'info', message, title });
  }
}
