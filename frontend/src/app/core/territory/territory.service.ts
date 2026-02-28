import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Territory {
    id: number;
    name: string;
    type: string;
    parent_id?: number | null;
    assigned_users: number[];
    is_active: boolean;
    map_polygon?: any;
}

@Injectable({
    providedIn: 'root'
})
export class TerritoryService {
    private apiUrl = 'http://localhost:8000/api/v1/territory';

    // Signals for reactive territory state
    public territories = signal<Territory[]>([]);
    public isLoading = signal<boolean>(false);

    constructor(private http: HttpClient) { }

    fetchTerritories(): Observable<Territory[]> {
        this.isLoading.set(true);
        return this.http.get<Territory[]>(this.apiUrl).pipe(
            tap(data => {
                this.territories.set(data);
                this.isLoading.set(false);
            })
        );
    }

    createTerritory(data: { name: string, type: string, parent_id?: number | null }) {
        return this.http.post<Territory>(this.apiUrl, data);
    }

    assignUserToTerritory(userId: number, territoryId: number) {
        return this.http.post(`${this.apiUrl}/assign`, {
            user_id: userId,
            territory_id: territoryId
        });
    }

    revokeTerritory(territoryId: number) {
        return this.http.delete(`${this.apiUrl}/assign/${territoryId}`);
    }

    getTerritory(id: number) {
        return this.http.get<Territory>(`${this.apiUrl}/${id}`);
    }

    updateTerritory(id: number, data: any) {
        return this.http.put<Territory>(`${this.apiUrl}/${id}`, data);
    }

    deleteTerritory(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    fetchMyTerritories(): Observable<Territory[]> {
        return this.http.get<Territory[]>(`${this.apiUrl}/me/assigned`);
    }
}
