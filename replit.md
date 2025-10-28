# Coverage Pool Management Application

## Overview

This is an enterprise coverage pool management system for tracking warranty coverage on deployed laptop inventory and optimizing spare unit allocation. The application enables users to monitor:

- **Spare Units**: Pool of spare laptops available to cover warranty claims
- **Covered Units**: Laptops deployed in the field under active warranty coverage
- **Coverage Pools**: Groups showing coverage ratios (spare units / covered units) by specifications
- **Coverage Analytics**: Metrics and trends to ensure adequate spare inventory

The system provides a comprehensive dashboard for viewing coverage statistics, managing spare and covered units, tracking coverage expiration dates, and creating dynamic pool groups with custom filter criteria.

## Business Model

### Core Concept
This is a **warranty pool management system** where:
- **Covered Units** = Laptops deployed in the field under warranty (with customers/locations)
- **Spare Units** = Spare laptops in the pool available to cover warranty claims
- **Coverage Pool** = A grouping by specifications showing the coverage ratio

### Coverage Ratio
**Coverage Ratio = (Spare Units / Covered Units) × 100%**

For example: If you have 2 spare HP EliteBook 840 G8 units to cover 3 deployed HP EliteBook 840 G8 units under warranty, the coverage ratio is 66.7%.

### Key Relationships
- Both spare units and covered units have matching specification fields (make, model, processor, RAM, etc.)
- Coverage pools use filter criteria to group units by specifications
- The system calculates how many spare units exist for each group of covered units with matching specs
- Coverage ratios help identify where more spares are needed

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Component System**: The application uses shadcn/ui (New York style) built on top of Radix UI primitives. This provides:
- Accessible, composable UI components
- Consistent design system with Carbon Design System principles
- Dark/light theme support via CSS variables
- Tailwind CSS for styling with custom design tokens

**Design Principles**:
- Data-first presentation optimized for enterprise dashboards
- High information density without overwhelming users
- Typography system using Inter (primary) and JetBrains Mono (monospace for technical data)
- Consistent spacing primitives (Tailwind units: 2, 4, 6, 8)
- Layout: Sidebar navigation (16rem width) + main content area with max-width containers

**State Management**:
- TanStack Query (React Query) for server state management, data fetching, and caching
- Local React state for UI interactions (filters, search, form inputs)
- Context API for theme management

**Routing**: wouter - a lightweight client-side routing library

**Key Pages**:
- **Dashboard**: Overview with metric cards and coverage pool statistics showing coverage ratios
- **Spare Pool**: Filterable data table of all spare units available to cover warranty claims
- **Covered Units**: Searchable table of all units in field under warranty coverage with expiration tracking
- **Coverage Pools**: Management interface for creating/editing warranty pool groupings and viewing coverage ratios
- **Analytics**: Charts and visualizations for coverage trends and pool performance analysis

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**Server Structure**:
- RESTful API design with routes organized by domain (spare units, covered units, coverage pools)
- Middleware for JSON parsing, request logging, and error handling
- Custom logging middleware that captures request duration and responses

**API Endpoints**:
- `/api/spare-units` - CRUD operations for spare units with filtering support
- `/api/covered-units` - CRUD operations for covered units with search and filtering
- `/api/coverage-pools` - CRUD operations for coverage pool configurations
- `/api/coverage-pools-with-stats` - Coverage pools with calculated statistics (spare count, covered count, coverage ratio)
- `/api/analytics` - Aggregated statistics and metrics
- `/api/filters` - Dynamic filter options based on current data from both spare and covered units

**Data Access Layer**: 
- Storage abstraction (`IStorage` interface) providing a clean separation between business logic and database operations
- All database queries go through the storage layer, making it easy to swap implementations or add caching

### Data Storage

**Database**: PostgreSQL accessed via Neon Serverless (WebSocket-based connection pooling)

**ORM**: Drizzle ORM with the following benefits:
- Type-safe database queries
- Schema-first approach with TypeScript
- Lightweight with minimal runtime overhead
- Migration support via drizzle-kit

**Schema Design**:

1. **spare_unit** table - Spare units in pool available to cover warranty claims:
   - Laptop specifications (make, model, processor, RAM, HDD, display)
   - Serial numbers and item IDs
   - Pool management (reserved for case, retired order, current holder)
   - Categorization and metadata
   - Timestamps for audit trail

