import Image from "next/image";
import Link from "next/link";
import { Brand } from "./brand";
import { Arrow } from "./icons";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <Link href="/" aria-label="KERNEL, início">
            <Brand />
          </Link>
          <p>
            Da ideia ao software,
            <br />
            em uma conversa.
          </p>
          <div className="footer-links">
            <Link href="/#como-funciona">
              Como funciona <Arrow diagonal />
            </Link>
            <Link href="/sobre">
              Sobre o projeto <Arrow diagonal />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="institutional-credit">
            <span className="senai-image">
              <Image
                src="/brand/senai.png"
                alt="SENAI"
                width={400}
                height={300}
                sizes="72px"
              />
            </span>
            <span>
              Projeto SENAI Americana
              <br />
              <span className="muted">Educacional · Sem fins lucrativos</span>
            </span>
          </div>
          <span className="technology-credit">
            <Image src="/brand/gemini.png" alt="" width={22} height={22} />{" "}
            Powered by Gemini
          </span>
          <span className="footer-date">KERNEL © 2026</span>
        </div>
      </div>
    </footer>
  );
}
