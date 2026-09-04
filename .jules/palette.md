
## 2024-05-18 - [Tab Navigation Accessibility]
**Learning:** Custom tab navigation patterns need explicit roles (`tablist` and `tab`), an `aria-selected` state reflecting the active tab, and `focus-visible` styles to ensure full keyboard and screen reader accessibility. Relying solely on click handlers and hover states is insufficient for users navigating with keyboards or assistive tech.
**Action:** Always include `role="tablist"` on the container and `role="tab"` + `aria-selected` + `focus-visible` styling on interactive tab items across the application.
## 2024-08-07 - [Icon-Only Button Accessibility]
**Learning:** Icon-only buttons (like those using lucide-react SVGs) lack accessible names by default, making them invisible or confusing to screen reader users. Additionally, they often lack proper focus indicators, making keyboard navigation difficult.
**Action:** Always add `aria-label` and `title` to icon-only buttons, apply `focus-visible:ring-2` (and a matching ring color) for keyboard focus, and add `aria-hidden="true"` to the internal SVG to prevent redundant or confusing screen reader announcements.

## 2024-03-24 - Drag-and-Drop Fallbacks
**Learning:** Drag-and-drop zones are highly inaccessible for keyboard users and mobile users if they lack a click-to-upload fallback. We must always provide an alternative method to trigger the file input.
**Action:** When implementing drag-and-drop file uploaders, always include a visually hidden file input, bind `onClick` and `onKeyDown` events to the dropzone, and set `role="button"` and `tabIndex={0}` to make the zone fully keyboard accessible.
## 2024-05-14 - Keyboard Focus States for Complex Components
**Learning:** In complex visual components like `full-report-preview.tsx` and `liquid-glass-card.tsx`, basic HTML buttons are sometimes used without inherit focus styles (`focus-visible:ring-2`). This can break keyboard navigation for screen readers or power users.
**Action:** When auditing or modifying complex components, always explicitly verify focus styles (`focus-visible`) for any newly added or existing interactive elements, particularly buttons mapping to key actions (like downloads or navigation).

## 2026-08-17 - [Toggle Group Accessibility]
**Learning:** Grouped layout toggle buttons (e.g., Grid/List/Board views) that are icon-only must be grouped using `role="group"` with an `aria-label`. Individual buttons need `aria-label`, `title`, and crucially, `aria-pressed={isActive}` to correctly convey their toggle state to screen readers.
**Action:** When creating or fixing toggle groups, ensure the parent has `role="group"`, and the children use `aria-pressed` alongside standard icon-only button accessibility attributes (`aria-label`, `focus-visible`).
## 2025-02-20 - Ensure screen reader accessibility and keyboard focus for icon buttons
**Learning:** Icon-only buttons (like the floating action buttons in `FloatingFunctionKey428.tsx` and the close button in `DrThothResonance.tsx`) often lack context for screen readers and visible focus indicators for keyboard navigation, leading to poor accessibility in complex UI tools.
**Action:** When adding or reviewing icon-only interactive elements, ensure `aria-label` is applied to describe the action, and use Tailwind `focus-visible` classes (e.g., `focus-visible:outline-none focus-visible:ring-2`) to provide a clear, accessible focus ring without breaking the default visual design.
## 2024-05-24 - Accessibility for Filter Toggle Buttons
**Learning:** Screen readers cannot infer that a custom filter button acts as a toggle state just by its visual styling or click handler. When custom filter buttons (like ESG pillars or difficulty levels) toggle between active and inactive states, the lack of `aria-pressed` prevents screen reader users from understanding which filters are currently applied.
**Action:** Always add `aria-pressed={isActive}` to any `<button>` that behaves as a toggle switch or filter chip, ensuring its active/inactive state is programmatically announced.

## 2026-08-01 - [Form and Alert Accessibility]
**Learning:** Dismissible error alerts with icon-only close buttons (like `×`) often lack screen reader support and keyboard focus styles. Furthermore, forms built with structural `div` tags but lacking programmatic association (like `htmlFor` and `id`) cause severe issues for assistive technologies.
**Action:** Always add `aria-label` and `focus-visible` classes to dismiss or close buttons. For all form inputs, explicitly pair the `<label>` and `<input>` using the `htmlFor` and `id` attributes respectively, regardless of surrounding structural tags.

## 2024-05-18 - [Icon Button Accessibility and Focus Tracking]
**Learning:** In complex, highly interactive data views (like `wuzuo-note-view.tsx`), icon-only control buttons (for tasks, mobile menus, creating entries, and deletion) are completely opaque to screen readers if they lack `aria-label`s. Furthermore, the absence of `focus-visible` styles prevents keyboard-only users from understanding their focus location.
**Action:** Consistently apply `aria-label` (using dynamic strings for toggle states where necessary) and use targeted `focus-visible:ring-2 focus-visible:ring-[Color] focus:outline-none` Tailwind utility classes on all icon buttons to guarantee clear navigation state without polluting pointer-event styles.
