'use strict';

// Catálogo do protótipo. Avaliações, distâncias e preços do wireframe são exemplos,
// não informações verificadas sobre estabelecimentos reais. null = não informado.
window.KadiwaExploreData = (() => {
    const categories = [
        { id: 'fast-food', label: 'Fast-food', icon: 'shopping-bag' },
        { id: 'restaurante', label: 'Restaurantes', icon: 'restaurant' },
        { id: 'cafe', label: 'Cafés', icon: 'restaurant' },
        { id: 'padaria', label: 'Padarias', icon: 'shopping-bag' },
        { id: 'pizza', label: 'Pizza', icon: 'target' },
        { id: 'delivery', label: 'Delivery', icon: 'route' },
        { id: 'takeaway', label: 'Takeaway', icon: 'shopping-bag' }
    ];
    const spot = (id, name, category, image, info = {}) => ({
        id, name, category, image, zone: null, open: null, rating: null,
        distance: null, price: null, mode: null, reviews: null, description: '',
        imageFit: 'cover', coordinates: null, address: null, phone: null, locationType: null,
        priceMin: null, priceMax: null, priceIsDemo: false, ...info
    });
    const spots = [
        spot('polana-cafe', 'Polana Café', 'cafe', 'cafe2.jpeg', { rating: 4.5, distance: 0.3, open: true, price: 2, mode: 'Local + Delivery' }),
        // Pontos de demonstração na Matola, escolhidos a pedido do utilizador.
        // Não correspondem a endereços comerciais verificados.
        spot('one-bite', 'One Bite', 'fast-food', 'spot.jpeg', { zone: 'Matola', coordinates: [-25.9622, 32.4589], locationType: 'demo', tag: 'Novo no Kadiwa', description: 'Um novo spot para descobrir. Imagem fornecida; localização demonstrativa na Matola.' }),
        spot('flame-stack', 'Flame Stack Burger', 'fast-food', 'spot2.jpeg', { zone: 'Matola', coordinates: [-25.9537, 32.4642], locationType: 'demo', tag: 'Novo no Kadiwa', description: 'Hambúrgueres em destaque. Imagem fornecida; localização demonstrativa na Matola.' }),
        spot('caixinha', 'Caixinha', 'takeaway', 'spot1.jpeg', { zone: 'Maputo', address: 'Av. Karl Marx 1836, Maputo, Moçambique', phone: '+258842885187', imageFit: 'contain', description: 'Mutton biryani em destaque. Endereço e contacto transcritos do cartaz fornecido; disponibilidade por confirmar.' }),
        spot('maputo-grill', 'Maputo Grill', 'restaurante', 'GRILL.jpeg', { rating: 4.2, distance: 0.6, open: true, price: 3, mode: 'Local' }),
        spot('nandos', "Nando’s Sommerschield", 'fast-food', 'images (4).jpeg', { rating: 4, distance: 0.8, open: false, price: 2, mode: 'Delivery', imageFit: 'contain', photo: 'GRILL.jpeg' }),
        spot('pastelaria-central', 'Pastelaria Central', 'padaria', 'cafe2.jpeg', { rating: 4.7, distance: 1.1, open: true, price: 1, mode: 'Local' }),
        spot('pizza-inn', 'Pizza Inn Baixa', 'pizza', 'images (2).jpeg', { rating: 3.9, distance: 1.4, open: true, price: 2, mode: 'Local + Delivery' }),
        spot('bom-dia', 'Bom Dia Bakery', 'padaria', 'cafe2.jpeg', { rating: 4.3, distance: 1.8, open: true, price: 1, mode: 'Local' }),
        // Exemplos já presentes na versão anterior de Explorar.
        spot('kadiwa-grill', 'Kadiwa Grill', 'restaurante', 'spot1.jpeg', { zone: 'Polana', open: true, description: 'Grelhados e pratos moçambicanos.', imageFit: 'contain', photo: 'GRILL.jpeg' }),
        spot('cafe-acacia', 'Café Acácia', 'cafe', 'airport-waiting-room.jpg', { zone: 'Sommerschield', open: true, description: 'Café, pequeno-almoço e pastelaria.' }),
        spot('bistro-central', 'Bistro Central', 'cafe', 'images (2).jpeg', { zone: 'Maputo Central', open: false, description: 'Café e refeições ligeiras no centro da cidade.' }),
        spot('ame-gourmet', 'Âme Gourmet', 'fast-food', 'images (6).jpeg', { zone: 'Matola', open: true, description: 'Hambúrgueres e opções rápidas.', imageFit: 'contain', photo: 'pub.jpeg' }),
        spot('camarao-sol', 'Camarão do Sol', 'restaurante', 'images (4).jpeg', { zone: 'Costa do Sol', open: true, description: 'Mariscos e pratos para partilhar.', imageFit: 'contain', photo: 'airport-waiting-room.jpg' }),
        spot('west-takeaway', 'West Takeaway', 'takeaway', 'images (3).jpeg', { zone: 'Maputo Central', open: false, description: 'Hambúrgueres e refeições para levar.', imageFit: 'contain', photo: 'GRILL.jpeg' }),
        spot('sabores-terra', 'Sabores da Terra', 'restaurante', 'images (5).jpeg', { zone: 'Matola', open: true, description: 'Comida moçambicana e pratos do dia.', imageFit: 'contain', photo: 'GRILL.jpeg' }),
        spot('padaria-nova', 'Padaria Nova', 'padaria', 'images (7).jpeg', { zone: 'Matola', open: true, description: 'Pão, pastelaria e café para começar o dia.', tags: 'cafe' }),
        spot('costa-sol', 'Costa do Sol', 'restaurante', 'GRILL.jpeg', { rating: 4.8, reviews: 312, tag: 'Favorito da cidade' }),
        spot('zambi', 'Zambi Restaurant', 'restaurante', 'airport-waiting-room.jpg', { rating: 4.6, reviews: 198, tag: 'Melhor avaliado' }),
        spot('continental', 'Café Continental', 'cafe', 'cafe2.jpeg', { rating: 4.5, reviews: 245, tag: 'Mais visitado' }),
        spot('frango-baia', 'Frango Grelhado Baía', 'fast-food', 'GRILL.jpeg', { rating: 4.1, distance: 2.1 }),
        spot('pao-quente', 'Casa do Pão Quente', 'padaria', 'cafe2.jpeg', { rating: 4.4, distance: 2.4 }),
        spot('expresso-maputo', 'Expresso Maputo', 'cafe', 'cafe2.jpeg', { rating: 4.3, distance: 2.7 }),
        spot('xipamanine', 'Xipamanine Grill', 'restaurante', 'GRILL.jpeg', { rating: 4, distance: 3.1 })
    ];
    // Os menus enviados pertencem a marcas distintas: usá-los como exemplos visuais,
    // sem atribuir os seus preços, contactos ou pratos ao estabelecimento apresentado.
    const menuExamples = {
        drinks: { file: 'menu2.jpg', title: 'Bebidas — exemplo de menu' },
        dishes: { file: 'menu3.jpeg', title: 'Pratos e sopas — exemplo de menu' },
        burgers: { file: 'menu4.jpeg', title: 'Hambúrgueres e refeições — exemplo de menu' },
        daily: { file: 'menu5.jpeg', title: 'Prato do dia — exemplo de menu' },
        specials: { file: 'menu6.jpeg', title: 'Selecção de pratos — exemplo de menu' }
    };
    spots.forEach(item => {
        item.gallery = [{ file: item.photo || item.image, title: 'Imagem de apresentação' }];
        if (item.id === 'one-bite' || item.id === 'flame-stack') {
            item.menus = [menuExamples.burgers, menuExamples.specials];
        } else if (['cafe', 'padaria'].includes(item.category)) {
            item.menus = [menuExamples.drinks, menuExamples.daily];
        } else {
            item.menus = [menuExamples.dishes, menuExamples.burgers, menuExamples.daily];
        }
    });
    // Valores de exemplo autorizados para apresentar intervalos em MZN.
    // Não são preços recolhidos dos estabelecimentos nem dos menus ilustrativos.
    const demoPrices = {
        'polana-cafe': [150, 450], 'one-bite': [250, 550], 'flame-stack': [300, 750],
        'caixinha': [250, null], 'maputo-grill': [500, 1500], 'nandos': [350, 850],
        'pastelaria-central': [80, 300], 'pizza-inn': [400, 1200], 'bom-dia': [100, null],
        'costa-sol': [650, 1800], 'zambi': [800, 2200], 'continental': [150, 500]
    };
    spots.forEach(item => {
        if (demoPrices[item.id]) {
            [item.priceMin, item.priceMax] = demoPrices[item.id];
            item.priceIsDemo = true;
        }
    });
    const priceRanges = [
        { id: 1, label: 'Até 300 MZN', min: null, max: 300 },
        { id: 2, label: '300–600 MZN', min: 300, max: 600 },
        { id: 3, label: '600–1.000 MZN', min: 600, max: 1000 },
        { id: 4, label: 'Mais de 1.000 MZN', min: 1000, max: null }
    ];
    const minimumPrice = item => Number.isFinite(item.priceMin) && item.priceMin >= 0 ? item.priceMin : null;
    const money = value => new Intl.NumberFormat('pt-MZ', { maximumFractionDigits: 2 }).format(value);
    const priceLabel = item => {
        const min = minimumPrice(item);
        if (min == null) return 'Preço não informado';
        return Number.isFinite(item.priceMax) && item.priceMax > min
            ? `${money(min)}–${money(item.priceMax)} MZN` : `Desde ${money(min)} MZN`;
    };
    const coordinatesValid = point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
        && Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180;
    const distanceKm = (origin, destination) => {
        if (!coordinatesValid(origin) || !coordinatesValid(destination)) return null;
        const rad = degrees => degrees * Math.PI / 180;
        const deltaLat = rad(destination[0] - origin[0]);
        const deltaLon = rad(destination[1] - origin[1]);
        const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(rad(origin[0])) * Math.cos(rad(destination[0])) * Math.sin(deltaLon / 2) ** 2;
        return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
    };
    const mapLinks = (item, origin = null) => {
        const hasLocation = Boolean(item.coordinates || item.address);
        const destination = item.coordinates ? item.coordinates.join(',') : item.address || [item.name, item.zone, 'Moçambique'].filter(Boolean).join(', ');
        const search = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
        const directions = hasLocation ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${coordinatesValid(origin) ? `&origin=${encodeURIComponent(origin.join(','))}` : ''}` : null;
        const copyText = `${item.name}${item.zone ? ` — ${item.zone}` : ''}${item.locationType === 'demo' ? ' (localização demonstrativa)' : ''}\n${item.address || (item.coordinates ? item.coordinates.join(', ') : 'Endereço por confirmar')}\n${search}`;
        return { hasLocation, search, directions, copyText };
    };
    const slides = [
        { type: 'Destaque da semana', title: 'Costa do Sol', description: 'Uma mesa, bons sabores e tempo para descobrir o seu próximo spot.', meta: 'Restaurante · Destaque demonstrativo', image: 'GRILL.jpeg', cta: 'Ver estabelecimento', spot: 'costa-sol' },
        { type: 'Evento', title: 'Sabores de Moçambique', description: 'Um espaço para divulgar encontros gastronómicos, novidades e experiências na cidade.', meta: 'Exemplo de evento · Maputo', image: 'chef.jpg', cta: 'Explorar participantes', href: '#resultados' },
        { type: 'Anúncio', title: 'O seu próximo café está aqui', description: 'Descubra cafés e pastelarias para uma pausa, uma conversa ou um pequeno-almoço.', meta: 'Exemplo de anúncio · Cafés e padarias', image: 'cafe2.jpeg', cta: 'Explorar cafés', category: 'cafe' },
        { type: 'Destaque', title: 'Zambi Restaurant', description: 'Conheça os espaços em destaque e compare as informações antes de escolher.', meta: 'Restaurante · Destaque demonstrativo', image: 'airport-waiting-room.jpg', cta: 'Ver estabelecimento', spot: 'zambi' },
        { type: 'Publicidade', title: 'Anuncie no Kadiwa Spot', description: 'Dê visibilidade ao seu restaurante, café ou takeaway. Conheça os formatos disponíveis para o seu negócio.', meta: 'Para estabelecimentos · Consulte os planos', image: 'outoddor.png', cta: 'Ver planos de anúncio', href: 'negocios.html#precos' }
    ];
    const normalize = value => String(value ?? '').toLocaleLowerCase('pt-MZ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim();
    const categoryLabel = id => categories.find(category => category.id === id)?.label ?? id;
    const matchesCategory = (item, id) => id === 'delivery'
        ? Boolean(item.mode?.includes('Delivery'))
        : item.category === id || item.tags?.split(' ').includes(id);
    // A pesquisa, os filtros e o painel móvel usam a mesma selecção.
    const selectSpots = (items, filters) => {
        const query = normalize(filters.query);
        const location = normalize(filters.location);
        const selected = Array.from(filters.categories || []);
        const range = priceRanges.find(range => range.id === Number(filters.price));
        const result = items.filter(item => {
            const searchable = normalize([item.name, item.description, item.zone, item.tags, categoryLabel(item.category)].join(' '));
            return (!query || query.split(/\s+/).every(word => searchable.includes(word)))
                && (!location || normalize([item.zone, item.name].join(' ')).includes(location))
                && (!selected.length || selected.some(id => matchesCategory(item, id)))
                && (!filters.open || item.open === true)
                && (filters.price == null || (range && minimumPrice(item) != null
                    && (range.min == null || minimumPrice(item) > range.min)
                    && (range.max == null || minimumPrice(item) <= range.max)))
                && (filters.rating == null || (item.rating != null && item.rating >= Number(filters.rating)));
        });
        const valueForSort = item => filters.sort === 'distance' ? distanceKm(filters.origin, item.coordinates)
            : filters.sort === 'price' ? minimumPrice(item) : item.rating;
        if (['distance', 'rating', 'price'].includes(filters.sort)) result.sort((a, b) => {
            const left = valueForSort(a), right = valueForSort(b);
            if (left == null) return right == null ? 0 : 1;
            if (right == null) return -1;
            return filters.sort === 'rating' ? right - left : left - right;
        });
        return result;
    };
    return { categories, spots, slides, normalize, categoryLabel, selectSpots, mapLinks,
        distanceKm, priceRanges, minimumPrice, priceLabel,
        popular: ['costa-sol', 'zambi', 'continental'],
        suggestions: ['frango-baia', 'pao-quente', 'expresso-maputo', 'xipamanine'] };
})();
