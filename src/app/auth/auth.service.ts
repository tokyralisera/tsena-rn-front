import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest } from './login/interfaces/login.request';
import { LoginResponse } from './login/interfaces/login.response';
import { SignupRequest } from './signup/interfaces/signup.request';
import { SignupResponse } from './signup/interfaces/signup.response';
import { AuthStateService } from './auth-state.service';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStateService = inject(AuthStateService);

  private apiUrl = 'http://localhost:3000/auth';
  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasToken()
  );

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          this.setToken(response.access_token);
          this.setUser(response.user);
          this.isAuthenticatedSubject.next(true);
          this.redirectBasedOnRole(response.user.role);
          // Mise à jour de l'état utilisateur
          this.authStateService.setCurrentUser(response.user);
        })
      );
  }

  signup(credentials: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.apiUrl}/signup`, credentials);
  }

  private setUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('auth_token');
    this.isAuthenticatedSubject.next(false);
    // Réinitialiser l'état utilisateur
    this.authStateService.setCurrentUser(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string {
    const user = this.getUser();
    return user?.role || '';
  }

  private redirectBasedOnRole(role: string): void {
    const normalizedRole = role.trim().toUpperCase();

    const roleRoutes: { [key: string]: string } = {
      SUPERADMIN: '/home/superadmin',
      ADMIN: '/home/admin',
      USER: '/home/user',
    };

    const route = roleRoutes[normalizedRole];

    if (route) {
      this.router.navigate([route]);
    } else {
      this.router.navigate(['/error']);
    }
  }
}
