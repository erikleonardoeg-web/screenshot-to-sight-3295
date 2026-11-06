import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePipeline } from "@/lib/pipeline";
import { useCurrentOrg } from "@/hooks/use-organization";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmDelete } from "./ConfirmDelete";
type Stage = Database["public"]["Tables"]["pipeline_stages"]["Row"];
export function PipelineSettings() {
  const { data: rows = [], isLoading, error } = usePipeline();
  const { data: ctx } = useCurrentOrg();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [name,setName] = useState("");
  const admin = ctx?.role === "owner" || ctx?.role === "admin";
  async function update(id: string, values: Partial<Stage>) {
    const { data, error } = await supabase.from("pipeline_stages").update(values).eq("id",id).select("id");
    if (error) throw error;
    if (!data.length) throw new Error("Acesso negado.");
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try { await action(); toast.success("Etapas atualizadas."); } catch(e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setBusy(false); qc.invalidateQueries({ queryKey: ["pipeline"] }); }
  }
  return <section className="space-y-4">
    <h2 className="font-semibold">Etapas do funil</h2>
    {isLoading && <p>Carregando etapas…</p>}
    {error && <p className="text-destructive">Não foi possível carregar as etapas.</p>}
    <div className="divide-y">{rows.map((row,i) => <StageEditor key={`${row.id}-${row.name}-${row.color}-${row.active}-${row.is_won}-${row.is_lost}`} row={row} disabled={!admin || busy} onSave={(values) => run(() => update(row.id,values))} actions={<>
      <Button variant="ghost" size="icon" aria-label={`Subir ${row.name}`} disabled={!admin || busy || i === 0} onClick={() => run(async () => { const other = rows[i-1]; if (!other) return; await update(row.id,{position:other.position}); await update(other.id,{position:row.position}); })}><ArrowUp /></Button>
      <Button variant="ghost" size="icon" aria-label={`Descer ${row.name}`} disabled={!admin || busy || i === rows.length-1} onClick={() => run(async () => {const other=rows[i+1]; if (!other) return; await update(row.id,{position:other.position}); await update(other.id,{position:row.position}); })}><ArrowDown /></Button>
      {admin && <ConfirmDelete label={`Remover ${row.name}`} pending={busy} onConfirm={() => run(async () => { const {error} = await supabase.from("pipeline_stages").delete().eq("id",row.id); if(error) throw error; })} />}
    </>} />)}</div>
    {admin && <form className="flex flex-wrap gap-2" onSubmit={(e) => {
      e.preventDefault();
      const org = ctx?.organization?.id;
      if (!org) return;
      const key = Array.from({length:12},(_,i) => `custom_${String(i+1).padStart(2,"0")}` as Stage["key"]).find((k) => !rows.some((r) => r.key === k));
      if (!key) { toast.error("As 12 etapas adicionais já estão em uso."); return; }
      void run(async () => {const {error} = await supabase.from("pipeline_stages").insert({organization_id:org,key,name:name.trim(),position:Math.max(0,...rows.map((r) => r.position))+1}); if(error) throw error; setName("");});
    }}><Input className="max-w-sm" aria-label="Nome da nova etapa" required maxLength={120} placeholder="Nome da nova etapa" value={name} onChange={(e) => setName(e.target.value)} /><Button disabled={busy || !name.trim()}><Plus /> Criar etapa</Button></form>}
  </section>;
}
function StageEditor({row,disabled,onSave,actions}: {row:Stage;disabled:boolean;onSave:(values:Partial<Stage>)=>Promise<void>;actions:React.ReactNode}) {
  const [won,setWon]=useState(row.is_won);
  const [lost,setLost]=useState(row.is_lost);
  const [active,setActive]=useState(row.active);
  return <form className="grid gap-3 py-4" onSubmit={(e) => {e.preventDefault(); const f=new FormData(e.currentTarget); void onSave({name:String(f.get("name")).trim(),color:String(f.get("color")),is_won:won,is_lost:lost,active});}}>
    <div className="flex gap-2"><Input aria-label={`Nome ${row.name}`} name="name" defaultValue={row.name} required maxLength={120} disabled={disabled}/><Input aria-label={`Cor ${row.name}`} type="color" name="color" className="w-14 shrink-0 p-1" defaultValue={row.color} disabled={disabled}/></div>
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <Label className="flex items-center gap-2"><Checkbox disabled={disabled} checked={won} onCheckedChange={(v)=>{setWon(v===true); if(v) setLost(false);}}/>Venda concluída</Label>
      <Label className="flex items-center gap-2"><Checkbox disabled={disabled} checked={lost} onCheckedChange={(v)=>{setLost(v===true); if(v) setWon(false);}}/>Venda perdida</Label>
      <Label className="flex items-center gap-2"><Checkbox disabled={disabled} checked={active} onCheckedChange={(v)=>setActive(v===true)}/>Ativa</Label>
      <Button disabled={disabled} variant="outline" type="submit">Salvar etapa</Button>{actions}
    </div>
  </form>;
}