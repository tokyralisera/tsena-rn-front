export interface Utilisateur {
  id: number;
  nomUtilisateur: string;
  prenomUtilisateur: string;
  NIF: string;
  STAT: string;
  telephone: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  sexe: 'HOMME' | 'FEMME';
  langue: 'MALAGASY' | 'FRANCAIS' | 'ENGLISH';
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    offres?: number;
    demandes?: number;
  };
}

export const ROLE_LABELS: { [key: string]: string } = {
  'USER': 'Utilisateur',
  'ADMIN': 'Administrateur',
  'SUPERADMIN': 'Super Admin'
};

export const ROLE_COLORS: { [key: string]: string } = {
  'USER': 'info',
  'ADMIN': 'warning',
  'SUPERADMIN': 'error'
};

export const SEXE_LABELS: { [key: string]: string } = {
  'HOMME': 'Homme',
  'FEMME': 'Femme'
};

export const LANGUE_LABELS: { [key: string]: string } = {
  'MALAGASY': 'Malagasy',
  'FRANCAIS': 'Français',
  'ENGLISH': 'English'
};