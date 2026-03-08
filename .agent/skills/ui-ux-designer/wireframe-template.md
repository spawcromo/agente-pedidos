# Wireframe Template

Use this template for each screen/page you are designing. Copy and fill in.

---

## Screen: [Screen Name]

**Route:** `/path`
**User goal:** [What the user needs to accomplish on this screen]
**Primary action:** [The main thing the user should do]
**Entry points:** [What brings the user here]
**Exit points:** [Where the user goes after]

---

### Layout Wireframe

Describe the layout using ASCII or structured text. Use `[ ]` for blocks.

**Desktop (1280px):**
```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar 240px]  │           [Main Content]              │
│                  │  [Page Header: Title + CTA]           │
│  [Nav items]     │  ─────────────────────────────────    │
│                  │  [Filter bar]                         │
│                  │  [Data table / Content]               │
│                  │                                       │
│  [Logout]        │  [Empty / Loading state]              │
└─────────────────────────────────────────────────────────┘
```

**Mobile (375px):**
```
┌─────────────────┐
│ [Top bar: ☰ Logo]│
│─────────────────│
│ [Page title]    │
│ [+ Primary CTA] │
│─────────────────│
│ [Search/Filter] │
│─────────────────│
│ [Card / Row 1]  │
│ [Card / Row 2]  │
│ [Card / Row 3]  │
│ ...             │
└─────────────────┘
│ [Bottom Nav]    │
└─────────────────┘
```

---

### Component Inventory

List every component used on this screen:

| Component | Variant | State | Location |
|-----------|---------|-------|----------|
| Button | primary | default, loading | Page header right |
| Input | search | default, focus | Filter bar |
| Table | — | loading, empty, populated | Main content |
| Badge | status | pending/confirmed/rejected | Table status column |
| DropdownMenu | row actions | — | Table last column |
| Dialog | create/edit | — | Triggered by CTA |

---

### Hierarchy Map

Describe what the user's eye should see first → second → third:

1. **Primary** (largest, highest contrast): [element]
2. **Secondary** (medium weight): [element]
3. **Tertiary** (muted, smaller): [element]

---

### Interaction Spec

| Element | Interaction | Result |
|---------|-------------|--------|
| [+ New] button | Click | Opens create dialog |
| Table row | Click ··· | Opens row action menu |
| Select all checkbox | Check | Selects all rows, shows bulk action bar |
| Status badge | — | Visual only, not interactive |
| [Filter: date] | Change | Reloads table with new filter |

---

### States

**Loading state:**
[Describe skeleton structure or spinner placement]

**Empty state:**
```
Icon/Illustration
H3: [Headline — what can they do here?]
p: [Brief explanation]
[Primary CTA button]
```

**Error state:**
[Describe error message placement and recovery action]

---

### Responsive Behavior

| Breakpoint | Layout change |
|------------|--------------|
| Mobile (375px) | Sidebar hidden, bottom nav visible. Table → card list. |
| Tablet (768px) | Sidebar icon-only (collapsed). Table shows fewer columns. |
| Desktop (1024px+) | Full sidebar. Full table. KPI cards in row. |

---

### Accessibility Notes

- Tab order: [describe logical keyboard flow]
- Focus trap: [if dialog/modal — yes/no]
- Screen reader: [any aria-label or live-region requirements]
- Color contrast: [flag any elements that need verification]

---

### Design Tokens Used

```css
/* Colors */
--background
--card
--border
--primary
--muted-foreground

/* Typography */
text-3xl font-bold    /* Page title */
text-sm               /* Table body */
text-xs text-muted    /* Captions */

/* Spacing */
mb-8   /* Page header bottom margin */
p-4    /* Card padding */
gap-4  /* KPI cards gap */
```

---

### Dev Handoff Notes

[Any additional notes for the developer implementing this screen]

- [ ] Behavior X needs to be confirmed with client
- [ ] Animation: [spec if any]
- [ ] API calls needed: [list endpoints]
- [ ] Realtime updates: [yes/no — from Supabase subscription?]
