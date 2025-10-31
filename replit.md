# Coverage Pool Management Application

### Overview
This application is an enterprise coverage pool management system designed to track warranty coverage for deployed laptop inventory and optimize the allocation of spare units. It allows users to monitor spare units, covered units, coverage pools (groups showing coverage ratios by specifications), and coverage analytics. The system provides a comprehensive dashboard for statistics, managing units, tracking warranty expirations, and creating dynamic coverage groups based on custom filter criteria.

**Business Model**:
The core concept revolves around a **warranty pool management system** where:
- **Covered Units**: Laptops deployed in the field under warranty.
- **Spare Units**: Spare laptops available to cover warranty claims.
- **Coverage Pool**: A grouping by specifications showing the coverage ratio.

The **Coverage Ratio = (Spare Units / Covered Units) × 100%**. Both spare and covered units have matching specification fields (e.g., make, model, processor) which are used by coverage pools to group units and calculate ratios, identifying areas needing more spares.

### Recent Changes
**October 31, 2025**:
1. **Dashboard Summary Card Expansion**: Updated Dashboard to display 6 comprehensive metrics in 3x2 grid:
   - Total Warranty Stock (all covered units)
   - Active Warranty (non-expired coverage only)
   - Total Replacement Pool (all spare units)
   - Unallocated Pool (spare units not reserved)
   - Expiring Warranty Stock (units expiring in configured period)
   - Low Coverage Groups (pools below threshold)

2. **Run Rate Configuration**: Added configurable run rate calculation period to Configuration page:
   - New setting: runRatePeriodMonths (1-24 months, default 6)
   - Dynamically adjusts claims run rate calculations for coverage pools
   - Located in Expiry Settings card

3. **Enhanced Coverage Pool Analytics**: Updated pool cards to display three additional metrics:
   - Available Stock Count - matching units from all available inventory
   - Claims Count - total claims matching pool specifications
   - Run Rate - claims per month (calculated over configured period)
   - Metrics displayed in clean 3-column grid below coverage ratio

4. **Complete API Documentation**: Created comprehensive API_DOCUMENTATION.md with:
   - All endpoints documented with complete field lists matching actual production data
   - Full schema for all 5 entity types: Spare Units, Covered Units, Available Stock, Claims, Replacements
   - Detailed filter criteria documentation for coverage pools
   - Azure Data Factory integration examples and best practices
   - Bulk upload specifications with composite key details

**October 30, 2025**:
1. **Coverage Pool Expansion Fixes**: Resolved three critical issues with pool detail dialog:
   - **Dashboard Expansion**: Fixed "Expand Pool" buttons on Dashboard - now properly opens PoolDetailDialog with pool data (previously only logged to console)
   - **Data Fetching**: Added `limit=999999` to spare/covered units queries in dialog to fetch all records (resolves data mismatch where backend stats showed 345 covered but dialog only showed 2)
   - **Filter Logic**: Updated filterUnits to use case-insensitive and trimmed string comparison for robust matching between backend SQL queries and frontend JavaScript filtering
   - **Dialog Sizing**: Increased dialog width to `max-w-7xl` and added `max-h-[50vh]` scrollable containers for tables to prevent overflow with large datasets
   - Result: Pool expansion works from both Dashboard and Coverage Pools page, with accurate counts matching backend stats

2. **Pagination Component Stability**: Fixed pagination reset issues by:
   - Replacing PaginationLink anchor tags with Button components (type="button") to prevent navigation/form submission behavior
   - Added memoized callbacks (useCallback) for handlePageChange in Warranties.tsx and Inventory.tsx
   - Memoized getPageNumbers calculation (useMemo) to prevent unnecessary button re-renders
   - Ensures stable pagination state when clicking page numbers or Next/Previous buttons

2. **Pool Detail Excel Export**: Enhanced PoolDetailDialog with tabular display and Excel export:
   - Converted card-based unit display to DataTable component for better data presentation
   - Added "Export to Excel" button in dialog header
   - Excel file contains 2 sheets: "Spare Units" and "Covered Units"
   - Filename format: `{PoolName}_{YYYY-MM-DD}.xlsx`
   - Displays all filtered units matching the pool's criteria
   - Success/error toast notifications for export operations
   - Uses xlsx library for Excel generation

3. **Warranty Explorer Page**: Added new standalone warranty analytics page from external HTML resource:
   - Provides comprehensive warranty insights dashboard with external Power Automate API integration
   - Features: Summary cards (total warranties, unique makes/models/categories), interactive charts (react-chartjs-2), filterable/sortable table, drill-down modal
   - Route: `/warranty-explorer` with sidebar navigation link
   - Maintains original functionality from provided HTML resource while adapting styling to match app theme
   - **Note**: API URL is client-side (matching original HTML implementation) - suitable for internal/trusted network use
   - Handles loading states, empty states, and API errors with toast notifications

**October 29, 2025**:
1. **Stock Under Warranty Sorting**: Changed default sort order to `coverageStartDate DESC` to show newest warranties first (previously sorted by `createdOn`)
2. **Coverage Pool Filters Updated**: 
   - **Added**: Category, Storage Size (HDD), and Generation filters for more precise pool grouping
   - **Removed**: Customer Name and Order Number filters (pools now focus purely on technical specifications)
   - Backend coverage stats matching logic updated to honor all seven specification fields: make, model, processor, RAM, category, storage size, generation
3. **Coverage Pool Drill-Down**: Verified existing PoolDetailDialog provides drill-down capability to view matching spare and covered units in separate tabs when clicking on pool cards

### User Preferences
Preferred communication style: Simple, everyday language.

