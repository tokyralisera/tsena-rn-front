import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService, Categorie } from '../../../shared/services/categorie.service';

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
  
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  
  categorieForm = {
    id: 0,
    nom: ''
  };
  
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' = 'info';
  showAlert: boolean = false;

  selectedCategory: Categorie | null = null;
  formSubmitted = false;

  constructor(private categoriesService: CategorieService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoriesService.getAll().subscribe({
      next: (response) => {
        this.categories = response.data as Categorie[];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.showAlertMessage('Erreur lors du chargement des catégories', 'error');
        this.loading = false;
      }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.categorieForm = { id: 0, nom: '' };
    this.formSubmitted = false;
    const modal = document.getElementById('modal_form') as HTMLDialogElement;
    modal?.showModal();
  }

  openEditModal(categorie: Categorie): void {
    this.isEditMode = true;
    this.categorieForm = { ...categorie };
    this.formSubmitted = false;
    const modal = document.getElementById('modal_form') as HTMLDialogElement;
    modal?.showModal();
  }

  closeModal(): void {
    const modal = document.getElementById('modal_form') as HTMLDialogElement;
    modal?.close();
    this.formSubmitted = false;
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (!this.categorieForm.nom.trim()) {
      this.showAlertMessage('Le nom de la catégorie est requis', 'error');
      return;
    }

    this.loading = true;

    if (this.isEditMode) {
      this.categoriesService.update(this.categorieForm.id, this.categorieForm.nom).subscribe({
        next: (response) => {
          this.showAlertMessage(response.message, 'success');
          this.loadCategories();
          this.closeModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.showAlertMessage(
            error.error?.message || 'Erreur lors de la modification',
            'error'
          );
          this.loading = false;
        }
      });
    } else {
      this.categoriesService.create(this.categorieForm.nom).subscribe({
        next: (response) => {
          this.showAlertMessage(response.message, 'success');
          this.loadCategories();
          this.closeModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.showAlertMessage(
            error.error?.message || 'Erreur lors de la création',
            'error'
          );
          this.loading = false;
        }
      });
    }
  }

  openDeleteModal(categorie: Categorie): void {
    this.selectedCategory = categorie;
    const modal = document.getElementById('modal_delete') as HTMLDialogElement;
    modal?.showModal();
  }

  closeDeleteModal(): void {
    const modal = document.getElementById('modal_delete') as HTMLDialogElement;
    modal?.close();
    this.selectedCategory = null;
  }

  confirmDelete(): void {
    if (!this.selectedCategory) return;
    
    this.loading = true;
    this.categoriesService.delete(this.selectedCategory.id).subscribe({
      next: (response) => {
        this.showAlertMessage('Catégorie supprimée avec succès', 'success');
        this.loadCategories();
        this.closeDeleteModal();
      },
      error: (error) => {
        this.showAlertMessage(error.error?.message || 'Erreur lors de la suppression', 'error');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  showAlertMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  closeAlert(): void {
    this.showAlert = false;
  }
}
