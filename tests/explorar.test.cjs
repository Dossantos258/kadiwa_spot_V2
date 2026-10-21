const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/explorar-dados.js'), 'utf8'), context);
const { spots, selectSpots, normalize, mapLinks, minimumPrice, priceLabel, distanceKm } = context.window.KadiwaExploreData;
const select = changes => Array.from(selectSpots(spots, { query: '', location: '', categories: [], open: false, price: null, rating: null, sort: 'relevance', ...changes }));

test('preserva o catálogo anterior e os exemplos do wireframe, sem alterar o original', () => {
    assert.equal(spots.length, 24);
    assert.equal(new Set(spots.map(s => s.id)).size, spots.length);
    assert.ok(spots.some(s => s.id === 'kadiwa-grill'));
    assert.ok(spots.some(s => s.id === 'polana-cafe'));
    assert.deepEqual(select({}).map(s => s.id), Array.from(spots, s => s.id));
});
test('pesquisa sem acentos, capitalização e pontuação', () => {
    assert.equal(normalize(' CAFÉ ACÁCIA '), 'cafe acacia');
    assert.deepEqual(select({ query: 'ACACIA' }).map(s => s.id), ['cafe-acacia']);
    assert.deepEqual(select({ query: 'grelhados polana' }).map(s => s.id), ['kadiwa-grill']);
});
test('combina nome, categoria, zona e disponibilidade', () => {
    assert.deepEqual(select({ query: 'cafe', location: 'Sommerschield', categories: ['cafe'], open: true }).map(s => s.id), ['cafe-acacia']);
    assert.equal(select({ query: 'Acácia', open: true, price: 1 }).length, 0);
});
test('preço e avaliação excluem valores desconhecidos', () => {
    assert.deepEqual(select({ price: 2, rating: 4, open: true }).map(s => s.id), ['maputo-grill']);
    assert.ok(select({ rating: 4.5 }).every(s => s.rating >= 4.5));
});
test('selecção de várias categorias usa união e delivery usa a modalidade', () => {
    const categories = select({ categories: ['cafe', 'padaria'] });
    assert.ok(categories.length > select({ categories: ['padaria'] }).length);
    assert.ok(categories.every(s => ['cafe', 'padaria'].includes(s.category)));
    assert.ok(select({ categories: ['delivery'] }).every(s => s.mode.includes('Delivery')));
    assert.ok(select({ categories: ['cafe'] }).some(s => s.id === 'padaria-nova'));
});
test('ordena por distância, preço e avaliação, deixando desconhecidos no fim', () => {
    for (const [sort, key, descending] of [['price', 'priceMin', false], ['rating', 'rating', true]]) {
        const result = select({ sort });
        const known = result.filter(s => s[key] != null);
        assert.deepEqual(result.slice(0, known.length), known);
        for (let i = 1; i < known.length; i++) assert.ok(descending ? known[i-1][key] >= known[i][key] : known[i-1][key] <= known[i][key]);
    }
    assert.equal(spots[0].id, 'polana-cafe');
});

test('intervalos em MZN e mínimos não convertem símbolos de dólar em preços reais', () => {
    assert.equal(priceLabel({ price: 2 }), 'Preço não informado');
    assert.equal(priceLabel({ priceMin: null }), 'Preço não informado');
    assert.equal(priceLabel({ priceMin: -10 }), 'Preço não informado');
    assert.equal(priceLabel({ priceMin: 250, priceMax: 550 }), '250–550 MZN');
    assert.equal(priceLabel({ priceMin: 250, priceMax: null }), 'Desde 250 MZN');
    assert.equal(priceLabel({ priceMin: 0 }), 'Desde 0 MZN');
    assert.ok(spots.filter(s => minimumPrice(s) != null).every(s => s.priceIsDemo));
    assert.ok(select({ price: 1 }).every(s => s.priceMin <= 300));
    assert.ok(select({ price: 2 }).every(s => s.priceMin > 300 && s.priceMin <= 600));
    assert.ok(select({ price: 3 }).every(s => s.priceMin > 600 && s.priceMin <= 1000));
    assert.ok(select({ price: 4 }).every(s => s.priceMin > 1000));
    assert.equal(select({ price: 1 }).some(s => s.priceMin == null), false);
});

