import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatePaysDto, Pays, PaysService, UpdatePaysDto } from '../../../shared/services/pays.service';


@Component({
  selector: 'app-pays',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pays.component.html',
  styleUrl: './pays.component.scss'
})
export class PaysComponent implements OnInit {
  pays: Pays[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  searchTerm = '';

  paysForm: FormGroup;
  isEditMode = false;
  selectedPays: Pays | null = null;
  showModal = false;
  showDeleteModal = false;

  constructor(
    private paysService: PaysService,
    private fb: FormBuilder
  ) {
    this.paysForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(3)]]
    });
  }

  ngOnInit(): void {
    this.loadPays();
  }

  loadPays(): void {
    this.loading = true;
    this.paysService.getAll(this.currentPage, this.itemsPerPage, this.searchTerm).subscribe({
      next: (response) => {
        this.pays = response.data;
        this.totalItems = response.total;
        this.totalPages = Math.ceil(response.total / this.itemsPerPage);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pays', error);
        this.loading = false;
        this.showToast('Erreur lors du chargement des pays', 'error');
      }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedPays = null;
    this.paysForm.reset();
    this.showModal = true;
  }

  openEditModal(pays: Pays): void {
    this.isEditMode = true;
    this.selectedPays = pays;
    this.paysForm.patchValue({
      nom: pays.nom,
      code: pays.code
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.paysForm.reset();
    this.selectedPays = null;
  }

  openDeleteModal(pays: Pays): void {
    this.selectedPays = pays;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedPays = null;
  }

  onSubmit(): void {
    if (this.paysForm.invalid) {
      this.paysForm.markAllAsTouched();
      return;
    }

    const formData = this.paysForm.value;

    if (this.isEditMode && this.selectedPays) {
      this.updatePays(this.selectedPays.id, formData);
    } else {
      this.createPays(formData);
    }
  }

  createPays(data: CreatePaysDto): void {
    this.loading = true;
    this.paysService.create(data).subscribe({
      next: () => {
        this.showToast('Pays créé avec succès', 'success');
        this.closeModal();
        this.loadPays();
      },
      error: (error) => {
        console.error('Erreur lors de la création du pays', error);
        this.loading = false;
        this.showToast('Erreur lors de la création du pays', 'error');
      }
    });
  }

  updatePays(id: number, data: UpdatePaysDto): void {
    this.loading = true;
    this.paysService.update(id, data).subscribe({
      next: () => {
        this.showToast('Pays modifié avec succès', 'success');
        this.closeModal();
        this.loadPays();
      },
      error: (error) => {
        console.error('Erreur lors de la modification du pays', error);
        this.loading = false;
        this.showToast('Erreur lors de la modification du pays', 'error');
      }
    });
  }

  confirmDelete(): void {
    if (!this.selectedPays) return;

    this.loading = true;
    this.paysService.delete(this.selectedPays.id).subscribe({
      next: () => {
        this.showToast('Pays supprimé avec succès', 'success');
        this.closeDeleteModal();
        this.loadPays();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du pays', error);
        this.loading = false;
        this.showToast('Erreur lors de la suppression du pays', 'error');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPays();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPays();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Implémentation simple du toast
    // Vous pouvez utiliser une bibliothèque de toast plus sophistiquée si nécessaire
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  get nomControl() {
    return this.paysForm.get('nom');
  }

  get codeControl() {
    return this.paysForm.get('code');
  }
}