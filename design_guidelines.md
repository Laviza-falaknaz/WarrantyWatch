# Warranty Pool Management Application - Design Guidelines

## Design Approach

**Selected Approach**: Design System - Carbon Design System principles
**Justification**: Enterprise data-heavy dashboard requiring consistent, efficient information display with complex data tables, analytics charts, and multi-faceted filtering. Function and usability are paramount for operational efficiency.

**Core Design Principles**:
- Data-first presentation with clear hierarchies
- Maximum information density without overwhelming users
- Scannable layouts optimized for quick decision-making
- Consistent patterns across all data views

---

## Typography System

**Font Families**:
- Primary: Inter (CDN: Google Fonts)
- Monospace: JetBrains Mono for serial numbers, technical IDs

**Hierarchy**:
- Page Headers: text-2xl font-semibold
- Section Titles: text-lg font-medium
- Card Headers: text-base font-medium
- Data Labels: text-sm font-medium uppercase tracking-wide
- Body Text: text-sm
- Data Values: text-sm font-mono (for serial numbers, IDs)
- Metrics/Stats: text-3xl font-bold (for coverage percentages)
- Small Metadata: text-xs (timestamps, status indicators)

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-4 or gap-6
- Tight spacing: space-y-2 (for related items)

**Grid Structure**:
- Main layout: Sidebar (w-64) + Main content area
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for metric cards
- Data tables: Full-width with horizontal scroll if needed
- Filter panel: Fixed left sidebar or collapsible drawer (w-72)

**Container Strategy**:
- Max-width for content: max-w-7xl mx-auto
- Full-width for tables and data grids
- Card max-width: No restriction, responsive to grid

---

## Component Library

### Navigation & Structure

**Top Navigation Bar**:
- Fixed header (h-16) with application logo, global search, user profile
- Breadcrumb navigation below header showing current location
- Quick action buttons (Export Data, Create Pool Group)

**Sidebar Navigation**:
- Persistent left sidebar with icon + label navigation
- Sections: Dashboard, Inventory, Warranties, Pool Groups, Analytics, Settings
- Active state indication with subtle background treatment
- Collapsible for more screen real estate

### Dashboard Components

**Metric Cards** (4-column grid on desktop):
- Large numeric value with trend indicator
- Supporting label and change percentage
- Mini sparkline chart showing 7-day trend
- Height: h-32
- Examples: Total Active Warranties, Pool Coverage %, Expiring Soon, Low Coverage Alerts

**Coverage Status Cards**:
- Pool group name with make/model specification
- Large percentage display (e.g., "2.6%")
- Fractional display: "4 units / 150 required"
- Progress bar visualization
- Action button: "Expand Pool"

**Alert Banner**:
- Positioned below header, dismissible
- Icons from Heroicons (exclamation-triangle for warnings)
- Compact design (h-12) with message and action link

### Data Display

**Data Tables**:
- Sticky header row
- Alternating row treatment for scannability
- Column sorting indicators
- Row selection checkboxes
- Inline action buttons (view, edit) in last column
- Pagination controls (bottom)
- Compact row height with good line-height for readability

**Table Columns Structure**:
- Serial Number (monospace, w-40)
- Make/Model (w-48)
- Specs (Processor/Gen/RAM/HDD) - condensed display
- Warranty Status (badge component)
- Coverage % (if applicable)
- Actions (w-24)

**Status Badges**:
- Pill-shaped with rounded-full
- Small text (text-xs)
- Icons: Heroicons check-circle, x-circle, clock
- Variants: Active, Inactive, Expiring Soon (<30 days)

### Filtering & Search

**Filter Panel**:
- Vertical accordion sections
- Categories: Make, Model, Processor, Generation, RAM, HDD, Display Size, Category
- Multi-select checkboxes with item counts
- Date range pickers for warranty dates
- "Apply Filters" and "Clear All" actions at bottom
- Compact spacing (space-y-2) within sections

