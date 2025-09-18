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
}
