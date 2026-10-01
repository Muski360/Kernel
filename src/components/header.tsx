"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Brand } from "./brand";
import { Arrow } from "./icons";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link
          className="brand-link"
          href="/"
          aria-label="KERNEL, início"
          onClick={() => setOpen(false)}
        >
          <Brand />
        </Link>
        <button
          ref={menuButton}
          className="menu-toggle"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          <span className={open ? "menu-lines is-open" : "menu-lines"}>
            <i />
            <i />
          </span>
        </button>
        <nav
          id="main-navigation"
          aria-label="Navegação principal"
          className={`main-navigation ${open ? "is-open" : ""}`}
        >
          <Link href="/#como-funciona" onClick={() => setOpen(false)}>
            Como funciona
          </Link>
          <Link href="/#possibilidades" onClick={() => setOpen(false)}>
            O que criar
          </Link>
          <Link
            href="/sobre"
            aria-current={pathname === "/sobre" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            Sobre o KERNEL
          </Link>
          <Link
            className="nav-cta"
            href="/sobre#piloto"
            onClick={() => setOpen(false)}
          >
            Conheça o projeto <Arrow diagonal />
          </Link>
        </nav>
      </div>
    </header>
  );
}
