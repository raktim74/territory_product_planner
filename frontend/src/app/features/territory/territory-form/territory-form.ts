import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TerritoryService } from '../../../core/territory/territory.service';

@Component({
  selector: 'app-territory-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-page">
      <div class="form-header">
        <button class="back-link" routerLink="/territory">← Back to Territories</button>
        <h2>{{ isEdit ? 'Edit Region' : 'Create Region' }}</h2>
        <p>{{ isEdit ? 'Modify the existing operational boundary.' : 'Define a new operational boundary.' }}</p>
      </div>

      <div class="premium-card">
        <form [formGroup]="territoryForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="form-group full">
              <label>Region Name</label>
              <input type="text" formControlName="name" placeholder="e.g. South East Cluster">
            </div>

            <div class="form-group">
              <label>Classification Type</label>
              <select formControlName="type">
                <option value="COUNTRY">Country Agent</option>
                <option value="STATE">State Boundary</option>
                <option value="DISTRICT">Zone/District</option>
                <option value="CITY">City Hub</option>
                <option value="ZIP">Zip Code</option>
              </select>
            </div>

            <div class="form-group">
              <label>Parent Hierarchy</label>
              <select formControlName="parent_id">
                <option [ngValue]="null">Top Level Node</option>
                <option *ngFor="let t of territoryService.territories()" [value]="t.id">
                  {{ t.name }} ({{ t.type }})
                </option>
              </select>
            </div>
          </div>

          <div class="form-footer">
            <button type="button" class="btn-secondary" routerLink="/territory">Discard</button>
            <button type="submit" class="btn-primary" [disabled]="territoryForm.invalid">
              {{ isEdit ? 'Update Region' : 'Deploy Region' }}
            </button>
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

    .form-footer { 
      display: flex; gap: 16px; justify-content: flex-end; 
      margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05);
    }
  `]
})
export class TerritoryForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public territoryService = inject(TerritoryService);

  isEdit = false;
  territoryId?: number;

  territoryForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    type: ['STATE', Validators.required],
    parent_id: [null]
  });

  ngOnInit() {
    this.territoryService.fetchTerritories().subscribe();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.territoryId = +id;
      this.territoryService.getTerritory(this.territoryId).subscribe({
        next: (t) => {
          this.territoryForm.patchValue({
            name: t.name,
            type: t.type,
            parent_id: t.parent_id
          });
        }
      });
    }
  }

  onSubmit() {
    if (this.territoryForm.invalid) return;

    if (this.isEdit && this.territoryId) {
      this.territoryService.updateTerritory(this.territoryId, this.territoryForm.value).subscribe({
        next: () => this.router.navigate(['/territory']),
        error: (err) => alert('Update failed: ' + err.message)
      });
    } else {
      this.territoryService.createTerritory(this.territoryForm.value).subscribe({
        next: () => this.router.navigate(['/territory']),
        error: (err) => alert('Deployment failed: ' + err.message)
      });
    }
  }
}
