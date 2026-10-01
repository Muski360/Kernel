import Link from "next/link";
import { Arrow } from "./icons";

export function ProjectInvitation() {
  return (
    <section className="invitation">
      <div className="shell invitation-inner">
        <div>
          <h2>
            Comece pela
            <br />
            sua próxima ideia.
          </h2>
        </div>
        <div className="invitation-action">
          <p>
            Estamos preparando o piloto.
            <br />
            Conheça o projeto e o que estamos construindo.
          </p>
          <Link href="/sobre#piloto" className="button button-dark">
            Conhecer o KERNEL <Arrow diagonal />
          </Link>
        </div>
      </div>
    </section>
  );
}
