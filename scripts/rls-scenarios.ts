import { createClient } from "@supabase/supabase-js";
const URL = process.env.SUPABASE_URL!, ANON = process.env.SUPABASE_PUBLISHABLE_KEY!, SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL, SR, opts);
const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, info = "") => results.push([name, ok, info]);
const stamp = Date.now();
const mk = async (tag: string, company: string) => {
  const email = `rls-${tag}-${stamp}@example.com`, password = "Test-" + stamp + "!aA";
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: tag, company_name: company } });
  if (error) throw error;
  const c = createClient(URL, ANON, opts);
  const s = await c.auth.signInWithPassword({ email, password }); if (s.error) throw s.error;
  return { id: data.user.id, email, c };
};
const ids: string[] = [];
try {
  const A = await mk("ownerA", "Empresa A"); ids.push(A.id);
  const B = await mk("ownerB", "Empresa B"); ids.push(B.id);
  const orgA = (await A.c.from("organization_members").select("organization_id").single()).data!.organization_id;
  const orgB = (await B.c.from("organization_members").select("organization_id").single()).data!.organization_id;
  check("Cadastro cria empresa, dono e 6 etapas", (await A.c.from("pipeline_stages").select("id").eq("organization_id", orgA)).data?.length === 6);
  check("Cadastro cria teste de 7 dias", !!(await A.c.from("subscriptions").select("status").eq("organization_id", orgA).single()).data);

  const leadB = (await B.c.from("leads").insert({ organization_id: orgB, name: "Lead secreto B" }).select("id").single()).data!.id;
  const leadA = (await A.c.from("leads").insert({ organization_id: orgA, name: "Lead A" }).select("id").single()).data!.id;

  // A
  const aSeesB = (await A.c.from("leads").select("id").eq("id", leadB)).data ?? [];
  check("A: Empresa A não vê leads da Empresa B", aSeesB.length === 0);
  // D
  const anon = createClient(URL, ANON, opts);
  const anonLeads = await anon.from("leads").select("id");
  check("D: Visitante não autenticado não lê dados", (anonLeads.data ?? []).length === 0, anonLeads.error?.message ?? "");
  // E
  const ins = await A.c.from("leads").insert({ organization_id: orgB, name: "invasão" });
  check("E: A não cria lead na empresa B trocando o ID", !!ins.error, ins.error?.message);
  const upd = await A.c.from("leads").update({ name: "hack" }).eq("id", leadB).select("id");
  check("E: A não edita lead da empresa B", (upd.data ?? []).length === 0);
  const mv = await A.c.from("leads").update({ organization_id: orgB }).eq("id", leadA);
  check("E: A não move seu lead para a empresa B", !!mv.error, mv.error?.message);
  // G
  const tsk = await A.c.from("tasks").insert({ organization_id: orgA, title: "x", lead_id: leadB });
  check("G: Tarefa não pode apontar para lead de outra empresa", !!tsk.error, tsk.error?.message);
  const asg = await A.c.from("leads").update({ assigned_to: B.id }).eq("id", leadA);
  check("G: Responsável precisa ser membro da empresa", !!asg.error, asg.error?.message);

  // Team: invite employee E to A
  const Eemail = `rls-emp-${stamp}@example.com`;
  const inv = await A.c.from("organization_invites").insert({ organization_id: orgA, email: Eemail, role: "member" });
  check("C: Dono convida funcionário", !inv.error, inv.error?.message);
  const { data: eu } = await admin.auth.admin.createUser({ email: Eemail, password: "Test-" + stamp + "!aA", email_confirm: true, user_metadata: { full_name: "Func" } });
  ids.push(eu.user!.id);
  const E = createClient(URL, ANON, opts); await E.auth.signInWithPassword({ email: Eemail, password: "Test-" + stamp + "!aA" });
  const acc = await E.rpc("accept_pending_invites");
  check("C: Convite aceito associa funcionário", acc.data === 1, acc.error?.message);
  const empRow = (await E.from("organization_members").select("id, role").eq("user_id", eu.user!.id).single()).data!;
  // F
  const self = await E.from("organization_members").update({ role: "admin" }).eq("id", empRow.id).select("id");
  check("F: Funcionário não se promove a administrador", (self.data ?? []).length === 0);
  const selfJoin = await B.c.from("organization_members").insert({ organization_id: orgA, user_id: B.id, role: "admin" });
  check("F: Ninguém se adiciona a outra empresa", !!selfJoin.error, selfJoin.error?.message);
  // B
  const sub = (await E.from("subscriptions").select("id")).data ?? [];
  check("B: Funcionário não vê assinatura", sub.length === 0);
  const orgEdit = await E.from("organizations").update({ name: "x" }).eq("id", orgA).select("id");
  check("B: Funcionário não altera dados da empresa", (orgEdit.data ?? []).length === 0);
  const empInv = await E.from("organization_invites").insert({ organization_id: orgA, email: "z@example.com" });
  check("B: Funcionário não convida pessoas", !!empInv.error);
  // C
  const promote = await A.c.from("organization_members").update({ role: "admin" }).eq("id", empRow.id).select("id");
  check("C: Dono promove funcionário", (promote.data ?? []).length === 1, promote.error?.message);
  const deact = await A.c.from("organization_members").update({ active: false }).eq("id", empRow.id).select("id");
  check("C: Dono desativa funcionário", (deact.data ?? []).length === 1);
  const after = (await E.from("leads").select("id")).data ?? [];
  check("C: Funcionário desativado perde acesso", after.length === 0);
  const toOwner = await A.c.from("organization_members").update({ role: "owner" }).eq("id", empRow.id).select("id");
  check("F: Ninguém concede papel de proprietário", (toOwner.data ?? []).length === 0);
} finally {
  for (const id of ids) {
    const { data } = await admin.from("organizations").select("id").eq("owner_id", id);
    await admin.auth.admin.deleteUser(id);
    for (const o of data ?? []) { await admin.from("audit_logs").delete().eq("organization_id", o.id); await admin.from("organizations").delete().eq("id", o.id); }
  }
}
for (const [n, ok, i] of results) console.log(ok ? "PASS" : "FAIL", n, ok ? "" : i);
