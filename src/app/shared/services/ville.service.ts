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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class VilleService {
  private apiUrl = `${environment.apiUrl}/villes`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 1, limit: number = 10, search?: string, paysId?: number): Observable<PaginatedResponse<Ville>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    if (paysId) {
      params = params.set('paysId', paysId.toString());
    }

    return this.http.get<PaginatedResponse<Ville>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Ville> {
    return this.http.get<Ville>(`${this.apiUrl}/${id}`);
  }

  getByPays(paysId: number): Observable<Ville[]> {
    return this.http.get<Ville[]>(`${this.apiUrl}/pays/${paysId}`);
  }

  create(data: CreateVilleDto): Observable<Ville> {
    return this.http.post<Ville>(this.apiUrl, data);
  }

  update(id: number, data: UpdateVilleDto): Observable<Ville> {
    return this.http.patch<Ville>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}