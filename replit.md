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
- **Key Features**: Two-Dashboard Architecture (Monitor for tracking/alerting, Explore for BI/analytics), GitHub-style Heatmap for warranty expiration, numeric safety with `|| 0` fallbacks, consistent layout patterns, semantic stat cards, unified export buttons, and skeleton loaders.
- **Warranty Expiration Heatmap**: Rebuilt with improved visual design (16x16px cells, vibrant color scheme, month/day labels, "Today" highlight) and enhanced filtering (dropdowns for Make, Model, Customer, Order; dynamic options; case-insensitive filtering; removable badges). Interactive cells open a detailed dialog with warranty details, search, and Excel export.
- **Unified Pool Card Design**: Consistent, data-focused card design across all pool views, featuring Inventory Runway Panel (color-coded, critical logic for "No Recent Demand"), 4-column metrics grid (Covered Units, Spare Units, Demand/Month, Net Gap), and Regional Stock Breakdown.
- **Pool Detail Page Layout**: Compact 2-column design with key metrics (Inventory Runway, 4-column grid) and supporting data (Available Stock, Activity Summary).
- **Explore Dashboard BI Analytics**: Provides 9 interactive charts with global multi-select filtering capabilities (Make, Model, Customer, Order). Charts include various data visualizations for warranties, claims, replacements, and spare units. Filtering is case-insensitive and uses consistent query keys for caching. Chart readability enhancements include increased height, refined axis labels, truncated text, and varied color palettes.

### Backend
- **Framework**: Express.js with TypeScript on Node.js.
- **Server Structure**: RESTful API organized by domain, with middleware for JSON parsing, logging, and error handling.
- **API Endpoints**: CRUD operations for units and pools, analytics, configuration, risk analysis, webhook integration, and bulk upload endpoints for various data types with deduplication.
- **Data Access Layer**: Storage abstraction using an `IStorage` interface.
- **Performance & Scalability**: Server-side pagination, query limits, lightweight stats, and optimized bulk upload processes.
- **Units Running Out Analysis System**: `GET /api/risk-combinations` endpoint with multi-tier risk scoring (Critical, High, Medium, Low) based on spare count and coverage ratio. Provides metrics like Available Stock, Covered Units, Spare Units, Run Rate, and Risk Score. UI features include action-oriented dashboard cards, advanced filtering, and bulk actions for alerts and pool creation.
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