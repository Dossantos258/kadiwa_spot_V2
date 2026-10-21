const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/localizacao.js'), 'utf8');
function setup(geolocation, secure = true) {
    const storage = new Map();
    const context = { window: { isSecureContext: secure }, navigator: { geolocation },
        sessionStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } };
    vm.runInNewContext(source, context);
    return { api: context.window.KadiwaLocation, storage };
}
test('utiliza as coordenadas recebidas e reutiliza pedidos simultâneos', async () => {
    let finish, options, calls = 0;
    const { api } = setup({ getCurrentPosition(success, error, config) { finish = success; options = config; calls++; } });
    const first = api.request();
    const second = api.request();
    assert.equal(calls, 1);
    finish({ coords: { latitude: -25.96, longitude: 32.46, accuracy: 20 } });
    const result = await first;
    assert.equal(await second, result);
    assert.deepEqual(Array.from(result.coordinates), [-25.96, 32.46]);
    assert.equal(result.accuracy, 20);
    assert.equal(options.enableHighAccuracy, true);
    assert.equal(options.timeout, 12000);
    assert.deepEqual(Array.from(api.cached().coordinates), [-25.96, 32.46]);
});
test('recusa, indisponibilidade e timeout não fabricam uma localização', async () => {
    for (const code of [1, 2, 3]) {
        const { api } = setup({ getCurrentPosition(success, fail) { fail({ code }); } });
        await assert.rejects(api.request(), e => e.code === code);
        assert.equal(api.cached(), null);
        assert.ok(api.errorMessage({ code }).includes('zona'));
    }
});
test('verifica contexto seguro e disponibilidade antes de pedir localização', async () => {
    const { api } = setup(undefined);
    await assert.rejects(api.request(), e => e.code === 'unsupported');
    const unsafe = setup({ getCurrentPosition() { throw Error('Não deve ser chamado'); } }, false).api;
    await assert.rejects(unsafe.request(), e => e.code === 'insecure');
});
test('uma recusa elimina uma localização anterior da sessão', async () => {
    const { api, storage } = setup({ getCurrentPosition(success, fail) { fail({ code: 1 }); } });
    storage.set('kadiwa.location.v1', JSON.stringify({ coordinates: [-25.96, 32.46], timestamp: Date.now() }));
    assert.ok(api.cached());
    await assert.rejects(api.request(), e => e.code === 1);
    assert.equal(api.cached(), null);
});
test('cache expirado, coordenadas inválidas e erros de armazenamento são ignorados', async () => {
    const { api, storage } = setup({ getCurrentPosition(success) { success({ coords: { latitude: 100, longitude: 0 } }); } });
    storage.set('kadiwa.location.v1', JSON.stringify({ coordinates: [-25, 32], timestamp: Date.now() - 360000 }));
    assert.equal(api.cached(), null);
    storage.set('kadiwa.location.v1', '{invalid-json');
    assert.equal(api.cached(), null);
    await assert.rejects(api.request(), e => e.code === 2);
    assert.equal(api.validCoordinates([0, 0]), true);
    assert.equal(api.validCoordinates(['0', 0]), false);
});
