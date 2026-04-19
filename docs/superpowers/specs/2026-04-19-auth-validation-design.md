# Authentication Validation Design

## Overview
Add client-side and server-side validation to the login and registration forms to ensure data integrity and improve user experience.

## Client-Side Validation (HTML & JS)

### Registration (`pages/register.html` & `assets/js/register.js`)
- **HTML**: Add `minlength="8"` to the password input field.
- **JS**: Intercept the form submission and validate fields before sending the payload:
  - First Name & Last Name: Trim whitespace and ensure they are not empty.
  - Email: Ensure it's not empty and follows a basic email pattern or rely on HTML5 `type="email"`.
  - Password: Ensure it is at least 8 characters long.
  - On failure: Prevent the `fetch` request, display an error message in the `#register-error` container, and make it visible.

### Login (`pages/login.html` & `assets/js/login.js`)
- **HTML**: Ensure the password input field has `required`.
- **JS**: Intercept form submission:
  - Email & Password: Trim whitespace and ensure they are not empty.
  - On failure: Prevent `fetch` request, display an error message in the `#login-error` container.

## Server-Side Validation (PHP)

### Registration (`backend/api/auth/register.php`)
- Verify all required fields (`first_name`, `last_name`, `email`, `password`) are set.
- **Names**: Trim and verify they are not empty strings. Return 400 with "First and last name are required".
- **Email**: Validate using `filter_var($data['email'], FILTER_VALIDATE_EMAIL)`. Return 400 with "Invalid email format".
- **Password**: Verify `strlen($data['password']) >= 8`. Return 400 with "Password must be at least 8 characters".

### Login (`backend/api/auth/login.php`)
- Verify `email` and `password` are set and not empty strings. Return 400 with "Email and password are required".
- Keep the existing 401 "Invalid email or password" logic for failed authentication to prevent credential enumeration.
