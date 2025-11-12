import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface InfoPublicationAuthor {
  id: number;
  nomUtilisateur: string;
  prenomUtilisateur: string;
  role: string;
}

export interface InfoPublication {
  id: number;
  title: string;
  content: string;
  images: string[];
  authorId: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  author: InfoPublicationAuthor;
  isLikedByUser: boolean;
  likesCount: number;
}

export interface InfoPublicationResponse {
  publications: InfoPublication[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LikeToggleResponse {
  liked: boolean;
  message: string;
  likeCount: number;
}


@Injectable({
  providedIn: 'root',
})
export class InfoPublicationService {
  private apiUrl = `${environment.apiUrl}/info-publications`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les publications d'infos avec pagination
   */
  getAllInfoPublications(
    page: number = 1,
    limit: number = 10
  ): Observable<InfoPublicationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<InfoPublicationResponse>(this.apiUrl, { params });
  }

  /**
   * Récupérer une publication spécifique par ID
   */
  getInfoPublicationById(id: number): Observable<InfoPublication> {
    return this.http.get<InfoPublication>(`${this.apiUrl}/${id}`);
  }

  /**
   * Liker/Unliker une publication
   */
  toggleLike(id: number): Observable<LikeToggleResponse> {
    return this.http.post<LikeToggleResponse>(`${this.apiUrl}/${id}/like`, {});
  }

  /**
   * Créer une publication (Admin/SuperAdmin uniquement)
   */
  createInfoPublication(formData: FormData): Observable<InfoPublication> {
    return this.http.post<InfoPublication>(this.apiUrl, formData);
  }

  /**
   * Modifier une publication (Admin/SuperAdmin uniquement)
   */
  updateInfoPublication(
    id: number,
    formData: FormData
  ): Observable<InfoPublication> {
    return this.http.put<InfoPublication>(`${this.apiUrl}/${id}`, formData);
  }

  /**
   * Supprimer une publication (Admin/SuperAdmin uniquement)
   */
  deleteInfoPublication(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}