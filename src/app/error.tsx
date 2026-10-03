"use client";

import { Arrow } from "@/components/icons";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main id="conteudo" className="route-error shell">
      <div className="error-content">
        <div>
          <h1>Não foi possível abrir esta página.</h1>
          <p>Tente novamente. Se o erro continuar, volte ao início.</p>
        </div>
        <div className="error-actions">
          <button type="button" className="button button-accent" onClick={retry}>
            Tentar novamente <Arrow />
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Reload clears the failed route and its client state. */}
          <a href="/" className="text-link">Voltar ao início <Arrow diagonal /></a>
        </div>
      </div>
    </main>
  );
}
