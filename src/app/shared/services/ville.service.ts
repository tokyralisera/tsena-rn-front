import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Ville {
  id: number;
  nom: string;
  codePostal: string | null;
  paysId: number;
  pays: {
    id: number;
    nom: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateVilleDto {
  nom: string;
  codePostal?: string;
  paysId: number;
}

export interface UpdateVilleDto {
  nom?: string;
  codePostal?: string;
  paysId?: number;
}

export interface VilleResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Ville[];
}

@Injectable({
  providedIn: 'root'
})
export class VilleService {
  private apiUrl = `${environment.apiUrl}/ville`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les villes avec filtre optionnel par pays
   * GET /ville?paysId=X
   */
  getAll(paysId?: number): Observable<VilleResponse> {
    let params = new HttpParams();
    
    if (paysId) {
      params = params.set('paysId', paysId.toString());
    }

    return this.http.get<VilleResponse>(this.apiUrl, { params });
  }

  /**
   * Récupère une ville par ID
   * GET /ville/:id
   */
  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère les villes d'un pays spécifique
   * GET /ville/pays/:paysId
   */
  getByPays(paysId: number): Observable<VilleResponse> {
    return this.http.get<VilleResponse>(`${this.apiUrl}/pays/${paysId}`);
  }

  /**
   * Crée une nouvelle ville
   * POST /ville
   */
  create(data: CreateVilleDto): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  /**
   * Met à jour une ville
   * PUT /ville/:id
   */
  update(id: number, data: UpdateVilleDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Supprime une ville
   * DELETE /ville/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}