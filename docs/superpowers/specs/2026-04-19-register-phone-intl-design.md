# Register Phone Number Internationalization Design

## Overview
Update the phone number input on the registration page to a modern, split country-code/number field. We will use the standard `intl-tel-input` library to enforce strict validation, preventing letter input and ensuring valid E.164 phone formats before submission.

## Client-Side UI (`pages/register.html`)
- Include the `intl-tel-input` CSS and JS via CDN in the HTML `<head>` and before the closing `</body>` tag.
- Keep the existing `<input type="tel" id="phone-number">`. 
- Ensure the input visually fits with the existing CSS `auth-input` classes when initialized by the library.

## Client-Side JS (`assets/js/register.js`)
- Initialize the `intlTelInput` instance on the `phone-number` input on page load.
- Setup configurations: default country (e.g., SA for +966), preferred countries (SA, AE, etc.), and utility script loading for strict validation.
- During form submission, check if the phone field has a value.
- If it has a value, use `iti.isValidNumber()` to validate it.
- If invalid, show an error message in `#register-error` ("Invalid phone number") and prevent the fetch request.
- If valid, use `iti.getNumber()` to extract the complete phone string (e.g., `+966555123456`) and attach it to the JSON payload.

## Server-Side (`backend/api/auth/register.php`)
- No changes required. The PHP backend already correctly handles receiving a single `phone_number` string, trims it, and saves it. The JS script will guarantee it's a valid digit-only E.164 formatted string.
