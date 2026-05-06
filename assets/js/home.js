// Destination card - image navigation and click handling
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.destination-card');
    
    cards.forEach(card => {
        const img = card.querySelector('img');
        const images = card.dataset.images ? card.dataset.images.split(',') : [];
        const leftArrow = card.querySelector('.img-arrow-left');
        const rightArrow = card.querySelector('.img-arrow-right');
        
        let currentIndex = 0;
        
        const showImage = (index) => {
            if (img && images[index]) {
                const folder = card.dataset.folder || card.dataset.name;
                img.src = `assets/images/${folder}/${images[index]}`;
                currentIndex = index;
            }
        };
        
        // Manual arrow navigation
        if (leftArrow) {
            leftArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                showImage((currentIndex - 1 + images.length) % images.length);
            });
        }
        
        if (rightArrow) {
            rightArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                showImage((currentIndex + 1) % images.length);
            });
        }
        
        // Image rotation on hover (stops when clicking arrows)
        if (images.length > 0) {
            let interval;
            
            const startRotation = () => {
                interval = setInterval(() => {
                    showImage((currentIndex + 1) % images.length);
                }, 2500);
            };
            
            const stopRotation = () => {
                clearInterval(interval);
            };
            
            card.addEventListener('mouseenter', startRotation);
            card.addEventListener('mouseleave', stopRotation);
        }
        
        // Handle Explore click
        const btn = card.querySelector('.btn-explore');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cityCode = card.dataset.city;
                const cityName = card.dataset.name;
                
                localStorage.setItem('searchDestination', cityName + ' (' + cityCode + ')');
                localStorage.removeItem('flightSearchParams'); // Clear old search params
                window.location.href = 'pages/search.html';
            });
        }
    });
});

// Testimonials section - fetch top reviews
(function loadTestimonials() {
    try {
        fetch('backend/api/reviews.php?stats=1')
            .then(res => res.json())
            .then(data => {
                if (!data.success || !data.top_reviews || data.top_reviews.length === 0) return;

                const container = document.getElementById('testimonials-container');
                if (!container) return;

                let html = '';
                data.top_reviews.forEach(r => {
                    const initials = (r.first_name[0] + r.last_name[0]).toUpperCase();
                    const stars = '★'.repeat(r.overall_rating) + '☆'.repeat(5 - r.overall_rating);
                    const comment = r.comment || 'Great experience with SkyBound!';

                    html += `
                        <div class="review-card">
                            <div class="review-card-header">
                                <div class="review-avatar">${initials}</div>
                                <div>
                                    <div class="review-card-name">${escapeTestimonialHtml(r.first_name)} ${escapeTestimonialHtml(r.last_name[0])}.</div>
                                    <div class="review-card-stars">${stars}</div>
                                </div>
                            </div>
                            <p class="review-comment">${escapeTestimonialHtml(comment)}</p>
                            <div class="review-footer">
                                <span>${r.user_booking_count} booking${r.user_booking_count !== 1 ? 's' : ''} on SkyBound</span>
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = html;
            })
            .catch(err => console.error('Failed to load testimonials', err));
    } catch (err) {
        console.error('Failed to load testimonials', err);
    }
})();

function escapeTestimonialHtml(str) {
    const div = document.createElement('div');
    div.textContent = typeof str === 'string' ? str : '';
    return div.innerHTML;
}