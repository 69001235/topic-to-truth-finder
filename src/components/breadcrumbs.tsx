import type { ReactNode } from "react";

/**
 * Breadcrumb trail. Pass `<li>` children: earlier steps as links
 * (`<li><Link className="link" …>Pesquisa</Link></li>`) and the current page as
 * `<li><span aria-current="page">…</span></li>`.
 */
export function Breadcrumbs({ children }: { children: ReactNode }) {
  return (
    <nav aria-label="Caminho de navegação" className="mb-6 text-base">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 [&>li+li]:before:mr-2 [&>li+li]:before:text-muted-foreground [&>li+li]:before:content-['/']">
        {children}
      </ol>
    </nav>
  );
}
