# Territory Management Web Application - Architecture & Plan

## 1. System Architecture Diagram
```text
[ Client Layer (Sales Reps / Managers / Admins) ]
      |
      | (HTTPS / REST / WebSocket)
      V
[ Edge Layer / API Gateway (Nginx / Ingress Controller) ]
      |
      |-- Routing, Rate Limiting, SSL Termination
      V
[ Frontend Application ]
  - Angular (Latest)
  - Hosted as static frontend (CDN / Nginx)
      |
      V
[ Application Layer (FastAPI Backend) ]
  (Gunicorn + Uvicorn Async Workers, Modular Monolith)
      |
      |-- [ Auth & Identity ] (JWT, RBAC, Multi-tenant aware)
      |-- [ Organization Module ] (Hierarchy Trees)
      |-- [ Territory Module ] (Territory Mapping, Overlap Validation)
      |-- [ Product Module ] (Catalog, Regional Pricing)
      |-- [ Sales Module ] (Orders, Tracking, Targets)
      |-- [ Notifications & Analytics ]
      |
      |-- [ Background Workers (Celery) ]
            |-- (Async Report Generation, Email Invites)
      |
      V
[ Data Layer ]
  |-- PostgreSQL (Primary Transactional DB, using Schemas/Tenants if strict multi-tenancy)
  |-- Redis (Caching Layer, Rate Limiting, Celery Broker)
```

**Tradeoffs & Best Practices (Architecture):**
- **Modular Monolith vs Microservices:** Starting with a modular monolith in FastAPI allows rapid iteration while keeping domains strictly separated (Core, Auth, Territory). Since Kubernetes is the target platform, you can seamlessly branch off heavily loaded domains (like Analytics) into true microservices later without rewriting domain logic.
- **Async Workers:** FastAPI handles lightweight async operations well with `BackgroundTasks`. However, for a production-grade SaaS, **Celery + Redis** provides durability, retries, and rate-limiting for critical background operations like bulk territory calculation.

---

## 2. Database Schema Design (PostgreSQL)

*A Multi-tenant Shared Database approach is employed. Every relevant table features a `tenant_id` to ensure SaaS scalability.*

**User & Auth Module**
- `tenant` (id, name, created_at, is_active)
- `users` (id, tenant_id, email, password_hash, role_id, is_active, created_at)
- `roles` (id, name [Admin/RegMgr/ZonalMgr/TerrMg/SalesRep], permissions JSONB)
- `org_hierarchy` (id, tenant_id, user_id, manager_id [FK to users], level)

**Territory Management**
- `territories` (id, tenant_id, name, type [Country, State, District, City, Zip], map_polygon [GeoJSON/PostGIS ready], parent_id [FK to territories])
- `user_territories` (id, user_id, territory_id, assigned_at) - Mapping table to link Sales/Managers to Territories.

**Products & Sales Tracking**
- `products` (id, tenant_id, name, sku, category_id, base_price, is_active)
- `regional_pricing` (id, product_id, territory_id, price)
- `orders` (id, tenant_id, user_id (Sales Rep), territory_id, status, total_amount, created_at)
- `order_items` (id, order_id, product_id, quantity, unit_price)
- `targets` (id, tenant_id, user_id, period [YYYY-MM], target_amount, achieved_amount)

**Tradeoffs & Best Practices (Database):**
- **SaaS Strategy:** Using `tenant_id` on every table (Shared DB, Shared Schema) is the easiest to manage, migrate, and scale. We'll enforce tenant filtering at the Repository layer in Python to prevent accidental data leaks.
- **Geo Spatial Ready:** Using a `map_polygon` column prepares the app for PostGIS integration down the line for map-based region assignments, overlapping calculations, etc.

---

## 3. Backend Folder Structure (FastAPI)

*Emphasizing Domain-Driven Design (DDD) and Clean Architecture.*

```text
backend/
├── alembic/                # DB migrations tracking
├── app/
│   ├── main.py             # FastAPI entry point, CORS, Middlewares
│   ├── core/               # App-wide settings, global auth, and db config
│   │   ├── config.py       
│   │   ├── security.py     
│   │   └── exceptions.py   # Global and custom exception handlers
│   ├── api/                # The Delivery Layer (Controllers)
│   │   ├── dependencies.py # get_db, current_user, CheckPermissions
│   │   ├── v1/             # API Routers matching Domain modules
│   ├── domain/             # Aggregate Roots & DTOs
│   │   ├── auth/           # models.py, schemas.py, repository.py
│   │   ├── territory/
│   │   ├── sales/
│   ├── services/           # The Application/Business Logic Layer
│   │   ├── auth_service.py # Core business rules, calls repositories
│   │   └── territory_service.py
│   ├── workers/            # Async task queues
│   │   └── celery_tasks.py 
├── tests/                  # Unit + Integration testing
├── Dockerfile
├── requirements.txt (or Pipfile / pyproject.toml)
```

**Tradeoffs & Best Practices (Backend):**
- **Clean Architecture & Repository Pattern:** The `api` layer ONLY deals with HTTP requests and responses (Pydantic models). It delegates completely to `services` which enforce business logic. The `services` interact with the DB exclusively through the `repository` layer, avoiding tight coupling with SQLAlchemy and making unit testing much simpler.

---

## 4. Frontend Folder Structure (Angular)

*Utilizing a feature-based, lazy-loaded architecture with scalable core/shared abstractions.*

```text
frontend/
├── src/
│   ├── app/
│   │   ├── app.config.ts         # Routes & Global providers (Angular 15+ standalone)
│   │   ├── app.component.ts
│   │   ├── core/                 # Singleton Services, Auth Guards, Interceptors
│   │   │   ├── auth/             
│   │   │   ├── state/            # Custom store using Signals or lightweight NgRx
│   │   │   └── http/             # Base API Service with generalized error catching
│   │   ├── shared/               # Dumb components, Pipes, Directives, App-wide Material overrides
│   │   │   └── components/       # Table view, Forms, Layout structural components
│   │   ├── features/             # Business specific routes, strictly lazy loaded
│   │   │   ├── dashboard/        # Dashboard feature (Charts, KPI boxes)
│   │   │   ├── org-hierarchy/    # Tree visualization, drag/drop manager assignment
│   │   │   ├── territory/        # Territory map and assignment CRUD
│   │   │   └── auth/             # Login, Invite handling
│   ├── environments/             
│   ├── styles.scss               # Global stylesheet, CSS variables, typography
```

**Tradeoffs & Best Practices (Frontend):**
- **State Management (Signals vs NgRx):** I recommend utilizing built-in Angular **Signals** instead of full NgRx. For a CRUD-heavy admin app, NgRx often introduces immense boilerplate. Signals provide highly reactive localized and global state out-of-the-box with supreme performance and clarity.
- **Lazy Loading & Standalone Components:** By ensuring `features` only contain standalone components and local routes, the final production bundle is highly optimized, ensuring rapid load times for users.
