# Warranty Pool Management - Modern B2B SaaS Design System

## Design Philosophy

**Approach**: Modern B2B SaaS Dashboard - Clean, Sophisticated, Data-Dense
**Inspiration**: Contemporary enterprise tools (Linear, Notion, Stripe Dashboard, Asana)

**Core Principles**:
- **Clean & Organized**: Generous white space, clear visual hierarchy, structured layouts
- **Sophisticated**: Refined typography, subtle interactions, professional color palette
- **Modern**: Subtle, muted colors on clean white, sharp borders, contemporary spacing
- **Data-First**: High information density without clutter
- **Professional**: Understated elegance, not bold or vibrant

---

## Color System

### Primary Palette (Subtle & Professional)

**Brand Colors** (Muted & Sophisticated):
- **Primary (Soft Slate Blue)**: #6B7FBD - Primary actions, key metrics, calm and professional
- **Secondary (Gentle Lavender)**: #9B93D4 - Secondary actions, complementary elements
- **Accent (Soft Teal)**: #5EBFB3 - Success, positive metrics, gentle confirmations
- **Info (Subtle Blue)**: #6EA8DC - Informational, neutral highlights
- **Warning (Muted Amber)**: #E89B6B - Alerts, warnings, gentle attention
- **Error (Soft Coral)**: #E87D8F - Errors, critical items, understated urgency

**Neutral Palette**:
- **Background**: #FAFAFA - Very light neutral gray (clean, not stark white)
- **Surface**: #FFFFFF - Pure white for cards and elevated surfaces
- **Border**: #E4E4E7 - Subtle gray borders (not too light)
- **Text Primary**: #18181B - Near black for headings
- **Text Secondary**: #52525B - Medium gray for body text
- **Text Tertiary**: #A1A1AA - Light gray for metadata

**Chart Colors** (5-color coordinated subtle palette):
1. #6B7FBD (Slate Blue)
2. #9B93D4 (Lavender)
3. #5EBFB3 (Teal)
4. #6EA8DC (Blue)
5. #E89B6B (Amber)

### Status Color System

