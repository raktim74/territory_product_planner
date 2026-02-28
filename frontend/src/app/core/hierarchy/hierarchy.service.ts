import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface OrgNodeTerritory {
    id: number;
    name: string;
    type: string;
}

export interface OrgNodeUser {
    id: number;
    email: string;
    role: any;
    territories: OrgNodeTerritory[];
}

export interface OrgTreeNode {
    hierarchy_id: number;
    user: OrgNodeUser;
    children: OrgTreeNode[];
}

@Injectable({
    providedIn: 'root'
})
export class HierarchyService {
    private apiUrl = 'http://localhost:8000/api/v1/hierarchy';

    // Using signals to manage the tree state
    public orgTree = signal<OrgTreeNode[]>([]);
    public isLoading = signal<boolean>(false);

    constructor(private http: HttpClient) { }

    fetchTree(): Observable<OrgTreeNode[]> {
        this.isLoading.set(true);
        return this.http.get<OrgTreeNode[]>(`${this.apiUrl}/tree`).pipe(
            tap(tree => {
                this.orgTree.set(tree);
                this.isLoading.set(false);
            })
        );
    }

    assignManager(userId: number, managerId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/assign`, { user_id: userId, manager_id: managerId });
    }
}
