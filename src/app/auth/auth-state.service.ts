import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Utilisateur } from '../shared/interfaces/utilisateur.interface';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private currentUserSubject = new BehaviorSubject<Utilisateur | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  setCurrentUser(user: Utilisateur) {
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): Utilisateur | null {
    return this.currentUserSubject.value;
  }

  clearCurrentUser() {
    this.currentUserSubject.next(null);
  }
}