**Search Bar**:
- Prominent placement in header (w-96)
- Search icon (Heroicons magnifying-glass)
- Placeholder: "Search by serial number, make, model..."
- Real-time search suggestions dropdown

### Analytics & Visualization

**Chart Components**:
- Line charts for warranty expiration trends (Chart.js via CDN)
- Bar charts for pool coverage by category
- Donut charts for warranty status distribution
- Height: h-64 to h-80
- Legends positioned at bottom or right
- Interactive tooltips on hover

**Chart Grid Layout**:
- 2-column for comparison views (grid-cols-1 lg:grid-cols-2)
- Single column for detailed timeline charts
- Section headers above each chart group

### Pool Group Management

**Pool Group Creation Modal**:
- Centered modal with backdrop blur
- Form layout with grouped inputs
- Multi-select for specifications
- Preview of matching inventory count
- Actions: Cancel, Create Pool Group

**Pool Group Card**:
- Header: Group name + edit/delete actions
- Specification tags (Make, Model, etc.)
- Coverage metrics prominently displayed
- Inventory breakdown table (collapsible)
- "Add Units" action button

### Forms & Inputs

**Input Fields**:
- Label above input (text-sm font-medium)
- Input height: h-10
- Border treatment with focus states
- Helper text below (text-xs)
- Error states with icon + message

**Select Dropdowns**:
- Native select styled consistently
- Multi-select with tag display for selected items
- Search within select for large lists

**Date Pickers**:
- Calendar popup interface
- Range selection for warranty dates
- Quick presets: "Next 30 Days", "Next Quarter"

### Interactive Elements

**Action Buttons**:
- Primary: Solid treatment (Add to Pool, Create Group)
- Secondary: Outline treatment (Cancel, View Details)
- Icon buttons: Square (h-10 w-10) for table actions
- Button heights: h-10 for standard, h-8 for compact contexts

**Loading States**:
- Skeleton screens for tables and cards
- Spinner for button loading states
- Progress bars for data sync operations

---

## Responsive Behavior

**Breakpoints Strategy**:
- Mobile (base): Single-column, stacked metrics, collapsible sidebar
- Tablet (md): 2-column metrics, side-by-side filter panel
- Desktop (lg): 4-column metrics, persistent sidebar, multi-column tables

**Mobile Optimizations**:
- Bottom navigation bar for primary actions
- Collapsible filter drawer (slide from left)
- Simplified table view with expandable rows
- Touch-friendly button sizes (min h-12)

---

## Animation Guidelines

**Minimal, Purposeful Animations**:
- Sidebar collapse/expand: transition-all duration-200
- Modal entrance: fade + scale (duration-150)
- Loading spinners: animate-spin
- Chart data transitions: Smooth interpolation via Chart.js defaults
- Avoid unnecessary hover effects and decorative animations

---

## Accessibility Standards

- ARIA labels for all interactive elements
- Keyboard navigation for tables (arrow keys, tab)
- Focus indicators on all focusable elements
- Screen reader announcements for data updates
- Minimum touch target size: 44x44px on mobile
- Form validation with clear error messaging

---

## Page-Specific Layouts

**Dashboard Page**:
- 4 metric cards at top (grid-cols-4)
- 2-column chart section below
- Recent alerts list (right column)
- Quick actions sidebar

**Inventory List Page**:
- Filter panel (left, w-72)
- Data table (main area)
- Bulk action toolbar above table
- Export and pagination controls

**Pool Groups Page**:
- Grid of pool group cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Each card shows coverage %, inventory count, action buttons
- "Create New Group" card as first item

**Analytics Page**:
- Full-width charts stacked vertically
- Time range selector at top
- Export data button (top-right)
- Detailed metrics table below charts

---

## Icon Library

**Selected**: Heroicons (via CDN)
- Consistent outline style throughout
- Size: w-5 h-5 for inline icons, w-6 h-6 for standalone
- Common icons: chart-bar, shield-check, cpu-chip, server, funnel, magnifying-glass