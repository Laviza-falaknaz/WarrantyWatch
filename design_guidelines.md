# Warranty Pool Management - Modern B2B SaaS Design System

## Design Philosophy

**Approach**: Modern B2B SaaS Dashboard - Clean, Sophisticated, Data-Dense
**Inspiration**: Contemporary enterprise tools (Linear, Notion, Stripe Dashboard)

**Core Principles**:
- **Clean & Organized**: Generous white space, clear visual hierarchy, structured layouts
- **Sophisticated**: Refined typography, subtle interactions, professional color palette
- **Modern**: Vibrant pastels on clean white, sharp borders, contemporary spacing
- **Data-First**: High information density without clutter

---

## Color System

### Primary Palette (Vibrant Pastels on White)

**Brand Colors** (More Saturated):
- **Primary (Vibrant Peach)**: #FF9B7A - Primary actions, key metrics, active states
- **Secondary (Vibrant Lavender)**: #B4A7FF - Secondary actions, complementary elements
- **Accent (Vibrant Mint)**: #7EDDBA - Success, positive metrics, confirmations
- **Info (Bright Blue)**: #7AB8FF - Informational, neutral highlights
- **Warning (Coral Rose)**: #FF7A9E - Alerts, warnings, attention required

**Neutral Palette**:
- **Background**: #FAFAFA - Very light neutral gray (clean, not stark white)
- **Surface**: #FFFFFF - Pure white for cards and elevated surfaces
- **Border**: #E4E4E7 - Subtle gray borders (not too light)
- **Text Primary**: #18181B - Near black for headings
- **Text Secondary**: #52525B - Medium gray for body text
- **Text Tertiary**: #A1A1AA - Light gray for metadata

**Chart Colors** (5-color coordinated palette):
1. #FF9B7A (Peach)
2. #B4A7FF (Lavender)
3. #7EDDBA (Mint)
4. #7AB8FF (Blue)
5. #FF7A9E (Rose)

### Status Color System

