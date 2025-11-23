import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  Publication, 
  PublicationStatut, 
  PublicationOffreService, 
  Produit 
} from '../../../shared/services/publication-offre.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-approbation-offre',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './offre.component.html',
  styleUrl: './offre.component.scss'
})
export class ApprobationOffreComponent implements OnInit {
  publications: Publication[] = [];
  selectedPublication: Publication | null = null;
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  
  showDetailModal = false;
  showConfirmModal = false;
  actionType: 'VALIDER' | 'REJETER' | null = null;

  statistics = {
    enAttente: 0,
    valide: 0,
    rejete: 0,
    total: 0
  };

  PublicationStatut = PublicationStatut;

  constructor(
    private publicationService: PublicationOffreService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPublications();
    this.loadStatistics();
  }

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  loadPublications(): void {
    this.loading = true;
    this.publicationService.getPublicationsForAdmin(
      this.currentPage,
      this.itemsPerPage,
      PublicationStatut.EN_ATTENTE
    ).subscribe({
      next: (response) => {
        this.publications = response.data;
        this.totalItems = response.meta.total;
        this.totalPages = response.meta.totalPages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des publications', error);
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des publications');
      }
    });
  }

  loadStatistics(): void {
    this.publicationService.getStatistics().subscribe({
      next: (response) => {
        this.statistics = {
          enAttente: response.data.publications.enAttente,
          valide: response.data.publications.valide,
          rejete: response.data.publications.rejete,
          total: response.data.totalPublications
        };
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques', error);
        this.toastService.error('Erreur lors du chargement des statistiques');
      }
    });
  }

  // ==========================================
  // MODALS
  // ==========================================

  openDetailModal(publication: Publication): void {
    this.selectedPublication = publication;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedPublication = null;
  }

  openConfirmModal(action: 'VALIDER' | 'REJETER'): void {
    this.actionType = action;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.actionType = null;
  }

  confirmAction(): void {
    if (!this.selectedPublication || !this.actionType) return;

    const statut = this.actionType === 'VALIDER' 
      ? PublicationStatut.VALIDE 
      : PublicationStatut.REJETE;

    this.loading = true;
    this.publicationService.updateStatut(this.selectedPublication.id, statut).subscribe({
      next: () => {
        const message = this.actionType === 'VALIDER' 
          ? 'Publication validée avec succès' 
          : 'Publication rejetée avec succès';
        
        this.toastService.success(message);
        this.closeConfirmModal();
        this.closeDetailModal();
        this.loadPublications();
        this.loadStatistics();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut', error);
        this.loading = false;
        this.toastService.error('Erreur lors de la mise à jour du statut');
      }
    });
  }

  // ==========================================
  // PAGINATION
  // ==========================================

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPublications();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ==========================================
  // CALCULS ET FORMATAGE
  // ==========================================

  calculateProductTotal(produit: Produit): number {
    return this.publicationService.calculateProductTotal(produit);
  }

  calculateOffreTotal(): number {
    if (!this.selectedPublication?.offre?.produits) return 0;
    return this.publicationService.calculateOffreTotal(this.selectedPublication.offre.produits);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('mg-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAuteurFullName(publication: Publication): string {
    if (!publication || !publication.auteur) {
      return 'Auteur inconnu';
    }
    return `${publication.auteur.prenomUtilisateur} ${publication.auteur.nomUtilisateur}`;
  }

  /**
   * Retourne le libellé de la catégorie d'un produit, même si c'est un id
   */
  getCategorieLibelle(produit: Produit): string {
    // Si produit.categorie est un id (number)
    if (typeof produit.categorie === 'number') {
      return '';
    }
    // Si produit.categorie est un objet avec nom
    if (produit.categorie && typeof produit.categorie === 'object') {
      return (produit.categorie as any).nom || (produit.categorie as any).libelle || '';
    }
    return '';
  }
}