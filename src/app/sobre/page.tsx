import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/icons";
import { KernelSculpture } from "./_components/kernel-sculpture";

export const metadata: Metadata = {
  title: "Sobre o projeto",
  description:
    "A proposta, os princípios e a equipe do KERNEL. Um projeto educacional do SENAI Americana para estudar a criação de software com inteligência artificial e decisões humanas.",
  alternates: { canonical: "/sobre" },
  openGraph: {
    title: "Sobre o projeto | KERNEL",
    description: "A proposta, os princípios e a equipe do projeto educacional KERNEL, do SENAI Americana.",
    url: "/sobre",
    siteName: "KERNEL",
    locale: "pt_BR",
    type: "website",
  },
};

const principles = [
  {
    number: "01",
    title: "Você conduz o projeto.",
    text: "Cada projeto tem um único titular. Você explica a necessidade, define o escopo e aprova as decisões. Os agentes não podem dar o aceite por você.",
  },
  {
    number: "02",
    title: "Cada decisão tem uma origem.",
    text: "Os requisitos se conectam ao que você confirmou na conversa. O método prevê o registro das versões, das aprovações e das evidências de teste.",
  },
  {
    number: "03",
    title: "O prazo inclui o processo inteiro.",
    text: "Os 30 minutos começam na conversa e incluem as aprovações, os testes e a preparação do pacote. Em caso de atraso, o trabalho continua, com registro do tempo real e respeito aos limites operacionais.",
  },
  {
    number: "04",
    title: "A entrega precisa de evidências.",
    text: "A equipe precisa verificar o código, os testes e a execução do pacote. Você confere a demonstração e confirma o aceite final. A validação desses passos faz parte do piloto.",
  },
] as const;

export default function About() {
  return (
    <main id="conteudo" className="about-page">
      <section className="about-hero light-section">
        <div className="shell">
          <div className="about-hero-grid">
            <div className="about-hero-copy">
              <h1 className="about-hero-title">
                A ideia é sua.
                <br />O caminho,
                <br />
                <span className="subtle">a gente constrói.</span>
              </h1>
              <p>
                Estamos desenvolvendo um método para criar software com
                inteligência artificial, com você presente nas decisões do
                começo ao fim.
              </p>
            </div>
            <KernelSculpture />
          </div>
        </div>
      </section>

      <section id="origem" className="origin shell section-space">
        <div>
          <h2>
            Menos distância
            <br />
            entre explicar
            <br />
            <span className="accent">e construir.</span>
          </h2>
        </div>
        <div className="origin-copy">
          <p className="large-copy">
            Você sabe o problema que precisa resolver. Traduzir isso em
            requisitos, telas e código exige um processo.
          </p>
          <p>
            No KERNEL, queremos que você comece explicando sua ideia por voz ou
            texto. A partir dessa conversa, os agentes organizam requisitos,
            propõem um design e ajudam a implementar o software que você
            aprovou.
          </p>
          <p>
            O projeto nasce no SENAI Americana, em um contexto educacional e sem
            fins lucrativos. Estamos estudando como reunir essas etapas em uma
            metodologia com decisões registradas e uma entrega que possa ser
            testada e reproduzida.
          </p>
        </div>
      </section>

      <section id="principios" className="principles light-section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <h2>
                IA na construção.
                <br />
                <span className="subtle">Você nas decisões.</span>
              </h2>
            </div>
            <p>
              Quatro compromissos que orientam o método e a plataforma em
              desenvolvimento.
            </p>
          </div>
          <div className="principle-grid">
            {principles.map((item) => (
              <article key={item.number} className="principle">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="piloto" className="pilot shell section-space">
        <div className="pilot-heading">
          <h2>
            Uma proposta definida.
            <br />
            <span className="subtle">Um piloto pela frente.</span>
          </h2>
        </div>
        <div className="pilot-layout">
          <div className="pilot-status">
            <div className="mono">
              <span className="status-dot" /> EM DESENVOLVIMENTO
            </div>
            <p className="pilot-version">
              1.2<span>VERSÃO DOCUMENTAL CANDIDATA</span>
            </p>
            <p>
              A especificação está revisada.
              <br />A implementação e a validação do piloto ainda estão
              pendentes.
            </p>
            <span className="mono pilot-updated">
              ATUALIZADO EM 30 SET 2026
            </span>
          </div>
          <div className="pilot-copy">
            <h3>O que vamos colocar à prova.</h3>
            <p>
              A proposta de software em 30 minutos precisa ser demonstrada. O
              piloto prevê projetos de cadastro, consulta e agendamento, com
              dados fictícios e um único titular por projeto.
            </p>
            <div className="pilot-limits">
              <span>
                <b>05</b>entidades de negócio
              </span>
              <span>
                <b>03</b>perfis na aplicação
              </span>
              <span>
                <b>08</b>telas principais
              </span>
            </div>
            <p className="limits-note">
              Limites máximos do escopo inicial. Os perfis pertencem ao software
              criado; o projeto no KERNEL continua individual.
            </p>
            <p>
              Para concluir a validação, a equipe precisa comprovar três
              projetos completos, aceitos e disponíveis em até 30 minutos cada.
              Os resultados também devem registrar falhas, atrasos e limitações.
            </p>
            <p className="pilot-access">
              O piloto terá contas criadas pelo operador da plataforma. Ainda
              não há cadastro público.
            </p>
          </div>
        </div>
      </section>

      <section className="team light-section">
        <div className="shell team-layout">
          <div>
            <h2>
              O time
              <br />
              KERNEL<span className="subtle">.</span>
            </h2>
            <p>
              SENAI Americana
              <br />
              Projeto educacional
            </p>
          </div>
          <div className="team-list">
            {[
              { name: "Rian Eduardo", github: "rianeduardo" },
              { name: "Lorenzo Malosso", github: "LorenzoPradalMalosso" },
              { name: "Kaio Martinez", github: "kaiomartinezjorge" },
              { name: "Murilo Dovigo", github: "Muski360" },
              { name: "Pedro Lanaro", github: "lanaro0108" },
            ].map(({ name, github }) => (
              <a
                key={github}
                className="team-link"
                href={`https://github.com/${github}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} — GitHub (abre em nova aba)`}
              >
                <span className="team-name">{name}</span>
                <span className="team-github" aria-hidden="true">
                  GitHub <Arrow diagonal />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="about-closing shell">
        <div>
          <h2>
            Da primeira conversa
            <br />
            ao aceite final.
          </h2>
        </div>
        <Link href="/#como-funciona" className="button button-accent">
          Explore as cinco etapas <Arrow diagonal />
        </Link>
      </section>
    </main>
  );
}
