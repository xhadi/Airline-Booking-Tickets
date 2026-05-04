// assets/js/admin-reviews.js
document.addEventListener('DOMContentLoaded', () => {
    let currentStatus = 'flagged';
    let currentPage = 1;

    document.querySelectorAll('#review-filters .filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#review-filters .filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            currentPage = 1;
            loadReviews();
        });
    });

    loadReviews();

    async function loadReviews() {
        const container = document.getElementById('reviews-container');
        const pagination = document.getElementById('reviews-pagination');
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748B;">Loading...</div>';

        try {
            const url = `../backend/api/admin/reviews.php?status=${currentStatus}&page=${currentPage}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.success) return;

            if (data.reviews.length === 0) {
                container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748B;">No reviews found.</div>';
                pagination.innerHTML = '';
                return;
            }

            let html = '';
            data.reviews.forEach(r => {
                const stars = '★'.repeat(r.overall_rating) + '☆'.repeat(5 - r.overall_rating);
                const isFlagged = currentStatus === 'flagged';
                const cardClass = isFlagged ? 'moderation-card flagged' : 'moderation-card';

                html += `
                    <div class="${cardClass}">
                        <div class="mod-header">
                            <div>
                                <span class="mod-user">${r.user_name}</span>
                                <span class="mod-stars">${stars}</span>
                            </div>
                            <span class="mod-time">${r.time_ago}</span>
                        </div>
                        ${r.comment ? `<p class="mod-comment">${escapeHtml(r.comment)}</p>` : '<p class="mod-comment" style="color:#9CA3AF;">No comment</p>'}
                        <div style="font-size:12px;color:#64748B;margin-bottom:8px;">
                            Booking: ${'★'.repeat(r.ease_of_booking)} · Support: ${'★'.repeat(r.customer_support)} · Value: ${'★'.repeat(r.value_for_money)}
                        </div>
                        ${isFlagged ? `
                        <div class="mod-actions">
                            <button class="btn-approve" onclick="moderateReview(${r.id}, 'published')">✓ Approve</button>
                            <button class="btn-hide" onclick="moderateReview(${r.id}, 'hidden')">✕ Hide</button>
                        </div>` : `<div style="font-size:12px;color:#9CA3AF;">Status: ${r.status}</div>`}
                    </div>
                `;
            });
            container.innerHTML = html;

            const totalPages = Math.ceil(data.total / data.per_page);
            let pagHtml = '';
            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    pagHtml += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToReviewPage(${i})">${i}</button>`;
                }
            }
            pagination.innerHTML = pagHtml;

        } catch (err) {
            console.error(err);
        }
    }

    window.goToReviewPage = (page) => { currentPage = page; loadReviews(); };

    window.moderateReview = async (id, status) => {
        try {
            const res = await fetch('../backend/api/admin/reviews.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            const data = await res.json();
            if (data.success) {
                adminToast(status === 'published' ? 'Review approved' : 'Review hidden');
                loadReviews();
            } else {
                adminToast(data.error || 'Failed');
            }
        } catch (err) {
            adminToast('Error moderating review');
        }
    };
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