### System Architecture

**Frontend Architecture**:
- **Framework**: React 18 with TypeScript, using Vite.
- **UI Component System**: shadcn/ui (New York style) built on Radix UI, providing accessible components, consistent design (Carbon Design System principles), dark/light theme support, and Tailwind CSS for styling.
- **Design Principles**: Data-first presentation for enterprise dashboards, high information density, Inter and JetBrains Mono typography, consistent spacing.
- **State Management**: TanStack Query for server state, local React state for UI, Context API for theme.
- **Routing**: wouter.
- **Key Pages**: Dashboard, Spare Pool, Covered Units, Coverage Pools, Analytics, Warranty Explorer, Configuration.

**Backend Architecture**:
- **Framework**: Express.js with TypeScript on Node.js.
- **Server Structure**: RESTful API organized by domain, with middleware for JSON parsing (50MB limit for bulk uploads), logging, and error handling.
- **API Endpoints**: 
  - Standard CRUD: `/api/spare-units`, `/api/covered-units`, `/api/coverage-pools`
  - Analytics: `/api/coverage-pools-with-stats`, `/api/analytics`, `/api/filters`
  - Configuration: `/api/configuration` (GET, PATCH)
  - **Bulk Upload (Azure Data Factory Integration)**:
    - `POST /api/spare-units/bulk` - Upsert spare units (composite key: serialNumber + areaId + itemId)
    - `POST /api/covered-units/bulk` - Upsert covered units (composite key: serialNumber + areaId + itemId + orderNumber)
- **Data Access Layer**: Storage abstraction (`IStorage` interface) for clean separation from database operations.
- **Performance & Scalability**:
  - **Pagination System**: Table views implement server-side pagination with 100 items per page to handle large datasets efficiently
    - Pagination controls positioned above tables for accessibility
    - Reusable `TablePagination` component using shadcn UI primitives
    - Backend support via `offset` parameter in GET endpoints
    - Search query resets pagination to page 1 automatically
    - Proper `useCallback` memoization prevents pagination state resets on re-renders
  - **Query Limits**: GET endpoints support optional `limit` parameter (default: 10,000 records) to prevent crashes with large datasets (100K+ records)
  - **Purpose**: Ensures responsive UI and prevents memory exhaustion when querying production databases with massive record counts
  - **Usage**: Frontend can override default via `?limit=N` query parameter; search/filter functionality helps users find specific records efficiently
  - **Stats Endpoints**: Separate lightweight endpoints (`/api/spare-units/stats`, `/api/covered-units/stats`) query full dataset using efficient SQL COUNT queries
  - **Two-Tier Architecture**: Summary cards use stats endpoints (full dataset counts), while data tables use paginated queries (100 items per page) for optimal performance
- **Bulk Upload Features**:
  - Transaction-wrapped (atomic truncate + insert for data integrity)
  - Batch processing (500 items per batch to handle large datasets)
  - JSON date string support (converts ISO strings to Date objects)
  - Auto-calculation of coverage duration days
  - Validation: Invalid dates rejected, start date must be <= end date
  - **Performance Optimization**: Covered units bulk upload uses streamlined `bulkInsertCoveredUnitSchema` that moves expensive `.refine()` validation from Zod layer to storage layer (reduces validation time from ~6000ms to <100ms for 2000 records), performing date conversion and integrity checks (start <= end, valid dates) in a single efficient pass during batch processing

**Data Storage**:
- **Database**: PostgreSQL via Neon Serverless.
- **ORM**: Drizzle ORM for type-safe queries, schema-first approach, and migration support.
- **Schema Design**:
    1.  `spare_unit` table: Stores spare laptop details, specifications, serial numbers, and pool management data.
    2.  `covered_unit` table: Stores deployed laptop details, specifications (matching `spare_unit` for pool matching), warranty coverage periods, and deployment info.
    3.  `coverage_pool` table: Defines dynamic coverage pools with names, descriptions, and JSON-serialized filter criteria.
    4.  `app_configuration` table: Single-row configuration table (id='system') storing runtime settings for thresholds and preferences.
- **Key Design Decisions**: Matching specification fields in `spare_unit` and `covered_unit` tables, JSON-serialized filter criteria for flexibility, UUID primary keys, audit timestamps, and singleton configuration pattern.

**Runtime Configuration System**:
- **Purpose**: Allows administrators to configure system thresholds and preferences without code changes.
- **Implementation**: Single-row `app_configuration` table with strongly-typed fields.
- **Configuration Settings**:
  - `lowCoverageThresholdPercent`: Percentage threshold for low coverage alerts (default: 10%)
  - `expiringCoverageDays`: Days ahead to show expiring coverage alerts (default: 30)
  - `poolInactivityDays`: Days before marking pools as inactive (default: 90)
  - `enableLowCoverageAlerts`: Toggle for low coverage alerts (default: true)
  - `enableExpiringAlerts`: Toggle for expiring coverage alerts (default: true)
  - `dashboardRefreshMinutes`: Dashboard auto-refresh interval (default: 5 minutes)
- **Dashboard Integration**: Analytics endpoint dynamically uses configured thresholds; dashboard displays reflect current configuration values in real-time.
- **UI**: Configuration page provides form-based interface for updating all settings with validation and success/error feedback.

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
- **xlsx**: Excel file generation for data export.
- **react-chartjs-2 & chart.js**: Interactive charting library for warranty analytics visualizations.

**Development Tools**:
- **Vite**: Fast development server and build tool.
- **TypeScript**: Static type checking.
- **drizzle-kit**: Database migration management.
- **esbuild**: Fast JavaScript bundler.