test('distância vem das coordenadas do utilizador; desconhecidos não usam distâncias do wireframe', () => {
    const bite = spots.find(s => s.id === 'one-bite');
    const flame = spots.find(s => s.id === 'flame-stack');
    assert.equal(distanceKm(bite.coordinates, bite.coordinates), 0);
    assert.ok(distanceKm([0, 0], [0, 1]) > 111 && distanceKm([0, 0], [0, 1]) < 112);
    assert.equal(distanceKm(null, bite.coordinates), null);
    assert.equal(distanceKm([95, 0], bite.coordinates), null);
    assert.equal(select({ sort: 'distance', origin: bite.coordinates })[0].id, 'one-bite');
    assert.equal(select({ sort: 'distance', origin: flame.coordinates })[0].id, 'flame-stack');
    assert.ok(select({ sort: 'distance', origin: bite.coordinates }).slice(2).every(s => s.coordinates == null));
    assert.deepEqual(select({ sort: 'distance' }).map(s => s.id), Array.from(spots, s => s.id));
    const url = new URL(mapLinks(bite, flame.coordinates).directions);
    assert.equal(url.searchParams.get('origin'), flame.coordinates.join(','));
    assert.equal(url.searchParams.get('destination'), bite.coordinates.join(','));
    assert.ok(!mapLinks(bite, flame.coordinates).copyText.includes(flame.coordinates.join(',')));
});
test('sem correspondências não inventa resultados; limpar restaura todos', () => {
    assert.equal(select({ query: 'xxxx-inexistente' }).length, 0);
    assert.equal(select({ categories: ['pizza'], location: 'Matola' }).length, 0);
    assert.equal(select({}).length, spots.length);
});

test('integra as imagens novas e mantém os pontos da Matola identificados como demonstração', () => {
    for (const id of ['one-bite', 'flame-stack']) {
        const item = spots.find(s => s.id === id);
        assert.equal(item.zone, 'Matola');
        assert.equal(item.locationType, 'demo');
        assert.equal(item.rating, null);
        assert.equal(item.open, null);
        assert.equal(item.address, null);
        assert.ok(item.coordinates.every(Number.isFinite));
        assert.ok(select({ query: item.name, location: 'Matola' }).some(s => s.id === id));
    }
    assert.ok(spots.some(s => s.id === 'caixinha' && s.address.includes('Karl Marx 1836')));
});

test('direções e cópia usam o mesmo ponto; endereços desconhecidos só oferecem pesquisa', () => {
    const item = spots.find(s => s.id === 'one-bite');
    const links = mapLinks(item);
    assert.equal(new URL(links.search).searchParams.get('query'), item.coordinates.join(','));
    assert.equal(new URL(links.directions).searchParams.get('destination'), item.coordinates.join(','));
    assert.equal(new URL(links.directions).searchParams.get('api'), '1');
    assert.ok(links.copyText.includes(links.search));
    assert.ok(links.copyText.includes('demonstrativa'));
    const unknown = mapLinks(spots.find(s => s.id === 'polana-cafe'));
    assert.equal(unknown.hasLocation, false);
    assert.equal(unknown.directions, null);
    assert.equal(mapLinks(spots.find(s => s.id === 'caixinha')).hasLocation, true);
});

test('todas as fotos e menus apontam para ficheiros locais existentes', () => {
    const usedMenus = new Set();
    for (const item of spots) {
        for (const image of [...item.gallery, ...item.menus]) {
            assert.ok(fs.existsSync(path.join(__dirname, '../media/imagens', image.file)), image.file);
        }
        item.menus.forEach(menu => usedMenus.add(menu.file));
    }
    assert.deepEqual([...usedMenus].sort(), ['menu2.jpg', 'menu3.jpeg', 'menu4.jpeg', 'menu5.jpeg', 'menu6.jpeg']);
});