2. **covered_unit** table - Units deployed in field under warranty coverage:
   - Links to spare units via matching specifications
   - Laptop specifications (make, model, processor, RAM, HDD, display) - **must match spare units for pool matching**
   - Coverage period (start/end dates with calculated duration)
   - Coverage status flag (isCoverageActive)
   - Deployment information (current holder, location)
   - Descriptive information
   - Audit timestamps

3. **coverage_pool** table - Dynamic coverage pool definitions:
   - Pool name and description
   - Filter criteria stored as JSON string (flexible filtering by make, model, processor, RAM, category)
   - Applies to BOTH spare units and covered units to calculate coverage ratios
   - Timestamps for tracking changes

**Key Design Decisions**:
- Both spare_unit and covered_unit tables have matching specification fields (make, model, processor, RAM, etc.) for pool filtering
- Coverage pools use JSON-serialized filter criteria for dynamic, extensible filtering without schema changes
- Boolean flags (isCoverageActive, touchscreen) for simple status tracking
- Timestamps (createdOn, modifiedOn) on all tables for audit trail
- UUID primary keys generated by PostgreSQL for globally unique identifiers
- Coverage ratio calculated as: (spare units matching filter / covered units matching filter) × 100%

### Authentication and Authorization

**Current State**: No authentication/authorization implemented. The application assumes a trusted internal network or requires implementation of authentication layer.

**Recommended Approach**: Add session-based authentication with role-based access control (RBAC) for different user types (admin, manager, viewer).

### External Dependencies

**Third-party Services**:
- **Neon Database**: Serverless PostgreSQL with WebSocket connections for efficient connection pooling
- **Google Fonts CDN**: Provides Inter and JetBrains Mono font families

**Key NPM Packages**:
- **@tanstack/react-query**: Server state management and data synchronization
- **@radix-ui/***: Accessible UI component primitives (dialogs, dropdowns, tooltips, etc.)
- **drizzle-orm**: Type-safe database ORM
- **recharts**: Charting library for analytics visualizations
- **date-fns**: Date manipulation and formatting
- **zod**: Runtime type validation and schema validation
- **wouter**: Lightweight routing
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette component

**Development Tools**:
- **Vite**: Fast development server with HMR and optimized production builds
- **TypeScript**: Static type checking across the entire stack
- **drizzle-kit**: Database migration management
- **esbuild**: Fast JavaScript bundler for production builds

**Build Strategy**:
- Frontend builds to `dist/public` using Vite
- Backend bundles with esbuild to `dist/index.js` with external packages
- Shared schema and types between client/server via `@shared` path alias
- Development mode runs tsx with watch mode for hot reloading

## Recent Changes (October 28, 2025)

### Major Refactoring - Correct Business Model Implementation

Updated the entire application to reflect the correct business model:

**Business Model Clarification**:
- **Spare Units** (formerly "inventory"): Units in pool available to cover warranty claims
- **Covered Units** (formerly "warranty"): Units deployed in field under warranty coverage
- **Coverage Pools** (formerly "pool groups"): Groups showing coverage ratios by specifications

**Database Schema Updates**:
- Renamed tables: `inventory` → `spare_unit`, `warranty` → `covered_unit`, `pool_group` → `coverage_pool`
- Added specification fields to covered_unit table (make, model, processor, RAM, etc.) to match spare_unit fields
- Renamed columns for clarity: `warrantyStartDate` → `coverageStartDate`, `isActive` → `isCoverageActive`, etc.
- Updated spare_unit field names: `customer` → `currentHolder`, `allocatedOrder` → `reservedForCase`, `soldOrder` → `retiredOrder`

**API Endpoint Updates**:
- `/api/inventory` → `/api/spare-units`
- `/api/warranties` → `/api/covered-units`
- `/api/pool-groups` → `/api/coverage-pools`
- Added `/api/coverage-pools-with-stats` for pools with calculated statistics

**Frontend Updates**:
- Navigation: "Inventory" → "Spare Pool", "Warranties" → "Covered Units", "Pool Groups" → "Coverage Pools"
- All labels, titles, and terminology updated throughout UI
- Coverage calculations now correctly show: spare units / covered units = coverage ratio
- Updated all page components to use new API endpoints and data types

**Type System Updates**:
- `Inventory` → `SpareUnit`, `Warranty` → `CoveredUnit`, `PoolGroup` → `CoveragePool`
- All insert schemas and types updated accordingly
- Storage interface methods renamed to match new terminology

This refactoring ensures the application correctly communicates that spare units in the pool are available to cover deployed units under warranty coverage.
