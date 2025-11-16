// Réponse wrapper du backend
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

// Structure des statistiques Offres
export interface OffreStatisticsData {
  parCategorie: any;
  parMois: any;
  totalPublications: number;
  publications: {
    enAttente: number;
    valide: number;
    rejete: number;
  };
  offres: {
    expiree: any;
    vendu: number;
    nonVendu: number;
  };
}

// Structure des statistiques Demandes
export interface DemandeStatisticsData {
  parMois: any;
  totalPublications: number;
  publications: {
    enAttente: number;
    valide: number;
    rejete: number;
  };
  demandes: {
    trouvee: number;
    nonTrouvee: number;
    expiree: number;
  };
}

// Pour le dashboard combiné
export interface DashboardStats {
  offres: OffreStatisticsData;
  demandes: DemandeStatisticsData;
}