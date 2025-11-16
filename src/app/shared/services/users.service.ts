import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UpdateProfileRequest, UpdateProfileResponse, UserProfile } from "../interfaces/profil.interface";
import { Utilisateur } from "../interfaces/utilisateur.interface";
import { environment } from "../../../environment/environment";


export interface UsersListResponse {
  success: boolean;
  data: Utilisateur[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateUserRoleRequest {
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

export interface UpdateUserRoleResponse {
  success: boolean;
  message: string;
  data: Utilisateur;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

export interface UsersStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    usersByRole: { role: string; count: number }[];
    activeUsers: number;
    inactiveUsers: number;
    recentUsers: Utilisateur[];
  };
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  // Méthodes existantes
  getProfile(): Observable<{ success: boolean, data: UserProfile }> {
    return this.http.get<{ success: boolean, data: UserProfile }>(`${this.apiUrl}/profile`);
  }

  updateProfile(profileData: UpdateProfileRequest): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(`${this.apiUrl}/profile`, profileData);
  }

  // Nouvelles méthodes pour la gestion des utilisateurs (SUPERADMIN)
  
  /**
   * Récupérer tous les utilisateurs (avec pagination)
   */
  getAllUsers(page: number = 1, limit: number = 10, search?: string, role?: string): Observable<UsersListResponse> {
    let params: any = { page: page.toString(), limit: limit.toString() };
    if (search) params.search = search;
    if (role) params.role = role;
    
    return this.http.get<UsersListResponse>(`${this.apiUrl}`, { params });
  }

  /**
   * Récupérer un utilisateur par ID
   */
  getUserById(id: number): Observable<{ success: boolean, data: Utilisateur }> {
    return this.http.get<{ success: boolean, data: Utilisateur }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Changer le rôle d'un utilisateur
   */
  updateUserRole(userId: number, roleData: UpdateUserRoleRequest): Observable<UpdateUserRoleResponse> {
    return this.http.patch<UpdateUserRoleResponse>(`${this.apiUrl}/${userId}/role`, roleData);
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(userId: number): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  getUsersStats(): Observable<UsersStatsResponse> {
    return this.http.get<UsersStatsResponse>(`${this.apiUrl}/stats`);
  }
}