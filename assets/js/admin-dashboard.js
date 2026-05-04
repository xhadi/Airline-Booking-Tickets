// assets/js/admin-dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('../backend/api/admin/dashboard.php');
        const data = await res.json();
        if (!data.success) return;

        document.querySelector('.stat-card.users .stat-value').textContent = data.stats.total_users.toLocaleString();
        document.querySelector('.stat-card.bookings .stat-value').textContent = data.stats.total_bookings.toLocaleString();
        document.querySelector('.stat-card.revenue .stat-value').textContent = '$' + data.stats.total_revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.querySelector('.stat-card.flagged .stat-value').textContent = data.stats.flagged_reviews;

        const container = document.getElementById('activity-container');
        if (data.activities.length === 0) {
            container.innerHTML = '<div class="activity-header">Recent Activity</div><div style="padding:20px;text-align:center;color:#64748B;">No recent activity</div>';
            return;
        }

        let html = '<div class="activity-header">Recent Activity</div>';
        data.activities.forEach(a => {
            let icon, iconClass, text;
            if (a.type === 'booking') {
                icon = '✈'; iconClass = 'booking';
                text = `${a.user_name} booked flight ${a.pnr}`;
            } else if (a.type === 'user') {
                icon = '👤'; iconClass = 'user';
                text = `${a.user_name} registered`;
            } else if (a.type === 'flagged') {
                icon = '🚩'; iconClass = 'flagged';
                text = `${a.user_name}'s review was flagged`;
            } else {
                icon = '•'; iconClass = '';
                text = '';
            }

            html += `
                <div class="activity-item">
                    <div class="activity-icon ${iconClass}">${icon}</div>
                    <span class="activity-text">${text}</span>
                    <span class="activity-time">${a.time_ago}</span>
                </div>
            `;
        });
        container.innerHTML = html;

    } catch (err) {
        console.error('Dashboard load failed', err);
    }
});
