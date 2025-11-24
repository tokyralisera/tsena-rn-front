import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  DemandeService, 
  Publication, 
  StatutDemande 
} from '../../../shared/services/publication-demande.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-approbations-demandes',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './demande.component.html',
  styleUrls: ['./demande.component.scss'],
})
export class ApprobationsDemandesComponent implements OnInit {
  demandes: Publication[] = [];
  selectedDemande: Publication | null = null;
  loading = false;
  
  showDetailModal = false;
  showConfirmModal = false;
  actionType: 'VALIDER' | 'REJETER' | null = null;

  // Statistiques
  totalDemandes = 0;
  demandesEnAttente = 0;

  StatutDemande = StatutDemande;

  constructor(
    private demandeService: DemandeService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDemandesEnAttente();
    this.loadStatistics();
  }

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  loadDemandesEnAttente(): void {
    this.loading = true;
    this.demandeService.searchDemandes({ 
      statut: 'EN_ATTENTE', 
      page: 1, 
      limit: 100 
    }).subscribe({
      next: (response) => {
        this.demandes = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des demandes:', error);
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des demandes');
      },
    });
  }

  loadStatistics(): void {
    // Total des demandes
    this.demandeService.searchDemandes({ page: 1, limit: 1 }).subscribe({
      next: (response) => {
        this.totalDemandes = response.meta.total;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques totales:', error);
        this.toastService.error('Erreur lors du chargement des statistiques');
      }
    });

    // Demandes en attente
    this.demandeService.searchDemandes({ 
      statut: 'EN_ATTENTE', 
      page: 1, 
      limit: 1 
    }).subscribe({
      next: (response) => {
        this.demandesEnAttente = response.meta.total;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des demandes en attente:', error);
      }
    });
  }

  // ==========================================
  // MODALS - DÉTAILS
  // ==========================================

  openDetailModal(demande: Publication): void {
    this.selectedDemande = demande;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedDemande = null;
  }

  // ==========================================
  // MODALS - CONFIRMATION
  // ==========================================

  openConfirmModal(action: 'VALIDER' | 'REJETER'): void {
    this.actionType = action;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.actionType = null;
  }

  confirmAction(): void {
    if (!this.selectedDemande || !this.actionType) return;

    if (this.actionType === 'VALIDER') {
      this.validerDemande(this.selectedDemande.id);
    } else {
      this.rejeterDemande(this.selectedDemande.id);
    }
  }

  // ==========================================
  // ACTIONS (VALIDER / REJETER)
  // ==========================================

  validerDemande(id: number): void {
    this.loading = true;
    this.demandeService.updateStatut(id, 'VALIDE').subscribe({
      next: () => {
        this.toastService.success('Demande validée avec succès !');
        this.closeConfirmModal();
        this.closeDetailModal();
        this.loadDemandesEnAttente();
        this.loadStatistics();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la validation:', error);
        this.loading = false;
        this.toastService.error('Erreur lors de la validation de la demande');
      },
    });
  }

  rejeterDemande(id: number): void {
    this.loading = true;
    this.demandeService.updateStatut(id, 'REJETE').subscribe({
      next: () => {
        this.toastService.success('Demande rejetée avec succès');
        this.closeConfirmModal();
        this.closeDetailModal();
        this.loadDemandesEnAttente();
        this.loadStatistics();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du rejet:', error);
        this.loading = false;
        this.toastService.error('Erreur lors du rejet de la demande');
      },
    });
  }

  // ==========================================
  // FORMATAGE ET HELPERS
  // ==========================================

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatBudget(min?: number, max?: number): string {
    if (!min && !max) return 'Non spécifié';
    
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('mg-MG', {
        style: 'currency',
        currency: 'MGA',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    };

    if (min && max) {
      return `${formatNumber(min)} - ${formatNumber(max)}`;
    }
    if (min) {
      return `À partir de ${formatNumber(min)}`;
    }
    if (max) {
      return `Jusqu'à ${formatNumber(max)}`;
    }
    return 'Non spécifié';
  }

  getStatutClass(statut: StatutDemande): string {
    switch (statut) {
      case StatutDemande.TROUVEE:
        return 'success';
      case StatutDemande.EXPIREE:
        return 'danger';
      case StatutDemande.NON_TROUVEE:
      default:
        return 'warning';
    }
  }

  getStatutLabel(statut: StatutDemande): string {
    switch (statut) {
      case StatutDemande.TROUVEE:
        return 'Trouvée';
      case StatutDemande.EXPIREE:
        return 'Expirée';
      case StatutDemande.NON_TROUVEE:
      default:
        return 'Non trouvée';
    }
  }
}