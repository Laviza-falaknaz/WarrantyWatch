# Coverage Pool Management Application

## Overview
This application is an enterprise coverage pool management system designed to track warranty coverage for deployed laptop inventory and optimize the allocation of spare units. It features automated risk analysis, Power Automate webhook integration, and intelligent pool creation. The system provides a comprehensive dashboard with high-risk combination analysis, real-time alerting, and actionable recommendations for inventory management. The core concept revolves around managing warranty pools, calculating coverage ratios based on active warranties, and identifying areas needing more spares.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Component System**: shadcn/ui (New York style) built on Radix UI, utilizing Tailwind CSS for styling, adhering to Carbon Design System principles, and supporting dark/light themes.
- **Design System**: Modern B2B SaaS aesthetic with subtle professional color palette, pure white cards on clean neutral backgrounds, comprehensive design guidelines in design_guidelines.md. Features rounded-2xl corners, border-first styling, MetricCard with color-coded variants (primary/secondary/accent), and soft pill-shaped risk badges.
- **Color Palette**: Subtle & Professional - Primary Soft Slate Blue (#6B7FBD), Secondary Gentle Lavender (#9B93D4), Accent Soft Teal (#5EBFB3), Info Subtle Blue (#6EA8DC), Warning Muted Amber (#E89B6B), Error Soft Coral (#E87D8F). Colors are muted and understated for enterprise professionalism.
- **Design Principles**: Data-first presentation for enterprise dashboards, sophisticated and organized layouts, high information density, Inter and JetBrains Mono typography, consistent spacing (p-8 page padding, gap-6 between cards), pure white cards (not greyish), clean neutral backgrounds.
- **State Management**: TanStack Query for server state, local React state for UI, and Context API for theme.
- **Routing**: wouter.
- **Key Pages** (All Redesigned November 2025):
  - **Monitor Dashboard** (`/`) - 2-column responsive layout (lg:9/3 ratio for 75%/25% split). Left Column (lg:col-span-9): 3 insight cards (Total Expiring, Peak Day, High-Risk Days) in 3-column grid, GitHub-style heatmap with inline filter toolbar (Order #, Customer, Make, Model always visible), active filter chips with individual clear buttons, month header row instead of weekday labels, 6-month view default, hover tooltips with unit details, 4 coverage pool cards in 2-column grid sorted by least covered first (clickable to pool detail), and "View All" link in pools section header navigating to /pools. Right Column (lg:col-span-3): High-risk combinations with highly distinctive risk badges (Critical=Bold Red, High=Bold Orange, Medium=Amber, Low=Green), advanced filtering (search by make/model/processor, risk level dropdown), toggle to include/exclude 0-covered units (default: exclude), stable selection system using composite keys for persistence across filter changes, checkbox-based multi-selection with intelligent Select All/Deselect All buttons (adds/removes only filtered items while preserving cross-filter selections), bulk actions (Send Combined Alert, Create Combined Pool) that appear when items selected with toast notifications, individual action buttons (Send Alert with Bell icon, Create Pool with FolderPlus icon) that hide when multiple items selected, and "View All Risk Profiles" scroll button for in-page navigation to risk section
  - **Explore Dashboard** (`/explore`) - Comprehensive BI report interface with 7 summary stat cards, 6-tab data explorer (Warranties, Spare Stock, Available, Claims, Replacements, Pools), search functionality, export button, and tabular views for navigating all warranty data, stock, claims, replacements, and spare pool
  - **Configuration** (`/configuration`) - 5-tab interface (Thresholds, Timeframes, Alerts, Analytics, Integrations) with contextual icons, inline helpers, sticky action footer
  - **Coverage Pools** (`/pools`) - Summary KPI cards (Total/Avg Coverage/Healthy/Critical), status filtering, grid/list view toggle, improved pool creation dialog
  - **Inventory** (`/inventory`) - 4 stat cards (Total/Available/Reserved/Retired), toggleable filter panel with count badge, modern header design
  - **Warranties** (`/warranties`) - 4 stat cards (Total/Active/Expiring/Expired) with color-coded accents (blue/orange/red), enhanced search and export
  - **Claims** (`/claims`) - Single stat card (Total Claims) with FileWarning icon, Excel export functionality
  - **Replacements** (`/replacements`) - Single stat card (Total Replacements) with RefreshCw icon, Excel export functionality
  - **Available Stock** (`/available-stock`) - 3 stat cards (Total/Available/Reserved) with color-coded accents (green/amber)
  - **Pool Detail** (`/pools/:id`) - Full-page analytics dashboard with KPIs, trend forecasting, recommendations, Excel export
  - **Warranty Explorer** - External API integration with charts and filtering
- **Navigation**: Shadcn SidebarProvider with AppSidebar.tsx component using proper 3-section organization: Dashboards (Monitor, Explore, Warranty Explorer), Inventory (Covered Units, Available Stock, Spare Units, Replacements Sent, Warranties Claims), and Settings (Configuration). Sidebar uses SidebarMenuButton components for navigation. Modern top bar with search (⌘K), system status badge, notifications, and theme toggle. ThemeProvider correctly wraps AppContent component to avoid context errors.
- **Redesign Features** (Completed November 2025):
  - **Two-Dashboard Architecture**: Separate Monitor (tracking/alerting) and Explore (BI/analytics) dashboards for distinct user workflows
  - **Modern Navigation**: Collapsible sidebar with Framer Motion animations, smooth transitions (160-220ms), reduced-motion guards
  - **GitHub-Style Heatmap**: Day-by-day warranty expiration visualization with 6 intensity levels, hover tooltips, and navigable time windows
  - **Numeric Safety**: All numeric values defensively handled with `|| 0` fallbacks before formatting to prevent NaN crashes
  - **Consistent Layout Pattern**: All pages use p-8 padding, text-3xl font-bold headers, rounded-2xl stat cards with hover-elevate transitions
  - **Stat Cards**: text-4xl font-bold tracking-tight numbers, semantic icons with color-coded backgrounds (green/blue/orange/red/yellow/amber)
  - **Export Buttons**: Unified size="lg" styling across all data-heavy pages
  - **Data Flow**: Consistent search → pagination → table pattern with 100 items per page
  - **Loading States**: Skeleton loaders matching final layout structure to prevent content jumps
  - **Design Compliance**: rounded-2xl (not rounded-3xl), border (not border-2), white card backgrounds, no heavy gradients, proper hover interactions

### Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js.
- **Server Structure**: RESTful API organized by domain, with middleware for JSON parsing, logging, and error handling.
- **API Endpoints**: CRUD operations for units and pools, analytics, configuration, risk analysis, webhook integration, dedicated stats, and bulk upload endpoints for `spare_unit`, `covered_unit`, `available_stock`, `claims`, and `replacements`. Bulk upload for claims and replacements includes automatic deduplication based on composite keys and date.
- **Data Access Layer**: Storage abstraction using an `IStorage` interface.
- **Performance & Scalability**: Server-side pagination, query limits, lightweight stats endpoints, and optimized bulk upload processes.

### Data Storage
- **Database**: PostgreSQL via Neon Serverless.
- **ORM**: Drizzle ORM for type-safe queries, schema-first approach, and migration support.
- **Schema Design**: Tables for `spare_unit`, `covered_unit`, `coverage_pool` (with JSON-serialized filter criteria), `available_stock`, `claims`, `replacements`, and a single-row `app_configuration` table. Key design decisions include matching specification fields, UUID primary keys, composite keys for tracking, and audit timestamps.

### Runtime Configuration System
- **Purpose**: Allows dynamic configuration of system thresholds and preferences.
- **Implementation**: Single-row `app_configuration` table with strongly-typed fields.
- **Settings**: Includes `lowCoverageThresholdPercent`, `expiringCoverageDays`, `poolInactivityDays`, `enableLowCoverageAlerts`, `enableExpiringAlerts`, `dashboardRefreshMinutes`, `targetCoveragePercent`, `analyticsTimeRangeMonths`, `analyticsForecastMonths`, and `alertWebhookUrl`.
- **Security**: Configuration updates require admin password authentication.
- **UI**: Configuration page with form-based interface for settings and webhook URL.

### High-Risk Combination Analysis System
- **Endpoint**: `GET /api/risk-combinations` with server-side filtering for security and scalability.
- **Risk Scoring**: Multi-tier classification (Critical, High, Medium, Low) based on spare count relative to monthly run rate and coverage ratio.
- **Analysis Period**: Rolling 6-month window for claims and replacements.
- **Metrics**: Coverage ratio, monthly run rate, fulfillment rate, available stock count, and risk score.
- **UI Features**: Monitor Dashboard includes compact card view with advanced filtering (search by make/model/processor, risk level dropdown), toggle to include/exclude 0-covered units (default: exclude), stable selection system using composite keys (make|model|processor|generation) for persistence across filter changes, checkbox-based multi-selection with intelligent Select All/Deselect All buttons (adds/removes only filtered items while preserving cross-filter selections), bulk actions (Send Combined Alert, Create Combined Pool) that appear when items selected with toast notifications, individual action buttons (Send Alert with Bell icon, Create Pool with FolderPlus icon) that hide when multiple items selected, and "View All Risk Profiles" scroll button for in-page navigation to risk section.
- **Actions**: Single-item and bulk actions for sending alerts and creating pools with toast feedback and proper error handling.
- **Alert Webhook**: `POST /api/risk-combinations/send-alert` sends structured JSON payloads to a configured Power Automate webhook URL.

### Coverage Pool Analytics System
- **Endpoint**: `GET /api/coverage-pools/:id/analytics` with parameters for time range and forecast.
- **Analytics**: Monthly aggregation of claims and replacements, growth metrics (MoM, YoY), 3-month moving average demand forecasting, and KPI calculations (Coverage Ratio, Average Fulfillment Rate, Claims Growth, Inventory Runway).
- **Recommendations Engine**: Generates actionable guidance based on coverage status and projections.
- **Pool Detail Dashboard**: Full-page analytics view with KPI cards, dual-axis trend chart, monthly breakdown table, and Excel export.

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
- **xlsx**: Excel file generation for data export.
- **react-chartjs-2 & chart.js**: Interactive charting library.