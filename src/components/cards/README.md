# Glass Card Component System

A comprehensive, configurable card component system based on the Apple Liquid Glass design language, extracted from the design-styles page.

## Components

### `GlassCard`

The main card component with extensive configuration options.

### `ActionCard`

Pre-configured card for clickable actions with icon, title, and description.

### `PerformanceCard`

Specialized card for displaying financial performance data with automatic tinting.

### `InfoCard`

Generic information card with title, content, and optional footer.

## Configuration Options

### Glass Material Variants

- `subtle` - Light blur effect for background elements
- `standard` - Default glass material for most components
- `prominent` - High-impact glass for modals and CTAs

### Performance-Based Tinting

- `enablePerformanceTinting` - Enables automatic color tinting
- `performance` - Number (positive = green, negative = red)

### Solid Colors & Gradients

- `solidColor` - 9 preset colors: blue, purple, green, orange, red, cyan, pink, emerald, rose
- `gradient` - 6 preset gradients: blue-cyan, purple-pink, green-emerald, orange-red, blue-purple, red-rose

### Layout & Spacing

- `padding` - sm, md, lg, xl
- `borderRadius` - sm, md, lg, xl, 2xl, 3xl
- `responsive` - Auto-responsive behavior
- `shadowIntensity` - none, sm, md, lg, xl, 2xl

### Animation & Interaction

- `animate` - Enable/disable entrance animations
- `clickable` - Make card clickable
- `hoverable` - Enable hover effects
- `hoverScale` - Hover scale multiplier (default: 1.02)
- `hoverY` - Hover Y offset in pixels (default: -2)
- `animationDelay` - Stagger animation timing

### Visual Effects

- `showTopHighlight` - Top light reflection line
- `showInnerGlow` - Subtle inner glow effect

## Usage Examples

### Basic Glass Card

```tsx
import { GlassCard } from "@/components/cards";

<GlassCard variant="standard" padding="md">
  <h3>My Card Title</h3>
  <p>Card content goes here...</p>
</GlassCard>;
```

### Performance Card

```tsx
import { PerformanceCard } from "@/components/cards";

<PerformanceCard
  title="Portfolio Value"
  value={45600}
  performance={8.5}
  subtitle="Total Assets"
  icon={<TrendingUp />}
/>;
```

### Action Card with Solid Color

```tsx
import { ActionCard } from "@/components/cards";

<ActionCard
  solidColor="blue"
  icon={<Plus />}
  title="Add Asset"
  description="Create new portfolio item"
  onClick={() => console.log("Add asset")}
/>;
```

### Advanced Configuration

```tsx
<GlassCard
  variant="prominent"
  enablePerformanceTinting
  performance={8.5}
  padding="lg"
  borderRadius="2xl"
  clickable
  hoverScale={1.03}
  hoverY={-3}
  animationDelay={0.1}
  onClick={() => console.log("Clicked")}
>
  <h3>Advanced Card</h3>
  <p>With performance tinting and custom animations</p>
</GlassCard>
```

## Features

- ✅ **Apple Liquid Glass** design language with authentic visual effects
- ✅ **Performance-based tinting** for financial applications
- ✅ **Responsive design** with mobile-first approach
- ✅ **Framer Motion animations** with customizable timing and effects
- ✅ **TypeScript** fully typed with comprehensive interfaces
- ✅ **Accessibility** keyboard navigation and proper ARIA attributes
- ✅ **Dark mode** automatic theme adaptation
- ✅ **Configurable** extensive customization options
- ✅ **Composable** mix and match any combination of options

## Dependencies

- React 18+
- Framer Motion
- Tailwind CSS
- Liquid Glass CSS (`frontend/src/styles/liquid-glass.css`)

## Testing

All cards include `data-testid` attributes for E2E testing:

- `data-testid="glass-card"`
- `data-testid="action-card"`
- `data-testid="performance-card"`
- `data-testid="info-card"`
