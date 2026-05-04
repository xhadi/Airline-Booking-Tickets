// assets/js/review-form.js

/**
 * Show the review form modal for a given booking.
 * @param {Object} booking - { id, origin, dest, depDate, flight_snapshot, pnr }
 * @param {Object|null} existingReview - If editing, the existing review data
 */
function showReviewModal(booking, existingReview = null) {
    const existing = document.getElementById('review-modal');
    if (existing) existing.remove();

    const isEdit = existingReview !== null;
    const title = isEdit ? 'Edit Your Review' : 'Review Your Experience';
    const destName = booking.dest || '---';
    const route = `${booking.origin || '---'} → ${destName}`;
    const depDate = booking.depDate || '---';
    const btnText = isEdit ? 'Update Review' : 'Submit Review';

    const modalHtml = `
        <div id="review-modal">
            <div class="modal-overlay" onclick="event.stopPropagation()">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="closeReviewModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="review-flight-context">
                            ${route} · ${depDate}
                        </div>
                        <div class="rating-row">
                            <span class="rating-label overall">Overall Rating</span>
                            <div class="star-rating" data-rating="overall" data-value="${existingReview ? existingReview.overall_rating : 0}">
                                ${buildStars()}
                            </div>
                        </div>
                        <div class="rating-row">
                            <span class="rating-label">Ease of Booking</span>
                            <div class="star-rating" data-rating="ease_of_booking" data-value="${existingReview ? existingReview.ease_of_booking : 0}">
                                ${buildStars()}
                            </div>
                        </div>
                        <div class="rating-row">
                            <span class="rating-label">Customer Support</span>
                            <div class="star-rating" data-rating="customer_support" data-value="${existingReview ? existingReview.customer_support : 0}">
                                ${buildStars()}
                            </div>
                        </div>
                        <div class="rating-row">
                            <span class="rating-label">Value for Money</span>
                            <div class="star-rating" data-rating="value_for_money" data-value="${existingReview ? existingReview.value_for_money : 0}">
                                ${buildStars()}
                            </div>
                        </div>
                        <div style="margin-top: 16px;">
                            <label class="rating-label" style="display:block;margin-bottom:6px;">Comment (optional)</label>
                            <textarea class="comment-area" id="review-comment" placeholder="Share your experience...">${escapeHtml(existingReview ? (existingReview.comment || '') : '')}</textarea>
                        </div>
                        <div class="modal-actions">
                            <button class="btn-cancel" onclick="closeReviewModal()">Cancel</button>
                            <button class="btn-submit-review" id="btn-submit-review"
                                    onclick="submitReview(${booking.id}, '${isEdit ? 'true' : 'false'}', ${existingReview ? existingReview.id : 'null'})">
                                ${btnText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.querySelectorAll('#review-modal .star-rating').forEach(ratingEl => {
        const stars = ratingEl.querySelectorAll('.star');
        let currentVal = parseInt(ratingEl.dataset.value) || 0;

        const setStars = (val) => {
            stars.forEach((s, i) => {
                s.classList.toggle('active', i < val);
                s.classList.toggle('hover', false);
            });
        };

        stars.forEach((star, idx) => {
            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => s.classList.toggle('hover', i <= idx));
            });
            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.toggle('hover', false));
            });
            star.addEventListener('click', () => {
                currentVal = idx + 1;
                ratingEl.dataset.value = currentVal;
                setStars(currentVal);
            });
        });

        setStars(currentVal);
    });
}

function buildStars() {
    return '<span class="star">★</span>'.repeat(5);
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) modal.remove();
}

async function submitReview(bookingId, isEdit, reviewId) {
    const ratings = {};
    document.querySelectorAll('#review-modal .star-rating').forEach(el => {
        const key = el.dataset.rating;
        const val = parseInt(el.dataset.value) || 0;
        if (val > 0) ratings[key] = val;
    });

    if (!ratings.overall || !ratings.ease_of_booking || !ratings.customer_support || !ratings.value_for_money) {
        showReviewToast('Please rate all categories');
        return;
    }

    const comment = document.getElementById('review-comment').value.trim() || null;

    const btn = document.getElementById('btn-submit-review');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const basePath = isRoot ? '' : '../';

    try {
        const method = isEdit === 'true' ? 'PUT' : 'POST';
        let url = `${basePath}backend/api/reviews.php`;
        if (isEdit === 'true' && reviewId) {
            url += `?id=${reviewId}`;
        }

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_id: bookingId,
                overall_rating: ratings.overall,
                ease_of_booking: ratings.ease_of_booking,
                customer_support: ratings.customer_support,
                value_for_money: ratings.value_for_money,
                comment: comment
            })
        });

        const data = await res.json();

        if (data.success) {
            showReviewToast(isEdit === 'true' ? 'Review updated!' : 'Review submitted!');
            closeReviewModal();
            if (typeof refreshProfile === 'function') refreshProfile();
        } else {
            showReviewToast(data.error || 'Failed to submit review');
        }
    } catch (err) {
        console.error(err);
        showReviewToast('Error submitting review');
    } finally {
        btn.disabled = false;
        btn.textContent = isEdit === 'true' ? 'Update Review' : 'Submit Review';
    }
}

function showReviewToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
