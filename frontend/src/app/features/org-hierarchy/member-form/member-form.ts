import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { HierarchyService } from '../../../core/hierarchy/hierarchy.service';
import { TerritoryService, Territory } from '../../../core/territory/territory.service';

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-page">
      <div class="form-header">
        <button class="back-link" routerLink="/org-hierarchy">← Back to Hierarchy</button>
        <h2>Onboard Strategic Asset</h2>
        <p>Integrate a new officer into the corporate reporting structure and mapped areas.</p>
      </div>

      <div class="premium-card">
        <form [formGroup]="memberForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="form-group full">
              <label>Corporate Identity (Email)</label>
              <input type="email" formControlName="email" placeholder="e.g. general.doe@acmecorp.com">
            </div>

            <div class="form-group">
              <label>Initial Access Key (Password)</label>
              <input type="password" formControlName="password">
            </div>

            <div class="form-group">
              <label>Command Role</label>
              <select formControlName="role_id">
                <option value="1">System Administrator</option>
                <option value="2">Regional Commander</option>
                <option value="3">Zonal Overseer</option>
                <option value="4">Territory Specialist</option>
                <option value="5">Standard Field Agent</option>
              </select>
            </div>

            <div class="form-group full">
              <label>Reporting Manager (Oracle)</label>
              <select formControlName="manager_id">
                <option [ngValue]="null">Independent / Root Node</option>
                <option *ngFor="let user of users" [value]="user.id">
                  {{ user.email }} ({{ user.role?.name || 'USER' }})
                </option>
              </select>
            </div>

            <div class="form-group full">
              <label>Primary Area Assignment (Sales Org Mapping)</label>
              <select formControlName="territory_id">
                <option [ngValue]="null">No Area Assigned Yet</option>
                <option *ngFor="let t of territories" [value]="t.id">
                  {{ t.name }} ({{ t.type }})
                </option>
              </select>
            </div>
          </div>

          <div class="form-footer" *ngIf="!isSubmitting">
            <button type="button" class="btn-secondary" routerLink="/org-hierarchy">Retreat</button>
            <button type="submit" class="btn-primary" [disabled]="memberForm.invalid">Deploy Member</button>
          </div>
          
          <div class="submitting-state" *ngIf="isSubmitting">
             <span class="loader"></span> Syncing with Central Command...
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page { padding: 60px; max-width: 800px; margin: 0 auto; }
    .form-header { margin-bottom: 40px; }
    .back-link { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 0; margin-bottom: 16px; font-weight: 600; }
    h2 { font-size: 2rem; color: #fff; margin-bottom: 8px; }
    
    .premium-card { 
      background: #1e293b; padding: 40px; border-radius: 24px; 
      border: 1px solid rgba(255,255,255,0.05);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .form-group.full { grid-column: span 2; }

    .form-group label { display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; color: #94a3b8; }
    .form-group input, .form-group select { 
      width: 100%; padding: 12px 16px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); 
      border-radius: 12px; color: #fff; outline: none; transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group select:focus { border-color: #3b82f6; }

    .form-footer { 
      display: flex; gap: 16px; justify-content: flex-end; 
      margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05);
    }

    .submitting-state { text-align: center; color: #3b82f6; font-weight: 700; margin-top: 20px; }
  `]
})
export class MemberForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private hierarchyService = inject(HierarchyService);
  private territoryService = inject(TerritoryService);

  users: any[] = [];
  territories: Territory[] = [];
  isSubmitting = false;

  memberForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['Welcome123', Validators.required],
    role_id: [5, Validators.required],
    manager_id: [null],
    territory_id: [null],
    tenant_id: [1]
  });

  ngOnInit() {
    this.authService.getAllUsers().subscribe(users => {
      this.users = users;
    });

    this.territoryService.fetchTerritories().subscribe(data => {
      this.territories = data;
    });

    // Set tenant_id from current session
    const user = this.authService.currentUser();
    if (user) {
      this.memberForm.patchValue({ tenant_id: user.tenant_id });
    }
  }

  onSubmit() {
    if (this.memberForm.invalid) return;

    this.isSubmitting = true;
    const formVals = this.memberForm.value;

    // Ensure numeric types for backend validation
    const { manager_id, territory_id, ...regData } = formVals;
    regData.role_id = Number(regData.role_id);
    regData.tenant_id = Number(regData.tenant_id);

    // 1. Register User
    this.http.post<any>('http://localhost:8000/api/v1/auth/register', regData).subscribe({
      next: (newUser) => {
        const userId = Number(newUser.id);
        const assignmentTasks = [];

        // 2. Hierarchy Assignment
        if (manager_id) {
          assignmentTasks.push(
            this.hierarchyService.assignManager(userId, Number(manager_id)).pipe(
              catchError(err => {
                console.error('Hierarchy assignment failed', err);
                return of(null);
              })
            )
          );
        }

        // 3. Territory/Area Mapping
        if (territory_id) {
          assignmentTasks.push(
            this.territoryService.assignUserToTerritory(userId, Number(territory_id)).pipe(
              catchError(err => {
                console.error('Territory assignment failed', err);
                return of(null);
              })
            )
          );
        }

        if (assignmentTasks.length > 0) {
          forkJoin(assignmentTasks).subscribe({
            next: () => this.finish(),
            error: () => this.finish() // Continue anyway as user is already created
          });
        } else {
          this.finish();
        }
      },
      error: (err) => {
        console.error('Registration error:', err);
        const msg = err.error?.detail || err.message || 'Unknown error';
        alert('Onboarding failed: ' + msg);
        this.isSubmitting = false;
      }
    });
  }

  private finish() {
    this.isSubmitting = false;
    this.router.navigate(['/org-hierarchy']);
  }
}
