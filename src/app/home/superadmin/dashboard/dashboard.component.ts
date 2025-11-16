import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DashboardStats, DemandeStatisticsData, OffreStatisticsData } from '../../../shared/interfaces/statistics.model';
import { DashboardService } from '../../../shared/services/dashboard.service';


interface StatCard {
  title: string;
  value: string;
  icon: string;
  trend?: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
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

  constructor(private dashboardService: DashboardService) {}

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

          this.calculateMetrics();
          this.prepareStatCards();

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques:', error);
          this.hasError = true;
          this.errorMessage = 'Impossible de charger les statistiques du dashboard';
          this.isLoading = false;
        },
      });
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
  }

  /**
   * Préparer les cartes statistiques
   */
  private prepareStatCards(): void {
    if (!this.offresStats || !this.demandesStats) return;

    this.statCards = [
      {
        title: 'Total Offres',
        value: this.dashboardService.formatNumber(this.offresStats.totalPublications),
        icon: 'shopping-bag',
        color: 'primary',
      },
      {
        title: 'Total Demandes',
        value: this.dashboardService.formatNumber(this.demandesStats.totalPublications),
        icon: 'search',
        color: 'info',
      },
      {
        title: 'Taux de Vente',
        value: this.dashboardService.formatPercentage(this.salesRate),
        icon: 'trending-up',
        trend: this.salesRate,
        color: 'success',
      },
      {
        title: 'Demandes Trouvées',
        value: this.dashboardService.formatPercentage(this.conversionRate),
        icon: 'check-circle',
        trend: this.conversionRate,
        color: 'warning',
      },
    ];
  }

  /**
   * Rafraîchir les données
   */
  refreshData(): void {
    this.loadDashboardData();
  }

  /**
   * Formater un nombre avec gestion du undefined
   */
  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    return this.dashboardService.formatNumber(value);
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
   * Obtenir une valeur sûre pour offres.expiree
   */
  // getOffresExpiree(): number {
  //   return this.offresStats?.offres?.expiree ?? 0;
  // }

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
}