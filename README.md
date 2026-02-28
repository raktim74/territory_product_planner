# Territory Management System - Developer Onboarding Guide

Welcome to the **Territory Management SaaS** repository!

This document provides a high-level overview of the application, its underlying architecture, the technologies used, and actionable steps on how to set up the development environment, navigate the source code, and maintain the project.

---

## 1. Project Overview

The Territory Management System is a comprehensive web application engineered to map complex Sales Organization Hierarchies (SOH), assign global selling territories, and implement highly dynamic Product Pricing Planners with analytical insight features. 

The platform supports:
- **Full Multi-Tenancy:** Isolated sub-systems and data based on tenant configurations.
- **Advanced Role-Based Access Control (RBAC):** UI and API access adapts intrinsically depending on if the user is an Admin, Zonal Manager, or Sales Field Agent.
- **Master Data Flow:** Secure audit trails, localized pricing overrides (sell-in vs. sell-out), and YTD (Year-to-Date)/MTD performance forecasting.

---

## 2. Technology Stack

### Backend (Python)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous HTTP routing and OpenAPI).
- **ORM / Database**: [SQLAlchemy 2.0 (Async)](https://docs.sqlalchemy.org/en/20/) connected to **PostgreSQL 15**.
- **Caching / Tasks**: **Redis 7** (also pre-configured for Celery task queuing).
- **Security**: JWT-based Bearer Authentication (`jose`, `passlib`).
- **Containerization**: `docker-compose` configured.

### Frontend (TypeScript)
- **Framework**: [Angular 17+](https://angular.dev/) (Standalone Components, no NgModules).
- **Reactivity / State**: [Angular Signals](https://angular.io/guide/signals) paired with `RxJS` for reactive state flows.
- **Styling**: Scoped modular CSS leveraging deep modern specs (Gradients, Glassmorphism, Micro-animations) without excessive external libraries.
- **Components**: Occasional PrimeNG integrations, but primarily relies on native, highly-optimized components.

---

## 3. Local Setup & Execution

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js](https://nodejs.org/en/) (v18+ recommended)
- Angular CLI (`npm install -g @angular/cli`)
- Python 3.11+ (if running backend outside Docker)

### Bootstrapping the Backend
The backend utilizes Docker to spin up the API (`:8000`), the PostgreSQL Database (`:5432`), and Redis (`:6379`).
1. Navigate to the project root: `cd "Territory Management"`
2. Spin up containers in detached mode:
   ```bash
   docker-compose up -d --build
   ```
3. Database seeding: `init.sql` automatically runs when the PostgreSQL container is first spun up.

_Note: If you need to tail backend logs, run: `docker logs territorymanagement-backend-1 -f`_

### Bootstrapping the Frontend
The Angular frontend runs independently for Hot-Module-Replacement (HMR) during development.
1. Navigate to the frontend directory: `cd frontend`
2. Install npm local packages:
   ```bash
   npm install
   ```
3. Boot the Angular development server:
   ```bash
   npm start
   ```
4. Access the portal at: `http://localhost:4200`

---

## 4. Codebase Navigation

### The Backend (`/backend`)
The backend is mapped using a strictly enforced **Domain-Driven Design (DDD)** approach.
- `app/api/v1/`: Contains your HTTP Route definitions (`auth.py`, `product.py`, `territory.py`, `hierarchy.py`).
- `app/domain/`: Contains SQLAlchemy DB Models, Pydantic Schemas, and the Repository layer used for raw CRUD.
- `app/services/`: This is where business logic lives (e.g., dynamic chart aggregation or hierarchy assignment mapping). Never put heavy logic directly into the API routes!
- `test_*.py` / `migrate_*.py`: Isolated scripts for validating migrations or analytics seeding.

### The Frontend (`/frontend/src/app`)
- `core/`: Global Injectable Services (`auth.service.ts`, `territory.service.ts`, `product.service.ts`), Interceptors, and pure configuration constants.
- `features/`: Where all visual components live. Grouped by domain.
  - `dashboard/`: Dynamic analytic chart views using SVG/CSS bar integrations tied to database aggregation.
  - `org-hierarchy/`: The SOH organizational tree map and permission assignments.
  - `product/price-planner/`: A deeply interactive grid system toggling between **Financials**, **Quantities**, and **Performance (MTD/QTD/YTD)**.
  - `territory/`: Geographical mapping nodes and assignment UI.

---

## 5. Maintenance Notes & Gotchas

* **Changing the Database:** If you add new columns (e.g., adding `mtd_forecast` to Regional Pricing), you **must** update the raw SQL `models.py` definitions, the validation `schemas.py`, and create a python migration script or update `init.sql`. Remember to restart the Docker backend container after making schema updates!
* **Graph & Analytics Rendering:** The dashboard charts are strictly bound to `ProductService.getDashboardAnalytics()`. If a user logs in and the graph says "0", verify they actually have `regional_prices` assigned to their user ID's territories in the database.
* **Role Verification:** Do not check roles purely by string in the frontend. If building restricted areas, utilize the `AuthService.hasRole(['Admin'])` wrapper which safeguards case-insensitivity and structure.
* **UI Re-Renders:** We heavily utilize Angular Signals (`myVariable = signal([])`). You must use `myVariable.set(newData)` and call `myVariable()` inside `.html` templates. Failing to use `.set()` will prevent the DOM from catching asynchronous REST API updates.

---

## 6. Accounts for Local Testing

If `init.sql` has successfully seeded your database, the following accounts exist out-of-the-box:

- **Global Administrator:** `admin@test.com` / `admin123`
  - Access to everything. Dashboard Analytics generate sum equations mapping *the entire* globe unconditionally.
- **Regional Setup:** Create a new user mapping through the Org Chart to test localized permission fencing.

If debugging API requests directly via `curl` or Postman, the gateway exists at `http://localhost:8000/api/v1/`.

Happy coding and welcome to the team!
