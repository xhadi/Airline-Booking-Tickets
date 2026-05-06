// assets/js/admin-bookings.js
document.addEventListener('DOMContentLoaded', () => {
    let currentStatus = 'all';
    let currentPage = 1;

    document.querySelectorAll('#booking-filters .filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#booking-filters .filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            currentPage = 1;
            loadBookings();
        });
    });

    loadBookings();

    async function loadBookings() {
        const container = document.getElementById('bookings-table');
        const pagination = document.getElementById('bookings-pagination');
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748B;">Loading...</div>';

        try {
            const url = `../backend/api/admin/bookings.php?status=${currentStatus}&page=${currentPage}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.success) return;

            if (data.bookings.length === 0) {
                container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748B;">No bookings found.</div>';
                pagination.innerHTML = '';
                return;
            }

            let html = '<table><thead><tr><th>PNR</th><th>Route</th><th>User</th><th>Status</th><th>Price</th><th></th></tr></thead><tbody>';
            data.bookings.forEach(b => {
                const badgeClass = 'badge-' + b.status;
                html += `
                    <tr>
                        <td><code>${b.pnr}</code></td>
                        <td>${b.route}</td>
                        <td>${b.user_name}</td>
                        <td><span class="badge ${badgeClass}">${b.status}</span></td>
                        <td>${b.currency} ${parseFloat(b.total_price).toFixed(2)}</td>
                        <td>${(b.status === 'confirmed')
                            ? `<button class="btn-cancel-booking" onclick="cancelBooking(${b.id})">Cancel</button>`
                            : ''}</td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;

            const totalPages = Math.ceil(data.total / data.per_page);
            let pagHtml = '';
            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    pagHtml += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
                }
            }
            pagination.innerHTML = pagHtml;

        } catch (err) {
            console.error(err);
        }
    }

    window.goToPage = (page) => { currentPage = page; loadBookings(); };

    window.cancelBooking = async (id) => {
        if (!confirm('Cancel this booking?')) return;
        try {
            const res = await fetch('../backend/api/admin/bookings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: id })
            });
            const data = await res.json();
            if (data.success) {
                adminToast('Booking cancelled');
                loadBookings();
            } else {
                adminToast(data.error || 'Failed to cancel');
            }
        } catch (err) {
            adminToast('Error cancelling booking');
        }
    };
});
