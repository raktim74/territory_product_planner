import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TerritoryService } from '../../../core/territory/territory.service';

declare var L: any;

@Component({
    selector: 'app-territory-map',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="map-page">
      <header class="header">
        <div class="header-left">
          <button class="back-link" routerLink="/territory">← Back to List</button>
          <h2>Geographic Command</h2>
          <p>Visualize and manage territory boundaries on the interactive map.</p>
        </div>
        <div class="header-right">
          <div class="map-stats">
            <div class="stat-pill">
              <span class="dot active"></span>
              {{ territories().length }} Active Regions
            </div>
          </div>
        </div>
      </header>

      <div class="map-wrapper card">
        <div id="territory-map-canvas"></div>
        
        <div class="map-sidebar" *ngIf="selectedTerritory">
          <div class="sidebar-header">
             <button class="close-btn" (click)="selectedTerritory = null">×</button>
             <h3>{{ selectedTerritory.name }}</h3>
             <span class="badge" [class]="selectedTerritory.type.toLowerCase()">{{ selectedTerritory.type }}</span>
          </div>
          <div class="sidebar-body">
            <div class="info-row">
              <label>ID</label>
              <span>#{{ selectedTerritory.id }}</span>
            </div>
            <div class="info-row">
              <label>Status</label>
              <span class="status-indicator active">Operational</span>
            </div>
            <div class="actions">
              <button class="btn-primary-sm" [routerLink]="['/territory/edit', selectedTerritory.id]">Edit Boundary</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .map-page { padding: 40px; height: 100vh; display: flex; flex-direction: column; background: #0f172a; }
    .header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .back-link { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 0; margin-bottom: 8px; font-weight: 600; font-size: 0.9rem; }
    h2 { font-size: 2rem; color: #fff; margin: 0; }
    p { color: #94a3b8; margin: 4px 0 0 0; }
    
    .map-stats { display: flex; gap: 12px; }
    .stat-pill { 
      background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.05);
      padding: 8px 16px; border-radius: 99px; color: #f8fafc; font-size: 0.85rem;
      display: flex; align-items: center; gap: 8px; font-weight: 600;
    }
    .dot.active { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }

    .map-wrapper { 
      flex: 1; position: relative; overflow: hidden; border-radius: 20px; 
      border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
    }
    #territory-map-canvas { width: 100%; height: 100%; z-index: 1; background: #1e293b; }

    .map-sidebar {
      position: absolute; top: 20px; right: 20px; width: 320px; 
      background: rgba(30,41,59,0.9); backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
      z-index: 1000; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .sidebar-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); position: relative; }
    .close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }
    .sidebar-header h3 { margin: 0 0 8px 0; color: #fff; font-size: 1.25rem; }

    .sidebar-body { padding: 20px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .info-row label { color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    .info-row span { color: #f8fafc; font-weight: 500; font-size: 0.95rem; }

    .actions { margin-top: 24px; }
    .btn-primary-sm { 
      width: 100%; background: #3b82f6; color: white; border: none; 
      padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; 
      transition: all 0.2s;
    }
    .btn-primary-sm:hover { background: #2563eb; transform: translateY(-1px); }

    /* Customizing Leaflet for Dark UI */
    ::ng-deep .leaflet-container { background: #0f172a !important; }
    ::ng-deep .leaflet-bar a { background-color: #1e293b !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.1) !important; }
    ::ng-deep .leaflet-control-attribution { background: rgba(15,23,42,0.8) !important; color: #64748b !important; }
  `]
})
export class TerritoryMap implements OnInit, AfterViewInit, OnDestroy {
    private territoryService = inject(TerritoryService);
    public territories = this.territoryService.territories;
    private map: any;
    public selectedTerritory: any = null;

    ngOnInit() {
        this.territoryService.fetchTerritories().subscribe();
    }

    ngAfterViewInit() {
        setTimeout(() => this.initMap(), 500);
    }

    private initMap() {
        // Standard Dark Theme Tiles from CartoDB or similar
        this.map = L.map('territory-map-canvas', {
            center: [20, 0],
            zoom: 2,
            zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB'
        }).addTo(this.map);

        this.renderTerritories();
    }

    private renderTerritories() {
        const list = this.territories();
        if (list.length === 0) return;

        // For Demo: Add some randomized circular boundaries if no real polygons exist
        list.forEach((t, index) => {
            const lat = 20 + (Math.random() - 0.5) * 40;
            const lon = (Math.random() - 0.5) * 100;

            const color = t.type === 'COUNTRY' ? '#3b82f6' : (t.type === 'STATE' ? '#10b981' : '#f59e0b');

            const circle = L.circle([lat, lon], {
                color: color,
                fillColor: color,
                fillOpacity: 0.2,
                radius: 500000 / (index + 1)
            }).addTo(this.map);

            circle.on('click', () => {
                this.selectedTerritory = t;
                this.map.setView([lat, lon], 4);
            });

            circle.bindTooltip(t.name, { permanent: false, direction: 'top' });
        });
    }

    ngOnDestroy() {
        if (this.map) {
            this.map.remove();
        }
    }
}
