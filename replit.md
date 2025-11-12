# Coverage Pool Management Application

## Overview
This application is an enterprise coverage pool management system designed to track warranty coverage for deployed laptop inventory and optimize the allocation of spare units. It features automated risk analysis, Power Automate webhook integration, and intelligent pool creation. The system provides a comprehensive dashboard with units running out analysis, real-time alerting, and actionable recommendations for inventory management. The core concept revolves around managing warranty pools, calculating coverage ratios based on active warranties, and identifying areas needing more spares.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI Component System**: shadcn/ui (New York style) built on Radix UI, utilizing Tailwind CSS for styling, adhering to Carbon Design System principles, and supporting dark/light themes.
- **Design Principles**: Modern B2B SaaS aesthetic with a professional color palette, pure white cards on neutral backgrounds, data-first presentation, high information density, Inter and JetBrains Mono typography.
- **State Management**: TanStack Query for server state, local React state for UI, and Context API for theme.
- **Routing**: wouter.
- **Key Features**: Three-Dashboard Architecture (Monitor for quick summaries/alerting, Risk Combinations for detailed units running out analysis, Explore for BI/analytics), GitHub-style Heatmap for warranty expiration, numeric safety with `|| 0` fallbacks, consistent layout patterns, semantic stat cards, unified export buttons, and skeleton loaders.
- **Monitor Dashboard Layout**: Two-column grid layout with left column (lg:col-span-8) containing Insight Cards, Warranty Expiration Heatmap, Critical Risk Models section, and Models Without Coverage section; right column (lg:col-span-4) containing KPI Cards (Critical/High Risk counts) and Low Coverage Pools section. **Critical Risk Models** displays up to 30 critical-priority models (run_rate >= 1 AND days_of_supply < 30) in a responsive 3-column card grid with red left borders, showing models running out soonest. **Models Without Coverage** is a separate section below Critical Risk Models, displaying up to 20 models with zero active warranty coverage (covered_count = 0) in a 3-column grid with amber left borders, sorted by days of supply. Both sections include models with and without coverage, feature identical card layouts (model name with processor/generation, days remaining badge, coverage status indicator, 5-column metrics row for Active/Spare/Run/UK/UAE counts, bulk selection checkboxes, and quick-action Alert/Pool buttons), maintain separate bulk-selection state for independent actions, and include "View All" links to the Risk Combinations page with appropriate filters. Cards use minimal spacing and compact typography for maximum information density.
- **Units Running Out - Two-Part Architecture**: (1) **Monitor Dashboard Summary**: Shows top 10 models running out soonest with "View All" button linking to full Risk Combinations page; (2) **Risk Combinations Page** (/risk-combinations): Full-featured analysis page with server-side pagination, sortable table (default: days of supply ASC), comprehensive filtering (coverage % range, risk levels, make/model, search), covered/not-covered categorization, bulk actions, and CSV export. **Default Filter**: Page loads with Critical, High, and Medium risk levels pre-selected, focusing on high-priority items requiring attention while excluding Low-risk items and items with no demand. Both views share the same `/api/risk-combinations` backend API with different query parameters. **Risk Categorization**: Based on days of supply remaining - Critical (<30 days), High (30-60 days), Medium (60-120 days), Low (120+ days or no demand). Calculation: days_of_supply = (spare_count / run_rate_per_month) * 30.
- **Warranty Expiration Heatmap**: Production-optimized with server-side aggregation to handle 100k+ warranty records. Features improved visual design (16x16px cells, vibrant color scheme, month/day labels, "Today" highlight) and enhanced filtering (dropdowns for Make, Model, Customer, Order; server-side case-insensitive filtering; removable badges). Uses `/api/covered-units/expirations` endpoint for daily aggregation across all production data, eliminating the previous 10k query limit. Interactive cells (now `<button>` elements for accessibility) open a detailed dialog with on-demand unit fetching, search, and Excel export. Filter options fetched from `/api/covered-units/filter-options` to show all available makes/models/customers/orders from complete dataset.
- **Unified Pool Card Design**: Consistent, data-focused card design across all pool views, featuring Inventory Runway Panel (color-coded, critical logic for "No Recent Demand"), 4-column metrics grid (Covered Units, Spare Units, Demand/Month, Net Gap), and Regional Stock Breakdown.
- **Pool Detail Page Layout**: Compact 2-column design with key metrics (Inventory Runway, 4-column grid) and supporting data (Available Stock, Activity Summary).
- **Explore Dashboard BI Analytics**: Provides 9 interactive charts with global multi-select filtering capabilities (Make, Model, Customer, Order). Charts include various data visualizations for warranties, claims, replacements, and spare units. Filtering is case-insensitive and uses consistent query keys for caching. Chart readability enhancements include increased height, refined axis labels, truncated text, and varied color palettes.
- **Warranty Explorer** (Analytics-Focused): Modern data exploration interface with comprehensive analytics and insights. Features include: (1) **KPI Dashboard**: Four key metrics cards (Total Coverage, Active Warranties, Expiring Soon, Unique Customers) with modern design and accurate calculations; (2) **Analytics Visualizations**: Coverage Timeline area chart showing warranty starts/ends by month, Expiration Risk Analysis horizontal bar chart (0-30, 31-90, 91-180, 180+ days), Top Customers bar chart (top 10), Coverage by Manufacturer pie chart; (3) **Date Range Filtering**: Calendar pickers for coverage start and end date ranges with quick presets (Last 30/90/180/365 days), defaulting to last 12 months; (4) **Advanced Filtering**: Case-insensitive multi-select filters for Make, Model, Customer, Order Number, Processor, RAM, Category, Coverage Type, and Status; (5) **Table Grouping**: Dynamic grouping by Customer, Make, Model, or Status with group headers and subtotal rows; (6) **Drill-down Details**: Side panel with complete warranty information for selected units; (7) **Global Search**: Across serial number, make, model, customer, and order fields; (8) **Export & Pagination**: Excel export of filtered data, 50 records per page. Built with Recharts for visualizations, follows modern B2B SaaS design with soft colors, rounded borders, professional spacing, and high information density.

