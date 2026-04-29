// assets/js/auth.js
document.addEventListener('DOMContentLoaded', async () => {
    // Determine depth for fetch path
    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const basePath = isRoot ? '' : '../';
    const statusUrl = `${basePath}backend/api/auth/status.php`;
    const logoutUrl = `${basePath}backend/api/auth/logout.php`;

    try {
        const res = await fetch(statusUrl);
        const data = await res.json();
        
        const isProtectedPage = window.location.pathname.includes('booking.html') || 
                                window.location.pathname.includes('profile.html');

        if (!data.authenticated && isProtectedPage) {
            window.location.href = `${basePath}pages/login.html`;
            return;
        }

        // Update Navigation
        const desktopNav = document.querySelector('.desktop-nav');
        if (desktopNav) {
            if (data.authenticated) {
                desktopNav.innerHTML = `
                    <a class="nav-link" href="${basePath}index.html">Home</a>
                    <a class="nav-link" href="#">Contact</a>
                    <a class="nav-link" href="${basePath}pages/profile.html">Profile</a>
                    <a class="nav-link" href="#" id="logout-btn">Logout</a>
                `;
                document.getElementById('logout-btn').addEventListener('click', async (e) => {
                    e.preventDefault();
                    await fetch(logoutUrl, { method: 'POST' });
                    window.location.href = `${basePath}index.html`;
                });
            } else {
                desktopNav.innerHTML = `
                    <a class="nav-link" href="${basePath}index.html">Home</a>
                    <a class="nav-link" href="#">Contact</a>
                    <a class="nav-link" href="${basePath}pages/login.html">Login</a>
                `;
            }
        }
    } catch (err) {
        console.error('Auth check failed', err);
    }
});
