# KERNEL · Website

Site institucional em português, com as rotas `/` e `/sobre`. Next.js App Router, React, TypeScript estrito e CSS. A fonte normativa do conteúdo é [docs/Metodologia.md](docs/Metodologia.md); a apresentação em `assets/` fornece contexto de marca e a autoria da equipe.

## Executar

Use **Node.js 24 LTS** (versão em `.nvmrc`).

```sh
npm ci
npm run dev
```

Abra `http://localhost:3000`.

## Validar e servir a versão de produção

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
npm start
```

O teste E2E inicia sua própria instância de produção na porta 3100 e a encerra ao concluir. Verifica landing, Sobre e 404 em cinco larguras, navegação, menu móvel, teclado, perguntas frequentes, planejamento interativo e acessibilidade com axe. Na hero do Sobre, compara pixels para confirmar que a tipografia fica branca somente na interseção com a bolinha e mede o alinhamento da máscara durante o percurso e após redimensionamentos. Também confere a reintegração da mesma bola, reação da base, pausa persistente, suspensão fora da tela e alternativas para movimento reduzido e cores forçadas. Conteúdo sem JavaScript, falha de fontes e preservação do protótipo têm verificações próprias. Capturas ficam em `output/playwright/`. Defina `PLAYWRIGHT_PORT` se 3100 estiver ocupada.

Não há lógica de negócio isolável, API ou banco neste site institucional; testes de unidade e integração não se aplicam a este escopo. O backend da plataforma descrito na metodologia não foi implementado aqui.

Validação em 02/10/2026: build, TypeScript, ESLint e E2E aprovados em Node.js 24. Landing, Sobre e 404 foram verificadas em 320, 390, 768, 1280 e 1440 px; axe não encontrou violações WCAG nos cenários móvel e desktop. Lighthouse 12.8.2 em produção local, com simulação móvel e Chrome 153: desempenho **95** no Sobre após a interação com a tipografia; acessibilidade, boas práticas e SEO **100**, LCP de **2,9 s** e CLS **0**. Esses números são medições de laboratório, não de tráfego real; viewport emulado não substitui teste em dispositivo físico.

## Conteúdo e decisões

- `src/app/page.tsx`: landing; `src/app/sobre/page.tsx`: Sobre.
- `src/components/process.ts`: cinco etapas e orçamentos documentados (5, 4, 5, 12 e 4 minutos).
- `src/app/globals.css` e `src/app/motion.css`: composição responsiva, controles e animações nativas. GSAP em `landing-motion.tsx` coordena a entrada das ilustrações e da pasta de entrega durante a rolagem. O mostrador representa o planejamento, sem cronômetro ou simulação de operação real.
- `public/brand/`: cópias dos assets originais; o enquadramento dos logotipos usa CSS. `public/fonts/`: fontes locais com suas licenças OFL. Não há requisições a provedores de fontes em execução.
- `kernel-sculpture.tsx` faz a bolinha percorrer a hero do Sobre em um ciclo de 11,45 segundos, seguindo os limites reais do título e do texto de apoio. A mesma posição e os mesmos raios controlam o SVG e o recorte de uma cópia visual branca da tipografia, sem duplicar o título acessível. A trajetória se adapta ao layout e ao carregamento das fontes; a base oscila suavemente e a bola se reintegra antes de desaparecer. A pausa manual persiste ao rolar ou redimensionar. Fora da hero ou com a aba oculta, a animação é suspensa; movimento reduzido, cores forçadas ou ausência de JavaScript preservam o símbolo e os textos estáticos. O protótipo permanece intacto e não é importado pela aplicação.

O site apresenta a proposta e o estado documental do projeto. Não oferece cadastro, autenticação, geração de software ou integrações com Gemini/Stitch. Os links de navegação funcionam; o acesso ao piloto depende da implementação futura da plataforma. Não há analytics nem coleta de dados.

O domínio público padrão é `https://kernel.muski.workers.dev`. Metadados, `/robots.txt`, `/sitemap.xml` e `/llms.txt` compartilham essa origem, configurável por `SITE_URL` antes do build. O sitemap inclui somente `/` e `/sobre`; o robots permite rastreamento e aponta para o sitemap. O `llms.txt` resume o projeto e seus limites documentados, seguindo a [proposta llms.txt](https://llmstxt.org/).

Para servir a versão de produção em um ambiente Node.js 24, execute `npm run build` e `npm start`. A publicação em outra hospedagem depende do suporte e da configuração de Next.js desse ambiente. O site não exige variáveis secretas.
