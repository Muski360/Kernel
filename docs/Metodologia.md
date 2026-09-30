# Metodologia KERNEL — Regras de negócio

**Instituição:** SENAI Americana · Projeto educacional, sem fins lucrativos

**Versão:** 1.2 candidata · **Data:** 30/09/2026

**Responsabilidade documental:** equipe do projeto KERNEL

**Situação:** especificação revisada; implementação e validação do piloto pendentes.

## 1. Objetivo, escopo e termos

O KERNEL parte da proposta de **software em 30 minutos**: um único usuário conduz cada projeto, com prazo de entrega de software validado de 30 minutos corridos desde o início da conversa. Ultrapassar esse prazo registra atraso, mas o trabalho continua até a conclusão; o relógio não encerra o projeto. O processo mantém requisitos rastreáveis, design aprovado e implementação por agentes. Neste documento, **KERNEL** identifica tanto a metodologia quanto a plataforma que a executará. “Fluxo” deixa de ser um nome próprio.

**Como ler os códigos:** `RB-K04` significa **Regra de Negócio do KERNEL nº 04**. O código serve para referenciar a regra em revisões e testes; não representa uma tecnologia ou etapa do processo.

| Sigla | Significado |
| --- | --- |
| RB | Regra de negócio: uma condição que o processo deve respeitar |
| RF | Requisito funcional: algo que a plataforma deve permitir fazer |
| RNF | Requisito não funcional: uma condição de qualidade ou operação |
| DT | Decisão técnica: uma escolha de arquitetura ou ferramenta |

Nos códigos deste documento, `K` identifica o KERNEL e os dois algarismos identificam o item dentro de sua categoria.

**RB-K01 — Escopo da primeira versão.** O piloto atende aplicações de cadastro, consulta e agendamento, com até cinco entidades de negócio, três perfis de usuário e oito telas principais. As telas de autenticação e os estados de erro não consomem esse limite. A aplicação deve funcionar em navegador, com uma organização por projeto e dados sintéticos. Os perfis descritos aqui pertencem ao software gerado; dentro do KERNEL, cada projeto pertence a um único usuário, sem colaboradores.

Ficam fora desta versão pagamentos, dados sensíveis reais, integrações de terceiros na aplicação gerada, aplicações nativas, operação offline, sistemas críticos e publicação automática. As integrações Gemini e Stitch pertencem à plataforma KERNEL e estão incluídas. Pedidos fora desse recorte exigem redução de escopo acordada com o cliente ou encerramento como não atendido.

**RB-K02 — Entrega e evidência.** “Entregar” significa disponibilizar ao titular um pacote reproduzível de código, banco, configuração, testes e instruções, validado em ambiente de demonstração e aceito por ele. O prazo para esse aceite e para o pacote estar pronto para download é de 30 minutos após o início da conversa. Se a conclusão ocorrer depois, a entrega é válida e registrada como atrasada; o tempo de transferência para o dispositivo do usuário não integra a medição. Não significa disponibilizar um serviço de produção. “Definido” neste documento não significa implementado ou validado; somente resultados registrados no piloto autorizam essas classificações.

## 2. Stack e decisões de arquitetura

**DT-K01 — Uma stack para a plataforma e para as aplicações geradas.** O primeiro template utiliza as escolhas abaixo. Alternativas exigem homologação da equipe técnica antes de novas conversas; não se troca a stack durante a execução de um projeto.

| Camada | Decisão | Motivo |
| --- | --- | --- |
| Interface | Next.js com App Router, React, TypeScript estrito e CSS | Organiza páginas, layouts e componentes reutilizáveis na plataforma e nas aplicações geradas |
| Backend | Node.js 24 LTS, Fastify 5, API REST; WebSocket apenas para voz e SSE para progresso | Mantém uma linguagem e separa requisições curtas de tarefas longas |
| Dados e contratos | PostgreSQL 18, driver `pg`, migrations SQL; JSON Schema controlado pela equipe | Permite transações, validação e persistência sem ORM obrigatório |
| Qualidade | `tsc --noEmit`, ESLint, `node:test` para unidade/integração, Playwright para E2E e axe-core como apoio à acessibilidade | Aproveita ferramentas existentes; testes automáticos não substituem revisão humana |
| Execução | Linux, Docker Engine/Compose, Git por workspace e executor em VM separada do backend | Reproduz o ambiente e limita o acesso do código gerado |

