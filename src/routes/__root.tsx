import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <AppShell>
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 space-y-4 lg:col-span-8 lg:col-start-3">
          <h1>Página não encontrada</h1>
          <p>O endereço que indicou não existe ou foi alterado.</p>
          <div>
            <Link to="/" className={buttonVariants()}>
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <AppShell>
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 space-y-4 lg:col-span-8 lg:col-start-3">
          <h1>Não foi possível carregar a página</h1>
          <Alert variant="destructive">
            Ocorreu um problema do nosso lado. Pode tentar de novo ou voltar ao início.
          </Alert>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                router.invalidate();
                reset();
              }}
            >
              Tentar novamente
            </Button>
            <a href="/" className={buttonVariants({ variant: "secondary" })}>
              Voltar ao início
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Respostas Suporte RAL+" },
      { name: "description", content: "Respostas standard do Suporte RAL+" },
      { property: "og:title", content: "Respostas Suporte RAL+" },
      { property: "og:description", content: "Respostas standard do Suporte RAL+" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