- **Success/Active**: Soft Teal (#5EBFB3) on teal/10 background
- **Warning/Pending**: Muted Amber (#E89B6B) on amber/10 background
- **Error/Critical**: Soft Coral (#E87D8F) on coral/10 background
- **Info/Neutral**: Subtle Blue (#6EA8DC) on blue/10 background
- **Primary**: Soft Slate Blue (#6B7FBD) on blue/10 background

### Semantic Color Usage

**Status Indicators**:
- **Available/Active Coverage**: Soft Teal (#5EBFB3) - calm, positive
- **Reserved/Expiring Soon**: Muted Amber (#E89B6B) - gentle warning
- **Retired/Expired**: Soft Coral (#E87D8F) - understated urgency
- **Total/Neutral**: Soft Slate Blue (#6B7FBD) - professional, calm

**Color Characteristics**:
- **Not Bold**: All colors are muted and understated
- **Not Vibrant**: Saturation kept below 50% for professional look
- **Subtle**: Colors work harmoniously without competing for attention
- **Professional**: Suitable for enterprise B2B environments

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
- Hover: hover-elevate (subtle background lift)
- Transition: transition-all

**Icon Badges** (in metric cards):
- Size: p-3 (12px padding)
- Border-radius: rounded-xl
- Background: color/10 opacity
- Icon size: h-6 w-6
- Colors match metric type (teal for available, amber for warning, etc.)

**Content Cards**:
- Background: white
- Border: 1px solid #E4E4E7
- Border-radius: rounded-2xl
- Padding: p-6
- Shadow: none initially, shadow-sm on hover
- Transition: smooth

### Buttons

**Primary**:
- Background: Soft Slate Blue (#6B7FBD)
- Text: White
- Padding: px-4 py-2 (default), px-6 py-3 (large)
- Border-radius: rounded-lg
- Hover: subtle darkening via hover-elevate
- Border: Computed darker shade

**Secondary**:
- Background: Gentle Lavender (#9B93D4)
- Text: White
- Same spacing as primary
- Hover: subtle darkening

**Outline**:
- Background: transparent
- Border: 1px solid #E4E4E7
- Text: Primary text color
- Hover: bg-gray-50

### Status Badges

**Badge Sizes**:
- Default: text-xs px-2.5 py-0.5
- Small: text-xs px-2 py-0.5
- Large: text-sm px-3 py-1

**Badge Variants**:
- **Default**: Soft Slate Blue background, white text
- **Secondary**: Gentle Lavender background, white text
- **Outline**: Border only, no background
- **Success**: Soft Teal background
- **Warning**: Muted Amber background
- **Destructive**: Soft Coral background

### Tables

**Table Container**:
- Background: white
- Border: 1px solid #E4E4E7
- Border-radius: rounded-2xl
- Overflow: hidden

**Table Headers**:
- Background: #FAFAFA (subtle gray)
- Text: text-sm font-semibold text-secondary
- Padding: px-6 py-3
- Border-bottom: 1px solid #E4E4E7

**Table Rows**:
- Padding: px-6 py-4
- Border-bottom: 1px solid #E4E4E7
- Hover: bg-gray-50
- Transition: smooth

### Forms

**Input Fields**:
- Background: white
- Border: 1px solid #E4E4E7
- Border-radius: rounded-lg
- Padding: px-3 py-2
- Focus: ring-2 ring-primary/20 border-primary
- Text: text-sm

**Labels**:
- Text: text-sm font-medium text-primary
- Margin: mb-2

**Helper Text**:
- Text: text-xs text-tertiary
- Margin: mt-1

---

## Interaction States

### Hover States
- **Cards**: Subtle background elevation (--elevate-1)
- **Buttons**: Subtle darkening via hover-elevate
- **Links**: Underline on hover
- **Table Rows**: bg-gray-50

### Active States
- **Buttons**: Stronger darkening via active-elevate-2
- **Inputs**: Blue ring with primary border
- **Nav Items**: Primary color background at 10% opacity

### Focus States
- **All Interactive**: ring-2 ring-primary/20
- **Keyboard Navigation**: Visible focus rings

---

## Iconography

**Icon Set**: Lucide React (consistent, modern, professional)

**Icon Sizes**:
- Small: 16px (h-4 w-4)
- Default: 20px (h-5 w-5)
- Medium: 24px (h-6 w-6)
- Large: 32px (h-8 w-8)

**Icon Colors**:
- Primary actions: text-primary
- Secondary: text-secondary
- Tertiary/Metadata: text-tertiary
- Status-specific: Match status color

**Common Icons**:
- **Package**: Inventory/Stock
- **Shield**: Warranty/Coverage
- **CheckCircle2**: Success/Active
- **AlertCircle**: Warning/Reserved
- **XCircle**: Error/Expired
- **Clock**: Time/Expiring
- **FileWarning**: Claims
- **RefreshCw**: Replacements
- **Download**: Export actions

---

## Page Layout Patterns

### Standard Page Structure
```
<div className="space-y-6 p-8">
  {/* Header Section */}
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold">Page Title</h1>
      <p className="text-sm text-muted-foreground mt-1">Description</p>
    </div>
    <Button variant="outline" size="lg">Action</Button>
  </div>

  {/* Summary Stats Row */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Metric Cards */}
  </div>

  {/* Content Section */}
  <div className="space-y-4">
    {/* Search, filters, table */}
  </div>
</div>
```

### Metric Card Pattern
```
<Card className="rounded-2xl border hover-elevate transition-all">
  <CardContent className="p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-{color}-500/10 rounded-xl">
        <Icon className="h-6 w-6 text-{color}-600" />
      </div>
      <Badge variant="outline">Label</Badge>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">Metric Name</p>
      <p className="text-4xl font-bold tracking-tight">Value</p>
    </div>
  </CardContent>
</Card>
```

---

## Design Principles in Practice

### Visual Hierarchy
1. **Large metrics** (text-4xl) draw attention
2. **Section headers** (text-3xl) organize content
3. **Subtle borders** separate without dominating
4. **White space** prevents visual clutter
5. **Muted colors** keep focus on data

### Professional Aesthetic
- **Understated**: Colors never compete with content
- **Refined**: Every detail considered and intentional
- **Consistent**: Patterns repeat across all pages
- **Modern**: Contemporary but timeless design
- **Trustworthy**: Instills confidence in enterprise users

### Data-First Design
- **High density**: Maximum information, minimal waste
- **Scannable**: Clear visual patterns aid quick reading
- **Actionable**: Key actions prominently placed
- **Contextual**: Related information grouped logically
- **Responsive**: Adapts gracefully to all screen sizes

---

## Accessibility

**WCAG 2.1 Level AA Compliance**:
- Contrast ratios: 4.5:1 minimum for body text
- Focus indicators: Visible on all interactive elements
- Keyboard navigation: Full support
- Screen readers: Semantic HTML, ARIA labels
- Color independence: Never rely solely on color

**Text Contrast**:
- Primary on white: 14:1
- Secondary on white: 7:1
- Tertiary on white: 4.6:1

---

## Responsive Design

**Breakpoints** (Tailwind defaults):
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

**Mobile-First Approach**:
- Single column layouts on mobile
- 2-column grids on tablets
- 3-4 column grids on desktop
- Collapsible sidebar on mobile
- Touch-friendly targets (min 44px)

---

## Animation & Transitions

**Timing**:
- Fast: 150ms (hover states)
- Default: 200ms (most transitions)
- Slow: 300ms (complex animations)

**Easing**:
- Ease-in-out: Default for most
- Ease-out: Entrances
- Ease-in: Exits

**Use Cases**:
- hover-elevate: Subtle background lift on hover
- active-elevate-2: Stronger lift on click
- transition-all: Smooth property changes
- Avoid: Excessive animation, sudden movements
