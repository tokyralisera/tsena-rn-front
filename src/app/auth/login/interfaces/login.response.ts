export interface User {
  id: number;
  nomUtilisateur: string;
  prenomUtilisateur: string;
  telephone: string;
  role: string;
  langue: string;
  sexe: string;
  isActive: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}
