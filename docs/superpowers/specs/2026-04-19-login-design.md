# Login Page Design Specification

## Overview
The goal of this design is to completely revamp the existing `pages/login.html` into a polished, modern, split-screen authentication page. 

This enhancement will rely strictly on HTML layout changes and new CSS styling in `assets/css/common.css`. 

**Crucial Constraint:** The existing vanilla JavaScript behavior and exact HTML IDs (`login-form`, `email`, `password`, `login-error`) must remain untouched to ensure compatibility with `backend/api/auth/login.php` and `assets/js/login.js`.

## Architecture & Layout

### 1. The Split Screen (Desktop)
The layout will use a robust CSS Grid or Flexbox approach to divide the viewport into two equal columns on desktop devices (e.g., minimum width of `1024px`).
*   **Left Column (Form):** A clean, white container that houses the login form. The content inside will be perfectly centered vertically and horizontally to draw maximum user focus. It will have comfortable padding.
*   **Right Column (Image):** A full-height section containing an inspiring travel-themed image sourced via Unsplash (e.g., an airplane wing, a beautiful destination). The image will use `object-fit: cover` to ensure it looks stunning across all window sizes without distortion.

### 2. Responsive Behavior (Mobile)
On smaller screens (mobile and tablets below `1024px`), a 50/50 split is unreadable.
*   **The Image Column** will be hidden entirely (`display: none`).
*   **The Form Column** will take over the full `100%` width of the screen.

## Visual Polish & Component Details

### Typography
*   **Headings:** The "Login" heading will be larger, bolder, and use the project's primary dark color (`#111827`).
*   **Labels/Links:** Helper text like "Don't have an account?" will use subtle grays (`#6B7280`) with the anchor link styled in the brand's primary blue (`#1E40AF`) and hovering with an underline or slight color shift.

### Form Inputs
The inputs will ditch the basic `1px solid #ccc` for a more premium feel:
*   A light, soft border (e.g., `#D1D5DB`).
*   Generous padding (e.g., `0.75rem`) for comfortable typing.
*   Subtle rounded corners (`border-radius: 0.375rem`).
*   A clear, accessible focus state featuring a subtle ring (e.g., `box-shadow: 0 0 0 2px #3B82F6`).

### Call-to-Action (CTA) Button
The login button will be prominent and inviting:
*   Full width of the form container.
*   A vibrant brand color (either the existing orange `#F97316` from the flight search page, or a deep blue `#1E40AF`, ensuring visual consistency). 
*   Hover states will include a slight background darkening and a minimal transform scale (`scale(1.02)`) for interactivity.

### Error Messaging
The `#login-error` div will be styled as a proper alert box—a soft red background (`#FEE2E2`) with dark red text (`#991B1B`), padding, rounded corners, and a left-border accent, rather than just floating red text.

## Implementation Data Flow
1. User enters data into the restyled inputs (`#email`, `#password`).
2. User clicks the restyled primary button.
3. The browser triggers the `submit` event on `#login-form`.
4. `assets/js/login.js` catches the event, extracts the values using the preserved IDs, and performs the `fetch()` to `login.php`.
5. The script injects error messages back into `#login-error` without relying on the DOM structure changing.