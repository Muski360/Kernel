# Auditoria e refinamento do site KERNEL

Passagem de 03/10/2026 com a awwwards-skill como critério visual e ponytail como critério de simplicidade. Escopo: site institucional, rotas `/`, `/sobre`, 404 e recuperação de exceções de rota. A metodologia continua em versão documental 1.2 candidata; o site não comprova a operação do piloto.

## Decisões visuais

1. **Preservar a abertura.** A tipografia, o verde da marca e o mostrador das cinco etapas já comunicavam a proposta. O isotipo do Sobre mantém o desprendimento, a inversão local da tipografia e a reintegração. As capturas anteriores e posteriores confirmam a continuidade dessa direção.
2. **Substituir a repetição nos exemplos.** Em 768 px, a grade anterior comprimia as três interfaces e reduzia alguns textos ilustrativos a 6–7 px. A nova composição apresenta uma aplicação por linha: formulário escuro, consulta sobre papel e agenda sobre verde. No mobile, cada explicação precede sua interface. Os exemplos continuam identificados como dados fictícios.
3. **Simplificar o motion dos exemplos.** Cada interface entra com deslocamento de 28 px e duração de 0,8 segundo. A remoção do recorte evita esconder parte da demonstração durante a entrada. A animação da pasta de entrega permanece vinculada à rolagem.
4. **Refinar o menu e a recuperação.** O menu fecha com Escape, clique fora, saída de foco e passagem para desktop. A implementação usa o estado do evento de breakpoint para tratar trocas rápidas de largura. Uma exceção de rota apresenta mensagem em português, tentativa de recuperação e retorno ao início com recarga do documento.
5. **Preservar o ritmo das demais seções.** Origem, princípios, piloto e equipe já oferecem hierarquia e leitura coerentes. A passagem consolidou seus estilos sem introduzir novos efeitos ou molduras.

## Arquitetura

Os componentes exclusivos da home ficam em `src/app/_components/`; a escultura fica junto da rota em `src/app/sobre/_components/`. Cabeçalho, rodapé, marca e cursor continuam compartilhados. `home-motion.tsx` concentra a coreografia da home; `src/components/motion/site-motion.tsx` concentra rolagem, âncoras e sincronização do ticker.

`src/content/process.ts` reúne os dados utilizados pelo mostrador e pela lista de etapas. O mostrador calcula sua escala a partir do total desses dados. `src/lib/brand/` reúne a geometria da marca, usada pelo cursor, pela escultura e pela 404. A animação da escultura conserva sua medição e seu ciclo no mesmo componente: extrair hooks ou classes nessa passagem fragmentaria um comportamento que precisa compartilhar coordenadas e teardown.

A passagem consolidou declarações sobrepostas de `globals.css` e `motion.css` e removeu os estilos antigos dos exemplos. Estilos compartilhados ficam em `src/styles/`; composições da home e do Sobre têm folhas próprias; as demonstrações usam CSS Module. O layout concentra os imports globais. Essa ordem removeu o aviso observado de CSS de outra rota pré-carregado sem uso imediato. O CSS final soma **42.900 bytes**, ante **45.788 bytes**: redução de **6,3%** no código fonte, incluindo o novo CSS Module e a tela de recuperação.

A passagem removeu `public/brand/symbol.svg`, que nenhum componente consumia. Os originais em `assets/` continuam como material de referência; a aplicação não os serve. Os protótipos saíram de `temp/` para `docs/references/`, mantendo seu conteúdo. GSAP, Lenis e as dependências de verificação têm usos ativos; nenhuma dependência foi adicionada ao projeto.

Os metadados agora definem canonical e URL de compartilhamento por rota. O Sobre também recebe título e descrição próprios para compartilhamento. Os links inexistentes em `docs/README.md` agora apontam para arquivos desta árvore.

## Verificação

1. **Build, lint, TypeScript e diff:** aprovados em Node.js 24.11.1, com Next.js 16.3.8. A leitura dos imports e dos seletores não encontrou referências aos caminhos antigos nem classes globais sem consumidor. Os links locais da documentação também foram conferidos.
2. **Rotas e layouts:** `/`, `/sobre` e 404 passaram em 12 larguras entre 320 e 2560 px, incluindo 680/681 px e orientação horizontal. A suíte conferiu os destinos de links e âncoras, todos os assets públicos de imagem e fonte, robots, sitemap, llms e imagem social.
3. **Interações e motion:** mostrador, acordeões, menu, teclado, foco, toque, histórico, cursor, seleção e cópia de texto passaram. A escultura manteve a máscara alinhada, o volume da bola, a reintegração, a pausa e a suspensão fora da tela. Trocas repetidas de rota não duplicaram o cursor.
4. **Falhas e acessibilidade:** conteúdo e navegação passaram sem JavaScript, fontes ou imagens. Uma falha de enhancement provocou a tela real de erro de rota; o teste removeu a falha e confirmou a recuperação pelo botão. O axe não encontrou violações nos cenários móvel, desktop, 404 e erro de rota testados.
5. **Motores e console:** Chromium 153, Firefox 155 e WebKit 26.6 passaram. Firefox e WebKit exercitaram as rotas em 390, 768 e 1440 px, incluindo navegação, mostrador, acordeões, animação e pausa. O console normal ficou sem erros ou avisos nas inspeções de produção. A requisição da página inexistente retorna o 404 esperado; o cenário de falha injeta uma exceção intencional.

Lighthouse 12.8.2, produção local, Chrome 153 headless e simulação móvel, em 03/10/2026:

| Rota | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 92 | 100 | 100 | 100 | 3,3 s | 50 ms | 0 |
| `/sobre` | 93 | 100 | 100 | 100 | 3,2 s | 70 ms | 0 |

Relatórios em `output/playwright/audit-home-lighthouse.json` e `output/playwright/audit-about-lighthouse.json`. Essas medições de laboratório variam entre execuções; a passagem não demonstrou ganho de LCP em relação ao registro anterior. A redução de CSS é uma medição do código fonte, não uma promessa de tempo de carregamento. A verificação não incluiu aparelhos físicos ou Safari comercial; WebKit é o motor usado pela suíte.

As capturas locais ficam em `output/playwright/`. A comparação visual usa as imagens `baseline-*`, `final-*`, `examples-*` e os estados de animação e recuperação gerados pela suíte.

## Inspeção crítica final

O trecho mais fraco da versão anterior era a sequência de exemplos: a moldura repetida e a densidade dificultavam distinguir as funções em larguras intermediárias. A revisão final inspecionou essa sequência em mobile e tablet e confirmou a leitura dos campos, registros e horários. A abertura permanece mais expressiva que o restante, por concentrar a proposta e o planejamento; as seções seguintes mantêm uma leitura estável.

Os exemplos representam o escopo descrito na metodologia. Quando a equipe produzir telas reais do piloto, poderá substituir as demonstrações por essas evidências. Até lá, acrescentar imagens de um produto em operação criaria uma afirmação sem suporte.
