import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest } from './login/interfaces/login.request';
import { LoginResponse } from './login/interfaces/login.response';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient)
  private router = inject(Router)
  
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
        })
      );
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
    return user ? JSON.stringify(user) : null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }
}
