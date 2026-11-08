<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All replies (manual + team-added) live in the `respostas` table (`ref` = manual number, `category`); src/data/templates.json is only the original seed and test fixture — so every reply is editable/deletable.
- Access is an email allow-list in `utilizadores` (per-permission flags, admin implies all), enforced by RLS via `tem_permissao()`; the UI only hides buttons.
- Public authentication UI only signs in existing accounts; administrator authorization and Cloud invitations run together through an authenticated server function that checks `tem_permissao('admin')` before loading the privileged client. Data permissions remain in `utilizadores` so an account alone grants no application access.
- Invitation emails return to the published `/auth/convite` page for password setup; keep the server-controlled redirect aligned with the primary app domain so recipients never land on the administrator's preview or a caller-provided URL.
