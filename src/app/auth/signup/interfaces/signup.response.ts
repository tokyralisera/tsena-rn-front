export interface SignupResponse {
    success: boolean;
    message : string;
    data :
    {
        id: number;
        nomUtilisateur : string;
        prenomUtilisateur: string;
        telephone: string;
        role: string;
        sexe: string;
        langue: string;
        NIF: string;
        STAT: string;
        createdAt: string;
        updatedAt: string;
    }
}