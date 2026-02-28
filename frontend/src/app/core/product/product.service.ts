import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Product {
    id: number;
    name: string;
    sku: string;
    description?: string;
    base_price: number;
    category?: string;
    is_active: boolean;
    price_overrides_count: number;
    created_at: string;
    updated_at?: string;
}

export interface RegionalPricing {
    id: number;
    product_id: number;
    territory_id?: number;
    override_price: number;
    sell_in_price?: number;
    sell_out_price?: number;
    target_quantity?: number;
    forecast_quantity?: number;
    mtd_forecast?: number;
    qtd_forecast?: number;
    ytd_forecast?: number;
    currency: string;
}

export interface ProductWithPrices extends Product {
    prices: RegionalPricing[];
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = 'http://localhost:8000/api/v1/product';

    public products = signal<Product[]>([]);
    public isLoading = signal<boolean>(false);

    constructor(private http: HttpClient) { }

    fetchProducts(): Observable<Product[]> {
        this.isLoading.set(true);
        return this.http.get<Product[]>(this.apiUrl).pipe(
            tap(data => {
                this.products.set(data);
                this.isLoading.set(false);
            })
        );
    }

    getProduct(id: number): Observable<ProductWithPrices> {
        return this.http.get<ProductWithPrices>(`${this.apiUrl}/${id}`);
    }

    getDashboardAnalytics(): Observable<{ label: string, value: number, percentage: number }[]> {
        return this.http.get<any[]>(`${this.apiUrl}/analytics/dashboard`);
    }

    createProduct(product: Partial<Product>): Observable<Product> {
        return this.http.post<Product>(this.apiUrl, product);
    }

    addRegionalPricing(pricing: Partial<RegionalPricing>): Observable<RegionalPricing> {
        return this.http.post<RegionalPricing>(`${this.apiUrl}/prices`, pricing);
    }

    updateProduct(id: number, product: Partial<Product>): Observable<Product> {
        return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
    }

    deleteProduct(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
