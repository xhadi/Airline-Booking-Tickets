        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
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
            }
        });
