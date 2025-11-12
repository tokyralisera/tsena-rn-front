import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeService, Publication, StatutDemande } from '../../../shared/services/publication-demande.service';


@Component({
  selector: 'app-approbations-demandes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demande.component.html',
  styleUrls: ['./demande.component.scss'],
})
export class ApprobationsDemandesComponent implements OnInit {
  demandes: Publication[] = [];
  loading = false;
  selectedDemande: Publication | null = null;
  showDetailModal = false;

  // Statistiques
  totalDemandes = 0;
  demandesEnAttente = 0;

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.loadDemandesEnAttente();
    this.loadStatistics();
  }

  loadDemandesEnAttente(): void {
    this.loading = true;
    this.demandeService.searchDemandes({ statut: 'EN_ATTENTE', page: 1, limit: 100 }).subscribe({
      next: (response) => {
        this.demandes = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.loading = false;
      },
    });
  }

  loadStatistics(): void {
    this.demandeService.searchDemandes({ page: 1, limit: 1 }).subscribe({
      next: (response) => {
        this.totalDemandes = response.meta.total;
      },
    });

    this.demandeService.searchDemandes({ statut: 'EN_ATTENTE', page: 1, limit: 1 }).subscribe({
      next: (response) => {
        this.demandesEnAttente = response.meta.total;
      },
    });
  }

  openDetailModal(demande: Publication): void {
    this.selectedDemande = demande;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedDemande = null;
  }

  validerDemande(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir valider cette demande ?')) {
      // Appel API pour valider (à implémenter dans le service)
      this.demandeService.updateStatut(id, 'VALIDE').subscribe({
        next: () => {
          alert('Demande validée avec succès !');
          this.closeDetailModal();
          this.loadDemandesEnAttente();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('Erreur lors de la validation');
        },
      });
    }
  }

  rejeterDemande(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) {
      // Appel API pour rejeter (à implémenter dans le service)
      this.demandeService.updateStatut(id, 'REJETE').subscribe({
        next: () => {
          alert('Demande rejetée');
          this.closeDetailModal();
          this.loadDemandesEnAttente();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('Erreur lors du rejet');
        },
      });
    }
  }

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
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} Ar`;
    if (min) return `À partir de ${min.toLocaleString()} Ar`;
    if (max) return `Jusqu'à ${max.toLocaleString()} Ar`;
    return '';
  }

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
}