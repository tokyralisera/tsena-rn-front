import { Utilisateur } from './utilisateur.interface';

export interface UpdateProfileRequest {
  nomUtilisateur: string;
  prenomUtilisateur: string;
  NIF: string;
  STAT: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  sexe: 'HOMME' | 'FEMME';
  langue: 'MALAGASY' | 'FRANCAIS' | 'ENGLISH';
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: Utilisateur;
}

export interface UserProfile {
  id: number;
  nomUtilisateur: string;
  prenomUtilisateur: string;
  telephone: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  sexe: 'HOMME' | 'FEMME';
  langue: 'MALAGASY' | 'FRANCAIS' | 'ENGLISH';
  NIF: string;
  STAT: string;
  createdAt: string;
  updatedAt: string;
}
