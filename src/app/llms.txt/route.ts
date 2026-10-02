import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  return new Response(
    `# KERNEL

> Projeto educacional do SENAI Americana, sem fins lucrativos, que propõe criar pequenas aplicações web a partir de uma conversa, com inteligência artificial e aprovações humanas.

O projeto está em preparação para o piloto. Os 30 minutos são uma proposta a validar, não um resultado comprovado. Ainda não há cadastro público.

O método tem cinco etapas: conversa, requisitos, design, construção e entrega. Cada projeto possui um único titular, que define o escopo, aprova requisitos e design e confirma o aceite final.

O escopo inicial inclui aplicações de cadastro, consulta e agendamento com dados fictícios. A entrega prevista é um pacote reproduzível com código, banco, configuração, testes, instruções e registros aprovados. O piloto não inclui pagamentos, integrações externas na aplicação ou publicação automática.

## Páginas

- [Início](${new URL("/", siteUrl).href}): Proposta, cinco etapas, exemplos do escopo e perguntas frequentes.
- [Sobre o KERNEL](${new URL("/sobre", siteUrl).href}): Origem, princípios, estado do piloto e equipe do projeto.
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
