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

O teste E2E inicia sua própria instância de produção na porta 3100 e a encerra ao concluir. Verifica as duas rotas, navegação, menu móvel, teclado, perguntas frequentes, o planejamento interativo, reflow, movimento reduzido, leitura sem JavaScript, 404 e acessibilidade com axe. Capturas ficam em `output/playwright/`. Defina `PLAYWRIGHT_PORT` se 3100 estiver ocupada.

Não há lógica de negócio isolável, API ou banco neste site institucional; testes de unidade e integração não se aplicam a este escopo. O backend da plataforma descrito na metodologia não foi implementado aqui.

Validação em 30/09/2026: build, TypeScript, ESLint e E2E aprovados em Node.js 24. As duas rotas foram verificadas em 320, 390, 768, 1280 e 1440 px; axe não encontrou violações nos cenários móvel e desktop. Lighthouse na landing de produção local, com simulação móvel e Chrome 153: desempenho **96**, acessibilidade **100**, boas práticas **100**, SEO **100**, LCP **2,7 s**, CLS **0**. Esses números são medições de laboratório, não de tráfego real.

## Conteúdo e decisões

- `src/app/page.tsx`: landing; `src/app/sobre/page.tsx`: Sobre.
- `src/components/process.ts`: cinco etapas e orçamentos documentados (5, 4, 5, 12 e 4 minutos).
- `src/app/globals.css`: sistema visual, composição responsiva e animações nativas. O mostrador é uma visualização do planejamento, sem cronômetro ou simulação de operação real.
- `public/brand/`: cópias dos assets originais; o enquadramento dos logotipos usa CSS. `public/fonts/`: fontes locais com suas licenças OFL. Não há requisições a provedores de fontes em execução.
- `temp/` permanece apenas como referência histórica. Nenhum protótipo ou animação de logo é importado pela aplicação.

O site apresenta a proposta e o estado documental do projeto. Não oferece cadastro, autenticação, geração de software ou integrações com Gemini/Stitch. Os links de navegação funcionam; o acesso ao piloto depende da implementação futura da plataforma. Não há analytics nem coleta de dados.

Para publicação, defina `SITE_URL` com a origem pública (por exemplo, `https://seu-dominio.com`) antes do build, para gerar URLs corretas da imagem de compartilhamento. Execute `npm run build` e `npm start` em um serviço Node.js 24, ou use hospedagem com suporte ao Next.js. Configure domínio e HTTPS no ambiente de hospedagem. O site não exige variáveis secretas.
