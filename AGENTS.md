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

## Architecture rules
- Multi-tenant: every business table has `organization_id`; RLS uses `is_org_member` / `is_org_admin` security-definer helpers. Why: strict isolation between companies.
- Signup creates profile + organization + owner membership + default pipeline stages via the `handle_new_user` trigger on auth.users (metadata `full_name`, `company_name`). Why: works even with email confirmation (no session at signup).
- Roles live in `organization_members.role` (owner/admin/sales/member), never on profiles; members can't edit their own row or grant owner, and are only added via signup trigger or `accept_pending_invites()`. Why: avoid privilege escalation.
- `subscriptions` / `subscription_events` are written only by service_role (future Cakto webhook under /api/public). Why: clients must never grant themselves access.
- Plan prices/trial live in `src/lib/plans.ts`. All CRM pages read real data (hooks in `src/lib/leads.ts`, `src/lib/crm.ts`); any future fictitious data must render `<DemoNotice />`.
- Cross-org integrity is enforced in DB by `enforce_same_org` triggers (linked lead/client/assignee must belong to the row's org; organization_id immutable); audit rows are written by `write_audit` triggers. Why: never trust client-sent IDs.
- Security scenarios live in `scripts/rls-scenarios.ts` (run with bun; creates and deletes temporary users). Re-run after any RLS/trigger change.
- Signed-in pages live under `src/routes/_authenticated/` and render inside `AppShell` (sidebar + top bar).
