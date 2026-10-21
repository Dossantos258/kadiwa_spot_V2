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
        imageFit: 'cover', ...info
    });
    const spots = [
        spot('polana-cafe', 'Polana Café', 'cafe', 'cafe2.jpeg', { rating: 4.5, distance: 0.3, open: true, price: 2, mode: 'Local + Delivery' }),
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
        const result = items.filter(item => {
            const searchable = normalize([item.name, item.description, item.zone, item.tags, categoryLabel(item.category)].join(' '));
            return (!query || query.split(/\s+/).every(word => searchable.includes(word)))
                && (!location || normalize([item.zone, item.name].join(' ')).includes(location))
                && (!selected.length || selected.some(id => matchesCategory(item, id)))
                && (!filters.open || item.open === true)
                && (filters.price == null || item.price === Number(filters.price))
                && (filters.rating == null || (item.rating != null && item.rating >= Number(filters.rating)));
        });
        const sortKey = { distance: 'distance', rating: 'rating', price: 'price' }[filters.sort];
        if (sortKey) result.sort((a, b) => {
            if (a[sortKey] == null) return b[sortKey] == null ? 0 : 1;
            if (b[sortKey] == null) return -1;
            return filters.sort === 'rating' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey];
        });
        return result;
    };
    return { categories, spots, slides, normalize, categoryLabel, selectSpots,
        popular: ['costa-sol', 'zambi', 'continental'],
        suggestions: ['frango-baia', 'pao-quente', 'expresso-maputo', 'xipamanine'] };
})();
