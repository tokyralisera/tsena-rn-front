export interface User {
  id: number;
  nomUtilisateur: string;
  prenomUtilisateur: string;
  telephone: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  langue: 'MALAGASY' | 'FRANCAIS' | 'ENGLISH';
  sexe: 'HOMME' | 'FEMME';
  NIF: string;
  STAT: string;
  isActive: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}
