import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Permissoes = {
  signedIn: boolean;
  email: string;
  admin: boolean;
  search: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

const none: Permissoes = { signedIn: false, email: "", admin: false, search: false, create: false, edit: false, delete: false };

/** The signed-in person's row in `utilizadores`; admins implicitly hold every permission. */
export const permissoesQuery = queryOptions({
  queryKey: ["permissoes"],
  queryFn: async (): Promise<Permissoes> => {
    const { data: s } = await supabase.auth.getSession();
    const email = s.session?.user.email?.toLowerCase() ?? "";
    if (!s.session) return none;
    const { data } = await supabase.from("utilizadores").select("*").eq("email", email).maybeSingle();
    if (!data) return { ...none, signedIn: true, email };
    const a = data.is_admin;
    return {
      signedIn: true,
      email,
      admin: a,
      search: a || data.can_search,
      create: a || data.can_create,
      edit: a || data.can_edit,
      delete: a || data.can_delete,
    };
  },
});
