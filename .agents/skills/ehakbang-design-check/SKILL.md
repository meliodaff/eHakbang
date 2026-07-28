---
name: ehakbang-design-check
description: Guidelines to check visual design, styling, and layout consistency across eHakbang Next.js/Tailwind pages.
---

# eHakbang Design Consistency Guidelines

Use these rules to audit and maintain design system compliance across all pages and components.

## 1. Color Palette
* **Primary Blue**: `bg-egov-blue` (`#0038A8` / `#1560BD`)
* **Light Blue Accent**: `bg-egov-blue-050`
* **Success Green**: `text-egov-success` / `bg-egov-success-bg`
* **Backgrounds**: `bg-surface` for cards/white elements; `bg-surface-muted` or `bg-background` for gray backdrops.
* **Text**: `text-foreground` for main body; `text-muted` for labels/captions.

## 2. Layout & Spacing
* **Mobile-First Layout**: Centered AppShell container with maximum width of `max-w-md` (375px+).
* **Margins/Padding**:
  * Standard screen margins: `px-5`
  * Card/Element paddings: `p-4` or `p-5`
  * Section gap spacing: `mt-4` or `mt-5`
* **Component Heights**: Touch targets should be `min-h-12` (48px+) per WCAG AA.

## 3. Borders & Corner Radius
* **Borders**: Thin gray borders `border border-border`.
* **Corner Radius**:
  * Large cards/containers: `rounded-egov-lg` (equivalent to `rounded-2xl` / 16px).
  * Small buttons/inputs/tiles: `rounded-egov` (equivalent to `rounded-lg` / 8px).
  * Modern stats/tiles: `rounded-xl` (12px).
