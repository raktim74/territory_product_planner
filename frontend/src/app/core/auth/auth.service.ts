import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

export interface UserProfile {
  id: number;
  email: string;
  tenant_id: number;
  role_id: number;
  role?: Role;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/v1/auth';

  // Using Signals for reactive state management of the user session!
  public currentUser = signal<UserProfile | null>(null);
  public isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.checkInitialAuth();
  }

  private checkInitialAuth() {
    const token = this.getToken();
    if (token) {
      this.fetchUserProfile().subscribe();
    }
  }

  login(credentials: any): Observable<any> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, formData).pipe(
      tap(response => {
        this.setToken(response.access_token);
        this.fetchUserProfile().subscribe(() => {
          this.router.navigate(['/dashboard']);
        });
      })
    );
  }

  fetchUserProfile(): Observable<UserProfile | null> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap(profile => {
        this.currentUser.set(profile);
        this.isAuthenticated.set(true);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.logout();
        }
        return of(null);
      })
    );
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  hasRole(allowedRoles: string[]): boolean {
    const user = this.currentUser();
    if (!user || !user.role) return false;
    const roleName = user.role.name.toUpperCase();
    if (roleName === 'ADMIN') return true;
    return allowedRoles.map(r => r.toUpperCase()).includes(roleName);
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    if (!user || !user.role) return false;
    if (user.role.name.toUpperCase() === 'ADMIN') return true;
    return user.role.permissions.includes(permission);
  }
}
