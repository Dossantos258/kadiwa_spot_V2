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
    const mediaDialog = $('#media-dialog');
    let mainMap = null;
    let detailMap = null;
    let activeSpot = null;
    let mediaItems = [];
    let mediaIndex = 0;
    const asset = file => `../media/imagens/${encodeURIComponent(file)}`;
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
        const located = items.filter(item => item.coordinates);
        if (!mainMap) mainMap = window.KadiwaMaps.create($('#results-map'), { items, onSelect: item => openDetails(item.id), status: $('#results-map-status') });
        else mainMap.setItems(items);
        $('#map-count').textContent = `${located.length} de ${items.length} locais com ponto no mapa`;
        $('#map-note').textContent = located.some(item => item.locationType === 'demo')
            ? 'Pontos de demonstração na Matola. Os restantes endereços estão por confirmar.'
            : 'Sem coordenadas confirmadas nesta selecção. Mapa de referência de Maputo e Matola.';
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
        detailMap?.destroy();
        detailMap = null;
        activeSpot = item;
        const links = data.mapLinks(item);
        const locationNote = item.locationType === 'demo' ? 'Ponto demonstrativo na Matola, escolhido para este protótipo. Não é um endereço comercial confirmado.'
            : item.address ? 'Endereço transcrito do material fornecido. Confirme com o estabelecimento.'
                : 'Endereço exacto por confirmar. O mapa mostra apenas a região de referência, sem marcador.';
        const facts = [
            ['Categoria', data.categoryLabel(item.category)], ['Zona', item.zone],
            ['Horário', item.open == null ? null : item.open ? 'Aberto (exemplo)' : 'Fechado (exemplo)'],
            ['Avaliação', item.rating == null ? null : `${number(item.rating)} / 5 (exemplo)`],
            ['Distância', item.distance == null ? null : `${number(item.distance)} km (exemplo)`],
            ['Preço', item.price == null ? null : '$'.repeat(item.price)], ['Modalidade', item.mode],
            ['Endereço', item.address], ['Contacto', item.phone]
        ];
        $('#detail-dialog-title').textContent = item.name;
        $('#detail-content').innerHTML = `<div class="spot-detail-layout">
            <div class="spot-detail-main">
                <button class="detail-cover-button" type="button" data-photo-index="0" aria-label="Ampliar imagem de ${escape(item.name)}"><img class="detail-image ${!item.photo && item.imageFit === 'contain' ? 'image-contain' : ''}" src="${photo(item)}" alt="Imagem de apresentação de ${escape(item.name)}" width="760" height="480"><span>Ampliar foto</span></button>
                <div class="detail-body"><p class="detail-category">${escape(data.categoryLabel(item.category))}${item.zone ? ` · ${escape(item.zone)}` : ''}</p><h2 id="detail-title" tabindex="-1">${escape(item.name)}</h2>
                    <div class="detail-summary"><span>${item.rating == null ? 'Sem avaliação' : `★ ${number(item.rating)} / 5 · avaliação demonstrativa`}</span>${item.reviews ? `<span>${item.reviews} avaliações de exemplo</span>` : ''}</div>
                    <div class="detail-tabs" role="tablist" aria-label="Explorar este spot">${[['info', 'Sobre o local'], ['menus', 'Ver menus'], ['photos', 'Imagens'], ['ratings', 'Avaliações']].map(([key, label], index) => `<button id="tab-${key}" type="button" role="tab" data-detail-tab="${key}" aria-controls="panel-${key}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}">${label}</button>`).join('')}</div>
                    <section id="panel-info" role="tabpanel" aria-labelledby="tab-info" tabindex="0"><h3>Sobre o local</h3><p>${escape(item.description || 'Informações adicionais sobre este estabelecimento ainda não disponíveis.')}</p><dl class="detail-facts">${facts.map(([title, value]) => `<div><dt>${title}</dt><dd>${escape(value ?? 'Não informado')}</dd></div>`).join('')}</dl>${item.phone ? `<a class="text-button detail-contact" href="tel:${escape(item.phone)}">Ligar para o estabelecimento</a>` : ''}</section>
                    <section id="panel-menus" role="tabpanel" aria-labelledby="tab-menus" tabindex="0" hidden><h3>Menus em imagens</h3><p class="detail-disclaimer">Exemplos visuais fornecidos para o protótipo. Os pratos, preços e contactos nestas imagens não foram confirmados para este spot.</p><div class="detail-menu-grid">${item.menus.map((menu, index) => `<button class="detail-menu-card" type="button" data-menu-index="${index}"><img src="${asset(menu.file)}" alt="${escape(menu.title)}" loading="lazy" width="350" height="450"><span>${escape(menu.title)}</span><small>Ampliar menu</small></button>`).join('')}</div></section>
                    <section id="panel-photos" role="tabpanel" aria-labelledby="tab-photos" tabindex="0" hidden><h3>Imagens do spot</h3><p>Imagens de apresentação fornecidas para o catálogo.</p><div class="detail-gallery">${item.gallery.map((image, index) => `<button type="button" data-photo-index="${index}" aria-label="Ampliar ${escape(image.title)}"><img src="${asset(image.file)}" alt="${escape(image.title)} de ${escape(item.name)}" loading="lazy" width="500" height="350"></button>`).join('')}</div></section>
                    <section id="panel-ratings" role="tabpanel" aria-labelledby="tab-ratings" tabindex="0" hidden><h3>Avaliações</h3>${item.rating == null ? '<p>Este spot ainda não tem avaliações disponíveis.</p>' : `<p class="detail-rating-value">★ ${number(item.rating)} <span>/ 5</span></p><p>${item.reviews ? `${item.reviews} avaliações demonstrativas.` : 'Classificação demonstrativa do catálogo.'}</p>`}<p>Não há comentários de visitantes publicados neste protótipo.</p></section>
                    <p class="prototype-note">Catálogo de demonstração. Fotografias, menus, horários e avaliações não constituem informação comercial verificada.</p>
                </div>
            </div>
            <aside class="spot-detail-location" aria-label="Localização de ${escape(item.name)}"><h3>Localização</h3><p>${escape(item.address || item.zone || 'Endereço por confirmar')}</p><div class="real-map detail-real-map" id="detail-map" aria-label="Mapa de referência de ${escape(item.name)}"></div><p class="map-load-status" id="detail-map-status" role="status"></p><p class="detail-location-note">${locationNote}</p><div class="detail-location-actions"><a class="btn btn-teal" href="${escape(links.directions || links.search)}" target="_blank" rel="noopener noreferrer">${links.directions ? 'Ver direções' : 'Pesquisar localização'}</a><button class="small-button" type="button" data-copy-location>${links.hasLocation ? 'Copiar localização' : 'Copiar pesquisa no mapa'}</button><a class="text-button" href="${escape(links.search)}" target="_blank" rel="noopener noreferrer">Abrir no Google Maps</a></div><p class="copy-location-status" id="copy-location-status" role="status" aria-live="polite"></p><div id="copy-location-fallback" hidden><label for="location-text">Selecione e copie a localização:</label><textarea id="location-text" readonly></textarea></div></aside>
        </div>`;
        showDialog(detailsDialog);
        detailMap = window.KadiwaMaps.create($('#detail-map'), { items: [item], status: $('#detail-map-status') });
        requestAnimationFrame(() => detailMap?.resize());
        $('#detail-title').focus();
    }

    function selectDetailTab(key, focus = false) {
        $$('[data-detail-tab]').forEach(button => {
            const selected = button.dataset.detailTab === key;
            button.setAttribute('aria-selected', String(selected));
            button.tabIndex = selected ? 0 : -1;
            $(`#panel-${button.dataset.detailTab}`).hidden = !selected;
            if (selected && focus) button.focus();
        });
    }

    function renderMedia() {
        const image = mediaItems[mediaIndex];
        $('#media-title').textContent = image.title;
        $('#media-image').src = asset(image.file);
        $('#media-image').alt = image.title;
        $('#media-original').href = asset(image.file);
        $('#media-count').textContent = `${mediaIndex + 1} / ${mediaItems.length}`;
        $$('[data-media-direction]').forEach(button => { button.hidden = mediaItems.length < 2; });
    }

    function openMedia(items, index) {
        mediaItems = items;
        mediaIndex = index;
        renderMedia();
        showDialog(mediaDialog);
    }

    detailsDialog.addEventListener('click', async event => {
        const tab = event.target.closest('[data-detail-tab]');
        if (tab) selectDetailTab(tab.dataset.detailTab);
        const menu = event.target.closest('[data-menu-index]');
        if (menu) openMedia(activeSpot.menus, Number(menu.dataset.menuIndex));
        const image = event.target.closest('[data-photo-index]');
        if (image) openMedia(activeSpot.gallery, Number(image.dataset.photoIndex));
        if (event.target.closest('[data-copy-location]')) {
            const text = data.mapLinks(activeSpot).copyText;
            try {
                if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
                await navigator.clipboard.writeText(text);
                $('#copy-location-status').textContent = 'Localização copiada.';
            } catch {
                $('#copy-location-fallback').hidden = false;
                $('#location-text').value = text;
                $('#location-text').focus();
                $('#location-text').select();
                $('#copy-location-status').textContent = 'A cópia automática não está disponível. Copie o texto selecionado.';
            }
        }
    });
    detailsDialog.addEventListener('keydown', event => {
        const tab = event.target.closest('[data-detail-tab]');
        if (!tab || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const tabs = $$('[data-detail-tab]');
        const current = tabs.indexOf(tab);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        selectDetailTab(tabs[next].dataset.detailTab, true);
    });
    detailsDialog.addEventListener('close', () => { detailMap?.destroy(); detailMap = null; });
    function stepMedia(direction) {
        mediaIndex = (mediaIndex + direction + mediaItems.length) % mediaItems.length;
        renderMedia();
    }
    $$('[data-media-direction]').forEach(button => button.addEventListener('click', () => stepMedia(Number(button.dataset.mediaDirection))));
    mediaDialog.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        stepMedia(event.key === 'ArrowRight' ? 1 : -1);
    });

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
        requestAnimationFrame(() => mainMap?.resize());
    }));
    mapDialog.addEventListener('close', () => {
        $('#desktop-map-host').append($('#map-panel'));
        $('#map-legend').hidden = true;
        requestAnimationFrame(() => mainMap?.resize());
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
