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

O teste E2E inicia sua própria instância de produção na porta 3100 e a encerra ao concluir. Verifica landing, Sobre e 404 em cinco larguras, navegação, menu móvel, teclado, perguntas frequentes, planejamento interativo e acessibilidade com axe. Também confere a animação SVG: pausa persistente, repetição automática, continuidade vetorial e visual na junção do loop, suspensão fora da tela, retorno ao desenho original e troca de preferência de movimento durante a execução. Conteúdo sem JavaScript, falha de fontes e preservação do protótipo têm verificações próprias. Capturas ficam em `output/playwright/`. Defina `PLAYWRIGHT_PORT` se 3100 estiver ocupada.

Não há lógica de negócio isolável, API ou banco neste site institucional; testes de unidade e integração não se aplicam a este escopo. O backend da plataforma descrito na metodologia não foi implementado aqui.

Validação em 01/10/2026: build, TypeScript, ESLint e E2E aprovados em Node.js 24. Landing, Sobre e 404 foram verificadas em 320, 390, 768, 1280 e 1440 px; axe não encontrou violações WCAG nos cenários móvel e desktop. Lighthouse 12.8.2 em produção local, com simulação móvel e Chrome 153: desempenho **94** na landing e **96** no Sobre após o ajuste do loop; acessibilidade, boas práticas e SEO **100** em ambas. LCP de **3,0 s** e **2,8 s**, respectivamente; CLS **0**. Esses números são medições de laboratório, não de tráfego real; viewport emulado não substitui teste em dispositivo físico.

## Conteúdo e decisões

- `src/app/page.tsx`: landing; `src/app/sobre/page.tsx`: Sobre.
- `src/components/process.ts`: cinco etapas e orçamentos documentados (5, 4, 5, 12 e 4 minutos).
- `src/app/globals.css` e `src/app/motion.css`: composição responsiva, controles e animações nativas. GSAP em `landing-motion.tsx` coordena a entrada das ilustrações e da pasta de entrega durante a rolagem. O mostrador representa o planejamento, sem cronômetro ou simulação de operação real.
- `public/brand/`: cópias dos assets originais; o enquadramento dos logotipos usa CSS. `public/fonts/`: fontes locais com suas licenças OFL. Não há requisições a provedores de fontes em execução.
- `kernel-sculpture.tsx` reconstrói o conceito de desprendimento e órbita de `temp/prototype.html` usando o SVG original da marca, interpolação do contorno e GSAP. O loop de 8,8 segundos combina antecipação, separação, órbita, absorção e repouso; a base só se recompõe com o retorno do fragmento. A pausa manual permanece ao sair e voltar à seção. Fora da tela ou com a aba oculta, a animação é suspensa; movimento reduzido ou ausência de JavaScript preservam o símbolo estático. O protótipo permanece intacto e não é importado pela aplicação.

O site apresenta a proposta e o estado documental do projeto. Não oferece cadastro, autenticação, geração de software ou integrações com Gemini/Stitch. Os links de navegação funcionam; o acesso ao piloto depende da implementação futura da plataforma. Não há analytics nem coleta de dados.

O domínio público padrão é `https://kernel.muski.workers.dev`. Metadados, `/robots.txt`, `/sitemap.xml` e `/llms.txt` compartilham essa origem, configurável por `SITE_URL` antes do build. O sitemap inclui somente `/` e `/sobre`; o robots permite rastreamento e aponta para o sitemap. O `llms.txt` resume o projeto e seus limites documentados, seguindo a [proposta llms.txt](https://llmstxt.org/).

Para servir a versão de produção em um ambiente Node.js 24, execute `npm run build` e `npm start`. A publicação em outra hospedagem depende do suporte e da configuração de Next.js desse ambiente. O site não exige variáveis secretas.
