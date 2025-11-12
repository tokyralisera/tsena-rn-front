import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DemandeService, Publication, StatutDemande, UniteMesure } from '../../../shared/services/publication-demande.service';
import { Categorie, CategorieService } from '../../../shared/services/categorie.service';
import { Ville, VilleService } from '../../../shared/services/ville.service';


@Component({
  selector: 'app-demande',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './demande.component.html',
  styleUrls: ['./demande.component.scss'],
})
export class DemandeUserComponent implements OnInit {
 // Données
  demandes: Publication[] = [];
  mesDemandes: Publication[] = [];
  categories: Categorie[] = [];
  villes: Ville[] = [];

  // Pagination
  currentPage = 1;
  totalPages = 1;
  limit = 9;

  // États
  loading = false;
  loadingCategories = false;
  loadingVilles = false;
  showMesDemandesModal = false;
  showCreateModal = false;
  showEditModal = false;
  selectedDemande: Publication | null = null;

  // Formulaires
  createForm!: FormGroup;
  editForm!: FormGroup;

  // Enums pour le template
  StatutDemande = StatutDemande;
  UniteMesure = UniteMesure;
  uniteMesures = Object.values(UniteMesure);

  // Images
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];

  minDate: string = new Date().toISOString().split('T')[0];

  constructor(
    private demandeService: DemandeService,
    private categorieService: CategorieService,
    private villeService: VilleService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadDemandes();
    this.loadCategories();
    this.loadVilles();
  }

  initForms(): void {
    this.createForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      villeId: ['', Validators.required],
      deadline: [''],
      budgetMin: ['', [Validators.min(0)]],
      budgetMax: ['', [Validators.min(0)]],
      produits: this.fb.array([this.createProduitGroup()]),
    });

    this.editForm = this.fb.group({
      titre: [''],
      description: [''],
      villeId: [''],
      deadline: [''],
      budgetMin: [''],
      budgetMax: [''],
      produits: this.fb.array([]),
    });
  }

  createProduitGroup(): FormGroup {
    return this.fb.group({
      nom: ['', Validators.required],
      quantite: ['', [Validators.min(1)]],
      uniteMesure: [''],
      categorieId: ['', Validators.required],
    });
  }

  get produitsFormArray(): FormArray {
    return this.createForm.get('produits') as FormArray;
  }

  get editProduitsFormArray(): FormArray {
    return this.editForm.get('produits') as FormArray;
  }

  addProduit(): void {
    this.produitsFormArray.push(this.createProduitGroup());
  }

  removeProduit(index: number): void {
    if (this.produitsFormArray.length > 1) {
      this.produitsFormArray.removeAt(index);
    }
  }

  // Chargement des données
  loadDemandes(): void {
    this.loading = true;
    this.demandeService.getAllDemandes(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.demandes = response.data;
        this.totalPages = response.meta.totalPages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement demandes:', error);
        this.loading = false;
      },
    });
  }

  loadMesDemandes(): void {
    this.demandeService.getMyDemandes(1, 50).subscribe({
      next: (response) => {
        this.mesDemandes = response.data;
      },
      error: (error) => {
        console.error('Erreur chargement mes demandes:', error);
      },
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categorieService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadingCategories = false;
      },
      error: (error) => {
        console.error('Erreur chargement catégories:', error);
        this.loadingCategories = false;
      },
    });
  }

  loadVilles(): void {
    this.loadingVilles = true;
    this.villeService.getAll().subscribe({
      next: (response) => {
        this.villes = response.data;
        this.loadingVilles = false;
      },
      error: (error) => {
        console.error('Erreur chargement villes:', error);
        this.loadingVilles = false;
      },
    });
  }

  // Gestion des images
  onImagesSelected(event: any): void {
    const files = event.target.files;
    if (files.length > 5) {
      alert('Maximum 5 images autorisées');
      event.target.value = '';
      return;
    }

    this.selectedImages = Array.from(files);
    this.imagePreviewUrls = [];

    this.selectedImages.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrls.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);
  }

  // Actions CRUD
  openCreateModal(): void {
    this.showCreateModal = true;
    this.createForm.reset();
    this.selectedImages = [];
    this.imagePreviewUrls = [];
    // Réinitialiser le tableau de produits avec un seul produit vide
    while (this.produitsFormArray.length > 0) {
      this.produitsFormArray.removeAt(0);
    }
    this.produitsFormArray.push(this.createProduitGroup());
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createDemande(): void {
    if (this.createForm.invalid) {
      this.markFormGroupTouched(this.createForm);
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.createForm.value;

    // Validation budget
    if (formValue.budgetMin && formValue.budgetMax) {
      if (parseFloat(formValue.budgetMax) < parseFloat(formValue.budgetMin)) {
        alert('Le budget maximum doit être supérieur au budget minimum');
        return;
      }
    }

    const dto = {
      titre: formValue.titre,
      description: formValue.description,
      villeId: parseInt(formValue.villeId),
      deadline: formValue.deadline || undefined,
      budgetMin: formValue.budgetMin ? parseFloat(formValue.budgetMin) : undefined,
      budgetMax: formValue.budgetMax ? parseFloat(formValue.budgetMax) : undefined,
      images: this.selectedImages.length > 0 ? this.selectedImages : undefined,
      produits: formValue.produits.map((p: any) => ({
        nom: p.nom,
        quantite: p.quantite ? parseInt(p.quantite) : undefined,
        uniteMesure: p.uniteMesure || undefined,
        categorieId: parseInt(p.categorieId),
      })),
    };

    this.loading = true;
    this.demandeService.createDemande(dto).subscribe({
      next: (response) => {
        alert('Demande créée avec succès ! Elle est en attente de validation.');
        this.closeCreateModal();
        this.loadDemandes();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur création:', error);
        alert(error.error?.message || 'Erreur lors de la création de la demande');
        this.loading = false;
      },
    });
  }

  openMesDemandesModal(): void {
    this.showMesDemandesModal = true;
    this.loadMesDemandes();
  }

  closeMesDemandesModal(): void {
    this.showMesDemandesModal = false;
  }

  openEditModal(demande: Publication): void {
    this.selectedDemande = demande;
    this.showEditModal = true;

    // Pré-remplir le formulaire d'édition
    this.editForm.patchValue({
      titre: demande.titre,
      description: demande.description,
      villeId: demande.ville.id,
      deadline: demande.demande.deadline ? new Date(demande.demande.deadline).toISOString().split('T')[0] : '',
      budgetMin: demande.demande.budgetMin,
      budgetMax: demande.demande.budgetMax,
    });

    // Pré-remplir les produits
    const produitsArray = this.editForm.get('produits') as FormArray;
    while (produitsArray.length > 0) {
      produitsArray.removeAt(0);
    }

    demande.demande.produits.forEach((produit) => {
      produitsArray.push(
        this.fb.group({
          nom: [produit.nom, Validators.required],
          quantite: [produit.quantite || '', [Validators.min(1)]],
          uniteMesure: [produit.uniteMesure || ''],
          categorieId: [produit.categorie.id, Validators.required],
        })
      );
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedDemande = null;
  }

  updateDemande(): void {
    if (!this.selectedDemande || this.editForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.editForm.value;

    const dto = {
      titre: formValue.titre || undefined,
      description: formValue.description || undefined,
      villeId: formValue.villeId ? parseInt(formValue.villeId) : undefined,
      deadline: formValue.deadline || undefined,
      budgetMin: formValue.budgetMin ? parseFloat(formValue.budgetMin) : undefined,
      budgetMax: formValue.budgetMax ? parseFloat(formValue.budgetMax) : undefined,
      images: this.selectedImages.length > 0 ? this.selectedImages : undefined,
      produits: formValue.produits.map((p: any) => ({
        nom: p.nom,
        quantite: p.quantite ? parseInt(p.quantite) : undefined,
        uniteMesure: p.uniteMesure || undefined,
        categorieId: parseInt(p.categorieId),
      })),
    };

    this.loading = true;
    this.demandeService.updateDemande(this.selectedDemande.id, dto).subscribe({
      next: () => {
        alert('Demande mise à jour avec succès ! Elle repasse en attente de validation.');
        this.closeEditModal();
        this.loadMesDemandes();
        this.loadDemandes();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur mise à jour:', error);
        alert('Erreur lors de la mise à jour de la demande');
        this.loading = false;
      },
    });
  }

  updateDemandeStatut(id: number, statut: StatutDemande): void {
    const message = statut === StatutDemande.TROUVEE 
      ? 'Marquer cette demande comme TROUVÉE ?' 
      : 'Marquer cette demande comme NON TROUVÉE ?';

    if (confirm(message)) {
      this.demandeService.updateDemandeStatut(id, statut).subscribe({
        next: () => {
          alert('Statut mis à jour avec succès !');
          this.loadMesDemandes();
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('Erreur lors de la mise à jour du statut');
        },
      });
    }
  }

  deleteDemande(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.')) {
      this.demandeService.deleteDemande(id).subscribe({
        next: () => {
          alert('Demande supprimée avec succès !');
          this.loadMesDemandes();
          this.loadDemandes();
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('Erreur lors de la suppression');
        },
      });
    }
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadDemandes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadDemandes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Helpers
  getStatutBadgeClass(statut: StatutDemande): string {
    switch (statut) {
      case StatutDemande.TROUVEE:
        return 'badge-success';
      case StatutDemande.EXPIREE:
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  }

  getStatutPublicationBadgeClass(statut: string): string {
    switch (statut) {
      case 'VALIDE':
        return 'badge-success';
      case 'REJETE':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  }

  getStatutLabel(statut: StatutDemande): string {
    switch (statut) {
      case StatutDemande.TROUVEE:
        return 'Trouvée';
      case StatutDemande.EXPIREE:
        return 'Expirée';
      default:
        return 'Non trouvée';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  formatBudget(min?: number, max?: number): string {
    if (!min && !max) return 'Budget non spécifié';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} Ar`;
    if (min) return `À partir de ${min.toLocaleString()} Ar`;
    if (max) return `Jusqu'à ${max.toLocaleString()} Ar`;
    return '';
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

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }
}