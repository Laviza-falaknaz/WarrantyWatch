# Warranty Pool Management Application - Design Guidelines

## Design Approach

**Selected Approach**: Carbon Design System with Soft Pastel Modernization
**Justification**: Enterprise data-heavy dashboard requiring efficient information display while maintaining a calming, approachable aesthetic through gentle color palette and refined visual treatment.

**Core Design Principles**:
- Data-first presentation with soft, professional aesthetics
- Calming pastel palette reduces cognitive load during extended use
- Rounded, card-based layouts with subtle depth
- Consistent visual rhythm across all data views

---

## Color System

**Primary Palette** (Soft Pastels):
- Peach: Primary actions, active states, positive metrics
- Lavender: Secondary actions, category indicators, coverage status
- Mint: Success states, active warranties, healthy metrics
- Soft Blue: Informational elements, neutral data, backgrounds
- Rose: Warnings, expiring items, attention states

**Functional Colors**:
- Background: Very light warm gray (#FAFAF9)
- Card backgrounds: White with subtle peach/lavender tint
- Borders: Light gray with 20% opacity (#E5E5E5)
- Text primary: Charcoal gray (#374151)
- Text secondary: Medium gray (#6B7280)
- Text muted: Light gray (#9CA3AF)

**Chart Palette** (Coordinated Pastels):
- Dataset 1: Soft peach (#FFD4C8)
- Dataset 2: Lavender (#E5DEFF)
- Dataset 3: Mint (#C8F0E3)
- Dataset 4: Soft blue (#D4E8FF)
- Dataset 5: Rose (#FFD4E5)
- Use these in sequence for multi-dataset visualizations

**Status Indicators**:
- Active/Healthy: Mint with darker mint text
- Warning/Expiring: Rose with darker rose text
- Inactive: Soft blue with darker blue text
- In Progress: Lavender with darker lavender text

---

## Typography System

**Font Families**:
- Primary: Inter (Google Fonts CDN)
- Monospace: JetBrains Mono for serial numbers, IDs

**Hierarchy**:
- Page Headers: text-2xl font-semibold (charcoal)
- Section Titles: text-lg font-medium
- Card Headers: text-base font-medium
- Data Labels: text-sm font-medium uppercase tracking-wide (medium gray)
- Body Text: text-sm
- Metrics: text-3xl font-bold (relevant pastel color)
- Metadata: text-xs (light gray)

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Card padding: p-6
- Section gaps: space-y-8
- Component gaps: gap-6
- Tight elements: space-y-2

**Grid Structure**:
- Sidebar: w-64 (soft blue background)
- Dashboard metrics: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Content containers: max-w-7xl mx-auto
- Table layouts: Full-width responsive

---

## Component Library

### Navigation & Structure

**Sidebar**:
- Soft blue background with white text
- Rounded icons (w-5 h-5, Heroicons outline)
- Active state: Lavender background pill with rounded-lg
- Logo area at top (h-16)
- Navigation items with icon + label, p-3 each

**Top Bar**:
- White background, h-16, subtle shadow
- Search bar with rounded-full input, soft blue border
- User profile with rounded-full avatar (peach border)
- Quick actions: rounded-lg buttons with pastel backgrounds

### Dashboard Components

**KPI Metric Cards**:
- White background, rounded-2xl, p-6
- Subtle border (1px, light gray)
- Soft box-shadow for depth
- Large metric value in coordinating pastel (text-3xl font-bold)
- Mini trend indicator with sparkline (Chart.js, matching pastel)
- Label in medium gray (text-sm font-medium)
- Icon in rounded square (w-12 h-12, matching pastel background)

**Coverage Pool Cards**:
- Rounded-2xl with lavender tint background
- Pool name (text-lg font-semibold)
- Large percentage display in lavender (text-4xl)
- Progress bar: rounded-full, mint fill on soft blue track
- Fractional display: "4 / 150 units" (monospace)
- Action button: rounded-lg, peach background

**Alert Banners**:
- Rounded-xl, rose background (15% opacity)
- Rose border (left-4 border width)
- Heroicons exclamation-triangle in rose
- h-14, px-4, dismissible

### Data Display

**Data Tables**:
- White background, rounded-xl
- Header row: soft blue background, rounded-t-xl, sticky
- Rows: hover state with lavender tint (5% opacity)
- Borders: subtle 1px between rows
- Column padding: px-4 py-3
- Sort indicators: Heroicons chevron-up-down
- Pagination: rounded-lg buttons with soft borders

**Status Badges**:
- Rounded-full, px-3 py-1
- Corresponding pastel backgrounds (20% opacity)
- Darker text in matching color family
- text-xs font-medium
- Heroicons icon inline (w-4 h-4)

**Risk Analysis Table**:
- White rounded-2xl card
- Risk level column: Color-coded pills (mint=low, peach=medium, rose=high)
- Coverage % column: Inline progress bars (rounded-full)
- Expandable rows for device details

### Filtering & Search

**Filter Panel**:
- White background, rounded-xl, w-72
- Accordion sections with lavender headers
- Multi-select checkboxes: rounded border, peach check state
- Date range picker: rounded-lg inputs with soft blue accents
- Apply button: peach, rounded-lg
- Clear button: soft blue outline, rounded-lg

### Charts & Visualizations

**Chart Cards**:
- White background, rounded-2xl, p-6
- Chart.js integration (CDN)
- Use coordinated pastel palette in sequence
- Grid lines: light gray (10% opacity)
- Tooltips: rounded-lg, white with subtle shadow
- Legends: bottom placement, rounded pills
- Height: h-72 for primary charts, h-48 for mini dashboards

**Chart Types**:
- Line charts: Warranty expiration trends (gradient fills with pastels)
- Bar charts: Coverage by category (pastel bars with spacing)
- Donut charts: Status distribution (pastel segments)
- Area charts: Historical coverage trends (stacked pastels with transparency)

### Forms & Inputs

**Input Fields**:
- rounded-lg borders, soft blue focus ring
- h-10, px-4
- Placeholder: medium gray
- Labels: text-sm font-medium, charcoal
- Helper text: text-xs, light gray

**Buttons**:
- Primary: Peach background, white text, rounded-lg, h-10
- Secondary: Lavender background, white text, rounded-lg
- Outline: Soft blue border, blue text, rounded-lg
- Icon buttons: rounded-lg, w-10 h-10, pastel backgrounds on hover

### Pool Group Management

**Pool Creation Modal**:
- Centered, rounded-2xl, max-w-2xl
- Backdrop: blur with 50% dark overlay
- Form sections with grouped inputs (space-y-4)
- Specification tags: rounded-full pills, lavender
- Preview panel: soft blue background, rounded-lg
- Actions: Peach primary, soft blue secondary

---

## Responsive Behavior

- Mobile: Single column, collapsible sidebar, bottom nav (rounded-t-2xl)
- Tablet: 2-column metrics, slide-out filters
- Desktop: 4-column metrics, persistent sidebar
- All cards maintain rounded corners at all breakpoints
- Touch targets: min h-12 on mobile

---

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus rings: 2px peach outline with offset
- Minimum contrast ratios maintained despite soft palette
- Screen reader announcements for dynamic data
- Form validation with inline messages in rose

---

## Animation Guidelines

**Purposeful Only**:
- Card hover: subtle lift (shadow increase), duration-200
- Modal entrance: fade + scale, duration-150
- Sidebar toggle: slide, duration-200
- Chart animations: Smooth Chart.js defaults
- Loading states: Pulsing skeleton with lavender tint