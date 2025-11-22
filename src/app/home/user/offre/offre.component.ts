import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
  FormsModule,
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

import { AuthStateService } from '../../../auth/auth-state.service';

import { environment } from '../../../../environment/environment';
import { ToastService } from '../../../shared/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ChatService } from '../chat/services/chat.service';

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
  imports: [CommonModule, ReactiveFormsModule, ToastComponent, FormsModule],
  templateUrl: './offre.component.html',
  styleUrl: './offre.component.scss',
})
export class OffresUserComponent implements OnInit {
  private chatService = inject(ChatService);
  private authStateService = inject(AuthStateService);

  publications: Publication[] = [];
  myPublications: Publication[] = [];
  categories: Categorie[] = [];
  villes: Ville[] = [];

  loading = false;
  loadingVilles = false;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  searchTerm: string = '';
  selectedCategorieFilter: number | null = null;
  selectedVilleFilter: number | null = null;
  selectedOffreStatutFilter: string = ''; //! 'VENDU' ou 'NON_VENDU' ou ''
  showFilters: boolean = false;
  sortBy: 'createdAt' | 'updatedAt' | 'titre' = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  showMyOffersModal = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showImagePreviewModal = false;

  selectedPublication: Publication | null = null;
  offreForm: FormGroup;
  imagePreviews: ImagePreview[] = [];
  maxImages = 5;

  // Preview des images
  selectedImageIndex: number = 0;
  currentImageGallery: any[] = [];

  uniteMesureOptions = Object.values(UniteMesure);
  PublicationStatut = PublicationStatut;

  // ID de l'utilisateur connecté
  currentUserId: number | null = null;

  // ID pays Madagascar (à récupérer dynamiquement)
  madagascarPaysId: number | null = null;

  constructor(
    private publicationService: PublicationOffreService,
    private categorieService: CategorieService,
    private paysService: PaysService,
    private villeService: VilleService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.offreForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      villeId: [null, Validators.required],
      produits: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadPublications();
    this.loadCategories();
    this.loadCurrentUser();
    this.loadMadagascarAndVilles();
  }

  // ==========================================
  // CHARGEMENT DE MADAGASCAR ET SES VILLES
  // ==========================================

  /**
   * Charge Madagascar et ses villes
   */
  loadMadagascarAndVilles(): void {
    this.loadingVilles = true;

    // Chercher Madagascar par son code
    this.paysService.getAll(1, 1000).subscribe({
      next: (response: any) => {
        const madagascar = response.data.find((p: Pays) =>
          p.code === 'MG' || p.nom.toLowerCase().includes('madagascar')
        );

        if (madagascar) {
          this.madagascarPaysId = madagascar.id;
          console.log('✅ Madagascar trouvé, ID:', this.madagascarPaysId);

          // Charger toutes les villes de Madagascar
          this.villeService.getAll(madagascar.id).subscribe({
            next: (villesResponse: any) => {
              this.villes = villesResponse.data || villesResponse;
              this.loadingVilles = false;
              console.log(`✅ ${this.villes.length} villes chargées`);

              if (this.villes.length === 0) {
                this.toastService.warning('Aucune ville trouvée pour Madagascar');
              }
            },
            error: (error: any) => {
              console.error('❌ Erreur chargement villes:', error);
              this.loadingVilles = false;
              this.toastService.error('Erreur lors du chargement des villes');
            },
          });
        } else {
          this.loadingVilles = false;
          this.toastService.error('Pays Madagascar non trouvé');
        }
      },
      error: (error: any) => {
        console.error('❌ Erreur chargement pays:', error);
        this.loadingVilles = false;
        this.toastService.error('Erreur lors du chargement des données');
      },
    });
  }

  // ==========================================
  // GESTION DU CHAT
  // ==========================================

