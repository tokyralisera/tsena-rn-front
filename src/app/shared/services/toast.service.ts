import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  /**
   * Afficher un toast de succès
   */
  success(message: string, duration: number = 5000): void {
    this.show('success', message, duration);
  }

  /**
   * Afficher un toast d'erreur
   */
  error(message: string, duration: number = 5000): void {
    this.show('error', message, duration);
  }

  /**
   * Afficher un toast d'avertissement
   */
  warning(message: string, duration: number = 5000): void {
    this.show('warning', message, duration);
  }

  /**
   * Afficher un toast d'information
   */
  info(message: string, duration: number = 5000): void {
    this.show('info', message, duration);
  }

  /**
   * Afficher un toast
   */
  private show(type: Toast['type'], message: string, duration: number): void {
    const id = this.generateId();
    const toast: Toast = { id, type, message, duration };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto-suppression après la durée spécifiée
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  /**
   * Supprimer un toast
   */
  remove(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter((toast) => toast.id !== id));
  }

  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}