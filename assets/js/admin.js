// assets/js/admin.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('../backend/api/admin/status.php');
        const data = await res.json();

        if (!data.authenticated) {
            window.location.href = 'login.html';
            return;
        }

        const page = window.location.pathname.split('/').pop().replace('.html', '');
        const link = document.querySelector(`.sidebar-link[data-page="${page}"]`);
        if (link) link.classList.add('active');

        const nameEl = document.getElementById('admin-username');
        if (nameEl && data.admin) {
            nameEl.textContent = data.admin.username;
        }
    } catch (err) {
        window.location.href = 'login.html';
    }
});

function adminLogout() {
    fetch('../backend/api/admin/logout.php', { method: 'POST' })
        .then(() => { window.location.href = 'login.html'; });
}

function adminToast(message) {
    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