- **Success/Active**: Mint (#7EDDBA) on mint/10 background
- **Warning/Pending**: Peach (#FF9B7A) on peach/10 background
- **Error/Critical**: Rose (#FF7A9E) on rose/10 background
- **Info/Neutral**: Blue (#7AB8FF) on blue/10 background

---

## Typography System

**Font Stack**:
- **Primary**: Inter (all weights) - Clean, modern, highly legible
- **Monospace**: JetBrains Mono - Serial numbers, IDs, code

**Type Scale**:
- **Display**: text-4xl font-bold (36px) - Major page headers
- **H1**: text-3xl font-bold (30px) - Page titles
- **H2**: text-2xl font-semibold (24px) - Section headers
- **H3**: text-xl font-semibold (20px) - Card titles
- **H4**: text-lg font-medium (18px) - Subsection titles
- **Body Large**: text-base (16px) - Primary content
- **Body**: text-sm (14px) - Default text
- **Caption**: text-xs (12px) - Metadata, labels
- **Metric Large**: text-5xl font-bold - Dashboard KPIs
- **Metric Medium**: text-3xl font-bold - Card metrics

**Font Weights**:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

---

## Layout & Spacing

**Spacing Scale** (Tailwind units):
- **Micro**: 1, 2 (4px, 8px) - Tight spacing, icon gaps
- **Small**: 3, 4 (12px, 16px) - Component internal padding
- **Medium**: 6, 8 (24px, 32px) - Card padding, section gaps
- **Large**: 12, 16 (48px, 64px) - Page sections, major separators

**Container Widths**:
- **Sidebar**: 280px (w-70) - Modern width for navigation
- **Content Max**: 1400px - Maximum content width
- **Card Max**: Full width with proper gutters

**Grid Systems**:
- **Dashboard Metrics**: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- **Content Cards**: grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6
- **Table Layouts**: Full-width responsive with horizontal scroll

---

## Component Specifications

### Navigation

**Sidebar**:
- Width: 280px
- Background: Pure white (#FFFFFF)
- Border: 1px solid #E4E4E7 (right border only)
- Logo area: h-16, px-6
- Navigation groups: space-y-6, px-4
- Group labels: text-xs font-semibold uppercase tracking-wider text-tertiary
- Nav items: rounded-lg, px-3, py-2, hover:bg-gray-50, active:bg-primary/10
- Active state: bg-primary/10 text-primary font-medium
- Icons: w-5 h-5, text-secondary

**Top Bar** (if used):
- Height: 64px
- Background: white
- Border: 1px bottom
- Shadow: subtle (shadow-sm)

### Cards & Surfaces

**Metric Cards** (KPI):
- Background: white
- Border: 1px solid #E4E4E7
- Border-radius: rounded-2xl (16px)
- Padding: p-6
- Shadow: none (rely on border)
- Hover: shadow-sm transition-shadow
- Icon container: w-12 h-12, rounded-xl, bg-{color}/10
- Metric value: text-3xl font-bold text-primary
- Label: text-sm font-medium text-secondary
- Trend indicator: text-xs font-medium

**Data Cards**:
- Same as metric cards
- Header: pb-4 border-b border-gray-100
- Content: pt-4
- Footer (if needed): pt-4 border-t border-gray-100

**Status Cards** (Pool summary):
- Compact design
- Border-left: 4px solid {status-color}
- Padding: p-4
- Background: white

### Data Display

**Tables**:
- Container: white bg, rounded-2xl, border
- Header: bg-gray-50, rounded-t-2xl, sticky top-0
- Header cells: px-6 py-4, text-xs font-semibold uppercase text-secondary
- Body cells: px-6 py-4, text-sm text-primary
- Row hover: bg-gray-50 transition-colors
- Row borders: border-b border-gray-100 last:border-0
- Zebra striping: NO (keep clean)

**Status Badges**:
- Size: px-2.5 py-1
- Border-radius: rounded-full
- Font: text-xs font-medium
- Background: {color}/10
- Text: {color} (darker shade)
- Border: 1px solid {color}/20

**Progress Bars**:
- Height: h-2
- Background: gray-100
- Fill: bg-{color}
- Border-radius: rounded-full
- Overflow: hidden

### Forms & Inputs

**Input Fields**:
- Height: h-10 (40px)
- Padding: px-4
- Border: 1.5px solid #E4E4E7
- Border-radius: rounded-lg
- Focus: ring-2 ring-primary/20 border-primary
- Background: white
- Placeholder: text-tertiary
- Label: text-sm font-medium text-primary mb-2

**Buttons**:
- **Primary**: bg-primary text-white rounded-lg px-4 h-10 font-medium hover:bg-primary/90
- **Secondary**: bg-secondary text-white rounded-lg px-4 h-10 font-medium hover:bg-secondary/90
- **Outline**: border-2 border-gray-200 text-primary rounded-lg px-4 h-10 font-medium hover:bg-gray-50
- **Ghost**: text-primary rounded-lg px-4 h-10 font-medium hover:bg-gray-50
- **Icon**: w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-50

**Dropdowns & Selects**:
- Same styling as inputs
- Chevron icon: right-aligned, text-tertiary
- Menu: white, rounded-xl, shadow-lg, border, mt-2
- Menu items: px-4 py-2.5, hover:bg-gray-50, text-sm

### Charts

**Chart Containers**:
- White background, rounded-2xl, border, p-6
- Title: text-lg font-semibold mb-4
- Height: h-80 (320px) for primary charts
- Height: h-64 (256px) for secondary charts

**Chart Styling**:
- Grid lines: #F4F4F5 (very subtle)
- Axis labels: text-xs text-tertiary
- Tooltips: white bg, rounded-lg, shadow-md, px-3 py-2
- Legend: horizontal, bottom, text-sm, color circles
- Use coordinated pastel palette in sequence

### Filtering & Actions

**Filter Panel**:
- White bg, rounded-xl, border, p-6
- Width: 320px
- Section headers: text-sm font-semibold mb-3
- Sections: space-y-6
- Checkboxes: rounded border-gray-300 text-primary
- Apply button: primary style, full width

**Action Bars**:
- Background: white, border-b
- Height: h-16
- Padding: px-6
- Flex layout: items-center justify-between
- Search: w-80, rounded-lg
- Buttons: gap-3

---

## Page Layouts

### Dashboard

**Structure**:
```
┌─────────────────────────────────────────┐
│  Page Header (h-16)                     │
├─────────────────────────────────────────┤
│  ┌────────┬────────┬────────┬────────┐  │
│  │ KPI 1  │ KPI 2  │ KPI 3  │ KPI 4  │  │ (Metric cards)
│  └────────┴────────┴────────┴────────┘  │
│  ┌─────────────────────────────────────┐│
│  │  Main Content (Data Table/Charts)   ││
│  │  (white card, full width)           ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Spacing**:
- Page padding: p-8
- Section gaps: space-y-6
- Grid gaps: gap-6

### Detail Pages

**Header Section**:
- Breadcrumbs: text-sm text-tertiary, chevron separators
- Title: text-3xl font-bold
- Actions: right-aligned, gap-3
- Divider: border-b, my-6

**Content Tabs** (if needed):
- Border-b border-gray-200
- Active tab: border-b-2 border-primary text-primary font-medium
- Inactive: text-secondary hover:text-primary

---

## Interactions & Animations

**Hover States**:
- Cards: shadow-sm (subtle lift)
- Buttons: opacity-90 or bg-{color}/90
- Table rows: bg-gray-50
- Links: text-primary/80

**Transitions**:
- All: transition-all duration-200
- Colors: transition-colors duration-150
- Shadows: transition-shadow duration-200

**Loading States**:
- Skeleton: bg-gray-100 animate-pulse rounded
- Spinner: border-primary border-t-transparent animate-spin

---

## Responsive Breakpoints

- **Mobile**: < 768px - Stack all, full-width cards
- **Tablet**: 768px - 1024px - 2-column grids
- **Desktop**: 1024px - 1280px - 3-4 column grids
- **Large**: > 1280px - Max width container with gutters

---

## Accessibility

- Minimum contrast: 4.5:1 for text
- Focus indicators: ring-2 ring-primary/50 ring-offset-2
- Keyboard navigation: full support
- ARIA labels: all interactive elements
- Screen reader: meaningful text, live regions for updates

---

## Implementation Notes

**DO**:
- Use pure white (#FFFFFF) for all card backgrounds
- Use subtle borders (1px #E4E4E7) instead of shadows
- Maintain consistent spacing (multiples of 4px)
- Use vibrant pastel accents on clean white backgrounds
- Group related actions and information clearly
- Keep generous white space between sections

**DON'T**:
- Use gray card backgrounds (keep white)
- Over-use shadows (rely on borders)
- Create cluttered layouts
- Mix border and shadow styles
- Use dull, desaturated colors
