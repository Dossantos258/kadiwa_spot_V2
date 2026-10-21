# SEO e descoberta do Kadiwa Spot

O nome principal é **Kadiwa Spot** e a variante de pesquisa é **KadiwaSpot**. O conteúdo identifica o projecto como guia gastronómico de Moçambique, com foco em restaurantes, cafés, padarias, fast-foods e takeaways em Maputo e Matola.

O endereço configurado é **https://kadiwaspot.merciodossantos.me/**. O sitemap preparado para publicação está em **https://kadiwaspot.merciodossantos.me/sitemap.xml**.

## Configuração e publicação

1. Definir `siteUrl` em `seo.config.json` com o endereço público HTTPS definitivo, incluindo um eventual subdirectório de publicação.
2. Executar `node scripts/atualizar-seo.mjs`. O comando atualiza os metadados HTML das cinco páginas, os dados estruturados, os links canónicos, `robots.txt` e `sitemap.xml`. Não depende de JavaScript no navegador para inserir metadados.
3. Publicar os ficheiros do site. A página inicial deve abrir no endereço configurado e os URLs do sitemap devem responder com HTTP 200. Não publicar o checkout Git nem ficheiros de desenvolvimento ou credenciais.
4. Verificar a propriedade no Google Search Console e no Bing Webmaster Tools; submeter o sitemap e pedir inspeção da página inicial. As verificações exigem acesso ao domínio e às contas do proprietário.

Sem `siteUrl`, o comando prepara os títulos, descrições, pré-visualizações e a identificação básica da organização. Não inventa domínio, não cria links canónicos e não publica um sitemap com URLs de exemplo. Os URLs absolutos de partilha e os dados `WebSite` são gerados ao configurar o endereço.

Uma alteração de títulos ou de descrições deve ser feita em `seo.config.json` e seguida do mesmo comando. Os parâmetros de pesquisa de Explorar apontam para a página canónica de Explorar; não criamos dezenas de páginas duplicadas por filtro.

## Conteúdo e GEO

- Apresentar a marca e o propósito em texto HTML visível, com nomes de localidades e ligações internas úteis.
- Os dados estruturados descrevem o site e a organização. O Kadiwa Spot é um guia; não é apresentado como um restaurante físico.
- Não incluir preços, avaliações, moradas, contactos ou coordenadas demonstrativas em `Restaurant`, `LocalBusiness`, `Offer` ou `AggregateRating`.
- Não acrescentar moradas comerciais, perfis sociais, prémios ou referências externas que ainda não estejam confirmados.
- Os menus e preços do protótipo continuam identificados como demonstrativos. Substituir esses exemplos por dados confirmados quando os estabelecimentos os fornecerem.
- Não há promessa de posição no Google nem de citação por ferramentas de IA. A indexação e a classificação dependem dos motores de pesquisa e da publicação acessível do site.

## Referências oficiais

- [Nome do site e alternateName](https://developers.google.com/search/docs/appearance/site-names)
- [Dados estruturados da organização](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [URLs canónicos](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Optimização para recursos de IA da Pesquisa Google](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Sitemaps no Bing](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed)
