const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/explorar-dados.js'), 'utf8'), context);
const { spots, selectSpots, normalize } = context.window.KadiwaExploreData;
const select = changes => Array.from(selectSpots(spots, { query: '', location: '', categories: [], open: false, price: null, rating: null, sort: 'relevance', ...changes }));

test('preserva o catálogo anterior e os exemplos do wireframe, sem alterar o original', () => {
    assert.equal(spots.length, 21);
    assert.equal(new Set(spots.map(s => s.id)).size, 21);
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
    assert.deepEqual(select({ price: 2, rating: 4, open: true }).map(s => s.id), ['polana-cafe']);
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
    for (const [sort, key, descending] of [['distance', 'distance', false], ['price', 'price', false], ['rating', 'rating', true]]) {
        const result = select({ sort });
        const known = result.filter(s => s[key] != null);
        assert.deepEqual(result.slice(0, known.length), known);
        for (let i = 1; i < known.length; i++) assert.ok(descending ? known[i-1][key] >= known[i][key] : known[i-1][key] <= known[i][key]);
    }
    assert.equal(spots[0].id, 'polana-cafe');
});
test('sem correspondências não inventa resultados; limpar restaura todos', () => {
    assert.equal(select({ query: 'xxxx-inexistente' }).length, 0);
    assert.equal(select({ categories: ['pizza'], location: 'Matola' }).length, 0);
    assert.equal(select({}).length, 21);
});
