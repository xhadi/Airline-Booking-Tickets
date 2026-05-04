// assets/js/admin-transactions.js
document.addEventListener('DOMContentLoaded', () => {
    let currentType = 'all';
    let currentPage = 1;

    document.querySelectorAll('#txn-filters .filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#txn-filters .filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentType = tab.dataset.type;
            currentPage = 1;
            loadTransactions();
        });
    });

    loadTransactions();

    async function loadTransactions() {
        const container = document.getElementById('transactions-table');
        const pagination = document.getElementById('txn-pagination');
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748B;">Loading...</div>';

        try {
            const url = `../backend/api/admin/transactions.php?type=${currentType}&page=${currentPage}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.success) return;

            if (data.transactions.length === 0) {
                container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748B;">No transactions found.</div>';
                pagination.innerHTML = '';
                return;
            }

            let html = '<table><thead><tr><th>Date</th><th>Booking ID</th><th>Gateway</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
            data.transactions.forEach(t => {
                const date = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const typeBadge = t.transaction_type === 'charge' ? 'badge-charge' : 'badge-refund';
                const statusBadge = 'badge-' + t.status;
                html += `
                    <tr>
                        <td>${date}</td>
                        <td>#${t.booking_id}</td>
                        <td>${t.payment_gateway_id || '—'}</td>
                        <td><span class="badge ${typeBadge}">${t.transaction_type}</span></td>
                        <td>${t.currency} ${parseFloat(t.amount).toFixed(2)}</td>
                        <td><span class="badge ${statusBadge}">${t.status}</span></td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;

            const totalPages = Math.ceil(data.total / data.per_page);
            let pagHtml = '';
            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    pagHtml += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToTxnPage(${i})">${i}</button>`;
                }
            }
            pagination.innerHTML = pagHtml;

        } catch (err) {
            console.error(err);
        }
    }

    window.goToTxnPage = (page) => { currentPage = page; loadTransactions(); };
});
