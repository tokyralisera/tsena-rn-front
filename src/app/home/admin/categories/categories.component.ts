import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService, Categorie } from '../../../shared/services/categorie.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories: Categorie[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  showDeleteModal: boolean = false;
  
  categorieForm = {
    id: 0,
    nom: ''
  };

  selectedCategory: Categorie | null = null;
  formSubmitted = false;

  constructor(
    private categoriesService: CategorieService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  loadCategories(): void {
    this.loading = true;
    this.categoriesService.getAll().subscribe({
      next: (categories: Categorie[]) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
        this.toastService.error('Erreur lors du chargement des catégories');
        this.loading = false;
      }
    });
  }

  // ==========================================
  // MODALS - AJOUT/ÉDITION
  // ==========================================

  openAddModal(): void {
    this.isEditMode = false;
    this.categorieForm = { id: 0, nom: '' };
    this.formSubmitted = false;
    this.isModalOpen = true;
  }

  openEditModal(categorie: Categorie): void {
    this.isEditMode = true;
    this.categorieForm = { ...categorie };
    this.formSubmitted = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.formSubmitted = false;
    this.categorieForm = { id: 0, nom: '' };
  }

  // ==========================================
  // SOUMISSION DU FORMULAIRE
  // ==========================================

  onSubmit(): void {
    this.formSubmitted = true;
    
    // Validation
    if (!this.categorieForm.nom.trim()) {
      this.toastService.warning('Le nom de la catégorie est requis');
      return;
    }

    this.loading = true;

    if (this.isEditMode) {
      // Modification
      this.categoriesService.update(this.categorieForm.id, this.categorieForm.nom).subscribe({
        next: (response) => {
          this.toastService.success(response.message || 'Catégorie modifiée avec succès');
          this.loadCategories();
          this.closeModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.toastService.error(error.error?.message || 'Erreur lors de la modification');
          this.loading = false;
        }
      });
    } else {
      // Création
      this.categoriesService.create(this.categorieForm.nom).subscribe({
        next: (response) => {
          this.toastService.success(response.message || 'Catégorie créée avec succès');
          this.loadCategories();
          this.closeModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.toastService.error(error.error?.message || 'Erreur lors de la création');
          this.loading = false;
        }
      });
    }
  }

  // ==========================================
  // MODAL SUPPRESSION
  // ==========================================

  openDeleteModal(categorie: Categorie): void {
    this.selectedCategory = categorie;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedCategory = null;
  }

  confirmDelete(): void {
    if (!this.selectedCategory) return;
    
    this.loading = true;
    this.categoriesService.delete(this.selectedCategory.id).subscribe({
      next: (response) => {
        this.toastService.success(response.message || 'Catégorie supprimée avec succès');
        this.loadCategories();
        this.closeDeleteModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.toastService.error(error.error?.message || 'Erreur lors de la suppression');
        this.loading = false;
      }
    });
  }

  // ==========================================
  // RECHERCHE
  // ==========================================

  clearSearch(): void {
    this.searchTerm = '';
  }

  get filteredCategories(): Categorie[] {
    if (!this.searchTerm) return this.categories;
    
    const term = this.searchTerm.toLowerCase().trim();
    return this.categories.filter(cat => 
      cat.nom.toLowerCase().includes(term) ||
      cat.id.toString().includes(term)
    );
  }

  // ==========================================
  // HELPERS
  // ==========================================

  getProductCountClass(count: number): string {
    if (count === 0) return 'empty';
    if (count >= 10) return 'popular';
    return 'normal';
  }
}