  /**
   * Récupérer l'utilisateur connecté
   */
  loadCurrentUser(): void {
    this.authStateService.currentUser.subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
      }
    });
  }

  /**
   * Vérifier si l'offre appartient à l'utilisateur connecté
   */
  isMyOffer(publication: Publication): boolean {
    return this.currentUserId === publication.auteur.id;
  }

  /**
   * Initier une conversation pour une offre
   */
  contactSeller(publication: Publication, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.isMyOffer(publication)) {
      this.toastService.warning('Vous ne pouvez pas contacter votre propre offre');
      return;
    }

    if (publication.statut !== 'VALIDE') {
      this.toastService.warning('Cette offre n\'est pas encore validée');
      return;
    }

    if (publication.offre.statut === 'VENDU') {
      this.toastService.info('Cette offre a déjà été vendue');
      return;
    }

    console.log('📞 Initiation de la conversation pour l\'offre:', publication.id);

    this.loading = true;

    this.chatService
      .initiateConversationWithContext(
        publication.id,
        publication.titre,
        'OFFRE'
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Conversation créée:', response);
          this.toastService.success('Conversation démarrée avec le vendeur');
          this.chatService.navigateToConversation(response.conversation.id);
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la création de la conversation:', error);

          if (error.status === 409) {
            this.toastService.info('Une conversation existe déjà pour cette offre');
            if (error.error?.conversationId) {
              this.chatService.navigateToConversation(error.error.conversationId);
            }
          } else if (error.status === 401) {
            this.toastService.error('Vous devez être connecté pour contacter le vendeur');
          } else {
            this.toastService.error('Erreur lors de la création de la conversation');
          }

          this.loading = false;
        },
      });
  }

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

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
          // Ajout du console.log pour debug structure produits/categorie
          if (this.publications && this.publications.length > 0) {
            this.publications.forEach(pub => {
              if (pub.offre && pub.offre.produits) {
                pub.offre.produits.forEach((prod, idx) => {
                  console.log(`Publication[${pub.id}] Produit[${idx}]`, prod);
                });
              }
            });
          }
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des offres', error);
          this.loading = false;
          this.toastService.error('Erreur lors du chargement des offres');
        },
      });

    this.publicationService
      .searchPublications(
        this.currentPage,
        this.itemsPerPage,
        this.searchTerm,
        this.selectedCategorieFilter || undefined,
        this.selectedVilleFilter || undefined,
        this.selectedOffreStatutFilter || undefined,
        this.sortBy,
        this.sortOrder
      )
      .subscribe({
        next: (response: any) => {
          this.publications = response.data;
          this.totalItems = response.meta.total;
          this.totalPages = response.meta.totalPages;
          this.loading = false;

          if (this.publications && this.publications.length > 0) {
            this.publications.forEach(pub => {
              if (pub.offre && pub.offre.produits) {
                pub.offre.produits.forEach((prod, idx) => {
                  console.log(`Publication[${pub.id}] Produit[${idx}]`, prod);
                });
              }
            });
          }
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des offres', error);
          this.loading = false;
          this.toastService.error('Erreur lors du chargement des offres');
        },
      });
  }

  //? Méthode de recherche
  onSearch(): void {
    this.currentPage = 1; // Réinitialiser à la première page
    this.loadPublications();
  }

  //? Réinitialiser les filtres
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategorieFilter = null;
    this.selectedVilleFilter = null;
    this.selectedOffreStatutFilter = '';
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadPublications();
  }

  //? Toggle des filtres avancés
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  //? Changer l'ordre de tri
  changeSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.loadPublications();
  }

  loadMyPublications(): void {
    this.loading = true;

    this.http
      .get<any>(`${environment.apiUrl}/publications/offres/me`, {
        params: {
          page: '1',
          limit: '100'
        }
      })
      .subscribe({
        next: (response: any) => {
          console.log('✅ Mes publications:', response.data);
          this.myPublications = response.data || [];
          this.loading = false;

          if (this.myPublications.length === 0) {
            console.log('⚠️ Aucune publication trouvée');
          }
        },
        error: (error: any) => {
          console.error('❌ Erreur:', error);
          this.loading = false;

          if (error.status === 401) {
            this.toastService.error('Session expirée, veuillez vous reconnecter');
          } else {
            this.toastService.error('Erreur lors du chargement de vos offres');
          }
        },
      });
  }

  loadCategories(): void {
    this.categorieService.getAll().subscribe({
      next: (categories: Categorie[]) => {
        this.categories = categories;
      },
      error: (error: any) => {
        console.error('Erreur', error);
        this.toastService.error('Erreur lors du chargement des catégories');
      },
    });
  }

  /**
 * Retourne le libellé de la catégorie d'un produit, même si c'est un id
 */
  getCategorieLibelle(produit: Produit): string {
    // Si produit.categorie est un id (number)
    if (typeof produit.categorie === 'number') {
      const cat = this.categories.find(c => c.id === (produit.categorie as unknown as number));
      return cat ? (cat as any).libelle || '' : '';
    }
    // Si produit.categorie est un objet avec nom
    if (produit.categorie && typeof produit.categorie === 'object') {
      return (produit.categorie as any).nom || (produit.categorie as any).libelle || '';
    }
    return '';
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
      this.toastService.warning(`Maximum ${this.maxImages} images autorisées`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        this.toastService.warning('Seules les images sont autorisées');
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

  openImagePreview(images: any[], startIndex: number): void {
    this.currentImageGallery = images;
    this.selectedImageIndex = startIndex;
    this.showImagePreviewModal = true;
  }

  previousImage(): void {
    if (this.selectedImageIndex > 0) {
      this.selectedImageIndex--;
    } else {
      this.selectedImageIndex = this.currentImageGallery.length - 1;
    }
  }

  nextImage(): void {
    if (this.selectedImageIndex < this.currentImageGallery.length - 1) {
      this.selectedImageIndex++;
    } else {
      this.selectedImageIndex = 0;
    }
  }

  closeImagePreview(): void {
    this.showImagePreviewModal = false;
    this.currentImageGallery = [];
    this.selectedImageIndex = 0;
  }

  // ==========================================
  // GESTION DES MODALS
  // ==========================================

  openCreateModal(): void {
    if (this.villes.length === 0) {
      this.toastService.warning('Chargement des villes en cours...');
      return;
    }
    this.resetForm();
    this.addProduit();
    this.showCreateModal = true;
  }

  openMyOffersModal(): void {
    this.loadMyPublications();
    this.showMyOffersModal = true;
  }

  openEditModal(publication: Publication): void {
    console.log('✏️ Ouverture du modal d\'édition pour:', publication);

    this.selectedPublication = publication;
    this.resetForm();

    this.offreForm.patchValue({
      titre: publication.titre,
      description: publication.description,
      villeId: publication.ville.id,
    });

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
  }

  // ==========================================
  // SOUMISSION DU FORMULAIRE
  // ==========================================

  onSubmit(): void {
    console.log('🔍 Vérification du formulaire:');
    console.log('  - Formulaire valide:', this.offreForm.valid);
    console.log('  - Erreurs du formulaire:', this.offreForm.errors);
    console.log('  - Titre valide:', this.offreForm.get('titre')?.valid, 'Valeur:', this.offreForm.get('titre')?.value);
    console.log('  - Description valide:', this.offreForm.get('description')?.valid, 'Valeur:', this.offreForm.get('description')?.value);
    console.log('  - VilleId valide:', this.offreForm.get('villeId')?.valid, 'Valeur:', this.offreForm.get('villeId')?.value);
    console.log('  - Produits count:', this.produits.length);
    
    if (this.offreForm.invalid) {
      this.offreForm.markAllAsTouched();
      this.toastService.warning('Veuillez remplir tous les champs requis');
      return;
    }

    if (this.produits.length === 0) {
      this.toastService.warning('Ajoutez au moins un produit');
      return;
    }

    if (!this.showEditModal && this.imagePreviews.length === 0) {
      this.toastService.warning('Ajoutez au moins une image');
      return;
    }

    const formData = new FormData();
    formData.append('titre', this.offreForm.value.titre);
    formData.append('description', this.offreForm.value.description);
    formData.append('villeId', this.offreForm.value.villeId.toString());
    
    // Envoyer produits comme array, pas stringifié
    this.offreForm.value.produits.forEach((produit: any, index: number) => {
      formData.append(`produits[${index}][libelle]`, produit.libelle);
      formData.append(`produits[${index}][categorieId]`, produit.categorieId.toString());
      formData.append(`produits[${index}][quantite]`, produit.quantite.toString());
      formData.append(`produits[${index}][uniteMesure]`, produit.uniteMesure);
      formData.append(`produits[${index}][prixUnitaire]`, produit.prixUnitaire.toString());
    });

    this.imagePreviews.forEach((preview) => {
      formData.append('files', preview.file);
    });

    // Debug : afficher ce qui est envoyé
    console.log('📤 Données envoyées à l\'API:');
    console.log('  - titre:', this.offreForm.value.titre);
    console.log('  - description:', this.offreForm.value.description);
    console.log('  - villeId:', this.offreForm.value.villeId);
    console.log('  - produits:', this.offreForm.value.produits);
    console.log('  - images:', this.imagePreviews.length);
    console.log('  - formData keys:', Array.from((formData as any).keys()));

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
        if (this.showEditModal) {
          this.toastService.success('Offre modifiée avec succès');
        } else {
          this.toastService.info('Votre offre a été soumise et est en attente de validation par un administrateur');
        }
        this.closeAllModals();
        this.loadPublications();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur API:', error);
        console.error('  - Status:', error.status);
        console.error('  - Message:', error.error?.message);
        console.error('  - Response complète:', error.error);
        this.loading = false;

        if (error.status === 400) {
          this.toastService.error('Données invalides. Veuillez vérifier vos informations');
        } else if (error.status === 401) {
          this.toastService.error('Session expirée. Veuillez vous reconnecter');
        } else {
          this.toastService.error('Erreur lors de la soumission de l\'offre');
        }
      },
    });
  }

  // ==========================================
  // MARQUER COMME VENDU
  // ==========================================

  markAsSold(publication: Publication): void {
    console.log('🏷️ Marquage comme vendu pour:', publication.id);

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
          console.log('✅ Offre marquée comme vendue');
          this.toastService.success('Offre marquée comme vendue');
          this.closeAllModals();
          this.loading = false;

          setTimeout(() => {
            this.loadMyPublications();
          }, 300);
        },
        error: (error: any) => {
          console.error('❌ Erreur:', error);
          this.loading = false;
          this.toastService.error('Erreur lors de la mise à jour');
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
          this.toastService.success('Offre supprimée avec succès');
          this.closeAllModals();
          this.loadPublications();
          this.loadMyPublications();
        },
        error: (error: any) => {
          console.error('Erreur', error);
          this.loading = false;
          this.toastService.error('Erreur lors de la suppression');
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