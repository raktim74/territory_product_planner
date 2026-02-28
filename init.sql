-- Territory Management SaaS - Database Initialization Script (PostgreSQL)

-- 1. Create Tables

-- Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Org Hierarchy Table
CREATE TABLE IF NOT EXISTS org_hierarchy (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Territories Table
CREATE TABLE IF NOT EXISTS territories (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Country, State, District, City, Zip
    parent_id INTEGER REFERENCES territories(id) ON DELETE SET NULL,
    map_polygon JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Territory Assignments
CREATE TABLE IF NOT EXISTS user_territories (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    territory_id INTEGER NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DOUBLE PRECISION NOT NULL,
    category VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_tenant_sku UNIQUE (tenant_id, sku)
);

-- Regional Pricing Table
CREATE TABLE IF NOT EXISTS regional_prices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    territory_id INTEGER REFERENCES territories(id) ON DELETE SET NULL,
    override_price DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_territory_price UNIQUE (tenant_id, product_id, territory_id)
);

-- 2. Seed Initial Data

-- Initial Roles (Force UPPERCASE)
INSERT INTO roles (name, permissions) VALUES 
('ADMIN', '["all"]'::jsonb),
('REGIONAL_MANAGER', '["read:all", "write:territory", "write:hierarchy"]'::jsonb),
('ZONAL_MANAGER', '["read:territory", "write:hierarchy"]'::jsonb),
('TERRITORY_MANAGER', '["read:territory"]'::jsonb),
('SALES_REP', '["read:own_territory"]'::jsonb)
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

-- Delete old mixed case roles if they exist and are not used
-- DELETE FROM roles WHERE name IN ('Admin', 'RegionalManager', 'ZonalManager', 'TerritoryManager', 'SalesRep');

-- Initial Tenant (Default)
INSERT INTO tenants (name) VALUES ('Acme Corp') 
ON CONFLICT (name) DO NOTHING;

-- Initial Admin User (password: admin123)
INSERT INTO users (tenant_id, email, hashed_password, role_id) 
SELECT id, 'admin@acmecorp.com', 'admin123', (SELECT id FROM roles WHERE name = 'ADMIN')
FROM tenants WHERE name = 'Acme Corp'
ON CONFLICT (email) DO UPDATE SET 
    role_id = EXCLUDED.role_id,
    hashed_password = EXCLUDED.hashed_password;

-- Initial Territories
INSERT INTO territories (tenant_id, name, type)
SELECT id, 'North America', 'COUNTRY'
FROM tenants WHERE name = 'Acme Corp'
ON CONFLICT DO NOTHING;

-- Initial Products
INSERT INTO products (tenant_id, name, sku, base_price, category)
SELECT id, 'Enterprise License', 'EL-001', 5000.0, 'Software'
FROM tenants WHERE name = 'Acme Corp'
ON CONFLICT DO NOTHING;
