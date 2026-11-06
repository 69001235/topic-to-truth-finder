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
- Public authentication UI only signs in existing accounts; provision new accounts through Cloud invitations and authorize the same email in `utilizadores` to keep registration separate from data permissions.
