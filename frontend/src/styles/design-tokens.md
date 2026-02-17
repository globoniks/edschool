# EdSchool Design System

## Color Tokens

### Primary Colors
- `primary-50` to `primary-900`: Blue scale for primary actions and branding
- Default: `primary-600` (#0284c7)

### Semantic Colors
- **Success**: Green (#16a34a) - For positive actions, completed states
- **Warning**: Orange (#d97706) - For caution, pending states
- **Error**: Red (#dc2626) - For errors, destructive actions
- **Info**: Blue (#2563eb) - For informational messages

### Role Colors
- **Admin**: Purple (#7c3aed)
- **Teacher**: Green (#059669)
- **Parent**: Blue (#0284c7)
- **Student**: Orange (#ea580c)

### Neutral Colors
- `gray-50` to `gray-900`: Complete gray scale for text, borders, backgrounds

## Typography Scale

### Font Sizes
- `xs`: 12px (0.75rem)
- `sm`: 14px (0.875rem)
- `base`: 16px (1rem)
- `lg`: 18px (1.125rem)
- `xl`: 20px (1.25rem)
- `2xl`: 24px (1.5rem)
- `3xl`: 30px (1.875rem)
- `4xl`: 36px (2.25rem)
- `5xl`: 48px (3rem)

### Font Weights
- `normal`: 400
- `medium`: 500
- `semibold`: 600
- `bold`: 700

### Typography Classes
- `.text-heading-1` to `.text-heading-6`: Heading styles
- `.text-body-large`, `.text-body`, `.text-body-small`: Body text
- `.text-caption`: Small caption text
- `.text-label`: Form labels

## Spacing Rules

### Base Unit: 8px

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-1` | 4px | Tight spacing, icons |
| `spacing-2` | 8px | Base unit, small gaps |
| `spacing-3` | 12px | Form fields, small padding |
| `spacing-4` | 16px | Standard padding |
| `spacing-6` | 24px | Section spacing |
| `spacing-8` | 32px | Large spacing |
| `spacing-12` | 48px | Section breaks |

### Spacing Utilities
- `.section-spacing`: Standard section margin (32px)
- `.section-spacing-sm`: Small section margin (24px)
- `.section-spacing-lg`: Large section margin (48px)
- `.container-padding`: Standard container padding (24px)

## Button Variants

### Sizes
- `xs`: Extra small (px-2 py-1)
- `sm`: Small (px-3 py-1.5)
- `md`: Medium (px-4 py-2) - Default
- `lg`: Large (px-6 py-3)
- `xl`: Extra large (px-8 py-4)

### Variants
- `primary`: Primary action (blue)
- `secondary`: Secondary action (gray)
- `success`: Success action (green)
- `warning`: Warning action (orange)
- `danger`: Destructive action (red)
- `info`: Informational action (blue)
- `ghost`: Transparent background
- `outline-primary`, `outline-secondary`, `outline-danger`: Outlined variants

### Usage
```tsx
<Button variant="primary" size="md">Click Me</Button>
<Button variant="outline-primary" icon={<Icon />}>With Icon</Button>
```

## Card Variants

### Variants
- `default`: Standard card with shadow
- `elevated`: Higher shadow
- `flat`: No shadow, border only
- `outlined`: Strong border
- `interactive`: Hover effects, clickable
- `hover`: Hover shadow effect
- `primary`, `success`, `warning`, `error`, `info`: Colored backgrounds

### Sizes
- `sm`: Small padding (16px)
- `md`: Medium padding (24px) - Default
- `lg`: Large padding (32px)

### Usage
```tsx
<Card variant="elevated" title="Title" subtitle="Subtitle">
  Content
</Card>
```

## Status Badges

### Variants
- `primary`, `success`, `warning`, `error`, `info`, `gray`: Color variants
- `solid-primary`, `solid-success`, etc.: Solid color variants

### Status Types
- `active`: Green (active state)
- `inactive`: Gray (inactive state)
- `pending`: Orange (pending state)
- `completed`: Green (completed state)
- `cancelled`: Red (cancelled state)

### Role Badges
- `role-admin`: Purple
- `role-teacher`: Green
- `role-parent`: Blue
- `role-student`: Orange

### Sizes
- `sm`: Small (px-2 py-0.5)
- `md`: Medium (px-2.5 py-1) - Default
- `lg`: Large (px-3 py-1.5)

### Usage
```tsx
<Badge status="active">Active</Badge>
<Badge role="admin">Admin</Badge>
<Badge variant="success" size="sm">Success</Badge>
```

## Consistency Rules

### Across Roles
1. **Color Usage**: Use semantic colors consistently (success=green, error=red)
2. **Spacing**: Always use spacing scale (multiples of 8px)
3. **Typography**: Use heading classes for all headings
4. **Buttons**: Use appropriate variant for action type
5. **Badges**: Use status prop for state-based badges
6. **Cards**: Use variant based on interaction needs

### Best Practices
- Always use design tokens, never hardcode colors/sizes
- Use semantic color names (success, error) not literal (green, red)
- Maintain consistent spacing rhythm
- Use role colors only for role-specific UI elements
- Ensure sufficient contrast for accessibility

