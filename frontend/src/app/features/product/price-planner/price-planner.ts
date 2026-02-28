import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, RegionalPricing } from '../../../core/product/product.service';
import { TerritoryService, Territory } from '../../../core/territory/territory.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-price-planner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="product-brief">
            <span class="sku-tag">{{ product().sku }}</span>
            <h2>Regional Planning Dashboard</h2>
            <p>Define multi-tier pricing strategies for <strong>{{ product().name }}</strong></p>
          </div>
          <button class="close-btn" (click)="onClose()">×</button>
        </header>

        <div class="modal-body">
          <div class="planning-toolbar">
            <div class="section-title">{{ planningMode() === 'price' ? 'Financial Strategy' : (planningMode() === 'quantity' ? 'Operational Forecasting' : 'Performance Tracking (Forecasts)') }}</div>
            <div class="mode-toggle">
              <button [class.active]="planningMode() === 'price'" (click)="planningMode.set('price')">💰 Price</button>
              <button [class.active]="planningMode() === 'quantity'" (click)="planningMode.set('quantity')">📦 Quantity</button>
              <button [class.active]="planningMode() === 'performance'" (click)="planningMode.set('performance')">📈 Performance</button>
            </div>
          </div>
          
          <div class="planning-section">
            <div class="planning-table-container">
              <table class="planning-table">
                <thead>
                  <tr>
                    <th>Territory / Zone</th>
                    <th>Reference</th>
                    <ng-container *ngIf="planningMode() === 'price'">
                      <th>Master Planning (Override)</th>
                      <th>Channel Planning (Sell-in)</th>
                      <th>Consumer Planning (Sell-out)</th>
                    </ng-container>
                    <ng-container *ngIf="planningMode() === 'quantity'">
                      <th>Target Quantity (Sell-in)</th>
                      <th>Forecast Quantity (Sell-out)</th>
                    </ng-container>
                    <ng-container *ngIf="planningMode() === 'performance'">
                      <th>MTD Forecast (Month)</th>
                      <th>QTD Forecast (Quarter)</th>
                      <th>YTD Forecast (Year)</th>
                    </ng-container>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let t of availableTerritories()" 
                      [class.assigned]="isAssigned(t.id)"
                      [class.read-only]="!isAssigned(t.id) && !isAdmin()">
                    
                    <td class="area-col">
                      <div class="area-info">
                        <span class="type-badge">{{ t.type }}</span>
                        <strong>{{ t.name }}</strong>
                        <span class="ownership" *ngIf="isAssigned(t.id)">✓ Assigned</span>
                      </div>
                    </td>

                    <td class="ref-col">
                      <div class="ref-item">
                        <label>Base MSRP</label>
                        <span>{{ product().base_price | currency:'USD' }}</span>
                      </div>
                    </td>

                    <ng-container *ngIf="planningMode() === 'price'">
                      <td>
                        <div class="planning-input">
                          <span class="prefix">$</span>
                          <input type="number" [(ngModel)]="tempPrices[t.id]" 
                                 [disabled]="!isAssigned(t.id) && !isAdmin()"
                                 (ngModelChange)="onDraft(t.id)"
                                 placeholder="Plan">
                        </div>
                      </td>
                      <td>
                        <div class="planning-input tier">
                          <span class="prefix">$</span>
                          <input type="number" [(ngModel)]="tempSellIn[t.id]" 
                                 [disabled]="!isAssigned(t.id) && !isAdmin()"
                                 (ngModelChange)="onDraft(t.id)"
                                 placeholder="Sell-in">
                        </div>
                      </td>
                      <td>
                        <div class="planning-input tier">
                          <span class="prefix">$</span>
                          <input type="number" [(ngModel)]="tempSellOut[t.id]" 
                                 [disabled]="!isAssigned(t.id) && !isAdmin()"
                                 (ngModelChange)="onDraft(t.id)"
                                 placeholder="Sell-out">
                        </div>
                      </td>
                    </ng-container>

                    <ng-container *ngIf="planningMode() === 'quantity'">
                      <td>
                        <div class="planning-input qty">
                          <span class="prefix">#</span>
                          <input type="number" [(ngModel)]="tempTargetQty[t.id]" 
                                 [disabled]="!isAssigned(t.id) && !isAdmin()"
                                 (ngModelChange)="onDraft(t.id)"
                                 placeholder="Target">
                        </div>
                      </td>
                      <td>
                        <div class="planning-input qty">
                          <span class="prefix">#</span>
                          <input type="number" [(ngModel)]="tempForecastQty[t.id]" 
                                 [disabled]="!isAssigned(t.id) && !isAdmin()"
                                 (ngModelChange)="onDraft(t.id)"
                                 placeholder="Forecast">
                        </div>
                      </td>
                    </ng-container>

                    <ng-container *ngIf="planningMode() === 'performance'">
                      <td>
                        <div class="planning-input qty">
                          <span class="prefix">#</span>
                          <input type="number" [(ngModel)]="tempMtd[t.id]" 
                                 [disabled]="!isAssigned(t.id) && !isAdmin()"
                                 (ngModelChange)="onDraft(t.id)"
                                 placeholder="MTD">
                        </div>
                      </td>
                      <td>
                        <div class="planning-input qty">
                          <span class="prefix">#</span>
                          <input type="number" [(ngModel)]="tempQtd[t.id]" 
                                 [disabled]="!isAssigned(t.id) && !isAdmin()"
                                 (ngModelChange)="onDraft(t.id)"
                                 placeholder="QTD">
                        </div>
                      </td>
                      <td>
                        <div class="planning-input qty">
                          <span class="prefix">#</span>
                          <input type="number" [(ngModel)]="tempYtd[t.id]" 
                                 [disabled]="!isAssigned(t.id) && !isAdmin()"
                                 (ngModelChange)="onDraft(t.id)"
                                 placeholder="YTD">
                        </div>
                      </td>
                    </ng-container>

                    <td class="action-col">
                      <button class="btn-deploy" 
                              *ngIf="isDraft(t.id)"
                              (click)="savePrice(t.id)">Deploy</button>
                      <span class="status-badge" *ngIf="!isDraft(t.id) && tempPrices[t.id]">Synced</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div *ngIf="availableTerritories().length === 0" class="empty-state">
                No active sales areas discovered for mapping coordinate.
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <div class="status-pill">
            <span class="dot" [class.sync-active]="drafts.size > 0"></span> 
            Agent Auth: {{ authService.currentUser()?.role?.name }} | Pending: {{ drafts.size }} Tiers
          </div>
          <button class="btn-close" (click)="onClose()">Exit Workshop</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(2, 6, 23, 0.95); backdrop-filter: blur(15px);
      display: flex; align-items: center; justify-content: center; z-index: 1001;
    }
    .modal-card {
      width: 95%; max-width: 1200px; background: #0f172a; border-radius: 32px;
      border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-header { padding: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: flex-start; }
    .sku-tag { font-size: 11px; font-weight: 900; color: #3b82f6; background: rgba(59,130,246,0.1); padding: 5px 12px; border-radius: 6px; letter-spacing: 0.1em; }
    h2 { font-size: 2.2rem; color: #fff; margin: 10px 0 5px; font-weight: 800; }
    p { color: #64748b; font-size: 1.1rem; }
    .close-btn { background: none; border: none; color: #475569; font-size: 36px; cursor: pointer; transition: 0.2s; }
    .close-btn:hover { color: #fff; transform: rotate(90deg); }

    .modal-body { padding: 40px; max-height: 65vh; overflow-y: auto; }
    
    .planning-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.15em; border-left: 4px solid #3b82f6; padding-left: 15px; margin: 0; }
    .mode-toggle { display: flex; gap: 8px; background: #1e293b; padding: 6px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .mode-toggle button { background: transparent; border: none; color: #64748b; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .mode-toggle button:hover { color: #fff; border-color: rgba(255,255,255,0.1); }
    .mode-toggle button.active { background: #3b82f6; color: #fff; box-shadow: 0 4px 10px rgba(59,130,246,0.3); }

    .planning-table-container { background: rgba(30,41,59,0.3); border-radius: 20px; border: 1px solid rgba(255,255,255,0.03); overflow: hidden; }
    .planning-table { width: 100%; border-collapse: collapse; }
    .planning-table th { background: #1e293b; color: #64748b; text-align: left; padding: 20px 24px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .planning-table td { padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.03); color: #94a3b8; }
    
    .planning-table tr.assigned { background: rgba(59,130,246,0.02); }
    .planning-table tr.read-only { opacity: 0.4; pointer-events: none; }
    
    .area-info { display: flex; flex-direction: column; gap: 4px; }
    .type-badge { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #3b82f6; }
    .area-info strong { color: #fff; font-size: 1.1rem; }
    .ownership { font-size: 11px; color: #10b981; font-weight: 700; }

    .ref-item { display: flex; flex-direction: column; }
    .ref-item label { font-size: 9px; text-transform: uppercase; color: #475569; }
    .ref-item span { font-weight: 700; color: #fbbf24; }

    .planning-input { position: relative; display: flex; align-items: center; }
    .prefix { position: absolute; left: 12px; color: #475569; font-weight: 700; font-size: 14px; }
    .planning-input input { 
      width: 130px; background: #020617; border: 1px solid rgba(255,255,255,0.1); 
      color: #fff; padding: 12px 12px 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 700;
      transition: all 0.2s;
    }
    .planning-input input:focus { border-color: #3b82f6; background: #0f172a; box-shadow: 0 0 0 4px rgba(59,130,246,0.15); outline: none; }
    .tier input { border-color: rgba(148,163,184,0.1); }

    .btn-deploy { 
      background: #3b82f6; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; 
      font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s;
    }
    .btn-deploy:hover { background: #2563eb; transform: scale(1.05); }
    .status-badge { font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em; }

    .empty-state { padding: 80px; text-align: center; color: #475569; font-style: italic; }

    .modal-footer { padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
    .status-pill { background: #1e293b; padding: 8px 16px; border-radius: 10px; color: #64748b; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #3b82f6; }
    .btn-close { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 12px 30px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-close:hover { background: #1e293b; border-color: #3b82f6; }
  `]
})
export class PricePlanner implements OnInit {
  product = input.required<any>();
  close = output<void>();

  private productService = inject(ProductService);
  private territoryService = inject(TerritoryService);
  public authService = inject(AuthService);

  tempPrices: { [key: number]: number } = {};
  tempSellIn: { [key: number]: number } = {};
  tempSellOut: { [key: number]: number } = {};
  tempTargetQty: { [key: number]: number } = {};
  tempForecastQty: { [key: number]: number } = {};
  tempMtd: { [key: number]: number } = {};
  tempQtd: { [key: number]: number } = {};
  tempYtd: { [key: number]: number } = {};

  planningMode = signal<'price' | 'quantity' | 'performance'>('price');

  drafts = new Set<number>();
  myTerritories: number[] = [];
  allTerritories = signal<Territory[]>([]);

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.territoryService.fetchMyTerritories().subscribe(data => {
      this.myTerritories = data.map(t => t.id);
    });

    this.territoryService.fetchTerritories().subscribe(data => {
      this.allTerritories.set(data);
    });

    this.productService.getProduct(this.product().id).subscribe(data => {
      data.prices.forEach(p => {
        if (p.territory_id) {
          this.tempPrices[p.territory_id] = p.override_price;
          this.tempSellIn[p.territory_id] = p.sell_in_price || 0;
          this.tempSellOut[p.territory_id] = p.sell_out_price || 0;
          this.tempTargetQty[p.territory_id] = p.target_quantity || 0;
          this.tempForecastQty[p.territory_id] = p.forecast_quantity || 0;
          this.tempMtd[p.territory_id] = p.mtd_forecast || 0;
          this.tempQtd[p.territory_id] = p.qtd_forecast || 0;
          this.tempYtd[p.territory_id] = p.ytd_forecast || 0;
        }
      });
    });
  }

  availableTerritories(): Territory[] {
    return this.allTerritories();
  }

  isAssigned(territoryId: number): boolean {
    return this.myTerritories.includes(territoryId);
  }

  isAdmin(): boolean {
    return this.authService.hasRole(['Admin']);
  }

  onDraft(territoryId: number) {
    this.drafts.add(territoryId);
  }

  isDraft(territoryId: number): boolean {
    return this.drafts.has(territoryId);
  }

  savePrice(territoryId: number) {
    const payload = {
      product_id: this.product().id,
      territory_id: territoryId,
      override_price: this.tempPrices[territoryId],
      sell_in_price: this.tempSellIn[territoryId],
      sell_out_price: this.tempSellOut[territoryId],
      target_quantity: this.tempTargetQty[territoryId],
      forecast_quantity: this.tempForecastQty[territoryId],
      mtd_forecast: this.tempMtd[territoryId],
      qtd_forecast: this.tempQtd[territoryId],
      ytd_forecast: this.tempYtd[territoryId],
      currency: 'USD'
    };

    if (payload.override_price === undefined) return;

    this.productService.addRegionalPricing(payload).subscribe({
      next: () => {
        this.drafts.delete(territoryId);
        // Product data refresh could be triggered here or on close
      },
      error: (err) => alert('Sync failed: ' + (err.error?.detail || err.message))
    });
  }

  onClose() {
    this.close.emit();
  }
}
