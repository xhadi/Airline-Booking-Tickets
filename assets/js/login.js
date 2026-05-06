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
                const res = await fetch('../backend/api/auth/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                
                if (res.ok) {
                    window.location.href = '../index.html';
                } else {
                    const err = document.getElementById('login-error');
                    err.textContent = data.error || 'Login failed';
                    err.style.display = 'block';
                }
            } catch (err) {
                console.error(err);
                const errEl = document.getElementById('login-error');
                if (errEl) {
                    errEl.textContent = 'Network error. Please check your connection and try again.';
                    errEl.style.display = 'block';
                }
            }
        });
