# Design System — Avícola Baccaro

**Versión:** 1.0
**Fecha:** 2026-03-08
**Aplicado en:** Dashboard de Gestión de Pedidos

---

## 1. Análisis de Marca

### Identidad extraída de redes sociales
- **Colores dominantes:** Amarillo vibrante (#FFCA00) + Naranja (#F97316)
- **Mascota:** "Baccarito" — gallina 3D amarilla, tono cálido y cercano
- **Tipografía marketing:** Rounded bold display (Nunito / Poppins Bold)
- **Tono de marca:** Energético, familiar, confiable. "Desde 1980."
- **Estilo visual:** Cálido, colorido, high-energy en comunicación externa

### Decisión de traducción al dashboard
El dashboard es una herramienta **interna profesional**, no comunicación al consumidor.
Traducimos la identidad Baccaro así:
- El amarillo/amber actúa como accent premium (no como fondo dominante)
- Modo oscuro cálido: transmite profesionalismo sin perder calidez de marca
- Sin elementos cartoon — la personalidad de marca se expresa a través del color
- Inter como tipografía: limpia, moderna, legible en datos

---

## 2. Paleta de Colores

### Fondos
| Token | Hex | Uso |
|-------|-----|-----|
| `--background` | `#0F0E0C` | Fondo base de la app |
| `--card` | `#1C1A17` | Cards, sidebar |
| `--sidebar` | `#161412` | Sidebar background |
| `--popover` | `#252220` | Dropdowns, tooltips |
| `--border` | `#2A2825` | Bordes sutiles |
| `--input` | `#1C1A17` | Inputs, selects |
| `--muted` | `#1C1A17` | Superficies secundarias |

### Texto
| Token | Hex | Uso |
|-------|-----|-----|
| `--foreground` | `#F9F7F4` | Texto primario (blanco cálido) |
| `--muted-foreground` | `#9CA3AF` | Texto secundario, labels |
| `--card-foreground` | `#F9F7F4` | Texto en cards |

### Colores de marca (accent)
| Token | Hex | Uso |
|-------|-----|-----|
| `--primary` | `#FBBF24` | Amber — color Baccaro, CTAs, active states |
| `--primary-foreground` | `#0F0E0C` | Texto sobre primary |
| `--secondary` | `#F97316` | Orange — hover, gradientes |
| `--accent` | `#1C1A17` | Hover backgrounds |
| `--accent-foreground` | `#F9F7F4` | Texto en accent |

### Colores semánticos
| Token | Hex | Uso |
|-------|-----|-----|
| `--success` | `#10B981` | Confirmado, entregado |
| `--success-bg` | `#10B98115` | Background badge confirmado |
| `--warning` | `#FBBF24` | Pendiente (comparte con primary) |
| `--warning-bg` | `#FBBF2415` | Background badge pendiente |
| `--destructive` | `#EF4444` | Rechazado, eliminar |
| `--destructive-bg` | `#EF444415` | Background badge rechazado |
| `--info` | `#60A5FA` | Información neutral |

### Ring & otros
| Token | Hex | Uso |
|-------|-----|-----|
| `--ring` | `#FBBF24` | Focus ring |
| `--radius` | `0.75rem` | Border radius base (12px) |

---

## 3. Tipografía

**Familia:** Inter (Google Fonts)
**Fallback:** system-ui, -apple-system, sans-serif

### Escala
| Nivel | Clase Tailwind | Uso |
|-------|---------------|-----|
| Display | `text-4xl font-bold tracking-tight` | KPI numbers grandes |
| H1 | `text-3xl font-bold tracking-tight` | Título de página |
| H2 | `text-xl font-semibold` | Título de sección |
| H3 | `text-base font-semibold` | Título de card |
| Body | `text-sm` | Contenido general |
| Small | `text-xs text-muted-foreground` | Labels, metadata |

### Reglas
- **Números en KPI:** `text-3xl font-bold tabular-nums` — siempre monospaced para evitar layout shift
- **Labels de tabla:** `text-xs font-medium uppercase tracking-wide text-muted-foreground`
- **Trend indicators:** `text-xs font-medium` + color semántico

---

## 4. Espaciado

Base: **8px grid**

| Token | Valor | Uso |
|-------|-------|-----|
| `p-1` | 4px | Micro-padding, iconos |
| `p-2` | 8px | Padding interno componentes |
| `p-3` | 12px | Botones (vertical) |
| `p-4` | 16px | Card padding |
| `p-6` | 24px | Sección padding |
| `p-8` | 32px | Page header margin |
| `gap-4` | 16px | Gap entre KPI cards |
| `gap-6` | 24px | Gap entre secciones |

---

## 5. Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-lg` | 8px | Inputs, badges pequeños |
| `rounded-xl` | 12px | Botones, cards pequeñas |
| `rounded-2xl` | 16px | Cards principales |
| `rounded-full` | 999px | Badges de status, avatares |

**Principio:** Border radius generosos (16-24px) para cards principales — estilo MediCore.

---

## 6. Sombras

```css
/* Card shadow cálida */
--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3);

/* Amber glow (sidebar active, primary CTA hover) */
--shadow-amber: 0 0 20px rgba(251, 191, 36, 0.15);

/* Floating card */
--shadow-float: 0 8px 32px rgba(0, 0, 0, 0.5);
```

---

## 7. Componentes de la Marca

### Sidebar active state
```css
/* Item activo: borde izquierdo amber + fondo sutil */
bg-amber-500/10 text-amber-400 border-l-2 border-amber-400
```

### Botón primario (CTA)
```css
/* Background amber, texto negro, hover darker */
bg-amber-400 text-zinc-900 font-semibold hover:bg-amber-300
```

### Status Badges
```css
/* Pendiente */
bg-amber-500/10 text-amber-400 border border-amber-500/20

/* Confirmado */
bg-emerald-500/10 text-emerald-400 border border-emerald-500/20

/* Rechazado */
bg-red-500/10 text-red-400 border border-red-500/20

/* Entregado */
bg-blue-500/10 text-blue-400 border border-blue-500/20
```

### Input / Form fields
```css
bg-[#1C1A17] border-[#2A2825] text-[#F9F7F4]
focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30
placeholder:text-[#6B7280]
```

---

## 8. Efectos Visuales

### Glassmorphism (cards especiales, KPI destacados)
```css
backdrop-blur-sm bg-white/5 border border-white/10
```

### Amber glow (sidebar active, hover en CTA)
```css
box-shadow: 0 0 20px rgba(251, 191, 36, 0.15);
```

### Gradient en sidebar logo area
```css
background: linear-gradient(135deg, #FBBF24 0%, #F97316 100%);
```

---

## 9. Pantallas del Sistema

| Pantalla | Ruta | Diseño |
|----------|------|--------|
| Login | `/login` | Split screen, card centrado, amber CTA |
| Dashboard / Pedidos | `/pedidos` | Sidebar + KPI cards + tabla |
| Producción | `/produccion` | Sidebar + tabla resumen por fecha |
| Clientes | `/clientes` | Sidebar + tabla con search + stats |
| Productos | `/productos` | Sidebar + tabla CRUD |
| Estadísticas | `/estadisticas` | Sidebar + charts (por implementar) |
| Reparto | `/reparto` | Sidebar + mapa/ruta (por implementar) |

---

## 10. Implementación CSS

Ver: `frontend/src/app/globals.css` — variables CSS ya aplicadas al proyecto.

### Aplicar a shadcn/ui components
shadcn lee los tokens `--background`, `--card`, `--primary`, etc. directamente.
Al actualizar `globals.css`, todos los componentes se actualizan automáticamente.
