# Coverage Pool Management Application

### Overview
This application is an enterprise coverage pool management system designed to track warranty coverage for deployed laptop inventory and optimize the allocation of spare units. It allows users to monitor spare units, covered units, coverage pools (groups showing coverage ratios by specifications), and coverage analytics. The system provides a comprehensive dashboard for statistics, managing units, tracking warranty expirations, and creating dynamic coverage groups based on custom filter criteria.

**Business Model**:
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
- **Key Pages**: Dashboard, Spare Pool, Covered Units, Coverage Pools, Analytics.

**Backend Architecture**:
- **Framework**: Express.js with TypeScript on Node.js.
- **Server Structure**: RESTful API organized by domain, with middleware for JSON parsing (50MB limit for bulk uploads), logging, and error handling.
- **API Endpoints**: 
  - Standard CRUD: `/api/spare-units`, `/api/covered-units`, `/api/coverage-pools`
  - Analytics: `/api/coverage-pools-with-stats`, `/api/analytics`, `/api/filters`
  - **Bulk Upload (Azure Data Factory Integration)**:
    - `POST /api/spare-units/bulk` - Truncate and replace all spare units
    - `POST /api/covered-units/bulk` - Truncate and replace all covered units
- **Data Access Layer**: Storage abstraction (`IStorage` interface) for clean separation from database operations.
- **Bulk Upload Features**:
  - Transaction-wrapped (atomic truncate + insert for data integrity)
  - Batch processing (500 items per batch to handle large datasets)
  - JSON date string support (converts ISO strings to Date objects)
  - Auto-calculation of coverage duration days
  - Validation: Invalid dates rejected, start date must be <= end date

**Data Storage**:
- **Database**: PostgreSQL via Neon Serverless.
- **ORM**: Drizzle ORM for type-safe queries, schema-first approach, and migration support.
- **Schema Design**:
    1.  `spare_unit` table: Stores spare laptop details, specifications, serial numbers, and pool management data.
    2.  `covered_unit` table: Stores deployed laptop details, specifications (matching `spare_unit` for pool matching), warranty coverage periods, and deployment info.
    3.  `coverage_pool` table: Defines dynamic coverage pools with names, descriptions, and JSON-serialized filter criteria.
- **Key Design Decisions**: Matching specification fields in `spare_unit` and `covered_unit` tables, JSON-serialized filter criteria for flexibility, UUID primary keys, and audit timestamps.

**Authentication and Authorization**:
- **Current State**: No authentication/authorization implemented. Assumes a trusted internal network.
- **Recommended Approach**: Implement session-based authentication with role-based access control (RBAC).

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

**Development Tools**:
- **Vite**: Fast development server and build tool.
- **TypeScript**: Static type checking.
- **drizzle-kit**: Database migration management.
- **esbuild**: Fast JavaScript bundler.