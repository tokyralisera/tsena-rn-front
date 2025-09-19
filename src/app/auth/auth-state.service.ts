import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Utilisateur } from '../shared/interfaces/utilisateur.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private currentUserSubject = new BehaviorSubject<Utilisateur | null>(this.getUserFromStorage());
  currentUser = this.currentUserSubject.asObservable();

  private getUserFromStorage(): Utilisateur | null {
    const userStr = localStorage.getItem('user_data');
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user: Utilisateur | null) {
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): Utilisateur | null {
    return this.currentUserSubject.value;
  }
}
