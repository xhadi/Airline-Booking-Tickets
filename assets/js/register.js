        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const first_name = document.getElementById('first-name').value;
            const last_name = document.getElementById('last-name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const phone_number = document.getElementById('phone-number')?.value || null;
            
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
