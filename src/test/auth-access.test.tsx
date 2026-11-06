import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  navigate: vi.fn(),
  oauth: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => mocks.navigate,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signInWithPassword: mocks.signIn, signUp: mocks.signUp } },
}));
vi.mock("@/integrations/lovable/index", () => ({ lovable: { auth: { signInWithOAuth: mocks.oauth } } }));

import { Route } from "@/routes/auth";

describe("Existing-account access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signIn.mockResolvedValue({ error: null });
  });

  it("signs in an existing administrator and returns to search without registering an account", async () => {
    const Page = Route.options.component as React.ComponentType;
    render(<Page />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "admin@example.test" } });
    fireEvent.change(screen.getByPlaceholderText("Palavra-passe"), { target: { value: "test-only-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar", exact: true }));
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith({ email: "admin@example.test", password: "test-only-password" }));
    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/" });
  });
});