import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';


export interface Pays {
  id: number;
  nom: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaysDto {
  nom: string;
  code: string;
}

export interface UpdatePaysDto {
  nom?: string;
  code?: string;
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
export class PaysService {
  private apiUrl = `${environment.apiUrl}/pays`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 1, limit: number = 10, search?: string): Observable<PaginatedResponse<Pays>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<Pays>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Pays> {
    return this.http.get<Pays>(`${this.apiUrl}/${id}`);
  }

  create(data: CreatePaysDto): Observable<Pays> {
    return this.http.post<Pays>(this.apiUrl, data);
  }

  update(id: number, data: UpdatePaysDto): Observable<Pays> {
    return this.http.patch<Pays>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}