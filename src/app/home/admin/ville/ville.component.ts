import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateVilleDto, UpdateVilleDto, Ville, VilleService } from '../../../shared/services/ville.service';
import { Pays, PaysService } from '../../../shared/services/pays.service';


@Component({
  selector: 'app-ville',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './ville.component.html',
  styleUrl: './ville.component.scss'
})
export class VilleComponent implements OnInit {
  villes: Ville[] = [];
  pays: Pays[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  searchTerm = '';
  selectedPaysFilter: number | null = null;

  villeForm: FormGroup;
  isEditMode = false;
  selectedVille: Ville | null = null;
  showModal = false;
  showDeleteModal = false;

  constructor(
    private villeService: VilleService,
    private paysService: PaysService,
    private fb: FormBuilder
  ) {
    this.villeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      codePostal: [''],
      paysId: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadPays();
    this.loadVilles();
  }

  loadPays(): void {
    this.paysService.getAll(1, 1000).subscribe({
      next: (response) => {
        this.pays = response.data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des pays', error);
        this.showToast('Erreur lors du chargement des pays', 'error');
      }
    });
  }

  loadVilles(): void {
    this.loading = true;
    this.villeService.getAll(this.selectedPaysFilter || undefined).subscribe({
      next: (response: any) => {
        this.villes = response.data;
        this.totalItems = response.data.length;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des villes', error);
        this.loading = false;
        this.showToast('Erreur lors du chargement des villes', 'error');
      }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedVille = null;
    this.villeForm.reset();
    this.showModal = true;
  }

  openEditModal(ville: Ville): void {
    this.isEditMode = true;
    this.selectedVille = ville;
    this.villeForm.patchValue({
      nom: ville.nom,
      codePostal: ville.codePostal || '',
      paysId: ville.paysId
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.villeForm.reset();
    this.selectedVille = null;
  }

  openDeleteModal(ville: Ville): void {
    this.selectedVille = ville;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedVille = null;
  }

  onSubmit(): void {
    if (this.villeForm.invalid) {
      this.villeForm.markAllAsTouched();
      return;
    }

    const formData = this.villeForm.value;
    // Nettoyer le code postal s'il est vide
    if (!formData.codePostal || formData.codePostal.trim() === '') {
      delete formData.codePostal;
    }

    if (this.isEditMode && this.selectedVille) {
      this.updateVille(this.selectedVille.id, formData);
    } else {
      this.createVille(formData);
    }
  }

  createVille(data: CreateVilleDto): void {
    this.loading = true;
    this.villeService.create(data).subscribe({
      next: () => {
        this.showToast('Ville créée avec succès', 'success');
        this.closeModal();
        this.loadVilles();
      },
      error: (error) => {
        console.error('Erreur lors de la création de la ville', error);
        this.loading = false;
        this.showToast('Erreur lors de la création de la ville', 'error');
      }
    });
  }

  updateVille(id: number, data: UpdateVilleDto): void {
    this.loading = true;
    this.villeService.update(id, data).subscribe({
      next: () => {
        this.showToast('Ville modifiée avec succès', 'success');
        this.closeModal();
        this.loadVilles();
      },
      error: (error) => {
        console.error('Erreur lors de la modification de la ville', error);
        this.loading = false;
        this.showToast('Erreur lors de la modification de la ville', 'error');
      }
    });
  }

  confirmDelete(): void {
    if (!this.selectedVille) return;

    this.loading = true;
    this.villeService.delete(this.selectedVille.id).subscribe({
      next: () => {
        this.showToast('Ville supprimée avec succès', 'success');
        this.closeDeleteModal();
        this.loadVilles();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de la ville', error);
        this.loading = false;
        this.showToast('Erreur lors de la suppression de la ville', 'error');
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadVilles();
  }

  onFilterByPays(): void {
    this.currentPage = 1;
    this.loadVilles();
  }

  clearFilter(): void {
    this.selectedPaysFilter = null;
    this.currentPage = 1;
    this.loadVilles();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadVilles();
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

  getPaysName(paysId: number): string {
    const pays = this.pays.find(p => p.id === paysId);
    return pays ? pays.nom : 'Inconnu';
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  get nomControl() {
    return this.villeForm.get('nom');
  }

  get codePostalControl() {
    return this.villeForm.get('codePostal');
  }

  get paysIdControl() {
    return this.villeForm.get('paysId');
  }
}