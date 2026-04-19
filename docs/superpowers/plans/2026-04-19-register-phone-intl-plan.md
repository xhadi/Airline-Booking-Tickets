# International Phone Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `intl-tel-input` to the registration page to ensure users select a country code and enter a valid phone number.

**Architecture:** Include the `intl-tel-input` library via CDN. Initialize the plugin on the `phone-number` input. When submitting the form, check if the phone field has text: if yes, validate it with `isValidNumber()`; if valid, extract the full E.164 string with `getNumber()` to send to the backend.

**Tech Stack:** HTML, JS, intl-tel-input

---

### Task 1: Update Register HTML with Library

**Files:**
- Modify: `pages/register.html`

- [ ] **Step 1: Add intl-tel-input CSS**
In the `<head>` of `pages/register.html`, add the `intl-tel-input` CSS via CDN, and a minor style fix for the dropdown width:

```html
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/css/intlTelInput.css">
    <style>
        .iti { width: 100%; } /* Ensure the input spans the full width of the group */
    </style>
```

- [ ] **Step 2: Add intl-tel-input JS**
Before the closing `</body>` tag, above our local JS files, add the `intl-tel-input` JS:

```html
    <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/intlTelInput.min.js"></script>
```

- [ ] **Step 3: Commit HTML updates**

```bash
git add pages/register.html
git commit -m "feat: add intl-tel-input library to registration page"
```

### Task 2: Initialize intl-tel-input and Validate in JS

**Files:**
- Modify: `assets/js/register.js`

- [ ] **Step 1: Initialize the plugin**
At the very top of `assets/js/register.js`, initialize the plugin on the `#phone-number` input:

```javascript
const phoneInput = document.querySelector("#phone-number");
const iti = window.intlTelInput(phoneInput, {
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
    initialCountry: "sa", // Default to Saudi Arabia based on context
    separateDialCode: true, // Shows the +966 separate from the input
});
```

- [ ] **Step 2: Update form submission payload and validation**
Inside the `submit` event listener, modify the phone validation and extraction:

Replace:
```javascript
            const phone_number = document.getElementById('phone-number')?.value.trim() || null;
```

With:
```javascript
            let phone_number = null;
            if (phoneInput.value.trim() !== "") {
                if (!iti.isValidNumber()) {
                    errContainer.textContent = 'Please enter a valid phone number';
                    errContainer.style.display = 'block';
                    return;
                }
                phone_number = iti.getNumber(); // Gets the full E.164 format (+966...)
            }
```

- [ ] **Step 3: Commit JS updates**

```bash
git add assets/js/register.js
git commit -m "feat: implement intl-tel-input initialization and validation"
```
