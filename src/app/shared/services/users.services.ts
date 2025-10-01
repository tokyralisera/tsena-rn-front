import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UpdateProfileRequest, UpdateProfileResponse, UserProfile } from "../interfaces/profil.interface";

@Injectable({providedIn: 'root'})
export class UsersService{
    private http = inject(HttpClient)
    private apiUrl = 'http://localhost:3000/users'

    getProfile(): Observable<{success: boolean, data: UserProfile}>{
        return this.http.get<{success: boolean, data: UserProfile}>(`${this.apiUrl}/profile`)
    }

    updateProfile(profileData: UpdateProfileRequest): Observable<UpdateProfileResponse>{
        return this.http.put<UpdateProfileResponse>(`${this.apiUrl}/profile`, profileData)
    }
}