# AGENTS.md

## Project Overview

PHP + HTML/CSS/JS flight booking website ("SkyBound"). No build system, no npm, no tests. Uses vanilla JS `fetch()` to communicate with a PHP backend.

## Key Commands

- **PHP dev server**: `php -S localhost:8000 -t .`
- **Database setup**: Copy `backend/config/db.example.php` to `backend/config/db.php`, fill in MySQL credentials, then import `assets/db-schema.sql`

## Architecture

- **Entry point**: `index.html`
- **Pages**: `index.html`, `pages/flight-result.html`, `pages/booking.html`, `pages/profile.html`, `pages/login.html`, `pages/register.html`
- **Flight Search**: `backend/api/search_flights.php`
- **Authentication**: `backend/api/auth/` (login, register, logout, status). Uses pure PHP `$_SESSION`.
- **Profile Data**: `backend/api/profile.php` (fetches user info, stats, and real booking history from DB).
- **DB credentials**: `backend/config/db.php` (never commit; template in `db.example.php`)

## Quirks & Conventions

- **Frontend Auth**: Route protection and navbar state are handled entirely by `assets/js/auth.js` which polls `backend/api/auth/status.php` on every page load.
- **Flight Data Structure**: The frontend expects flight data structured similarly to the Duffel API v2 response format (e.g., `flight.slices[0].segments` for route details, `flight.price.total` for pricing).
- **Client-Side Rendering**: HTML pages are essentially shells. Data like flight results, user profile details, and dynamic pricing are injected into the DOM via vanilla JavaScript `fetch()` calls.
- **Hardcoded Airports**: Airport list in `index.html` is hardcoded. Extend there, not via API.
- **Dependencies**: Uses `flatpickr` CDN for date picker. No build systems.

## What to Leave Out

- **No modern JS toolchains**: Don't add npm, webpack, babel, TypeScript, or any build tools. Keep it vanilla HTML/JS/CSS + PHP.
- **No testing frameworks**: There are no tests to run. Do not add PHPUnit, Jest, etc.