### Backend
- **Framework**: Express.js with TypeScript on Node.js.
- **Server Structure**: RESTful API organized by domain, with middleware for JSON parsing, logging, and error handling.
- **API Endpoints**: CRUD operations for units and pools, analytics, configuration, risk analysis, webhook integration, and bulk upload endpoints for various data types with deduplication.
- **Data Access Layer**: Storage abstraction using an `IStorage` interface.
- **Performance & Scalability**: Server-side pagination, query limits, lightweight stats, and optimized bulk upload processes.
- **Units Running Out Analysis System**: `GET /api/risk-combinations` endpoint with multi-tier risk scoring (Critical, High, Medium, Low) based on days of supply remaining. **Risk Categorization Logic**: Only units with run_rate >= 1.0 (meaningful demand) are categorized by urgency; units with run_rate < 1.0 are automatically treated as Low priority (no significant demand). **Risk Thresholds** (for run_rate >= 1.0): Critical (<30 days - won't last a month), High (30-60 days), Medium (60-120 days), Low (120+ days or insufficient demand). **Calculation**: days_of_supply = (spare_count / run_rate_per_month) * 30; run_rate_per_month = claims_last_6_months / 6. Supports server-side pagination, sorting (by days_of_supply, coverage ratio, risk score, spare count, run rate - default: daysOfSupply ASC with NULLS LAST), status filtering (`?status=active|inactive|all`) for warranty lifecycle management, and advanced filtering (coverage % range, risk levels, make/model, search, coveredCountMax for zero-coverage filtering). Returns `{ data, total, stats }` format where stats are calculated from entire filtered dataset using SQL CTEs before pagination, ensuring accurate critical/high/medium/low counts and worst deficit across all pages. Used by both Monitor Dashboard (top 30 critical models with `limit=30&sortBy=daysOfSupply&sortOrder=asc&riskLevels=critical`) and Risk Combinations page (full paginated view with user-controlled filters/sorting). Dedicated `/api/risk-combinations/export` endpoint provides truly unpaginated CSV export of complete filtered dataset with formula injection protection (sanitizes =+-@ prefixes).
- **Warranty Heatmap Aggregation**: `GET /api/covered-units/expirations` endpoint for server-side daily aggregation of warranty expirations, supporting 100k+ records with filters (startDate, endDate, make, model, customerName, orderNumber). Returns aggregated counts by date for efficient heat map rendering without client-side data limits.
- **Coverage Pool Analytics System**: `GET /api/coverage-pools/:id/analytics` for time-series analysis, monthly aggregation of claims and replacements, 3-month moving average demand forecasting, and KPIs (Coverage Ratio, Average Fulfillment Rate, Claims Growth, Inventory Runway). Includes a recommendations engine.

### Data Storage
- **Database**: PostgreSQL via Neon Serverless.
- **ORM**: Drizzle ORM for type-safe queries, schema-first approach, and migration support.
- **Schema Design**: Tables for `spare_unit`, `covered_unit`, `coverage_pool` (with JSON-serialized filter criteria), `available_stock`, `claims`, `replacements`, and a single-row `app_configuration` table. Uses UUID primary keys, composite keys, and audit timestamps.

### Runtime Configuration
- **Purpose**: Allows dynamic configuration of system thresholds and preferences.
- **Implementation**: Single-row `app_configuration` table with strongly-typed fields (e.g., `lowCoverageThresholdPercent`, `expiringCoverageDays`, `alertWebhookUrl`).
- **Security**: Configuration updates require admin password authentication.

### Authentication and Authorization
- **Current State**: No authentication/authorization implemented; assumes a trusted internal network.

## External Dependencies

### Third-party Services
- **Neon Database**: Serverless PostgreSQL.
- **Google Fonts CDN**: For Inter and JetBrains Mono fonts.

### Key NPM Packages
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
- **xlsx**: Excel file generation.