const phoneInput = document.querySelector("#phone-number");
const iti = window.intlTelInput(phoneInput, {
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
    initialCountry: "sa", // Default to Saudi Arabia based on context
    separateDialCode: true, // Shows the +966 separate from the input
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const first_name = document.getElementById('first-name').value.trim();
    const last_name = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    const errContainer = document.getElementById('register-error');
    
    let phone_number = null;
    if (phoneInput.value.trim() !== "") {
        if (!iti.isValidNumber()) {
            errContainer.textContent = 'Please enter a valid phone number';
            errContainer.style.display = 'block';
            return;
        }
        phone_number = iti.getNumber(); // Gets the full E.164 format (+966...)
    }
            
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
