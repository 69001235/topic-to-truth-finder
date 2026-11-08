import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), insert: vi.fn(), lookup: vi.fn(), invite: vi.fn(), handler: undefined as undefined | ((input: any) => Promise<any>), validator: undefined as undefined | ((input: unknown) => any) }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, inputValidator: (fn: (input: unknown) => unknown) => { mocks.validator = fn; return builder; }, handler: (fn: typeof mocks.handler) => { mocks.handler = fn; return fn; } };
  return builder;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { auth: { admin: { inviteUserByEmail: mocks.invite } } } }));
import "@/lib/utilizadores.functions";

const context = { supabase: { rpc: mocks.rpc, from: () => ({ insert: mocks.insert, select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }) }) } };
function run(email = "person@example.test", reenviar = false) {
  if (!mocks.handler) throw new Error("Missing handler");
  return mocks.handler({ data: { email, reenviar }, context });
}

describe("Authorization and invitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.lookup.mockResolvedValue({ data: { email: "person@example.test" }, error: null });
    mocks.invite.mockResolvedValue({ error: null });
  });
  it("authorizing an email also sends its invitation", async () => {
    expect(await run()).toMatchObject({ status: "sent" });
    expect(mocks.insert).toHaveBeenCalledWith({ email: "person@example.test" });
    expect(mocks.invite).toHaveBeenCalledWith("person@example.test", { redirectTo: "https://topic-to-truth-finder.lovable.app/auth/convite" });
    const inserted = mocks.insert.mock.invocationCallOrder[0];
    const invited = mocks.invite.mock.invocationCallOrder[0];
    if (inserted === undefined || invited === undefined) throw new Error("Missing authorization or invitation");
    expect(inserted).toBeLessThan(invited);
  });
  it("only an administrator can authorize or send invitations", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await expect(run()).rejects.toThrow("Só os administradores");
    expect(mocks.rpc).toHaveBeenCalledWith("tem_permissao", { _perm: "admin" });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.invite).not.toHaveBeenCalled();
  });
  it("does not send when authorization fails", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "23505" } });
    await expect(run()).rejects.toThrow("já está autorizado");
    expect(mocks.invite).not.toHaveBeenCalled();
  });
  it("reports an email failure without removing authorization", async () => {
    mocks.invite.mockResolvedValue({ error: { status: 429 } });
    expect(await run()).toMatchObject({ status: "failed" });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });
  it("retries only for an authorized email without changing its permissions", async () => {
    expect(await run("person@example.test", true)).toMatchObject({ status: "sent" });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.invite).toHaveBeenCalledTimes(1);
    mocks.lookup.mockResolvedValue({ data: null, error: null });
    await expect(run("other@example.test", true)).rejects.toThrow("Autorize primeiro");
    expect(mocks.invite).toHaveBeenCalledTimes(1);
  });
  it("keeps existing accounts usable without attempting registration", async () => {
    mocks.invite.mockResolvedValue({ error: { code: "email_exists" } });
    expect(await run()).toMatchObject({ status: "existing" });
  });
  it("normalizes and validates email input", () => {
    expect(mocks.validator?.({ email: " Person@Example.Test " })).toEqual({ email: "person@example.test", reenviar: false });
    expect(() => mocks.validator?.({ email: "invalid" })).toThrow();
  });
});