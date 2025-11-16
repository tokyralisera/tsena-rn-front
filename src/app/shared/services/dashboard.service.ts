import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environment/environment';
import {
  ApiResponse,
  OffreStatisticsData,
  DemandeStatisticsData,
  DashboardStats,
} from '../interfaces/statistics.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private offresApiUrl = `${environment.apiUrl}/publications/offres`;
  private demandesApiUrl = `${environment.apiUrl}/publications/demandes`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les statistiques des offres
   */
  getOffresStatistics(): Observable<OffreStatisticsData> {
    return this.http
      .get<ApiResponse<OffreStatisticsData>>(`${this.offresApiUrl}/admin/statistics`)
      .pipe(map((response) => response.data));
  }

  /**
   * Récupérer les statistiques des demandes
   */
  getDemandesStatistics(): Observable<DemandeStatisticsData> {
    return this.http
      .get<ApiResponse<DemandeStatisticsData>>(`${this.demandesApiUrl}/admin/statistics`)
      .pipe(map((response) => response.data));
  }

  /**
   * Récupérer toutes les statistiques du dashboard
   */
  getAllStatistics(): Observable<DashboardStats> {
    return forkJoin({
      offres: this.getOffresStatistics(),
      demandes: this.getDemandesStatistics(),
    });
  }

  /**
   * Calculer le taux de conversion (demandes trouvées / total demandes)
   */
  getConversionRate(demandes: DemandeStatisticsData): number {
    const total =
      demandes.demandes.trouvee +
      demandes.demandes.nonTrouvee +
      demandes.demandes.expiree;
    
    if (total === 0) return 0;
    return (demandes.demandes.trouvee / total) * 100;
  }

  /**
   * Calculer le taux de vente (offres vendues / total offres)
   */
  getSalesRate(offres: OffreStatisticsData): number {
    const total = offres.offres.vendu + offres.offres.nonVendu;
    
    if (total === 0) return 0;
    return (offres.offres.vendu / total) * 100;
  }

  /**
   * Calculer le pourcentage de publications validées (offres)
   */
  getOffreValidationRate(offres: OffreStatisticsData): number {
    if (offres.totalPublications === 0) return 0;
    return (offres.publications.valide / offres.totalPublications) * 100;
  }

  /**
   * Calculer le pourcentage de publications validées (demandes)
   */
  getDemandeValidationRate(demandes: DemandeStatisticsData): number {
    if (demandes.totalPublications === 0) return 0;
    return (demandes.publications.valide / demandes.totalPublications) * 100;
  }

  /**
   * Formater un nombre avec séparateurs de milliers
   */
  formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    return new Intl.NumberFormat('fr-FR').format(num);
  }

  /**
   * Formater un pourcentage
   */
  formatPercentage(num: number | null | undefined): string {
    if (num === null || num === undefined || isNaN(num)) {
      return '0,0%';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num / 100);
  }

  /**
   * Formater une devise en Ariary (MGA)
   */
  formatCurrency(num: number): string {
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
    return `${formatted} Ar`;
  }

  /**
   * Formater une devise en Ariary abrégé
   */
  formatCurrencyCompact(num: number): string {
    if (num >= 1000000) {
      const millions = num / 1000000;
      return `${millions.toFixed(1)}M Ar`;
    } else if (num >= 1000) {
      const thousands = num / 1000;
      return `${thousands.toFixed(1)}K Ar`;
    }
    return `${num} Ar`;
  }
}