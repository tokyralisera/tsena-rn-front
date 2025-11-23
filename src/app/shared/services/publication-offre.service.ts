import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';


export enum PublicationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE'
}

export enum PublicationType {
  OFFRE = 'OFFRE'
}

export enum OffreStatut {
  VENDU = 'VENDU',
  NON_VENDU = 'NON_VENDU'
}

export interface Auteur {
  id: number;
  nomUtilisateur: string;
  prenomUtilisateur: string;
  telephone: string;
}

export interface Categorie {
  id: number;
  libelle: string;
  description?: string;
}

export interface Produit {
  id: number;
  libelle: string;
  prixUnitaire: number;
  quantite: number;
  uniteMesure: string;
  categorie: Categorie;
}

export interface Offre {
  id: number;
  statut: OffreStatut;
  produits: Produit[];
}

export interface PublicationImage {
  id: number;
  url: string;
}

export interface Pays {
  id: number;
  nom: string;
  code: string;
}

export interface Ville {
  id: number;
  nom: string;
  codePostal?: string;
  pays: Pays;
}

export interface Publication {
  id: number;
  titre: string;
  description: string;
  type: PublicationType;
  statut: PublicationStatut;
  createdAt: string;
  updatedAt: string;
  auteur: Auteur;
  offre: Offre;
  images: PublicationImage[];
  ville: Ville;
}

export interface PaginatedResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Statistics {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    totalPublications: number;
    publications: {
      enAttente: number;
      valide: number;
      rejete: number;
    };
    offres: {
      vendu: number;
      nonVendu: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PublicationOffreService {
  private apiUrl = `${environment.apiUrl}/publications/offres`;

  constructor(private http: HttpClient) { }

  //? Admin - Récupérer les publications pour validation
  getPublicationsForAdmin(
    page: number = 1,
    limit: number = 10,
    statut?: PublicationStatut
  ): Observable<PaginatedResponse<Publication>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (statut) {
      params = params.set('statut', statut);
    }

    return this.http.get<PaginatedResponse<Publication>>(`${this.apiUrl}/admin`, { params });
  }

  //? Admin - Statistiques
  getStatistics(): Observable<Statistics> {
    return this.http.get<Statistics>(`${this.apiUrl}/admin/statistics`);
  }

  //? Admin - Valider ou rejeter une publication
  updateStatut(id: number, statut: PublicationStatut): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/statut`, { statut });
  }

  //? Récupérer une publication par ID
  getPublicationById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  //? Calculer le total d'un produit
  calculateProductTotal(produit: Produit): number {
    return produit.prixUnitaire * produit.quantite;
  }

  //? Calculer le total de l'offre
  calculateOffreTotal(produits: Produit[]): number {
    return produits.reduce((total, produit) => {
      return total + this.calculateProductTotal(produit);
    }, 0);
  }

  //? Recherche avancée de publications
  searchPublications(
    page: number = 1,
    limit: number = 10,
    searchTerm?: string,
    categorieId?: number,
    villeId?: number,
    offreStatut?: string,
    sortBy: 'createdAt' | 'updatedAt' | 'titre' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Observable<PaginatedResponse<Publication>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);
    if (searchTerm && searchTerm.trim()) {
      params = params.set('search', searchTerm.trim());
    }
    if (categorieId) {
      params = params.set('categorieId', categorieId.toString());
    }
    if (villeId) {
      params = params.set('villeId', villeId.toString());
    }
    if (offreStatut) {
      params = params.set('offreStatut', offreStatut);
    }
    return this.http.get<PaginatedResponse<Publication>>(`${this.apiUrl}/search`, { params });
  }
}