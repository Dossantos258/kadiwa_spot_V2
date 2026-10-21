'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // Pausar o carrossel de cartazes em Melhores spots.
    const foodCarousel = document.getElementById('food-carousel');
    const foodToggle = document.getElementById('food-carousel-toggle');
    if (foodCarousel) {
        const foodTrack = foodCarousel.querySelector('.food-carousel-track');
        const firstGroup = foodTrack?.querySelector('.food-carousel-set');
        if (foodTrack && firstGroup) {
            // Repetir os cartazes o suficiente para preencher também ecrãs largos.
            const fillCarousel = () => {
                const groupWidth = firstGroup.offsetWidth;
                if (!groupWidth) return;
                const requiredGroups = Math.ceil(foodCarousel.clientWidth / groupWidth) + 1;
                while (foodTrack.children.length < requiredGroups) {
                    const repeatedGroup = firstGroup.cloneNode(true);
                    repeatedGroup.setAttribute('aria-hidden', 'true');
                    repeatedGroup.querySelectorAll('a').forEach(link => link.tabIndex = -1);
                    repeatedGroup.querySelectorAll('img').forEach(img => img.alt = '');
                    foodTrack.appendChild(repeatedGroup);
                }
                foodTrack.style.setProperty('--food-carousel-offset', `-${groupWidth}px`);
            };
            fillCarousel();
            if ('ResizeObserver' in window) {
                new ResizeObserver(fillCarousel).observe(foodCarousel);
            } else {
                window.addEventListener('resize', fillCarousel);
            }
        }
    }
    if (foodCarousel && foodToggle) {
        foodToggle.addEventListener('click', () => {
            const paused = foodCarousel.classList.toggle('is-paused');
            foodToggle.setAttribute('aria-pressed', String(paused));
            foodToggle.textContent = paused ? 'Continuar carrossel' : 'Pausar carrossel';
        });
    }

    /* ==========================================================================
       1. STICKY HEADER SCROLL EFFECT
       ========================================================================== */
    const header = document.querySelector('.glovo-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    /* ==========================================================================
       2. MOBILE MENU TOGGLE
       ========================================================================== */
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileToggle && navLinks) {
        const closeMenu = () => {
            navLinks.classList.remove('is-open');
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.setAttribute('aria-label', 'Abrir menu móvel');
        };
        mobileToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('is-open');
            mobileToggle.setAttribute('aria-expanded', String(isOpen));
            mobileToggle.setAttribute('aria-label', isOpen ? 'Fechar menu móvel' : 'Abrir menu móvel');
        });
        navLinks.addEventListener('click', event => {
            if (event.target.closest('a')) closeMenu();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && navLinks.classList.contains('is-open')) {
                closeMenu();
                mobileToggle.focus();
            }
        });
        document.addEventListener('click', event => {
            if (!header.contains(event.target)) closeMenu();
        });
        matchMedia('(min-width: 1101px)').addEventListener('change', closeMenu);
    }

    /* ==========================================================================
       3. GRANDE CARROSSEL DE PUBLICIDADE & DESTAQUES
       ========================================================================== */
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    const dotsContainer = document.getElementById('carouselDots');

    if (track) {
        const slides = track.querySelectorAll('.ad-slide');
        const totalSlides = slides.length;
        let currentIndex = 0;
        let autoPlayTimer = null;
        const AUTOPLAY_INTERVAL = 5000;

        // Create Indicators (Dots)
        if (dotsContainer && totalSlides > 0) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.classList.add('carousel-dot');
                dot.setAttribute('aria-label', `Ir para o anúncio ${i + 1}`);
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    goToSlide(i);
                    resetAutoplay();
                });
                dotsContainer.appendChild(dot);
            }
        }

        const updateDots = () => {
            if (!dotsContainer) return;
            const dots = dotsContainer.querySelectorAll('.carousel-dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentIndex);
            });
        };

        const goToSlide = (index) => {
            if (index < 0) {
                currentIndex = totalSlides - 1;
            } else if (index >= totalSlides) {
                currentIndex = 0;
            } else {
                currentIndex = index;
            }
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            updateDots();
        };

        const nextSlide = () => goToSlide(currentIndex + 1);
        const prevSlide = () => goToSlide(currentIndex - 1);

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                resetAutoplay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                resetAutoplay();
            });
        }

        const startAutoplay = () => {
            if (autoPlayTimer) clearInterval(autoPlayTimer);
            autoPlayTimer = setInterval(nextSlide, AUTOPLAY_INTERVAL);
        };

        const stopAutoplay = () => {
            if (autoPlayTimer) clearInterval(autoPlayTimer);
        };

        const resetAutoplay = () => {
            stopAutoplay();
            startAutoplay();
        };

        // Pause on hover
        const carouselContainer = document.getElementById('adCarousel');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', stopAutoplay);
            carouselContainer.addEventListener('mouseleave', startAutoplay);

            // Touch Swipe Support
            let startX = 0;
            let endX = 0;

            carouselContainer.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                stopAutoplay();
            }, { passive: true });

            carouselContainer.addEventListener('touchend', (e) => {
                endX = e.changedTouches[0].clientX;
                const diffX = startX - endX;
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        nextSlide();
                    } else {
                        prevSlide();
                    }
                }
                startAutoplay();
            }, { passive: true });
        }

        // Start autoplay initially
        startAutoplay();
    }

    /* ==========================================================================
       4. LOCALIZAÇÃO ATUAL (HTML5 GEOLOCATION)
       ========================================================================== */
    const btnUseLocation = document.getElementById('btn-use-location');
    const searchInput = document.getElementById('search-address');

    if (btnUseLocation && searchInput) {
        btnUseLocation.addEventListener('click', async () => {
            const status = document.getElementById('home-location-status');
            const originalBtnHtml = btnUseLocation.innerHTML;
            btnUseLocation.innerHTML = '<span>A detetar localização...</span>';
            btnUseLocation.disabled = true;
            status.textContent = 'A pedir a sua localização ao navegador…';
            try {
                await window.KadiwaLocation.request();
                const form = document.getElementById('location-search-form');
                let nearby = form.querySelector('[name="perto"]');
                if (!nearby) {
                    nearby = document.createElement('input');
                    nearby.type = 'hidden';
                    nearby.name = 'perto';
                    form.append(nearby);
                }
                nearby.value = '1';
                status.textContent = 'Localização obtida. A procurar os spots mais próximos…';
                form.requestSubmit();
            } catch (error) {
                status.textContent = window.KadiwaLocation.errorMessage(error);
            } finally {
                btnUseLocation.innerHTML = originalBtnHtml;
                btnUseLocation.disabled = false;
            }
        });
    }

    /* ==========================================================================
       5. INTERAÇÃO COM PÍLULAS DE ZONAS
       ========================================================================== */
    const zonePills = document.querySelectorAll('.zone-pill');
    zonePills.forEach((pill) => {
        pill.addEventListener('click', () => {
            const zoneName = pill.dataset.zone || pill.textContent.trim();
            if (searchInput) {
                searchInput.value = `📍 ${zoneName}`;
                const searchForm = document.getElementById('location-search-form');
                if (searchForm) {
                    searchForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    searchInput.style.outline = '3px solid #00A082';
                    setTimeout(() => {
                        searchInput.style.outline = '';
                    }, 1200);
                }
            }
        });
    });

    /* ==========================================================================
       6. FAQ ACCORDION
       ========================================================================== */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
        const btn = item.querySelector('.faq-question-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');

                // Close other items
                faqItems.forEach((other) => {
                    other.classList.remove('open');
                    const otherBtn = other.querySelector('.faq-question-btn');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                });

                // Toggle current item
                if (!isOpen) {
                    item.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        }
    });

    /* ==========================================================================
       7. BILLING TOGGLE (PÁGINA DE NEGÓCIOS)
       ========================================================================== */
    const billingButtons = document.querySelectorAll('[data-billing]');
    if (billingButtons.length > 0) {
        billingButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                billingButtons.forEach((b) => b.classList.toggle('active', b === btn));
                const isAnnual = btn.dataset.billing === 'annual';

                const priceElements = document.querySelectorAll('[data-month]');
                priceElements.forEach((el) => {
                    el.textContent = isAnnual ? el.dataset.year : el.dataset.month;
                });
            });
        });
    }

    /* ==========================================================================
       8. NEWSLETTER SUBMISSION
       ========================================================================== */
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            newsletterForm.reset();
        });
    }
});
