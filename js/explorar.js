'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('explore-form');
    const search = document.getElementById('spot-search');
    const zone = document.getElementById('spot-zone');
    const openNow = document.getElementById('open-now');
    const categoryButtons = document.querySelectorAll('.category-filter');
    const cards = document.querySelectorAll('.spot-card');
    const resultCount = document.getElementById('results-count');
    const emptyState = document.getElementById('spots-empty');
    const clearButtons = [
        document.getElementById('clear-filters'),
        document.getElementById('empty-clear')
    ];

    let activeCategory = 'todos';

    // Retira acentos e diferenças entre maiúsculas e minúsculas da pesquisa.
    const normalize = (value) => value
        .toLocaleLowerCase('pt-MZ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const applyFilters = () => {
        const term = normalize(search.value);
        const selectedZone = zone.value;
        let visible = 0;

        cards.forEach((card) => {
            const matchesText = normalize(card.dataset.name).includes(term);
            const matchesCategory = activeCategory === 'todos' || card.dataset.category === activeCategory;
            const matchesZone = selectedZone === 'todas' || card.dataset.zone === selectedZone;
            const matchesOpen = !openNow.checked || card.dataset.open === 'true';
            const showCard = matchesText && matchesCategory && matchesZone && matchesOpen;

            card.hidden = !showCard;
            if (showCard) visible += 1;
        });

        resultCount.textContent = `${visible} ${visible === 1 ? 'spot encontrado' : 'spots encontrados'}`;
        emptyState.hidden = visible !== 0;
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        applyFilters();
    });

    search.addEventListener('input', applyFilters);
    zone.addEventListener('change', applyFilters);
    openNow.addEventListener('change', applyFilters);

    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeCategory = button.dataset.category;
            categoryButtons.forEach((item) => item.classList.toggle('active', item === button));
            applyFilters();
        });
    });

    clearButtons.forEach((button) => {
        button.addEventListener('click', () => {
            form.reset();
            activeCategory = 'todos';
            categoryButtons.forEach((item) => item.classList.toggle('active', item.dataset.category === 'todos'));
            applyFilters();
        });
    });

    // Aproveita os parâmetros enviados pela pesquisa e pelos atalhos da homepage.
    const params = new URLSearchParams(window.location.search);
    search.value = params.get('q') || '';

    const categoryFromUrl = params.get('categoria');
    if (categoryFromUrl) {
        const matchingButton = Array.from(categoryButtons)
            .find((button) => button.dataset.category === categoryFromUrl);
        if (matchingButton) matchingButton.click();
    } else {
        applyFilters();
    }
});
