# Coverage Pool Management Application

### Overview
This application is an enterprise coverage pool management system designed to track warranty coverage for deployed laptop inventory and optimize the allocation of spare units. It features automated risk analysis, Power Automate webhook integration, and intelligent pool creation. The system provides a comprehensive dashboard with high-risk combination analysis, real-time alerting, and actionable recommendations for inventory management.

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
- **Key Pages**: Dashboard (redesigned 3-column layout with risk analysis), Replacement Pool, Stock under Warranty, Coverage Pools, Pool Detail (full-page analytics dashboard at /pools/:poolId), Warranty Explorer, Configuration (with webhook integration), Claims History, Replacements, Available Stock.
- **Navigation**: Sidebar organized into logical groups: Overview, Core Inventory, Inventory Tracking, Management & Tools. Pool detail view uses breadcrumb navigation with direct links back to Coverage Pools page.
- **UX Improvements**: 
  - **Dashboard Redesign** (November 2025): 3-column responsive layout (25%-50%-25%) with left column for KPI cards and compact charts, center column for high-risk combinations table with sortable columns and color-coded risk badges, right column for scrollable pool summary cards
  - **Risk Analysis & Alerting** (November 2025): RiskAnalysisTable component with Send Alert (webhook integration) and Create Pool (auto-pool creation) actions, real-time toast notifications
  - Pool details converted from dialog popup to dedicated full page (October 2025) for better spacing and data table visibility with large datasets
  - Pool detail page transformed into comprehensive analytics dashboard (October 2025) featuring KPI cards, trend forecasting, monthly breakdowns, and actionable recommendations
  - Excel export functionality added (October 2025) allowing filtered data export for spare units, covered units, claims, and replacements with pool-specific filtering

**Backend Architecture**:
- **Framework**: Express.js with TypeScript on Node.js.
- **Server Structure**: RESTful API organized by domain, with middleware for JSON parsing, logging, and error handling.
- **API Endpoints**: Standard CRUD operations for units and pools, analytics, configuration, risk analysis, webhook integration, dedicated stats endpoints for all entity types, and bulk upload endpoints:
  - `spare_unit`: TRUNCATE with RESTART IDENTITY CASCADE (clear-all strategy)
  - `covered_unit`: UPSERT strategy (update existing, insert new)
  - `available_stock`: TRUNCATE with RESTART IDENTITY CASCADE (clear-all strategy)
  - `claims`: TRUNCATE with RESTART IDENTITY CASCADE (clear-all strategy) with automatic deduplication
  - `replacements`: TRUNCATE with RESTART IDENTITY CASCADE (clear-all strategy) with automatic deduplication
- **Bulk Upload Deduplication** (October 2025): Claims and replacements endpoints automatically handle duplicates within upload batches:
  - Groups by composite key (serialNumber + areaId + itemId + rma)
  - Keeps only the record with the most recent date (claimDate for claims, replacedDate for replacements)
  - Normalizes dates before comparison for consistent ordinal comparison
  - Returns detailed statistics (inserted count, duplicates removed, total received)
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
- **Configuration Settings**: Includes `lowCoverageThresholdPercent`, `expiringCoverageDays`, `poolInactivityDays`, `enableLowCoverageAlerts`, `enableExpiringAlerts`, `dashboardRefreshMinutes`, `targetCoveragePercent` (default: 20%), `analyticsTimeRangeMonths` (default: 12, range: 1-36), `analyticsForecastMonths` (default: 3, range: 1-12), and `alertWebhookUrl` (Power Automate webhook URL for risk alerts).
- **Security**: Configuration updates require admin password authentication (default: admin123, configurable via ADMIN_PASSWORD environment variable).
- **UI**: Configuration page provides form-based interface with webhook integration card for Power Automate URL configuration and password-protected updates.

**High-Risk Combination Analysis System** (November 2025):
- **Endpoint**: `GET /api/risk-combinations` with query parameters for sorting, pagination, search
- **Risk Scoring** (Updated November 2025): Multi-tier classification prioritizing run-rate-based spare adequacy:
  - **Critical**: Spare count < 5% of monthly run rate (insufficient buffer for high-demand models)
    - Formula: `spare_count < (run_rate × 0.05)` where `run_rate = claims_last_6_months / 6`
    - Example: 4 claims/month requires ≥0.2 spares to avoid critical status
  - **High**: Coverage ratio <50% OR (run rate ≥4/mo AND coverage <75%)
  - **Medium**: Coverage 50-110% with claim activity OR run rate ≥1/mo
  - **Low**: All other combinations
- **Analysis Period**: Rolling 6-month window for claims and replacements analysis
- **Metrics**: Coverage ratio, monthly run rate, fulfillment rate (replacements/claims), available stock count, risk score
- **UI Features** (November 2025):
  - **Table**: 8-column display with checkbox column, Equipment, Covered, Coverage, Available Stock, Run Rate, Spare/Rate, Risk, and Actions
  - **Search**: Debounced search (500ms) by make, model, processor, or generation with maintained input focus during loading
  - **Filter Toggle**: "Exclude 0 covered" switch to show/hide units with zero covered count
  - **Bulk Selection**: Multi-row selection with checkboxes and "Select All" functionality
  - **Bulk Actions**: When items selected, bulk action bar appears with "Send Combined Alert" and "Create Combined Pool" buttons; individual row actions hide during bulk selection
  - **Filter Persistence**: Applied filters (search, zero-coverage toggle) retained during bulk selection operations
- **Actions**:
  - **Single-item**: Row-level "Alert" and "Pool" buttons for individual combinations
  - **Bulk operations**: Combined alert webhook and pool creation for multiple selected items
- **Alert Webhook** (Updated November 2025): `POST /api/risk-combinations/send-alert` always sends data as array with consistent schema
  - Request format: `{ combinations: RiskCombination[] }` (array for both single and multiple items)
  - Response includes `count` and `timestamp` for tracking
- **Integration**: Sends structured JSON payloads to configured Power Automate webhook URL with equipment details, risk metrics, count, and timestamp

**Coverage Pool Analytics System** (October 2025):
- **Endpoint**: `GET /api/coverage-pools/:id/analytics` with query parameters for timeRangeMonths and forecastMonths
- **Monthly Aggregation**: Uses SQL date_trunc to group claims and replacements by month, calculating coverage ratio, fulfillment rate, and net backlog for each period
- **Growth Metrics**: Calculates month-over-month (MoM) and year-over-year (YoY) percentage changes for claims trends
- **Demand Forecasting**: Implements 3-month moving average for claims prediction with confidence intervals (±20% of forecast value)
- **KPI Calculations**:
  - Coverage Ratio: (spare units / covered units) × 100% compared against target
  - Average Fulfillment Rate: Average of (replacements / claims) across all months
  - Claims Growth: MoM or YoY percentage change with directional indicators
  - Inventory Runway: Months of coverage at current claim rate (spare units / avg monthly claims)
- **Recommendations Engine**: Generates actionable guidance based on coverage status, target thresholds, and runway projections
- **Pool Detail Dashboard**: Full-page analytics view featuring 5 KPI cards with explanatory tooltips (Coverage Ratio, Fulfillment Rate, Claims Growth, Inventory Runway, Available Stock), dual-axis trend chart (claims vs replacements with forecast extension), monthly breakdown table, color-coded status indicators, and Excel export dropdown for downloading pool-filtered data (spare units, covered units, claims, replacements). The Available Stock KPI (October 2025) displays pool-matching units outside the warranty pool that can be allocated on-demand to address coverage deficits.

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