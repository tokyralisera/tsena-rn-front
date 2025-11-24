import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DashboardStats, DemandeStatisticsData, OffreStatisticsData } from '../../../shared/interfaces/statistics.model';
import { DashboardService } from '../../../shared/services/dashboard.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  trend?: number;
  color: string;
  description?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // État de chargement
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Données statistiques
  stats: DashboardStats | null = null;
  offresStats: OffreStatisticsData | null = null;
  demandesStats: DemandeStatisticsData | null = null;

  // Cartes statistiques principales
  statCards: StatCard[] = [];

  // Métriques calculées
  conversionRate = 0;
  salesRate = 0;
  offreValidationRate = 0;
  demandeValidationRate = 0;
  offreRejectionRate = 0;
  demandeRejectionRate = 0;
  demandeExpirationRate = 0;

  constructor(
    private dashboardService: DashboardService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger toutes les données du dashboard
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.dashboardService
      .getAllStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.offresStats = data.offres;
          this.demandesStats = data.demandes;

          // Vérifier la cohérence des données
          this.validateData();

          this.calculateMetrics();
          this.prepareStatCards();

          this.isLoading = false;
          console.log('✅ Statistiques chargées:', {
            offres: this.offresStats,
            demandes: this.demandesStats,
            metrics: {
              conversionRate: this.conversionRate,
              salesRate: this.salesRate,
              offreValidationRate: this.offreValidationRate,
              demandeValidationRate: this.demandeValidationRate,
            }
          });
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des statistiques:', error);
          this.hasError = true;
          this.errorMessage = 'Impossible de charger les statistiques du dashboard';
          this.isLoading = false;
          this.toastService.error('Erreur lors du chargement des statistiques');
        },
      });
  }

  /**
   * Valider la cohérence des données reçues
   */
  private validateData(): void {
    if (this.offresStats) {
      const offresValid = this.dashboardService.validatePublicationsData(this.offresStats);
      if (!offresValid) {
        console.warn('⚠️ Incohérence détectée dans les données des offres');
      }
    }

    if (this.demandesStats) {
      const demandesValid = this.dashboardService.validatePublicationsData(this.demandesStats);
      if (!demandesValid) {
        console.warn('⚠️ Incohérence détectée dans les données des demandes');
      }
    }
  }

  /**
   * Calculer les métriques
   */
  private calculateMetrics(): void {
    if (!this.offresStats || !this.demandesStats) return;

    this.conversionRate = this.dashboardService.getConversionRate(this.demandesStats);
    this.salesRate = this.dashboardService.getSalesRate(this.offresStats);
    this.offreValidationRate = this.dashboardService.getOffreValidationRate(this.offresStats);
    this.demandeValidationRate = this.dashboardService.getDemandeValidationRate(this.demandesStats);
    this.offreRejectionRate = this.dashboardService.getOffreRejectionRate(this.offresStats);
    this.demandeRejectionRate = this.dashboardService.getDemandeRejectionRate(this.demandesStats);
    this.demandeExpirationRate = this.dashboardService.getDemandeExpirationRate(this.demandesStats);
  }

  /**
   * Préparer les cartes statistiques
   */
  private prepareStatCards(): void {
    if (!this.offresStats || !this.demandesStats) return;

    this.statCards = [
      {
        title: 'Total Offres',
        value: this.formatNumber(this.offresStats.totalPublications),
        icon: 'shopping-bag',
        color: 'primary',
        description: 'Publications totales'
      },
      {
        title: 'Total Demandes',
        value: this.formatNumber(this.demandesStats.totalPublications),
        icon: 'search',
        color: 'info',
        description: 'Publications totales'
      },
      {
        title: 'Taux de Vente',
        value: this.dashboardService.formatPercentage(this.salesRate),
        icon: 'trending-up',
        trend: this.salesRate,
        color: 'success',
        description: 'Offres vendues'
      },
      {
        title: 'Taux de Conversion',
        value: this.dashboardService.formatPercentage(this.conversionRate),
        icon: 'check-circle',
        trend: this.conversionRate,
        color: 'warning',
        description: 'Demandes trouvées'
      },
    ];
  }

  /**
   * Rafraîchir les données
   */
  refreshData(): void {
    this.toastService.info('Actualisation des données...');
    this.loadDashboardData();
  }

  /**
   * Formater un nombre avec gestion du undefined
   */
  formatNumber(value: number | undefined): string {
    return this.dashboardService.formatNumber(value);
  }

  /**
   * Formater un pourcentage
   */
  formatPercentage(value: number | undefined): string {
    return this.dashboardService.formatPercentage(value);
  }

  /**
   * Obtenir une valeur sûre pour offres.vendu
   */
  getOffresVendu(): number {
    return this.offresStats?.offres?.vendu ?? 0;
  }

  /**
   * Obtenir une valeur sûre pour offres.nonVendu
   */
  getOffresNonVendu(): number {
    return this.offresStats?.offres?.nonVendu ?? 0;
  }

  /**
   * Obtenir une valeur sûre pour publications.valide (offres)
   */
  getOffresValide(): number {
    return this.offresStats?.publications?.valide ?? 0;
  }

  /**
   * Obtenir une valeur sûre pour publications.enAttente (offres)
   */
  getOffresEnAttente(): number {
    return this.offresStats?.publications?.enAttente ?? 0;
  }

  /**
   * Obtenir une valeur sûre pour publications.rejete (offres)
   */
  getOffresRejete(): number {
    return this.offresStats?.publications?.rejete ?? 0;
  }

  /**
   * Obtenir le total des offres (vendu + nonVendu)
   */
  getTotalOffres(): number {
    return this.getOffresVendu() + this.getOffresNonVendu();
  }

  /**
   * Obtenir une valeur sûre pour demandes.trouvee
   */
  getDemandesTrouvee(): number {
    return this.demandesStats?.demandes?.trouvee ?? 0;
  }

  /**
   * Obtenir une valeur sûre pour demandes.nonTrouvee
   */
  getDemandesNonTrouvee(): number {
    return this.demandesStats?.demandes?.nonTrouvee ?? 0;
  }

  /**
   * Obtenir une valeur sûre pour demandes.expiree
   */
  getDemandesExpiree(): number {
    return this.demandesStats?.demandes?.expiree ?? 0;
  }

  /**
   * Obtenir le total des demandes (trouvée + non trouvée + expirée)
   */
  getTotalDemandes(): number {
    return this.getDemandesTrouvee() + this.getDemandesNonTrouvee() + this.getDemandesExpiree();
  }

  /**
   * Obtenir une valeur sûre pour publications.valide (demandes)
   */
  getDemandesValide(): number {
    return this.demandesStats?.publications?.valide ?? 0;
  }

  /**
   * Obtenir une valeur sûre pour publications.enAttente (demandes)
   */
  getDemandesEnAttente(): number {
    return this.demandesStats?.publications?.enAttente ?? 0;
  }

  /**
   * Obtenir une valeur sûre pour publications.rejete (demandes)
   */
  getDemandesRejete(): number {
    return this.demandesStats?.publications?.rejete ?? 0;
  }

  /**
   * Vérifier si les données sont chargées
   */
  get hasData(): boolean {
    return this.offresStats !== null && this.demandesStats !== null;
  }
}