// assets/js/reviews.js
document.addEventListener('DOMContentLoaded', async () => {
    let currentPage = 1;
    let totalPages = 1;

    await loadStats();
    await loadReviews(1);

    async function loadStats() {
        try {
            const res = await fetch('../backend/api/reviews.php?stats=1');
            const data = await res.json();
            if (data.success && data.stats) {
                const stats = data.stats;
                document.getElementById('reviews-stats').innerHTML = `
                    <span class="reviews-avg-badge">★ ${stats.avg_rating}</span>
                    <span class="reviews-count">Based on ${stats.total_reviews} review${stats.total_reviews !== 1 ? 's' : ''}</span>
                `;
            }
        } catch (err) {
            console.error('Failed to load stats', err);
        }
    }

    async function loadReviews(page) {
        const container = document.getElementById('reviews-container');
        const pagination = document.getElementById('reviews-pagination');
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:#6B7280;">Loading...</div>';

        try {
            const res = await fetch(`../backend/api/reviews.php?page=${page}&per_page=10`);
            const data = await res.json();

            if (data.success) {
                totalPages = Math.ceil(data.total / data.per_page);
                currentPage = page;

                if (data.reviews.length === 0) {
                    container.innerHTML = '<div style="text-align:center; padding:3rem; color:#6B7280;">No reviews yet. Be the first!</div>';
                    pagination.innerHTML = '';
                    return;
                }

                let html = '';
                data.reviews.forEach(r => {
                    const initials = (r.first_name[0] + r.last_name[0]).toUpperCase();
                    const stars = '★'.repeat(r.overall_rating) + '☆'.repeat(5 - r.overall_rating);
                    const timeAgo = timeSince(new Date(r.created_at));
                    const categoryLabels = {
                        ease_of_booking: 'Booking',
                        customer_support: 'Support',
                        value_for_money: 'Value'
                    };

                    html += `
                        <div class="review-card">
                            <div class="review-card-header">
                                <div class="review-avatar">${initials}</div>
                                <div>
                                    <div class="review-card-name">${r.first_name} ${r.last_name[0]}.</div>
                                    <div class="review-card-stars">${stars}</div>
                                </div>
                            </div>
                            <div class="review-categories">
                                ${Object.entries(categoryLabels).map(([key, label]) => `
                                    <span class="review-category-tag">${label}: ${'★'.repeat(r[key])}${'☆'.repeat(5 - r[key])}</span>
                                `).join('')}
                            </div>
                            ${r.comment ? `<p class="review-comment">${escapeHtml(r.comment)}</p>` : ''}
                            <div class="review-footer">
                                <span>${r.user_booking_count} booking${r.user_booking_count !== 1 ? 's' : ''} on SkyBound · ${timeAgo}</span>
                                <button class="btn-flag" data-review-id="${r.id}" onclick="flagReview(${r.id}, this)">🚩 Report</button>
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = html;

                let pagHtml = '';
                if (totalPages > 1) {
                    const blockSize = 10;
                    const currentBlock = Math.ceil(currentPage / blockSize);
                    const blockStart = (currentBlock - 1) * blockSize + 1;
                    const blockEnd = Math.min(blockStart + blockSize - 1, totalPages);

                    if (currentBlock > 1) {
                        pagHtml += `<button onclick="loadReviews(${blockStart - 1})">&#8249;</button>`;
                    }

                    for (let i = blockStart; i <= blockEnd; i++) {
                        pagHtml += `<button class="${i === currentPage ? 'active' : ''}" onclick="loadReviews(${i})">${i}</button>`;
                    }

                    if (blockEnd < totalPages) {
                        pagHtml += `<button onclick="loadReviews(${blockEnd + 1})">&#8250;</button>`;
                    }
                }
                pagination.innerHTML = pagHtml;
            }
        } catch (err) {
            console.error('Failed to load reviews', err);
            container.innerHTML = '<div style="text-align:center; padding:2rem; color:#EF4444;">Failed to load reviews.</div>';
        }
    }

    window.loadReviews = loadReviews;
});

async function flagReview(reviewId, btn) {
    if (btn.classList.contains('flagged')) return;

    try {
        const res = await fetch(`../backend/api/reviews.php?action=flag&id=${reviewId}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            btn.textContent = '🚩 Reported';
            btn.classList.add('flagged');
        }
    } catch (err) {
        console.error('Failed to flag review', err);
    }
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) return count + ' ' + interval.label + (count > 1 ? 's' : '') + ' ago';
    }
    return 'just now';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
