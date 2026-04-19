# Login Page Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely revamp the `pages/login.html` into a polished, modern, split-screen authentication page using HTML/CSS only, keeping all JavaScript IDs intact to preserve backend compatibility.

**Architecture:** We are using standard CSS Flexbox/Grid techniques inside `assets/css/common.css` to build a responsive split-screen layout. The existing form logic relies on `login-form`, `email`, `password`, and `login-error` IDs, which will be strictly maintained.

**Tech Stack:** HTML5, CSS3. No build tools.

---

### Task 1: Update CSS for the Split-Screen Layout

**Files:**
- Modify: `assets/css/common.css`

- [ ] **Step 1: Append split-screen layout styles to CSS**

Add the following CSS to the bottom of `assets/css/common.css` to handle the new split-screen auth container layout.

```css
/* ======================== */
/* Authentication Pages     */
/* ======================== */

/* Full viewport height layout */
.auth-page-body {
  margin: 0;
  height: 100vh;
  display: flex;
  background-color: #ffffff;
}

/* Container for the form side (Left) */
.auth-split-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
  max-width: 100%;
}

@media (min-width: 1024px) {
  .auth-split-form {
    padding: 4rem;
    max-width: 50%;
  }
}

/* Inner form wrapper to control width */
.auth-form-wrapper {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

/* Container for the image side (Right) */
.auth-split-image {
  display: none; /* Hidden on mobile */
  flex: 1;
  background: url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat;
}

@media (min-width: 1024px) {
  .auth-split-image {
    display: block;
  }
}

/* Typography & Brand */
.auth-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  color: #1E40AF;
  text-decoration: none;
}
.auth-brand svg {
  height: 2rem;
  width: 2rem;
}
.auth-brand span {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  text-transform: uppercase;
}

.auth-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.5rem;
}
.auth-subtitle {
  font-size: 1rem;
  color: #6B7280;
  margin-bottom: 2rem;
}

/* Form Elements */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.auth-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.auth-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.375rem;
  font-size: 1rem;
  color: #111827;
  background-color: #ffffff;
  transition: box-shadow 0.2s, border-color 0.2s;
  outline: none;
}
.auth-input::placeholder {
  color: #9CA3AF;
}
.auth-input:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.btn-auth {
  width: 100%;
  padding: 0.75rem;
  background-color: #1E40AF;
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  margin-top: 0.5rem;
}
.btn-auth:hover {
  background-color: #1E3A8A;
}
.btn-auth:active {
  transform: scale(0.98);
}

/* Error Message */
.auth-error-msg {
  display: none; /* Hidden by default, toggled by JS */
  background-color: #FEE2E2;
  border-left: 4px solid #EF4444;
  color: #991B1B;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

/* Footer Link */
.auth-footer-link {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: #6B7280;
}
.auth-footer-link a {
  color: #1E40AF;
  font-weight: 600;
  transition: color 0.2s;
}
.auth-footer-link a:hover {
  color: #1E3A8A;
  text-decoration: underline;
}
```

- [ ] **Step 2: Commit CSS changes**

```bash
git add assets/css/common.css
git commit -m "style: add split-screen login layout CSS classes"
```

---

### Task 2: Rebuild the HTML Structure of `pages/login.html`

**Files:**
- Modify: `pages/login.html`

- [ ] **Step 1: Replace HTML content**

Completely replace the contents of `pages/login.html` with the following structure. Note that we are preserving the critical IDs: `login-form`, `email`, `password`, and `login-error`. We also add a custom body class to prevent the default gray background from `common.css` taking over the split screen.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Login - SkyBound</title>
    <link rel="stylesheet" href="../assets/css/common.css">
</head>
<body class="auth-page-body">

    <div class="auth-split-form">
        <div class="auth-form-wrapper">
            <!-- Brand Logo -->
            <a href="../index.html" class="auth-brand">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                <span>SkyBound</span>
            </a>

            <h1 class="auth-title">Welcome back</h1>
            <p class="auth-subtitle">Please enter your details to sign in.</p>

            <!-- Error message container (ID preserved for JS) -->
            <div id="login-error" class="auth-error-msg"></div>

            <!-- Form (ID preserved for JS) -->
            <form id="login-form" class="auth-form">
                
                <div class="auth-input-group">
                    <label for="email" class="auth-label">Email address</label>
                    <input type="email" id="email" class="auth-input" placeholder="Enter your email" required>
                </div>

                <div class="auth-input-group">
                    <label for="password" class="auth-label">Password</label>
                    <input type="password" id="password" class="auth-input" placeholder="••••••••" required>
                </div>

                <button type="submit" class="btn-auth">Sign In</button>
            </form>

            <p class="auth-footer-link">
                Don't have an account? <a href="register.html">Sign up for free</a>
            </p>
        </div>
    </div>

    <!-- Right side image (Desktop only) -->
    <div class="auth-split-image"></div>

    <script src="../assets/js/login.js"></script>
    <script src="../assets/js/auth.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify functionality**

Run `php -S localhost:8000 -t .` in the terminal, open `http://localhost:8000/pages/login.html` and attempt to log in with invalid credentials to ensure the error styling and JS hooks still work. Also resize the window to ensure the image hides on mobile.

- [ ] **Step 3: Commit HTML changes**

```bash
git add pages/login.html
git commit -m "feat: implement split-screen design on login page"
```