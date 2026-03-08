# UI Patterns Reference

Common patterns and when to use them. Always prefer established patterns over custom solutions — they reduce cognitive load because users already know them.

---

## Navigation Patterns

### Sidebar (Dashboard / Admin)
**Use when:** Data-heavy tools, multi-section apps, desktop-primary
```
- Fixed width: 240–280px
- Logo + app name at top
- Nav links grouped by section
- Active state: background highlight
- Bottom: user profile + settings + logout
- Mobile: collapses to icon-only or hamburger
```

### Top Navigation (Marketing / Public)
**Use when:** Content sites, lightweight apps, mobile-first
```
- Logo left, nav center or right
- Max 5–6 items
- Mobile: hamburger → full-screen modal or drawer
- Sticky on scroll for apps, transparent-to-solid for landing pages
```

### Bottom Navigation (Mobile App)
**Use when:** Mobile-primary apps, 3–5 core sections
```
- 3–5 icons max
- Icon + label (never icon-only for primary nav)
- Active: filled icon + brand color
- Avoid nesting deeper than 2 levels
```

---

## Layout Patterns

### Dashboard Home
```
- KPI cards row (3–4 metrics)
- Primary data table or chart below
- Quick actions in header (+ New)
- Filter/search bar above tables
```

### CRUD List Page
```
- Page header: title + description + primary action (+ New)
- Filter/search bar
- Data table with sortable columns
- Row actions: per-row dropdown (···)
- Bulk actions: appear when rows are selected
- Empty state: illustration + CTA
```

### Detail / Edit Page
```
- Breadcrumb or back link
- Page title (entity name)
- Form sections with clear grouping
- Sticky save/cancel footer or header
- Destructive action (delete) separated visually
```

### Onboarding / Empty State
```
- Large icon or illustration (not cartoon unless brand is playful)
- H2: what they can do here
- Muted paragraph: brief explanation
- Primary CTA button
- Secondary: documentation link (optional)
```

---

## Component Patterns

### Data Table
```
Columns:
- Checkbox (for multi-select) | Key info | Secondary info | Status badge | Actions (···)

Behaviors:
- Clickable rows (navigate to detail) OR row-level actions, not both
- Sort: click column header, show arrow indicator
- Bulk: checkbox header selects all, action bar appears above table
- Empty: show empty state inside table, not a separate page
- Loading: skeleton rows, same height as data rows

Mobile:
- Horizontal scroll or collapse to cards
- Priority columns only (hide secondary on small screens)
```

### Form
```
Layout:
- Single column for simple forms (<5 fields)
- 2-column grid for complex forms on desktop
- Full-width inputs (never 50% on mobile)

Labels:
- Always above the input (not placeholder-only)
- Required fields: asterisk (*) with legend at top

Validation:
- Inline errors below the field
- Red border on error field
- Error message: specific ("Phone must start with +54"), not generic ("Invalid")

Actions:
- Primary: right-aligned or full-width (mobile)
- Cancel: left of primary, text/outline variant
- Spacing between form and actions: 24px+
```

### Status Badge
```
pending  → yellow background, yellow text, yellow border
confirmed → green background, green text, green border
rejected  → red background, red text, red border
delivered → blue background, blue text, blue border
active    → green
inactive  → gray

Size: text-xs, px-2 py-0.5, rounded-full or rounded-md
```

### Dialog / Modal
```
- Max width: 480px (small), 640px (medium), 768px (large)
- Always: header (title) + body + footer (actions)
- Footer: Cancel left, Confirm right
- Destructive confirm: red primary button
- Close X in top-right corner
- Backdrop click closes (unless destructive action)
- Scroll: dialog scrolls, not backdrop
```

### Toast / Notification
```
- Success: bottom-right, auto-dismiss 4s, green icon
- Error: bottom-right, no auto-dismiss, red icon
- Warning: bottom-right, auto-dismiss 6s, yellow icon
- Max 3 toasts visible simultaneously
- Use sonner for Next.js projects
```

### Dropdown Menu (···)
```
- Icon trigger: 3 vertical or horizontal dots
- Items: icon (optional) + label
- Destructive item: red text, separator before it
- Keyboard: arrow keys navigate, Enter selects, Escape closes
```

---

## Color Usage Patterns

### Semantic Colors (always consistent)
```css
/* Success / Positive */
text-green-500, bg-green-500/10, border-green-500/20

/* Warning / Pending */
text-yellow-400, bg-yellow-500/10, border-yellow-500/20

/* Error / Destructive */
text-red-400, bg-red-500/10, border-red-500/20

/* Info / Neutral action */
text-blue-400, bg-blue-500/10, border-blue-500/20
```

### Hierarchy via Opacity
```css
/* Primary text */
text-foreground

/* Secondary text */
text-muted-foreground

/* Disabled / placeholder */
text-muted-foreground/50
```

---

## Spacing Scale (8px grid)

| Token | Value | Use |
|-------|-------|-----|
| 4px | `p-1` | Icon padding, tight spacing |
| 8px | `p-2` | Component internal padding |
| 12px | `p-3` | Button padding vertical |
| 16px | `p-4` | Card padding, section gap |
| 24px | `p-6` | Page section gap |
| 32px | `p-8` | Page header margin |
| 48px | `p-12` | Section separation |

---

## Typography Scale

| Level | Class | Use |
|-------|-------|-----|
| Display | `text-4xl font-bold` | Hero headlines only |
| H1 | `text-3xl font-bold tracking-tight` | Page title |
| H2 | `text-xl font-semibold` | Section heading |
| H3 | `text-base font-semibold` | Card title, subsection |
| Body | `text-sm` | Default content |
| Caption | `text-xs text-muted-foreground` | Labels, metadata |

---

## Responsive Breakpoints

```
Mobile:  375px–767px   (design first)
Tablet:  768px–1023px  (adjust layout)
Desktop: 1024px+       (full layout)
Wide:    1280px+       (max-width container)
```

Common responsive patterns:
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` for KPI cards
- `flex-col md:flex-row` for form + preview
- `hidden md:flex` for desktop-only elements
- `md:hidden` for mobile-only elements
