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
npx playwright install chromium firefox webkit
npm run test:e2e
npm start
```

O E2E inicia uma instância de produção na porta 3100 e a encerra ao concluir. Verifica landing, Sobre e 404 em larguras de 320 a 2560 px, incluindo limites de breakpoints e orientação horizontal. Também exercita teclado, toque, menu, acordeões, mostrador, âncoras, histórico, cursor e trocas de rota. Firefox e WebKit têm verificações próprias de layout, navegação e animação.

Na hero do Sobre, a suíte compara pixels e geometria da máscara, confere a reintegração da bola, a pausa persistente e a suspensão fora da tela. Outros cenários cobrem movimento reduzido, cores forçadas, ausência de JavaScript, falhas de fontes e imagens, exceção de rota com recuperação, assets públicos e destinos de links internos. O axe verifica acessibilidade nos cenários móvel, desktop, 404 e erro de rota. Capturas ficam em `output/playwright/`. Defina `PLAYWRIGHT_PORT` se 3100 estiver ocupada.

Não há lógica de negócio isolável, API ou banco neste site institucional; testes de unidade e integração não se aplicam a este escopo. O backend da plataforma descrito na metodologia não foi implementado aqui.

Resultados desta passagem em [docs/auditoria-site.md](docs/auditoria-site.md). A inspeção por viewport emulado não substitui teste em aparelho físico.

Histórico de 02/10/2026: build, TypeScript, ESLint e E2E aprovados em Node.js 24. Landing, Sobre e 404 foram verificadas em 320, 390, 768, 1280 e 1440 px; axe não encontrou violações WCAG nos cenários móvel e desktop. Lighthouse 12.8.2 em produção local, com simulação móvel e Chrome 153: desempenho **95** no Sobre; acessibilidade, boas práticas e SEO **100**, LCP de **2,9 s** e CLS **0**. São medições de laboratório, não de tráfego real.

Após o refinamento da homepage, nas mesmas condições de laboratório: desempenho **94**, acessibilidade, boas práticas e SEO **100**; LCP de **3,0 s**, TBT de **40 ms** e CLS **0**. Relatório em `output/playwright/home-lighthouse.json`.

## Conteúdo e decisões

1. `src/app/`: páginas e componentes exclusivos de rota em `_components/`. A home mantém seus exemplos e sua coreografia; o Sobre mantém a escultura. `error.tsx` oferece tentativa de recuperação e retorno ao início.
2. `src/components/`: identidade, cabeçalho, rodapé, ícones e motion compartilhado. Lenis e ScrollTrigger usam o mesmo ticker; teclado, foco e toque mantêm os comportamentos verificados. O cursor preserva seleção e cópia nativas e desativa sua decoração com movimento reduzido, cores forçadas ou toque.
3. `src/content/process.ts` concentra as cinco etapas e calcula o total do mostrador a partir dos orçamentos documentados. `src/lib/brand/` concentra o contorno original e sua deformação; `src/lib/site.ts` define a origem pública.
4. `src/styles/` concentra estilos compartilhados. `src/app/home.css` e `src/app/sobre/about.css` organizam as composições por rota, com imports globais no layout para manter a ordem. Os exemplos usam CSS Module. As folhas finais somam 42.900 bytes, contra 45.788 antes da passagem.
5. `public/` contém apenas assets usados pelo site e licenças das fontes locais. `assets/` guarda os originais fornecidos. `docs/references/` guarda os protótipos, sem importá-los pela aplicação.

A escultura do Sobre mantém um ciclo de 11,45 segundos e usa a mesma posição e os mesmos raios para o SVG e a máscara da cópia visual da tipografia. A equipe pode ajustar essa animação no componente da rota sem alterar o cursor ou os estilos da home. A pausa manual persiste durante rolagem e redimensionamento; a cena suspende o trabalho fora da tela ou com a aba oculta. O teste confirma que o protótipo original mantém o mesmo hash.

O site apresenta a proposta e o estado documental do projeto. Não oferece cadastro, autenticação, geração de software ou integrações com Gemini/Stitch. Os links de navegação funcionam; o acesso ao piloto depende da implementação futura da plataforma. Não há analytics nem coleta de dados.

O domínio público padrão é `https://kernel.muski.workers.dev`. Metadados, `/robots.txt`, `/sitemap.xml` e `/llms.txt` compartilham essa origem, configurável por `SITE_URL` antes do build. O sitemap inclui somente `/` e `/sobre`; o robots permite rastreamento e aponta para o sitemap. O `llms.txt` resume o projeto e seus limites documentados, seguindo a [proposta llms.txt](https://llmstxt.org/).

Para servir a versão de produção em um ambiente Node.js 24, execute `npm run build` e `npm start`. A publicação em outra hospedagem depende do suporte e da configuração de Next.js desse ambiente. O site não exige variáveis secretas.
