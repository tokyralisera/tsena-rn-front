import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  Publication,
  PublicationStatut,
  PublicationOffreService,
  Produit,
} from '../../../shared/services/publication-offre.service';
import {
  Categorie,
  CategorieService,
} from '../../../shared/services/categorie.service';
import { Pays, PaysService } from '../../../shared/services/pays.service';
import { Ville, VilleService } from '../../../shared/services/ville.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { environment } from '../../../../environment/environment';

export enum UniteMesure {
  PIECE = 'PIECE',
  TONNE = 'TONNE',
  KILOGRAMME = 'KILOGRAMME',
  LITRE = 'LITRE',
  KILOMETRE = 'KILOMETRE',
  HECTARE = 'HECTARE',
}

interface ImagePreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-offres-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './offre.component.html',
  styleUrl: './offre.component.scss',
})
export class OffresUserComponent implements OnInit {
  publications: Publication[] = [];
  myPublications: Publication[] = [];
  categories: Categorie[] = [];
  pays: Pays[] = [];
  villes: Ville[] = [];

  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  showMyOffersModal = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;

  selectedPublication: Publication | null = null;
  offreForm: FormGroup;
  imagePreviews: ImagePreview[] = [];
  maxImages = 5;

  uniteMesureOptions = Object.values(UniteMesure);
  PublicationStatut = PublicationStatut;

  constructor(
    private publicationService: PublicationOffreService,
    private categorieService: CategorieService,
    private paysService: PaysService,
    private villeService: VilleService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.offreForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      paysId: [null, Validators.required],
      villeId: [null, Validators.required],
      produits: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadPublications();
    this.loadCategories();
    this.loadPays();
  }

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  /**
   * Charge les publications publiques (VALIDÉES)
   */
  loadPublications(): void {
    this.loading = true;
    this.http
      .get<any>(`${environment.apiUrl}/publications/offres`, {
        params: {
          page: this.currentPage.toString(),
          limit: this.itemsPerPage.toString(),
        },
      })
      .subscribe({
        next: (response: any) => {
          this.publications = response.data;
          this.totalItems = response.meta.total;
          this.totalPages = response.meta.totalPages;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des offres', error);
          this.loading = false;
          this.notificationService.error('Erreur lors du chargement des offres');
        },
      });
  }

  /**
   * Charge MES publications (tous statuts)
   */
  loadMyPublications(): void {
    this.loading = true;
    this.http
      .get<any>(`${environment.apiUrl}/publications/offres/me`)
      .subscribe({
        next: (response: any) => {
          this.myPublications = response.data;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Erreur', error);
          this.loading = false;
          this.notificationService.error('Erreur lors du chargement de vos offres');
        },
      });
  }

  /**
   * Charge les catégories
   */
  loadCategories(): void {
    this.categorieService.getAll().subscribe({
      next: (categories: Categorie[]) => {
        this.categories = categories;
      },
      error: (error: any) => {
        console.error('Erreur', error);
        this.notificationService.error('Erreur lors du chargement des catégories');
      },
    });
  }

  /**
   * Charge les pays
   */
  loadPays(): void {
    this.paysService.getAll(1, 1000).subscribe({
      next: (response: any) => {
        this.pays = response.data;
      },
      error: (error: any) => {
        console.error('Erreur', error);
        this.notificationService.error('Erreur lors du chargement des pays');
      },
    });
  }

  /**
   * Charge les villes quand un pays est sélectionné
   */
  onPaysChange(paysId: number): void {
    console.log('🔍 Pays sélectionné:', paysId);
    
    this.offreForm.patchValue({ villeId: null });
    this.villes = [];
    
    if (paysId) {
      console.log('📡 Appel API pour charger les villes du pays:', paysId);
      
      this.villeService.getAll(paysId).subscribe({
        next: (response: any) => {
          console.log('✅ Réponse API villes:', response);
          console.log('📦 Villes reçues:', response.data);
          this.villes = response.data;
          
          if (this.villes.length === 0) {
            this.notificationService.warning('Aucune ville trouvée pour ce pays');
          }
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des villes:', error);
          this.notificationService.error('Erreur lors du chargement des villes');
        },
      });
    }
  }

  // ==========================================
  // GESTION DU FORMARRAY DES PRODUITS
  // ==========================================

  get produits(): FormArray {
    return this.offreForm.get('produits') as FormArray;
  }

