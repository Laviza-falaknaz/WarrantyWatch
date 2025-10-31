# Coverage Pool Management Application

### Overview
This application is an enterprise coverage pool management system designed to track warranty coverage for deployed laptop inventory and optimize the allocation of spare units. It allows users to monitor spare units, covered units, coverage pools, and coverage analytics. The system provides a comprehensive dashboard for statistics, managing units, tracking warranty expirations, and creating dynamic coverage groups based on custom filter criteria.

The core concept revolves around a **warranty pool management system** where:
- **Covered Units**: Laptops deployed in the field under warranty.
- **Spare Units**: Spare laptops available to cover warranty claims.
- **Coverage Pool**: A grouping by specifications showing the coverage ratio.

The **Coverage Ratio = (Spare Units / Covered Units) × 100%**. Both spare and covered units have matching specification fields (e.g., make, model, processor) which are used by coverage pools to group units and calculate ratios, identifying areas needing more spares.

### User Preferences
Preferred communication style: Simple, everyday language.

### System Architecture

**Frontend Architecture**:
- **Framework**: React 18 with TypeScript, using Vite.
- **UI Component System**: shadcn/ui (New York style) built on Radix UI, providing accessible components, consistent design (Carbon Design System principles), dark/light theme support, and Tailwind CSS for styling.
- **Design Principles**: Data-first presentation for enterprise dashboards, high information density, Inter and JetBrains Mono typography, consistent spacing.
- **State Management**: TanStack Query for server state, local React state for UI, Context API for theme.
- **Routing**: wouter.
- **Key Pages**: Dashboard (with integrated analytics charts), Replacement Pool, Stock under Warranty, Coverage Pools, Warranty Explorer, Configuration, Claims History, Replacements, Available Stock.
- **Navigation**: Sidebar organized into logical groups: Overview, Core Inventory, Inventory Tracking, Management & Tools.

**Backend Architecture**:
- **Framework**: Express.js with TypeScript on Node.js.
- **Server Structure**: RESTful API organized by domain, with middleware for JSON parsing, logging, and error handling.
- **API Endpoints**: Standard CRUD operations for units and pools, analytics, configuration, dedicated stats endpoints for all entity types, and bulk upload endpoints:
  - `spare_unit`: TRUNCATE with RESTART IDENTITY CASCADE (clear-all strategy)
  - `covered_unit`: UPSERT strategy (update existing, insert new)
  - `available_stock`: TRUNCATE with RESTART IDENTITY CASCADE (clear-all strategy)
  - `claims`: TRUNCATE with RESTART IDENTITY CASCADE (clear-all strategy)
  - `replacements`: TRUNCATE with RESTART IDENTITY CASCADE (clear-all strategy)
- **Data Access Layer**: Storage abstraction (`IStorage` interface).
- **Performance & Scalability**: Server-side pagination (100 items/page), query limits (default 10,000 records), separate lightweight stats endpoints, and optimized bulk upload processes with transactional batching and streamlined validation.

**Data Storage**:
- **Database**: PostgreSQL via Neon Serverless.
- **ORM**: Drizzle ORM for type-safe queries, schema-first approach, and migration support.
- **Schema Design**:
    1.  `spare_unit` table: Stores spare laptop details (replacement pool inventory).
    2.  `covered_unit` table: Stores deployed laptop details and warranty coverage (stock under warranty).
    3.  `coverage_pool` table: Defines dynamic coverage pools with JSON-serialized filter criteria.
    4.  `available_stock` table: Tracks all available inventory across areas.
    5.  `claims` table: Records warranty claim history.
    6.  `replacements` table: Tracks replacement fulfillment history.
    7.  `app_configuration` table: Single-row table for runtime system settings.
- **Key Design Decisions**: Matching specification fields across unit tables for pool matching, JSON-serialized filter criteria for flexibility, UUID primary keys, composite keys for tracking entities (serialNumber + areaId + itemId for spare/available, + rma for claims/replacements), audit timestamps, and singleton configuration pattern.

**Runtime Configuration System**:
- **Purpose**: Allows administrators to configure system thresholds and preferences without code changes.
- **Implementation**: Single-row `app_configuration` table with strongly-typed fields.
- **Configuration Settings**: Includes `lowCoverageThresholdPercent`, `expiringCoverageDays`, `poolInactivityDays`, `enableLowCoverageAlerts`, `enableExpiringAlerts`, and `dashboardRefreshMinutes`.
- **UI**: Configuration page provides a form-based interface for updating settings.

**Authentication and Authorization**:
- **Current State**: No authentication/authorization implemented; assumes a trusted internal network.

### External Dependencies

**Third-party Services**:
- **Neon Database**: Serverless PostgreSQL.
- **Google Fonts CDN**: For Inter and JetBrains Mono fonts.

**Key NPM Packages**:
- **@tanstack/react-query**: Server state management.
- **@radix-ui/***: Accessible UI component primitives.
- **drizzle-orm**: Type-safe database ORM.
- **recharts**: Charting library.
- **date-fns**: Date manipulation.
- **zod**: Runtime type validation.
- **wouter**: Lightweight routing.
- **tailwindcss**: Utility-first CSS framework.
- **class-variance-authority**: Component variant management.
- **cmdk**: Command palette component.
- **xlsx**: Excel file generation for data export.
- **react-chartjs-2 & chart.js**: Interactive charting library.