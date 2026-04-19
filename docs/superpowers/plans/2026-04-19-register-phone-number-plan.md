# Register Phone Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a phone number field to the registration form and save it to the database.

**Architecture:** Update the frontend HTML to include the field, the frontend JS to send the field, and the PHP backend to accept and insert the field.

**Tech Stack:** HTML, JS, PHP, MySQL

---

### Task 1: Update Frontend Registration HTML

**Files:**
- Modify: `pages/register.html`

- [ ] **Step 1: Add phone number input field**
Add the following HTML snippet inside the `#register-form` after the email input group:

```html
<div class="auth-input-group">
    <label for="phone-number" class="auth-label">Phone Number (Optional)</label>
    <input type="tel" id="phone-number" class="auth-input" placeholder="e.g., +1234567890">
</div>
```

- [ ] **Step 2: Commit**

```bash
git add pages/register.html
git commit -m "feat: add phone number input to registration form"
```

### Task 2: Update Frontend Registration JS

**Files:**
- Modify: `assets/js/register.js`

- [ ] **Step 1: Extract phone number and include in payload**

```javascript
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const first_name = document.getElementById('first-name').value;
    const last_name = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const phone_number = document.getElementById('phone-number').value || null;
    
    try {
        const res = await fetch('../backend/api/auth/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name, last_name, email, password, phone_number })
        });
        const data = await res.json();
        
        if (res.ok) {
            window.location.href = '../index.html';
        } else {
            const err = document.getElementById('register-error');
            err.textContent = data.error || 'Registration failed';
            err.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
    }
});
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/register.js
git commit -m "feat: include phone number in registration payload"
```

### Task 3: Update Backend Registration Logic

**Files:**
- Modify: `backend/api/auth/register.php`

- [ ] **Step 1: Update PHP script to handle phone number**

```php
<?php
// backend/api/auth/register.php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['first_name'], $data['last_name'], $data['email'], $data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM user WHERE email = ?");
$stmt->execute([$data['email']]);
if ($stmt->fetch()) {
    http_response_code(400);
    echo json_encode(['error' => 'Email already exists']);
    exit;
}

$hash = password_hash($data['password'], PASSWORD_BCRYPT);
$phone_number = isset($data['phone_number']) ? $data['phone_number'] : null;

$stmt = $pdo->prepare("INSERT INTO user (first_name, last_name, email, phone_number, password_hash) VALUES (?, ?, ?, ?, ?)");

try {
    $stmt->execute([$data['first_name'], $data['last_name'], $data['email'], $phone_number, $hash]);
    $userId = $pdo->lastInsertId();
    
    $_SESSION['user_id'] = $userId;
    $_SESSION['first_name'] = $data['first_name'];
    $_SESSION['last_name'] = $data['last_name'];
    $_SESSION['email'] = $data['email'];
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/api/auth/register.php
git commit -m "feat: save phone number during registration"
```
