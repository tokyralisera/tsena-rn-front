import { Injectable } from "@angular/core";
import { environment } from "../../../environment/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";

export interface Categorie {
  id: number;
  nom: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    produits: number;
  };
}


export interface CategorieResponse {
    success : boolean;
    statusCode : number;
    message : string;
    data: Categorie | Categorie[]
}

@Injectable({
    providedIn: 'root'
})
export class CategorieService {
    private apiUrl = `${environment.apiUrl}/categories`

    constructor(private http: HttpClient){}

    //? A voir demain car j'ai deja cette fonction dans les auth
    // private getHeaders(): HttpHeaders {
    //     const token = localStorage.getItem('access_token')
    //     return new HttpHeaders({
    //         'Content-Type': 'application/json',
    //         Authorization: 'Bearer ${token}'
    //     })
    // }

    getAll(): Observable<CategorieResponse>{
        return this.http.get<CategorieResponse>(this.apiUrl)
    }

    getById(id: number): Observable<CategorieResponse>{
        return this.http.get<CategorieResponse>(`${this.apiUrl}/${id}`)
    }

    create(nom: string): Observable<CategorieResponse>{
        return this.http.post<CategorieResponse>(
            `${this.apiUrl}`, {nom}
        )
    }

      update(id: number, nom: string): Observable<CategorieResponse> {
    return this.http.put<CategorieResponse>(
      `${this.apiUrl}/${id}`,
      { nom }
    );
  }

  delete(id: number): Observable<CategorieResponse> {
    return this.http.delete<CategorieResponse>(
      `${this.apiUrl}/${id}`
    );
  }
}