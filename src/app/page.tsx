import Link from "next/link";
import { Arrow, Check } from "@/components/icons";
import { ProcessDial } from "./_components/process-dial";
import { steps } from "@/content/process";
import { ProjectInvitation } from "./_components/project-invitation";
import { ApplicationExamples } from "./_components/application-examples";
import { HomeMotion } from "./_components/home-motion";

const questions = [
  [
    "O KERNEL já está disponível?",
    "Ainda não. A metodologia está definida e o projeto está em preparação para o piloto. A implementação da plataforma e sua validação ainda precisam de evidências. Não há cadastro público nesta fase.",
  ],
  [
    "O software fica pronto em 30 minutos?",
    "Esse é o prazo definido para o piloto, contado desde o início da conversa até o aceite e a disponibilização do pacote. A equipe ainda precisa validar essa proposta. Se houver atraso, o trabalho continua no mesmo projeto, respeitando as aprovações e os limites operacionais.",
  ],
  [
    "Preciso saber programar?",
    "A proposta é que você explique o que precisa por voz ou texto, confira os requisitos, aprove o protótipo e avalie a entrega. Para instalar e executar o pacote recebido, você terá instruções técnicas. O piloto não inclui hospedagem ou publicação automática.",
  ],
  [
    "O que eu recebo no final?",
    "Após os testes e o seu aceite, a entrega prevista é um pacote reproduzível: código, banco com dados fictícios, configuração, testes, instruções e os registros de requisitos e design aprovados. Você recebe os arquivos do projeto, não um serviço já publicado em produção.",
  ],
  [
    "Posso trabalhar com outras pessoas no projeto?",
    "Cada projeto tem um único titular. Você conduz a conversa, aprova requisitos e design e aceita a entrega. Não há convites ou coedição. Os perfis de acesso do software criado pertencem à aplicação, não representam colaboradores dentro do KERNEL.",
  ],
] as const;

export default function Home() {
  return (
    <main id="conteudo">
      <section className="hero shell">
        <div className="hero-copy">
          <h1>
            <span>Sua ideia.</span>
            <span>Software em</span>
            <span className="accent">
              30 minutos.
            </span>
          </h1>
          <p className="hero-description">
            Você conta o que precisa, aprova cada decisão e acompanha a
            construção. Esse é o KERNEL.
          </p>
          <div className="hero-actions">
            <Link href="#como-funciona" className="button button-accent">
              Explore como funciona <Arrow diagonal />
            </Link>
            <Link className="text-link" href="/sobre">
              Conheça o projeto <Arrow />
            </Link>
          </div>
          <p className="pilot-note">
            <span className="note-marker">*</span> 30 minutos é a proposta. A
            validação acontece no piloto.
          </p>
        </div>
        <ProcessDial />
      </section>

      <section id="como-funciona" className="method light-section">
        <div className="shell method-layout">
          <div className="section-intro">
            <h2>
              Uma conversa.
              <br />
              Cinco etapas.
              <br />
              <span className="subtle">Você decide.</span>
            </h2>
            <p>
              No método KERNEL, os agentes ajudam a construir. Você define o
              escopo, aprova o design e dá o aceite final.
            </p>
            <div className="method-footnote">
              <span className="mini-clock" aria-hidden="true" />
              <p>
                Um único prazo de 30 minutos.
                <br />
                Conversa, aprovações e testes incluídos.
              </p>
            </div>
          </div>
          <div className="process-list">
            {steps.map((step, index) => (
              <details
                key={step.number}
                className="process-step"
                name="process"
                open={index === 0}
              >
                <summary>
                  <span className="step-number mono">{step.number}</span>
                  <span className="step-name">{step.name}</span>
                  <span className="step-time mono">{step.minutes} MIN</span>
                  <span className="expand-icon" aria-hidden="true" />
                </summary>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <span className="decision">
                    <Check />
                    {step.decision}
                  </span>
                </div>
              </details>
            ))}
            <p className="process-note">
              Distribuição prevista para o piloto. Se houver atraso, o projeto
              continua até concluir, respeitando os limites operacionais.
            </p>
          </div>
        </div>
      </section>

      <ApplicationExamples />

      <section className="ownership light-section">
        <div className="shell ownership-layout">
          <div className="delivery-art" aria-hidden="true">
            <div className="delivery-folder">
              <div className="folder-heading">
                <span className="folder-code">&lt;/&gt;</span>
              </div>
              <div className="folder-row">
                <span>Código e configuração</span>
                <Check />
              </div>
              <div className="folder-row">
                <span>Banco e dados fictícios</span>
                <Check />
              </div>
              <div className="folder-row">
                <span>Testes e instruções</span>
                <Check />
              </div>
            </div>
          </div>
          <div className="ownership-copy">
            <h2>
              Seu projeto.
              <br />
              Suas decisões.
              <br />
              <span className="subtle">Seu código.</span>
            </h2>
            <p>
              A entrega prevista reúne o código, o banco, os testes e as
              instruções para executar o que você aprovou.
            </p>
            <p>
              Você confere a demonstração e dá o aceite. Os requisitos, as
              decisões e as evidências de teste acompanham o pacote.
            </p>
            <Link href="/sobre#principios" className="text-link dark-link">
              Entenda os princípios <Arrow diagonal />
            </Link>
          </div>
        </div>
      </section>

      <section className="faq shell section-space">
        <div className="faq-intro">
          <h2>Vale saber.</h2>
          <p>
            O que faz parte da proposta
            <br />e o que vem depois.
          </p>
        </div>
        <div className="faq-list">
          {questions.map(([question, answer]) => (
            <details key={question} className="faq-item">
              <summary>
                {question}
                <span className="expand-icon" aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <ProjectInvitation />
      <HomeMotion />
    </main>
  );
}
