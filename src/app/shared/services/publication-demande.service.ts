import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';


// Enums
export enum StatutPublication {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
}

export enum StatutDemande {
  TROUVEE = 'TROUVEE',
  NON_TROUVEE = 'NON_TROUVEE',
  EXPIREE = 'EXPIREE',
}

export enum UniteMesure {
  PIECE = 'PIECE',
  TONNE = 'TONNE',
  KILOGRAMME = 'KILOGRAMME',
  LITRE = 'LITRE',
  KILOMETRE = 'KILOMETRE',
  HECTARE = 'HECTARE',
}

// Interfaces
export interface Categorie {
  id: number;
  nom: string;
}

export interface DemandeProduit {
  id: number;
  nom: string;
  quantite?: number;
  uniteMesure?: UniteMesure;
  categorie: Categorie;
}

export interface Demande {
  statutDemande: StatutDemande;
  deadline?: string;
  budgetMin?: number;
  budgetMax?: number;
  produits: DemandeProduit[];
}

export interface Ville {
  id: number;
  nom: string;
  pays: {
    id: number;
    nom: string;
    code: string;
  };
}

export interface Auteur {
  id: number;
  nomUtilisateur: string;
  prenomUtilisateur: string;
  telephone: string;
}

export interface PublicationImage {
  id: number;
  url: string;
}

export interface Publication {
  id: number;
  titre: string;
  description: string;
  type: 'DEMANDE';
  statut: StatutPublication;
  createdAt: string;
  updatedAt: string;
  auteur: Auteur;
  ville: Ville;
  demande: Demande;
  images: PublicationImage[];
}

export interface CreateDemandeProduitDto {
  nom: string;
  quantite?: number;
  uniteMesure?: UniteMesure;
  categorieId: number;
}

export interface CreateDemandeDto {
  titre: string;
  description: string;
  villeId: number;
  deadline?: string;
  budgetMin?: number;
  budgetMax?: number;
  produits: CreateDemandeProduitDto[];
  images?: File[];
}

export interface UpdateDemandeDto {
  titre?: string;
  description?: string;
  villeId?: number;
  deadline?: string;
  budgetMin?: number;
  budgetMax?: number;
  produits?: CreateDemandeProduitDto[];
  images?: File[];
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

@Injectable({
  providedIn: 'root',
})
export class DemandeService {
  private apiUrl = `${environment.apiUrl}/publications/demandes`;

  constructor(private http: HttpClient) { }

  /**
   * Récupérer toutes les demandes validées (PUBLIC)
   */
  getAllDemandes(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Publication>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Publication>>(this.apiUrl, { params });
  }

  /**
   * Récupérer mes demandes (USER)
   */
  getMyDemandes(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Publication>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Publication>>(`${this.apiUrl}/my-demandes`, { params });
  }

  /**
   * Récupérer une demande par ID
   */
  getDemandeById(id: number): Observable<{ success: boolean; data: Publication }> {
    return this.http.get<{ success: boolean; data: Publication }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer une demande
   */
  createDemande(dto: CreateDemandeDto): Observable<{ success: boolean; data: Publication }> {
    const formData = new FormData();

    formData.append('titre', dto.titre);
    formData.append('description', dto.description);
    formData.append('villeId', dto.villeId.toString());

    if (dto.deadline) {
      formData.append('deadline', dto.deadline);
    }

    if (dto.budgetMin !== undefined) {
      formData.append('budgetMin', dto.budgetMin.toString());
    }

    if (dto.budgetMax !== undefined) {
      formData.append('budgetMax', dto.budgetMax.toString());
    }

    // Format avec crochets pour les produits
    dto.produits.forEach((produit, index) => {
      formData.append(`produits[${index}][nom]`, produit.nom);
      formData.append(`produits[${index}][categorieId]`, produit.categorieId.toString());

      if (produit.quantite !== undefined) {
        formData.append(`produits[${index}][quantite]`, produit.quantite.toString());
      }

      if (produit.uniteMesure) {
        formData.append(`produits[${index}][uniteMesure]`, produit.uniteMesure);
      }
    });

    // Images optionnelles
    if (dto.images && dto.images.length > 0) {
      dto.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return this.http.post<{ success: boolean; data: Publication }>(this.apiUrl, formData);
  }

  /**
   * Modifier une demande
   */
  updateDemande(id: number, dto: UpdateDemandeDto): Observable<{ success: boolean; data: Publication }> {
    const formData = new FormData();

    if (dto.titre) formData.append('titre', dto.titre);
    if (dto.description) formData.append('description', dto.description);
    if (dto.villeId) formData.append('villeId', dto.villeId.toString());
    if (dto.deadline !== undefined) formData.append('deadline', dto.deadline || '');
    if (dto.budgetMin !== undefined) formData.append('budgetMin', dto.budgetMin.toString());
    if (dto.budgetMax !== undefined) formData.append('budgetMax', dto.budgetMax.toString());

    if (dto.produits && dto.produits.length > 0) {
      dto.produits.forEach((produit, index) => {
        formData.append(`produits[${index}][nom]`, produit.nom);
        formData.append(`produits[${index}][categorieId]`, produit.categorieId.toString());
        if (produit.quantite !== undefined) {
          formData.append(`produits[${index}][quantite]`, produit.quantite.toString());
        }
        if (produit.uniteMesure) {
          formData.append(`produits[${index}][uniteMesure]`, produit.uniteMesure);
        }
      });
    }

    if (dto.images && dto.images.length > 0) {
      dto.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return this.http.patch<{ success: boolean; data: Publication }>(`${this.apiUrl}/${id}`, formData);
  }

  /**
   * Changer le statut d'une demande
   */
  updateDemandeStatut(id: number, statut: StatutDemande): Observable<{ success: boolean; data: Publication }> {
    return this.http.patch<{ success: boolean; data: Publication }>(
      `${this.apiUrl}/${id}/demande-statut`,
      { statut }
    );
  }

  /**
   * Supprimer une demande
   */
  deleteDemande(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Recherche avec filtres
   */
  searchDemandes(filters: any): Observable<PaginatedResponse<Publication>> {
    let params = new HttpParams();

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    });

    return this.http.get<PaginatedResponse<Publication>>(`${this.apiUrl}/search`, { params });
  }

  /**
 * Modifier le statut de publication (ADMIN)
 */
  updateStatut(id: number, statut: 'VALIDE' | 'REJETE' | 'EN_ATTENTE'): Observable<{ success: boolean; data: Publication }> {
    return this.http.patch<{ success: boolean; data: Publication }>(
      `${this.apiUrl}/${id}/statut`,
      { statut }
    );
  }
}