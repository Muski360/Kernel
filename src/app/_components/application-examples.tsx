import type { ReactNode } from "react";
import styles from "./application-examples.module.css";

function ExampleWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.window}>
      <div className={styles.windowBar}>{title}</div>
      <div className={styles.windowContent}>{children}</div>
    </div>
  );
}

export function ApplicationExamples() {
  return (
    <section id="possibilidades" className="shell section-space">
      <div className="section-heading">
        <h2>
          Pequenas aplicações.
          <br />
          <span className="subtle">Problemas concretos.</span>
        </h2>
        <p>
          O primeiro piloto tem um recorte definido: aplicações web de
          cadastro, consulta e agendamento, com dados fictícios.
        </p>
      </div>
      <div className={styles.examples}>
        <article className={styles.example}>
          <div className={styles.copy}>
            <h3>Organize cadastros.</h3>
            <p>Cadastre informações e defina os campos e as regras do seu sistema.</p>
          </div>
          <div className={`example-visual ${styles.visual} ${styles.registration}`} aria-hidden="true">
            <ExampleWindow title="Cadastro de materiais">
              <span className={styles.label}>NOVO MATERIAL</span>
              <span className={styles.input}>Kit de ferramentas <span>↵</span></span>
              <div className={styles.inputRow}>
                <span className={styles.input}>Oficina 01</span>
                <span className={styles.input}>12 un.</span>
              </div>
              <span className={styles.submit}>Salvar cadastro <span>+</span></span>
            </ExampleWindow>
          </div>
        </article>
        <article className={styles.example}>
          <div className={styles.copy}>
            <h3>Encontre informações.</h3>
            <p>Consulte registros com os filtros e as permissões que você aprovou.</p>
          </div>
          <div className={`example-visual ${styles.visual} ${styles.consultation}`} aria-hidden="true">
            <ExampleWindow title="Consulta de materiais">
              <span className={styles.search}><span>⌕</span> Buscar material</span>
              {["Kit de ferramentas", "Multímetro", "Paquímetro"].map((item, index) => (
                <div className={styles.result} key={item}>
                  <span className={styles.file}>0{index + 1}</span>
                  <span>{item}</span>
                  <span>↗</span>
                </div>
              ))}
            </ExampleWindow>
          </div>
        </article>
        <article className={styles.example}>
          <div className={styles.copy}>
            <h3>Planeje agendamentos.</h3>
            <p>Organize reservas e estabeleça regras para horários e cancelamentos.</p>
          </div>
          <div className={`example-visual ${styles.visual} ${styles.scheduling}`} aria-hidden="true">
            <ExampleWindow title="Agenda de salas">
              <div className={styles.days}>
                {["SEG", "TER", "QUA", "QUI", "SEX"].map((day, index) => (
                  <span key={day} className={index === 2 ? styles.selected : undefined}>
                    {day}<b>{index + 12}</b>
                  </span>
                ))}
              </div>
              <div className={styles.event}>
                <span>09:00</span>
                <span>Oficina de projeto<small>Sala 02 · 1 hora</small></span>
              </div>
              <div className={styles.free}>10:00 <span>Horário disponível</span></div>
            </ExampleWindow>
          </div>
        </article>
      </div>
      <p className={styles.scope}>
        Exemplos com dados fictícios. O piloto não inclui pagamentos,
        integrações externas na aplicação ou publicação automática.
      </p>
    </section>
  );
}
