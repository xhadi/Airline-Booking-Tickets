// assets/js/admin-users.js
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    document.getElementById('search-users').addEventListener('input', debounce(loadUsers, 300));

    async function loadUsers() {
        const search = document.getElementById('search-users').value;
        const container = document.getElementById('users-table');

        try {
            const url = search
                ? `../backend/api/admin/users.php?search=${encodeURIComponent(search)}`
                : '../backend/api/admin/users.php';
            const res = await fetch(url);
            const data = await res.json();
            if (!data.success) return;

            if (data.users.length === 0) {
                container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748B;">No users found.</div>';
                return;
            }

            let html = '<table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Bookings</th><th>Member Since</th></tr></thead><tbody>';
            data.users.forEach(u => {
                const joined = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                html += `
                    <tr>
                        <td><strong>${u.first_name} ${u.last_name}</strong></td>
                        <td>${u.email}</td>
                        <td>${u.phone_number || '—'}</td>
                        <td>${u.booking_count}</td>
                        <td>${joined}</td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;

        } catch (err) {
            console.error('Users load failed', err);
        }
    }
});

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
