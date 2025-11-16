import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatePaysDto, Pays, PaysService, UpdatePaysDto } from '../../../shared/services/pays.service';
import { ToastService } from '../../../shared/services/toast.service';

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
  itemsPerPage = 10;
  searchTerm = '';

  paysForm: FormGroup;
  isEditMode = false;
  selectedPays: Pays | null = null;
  showModal = false;
  showDeleteModal = false;

  constructor(
    private paysService: PaysService,
    private fb: FormBuilder,
    private toastService: ToastService
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
        this.totalPages = Math.ceil(response.total / this.itemsPerPage);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pays', error);
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des pays');
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
      this.toastService.warning('Veuillez remplir tous les champs requis');
      return;
    }

    const formData = {
      ...this.paysForm.value,
      code: this.paysForm.value.code.toUpperCase()
    };

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
        this.toastService.success('Pays créé avec succès');
        this.closeModal();
        this.loadPays();
      },
      error: (error) => {
        console.error('Erreur lors de la création du pays', error);
        this.loading = false;
        this.toastService.error('Erreur lors de la création du pays');
      }
    });
  }

  updatePays(id: number, data: UpdatePaysDto): void {
    this.loading = true;
    this.paysService.update(id, data).subscribe({
      next: () => {
        this.toastService.success('Pays modifié avec succès');
        this.closeModal();
        this.loadPays();
      },
      error: (error) => {
        console.error('Erreur lors de la modification du pays', error);
        this.loading = false;
        this.toastService.error('Erreur lors de la modification du pays');
      }
    });
  }

  confirmDelete(): void {
    if (!this.selectedPays) return;

    this.loading = true;
    this.paysService.delete(this.selectedPays.id).subscribe({
      next: () => {
        this.toastService.success('Pays supprimé avec succès');
        this.closeDeleteModal();
        this.loadPays();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du pays', error);
        this.loading = false;
        this.toastService.error('Erreur lors de la suppression du pays');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPays();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadPays();
    this.toastService.info('Recherche réinitialisée');
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

  get nomControl() {
    return this.paysForm.get('nom');
  }

  get codeControl() {
    return this.paysForm.get('code');
  }

  get filteredPays(): Pays[] {
    if (!this.searchTerm) return this.pays;
    
    const term = this.searchTerm.toLowerCase();
    return this.pays.filter(pays => 
      pays.nom.toLowerCase().includes(term) ||
      pays.code.toLowerCase().includes(term)
    );
  }
}