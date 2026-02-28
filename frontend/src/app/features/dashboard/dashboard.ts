import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TerritoryService, Territory } from '../../core/territory/territory.service';
import { ProductService } from '../../core/product/product.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-shell">
      <main class="content">
        <header class="page-header">
          <div class="profile-brief">
            <h1>Command Center</h1>
            <p *ngIf="isAdmin()">Full enterprise orchestration & governance</p>
            <p *ngIf="!isAdmin()">Localized performance & area planning</p>
          </div>
          <div class="header-tools">
            <span class="user-role-tag">{{ authService.currentUser()?.role?.name || 'USER' }}</span>
            <span class="online-status">System Online</span>
          </div>
        </header>

        <!-- Admin/Manager Global Shortcuts -->
        <div class="features-grid" *ngIf="isAdmin() || authService.hasPermission('read:all')">
          <div class="feature-card territory" routerLink="/territory" *ngIf="authService.hasPermission('all') || authService.hasPermission('write:territory')">
            <div class="icon">🗺️</div>
            <div class="info">
              <h3>Global Territories</h3>
              <p>Configure enterprise boundaries and master mapping.</p>
            </div>
          </div>

          <div class="feature-card org" routerLink="/org-hierarchy" *ngIf="authService.hasPermission('all') || authService.hasPermission('write:hierarchy')">
            <div class="icon">👥</div>
            <div class="info">
              <h3>SOH Governance</h3>
              <p>Manage reporting lines and personnel assignments.</p>
            </div>
          </div>

          <div class="feature-card products" routerLink="/products">
            <div class="icon">📦</div>
            <div class="info">
              <h3>Master Catalog</h3>
              <p>Standard SKU management and global pricing.</p>
            </div>
          </div>
        </div>

        <section class="soh-section" *ngIf="!isAdmin()">
          <div class="section-header">
            <h3>My Areas of Responsibility</h3>
            <span class="count-pill">{{ myTerritories().length }} Active Areas</span>
          </div>

          <div class="territory-mini-grid">
            <div *ngFor="let t of myTerritories()" class="mini-area-card">
              <div class="area-type">{{ t.type }}</div>
              <h4>{{ t.name }}</h4>
              <div class="actions">
                <button class="btn-planning" routerLink="/products">
                  <span>💰</span> Plan Prices
                </button>
              </div>
            </div>
            
            <div *ngIf="myTerritories().length === 0" class="empty-planning">
              <p>No territories assigned to your profile yet.</p>
              <button class="btn-ghost" routerLink="/org-hierarchy">View Hierarchy</button>
            </div>
          </div>
        </section>

        <!-- Graphical Representation Section -->
        <section class="analytics-section">
          <div class="section-header">
            <h3>Performance Analytics</h3>
            <span class="count-pill">YTD Snapshot</span>
          </div>

          <div class="chart-card">
            <div class="chart-row" *ngFor="let data of chartData()">
              <div class="chart-label">
                <span class="label-name">{{ data.label }}</span>
                <span class="label-val">{{ data.value | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="data.percentage">
                   <div class="bar-glow"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="quick-stats">
          <div class="mini-stat">
            <label>Current Tenant</label>
            <div class="value">{{ authService.currentUser()?.tenant_id }}</div>
          </div>
          <div class="mini-stat">
            <label>Security Rank</label>
            <div class="value">{{ (authService.currentUser()?.role?.name || 'User').split('_')[0] }}</div>
          </div>
          <div class="mini-stat">
            <label>Last Updated</label>
            <div class="value">Just Now</div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-shell { min-height: 100vh; background: #020617; padding: 40px; color: #fff; }
    .content { max-width: 1200px; margin: 0 auto; }
    
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    h1 { font-size: 2.8rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px; }
    .profile-brief p { color: #64748b; font-size: 1.1rem; }
    
    .header-tools { display: flex; gap: 12px; align-items: center; }
    .user-role-tag { background: #1e293b; color: #94a3b8; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 8px; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.05); }
    .online-status { background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.2); text-transform: uppercase; }

    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 60px; }
    .feature-card { background: #0f172a; border-radius: 24px; padding: 32px; display: flex; align-items: center; gap: 24px; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .feature-card:hover { transform: translateY(-8px); background: #1e293b; border-color: #3b82f6; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.6); }
    .feature-card .icon { font-size: 32px; background: rgba(255,255,255,0.03); width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .feature-card h3 { font-size: 1.4rem; margin-bottom: 4px; }
    .feature-card p { color: #64748b; font-size: 0.95rem; line-height: 1.5; }

    .soh-section { margin-bottom: 60px; }
    .section-header { display: flex; align-items: center; gap: 15px; margin-bottom: 24px; }
    .section-header h3 { font-size: 1.5rem; font-weight: 700; }
    .count-pill { background: #3b82f6; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }

    .territory-mini-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .mini-area-card { background: #0f172a; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
    .area-type { font-size: 10px; color: #3b82f6; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
    .mini-area-card h4 { font-size: 1.2rem; margin-bottom: 20px; }
    .btn-planning { width: 100%; background: #1e293b; color: #fff; border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-planning:hover { background: #3b82f6; border-color: transparent; }

    .quick-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 32px; background: rgba(255,255,255,0.02); border-radius: 24px; }
    .mini-stat label { display: block; color: #475569; text-transform: uppercase; font-size: 10px; font-weight: 700; margin-bottom: 6px; }
    .mini-stat .value { font-size: 1.8rem; font-weight: 800; color: #fff; }

    .empty-planning { grid-column: 1 / -1; padding: 40px; text-align: center; background: rgba(255,255,255,0.01); border-radius: 24px; border: 1px dashed rgba(255,255,255,0.1); }
    .btn-ghost { background: none; border: 1px solid #3b82f6; color: #3b82f6; padding: 10px 24px; border-radius: 10px; margin-top: 15px; font-weight: 600; cursor: pointer; }

    /* Custom Premium CSS Chart Styles */
    .analytics-section { margin-bottom: 60px; }
    .chart-card { background: #0f172a; border-radius: 24px; padding: 40px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 24px; }
    .chart-row { display: flex; flex-direction: column; gap: 10px; }
    .chart-label { display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 700; }
    .label-name { color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; }
    .label-val { color: #fff; }
    
    .bar-track { width: 100%; height: 16px; background: #020617; border-radius: 10px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.02); }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa); border-radius: 10px; position: relative; transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1); }
    .bar-glow { position: absolute; right: 0; top: 0; width: 40px; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); animation: sweep 3s infinite linear; }
    
    @keyframes sweep { 0% { max-width: 0; right: 100%; } 100% { right: -40px; } }
  `]
})
export class Dashboard implements OnInit {
  public authService = inject(AuthService);
  private territoryService = inject(TerritoryService);
  private productService = inject(ProductService);

  myTerritories = signal<Territory[]>([]);
  chartData = signal<{ label: string, value: number, percentage: number }[]>([]);

  ngOnInit() {
    this.generateChartData();

    if (!this.isAdmin()) {
      this.territoryService.fetchMyTerritories().subscribe(data => {
        this.myTerritories.set(data);
      });
    }
  }

  generateChartData() {
    this.productService.getDashboardAnalytics().subscribe({
      next: (data) => {
        this.chartData.set(data);
      },
      error: (err) => {
        console.error('Failed to load dynamic analytics:', err);
      }
    });
  }

  isAdmin() {
    return this.authService.hasRole(['Admin']);
  }
}
