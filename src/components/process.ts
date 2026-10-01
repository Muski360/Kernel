export const steps = [
  {
    number: "01",
    name: "Conversa",
    minutes: 5,
    title: "Conte o que você precisa.",
    description:
      "Explique sua ideia por voz ou texto. Você confere o resumo da conversa antes de seguir para os requisitos.",
    decision: "Você confere o briefing",
  },
  {
    number: "02",
    name: "Requisitos",
    minutes: 4,
    title: "Aprove o que será construído.",
    description:
      "Os agentes organizam e revisam os requisitos. Você aprova o escopo, as regras e os critérios que serão usados para testar a entrega.",
    decision: "Sua primeira aprovação",
  },
  {
    number: "03",
    name: "Design",
    minutes: 5,
    title: "Explore antes de aprovar.",
    description:
      "Navegue pelo protótipo com dados fictícios, confira as telas e peça ajustes. A implementação começa depois da sua aprovação do design.",
    decision: "Sua segunda aprovação",
  },
  {
    number: "04",
    name: "Construção",
    minutes: 12,
    title: "Acompanhe a implementação.",
    description:
      "Os agentes implementam o escopo aprovado. A etapa de qualidade verifica o código, executa testes e solicita correções dentro dos limites do projeto.",
    decision: "Implementação, testes e correções",
  },
  {
    number: "05",
    name: "Entrega",
    minutes: 4,
    title: "Confira. Aceite. Receba.",
    description:
      "Você testa a demonstração e confirma o aceite. A entrega inclui um pacote com código, banco, testes e instruções para reproduzir o projeto.",
    decision: "Seu aceite final",
  },
] as const;
