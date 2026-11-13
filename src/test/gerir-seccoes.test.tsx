import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  rows: [] as Record<string, string>[],
  canEdit: true,
  updated: [{ id: "x" }] as { id: string }[],
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => ({}) }),
  useNavigate: () => mocks.navigate,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { user: { email: "ana@example.test" } } } }),
      signOut: async () => ({}),
    },
    from: (table: string) =>
      table === "utilizadores"
        ? {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    is_admin: false,
                    can_search: true,
                    can_create: true,
                    can_edit: mocks.canEdit,
                    can_delete: false,
                  },
                }),
              }),
            }),
          }
        : {
            select: () => ({ order: async () => ({ data: mocks.rows, error: null }) }),
            insert: mocks.insert,
            update: (patch: unknown) => ({
              eq: (column: string, value: string) => {
                mocks.update(patch, column, value);
                return {
                  select: async () => ({ data: mocks.updated, error: null }),
                  then: (resolve: (v: { error: null }) => unknown) => resolve({ error: null }),
                };
              },
            }),
          },
  },
}));

import { Route } from "@/routes/_authenticated/gerir";

const row = (id: string, ref: string, category: string, title: string) => ({
  id,
  ref,
  category,
  title,
  keywords: "",
  note: "",
  text: "Texto da resposta",
});

function renderPage() {
  const Page = Route.options.component as React.ComponentType;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}

describe("Gerir: secções", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canEdit = true;
    mocks.updated = [{ id: "x" }];
    mocks.insert.mockResolvedValue({ error: null });
    mocks.rows = [
      row("uuid-a", "1.1", "Gerais", "Tema A"),
      row("uuid-b", "2.1", "Acesso", "Tema B"),
    ];
  });

  it("moves an answer to another section and confirms it", async () => {
    renderPage();
    const select = await screen.findByLabelText("Secção da resposta Tema B");
    fireEvent.change(select, { target: { value: "Gerais" } });
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({ category: "Gerais" }, "id", "uuid-b"),
    );
    expect(await screen.findByText(/«Tema B» foi movida para a secção «Gerais»/)).toBeVisible();
  });

  it("does not claim success when nothing was moved (no permission at the database)", async () => {
    mocks.updated = [];
    renderPage();
    fireEvent.change(await screen.findByLabelText("Secção da resposta Tema B"), {
      target: { value: "Gerais" },
    });
    expect(await screen.findByText(/Não foi possível mover a resposta/)).toBeVisible();
    expect(screen.queryByText(/foi movida/)).toBeNull();
  });

  it("creates a new section when adding an answer", async () => {
    renderPage();
    await screen.findByLabelText("Secção da resposta Tema B");
    fireEvent.change(screen.getByLabelText("Tema do ticket"), { target: { value: "Tema novo" } });
    fireEvent.change(screen.getByLabelText("Secção"), { target: { value: "__nova_seccao__" } });
    fireEvent.change(await screen.findByLabelText("Nome da nova secção"), {
      target: { value: "  Pagamentos  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    await waitFor(() =>
      expect(mocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({ category: "Pagamentos" }),
      ),
    );
  });

  it("asks for a name instead of saving an empty new section", async () => {
    renderPage();
    await screen.findByLabelText("Secção da resposta Tema B");
    fireEvent.change(screen.getByLabelText("Tema do ticket"), { target: { value: "Tema novo" } });
    fireEvent.change(screen.getByLabelText("Secção"), { target: { value: "__nova_seccao__" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByText("Indique o nome da secção.")).toBeVisible();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("reuses an existing section typed with different case or accents", async () => {
    renderPage();
    await screen.findByLabelText("Secção da resposta Tema B");
    fireEvent.change(screen.getByLabelText("Tema do ticket"), { target: { value: "Tema novo" } });
    fireEvent.change(screen.getByLabelText("Secção"), { target: { value: "__nova_seccao__" } });
    fireEvent.change(await screen.findByLabelText("Nome da nova secção"), {
      target: { value: "gerais" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    await waitFor(() =>
      expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ category: "Gerais" })),
    );
  });

  it("renames a section for every answer in it", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Renomear a secção Acesso" }));
    fireEvent.change(screen.getByLabelText("Novo nome da secção Acesso"), {
      target: { value: "Acesso e contas" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        { category: "Acesso e contas" },
        "category",
        "Acesso",
      ),
    );
  });

  it("asks before merging into an existing section", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Renomear a secção Acesso" }));
    fireEvent.change(screen.getByLabelText("Novo nome da secção Acesso"), {
      target: { value: "Gerais" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText(/Já existe a secção «Gerais»/)).toBeVisible();
    expect(mocks.update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Juntar" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({ category: "Gerais" }, "category", "Acesso"),
    );
  });

  it("hides moving and renaming from people who cannot edit answers", async () => {
    mocks.canEdit = false;
    renderPage();
    await screen.findByText("Tema B");
    expect(screen.queryByLabelText("Secção da resposta Tema B")).toBeNull();
    expect(screen.queryByRole("button", { name: /Renomear a secção/ })).toBeNull();
  });
});
