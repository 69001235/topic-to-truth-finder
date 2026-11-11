import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { Permissoes } from "@/lib/permissoes";

export const APP_NAME = "Respostas Suporte RAL+";

type AppShellProps = {
  children: ReactNode;
  /** Signed-in person's permissions; decides which navigation links appear. */
  perms?: Permissoes | undefined;
  /** Current search term, kept when going to the add-answer page. */
  searchTerm?: string | undefined;
  /** Shows a "Sair" action in the navigation when provided. */
  onSignOut?: (() => void) | undefined;
};

const navLink =
  "block border-b-4 border-transparent py-3 text-foreground no-underline hover:underline data-[status=active]:border-primary data-[status=active]:font-bold";

/**
 * Page frame shared by every screen: skip link, header with the main
 * navigation (collapsible on small screens), content area and footer.
 * Deliberately plain: no shadows, gradients or decorative effects.
 */
export function AppShell({ children, perms, searchTerm, onSignOut }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const showNav = !!perms?.search || !!onSignOut;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border-2 focus:border-primary focus:bg-background focus:px-4 focus:py-2 focus:font-semibold focus:text-primary"
      >
        Saltar para o conteúdo
      </a>

      <header className="border-b bg-background">
        <div className="h-1 bg-primary" aria-hidden="true" />
        <div className="page-container flex items-center justify-between gap-4 py-3">
          <Link to="/" className="text-xl font-bold text-foreground no-underline hover:underline">
            {APP_NAME}
          </Link>
          {showNav && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="md:hidden"
              aria-expanded={open}
              aria-controls="navegacao-principal"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
              Menu
            </Button>
          )}
        </div>

        {showNav && (
          <nav
            id="navegacao-principal"
            aria-label="Navegação principal"
            className={`${open ? "block" : "hidden"} border-t bg-muted md:block`}
          >
            <ul className="page-container flex flex-col md:flex-row md:flex-wrap md:items-center md:gap-x-8">
              {perms?.search && (
                <>
                  <li>
                    <Link to="/" activeOptions={{ exact: true }} className={navLink}>
                      Pesquisa
                    </Link>
                  </li>
                  <li>
                    <Link to="/construir" className={navLink}>
                      Construir resposta
                    </Link>
                  </li>
                </>
              )}
              {perms?.create && (
                <li>
                  <Link
                    to="/gerir"
                    search={searchTerm ? { q: searchTerm } : {}}
                    className={navLink}
                  >
                    Adicionar resposta
                  </Link>
                </li>
              )}
              {perms?.admin && (
                <li>
                  <Link to="/utilizadores" className={navLink}>
                    Utilizadores
                  </Link>
                </li>
              )}
              {onSignOut && (
                <li className="md:ml-auto">
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="block py-3 text-left font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
                  >
                    Sair
                  </button>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>

      <main id="conteudo" tabIndex={-1} className="page-container flex-1 py-8 md:py-12">
        {children}
      </main>

      <footer className="border-t-4 border-primary bg-muted">
        <div className="page-container py-6">
          <p className="font-semibold">{APP_NAME}</p>
          <p className="text-muted-foreground">Acesso reservado a utilizadores autorizados.</p>
        </div>
      </footer>
    </div>
  );
}
