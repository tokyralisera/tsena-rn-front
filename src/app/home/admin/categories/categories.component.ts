import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService, Categorie } from '../../../shared/services/categorie.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  loadCategories(): void {
    this.loading = true;
    this.categoriesService.getAll().subscribe({
      next: (categories: Categorie[]) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.toastService.error('Erreur lors du chargement des catégories');
        this.loading = false;
      }
    });
  }

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

  onSubmit(): void {
    this.formSubmitted = true;
    if (!this.categorieForm.nom.trim()) {
      this.toastService.warning('Le nom de la catégorie est requis');
      return;
    }

    this.loading = true;

    if (this.isEditMode) {
      this.categoriesService.update(this.categorieForm.id, this.categorieForm.nom).subscribe({
        next: (response) => {
          this.toastService.success(response.message || 'Catégorie modifiée avec succès');
          this.loadCategories();
          this.closeModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.toastService.error(error.error?.message || 'Erreur lors de la modification');
          this.loading = false;
        }
      });
    } else {
      this.categoriesService.create(this.categorieForm.nom).subscribe({
        next: (response) => {
          this.toastService.success(response.message || 'Catégorie créée avec succès');
          this.loadCategories();
          this.closeModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.toastService.error(error.error?.message || 'Erreur lors de la création');
          this.loading = false;
        }
      });
    }
  }

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
        this.toastService.success('Catégorie supprimée avec succès');
        this.loadCategories();
        this.closeDeleteModal();
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Erreur lors de la suppression');
        this.loading = false;
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.toastService.info('Recherche réinitialisée');
  }

  get filteredCategories(): Categorie[] {
    if (!this.searchTerm) return this.categories;
    
    const term = this.searchTerm.toLowerCase();
    return this.categories.filter(cat => 
      cat.nom.toLowerCase().includes(term)
    );
  }
}