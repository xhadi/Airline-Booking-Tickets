# Register Phone Number Design

## Architecture

We will update the registration process to capture the user's phone number as defined in the database schema.

1.  **Frontend (`pages/register.html`)**: Add a phone number input field.
2.  **Frontend JS (`assets/js/register.js`)**: Extract the phone number value and include it in the JSON payload sent to the backend.
3.  **Backend (`backend/api/auth/register.php`)**: Update the script to handle the optional `phone_number` field. Insert it into the database alongside the other fields.

## Data Flow

- The user fills out the registration form, including their phone number.
- `register.js` sends a POST request to `register.php` with `{first_name, last_name, email, password, phone_number}`.
- `register.php` validates the required fields (phone number will be optional, but if provided, it's saved).
- The user is inserted into the `user` table with the `phone_number`.
