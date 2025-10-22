import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';


@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="notification$ | async as notification" 
         class="toast toast-top toast-end z-50">
      <div [class]="getAlertClasses(notification.type)" class="flex items-center">
        <span [innerHTML]="getNotificationIcon(notification.type)"></span>
        <div class="ml-2">
          <h3 class="font-bold">{{ notification.title }}</h3>
          <div class="text-xs">{{ notification.message }}</div>
        </div>
        <button class="btn btn-sm btn-ghost ml-auto" (click)="clearNotification()">
          ✕
        </button>
      </div>
    </div>
  `
})
export class NotificationComponent {
  notification$;
  
  constructor(private notificationService: NotificationService) {
    this.notification$ = this.notificationService.notification$;
  }

  clearNotification() {
    this.notificationService.clear();
  }

  getAlertClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'alert alert-success';
      case 'error':
        return 'alert alert-error';
      case 'warning':
        return 'alert alert-warning';
      case 'info':
        return 'alert alert-info';
      default:
        return 'alert';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  }
}