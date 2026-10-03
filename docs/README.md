# KERNEL

**SENAI Americana · Projeto educacional, sem fins lucrativos**

**Versão documental:** 1.2 candidata · 30/09/2026

**Situação:** especificação definida; implementação e piloto ainda precisam de evidências.

O KERNEL parte da ideia de **software em 30 minutos**: cada projeto tem **um único usuário**, que conduz a conversa, com prazo para receber um pacote de software testado e aceito de **30 minutos corridos desde o início da conversa**. Se esse prazo for ultrapassado, o trabalho continua até concluir e a entrega registra o atraso real. A primeira versão atende pequenas aplicações web de cadastro, consulta e agendamento, com dados sintéticos.

Cada projeto possui um titular exclusivo. Não há colaboradores, convites, coedição ou aprovação por outra conta. Os perfis de acesso que existirem no software gerado não representam usuários trabalhando juntos no projeto do KERNEL.

```text
Iniciar conversa: começa o prazo único de 30 minutos
  → Entrevista por voz ou texto → Briefing conferido
  → Requisitos e crítica → Aprovação #1
  → Protótipo navegável → Aprovação #2
  → Implementação → QA → Homologação e aceite pelo titular
  → Pacote reproduzível disponível (prazo: minuto 30; continuar se houver atraso)
```

O backend controla titularidade, versões, permissões, limites e transições. Agentes propõem alterações; somente o titular aprova requisitos, design e entrega. Conversa, aprovações, esperas, correções e preparação do pacote contam no mesmo prazo. Reconexões e mudanças de etapa não reiniciam o relógio. Publicação em produção não faz parte do piloto.

A plataforma verifica capacidade antes de iniciar a conversa. Ao ultrapassar os 30 minutos sem entrega validada, informa “Em atraso” e mantém a etapa atual. Tarefas, correções e aprovações continuam no mesmo projeto até a conclusão, sem reiniciar o relógio. A entrega atrasada é válida e preserva a medição do prazo descumprido. Cancelamento e impedimentos técnicos, financeiros ou de segurança têm regras próprias. A equipe técnica mantém a plataforma, sem atuar como colaboradora nos projetos.

**Decisões técnicas:** Next.js com App Router, React e TypeScript na interface; Node.js 24 LTS, Fastify 5 e PostgreSQL 18 no backend; Gemini 3.8 Live para voz, Gemini 3.8 Flash para engenharia e Stitch via MCP para design. O código gerado roda em executor isolado e passa por testes de unidade, integração e E2E.

1. [Regras de negócio e metodologia](Metodologia.md): fonte normativa para escopo, stack, aprovações, dados, operação e critérios do piloto.
2. [Auditoria do site](auditoria-site.md): decisões visuais, organização do código e evidências de validação do site institucional.

Titular único e prazo de entrega de 30 minutos são requisitos fixos do produto. O prazo não encerra a execução: a plataforma deve continuar trabalhando quando houver atraso. Custo, distribuição de tempo entre etapas e complexidade admitida serão calibrados no piloto para cumprir esses requisitos. A versão final depende das evidências de entrega previstas na metodologia; a documentação não comprova, por si só, que a plataforma funciona.
