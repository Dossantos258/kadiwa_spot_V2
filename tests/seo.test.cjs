const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const generator = import(pathToFileURL(path.join(root, 'scripts/atualizar-seo.mjs')).href);
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));

async function fixture(t) {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'kadiwa-seo-'));
    t.after(() => fs.rm(temp, { recursive: true, force: true }));
    const config = JSON.parse(await fs.readFile(path.join(root, 'seo.config.json'), 'utf8'));
    for (const page of config.pages) {
        await fs.mkdir(path.dirname(path.join(temp, page.file)), { recursive: true });
        await fs.copyFile(path.join(root, page.file), path.join(temp, page.file));
    }
    return { temp, config };
}

test('cada página tem título e descrição próprios, marca consistente e dados JSON válidos', async () => {
    const config = JSON.parse(await fs.readFile(path.join(root, 'seo.config.json'), 'utf8'));
    const titles = new Set(), descriptions = new Set();
    for (const page of config.pages) {
        const html = await fs.readFile(path.join(root, page.file), 'utf8');
        assert.equal([...html.matchAll(/<title>/g)].length, 1);
        assert.equal([...html.matchAll(/<meta name="description"/g)].length, 1);
        assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
        assert.ok(html.includes('lang="pt-MZ"'));
        assert.ok(html.includes(page.title));
        assert.ok(html.includes('property="og:site_name" content="Kadiwa Spot"'));
        titles.add(page.title); descriptions.add(page.description);
        structuredData(html);
    }
    assert.equal(titles.size, config.pages.length);
    assert.equal(descriptions.size, config.pages.length);
});

test('metadados sem domínio não inventam canonical, WebSite.url nem sitemap', async t => {
    const { generateSeo } = await generator;
    const { temp, config } = await fixture(t);
    await generateSeo({ root: temp, config: { ...config, siteUrl: null } });
    const html = await fs.readFile(path.join(temp, 'index.html'), 'utf8');
    assert.ok(!html.includes('rel="canonical"'));
    assert.ok(!structuredData(html).some(doc => doc['@graph'].some(node => node['@type'] === 'WebSite')));
    await assert.rejects(fs.access(path.join(temp, 'sitemap.xml')));
    assert.ok(!(await fs.readFile(path.join(temp, 'robots.txt'), 'utf8')).includes('Sitemap:'));
});

test('domínio configurado liga canonical, sitemap, identidade, partilha e breadcrumbs', async t => {
    const { generateSeo } = await generator;
    const { temp, config } = await fixture(t);
    // Domínio usado apenas nesta pasta temporária de teste; não publicado.
    const base = 'https://www.kadiwaspot.mz/';
    await generateSeo({ root: temp, config, siteUrl: base });
    for (const page of config.pages) {
        const html = await fs.readFile(path.join(temp, page.file), 'utf8');
        const url = new URL(page.path, base).href;
        assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
        assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
        assert.ok(html.includes(`${base}media/imagens/logo.png`));
        const nodes = structuredData(html).flatMap(doc => doc['@graph']);
        if (page.path === '') {
            const site = nodes.find(node => node['@type'] === 'WebSite');
            assert.equal(site.name, 'Kadiwa Spot');
            assert.equal(site.alternateName, 'KadiwaSpot');
            assert.equal(site.url, base);
        } else {
            const breadcrumb = nodes.find(node => node['@type'] === 'BreadcrumbList');
            assert.equal(breadcrumb.itemListElement[0].item, base);
            assert.equal(breadcrumb.itemListElement[1].item, url);
        }
        assert.ok(!nodes.some(node => ['Restaurant', 'LocalBusiness', 'Offer', 'AggregateRating'].includes(node['@type'])));
        assert.ok(!JSON.stringify(nodes).includes('840000000'));
        assert.ok(!JSON.stringify(nodes).includes('priceRange'));
        const first = html;
        await generateSeo({ root: temp, config, siteUrl: base });
        assert.equal(await fs.readFile(path.join(temp, page.file), 'utf8'), first);
    }
    const xml = await fs.readFile(path.join(temp, 'sitemap.xml'), 'utf8');
    assert.equal([...xml.matchAll(/<loc>/g)].length, config.pages.length);
    for (const page of config.pages) assert.ok(xml.includes(`<loc>${new URL(page.path, base).href}</loc>`));
    assert.ok((await fs.readFile(path.join(temp, 'robots.txt'), 'utf8')).includes(`Sitemap: ${base}sitemap.xml`));
});

test('rejeita domínios de exemplo, credenciais e endereços inseguros', async () => {
    const { normalizeSiteUrl } = await generator;
    for (const value of ['http://kadiwaspot.mz', 'https://example.com', 'https://user:password@kadiwaspot.mz', 'https://kadiwaspot.mz/?preview=1', 'https://kadiwaspot.mz/#inicio', 'https://localhost']) {
        assert.throws(() => normalizeSiteUrl(value));
    }
    assert.equal(normalizeSiteUrl('https://kadiwaspot.mz'), 'https://kadiwaspot.mz/');
});

test('GEO apresenta marca e localidades em texto visível e ligações de pesquisa', async () => {
    const home = await fs.readFile(path.join(root, 'index.html'), 'utf8');
    const about = await fs.readFile(path.join(root, 'pages/sobre.html'), 'utf8');
    assert.ok(home.includes('O que é o Kadiwa Spot (KadiwaSpot)?'));
    assert.ok(home.includes('href="pages/explorar.html?zona=Maputo"'));
    assert.ok(home.includes('href="pages/explorar.html?zona=Matola"'));
    assert.ok(about.includes('<strong>KadiwaSpot</strong>'));
    assert.ok(!home.includes('Já cobrimos Matola, Beira'));
});
