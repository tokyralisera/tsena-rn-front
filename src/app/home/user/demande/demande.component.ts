import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ToastService } from '../../../shared/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ChatService } from '../chat/services/chat.service';
import { AuthStateService } from '../../../auth/auth-state.service';
import { CategorieService, Categorie } from '../../../shared/services/categorie.service';
import { VilleService, Ville } from '../../../shared/services/ville.service';
import { PaysService, Pays } from '../../../shared/services/pays.service';
import { DemandeService, Publication, StatutDemande, UniteMesure } from '../../../shared/services/publication-demande.service';

interface ImagePreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-demande',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './demande.component.html',
  styleUrls: ['./demande.component.scss'],
})
export class DemandeUserComponent implements OnInit {
  private chatService = inject(ChatService);
  private authStateService = inject(AuthStateService);

  // Données
  demandes: Publication[] = [];
  mesDemandes: Publication[] = [];
  categories: Categorie[] = [];
  villes: Ville[] = [];

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // États
  loading = false;
  loadingCategories = false;
  loadingVilles = false;
  showMesDemandesModal = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showImagePreviewModal = false;

  // Sélections
  selectedDemande: Publication | null = null;
  selectedImageIndex: number = 0;
  currentImageGallery: any[] = [];

  // Filtres et recherche
  searchTerm: string = '';
  selectedCategorieFilter: number | null = null;
  selectedVilleFilter: number | null = null;
  selectedDemandeStatutFilter: string = '';
  budgetMin: number | null = null;
  budgetMax: number | null = null;
  showFilters: boolean = false;
  sortBy: 'createdAt' | 'updatedAt' | 'titre' | 'deadline' = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Formulaire
  demandeForm: FormGroup;
  imagePreviews: ImagePreview[] = [];
  maxImages = 5;

  // Enums
  StatutDemande = StatutDemande;
  UniteMesure = UniteMesure;
  uniteMesureOptions = Object.values(UniteMesure);

  // ID utilisateur connecté
  currentUserId: number | null = null;

  // Madagascar
  madagascarPaysId: number | null = null;

  minDate: string = new Date().toISOString().split('T')[0];

  constructor(
    private demandeService: DemandeService,
    private categorieService: CategorieService,
    private villeService: VilleService,
    private paysService: PaysService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.demandeForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      villeId: [null, Validators.required],
      deadline: [''],
      budgetMin: [null, [Validators.min(0)]],
      budgetMax: [null, [Validators.min(0)]],
      produits: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadDemandes();
    this.loadCategories();
    this.loadCurrentUser();
    this.loadMadagascarAndVilles();
  }

  // ==========================================
  // CHARGEMENT DE MADAGASCAR ET SES VILLES
  // ==========================================

