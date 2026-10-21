'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const data = window.KadiwaExploreData;
    if (!data || !document.getElementById('spots-grid')) return;
    const $ = selector => document.querySelector(selector);
    const $$ = selector => Array.from(document.querySelectorAll(selector));
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const photo = item => `../media/imagens/${encodeURIComponent(item.photo || item.image)}`;
    const number = value => new Intl.NumberFormat('pt-MZ', { maximumFractionDigits: 1 }).format(value);
    const findSpot = id => data.spots.find(item => item.id === id);
    const state = { query: '', location: '', categories: new Set(), open: false, price: null, rating: null, sort: 'relevance', limit: 6 };
    const filterDialog = $('#filter-dialog');
    const mapDialog = $('#map-dialog');
    const detailsDialog = $('#detail-dialog');
    let filtered = [];

    // Manter a pesquisa visível e os resultados abaixo das duas faixas fixas.
    const searchBar = $('.explore-search-bar');
    const pageHeader = $('.glovo-header');
    if (searchBar && pageHeader) {
        const updateStickyOffsets = () => {
            document.body.style.setProperty('--explore-header-height', `${Math.ceil(pageHeader.getBoundingClientRect().height)}px`);
            document.body.style.setProperty('--explore-search-height', `${Math.ceil(searchBar.getBoundingClientRect().height)}px`);
        };
        updateStickyOffsets();
        if ('ResizeObserver' in window) {
            const stickyObserver = new ResizeObserver(updateStickyOffsets);
            stickyObserver.observe(pageHeader);
            stickyObserver.observe(searchBar);
        } else window.addEventListener('resize', updateStickyOffsets);
    }

    function card(item, variant = 'result') {
        const category = data.categoryLabel(item.category);
        const compact = variant !== 'result';
        const badgeText = variant === 'popular' && item.tag
            ? item.tag : item.open == null ? '' : item.open ? 'Aberto agora' : 'Fechado';
        const badge = badgeText ? `<span class="spot-tag">${escape(badgeText)}</span>` : '';
        const rating = item.rating == null ? '' : `<span class="spot-rating" aria-label="Avaliação demonstrativa ${number(item.rating)} de 5">★ ${number(item.rating)}${!compact && item.reviews != null ? ` <span>(${item.reviews})</span>` : ''}</span>`;
        const subtitle = [category, item.zone || item.mode].filter(Boolean).join(' · ');
        const extra = [item.distance == null ? '' : `${number(item.distance)} km`, item.description].filter(Boolean).join(' · ');
        const price = item.price == null ? '' : `<span class="spot-price" aria-label="Faixa de preço ${item.price}">Faixa <strong>${'$'.repeat(item.price)}</strong></span>`;
        const imageClass = !item.photo && item.imageFit === 'contain' ? 'image-contain' : '';
        return `<article class="spot-card${compact ? ' spot-card-compact' : ''}" data-spot-id="${item.id}"${compact ? ' role="listitem"' : ''}>
            <button class="spot-image-wrap" type="button" data-details="${item.id}" aria-label="Ver detalhes de ${escape(item.name)}"><img src="${photo(item)}" alt="Imagem ilustrativa de ${escape(category.toLowerCase())}" class="${imageClass}" width="600" height="450" loading="lazy" decoding="async">${badge}</button>
            <div class="spot-card-body">
                <div class="spot-title-row"><h3><button class="spot-title-button" type="button" data-details="${item.id}">${escape(item.name)}</button></h3>${compact ? '' : rating}</div>
                <p class="spot-subtitle">${escape(subtitle)}</p>
                ${extra && !compact ? `<p class="spot-description">${escape(extra)}</p>` : ''}
                ${price || (compact && rating) ? `<p class="spot-card-meta">${price}${compact ? rating : ''}</p>` : ''}
            </div></article>`;
    }

    function renderMap(items) {
        // Posições no esquema, sem coordenadas ou geolocalização fictícias.
        const columns = 4;
        const rows = Math.max(3, Math.ceil(items.length / columns));
        $('#map-markers').innerHTML = items.map((item, index) => {
            const x = 15 + (index % columns) * 21 + (Math.floor(index / columns) % 2 ? 3 : 0);
            const y = 15 + Math.floor(index / columns) * (65 / Math.max(rows - 1, 1));
            return `<button class="map-marker" type="button" style="left:${x}%;top:${y}%" data-details="${item.id}" aria-label="Local ilustrativo ${index + 1}: ${escape(item.name)}"><span>${index + 1}</span></button>`;
        }).join('');
        $('#map-count').textContent = `${items.length} ${items.length === 1 ? 'local ilustrado' : 'locais ilustrados'}`;
        $('#map-legend').innerHTML = items.map(item => `<li><button type="button" data-details="${item.id}">${escape(item.name)}</button></li>`).join('');
    }

    function syncControls() {
        if ($('#spot-search').value !== state.query) $('#spot-search').value = state.query;
        for (const id of ['#spot-zone', '#filter-location']) {
            if ($(id).value !== state.location) $(id).value = state.location;
        }
        $('#open-now').checked = state.open;
        $('#spot-sort').value = state.sort;
        $$('[name="category"]').forEach(input => { input.checked = state.categories.has(input.value); });
        $$('[data-category]').forEach(button => {
            const active = button.dataset.category === 'todos' ? !state.categories.size : state.categories.has(button.dataset.category);
            button.setAttribute('aria-pressed', String(active));
            button.classList.toggle('active', active);
        });
        $$('[data-price]').forEach(button => button.setAttribute('aria-pressed', String(state.price === Number(button.dataset.price))));
        $$('[data-rating]').forEach(button => button.setAttribute('aria-pressed', String(state.rating === Number(button.dataset.rating))));
        $$('[data-quick]').forEach(button => {
            const active = { open: state.open, nearby: state.sort === 'distance', top: state.sort === 'rating' }[button.dataset.quick];
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function render({ resetLimit = true } = {}) {
        if (resetLimit) state.limit = 6;
        filtered = data.selectSpots(data.spots, state);
        const visible = filtered.slice(0, state.limit);
        $('#spots-grid').innerHTML = visible.map(item => card(item)).join('');
        $('#results-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'estabelecimento encontrado' : 'estabelecimentos encontrados'}`;
        $('#spots-empty').hidden = filtered.length > 0;
        $('#results-shown').textContent = filtered.length ? `A mostrar ${visible.length} de ${filtered.length}` : '';
        $('#load-more').hidden = visible.length >= filtered.length;
        const summary = [];
        if (state.query) summary.push(`Pesquisa: ${state.query}`);
        if (state.location) summary.push(`Zona: ${state.location}`);
        if (state.categories.size) summary.push(Array.from(state.categories, data.categoryLabel).join(', '));
        if (state.open) summary.push('Aberto agora');
        if (state.price != null) summary.push(`Preço: ${'$'.repeat(state.price)}`);
        if (state.rating != null) summary.push(`Avaliação: ${number(state.rating)}+`);
        if (state.sort === 'distance') summary.push('Distâncias demonstrativas');
        $('#active-summary').textContent = summary.join(' · ');
        $('#active-filters').hidden = !summary.length;
        syncControls();
        renderMap(visible);
    }

    function reset() {
        Object.assign(state, { query: '', location: '', categories: new Set(), open: false, price: null, rating: null, sort: 'relevance' });
        render();
    }

    function showDialog(dialog) {
        if (dialog.open) return;
        dialog.showModal();
        document.body.classList.add('has-modal');
    }

    function openDetails(id) {
        const item = findSpot(id);
        if (!item) return;
        const facts = [
            ['Categoria', data.categoryLabel(item.category)], ['Zona', item.zone],
            ['Horário', item.open == null ? null : item.open ? 'Aberto (exemplo)' : 'Fechado (exemplo)'],
            ['Avaliação', item.rating == null ? null : `${number(item.rating)} / 5 (exemplo)`],
            ['Distância', item.distance == null ? null : `${number(item.distance)} km (exemplo)`],
            ['Preço', item.price == null ? null : '$'.repeat(item.price)], ['Modalidade', item.mode]
        ];
        $('#detail-content').innerHTML = `<img class="detail-image ${!item.photo && item.imageFit === 'contain' ? 'image-contain' : ''}" src="${photo(item)}" alt="Imagem ilustrativa de ${escape(data.categoryLabel(item.category).toLowerCase())}" width="640" height="360"><div class="detail-body"><h2 id="detail-title" tabindex="-1">${escape(item.name)}</h2>${item.description ? `<p>${escape(item.description)}</p>` : ''}<dl class="detail-facts">${facts.map(([title, value]) => `<div><dt>${title}</dt><dd>${escape(value ?? 'Não informado')}</dd></div>`).join('')}</dl><p class="prototype-note">Este é um exemplo do protótipo. Imagem ilustrativa; avaliações, horários e distâncias não foram verificados. Confirme os dados com o estabelecimento antes de sair.</p></div>`;
        showDialog(detailsDialog);
        $('#detail-title').focus();
    }

    $('#explore-form').addEventListener('submit', event => {
        event.preventDefault();
        state.query = $('#spot-search').value;
        state.location = $('#spot-zone').value;
        render();
        $('#resultados').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    $('#filters-form').addEventListener('submit', event => event.preventDefault());
    $('#spot-search').addEventListener('input', event => { state.query = event.target.value; render(); });
    for (const id of ['#spot-zone', '#filter-location']) {
        $(id).addEventListener('input', event => { state.location = event.target.value; render(); });
    }
    $('#open-now').addEventListener('change', event => { state.open = event.target.checked; render(); });
    $('#spot-sort').addEventListener('change', event => { state.sort = event.target.value; render(); });
    $$('[name="category"]').forEach(input => input.addEventListener('change', () => {
        input.checked ? state.categories.add(input.value) : state.categories.delete(input.value);
        render();
    }));
    $$('[data-category]').forEach(button => button.addEventListener('click', () => {
        const category = button.dataset.category;
        if (category === 'todos') state.categories.clear();
        else if (state.categories.has(category)) state.categories.delete(category);
        else state.categories.add(category);
        render();
    }));
    $$('[data-price]').forEach(button => button.addEventListener('click', () => {
        const value = Number(button.dataset.price);
        state.price = state.price === value ? null : value;
        render();
    }));
    $$('[data-rating]').forEach(button => button.addEventListener('click', () => {
        const value = Number(button.dataset.rating);
        state.rating = state.rating === value ? null : value;
        render();
    }));
    $$('[data-quick]').forEach(button => button.addEventListener('click', () => {
        const type = button.dataset.quick;
        if (type === 'open') state.open = !state.open;
        else {
            const sort = type === 'nearby' ? 'distance' : 'rating';
            state.sort = state.sort === sort ? 'relevance' : sort;
        }
        render();
    }));
    $$('[data-clear]').forEach(button => button.addEventListener('click', reset));
    $('#load-more').addEventListener('click', () => {
        const previous = Math.min(state.limit, filtered.length);
        state.limit += 6;
        render({ resetLimit: false });
        const firstAdded = $('#spots-grid').children[previous]?.querySelector('[data-details]');
        firstAdded?.focus({ preventScroll: true });
    });
    $$('[data-view-all]').forEach(button => button.addEventListener('click', () => {
        reset();
        $('#resultados').scrollIntoView({ block: 'start' });
        $('#spot-sort').focus({ preventScroll: true });
    }));
    document.addEventListener('click', event => {
        const button = event.target.closest('[data-details]');
        if (button) openDetails(button.dataset.details);
    });
    $$('[data-set-category]').forEach(button => button.addEventListener('click', () => {
        reset();
        state.categories.add(button.dataset.setCategory);
        render();
        $('#resultados').scrollIntoView({ block: 'start' });
    }));

    $('#open-filters').addEventListener('click', () => {
        $('#mobile-filter-host').append($('#filters-form'));
        showDialog(filterDialog);
    });
    filterDialog.addEventListener('close', () => $('#desktop-filter-host').append($('#filters-form')));
    $$('[data-open-map]').forEach(button => button.addEventListener('click', () => {
        $('#expanded-map-host').append($('#map-panel'));
        $('#map-legend').hidden = false;
        showDialog(mapDialog);
    }));
    mapDialog.addEventListener('close', () => {
        $('#desktop-map-host').append($('#map-panel'));
        $('#map-legend').hidden = true;
    });
    $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
    $$('dialog').forEach(dialog => {
        dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
        dialog.addEventListener('close', () => { if (!$('dialog[open]')) document.body.classList.remove('has-modal'); });
    });
    matchMedia('(min-width: 1200px)').addEventListener('change', event => {
        if (event.matches && filterDialog.open) filterDialog.close();
    });

    // As fileiras usam apenas estabelecimentos já presentes no catálogo.
    const popularIds = [...new Set([...data.popular, ...data.selectSpots(data.spots, { sort: 'rating' }).map(item => item.id)])].slice(0, 8);
    const suggestionIds = [...new Set([...data.suggestions, ...data.spots.filter(item => !popularIds.includes(item.id)).map(item => item.id)])].slice(0, 8);
    $('#popular-grid').innerHTML = popularIds.map(id => card(findSpot(id), 'popular')).join('');
    $('#suggestions-grid').innerHTML = suggestionIds.map(id => card(findSpot(id), 'suggestion')).join('');
    $$('.spot-row').forEach(row => {
        const controls = $$(`[data-scroll-row="${row.id}"]`);
        const updateControls = () => {
            const end = Math.max(0, row.scrollWidth - row.clientWidth);
            controls.forEach(button => {
                button.disabled = Number(button.dataset.direction) < 0 ? row.scrollLeft <= 1 : row.scrollLeft >= end - 1;
            });
        };
        controls.forEach(button => button.addEventListener('click', () => {
            row.scrollBy({ left: row.clientWidth * .85 * Number(button.dataset.direction), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }));
        row.addEventListener('scroll', updateControls, { passive: true });
        if ('ResizeObserver' in window) new ResizeObserver(updateControls).observe(row);
        else window.addEventListener('resize', updateControls);
        updateControls();
    });
    const params = new URLSearchParams(window.location.search);
    state.query = params.get('q') || '';
    state.location = params.get('zona') || '';
    const aliases = { restaurantes: 'restaurante', cafes: 'cafe', fastfood: 'fast-food', padarias: 'padaria' };
    (params.get('categoria') || '').split(',').filter(Boolean).forEach(category => {
        const normalized = aliases[category] || category;
        if (data.categories.some(item => item.id === normalized)) state.categories.add(normalized);
    });
    render();

    // Carrossel independente do carrossel já existente na página inicial.
    const slides = $$('.weekly-slide');
    const stage = $('#weekly-stage');
    const toggle = $('#weekly-toggle');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let currentSlide = 0;
    let userPaused = reducedMotion.matches;
    let hovering = false;
    let timer;
    function updateAutoplay() {
        clearInterval(timer);
        const paused = userPaused || reducedMotion.matches || hovering || stage.contains(document.activeElement) || document.hidden || Boolean($('dialog[open]'));
        stage.classList.toggle('is-paused', paused);
        toggle.hidden = reducedMotion.matches;
        toggle.textContent = userPaused ? 'Continuar anúncios' : 'Pausar anúncios';
        toggle.setAttribute('aria-pressed', String(userPaused));
        if (!paused) timer = setInterval(() => goToSlide(currentSlide + 1, false), 4500);
    }
    function goToSlide(index, manual = true) {
        currentSlide = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => { slide.hidden = i !== currentSlide; });
        $$('[data-slide]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.slide) === currentSlide)));
        if (manual) {
            userPaused = true;
            $('#weekly-announcement').textContent = `Anúncio ${currentSlide + 1} de ${slides.length}: ${data.slides[currentSlide].title}`;
        }
        const progress = $('.weekly-progress span');
        progress.replaceWith(progress.cloneNode(true));
        updateAutoplay();
    }
    $$('[data-slide]').forEach(button => button.addEventListener('click', () => goToSlide(Number(button.dataset.slide))));
    $('#weekly-prev').addEventListener('click', () => goToSlide(currentSlide - 1));
    $('#weekly-next').addEventListener('click', () => goToSlide(currentSlide + 1));
    toggle.addEventListener('click', () => {
        userPaused = !userPaused;
        updateAutoplay();
    });
    stage.addEventListener('mouseenter', () => { hovering = true; updateAutoplay(); });
    stage.addEventListener('mouseleave', () => { hovering = false; updateAutoplay(); });
    stage.addEventListener('focusin', updateAutoplay);
    stage.addEventListener('focusout', () => setTimeout(updateAutoplay, 0));
    stage.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        goToSlide(currentSlide + (event.key === 'ArrowRight' ? 1 : -1));
        if (document.activeElement.closest('[hidden]')) $('#weekly-next').focus();
    });
    document.addEventListener('visibilitychange', updateAutoplay);
    reducedMotion.addEventListener('change', () => { userPaused = reducedMotion.matches; updateAutoplay(); });
    // Suspender também quando uma janela de detalhes ou mapa está aberta.
    const modalObserver = new MutationObserver(updateAutoplay);
    $$('dialog').forEach(dialog => modalObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
    updateAutoplay();
});
