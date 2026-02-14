// ===== INTERSECTION OBSERVER FOR SCROLL REVEAL =====
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. SCROLL REVEAL ANIMATION
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                // Optional: stop observing after animation
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add 'hidden' class and observe elements
    const animateOnScroll = document.querySelectorAll(
        '.trust > div, .card, .title, footer .vision, footer .quick-links'
    );

    animateOnScroll.forEach(element => {
        element.classList.add('hidden');
        observer.observe(element);
    });

    // 2. STAGGERED CARD ANIMATIONS
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });

    // 3. DROPDOWN FUNCTIONALITY (Enhanced from original)
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.dropdown-btn');
        const menu = dropdown.querySelector('.dropdown-menu');
        const items = dropdown.querySelectorAll('.dropdown-item');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close other dropdowns
            dropdowns.forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('active');
                }
            });

            dropdown.classList.toggle('active');
        });

        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                btn.childNodes[0].textContent = item.textContent + ' ';
                dropdown.classList.remove('active');
            });
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });

    // 4. SMOOTH SCROLL FOR NAVIGATION LINKS
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 5. PARALLAX EFFECT ON HERO (Optional - subtle)
    let lastScrollY = window.scrollY;
    const hero = document.querySelector('.hero');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (hero && scrollY < window.innerHeight) {
            hero.style.transform = `translateY(${scrollY * 0.5}px)`;
        }
        lastScrollY = scrollY;
    }, { passive: true });

    // 6. NAVBAR BACKGROUND ON SCROLL
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.style.backgroundColor = 'rgba(242, 253, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.backgroundColor = '#f2fdff';
            header.style.backdropFilter = 'none';
            header.style.boxShadow = 'none';
        }
    }, { passive: true });

    // 7. PERFORMANCE: Reduce motion for users who prefer it
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        document.querySelectorAll('*').forEach(element => {
            element.style.animation = 'none';
            element.style.transition = 'none';
        });
    }
});