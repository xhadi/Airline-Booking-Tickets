(function() {
    let userEmail = '';

    const errorEl = document.getElementById('fp-error');
    const successEl = document.getElementById('fp-success');
    const stepEmail = document.getElementById('step-email');
    const stepAnswer = document.getElementById('step-answer');
    const stepReset = document.getElementById('step-reset');
    const questionDisplay = document.getElementById('fp-question-display');

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        successEl.style.display = 'none';
    }

    function showSuccess(msg) {
        successEl.textContent = msg;
        successEl.style.display = 'block';
        errorEl.style.display = 'none';
    }

    function hideMessages() {
        errorEl.style.display = 'none';
        successEl.style.display = 'none';
    }

    function showStep(step) {
        stepEmail.style.display = 'none';
        stepAnswer.style.display = 'none';
        stepReset.style.display = 'none';
        hideMessages();
        step.style.display = 'block';
    }

    document.getElementById('email-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('fp-email').value.trim();

        if (!email) {
            showError('Email is required');
            return;
        }

        errorEl.style.display = 'none';

        try {
            const res = await fetch('../backend/api/auth/forgot-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (res.ok) {
                userEmail = email;
                questionDisplay.value = data.security_question;
                showStep(stepAnswer);
            } else {
                showError(data.error || 'Failed to find account');
            }
        } catch (err) {
            console.error(err);
            showError('Network error. Please try again.');
        }
    });

    document.getElementById('answer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const answer = document.getElementById('fp-answer').value.trim();

        if (!answer) {
            showError('Answer is required');
            return;
        }

        errorEl.style.display = 'none';

        try {
            const res = await fetch('../backend/api/auth/reset-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, answer, new_password: 'TEMPORARY_PASSWORD_reset' })
            });
            const data = await res.json();

            if (res.ok) {
                showStep(stepReset);
            } else {
                showError(data.error || 'Incorrect answer');
            }
        } catch (err) {
            console.error(err);
            showError('Network error. Please try again.');
        }
    });

    document.getElementById('reset-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('fp-new-password').value.trim();
        const confirmPassword = document.getElementById('fp-confirm-password').value.trim();

        if (!newPassword || newPassword.length < 8) {
            showError('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        errorEl.style.display = 'none';

        try {
            const res = await fetch('../backend/api/auth/reset-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, answer: document.getElementById('fp-answer').value.trim(), new_password: newPassword })
            });
            const data = await res.json();

            if (res.ok) {
                showSuccess('Password reset successful! Redirecting to login...');
                stepReset.style.display = 'none';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showError(data.error || 'Password reset failed');
            }
        } catch (err) {
            console.error(err);
            showError('Network error. Please try again.');
        }
    });
})();
