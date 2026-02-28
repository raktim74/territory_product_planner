import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
    {
        path: 'org-hierarchy',
        loadComponent: () => import('./features/org-hierarchy/org-tree/org-tree').then(m => m.OrgTree),
        canActivate: [authGuard]
    },
    {
        path: 'org-hierarchy/new',
        loadComponent: () => import('./features/org-hierarchy/member-form/member-form').then(m => m.MemberForm),
        canActivate: [authGuard]
    },
    {
        path: 'territory',
        loadComponent: () => import('./features/territory/territory-list/territory-list').then(m => m.TerritoryList),
        canActivate: [authGuard]
    },
    {
        path: 'territory/new',
        loadComponent: () => import('./features/territory/territory-form/territory-form').then(m => m.TerritoryForm),
        canActivate: [authGuard]
    },
    {
        path: 'territory/edit/:id',
        loadComponent: () => import('./features/territory/territory-form/territory-form').then(m => m.TerritoryForm),
        canActivate: [authGuard]
    },
    {
        path: 'territory/map',
        loadComponent: () => import('./features/territory/territory-map/territory-map').then(m => m.TerritoryMap),
        canActivate: [authGuard]
    },
    {
        path: 'products',
        loadComponent: () => import('./features/product/product-catalog/product-catalog').then(m => m.ProductCatalog),
        canActivate: [authGuard]
    },
    {
        path: 'products/new',
        loadComponent: () => import('./features/product/product-form/product-form').then(m => m.ProductForm),
        canActivate: [authGuard]
    },
    {
        path: 'products/edit/:id',
        loadComponent: () => import('./features/product/product-form/product-form').then(m => m.ProductForm),
        canActivate: [authGuard]
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard]
    }
];
