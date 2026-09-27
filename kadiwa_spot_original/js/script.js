'use strict';

document.querySelectorAll('[data-billing]').forEach((button) => {
    button.addEventListener('click', () => {
        document.querySelectorAll('[data-billing]').forEach((item) => {
            item.classList.toggle('active', item === button);
        });

        const annual = button.dataset.billing === 'annual';
        document.querySelectorAll('[data-month]').forEach((price) => {
            price.textContent = annual ? price.dataset.year : price.dataset.month;
        });
    });
});

document.querySelectorAll('.faq-list article button').forEach((button) => {
    button.addEventListener('click', () => {
        const article = button.closest('article');
        const willOpen = !article.classList.contains('open');

        document.querySelectorAll('.faq-list article').forEach((item) => {
            item.classList.remove('open');
            item.querySelector('button').setAttribute('aria-expanded', 'false');
        });

        if (willOpen) {
            article.classList.add('open');
            button.setAttribute('aria-expanded', 'true');
        }
    });
});

document.querySelector('#newsletter-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    form.hidden = true;
    document.querySelector('.newsletter-success').hidden = false;
});