  loadMadagascarAndVilles(): void {
    this.loadingVilles = true;

    this.paysService.getAll(1, 1000).subscribe({
      next: (response: any) => {
        const madagascar = response.data.find((p: Pays) =>
          p.code === 'MG' || p.nom.toLowerCase().includes('madagascar')
        );

        if (madagascar) {
          this.madagascarPaysId = madagascar.id;
          console.log('✅ Madagascar trouvé, ID:', this.madagascarPaysId);

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

  loadCurrentUser(): void {
    this.authStateService.currentUser.subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
      }
    });
  }

  isMyDemande(publication: Publication): boolean {
    return this.currentUserId === publication.auteur.id;
  }

  contactAuthor(publication: Publication, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.isMyDemande(publication)) {
      this.toastService.warning('Vous ne pouvez pas contacter votre propre demande');
      return;
    }

    if (publication.statut !== 'VALIDE') {
      this.toastService.warning('Cette demande n\'est pas encore validée');
      return;
    }

    if (publication.demande.statutDemande === 'TROUVEE' || publication.demande.statutDemande === 'EXPIREE') {
      this.toastService.info('Cette demande n\'est plus disponible');
      return;
    }

    console.log('📞 Initiation de la conversation pour la demande:', publication.id);

    this.loading = true;

    this.chatService
      .initiateConversationWithContext(
        publication.id,
        publication.titre,
        'DEMANDE'
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Conversation créée:', response);
          this.toastService.success('Conversation démarrée avec l\'auteur');
          this.chatService.navigateToConversation(response.conversation.id);
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors de la création de la conversation:', error);

          if (error.status === 409) {
            this.toastService.info('Une conversation existe déjà pour cette demande');
            if (error.error?.conversationId) {
              this.chatService.navigateToConversation(error.error.conversationId);
            }
          } else if (error.status === 401) {
            this.toastService.error('Vous devez être connecté pour contacter l\'auteur');
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

  loadDemandes(): void {
    this.loading = true;

    const filters: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };

    if (this.searchTerm && this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
    }
    if (this.selectedCategorieFilter) {
      filters.categorieId = this.selectedCategorieFilter;
    }
    if (this.selectedVilleFilter) {
      filters.villeId = this.selectedVilleFilter;
    }
    if (this.selectedDemandeStatutFilter) {
      filters.demandeStatut = this.selectedDemandeStatutFilter;
    }
    if (this.budgetMin !== null && this.budgetMin !== undefined) {
      filters.budgetMin = this.budgetMin;
    }
    if (this.budgetMax !== null && this.budgetMax !== undefined) {
      filters.budgetMax = this.budgetMax;
    }

    this.demandeService.searchDemandes(filters).subscribe({
      next: (response: any) => {
        this.demandes = response.data;
        this.totalItems = response.meta.total;
        this.totalPages = response.meta.totalPages;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des demandes', error);
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des demandes');
      },
    });
  }

  loadMesDemandes(): void {
    console.log('🔍 Chargement de MES demandes...');

    this.loading = true;

    this.demandeService.getMyDemandes(1, 100).subscribe({
      next: (response: any) => {
        console.log('✅ Mes demandes:', response.data);
        this.mesDemandes = response.data || [];
        this.loading = false;

        if (this.mesDemandes.length === 0) {
          console.log('⚠️ Aucune demande trouvée');
        }
      },
      error: (error: any) => {
        console.error('❌ Erreur:', error);
        this.loading = false;

        if (error.status === 401) {
          this.toastService.error('Session expirée, veuillez vous reconnecter');
        } else {
          this.toastService.error('Erreur lors du chargement de vos demandes');
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

  // ==========================================
  // RECHERCHE ET FILTRES
  // ==========================================

  onSearch(): void {
    this.currentPage = 1;
    this.loadDemandes();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategorieFilter = null;
    this.selectedVilleFilter = null;
    this.selectedDemandeStatutFilter = '';
    this.budgetMin = null;
    this.budgetMax = null;
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadDemandes();
  }

  changeSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.loadDemandes();
  }

  // ==========================================
  // GESTION DU FORMARRAY DES PRODUITS
  // ==========================================

  get produits(): FormArray {
    return this.demandeForm.get('produits') as FormArray;
  }

  createProduitForm(): FormGroup {
    return this.fb.group({
      nom: ['', Validators.required],
      categorieId: [null, Validators.required],
      quantite: [null, [Validators.min(0.01)]],
      uniteMesure: [UniteMesure.PIECE],
    });
  }

  addProduit(): void {
    this.produits.push(this.createProduitForm());
  }

  removeProduit(index: number): void {
    this.produits.removeAt(index);
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

  openMyDemandesModal(): void {
    this.loadMesDemandes();
    this.showMesDemandesModal = true;
  }

  openEditModal(publication: Publication): void {
    console.log('✏️ Ouverture du modal d\'édition pour:', publication);

    this.selectedDemande = publication;
    this.resetForm();

    this.demandeForm.patchValue({
      titre: publication.titre,
      description: publication.description,
      villeId: publication.ville.id,
      deadline: publication.demande.deadline ? new Date(publication.demande.deadline).toISOString().split('T')[0] : '',
      budgetMin: publication.demande.budgetMin,
      budgetMax: publication.demande.budgetMax,
    });

    publication.demande.produits.forEach((produit: any) => {
      const produitForm = this.createProduitForm();
      produitForm.patchValue({
        nom: produit.nom,
        categorieId: produit.categorie.id,
        quantite: produit.quantite,
        uniteMesure: produit.uniteMesure || UniteMesure.PIECE,
      });
      this.produits.push(produitForm);
    });

    this.showEditModal = true;
    this.showMesDemandesModal = false;
  }

  openDeleteModal(publication: Publication): void {
    this.selectedDemande = publication;
    this.showDeleteModal = true;
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showMesDemandesModal = false;
    this.selectedDemande = null;
    this.resetForm();
  }

  resetForm(): void {
    this.demandeForm.reset();
    this.produits.clear();
    this.imagePreviews = [];
  }

  // ==========================================
  // SOUMISSION DU FORMULAIRE
  // ==========================================

  onSubmit(): void {
    console.log('🔍 Vérification du formulaire:');
    console.log('  - Formulaire valide:', this.demandeForm.valid);
    console.log('  - Erreurs du formulaire:', this.demandeForm.errors);
    console.log('  - Titre valide:', this.demandeForm.get('titre')?.valid, 'Valeur:', this.demandeForm.get('titre')?.value);
    console.log('  - Description valide:', this.demandeForm.get('description')?.valid, 'Valeur:', this.demandeForm.get('description')?.value, 'Longueur:', this.demandeForm.get('description')?.value?.length);
    console.log('  - VilleId valide:', this.demandeForm.get('villeId')?.valid, 'Valeur:', this.demandeForm.get('villeId')?.value);
    console.log('  - Produits count:', this.produits.length);
    
    if (this.demandeForm.invalid) {
      this.demandeForm.markAllAsTouched();
      
      // Messages d'erreur spécifiques
      const errors = [];
      if (this.demandeForm.get('titre')?.invalid) {
        errors.push('Le titre doit contenir au moins 5 caractères');
      }
      if (this.demandeForm.get('description')?.invalid) {
        const desc = this.demandeForm.get('description')?.value || '';
        errors.push(`La description doit contenir au moins 20 caractères (actuellement: ${desc.length})`);
      }
      if (this.demandeForm.get('villeId')?.invalid) {
        errors.push('Veuillez sélectionner une ville');
      }
      
      this.toastService.warning(errors.length > 0 ? errors.join('\n') : 'Veuillez remplir tous les champs requis');
      return;
    }

    if (this.produits.length === 0) {
      this.toastService.warning('Ajoutez au moins un produit');
      return;
    }

    // Validation des produits
    let produitsInvalid = false;
    this.produits.controls.forEach((control, index) => {
      if (control.invalid) {
        produitsInvalid = true;
        console.log(`Produit ${index + 1} invalide:`, control.errors);
      }
    });

    if (produitsInvalid) {
      this.toastService.warning('Veuillez remplir tous les champs des produits');
      return;
    }

    // Validation budget
    const budgetMin = this.demandeForm.value.budgetMin;
    const budgetMax = this.demandeForm.value.budgetMax;
    if (budgetMin && budgetMax && budgetMax < budgetMin) {
      this.toastService.warning('Le budget maximum doit être supérieur au budget minimum');
      return;
    }

    const dto: any = {
      titre: this.demandeForm.value.titre,
      description: this.demandeForm.value.description,
      villeId: parseInt(this.demandeForm.value.villeId),
      deadline: this.demandeForm.value.deadline || undefined,
      budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
      budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      produits: this.demandeForm.value.produits.map((p: any) => ({
        nom: p.nom,
        quantite: p.quantite ? parseInt(p.quantite) : undefined,
        uniteMesure: p.uniteMesure || undefined,
        categorieId: parseInt(p.categorieId),
      })),
      images: this.imagePreviews.length > 0 ? this.imagePreviews.map(img => img.file) : undefined,
    };

    this.loading = true;

    const request = this.showEditModal && this.selectedDemande
      ? this.demandeService.updateDemande(this.selectedDemande.id, dto)
      : this.demandeService.createDemande(dto);

    request.subscribe({
      next: () => {
        if (this.showEditModal) {
          this.toastService.success('Demande modifiée avec succès');
        } else {
          this.toastService.info('Votre demande a été soumise et est en attente de validation par un administrateur');
        }
        this.closeAllModals();
        this.loadDemandes();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur API:', error);
        this.loading = false;

        if (error.status === 400) {
          const errorMsg = error.error?.message || 'Données invalides. Veuillez vérifier vos informations';
          this.toastService.error(errorMsg);
        } else if (error.status === 401) {
          this.toastService.error('Session expirée. Veuillez vous reconnecter');
        } else {
          this.toastService.error('Erreur lors de la soumission de la demande');
        }
      },
    });
  }

  // ==========================================
  // MARQUER COMME TROUVÉE
  // ==========================================

  markAsTrouvee(publication: Publication): void {
    console.log('🏷️ Marquage comme trouvée pour:', publication.id);

    this.loading = true;
    this.demandeService.updateDemandeStatut(publication.id, StatutDemande.TROUVEE).subscribe({
      next: () => {
        console.log('✅ Demande marquée comme trouvée');
        this.toastService.success('Demande marquée comme trouvée');
        this.closeAllModals();
        this.loading = false;

        setTimeout(() => {
          this.loadMesDemandes();
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
    if (!this.selectedDemande) return;

    this.loading = true;
    this.demandeService.deleteDemande(this.selectedDemande.id).subscribe({
      next: () => {
        this.toastService.success('Demande supprimée avec succès');
        this.closeAllModals();
        this.loadDemandes();
        this.loadMesDemandes();
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

  formatBudget(min?: number, max?: number): string {
    if (!min && !max) return 'Budget non spécifié';
    if (min && max) return `${this.formatPrice(min)} - ${this.formatPrice(max)}`;
    if (min) return `À partir de ${this.formatPrice(min)}`;
    if (max) return `Jusqu'à ${this.formatPrice(max)}`;
    return '';
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

  getDemandeStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'TROUVEE':
        return 'badge-success';
      case 'EXPIREE':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  }

  isDeadlinePassed(deadline?: string): boolean {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  getDaysUntilDeadline(deadline?: string): number {
    if (!deadline) return 0;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDemandes();
    }
  }
}