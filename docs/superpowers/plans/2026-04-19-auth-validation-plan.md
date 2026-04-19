# Authentication Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive client and server-side validation for login and registration forms.

**Architecture:** Use HTML5 validation attributes alongside JS checks before making API requests, and add robust server-side input verification returning 400 Bad Request if validation fails.

**Tech Stack:** HTML5, vanilla JS, PHP

---

### Task 1: Update Login and Register HTML

**Files:**
- Modify: `pages/register.html`
- Modify: `pages/login.html`

- [ ] **Step 1: Add minlength to register password**
In `pages/register.html`, update the password input to include `minlength="8"`.

```html
<input type="password" id="password" class="auth-input" placeholder="••••••••" required minlength="8">
```

- [ ] **Step 2: Add minlength to login password**
In `pages/login.html`, update the password input to include `minlength="8"`.

```html
<input type="password" id="password" class="auth-input" placeholder="••••••••" required minlength="8">
```

- [ ] **Step 3: Commit HTML updates**

```bash
git add pages/register.html pages/login.html
git commit -m "feat: add HTML5 minlength validation to passwords"
```

### Task 2: Update Login JS

**Files:**
- Modify: `assets/js/login.js`

- [ ] **Step 1: Add client-side validation logic**
Before the `try/catch` block, validate the inputs.

```javascript
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            
            const errContainer = document.getElementById('login-error');
            
            if (!email || !password) {
                errContainer.textContent = 'Email and password are required';
                errContainer.style.display = 'block';
                return;
            }
            
            errContainer.style.display = 'none';

            try {
// ... rest of the fetch code
```

- [ ] **Step 2: Commit Login JS**

```bash
git add assets/js/login.js
git commit -m "feat: add client-side validation to login"
```

### Task 3: Update Register JS

**Files:**
- Modify: `assets/js/register.js`

- [ ] **Step 1: Add client-side validation logic**
Before the `try/catch` block, validate the inputs.

```javascript
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const first_name = document.getElementById('first-name').value.trim();
            const last_name = document.getElementById('last-name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const phone_number = document.getElementById('phone-number')?.value.trim() || null;
            
            const errContainer = document.getElementById('register-error');
            
            if (!first_name || !last_name) {
                errContainer.textContent = 'First and last name are required';
                errContainer.style.display = 'block';
                return;
            }
            
            if (!email) {
                errContainer.textContent = 'Email is required';
                errContainer.style.display = 'block';
                return;
            }
            
            if (password.length < 8) {
                errContainer.textContent = 'Password must be at least 8 characters';
                errContainer.style.display = 'block';
                return;
            }
            
            errContainer.style.display = 'none';
            
            try {
// ... rest of the fetch code
```

- [ ] **Step 2: Commit Register JS**

```bash
git add assets/js/register.js
git commit -m "feat: add client-side validation to register"
```

### Task 4: Update Backend PHP Logic

**Files:**
- Modify: `backend/api/auth/login.php`
- Modify: `backend/api/auth/register.php`

- [ ] **Step 1: Update login.php**

Update the existing `!isset` check to also check for empty trimmed strings:

```php
if (!isset($data['email'], $data['password']) || trim($data['email']) === '' || trim($data['password']) === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}
```

- [ ] **Step 2: Update register.php**

Update the initial check and add validation for names, email, and password.

```php
if (!isset($data['first_name'], $data['last_name'], $data['email'], $data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

$first_name = trim($data['first_name']);
$last_name = trim($data['last_name']);
$email = trim($data['email']);
$password = $data['password'];

if ($first_name === '' || $last_name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'First and last name are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 8 characters']);
    exit;
}
```

- [ ] **Step 3: Update bind variables in register.php**

Ensure we use the trimmed values (`$first_name`, `$last_name`, `$email`) instead of `$data['...']` going forward.

```php
$stmt = $pdo->prepare("SELECT id FROM user WHERE email = ?");
$stmt->execute([$email]);
// ...
$stmt->execute([$first_name, $last_name, $email, $phone_number, $hash]);
```

- [ ] **Step 4: Commit Backend PHP**

```bash
git add backend/api/auth/login.php backend/api/auth/register.php
git commit -m "feat: add robust server-side validation"
```