  createProduitForm(): FormGroup {
    return this.fb.group({
      libelle: ['', Validators.required],
      categorieId: [null, Validators.required],
      quantite: [1, [Validators.required, Validators.min(0.01)]],
      uniteMesure: [UniteMesure.PIECE, Validators.required],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addProduit(): void {
    this.produits.push(this.createProduitForm());
  }

  removeProduit(index: number): void {
    this.produits.removeAt(index);
  }

  calculateProduitTotal(index: number): number {
    const produit = this.produits.at(index).value;
    return produit.quantite * produit.prixUnitaire;
  }

  calculateOffreTotal(): number {
    return this.produits.controls.reduce((total, control) => {
      const produit = control.value;
      return total + produit.quantite * produit.prixUnitaire;
    }, 0);
  }

  // ==========================================
  // GESTION DES IMAGES
  // ==========================================

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;

    if (this.imagePreviews.length + files.length > this.maxImages) {
      this.notificationService.warning(`Maximum ${this.maxImages} images autorisées`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        this.notificationService.warning('Seules les images sont autorisées');
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push({
          file: file,
          url: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.imagePreviews.splice(index, 1);
  }

  // ==========================================
  // GESTION DES MODALS
  // ==========================================

  openCreateModal(): void {
    this.resetForm();
    this.addProduit(); // Ajouter au moins un produit par défaut
    this.showCreateModal = true;
  }

  openMyOffersModal(): void {
    this.loadMyPublications();
    this.showMyOffersModal = true;
  }

  openEditModal(publication: Publication): void {
    this.selectedPublication = publication;
    this.resetForm();

    // Pré-remplir le formulaire
    this.offreForm.patchValue({
      titre: publication.titre,
      description: publication.description,
      paysId: publication.ville.pays.id,
      villeId: publication.ville.id,
    });

    // Charger les villes du pays
    this.onPaysChange(publication.ville.pays.id);

    // Ajouter les produits
    publication.offre.produits.forEach((produit: Produit) => {
      const produitForm = this.createProduitForm();
      produitForm.patchValue({
        libelle: produit.libelle,
        categorieId: produit.categorie.id,
        quantite: produit.quantite,
        uniteMesure: produit.uniteMesure,
        prixUnitaire: produit.prixUnitaire,
      });
      this.produits.push(produitForm);
    });

    this.showEditModal = true;
    this.showMyOffersModal = false;
  }

  openDeleteModal(publication: Publication): void {
    this.selectedPublication = publication;
    this.showDeleteModal = true;
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showMyOffersModal = false;
    this.selectedPublication = null;
    this.resetForm();
  }

  resetForm(): void {
    this.offreForm.reset();
    this.produits.clear();
    this.imagePreviews = [];
    this.villes = [];
  }

  // ==========================================
  // SOUMISSION DU FORMULAIRE
  // ==========================================

  onSubmit(): void {
    if (this.offreForm.invalid) {
      this.offreForm.markAllAsTouched();
      this.notificationService.warning('Veuillez remplir tous les champs requis');
      return;
    }

    if (this.produits.length === 0) {
      this.notificationService.warning('Ajoutez au moins un produit');
      return;
    }

    if (!this.showEditModal && this.imagePreviews.length === 0) {
      this.notificationService.warning('Ajoutez au moins une image');
      return;
    }

    const formData = new FormData();
    formData.append('titre', this.offreForm.value.titre);
    formData.append('description', this.offreForm.value.description);
    formData.append('villeId', this.offreForm.value.villeId);
    formData.append('produits', JSON.stringify(this.offreForm.value.produits));

    this.imagePreviews.forEach((preview) => {
      formData.append('files', preview.file);
    });

    this.loading = true;

    const request =
      this.showEditModal && this.selectedPublication
        ? this.http.put(
            `${environment.apiUrl}/publications/offres/${this.selectedPublication.id}`,
            formData
          )
        : this.http.post(`${environment.apiUrl}/publications/offres`, formData);

    request.subscribe({
      next: () => {
        this.notificationService.success(
          this.showEditModal
            ? 'Offre modifiée avec succès'
            : 'Offre créée avec succès'
        );
        this.closeAllModals();
        this.loadPublications();
      },
      error: (error: any) => {
        console.error('Erreur', error);
        this.loading = false;
        this.notificationService.error('Erreur lors de la soumission');
      },
    });
  }

  // ==========================================
  // MARQUER COMME VENDU
  // ==========================================

  markAsSold(publication: Publication): void {
    this.loading = true;
    this.http
      .patch(
        `${environment.apiUrl}/publications/offres/${publication.id}/offre-statut`,
        {
          statut: 'VENDU',
        }
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Offre marquée comme vendue');
          this.loadMyPublications();
        },
        error: (error: any) => {
          console.error('Erreur', error);
          this.loading = false;
          this.notificationService.error('Erreur lors de la mise à jour');
        },
      });
  }

  // ==========================================
  // SUPPRESSION
  // ==========================================

  confirmDelete(): void {
    if (!this.selectedPublication) return;

    this.loading = true;
    this.http
      .delete(
        `${environment.apiUrl}/publications/offres/${this.selectedPublication.id}`
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Offre supprimée avec succès');
          this.closeAllModals();
          this.loadPublications();
          this.loadMyPublications();
        },
        error: (error: any) => {
          console.error('Erreur', error);
          this.loading = false;
          this.notificationService.error('Erreur lors de la suppression');
        },
      });
  }

  // ==========================================
  // HELPERS / UTILITAIRES
  // ==========================================

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0,
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getAuteurFullName(publication: Publication): string {
    return `${publication.auteur.prenomUtilisateur} ${publication.auteur.nomUtilisateur}`;
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'badge-warning';
      case 'VALIDE':
        return 'badge-success';
      case 'REJETE':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  getOffreStatutBadgeClass(statut: string): string {
    return statut === 'VENDU' ? 'badge-error' : 'badge-success';
  }

  /**
   * Calcule le total d'une offre à partir de ses produits
   */
  calculatePublicationTotal(produits: Produit[]): number {
    return produits.reduce((sum, p) => sum + (p.prixUnitaire * p.quantite), 0);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPublications();
    }
  }
}