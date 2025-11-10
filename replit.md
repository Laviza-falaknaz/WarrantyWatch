# Coverage Pool Management Application

## Overview
This application is an enterprise coverage pool management system designed to track warranty coverage for deployed laptop inventory and optimize the allocation of spare units. It features automated risk analysis, Power Automate webhook integration, and intelligent pool creation. The system provides a comprehensive dashboard with high-risk combination analysis, real-time alerting, and actionable recommendations for inventory management. The core concept revolves around managing warranty pools, calculating coverage ratios based on active warranties, and identifying areas needing more spares.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Component System**: shadcn/ui (New York style) built on Radix UI, utilizing Tailwind CSS for styling, adhering to Carbon Design System principles, and supporting dark/light themes.
- **Design System**: Comprehensive pastel theme with specific color palettes for primary, secondary, accent, and destructive elements, and a 5-color coordinated pastel palette for charts. Features rounded-2xl corners for components, MetricCard variants, and soft pill-shaped risk badges.
- **Design Principles**: Data-first presentation for enterprise dashboards, high information density, Inter and JetBrains Mono typography, consistent spacing, and soft pastel aesthetics.
- **State Management**: TanStack Query for server state, local React state for UI, and Context API for theme.
- **Routing**: wouter.
- **Key Pages**: Dashboard (3-column layout with risk analysis), Coverage Pools, Warranty Explorer, Replacement Stock, Stock under Warranty, Available Stock, Claimed Units, Replacements Sent, Configuration (with webhook integration), and Pool Detail (full-page analytics dashboard).
- **Navigation**: Grouped sidebar navigation with sections for Dashboard & Monitoring, Pool Management, Inventory, and Settings.
- **UX Improvements**: Redesigned 3-column dashboard, Risk Analysis & Alerting with webhook integration and auto-pool creation, dedicated full-page pool details dashboard with KPIs, trend forecasting, and recommendations, and Excel export functionality.

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
- **UI Features**: 8-column table with checkboxes, advanced filtering (risk levels, numeric ranges, search, zero-coverage toggle), bulk selection, and bulk actions (Send Combined Alert, Create Combined Pool).
- **Actions**: Single-item and bulk actions for sending alerts and creating pools.
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