As escolhas estão documentadas em [Node.js Releases](https://github.com/nodejs/Release), [Fastify LTS](https://fastify.dev/docs/latest/Reference/LTS/), [Next.js App Router](https://nextjs.org/docs/app/getting-started/installation) e [PostgreSQL Versioning](https://www.postgresql.org/support/versioning/). A equipe fixará versões estáveis e compatíveis de Next.js e React, versões exatas das dependências no lockfile e imagens por digest ao homologar o template. Atualizações não entram no meio de uma execução.

O Next.js responde pela interface e roda como serviço Node.js, com `next build` e `next start`. O Fastify mantém a API, autenticação, regras de negócio e comunicação com os agentes. Um proxy reverso apresenta interface e API sob a mesma origem e encaminha WebSocket/SSE ao Fastify. O Next.js consome essa API, sem duplicar a persistência ou as regras de autorização; lint e testes continuam sendo verificações separadas do build.

O backend é um monólito modular, com um worker separado e fila persistida no PostgreSQL. Não há necessidade inicial de Redis, Kubernetes, banco vetorial ou framework de agentes. O worker executa uma tarefa por vez; a entrevista continua responsiva no processo da API. O template deve fornecer os comandos `build`, `lint`, `typecheck`, `test:unit`, `test:integration` e `test:e2e`; testes TypeScript são compilados antes da execução pelo `node:test`.

**DT-K02 — Modelos.**

| Uso | Modelo e configuração | Responsabilidade |
| --- | --- | --- |
| Entrevista por voz | `gemini-3.8-live`, sem `thinking_level` | Conversar e propor atualizações de descoberta |
| Entrevista textual e requisitos | `gemini-3.8-flash`, thinking `medium` | Descobrir, formalizar e resumir |
| Crítica | `gemini-3.8-flash`, thinking `high`, chamada separada | Identificar inconsistências e lacunas |
| Implementação e correção | `gemini-3.8-flash`, thinking `high` | Propor alterações e usar ferramentas autorizadas |

A escolha substitui o Live 3.1 preview pela opção estável atual. As capacidades e configurações estão nas páginas de [Gemini 3.8 Live](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live) e [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash). O SDK será o oficial `@google/genai`. Gemini continua sendo o único fornecedor de modelos; Stitch será acessado pelo MCP oficial.

O responsável técnico deve testar acesso, formato de resposta, latência e cotas na conta do piloto. Falha de disponibilidade bloqueia a etapa; não há substituição silenciosa de modelo. Cada execução registra modelo, configuração, versão do SDK e revisão do prompt. A mesma família de modelos em papéis diferentes não constitui avaliação independente.

**DT-K03 — Armazenamento.** PostgreSQL guarda projetos com um único `owner_user_id`, revisões JSON, aprovações, jobs e eventos. Um volume privado guarda arquivos grandes por projeto e revisão, com hash SHA-256 e referência no banco. O backend é o único escritor do estado oficial. Agentes propõem operações; não recebem credenciais do banco da plataforma.

## 3. Um usuário por projeto e autoridade

**RB-K04 — Um único titular por projeto.** Cada projeto tem exatamente um usuário humano, identificado por `owner_user_id` obrigatório, imutável e referenciado a uma conta existente no banco. Esse titular é o cliente: conversa com a IA, define o escopo, solicita alterações, aprova requisitos e design, aceita a entrega e pode cancelar. Um usuário pode possuir projetos distintos; cada projeto continua individual.

Não há convite de colaboradores, membros adicionais, coedição, troca de titular ou aprovação por outra conta. O sistema não permite que um segundo usuário consulte ou trabalhe no projeto. O mesmo titular pode retomar sua sessão ou usar outra aba; revisões e idempotência impedem ações conflitantes e jobs duplicados.

| Ator | Responsabilidade | Limite |
| --- | --- | --- |
| Titular do projeto | Único usuário que conduz a criação e toma decisões sobre o produto | Não altera políticas internas nem redefine o prazo original para ocultar atraso |
| Equipe técnica da plataforma | Homologa templates, testes, ferramentas e políticas antes das execuções; mantém a infraestrutura | Não entra como colaboradora, edita o workspace ou aprova projetos de usuários |
| Responsável institucional | Define condições de uso, dados e orçamento da plataforma | Não assume projetos nem decide pelo titular |
| Orquestrador e agentes | Executam tarefas, verificações e transições autorizadas | Não substituem as aprovações do titular |

Os responsáveis técnico e institucional são funções de governança da plataforma, não papéis de usuário dentro de um projeto. A equipe acessa apenas diagnósticos operacionais sem conteúdo do projeto para manter o serviço. Incidentes podem interromper a execução por política de segurança, mas não autorizar outra pessoa a concluir o projeto. A execução normal não depende de revisão manual dessa equipe.

## 4. Fluxo e pontos de decisão

```text
Cadastro e verificação de capacidade, antes do cronômetro
  → Iniciar conversa: cronômetro único de 30 minutos
  → Entrevista por voz ou texto
  → Briefing conferido pelo cliente
  → Requisitos formalizados e criticados
  → Aprovação #1: requisitos + critérios de aceite
  → Design e protótipo navegável
  → Aprovação #2: design associado aos requisitos
  → Implementação
  → QA e correções limitadas
  → Homologação pelo titular
  → Aceite final e pacote disponível (prazo: minuto 30; continuar se houver atraso)
```

**RB-K05 — Aprovações explícitas do titular.** A conferência do briefing verifica o entendimento e autoriza a formalização; não substitui a aprovação #1. O cliente recebe linguagem simples e acesso aos detalhes de cada artefato. Aprovar, solicitar alteração e cancelar são ações distintas. Silêncio, timeout, fala interpretada pela IA e clique em “continuar” não equivalem a aprovação.

A aprovação #1 congela requisitos, regras, perfis, escopo, restrições e critérios de aceite. A aprovação #2 congela telas, navegação, estados e identidade visual vinculados àquela revisão dos requisitos. O aceite final confirma o pacote homologado, constituindo uma terceira decisão humana, sem reabrir automaticamente o escopo. Todas essas decisões integram o prazo de 30 minutos; aguardar resposta não pausa o cronômetro. Depois do prazo, o titular continua podendo aprovar e aceitar a entrega, com registro do atraso.

**RB-K06 — Registro de aprovação.** Cada decisão guarda `project_id`, `actor_id`, tipo, resultado, data UTC, revisão e hash do artefato, além das revisões das dependências. O único papel humano nessa decisão é o titular. O backend verifica `actor_id = owner_user_id`, permissão, revisão atual e estado que permita a decisão na mesma transação. Contas de administração não podem aprovar pelo titular. Uma aba desatualizada recebe conflito e deve apresentar a nova versão antes de aceitar outra decisão.

## 5. Descoberta por voz ou texto

**RF-K01 — Entrevista acessível e retomável.** A interface permite começar por texto, ativar/desativar microfone, acompanhar transcrição, interromper a resposta, encerrar e retomar. O backend faz a ponte autenticada com a Live API; a chave permanente não chega ao navegador. Áudio é transmitido em memória, sem gravação persistente.

A integração de voz usa áudio PCM compatível com a [Live API](https://ai.google.dev/gemini-api/docs/live-api), transcrição de entrada e saída e detecção de interrupção. Ao interromper, a interface descarta o áudio de resposta ainda não reproduzido. A equipe deve medir a latência adicional da ponte no piloto.

**RB-K07 — Tempo e suficiência.** A descoberta inicial, por voz ou texto, tem orçamento de cinco minutos dentro dos trinta minutos totais. O aviso ocorre em 4min30s, reservando os últimos trinta segundos para concluir a fala e conferir o briefing. Esse orçamento orienta o planejamento, sem encerrar a descoberta automaticamente. Se ainda houver dúvida, o titular pode esclarecer por texto ou retomar a voz, contabilizando todo o tempo adicional. Ultrapassar o orçamento da etapa ou o prazo de entrega não autoriza inventar respostas nem aprovar descoberta incompleta.

A descoberta só segue para requisitos quando o cliente conferir o briefing e estiverem definidos:

1. Problema, objetivo e resultado esperado.
2. Perfis, permissões e dados principais.
3. Fluxo principal, exceções e regras de negócio.
4. Limites, prioridades e funcionalidades excluídas.
5. Pendências atribuídas ao titular ou à etapa automática correspondente; nenhuma pendência bloqueadora.

**RB-K08 — Origem da informação.** Toda afirmação tem ID, autor, trecho/turno de origem e uma classificação:

| Classificação | Significado | Tratamento |
| --- | --- | --- |
| `CONFIRMED` | Informação expressa ou confirmada pelo cliente | Pode fundamentar requisitos |
| `INFERRED` | Conclusão deduzida de informações existentes | Exige confirmação; preserva as origens |
| `ASSUMPTION` | Hipótese proposta para preencher uma lacuna | Exige confirmação ou exclusão |
| `OPEN_QUESTION` | Pergunta sem resposta suficiente | Exige resposta ou adiamento justificado |

“Funcionário” não pode virar “gerente” sem confirmação. Uma escolha técnica vem das políticas e do template homologados da plataforma e é registrada como decisão técnica, sem ser atribuída ao cliente.

**RB-K09 — Persistência durante a conversa.** O Live propõe patches por function calling; o backend valida estrutura, autoria e versão antes de aplicar. Não se presume suporte a structured outputs no Live. Ao fechar a sessão, o backend aguarda operações pendentes, reconcilia transcrição e estado e sinaliza trechos ausentes. Uma fala cortada ou transcrição ambígua gera pergunta, não requisito confirmado.

Queda de conexão interrompe captura e informa o usuário. A retomada utiliza a sessão do fornecedor quando disponível; caso contrário, abre nova sessão com o último estado persistido e confirmação do resumo. Não depende de memória exclusiva do modelo. Reconexão e troca entre voz e texto preservam `started_at` e `deadline_at`; não abrem outro período de 30 minutos.

## 6. Fonte de verdade, contratos e rastreabilidade

**RF-K02 — Project State único.** O projeto mantém referências para a revisão atual de cada artefato. `requirement_state` é o artefato canônico de descoberta e requisitos; briefing e levantamento são visualizações derivadas dele. Não existe uma segunda lista de requisitos editável em paralelo.

| Registro | Campos obrigatórios |
| --- | --- |
| Projeto | ID, `owner_user_id`, estado, revisão, limites, consumo, `started_at`, `deadline_at`, `deadline_exceeded_at`, `delivered_at`, data de encerramento e referências atuais |
| Revisão de artefato | ID, tipo, número da revisão, schema_version, conteúdo ou arquivo/hash, autor e dependências |
| Item de descoberta/requisito | ID permanente, tipo, descrição, classificação, origem, prioridade, responsável, situação e critérios de aceite quando aplicáveis |
| Operação | ID de idempotência, projeto, autor, revisão-base, mudanças, resultado e timestamps |
| Evidência | Requisito/critério, revisão do teste, commit do código, ambiente, resultado, data e referência do relatório |

O backend utiliza JSON Schema revisado pela equipe e valida também regras semânticas: referências existentes, transições permitidas e permissões. Não compila schemas fornecidos por usuários ou agentes dentro do processo da plataforma. Essa distinção é necessária porque a [validação do Fastify compila schemas como código](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/).

**RB-K10 — Atualização atômica.** Um patch usa operações permitidas, como adicionar item, corrigir descrição, confirmar informação e retirar requisito. Inclui revisão-base e justificativa. O backend aplica tudo ou rejeita tudo; grava nova revisão e evento na mesma transação. Repetir o mesmo ID com o mesmo conteúdo retorna o resultado anterior; reutilizá-lo com outro conteúdo gera conflito.

IDs são únicos dentro do projeto e não são reutilizados. Retirar um requisito marca-o como fora de escopo, sem apagar sua história durante o prazo de retenção. Uma atualização concorrente exige recalcular o patch sobre a revisão atual.

**RB-K11 — Vínculos verificáveis.** Itens de descoberta usam IDs `D001`; requisitos funcionais, `RF001`; regras do produto, `RB001`; não funcionais, `RNF001`; critérios de aceite, `CA001`. A formalização liga os novos IDs aos de descoberta. O prefixo `-K` deste documento identifica regras e requisitos da plataforma, não do produto gerado.

A matriz conecta requisito/critério a tela ou fluxo, API/dados, arquivo/commit e evidência de teste. Um vínculo pode ser “não aplicável” com motivo e validação técnica: um RNF de retenção não precisa ter tela, mas precisa de implementação e verificação. A presença de um ID em um arquivo não comprova atendimento.

**RB-K12 — Revisões imutáveis.** Artefatos aprovados não são sobrescritos. Novas versões registram dependências exatas e tornam aprovações anteriores históricas quando afetadas. Hash identifica conteúdo; identidade e autorização do aprovador dependem do backend, não do hash. A imutabilidade vale durante a retenção autorizada e não impede descarte conforme a seção 13.

## 7. Formalização e crítica dos requisitos

**RF-K03 — Especificação testável.** O agente produz RF, RB e RNF com origem e critérios observáveis, além de perfis/permissões, entidades/relações, fluxos e exceções. Cada item está incluído nesta entrega ou adiado explicitamente. “Rápido”, “seguro” e “responsivo” precisam de métrica ou teste correspondente.

Uma inferência de negócio não confirmada bloqueia a aprovação #1. Requisitos técnicos obrigatórios desta metodologia entram identificados como restrições institucionais, visíveis ao cliente; não são apresentados como falas dele.

**RB-K13 — Crítica com critérios.** O crítico recebe a especificação e as origens, em chamada separada da geração. Não pode encerrar seus próprios achados por declaração sem evidência.

| Severidade | Exemplos | Regra de avanço |
| --- | --- | --- |
| Bloqueadora | Contradição de permissão, requisito sem origem, critério impossível, dependência indisponível, violação do escopo ou de política | Impede aprovação até resolução comprovada |
| Maior | Fluxo de erro ausente, ambiguidade de regra, entidade ou critério incompleto em funcionalidade incluída | Impede aprovação até correção ou retirada do item aceita pelo cliente |
| Menor | Redação ou apresentação sem efeito sobre comportamento | Pode seguir com justificativa, responsável e prazo |

Cada achado registra IDs afetados, severidade, motivo, responsável, estado e evidência de resolução. O titular responde dúvidas de negócio. Questões técnicas seguem políticas homologadas; agentes não podem rebaixar severidade para liberar o avanço. A correção exige evidência e nova avaliação do crítico, e o orquestrador verifica que não restam bloqueadores ou achados maiores. Há no máximo uma rodada automática de correção de requisitos. Persistindo dúvida de negócio, aguardar o titular, inclusive após o prazo de entrega; persistindo impedimento técnico, encerrar como `FAILED`, sem convocar outro usuário para trabalhar no projeto.

## 8. Alterações e reaprovação

**RF-K04 — Solicitação de mudança rastreável.** Toda solicitação gera comparação entre antes e depois, classificação e impacto antes da aplicação. O cliente aprova o conteúdo final das revisões, não apenas o texto do pedido.

| Tipo | Exemplo | Tratamento |
| --- | --- | --- |
| Correção de defeito | Implementação permite cancelamento proibido pelo requisito | Corrigir, repetir verificações e renovar aceite de entrega; manter requisitos se não mudarem |
| Ajuste visual | Cor, espaçamento ou texto sem alterar comportamento | Nova revisão de design e nova aprovação #2; invalidar implementação/evidências afetadas |
| Mudança funcional | Adicionar histórico, perfil ou regra de cancelamento | Voltar a requisitos; nova aprovação #1 e revalidar design, testes e código dependentes |
| Mudança técnica | Atualizar stack, modelo ou forma de armazenamento | Fora da execução corrente; homologar na plataforma para novos projetos, sem trocar a base técnica durante o projeto |

**RB-K14 — Alterações e impacto no prazo.** Há uma rodada ordinária de ajuste por aprovação #1 e #2. O sistema apresenta o impacto no escopo, custo e previsão de conclusão antes de aplicar. Pedidos adicionais ficam para um novo projeto, iniciado somente por decisão explícita do titular. Correções de defeitos introduzidos pelo sistema não consomem a rodada do cliente, mas consomem tempo e tentativas. O titular pode recusar ou cancelar; nunca se presume aprovação para cumprir o prazo.

O orquestrador verifica o orçamento financeiro e os limites técnicos e informa o risco de atraso. Uma estimativa que ultrapasse o prazo não impede o trabalho necessário à conclusão. Mudanças de escopo dependem do titular; não se retiram funcionalidades silenciosamente. O atraso, por si só, não exige autorização para continuar nem abertura de outro projeto. Limites operacionais podem ser revistos pela equipe apenas para novos projetos; `started_at` e `deadline_at` permanecem inalterados. Qualquer alteração de requisito invalida a aprovação #1 atual; dependências afetadas ficam obsoletas. Uma aprovação #2 reaproveitada exige nova decisão sobre o design associado à nova revisão dos requisitos.

## 9. Design e aprovação #2

**RF-K05 — Protótipo verificável.** O Stitch recebe os requisitos aprovados necessários ao design, a matriz de telas e as restrições visuais. O pacote de design inclui telas, navegação, componentes/tokens, versões móvel e desktop e estados de vazio, carregamento, erro e permissão negada.

A saída pode ser HTML e imagens. Para a aprovação #2, o KERNEL deve montar uma prévia navegável dos fluxos principais, com dados fictícios e interações simuladas identificadas. Imagens isoladas não demonstram navegação. Essa montagem pertence à etapa de design e usa o mesmo isolamento do executor; não implementa regras de backend.

**RB-K15 — Contrato real do Stitch.** O adaptador transforma pedidos internos em projeto, IDs de telas e prompt para `edit_screens`, conforme a [integração oficial](https://github.com/google-labs-code/stitch-skills/blob/main/plugins/stitch-design/skills/generate-design/SKILL.md). Um alvo semântico interno não é presumido como seletor suportado pelo MCP.

Após cada geração ou edição, o KERNEL captura HTML, imagens, prompt, metadados, IDs externos e hashes em uma nova revisão local. Compara telas afetadas e não afetadas; uma edição generativa não garante preservação do restante. Resposta vazia ou incompleta não substitui uma revisão válida.

**RB-K16 — Aprovação visual não cria regra de negócio.** Nova funcionalidade sugerida pelo Stitch vira solicitação de mudança. O orquestrador verifica cobertura dos requisitos e aplica a política de segurança da prévia; o titular aprova navegação, conteúdo e aparência. HTML externo é conteúdo não confiável: a prévia usa origem separada e iframe restrito, sem cookies da plataforma, acesso a segredos ou chamadas externas arbitrárias.

## 10. Implementação e execução segura

**RF-K06 — Implementação sobre um template homologado.** O agente recebe requisitos e design aprovados, critérios de aceite, matriz de rastreabilidade, stack e workspace isolado. Planeja, altera arquivos, solicita execução, lê resultados e corrige. Cada execução registra commit e ferramentas utilizadas.

O recurso nativo [code execution do Gemini](https://ai.google.dev/gemini-api/docs/code-execution) executa Python e não substitui esse executor de Node.js, banco e navegador. Quem executa build e testes é a infraestrutura do KERNEL.

**RB-K17 — Fronteira do executor.** O código gerado roda em container sem privilégios, dentro de VM exclusiva de execução, separada da API, banco e segredos da plataforma. Container sozinho não é tratado como isolamento completo. O piloto exige:

1. Usuário sem root, capacidades removidas, `no-new-privileges` e perfil seccomp padrão.
2. Nenhum Docker socket, diretório pessoal, filesystem do host ou volume de outro projeto montado.
3. Raiz somente leitura; escrita limitada ao workspace e temporários, com teto de disco.
4. Rede negada por padrão; teste acessa apenas aplicação e banco descartável do próprio projeto.
5. Limites de CPU, memória, processos e tempo, impostos pelo executor confiável.

A instalação de dependências ocorre em etapa separada, sem segredos, usando lockfile e rede restrita ao registro autorizado. Scripts de instalação ficam desabilitados por padrão; exceções do template são revisadas pelo responsável técnico. O agente não modifica a política de execução ou a lista de comandos. Os cuidados seguem a [documentação de segurança do Docker](https://docs.docker.com/engine/security/).

**RB-K18 — Ferramentas e instruções.** Ferramentas expõem leitura, patch e comandos previamente permitidos, com diretório e argumentos validados. Texto do cliente, código, logs e respostas MCP são dados não confiáveis e não podem ampliar permissões. O agente acessa apenas credenciais descartáveis do banco de teste; credenciais Gemini/Stitch permanecem no backend.

O executor não publica, envia mensagens, acessa contas externas ou altera sistemas de produção. Publicação futura exige decisão institucional separada sobre ambiente, dados, domínio, custos e operação.

## 11. Estados, falhas e retomada

**RF-K07 — Máquina de estados aplicada pelo backend.** A interface exibe etapa real, pendência, erro e ação disponível. O estado não é escolhido por texto livre do modelo.

```text
CREATED → INTERVIEWING → DISCOVERY_REVIEW
        → REQUIREMENTS_GENERATING → REQUIREMENTS_REVIEW
        → CLIENT_APPROVAL_1 → DESIGN_GENERATING → CLIENT_APPROVAL_2
        → IMPLEMENTING → QA → CLIENT_ACCEPTANCE → DELIVERED

QA → AUTOCORRECTING → QA
Etapa ativa → WAITING_CLIENT | RETRY_WAIT
Etapa não terminal → CANCELLED | FAILED
```

Ultrapassar os 30 minutos registra `deadline_exceeded_at`, sem trocar o estado da execução. Por exemplo, um projeto em `IMPLEMENTING` continua nessa etapa e aparece como “Em atraso”. Atraso não é um estado terminal.

**RB-K19 — Condições das transições.**

| Trecho | Condição obrigatória |
| --- | --- |
| Criação até `REQUIREMENTS_GENERATING` | Titular único, capacidade reservada e limites registrados; prazo iniciado com a conversa; briefing conferido e descoberta suficiente |
| `REQUIREMENTS_REVIEW → CLIENT_APPROVAL_1 → DESIGN_GENERATING` | Sem bloqueadores/maiores; aprovação #1 válida |
| `CLIENT_APPROVAL_2 → IMPLEMENTING` | Design navegável e coberto; aprovações #1 e #2 válidas para as revisões atuais |
| `QA → CLIENT_ACCEPTANCE` | Verificações aplicáveis passam no mesmo commit; orquestrador valida evidências e pacote executável |
| `CLIENT_ACCEPTANCE → DELIVERED` | Titular aceita pacote/commit homologado; checksum confere; pacote disponível; registrar `delivered_at` real e classificar o cumprimento do prazo |

Pedido de ajuste na conferência do briefing retorna a `INTERVIEWING`. Correção de requisitos retorna a `REQUIREMENTS_GENERATING` e passa novamente pela crítica. Ajuste visual retorna a `DESIGN_GENERATING`. Defeito na homologação retorna a `AUTOCORRECTING`; mudança funcional retorna aos requisitos. O orquestrador aplica a classificação definida na seção 8 e pede esclarecimento ao titular quando o pedido for ambíguo. Nenhum retorno de etapa reinicia o prazo.

**RB-K20 — Espera, atraso e falha.** Estados de espera guardam `resume_state`, motivo e condição de retomada. A espera pelo titular, conexão ou fornecedor conta na duração total, antes e depois dos 30 minutos. O backend registra o atraso independentemente de a página estar aberta, sem bloquear transições por esse motivo.

| Evento | Resposta |
| --- | --- |
| Dado de negócio ausente ou recusa | `WAITING_CLIENT`; apenas o titular pode responder ou solicitar mudança, inclusive após os 30 minutos |
| Falha transitória com repetição segura | `RETRY_WAIT`; uma repetição após 2s ou o maior `Retry-After`, independentemente do prazo de entrega |
| Impedimento técnico, limite de custo/tentativas ou resultado externo incerto sem resolução após a reconciliação prevista | `FAILED`, com motivo e registro diagnóstico sem segredos; atraso sozinho não configura falha técnica |
| Cancelamento explícito pelo titular | `CANCELLED`; interromper jobs e sessões |
| Prazo de 30 minutos ultrapassado sem entrega | Registrar atraso, manter a etapa e continuar tarefas, correções e aprovações até a conclusão |

A ausência de resposta não gera aprovação. O sistema avisa quando restarem cinco e dois minutos e, ao ultrapassar o prazo, informa uma vez que o projeto está atrasado e seguirá até concluir. Jobs em execução e na fila continuam; resultados recebidos depois do prazo passam pelas mesmas validações. Se estiver em `WAITING_CLIENT`, mantém a pendência e retoma quando o titular responder. Não exige clique em “continuar” apenas porque os 30 minutos passaram.

Estados `DELIVERED`, `CANCELLED` e `FAILED` são terminais. Outra tentativa após cancelamento ou falha exige novo projeto do mesmo titular e novo início explícito de conversa. Um projeto apenas atrasado continua no mesmo registro, sem reiniciar o relógio ou perder artefatos e aprovações.

**RB-K21 — Consistência da execução.** Jobs persistem revisão-base, tentativa, timeout próprio e resultado. Esse timeout protege cada operação e não se confunde com `deadline_at`. O worker usa exclusão no banco e sinal de atividade para não executar dois jobs do mesmo projeto; após reinício, reconcilia jobs interrompidos antes de agir. Resultado recebido após encerramento do projeto ou troca de revisão é registrado como obsoleto e não altera o estado atual. Recebê-lo após o prazo de entrega, com projeto ativo e revisão válida, não o torna obsoleto.

A idempotência local não garante execução única no fornecedor. Se uma geração/edição do Stitch tiver resultado incerto, consultar o projeto remoto e reconciliar conforme os limites de chamada e tentativa da seção 14; sem confirmação, registrar falha, sem reenviar a mutação automaticamente. Leituras e gerações sem efeito externo podem ser repetidas dentro do limite, contabilizando eventual cobrança duplicada.

## 12. QA, homologação e entrega

**RF-K08 — Critérios de aceite protegidos.** Antes de admitir projetos, a equipe técnica homologa as suítes do template e as regras de geração de testes. Durante cada projeto, a etapa de QA, separada do agente de implementação, verifica a correspondência entre os critérios aprovados pelo titular e os testes de aceite. O agente de implementação não pode remover testes, enfraquecer asserções ou alterar resultados esperados para obter sucesso. A suíte de aceite é mantida fora de seu workspace gravável. Correções técnicas na suíte exigem validação da etapa de QA e registro de evidência; o agente de implementação não as aplica. Mudanças de comportamento exigem aprovação #1 do titular. Se a correção exigir manutenção manual da plataforma, o projeto encerra como falha e a manutenção ocorre antes de novas execuções.

**RB-K22 — Verificações obrigatórias.**

| Verificação | Evidência mínima para passar |
| --- | --- |
| Build, lint e tipos | Instalação reproduzível pelo lockfile, build concluído, lint sem erros e TypeScript sem erros |
| Unidade e integração | Regras de negócio, validação de entrada, permissões e persistência verificadas com banco descartável |
| E2E | Fluxo principal por perfil, erro relevante e tentativa de acesso proibido; resultados ligados aos critérios de aceite |
| Acessibilidade e interface | Teclado, foco, rótulos, status, contraste e movimento reduzido; revisão nas larguras 320, 768 e 1280 px |
| Segurança e desempenho | Sem segredos no pacote; consultas parametrizadas, autorização por recurso e dependências sem vulnerabilidade alta/crítica aplicável; metas RNF medidas |

Unidade se aplica a lógica isolável; integração, a API/banco. Neste template ambos existem e são obrigatórios. Uma categoria sem objeto real de teste só pode receber “não aplicável” com justificativa conforme política técnica homologada e registrada antes da entrega. Build, tipos, lint, E2E dos fluxos principais e revisão humana não podem ser dispensados.

**RNF-K01 — Acessibilidade.** Interface da plataforma, prévia e aplicação gerada usam português do Brasil e têm WCAG 2.2 nível AA como alvo. Texto normal requer contraste mínimo de 4,5:1; movimento decorativo respeita a preferência por redução e pode ser interrompido. Status de processamento e erros têm texto acessível. Ferramentas automáticas auxiliam a revisão, sem certificar conformidade completa. [Referência: WCAG 2.2](https://www.w3.org/TR/WCAG22/).

**RNF-K02 — Metas iniciais de desempenho.** Para a aplicação gerada, medir p95 das operações CRUD em até 1 segundo, com dez usuários concorrentes, mil registros por entidade e servidor de 2 vCPU/4 GiB, após aquecimento. Registrar cenário e resultados; operações de IA ficam fora dessa medição. Na plataforma, exibir confirmação de início em até 1 segundo e atualizar a etapa em até 5 segundos após um evento do backend. Na voz, a meta de p95 é iniciar resposta em até 3 segundos após o fim da fala, em rede registrada no relatório. São metas do piloto, não resultados já alcançados.

**RB-K23 — Correção e limites de tentativas.** Após a primeira execução de QA, há até duas rodadas de autocorreção e nova execução, totalizando no máximo três passagens. Correções e testes continuam após os 30 minutos, mesmo quando a estimativa já indicar atraso. Falhas de infraestrutura também consomem tempo. Esgotar tentativas com defeito pendente resulta em `FAILED`; ultrapassar o prazo de entrega apenas registra atraso. Não se eliminam testes nem se aprovam defeitos para cumprir o relógio.

**RF-K09 — Homologação pelo único usuário.** O orquestrador confere a matriz e apresenta uma demonstração guiada ao titular, com dados sintéticos, fluxos principais e evidências de teste das permissões. O titular verifica o resultado e dá o aceite final, com prazo de 30 minutos desde o início da conversa. O aceite após esse prazo continua válido e registra entrega atrasada. Testes verdes sem essa confirmação não encerram o projeto. Toda alteração de código depois do QA invalida seus resultados e o aceite final, exigindo nova verificação.

**RB-K24 — Pacote de entrega.** O pacote contém código e lockfile; Compose/configuração de exemplo sem segredos; migrations e seed fictício; instruções de instalação, uso, teste e remoção; requisitos/design aprovados, matriz e relatórios de QA. Inclui licenças/atribuições aplicáveis e limitações conhecidas.

O manifesto registra commit, hashes, versões das ferramentas, aprovações e comandos executados. A validação final acontece a partir desse pacote em ambiente limpo. Downloads são autenticados e exclusivos do titular do projeto. A validação e a preparação do pacote contam no prazo; o download pode acontecer depois de uma entrega, pontual ou atrasada. A entrega não inclui transcrições, credenciais ou logs internos por padrão.

## 13. Acesso, privacidade e retenção

**RF-K10 — Acesso exclusivo do titular.** Cada operação de consulta, alteração, aprovação, SSE, WebSocket e download exige que a conta autenticada corresponda ao `owner_user_id` do projeto. Não existe tabela de membros nem endpoint de convite, compartilhamento ou transferência de titularidade. No piloto, contas são criadas pelo operador da plataforma, sem cadastro público; essa operação não lhe concede acesso aos projetos. Autenticação usa `crypto.scrypt` assíncrono, salt aleatório individual de pelo menos 16 bytes, `N=2^17`, `r=8`, `p=1` e limite de memória compatível. A escolha utiliza a biblioteca padrão do Node; parâmetros seguem a [recomendação OWASP para scrypt](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). A sessão usa token aleatório opaco no servidor e cookie HttpOnly/Secure/SameSite. Não há senha padrão compartilhada; ativação e recuperação exigem verificação pelo operador e troca de credencial, com revogação das sessões anteriores.

**RNF-K03 — Proteção de sessão.** Exigir HTTPS/WSS, proteção CSRF nas mutações, verificação de origem no WebSocket, expiração em oito horas e revogação no logout. Após cinco falhas de login em quinze minutos por conta, bloquear novas tentativas por quinze minutos. Autorizar cada recurso pela igualdade entre usuário autenticado e titular no backend; conhecer um ID ou ter papel administrativo na plataforma não concede acesso ao projeto. Contas são individuais e não podem ser compartilhadas.

**RB-K25 — Dados permitidos.** O piloto usa informações fictícias de negócio e não aceita uploads de bases reais. Nomes de conta e voz ainda podem identificar participantes: o responsável institucional registra finalidade, base legal, aviso de privacidade e canal de atendimento antes da coleta. A finalidade educacional não elimina automaticamente obrigações; a [LGPD, art. 4º, II, b](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), preserva a aplicação dos arts. 7º e 11 mesmo na hipótese exclusivamente acadêmica.

Usar projeto Gemini com faturamento ativo, sob responsabilidade institucional, e verificar os termos do Stitch separadamente. O regime pago da Gemini não equivale a retenção zero. Enviar somente os trechos necessários à tarefa, sem segredos. Se houver identificação de dado real indevido, suspender a etapa, restringir acesso e solicitar saneamento antes de continuar; não prometer detecção automática infalível.

**RB-K26 — Prazos locais iniciais.**

| Dado | Retenção e descarte |
| --- | --- |
| Áudio | Apenas buffers de transmissão; descarte ao consumir ou encerrar a sessão |
| Transcrição e prompts com conteúdo da entrevista | Até 30 dias após entrega, cancelamento ou falha; atraso não inicia a retenção pós-encerramento |
| Logs técnicos sem conteúdo sensível | Até 30 dias da criação |
| Artefatos, aprovações e histórico do projeto | Até 180 dias após encerramento; depois eliminar ou anonimizar mediante verificação |
| Backups | Janela móvel de até 30 dias; descarte propaga no vencimento e na restauração |

O backend executa verificação diária de expiração. Exclusão/anonimização de uma origem mantém apenas um marcador de descarte nos vínculos históricos. Dados identificáveis, inclusive autoria de aprovações, não são preservados indefinidamente para sustentar rastreabilidade. Uma restauração reaplica registros de exclusão antes de liberar acesso.

Os prazos são decisões do piloto a validar pelo responsável institucional. Eventual obrigação de conservação exige motivo e prazo registrados, com acesso restrito. Dados enviados a fornecedores seguem também os prazos contratuais externos; a plataforma não afirma poder apagá-los apenas removendo sua cópia.

## 14. Software em 30 minutos: prazo e limites

**RNF-K05 — Prazo de entrega e continuidade em atraso.** O backend registra `started_at` ao aceitar a ação “Iniciar conversa”, antes da primeira interação de voz ou texto, e calcula `deadline_at = started_at + 30 minutos`. Ambos são persistidos e imutáveis. `delivered_at` só é gravado quando todas as verificações e aprovações estiverem válidas e o pacote estiver disponível ao titular.

O prazo é de **1.800 segundos corridos**, incluindo conversa, conferência do briefing, gerações, fila interna, aprovações, alterações, reconexões, testes, homologação e preparação do pacote. Fechar a página, trocar de dispositivo, reabrir a sessão ou reiniciar o servidor não pausa nem reinicia a contagem. O backend usa horário UTC sincronizado, verifica o prazo nas operações e por monitoramento periódico e reconcilia atrasos após uma queda.

**O prazo de entrega não é um limite de duração da execução.** Se o projeto permanecer ativo depois de `deadline_at`, preencher uma única vez `deadline_exceeded_at` com o valor de `deadline_at`, mantendo a etapa atual. Esse campo começa nulo e marca o início do atraso, não o horário em que o monitoramento o detectou. O trabalho continua automaticamente até concluir, respeitando as aprovações do titular. Não cancelar jobs, fechar sessões, recusar aprovações ou resultados, impedir novas tarefas nem exigir outro projeto apenas por atraso. Cancelamento pelo titular e impedimentos técnicos, financeiros ou de segurança seguem suas próprias regras.

A interface mostra o tempo total decorrido e, antes do prazo, o tempo restante. Depois, mostra “Em atraso” e a duração do atraso, sem contagem regressiva negativa ou tela de encerramento. A entrega registra duração total `delivered_at - started_at` e atraso `max(0, delivered_at - deadline_at)`. Entrega em até 1.800 segundos, inclusive, cumpre o prazo; acima disso, continua sendo `DELIVERED`, classificada como atrasada. A gravação da entrega e a classificação do prazo usam o mesmo horário e transação, preenchendo também `deadline_exceeded_at` nas entregas atrasadas caso o monitoramento ainda não o tenha feito.

O compromisso continua sendo entregar em até 30 minutos. Prosseguir depois desse limite não redefine a data prometida nem torna o atraso pontual. Sua viabilidade será comprovada no piloto, sem declarar uma garantia operacional já demonstrada.

**RB-K27 — Distribuição do tempo e admissão.** Antes de habilitar “Iniciar conversa”, a plataforma verifica conta, saldo, cotas, disponibilidade dos serviços, template pré-instalado e executor pronto, e reserva capacidade para o projeto. Essa preparação não inclui entrevista, coleta de requisitos ou geração específica do software. No piloto, a instalação admite um projeto ativo de cada vez; os demais aguardam antes de iniciar a conversa. Um projeto atrasado permanece ativo e mantém sua reserva de capacidade até encerrar. Se houver fila ou preparação adicional após o início, seu tempo conta nos 30 minutos.

| Etapa | Orçamento dentro dos 30 minutos |
| --- | --- |
| Conversa e conferência do briefing | 5 minutos |
| Requisitos, crítica e aprovação #1 | 4 minutos |
| Design navegável e aprovação #2 | 5 minutos |
| Implementação, QA e correções | 12 minutos |
| Homologação pelo titular, aceite e pacote disponível | 4 minutos |

Esses cinco orçamentos somam 30 minutos e servem ao planejamento, sem cortes automáticos de execução. O orquestrador pode redistribuir tempo ainda disponível entre etapas, planejando uma reserva de quatro minutos para a conclusão; não pode redefinir o prazo original nem omitir etapas. Se uma etapa ultrapassar sua previsão, as etapas pendentes continuam, com atualização da estimativa e registro do atraso quando aplicável. O teto de complexidade da seção 1 não comprova que qualquer combinação caiba no prazo: a admissão e a aprovação #1 usam estimativas medidas no template, e eventual redução de escopo depende do titular.

| Dimensão | Limite de execução |
| --- | --- |
| Conversa | Previsão inicial de 5 minutos; retomadas e esclarecimentos contam na duração do mesmo projeto |
| Chamadas e comandos | Até 60s por chamada textual, 120s por operação Stitch e 120s por comando de build/teste; timeouts por operação, sem redução pelo saldo até `deadline_at` |
| Tentativas | Uma repetição por falha transitória; uma rodada de correção de requisitos; até duas autocorreções de QA; o prazo de entrega não impede tentativas disponíveis |
| Executor | Até 2 vCPU, 4 GiB de RAM, 256 processos e 2 GiB de escrita por job |
| Orçamento financeiro | Reserva máxima inicial de US$ 5 por projeto para serviços externos, aviso a 80%; infraestrutura registrada separadamente |

Contadores persistem entre reinícios, revisões e retomadas. O orçamento financeiro e os limites técnicos são decisões iniciais do piloto; o prazo de entrega de 30 minutos e o titular único são requisitos fixos do produto. Nenhuma pessoa ou agente pode redefinir o prazo original ou acrescentar um colaborador. Continuar em atraso não aumenta automaticamente o orçamento financeiro ou os limites técnicos. Template, dependências e testes comuns são preparados antes das conversas; código específico, testes do projeto e entrega entram na duração total, inclusive após o prazo.

**RB-K28 — Reserva de custo.** Antes de cada chamada, o backend calcula custo máximo estimado usando entrada, limite de saída, modalidade e tabela de preços vigente registrada. Chamadas textuais usam teto inicial de 8.192 tokens de saída; para voz, a reserva considera a duração máxima da sessão e o contexto enviado. Reserva esse valor e reconcilia com consumo retornado, incluindo raciocínio, contexto reenviado e tentativas. Não iniciar chamada cuja reserva ultrapasse o saldo. Preço e limites devem ser conhecidos na admissão. Se o custo não puder ser determinado durante a execução, suspender chamadas e registrar `FAILED`, com motivo financeiro explícito; essa falha independe do prazo de entrega.

Stitch pode usar cotas ou condições distintas: registrar ambas e não presumir gratuidade ilimitada. O teto local reduz exposição, mas não garante limite exato da fatura quando o fornecedor contabiliza uso com atraso. Conferir consumo com a conta institucional; usar a [tabela oficial Gemini](https://ai.google.dev/gemini-api/docs/pricing) da data de execução. O agente não altera valores.

**RNF-K04 — Observabilidade e recuperação.** Registrar projeto, etapa, operação, revisão, modelo, duração, tentativa, custo estimado/real e resultado, com remoção de segredos. O titular consulta os eventos do próprio projeto; a equipe técnica recebe métricas e diagnósticos operacionais sem conteúdo do projeto. Backup diário criptografado do banco e dos artefatos deve ser restaurado em teste antes do piloto. Meta inicial de recuperação da infraestrutura: perda máxima de 24 horas em desastre e restauração em até 4 horas. O prazo original dos projetos ativos continua valendo. Após a recuperação, retomar do último estado consistente, mesmo que os 30 minutos tenham passado, contabilizando a indisponibilidade no atraso. Perda de estado que impeça retomada segura caracteriza falha técnica, não expiração por tempo. Novos inícios ficam bloqueados até a recuperação.

## 15. Validação antes de declarar a versão final

**RB-K29 — Liberação do piloto.** O responsável institucional registra responsáveis pela plataforma, condições de participação, orçamento e condições de dados/fornecedores. Cada projeto registra apenas seu titular como usuário. O técnico comprova acesso Gemini/Stitch, executor isolado, template reproduzível e restauração. Sem essas evidências, a metodologia permanece como especificação, sem alegação de operação validada.

**RF-K11 — Casos mínimos de avaliação.**

1. Um único titular gera uma agenda fictícia de salas, desde a conversa até pacote aceito e disponível em até 30 minutos. Operador e solicitante são perfis do software gerado, não colaboradores no KERNEL.
2. Confirmar que conflito de horário e cancelamento por perfil indevido são detectados e testados.
3. Introduzir mudança funcional após o design e verificar reaprovação pelo titular, sem reiniciar o relógio ou reduzir escopo sem consentimento.
4. Simular desconexão, reinício, job repetido e resposta externa incerta; comprovar retomada sem duplicação e preservação do prazo. Testar entregas antes, no limite de 1.800s e depois: a última deve concluir como `DELIVERED` com atraso. Ultrapassar o prazo durante implementação, QA e espera pelo titular; comprovar continuidade dos jobs e das correções, aceitação de resultados e aprovações posteriores e ausência de exigência de novo projeto.
5. Com duas contas distintas, comprovar que a segunda não consulta, altera, aprova, acompanha eventos ou baixa arquivos do projeto da primeira, inclusive usando API direta ou conta administrativa; testar cancelamento e bloqueios por falta de aprovação e custo.

O piloto executa três projetos completos desse recorte, registra sucessos e falhas e não exclui execuções malsucedidas do resultado. Para cada um, medir custo externo, duração total desde `started_at`, tempos por etapa e de espera, correções e critérios atendidos. Publicar a taxa de entregas válidas em até 30 minutos sobre todos os projetos iniciados, discriminando entregas no prazo, entregas atrasadas, cancelamentos, falhas e projetos ainda ativos, sem retirar nenhum desses casos do denominador. Nos ativos, informar quantos estão atrasados e há quanto tempo; na entrega, registrar a duração real e o atraso final. Novos projetos derivados não substituem os resultados anteriores. Antes de avaliar o crítico, inserir pelo menos um conflito conhecido de cada severidade e registrar se foi identificado.

**RB-K30 — Critério de conclusão da metodologia.** A versão final exige três projetos completos com titular único, cada um entregue e aceito em até 30 minutos corridos desde sua conversa, aprovação de todos os critérios obrigatórios e evidência de que os casos negativos bloquearam corretamente o avanço. Entregas atrasadas são conclusões funcionais válidas, mas não contam entre as três entregas que comprovam o prazo; permanecem nas métricas com sua duração real. Nenhuma vulnerabilidade alta/crítica aplicável, pendência bloqueadora ou maior pode permanecer aberta. Ajustes técnicos após falha devem ser registrados e os casos afetados repetidos; resultados anteriores permanecem no relatório. Não se redefine o prazo de entrega de 30 minutos nem se acrescenta outro usuário ao projeto para obter aprovação no piloto.

O relatório institucional informa equipe/autoria nominal, versão do método, ambiente, modelos, evidências, limitações e decisões tomadas. O titular valida utilidade e aderência de seu software; a equipe técnica avalia os resultados agregados e os testes da plataforma; o responsável institucional confirma condições de uso. A redação deste documento, por si só, não satisfaz esses critérios.
