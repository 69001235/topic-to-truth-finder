import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), verify: vi.fn(), session: vi.fn(), user: vi.fn(), update: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => mocks.navigate,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { verifyOtp: mocks.verify, getSession: mocks.session, getUser: mocks.user, updateUser: mocks.update } } }));
import { Route } from "@/routes/auth_.convite";

function renderPage() {
  const Page = Route.options.component as React.ComponentType;
  render(<Page />);
}
describe("Invitation acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/auth/convite?token_hash=test-invite&type=invite");
    mocks.verify.mockResolvedValue({ error: null });
    mocks.session.mockResolvedValue({ data: { session: {} }, error: null });
    mocks.user.mockResolvedValue({ data: { user: { id: "invited-user" } }, error: null });
    mocks.update.mockResolvedValue({ error: null });
  });
  it("verifies the invitation, sets the password and opens search", async () => {
    renderPage();
    fireEvent.change(await screen.findByLabelText("Nova palavra-passe"), { target: { value: "test-password-123" } });
    fireEvent.change(screen.getByLabelText("Confirmar palavra-passe"), { target: { value: "test-password-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar e entrar" }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/" }));
    expect(mocks.verify).toHaveBeenCalledWith({ token_hash: "test-invite", type: "invite" });
    expect(mocks.update).toHaveBeenCalledWith({ password: "test-password-123" });
    expect(window.location.search).toBe("");
  });
  it("does not update the password or grant entry for an expired invitation", async () => {
    mocks.verify.mockResolvedValue({ error: new Error("expired") });
    renderPage();
    await screen.findByRole("alert");
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});