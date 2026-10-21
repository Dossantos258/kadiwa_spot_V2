import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const start = '<!-- KADIWA:SEO:START -->';
const end = '<!-- KADIWA:SEO:END -->';
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function normalizeSiteUrl(value) {
    if (value == null || value === '') return null;
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
        throw new Error('Use um endereço público HTTPS sem credenciais, parâmetros ou fragmentos.');
    }
    if (url.hostname === 'localhost' || url.hostname.endsWith('.local') || url.hostname.endsWith('.test') || url.hostname.endsWith('.example') || ['example.com', 'example.org', 'example.net'].includes(url.hostname)) {
        throw new Error('Configure o domínio real; endereços locais ou de exemplo não devem ser publicados.');
    }
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
    return url.href;
}

export function metadata(config, page, base) {
    const localPrefix = path.posix.relative(path.posix.dirname(page.file), '.') || '.';
    const logo = base ? new URL(config.logo, base).href : `${localPrefix}/${config.logo}`;
    const tags = [start,
        `<title>${escape(page.title)}</title>`,
        `<meta name="description" content="${escape(page.description)}">`,
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        `<meta property="og:site_name" content="${escape(config.name)}">`,
        `<meta property="og:locale" content="${escape(config.locale)}">`,
        '<meta property="og:type" content="website">',
        `<meta property="og:title" content="${escape(page.title)}">`,
        `<meta property="og:description" content="${escape(page.description)}">`,
        `<meta property="og:image" content="${escape(logo)}">`,
        '<meta property="og:image:width" content="1536">',
        '<meta property="og:image:height" content="1024">',
        `<meta property="og:image:alt" content="Logótipo ${escape(config.name)}">`,
        '<meta name="twitter:card" content="summary">',
        `<meta name="twitter:title" content="${escape(page.title)}">`,
        `<meta name="twitter:description" content="${escape(page.description)}">`,
        `<meta name="twitter:image" content="${escape(logo)}">`,
        `<meta name="twitter:image:alt" content="Logótipo ${escape(config.name)}">`,
        `<link rel="icon" type="image/png" sizes="48x48" href="${escape(`${localPrefix}/${config.favicon || config.logo}`)}">`
    ];
    const organization = {
        '@type': 'Organization', name: config.name, alternateName: config.alternateName,
        description: config.description,
        areaServed: [{ '@type': 'Country', name: 'Moçambique' }, { '@type': 'City', name: 'Maputo' }, { '@type': 'City', name: 'Matola' }]
    };
    let graph = page.path === '' ? [organization] : [];
    if (base) {
        const url = new URL(page.path, base).href;
        const orgId = `${base}#organization`;
        const siteId = `${base}#website`;
        tags.push(`<link rel="canonical" href="${escape(url)}">`, `<meta property="og:url" content="${escape(url)}">`);
        const site = { '@type': 'WebSite', '@id': siteId, url: base, name: config.name, alternateName: config.alternateName, inLanguage: config.language, publisher: { '@id': orgId } };
        Object.assign(organization, { '@id': orgId, url: base, logo: { '@type': 'ImageObject', url: logo, contentUrl: logo, width: 1536, height: 1024 } });
        const webPage = {
            '@type': page.type, '@id': `${url}#webpage`, url, name: page.title,
            description: page.description, inLanguage: config.language,
            isPartOf: { '@id': siteId }, about: { '@id': orgId }, publisher: { '@id': orgId }
        };
        graph = [webPage];
        if (page.path === '') graph.unshift(organization, site);
        else {
            const breadcrumbId = `${url}#breadcrumb`;
            webPage.breadcrumb = { '@id': breadcrumbId };
            graph.push({ '@type': 'BreadcrumbList', '@id': breadcrumbId, itemListElement: [
                { '@type': 'ListItem', position: 1, name: config.name, item: base },
                { '@type': 'ListItem', position: 2, name: page.label, item: url }
            ] });
        }
    }
    if (graph.length) {
        // Não incluir preços, avaliações, contactos ou coordenadas de demonstração.
        const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
        tags.push(`<script type="application/ld+json">\n${json}\n</script>`);
    }
    tags.push(end);
    return tags.join('\n    ');
}

export async function generateSeo({ root = projectRoot, config, siteUrl } = {}) {
    config ||= JSON.parse(await fs.readFile(path.join(root, 'seo.config.json'), 'utf8'));
    const base = normalizeSiteUrl(siteUrl ?? config.siteUrl);
    const writes = [];
    for (const page of config.pages) {
        const file = path.join(root, page.file);
        let html = await fs.readFile(file, 'utf8');
        const block = metadata(config, page, base);
        const previousStart = html.indexOf(start), previousEnd = html.indexOf(end);
        if ((previousStart < 0) !== (previousEnd < 0)) throw new Error(`Bloco SEO incompleto em ${page.file}.`);
        if (previousStart >= 0) html = html.slice(0, previousStart) + block + html.slice(previousEnd + end.length);
        else {
            html = html.replace(/\s*<title>[\s\S]*?<\/title>/i, '').replace(/\s*<meta\s+name=["']description["'][^>]*>/i, '');
            html = html.replace('</head>', `    ${block}\n</head>`);
        }
        writes.push([file, html]);
    }
    const exclusions = ['User-agent: *', 'Allow: /', 'Disallow: /fastFood-master/', 'Allow: /fastFood-master/public/', 'Disallow: /tests/', 'Disallow: /scripts/', 'Disallow: /docs/'];
    if (base) {
        exclusions.push('', `Sitemap: ${new URL('sitemap.xml', base).href}`);
        const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + config.pages.map(page => `  <url><loc>${escape(new URL(page.path, base).href)}</loc></url>`).join('\n') + '\n</urlset>\n';
        writes.push([path.join(root, 'sitemap.xml'), sitemap]);
    } else {
        // Um sitemap anterior não deve continuar a apontar para outro domínio.
        await fs.rm(path.join(root, 'sitemap.xml'), { force: true });
    }
    writes.push([path.join(root, 'robots.txt'), exclusions.join('\n') + '\n']);
    for (const [file, content] of writes) await fs.writeFile(file, content);
    return { pages: config.pages.length, base };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const result = await generateSeo({ siteUrl: process.env.SITE_URL });
        console.log(`SEO atualizado em ${result.pages} páginas.`);
        console.log(result.base ? `Canonical e sitemap: ${result.base}` : 'Falta configurar siteUrl em seo.config.json: canonical e sitemap aguardam o domínio definitivo.');
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
