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
                }, 1500);
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