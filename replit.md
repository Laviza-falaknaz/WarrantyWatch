# Coverage Pool Management Application

## Overview
This application is an enterprise coverage pool management system designed to track warranty coverage for deployed laptop inventory and optimize the allocation of spare units. It features automated risk analysis, Power Automate webhook integration, and intelligent pool creation. The system provides a comprehensive dashboard with high-risk combination analysis, real-time alerting, and actionable recommendations for inventory management. The core concept revolves around managing warranty pools, calculating coverage ratios based on active warranties, and identifying areas needing more spares.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI Component System**: shadcn/ui (New York style) built on Radix UI, utilizing Tailwind CSS for styling, adhering to Carbon Design System principles, and supporting dark/light themes.
- **Design Principles**: Modern B2B SaaS aesthetic with a subtle professional color palette, pure white cards on clean neutral backgrounds, data-first presentation, high information density, Inter and JetBrains Mono typography, and consistent spacing.
- **State Management**: TanStack Query for server state, local React state for UI, and Context API for theme.
- **Routing**: wouter.
- **Key Pages**: Monitor Dashboard, Explore Dashboard, Risk Combinations, Configuration, Coverage Pools, Inventory, Warranties, Claims, Replacements, Available Stock, Pool Detail, Warranty Explorer.
- **Navigation**: Collapsible sidebar with Framer Motion animations, modern top bar with search, system status, notifications, and theme toggle.
- **Redesign Features**: Two-Dashboard Architecture (Monitor for tracking/alerting, Explore for BI/analytics), GitHub-style Heatmap for warranty expiration, numeric safety with `|| 0` fallbacks, consistent layout patterns, semantic stat cards, unified export buttons, and skeleton loaders.

### Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js.
- **Server Structure**: RESTful API organized by domain, with middleware for JSON parsing, logging, and error handling.
- **API Endpoints**: CRUD operations for units and pools, analytics, configuration, risk analysis, webhook integration, and bulk upload endpoints for `spare_unit`, `covered_unit`, `available_stock`, `claims`, and `replacements` with deduplication.
- **Data Access Layer**: Storage abstraction using an `IStorage` interface.
- **Performance & Scalability**: Server-side pagination, query limits, lightweight stats, and optimized bulk upload processes.

### Data Storage
- **Database**: PostgreSQL via Neon Serverless.
- **ORM**: Drizzle ORM for type-safe queries, schema-first approach, and migration support.
- **Schema Design**: Tables for `spare_unit`, `covered_unit`, `coverage_pool` (with JSON-serialized filter criteria), `available_stock`, `claims`, `replacements`, and a single-row `app_configuration` table. Uses UUID primary keys, composite keys for tracking, and audit timestamps.

### Runtime Configuration System
- **Purpose**: Allows dynamic configuration of system thresholds and preferences.
- **Implementation**: Single-row `app_configuration` table with strongly-typed fields for settings like `lowCoverageThresholdPercent`, `expiringCoverageDays`, `alertWebhookUrl`, etc.
- **Security**: Configuration updates require admin password authentication.

### High-Risk Combination Analysis System
- **Endpoint**: `GET /api/risk-combinations` with server-side filtering, sorting, and pagination.
- **Risk Scoring**: Multi-tier classification (Critical, High, Medium, Low) based on spare count relative to monthly run rate and coverage ratio over a rolling 6-month window.
- **Metrics**: Includes Available Stock (UK/UAE), Covered Units, Spare Units, Run Rate, Warranty Coverage %, Spare Coverage %, and a numeric Risk Score.
- **Type System**: Shared types in `shared/risk-analysis-types.ts` for `RiskLevel` and `RiskCombination`.
- **UI Features**: Compact card view on Monitor Dashboard with advanced filtering, multi-selection, and bulk actions. Dedicated Risk Combinations page with a full-page data table, sortable columns, client-side search/filtering, pagination, and color-coded percentage metrics.
- **Actions**: Single-item and bulk actions for sending alerts and creating pools with API integration, error handling, toast feedback, and cache invalidation.
- **Alert Webhook**: Configured in the Configuration page, sends structured JSON payloads to Power Automate.

### Coverage Pool Analytics System
- **Endpoint**: `GET /api/coverage-pools/:id/analytics` for time-series analysis and forecasting.
- **Analytics**: Monthly aggregation of claims and replacements, growth metrics, 3-month moving average demand forecasting, and KPIs (Coverage Ratio, Average Fulfillment Rate, Claims Growth, Inventory Runway).
- **Recommendations Engine**: Generates actionable guidance.
- **UI**: Pool Detail Dashboard features KPI cards, trend charts, monthly breakdown, and Excel export.

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
- **react-chartjs-2 & chart.js**: Interactive charting library.