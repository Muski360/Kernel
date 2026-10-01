import Link from "next/link";
import { Arrow } from "@/components/icons";
import { kernelPath } from "@/components/kernel-path";

export default function NotFound() {
  return (
    <main id="conteudo" className="not-found shell">
      <div className="error-code" aria-hidden="true">
        <span>4</span>
        <div className="error-zero">
          <svg viewBox="0 0 2000 2000">
            <path d={kernelPath} fill="currentColor" />
          </svg>
        </div>
        <span>4</span>
      </div>
      <div className="error-content">
        <div>
          <h1>
            <span className="sr-only">Erro 404. </span>Página não encontrada.
          </h1>
          <p>Não encontramos o endereço que você tentou abrir.</p>
        </div>
        <div className="error-actions">
          <Link href="/" className="button button-accent">
            Voltar ao início <Arrow diagonal />
          </Link>
          <Link href="/sobre" className="text-link">
            Sobre o KERNEL <Arrow />
          </Link>
        </div>
      </div>
    </main>
  );
}
