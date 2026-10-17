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
        mobileToggle.addEventListener('click', () => {
            const isOpen = navLinks.style.display === 'flex';
            if (isOpen) {
                navLinks.style.display = 'none';
                mobileToggle.setAttribute('aria-expanded', 'false');
            } else {
                navLinks.style.display = 'flex';
                mobileToggle.setAttribute('aria-expanded', 'true');
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '76px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = header ? getComputedStyle(header).backgroundColor : '#FFFFFF';
                navLinks.style.padding = '24px';
            }
        });
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
        btnUseLocation.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('A geolocalização não é suportada pelo seu navegador. Digite a sua zona manualmente.');
                searchInput.focus();
                return;
            }

            const originalBtnHtml = btnUseLocation.innerHTML;
            btnUseLocation.innerHTML = '<span>A detetar localização...</span>';
            btnUseLocation.disabled = true;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(3);
                    const lon = position.coords.longitude.toFixed(3);
                    // Amigável identificação para Maputo/Moçambique
                    searchInput.value = '📍 Maputo Central (Localização atual)';
                    btnUseLocation.innerHTML = '<span>✓ Localização pronta!</span>';
                    btnUseLocation.style.background = '#EBF8F5';
                    btnUseLocation.style.color = '#00A082';

                    setTimeout(() => {
                        btnUseLocation.innerHTML = originalBtnHtml;
                        btnUseLocation.disabled = false;
                        btnUseLocation.style.background = '';
                        btnUseLocation.style.color = '';
                    }, 3500);
                },
                (error) => {
                    btnUseLocation.innerHTML = originalBtnHtml;
                    btnUseLocation.disabled = false;
                    searchInput.value = 'Maputo, Polana';
                    searchInput.focus();
                },
                { timeout: 8000 }
            );
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
