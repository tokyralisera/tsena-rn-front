import { Injectable } from "@angular/core";
import { environment } from "../../../environment/environment";
import { HttpClient } from "@angular/common/http";
import { map, Observable } from "rxjs";

export interface Categorie {
  id: number;
  nom: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    produits: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface CategorieResponse {
    success : boolean;
    statusCode : number;
    message : string;
    data: Categorie | Categorie[]
}

@Injectable({
  providedIn: 'root',
})
export class CategorieService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Categorie[]> {
    return this.http.get<ApiResponse<Categorie[]>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getById(id: number): Observable<CategorieResponse> {
    return this.http.get<CategorieResponse>(`${this.apiUrl}/${id}`);
  }

  create(nom: string): Observable<CategorieResponse> {
    return this.http.post<CategorieResponse>(`${this.apiUrl}`, { nom });
  }

  update(id: number, nom: string): Observable<CategorieResponse> {
    return this.http.put<CategorieResponse>(`${this.apiUrl}/${id}`, { nom });
  }

  delete(id: number): Observable<CategorieResponse> {
    return this.http.delete<CategorieResponse>(`${this.apiUrl}/${id}`);
  }
}