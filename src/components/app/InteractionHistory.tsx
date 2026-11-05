import { useState } from "react";
import { useInteractions, useAddInteraction, INTERACTION_TYPES } from "@/lib/interactions";
import { memberName, useMembers } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export function InteractionHistory({ leadId, clientId }: { leadId?: string; clientId?: string }) {
  const { data: rows = [], isLoading, error } = useInteractions(leadId, clientId);
  const { data: members } = useMembers();
  const add = useAddInteraction();
  const [type, setType] = useState("nota");
  const [content, setContent] = useState("");
  return <section className="space-y-3 border-t pt-4">
    <h3 className="font-semibold">Histórico de interações</h3>
    <form className="grid gap-2" onSubmit={async (e) => {
      e.preventDefault();
      try { await add.mutateAsync({ lead_id: leadId, client_id: clientId, type, content }); setContent(""); } catch { /* toast */ }
    }}>
      <Label>Tipo de interação</Label>
      <Select value={type} onValueChange={setType}><SelectTrigger aria-label="Tipo de interação"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(INTERACTION_TYPES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
      <Label htmlFor="interaction-content">Conteúdo</Label>
      <Textarea id="interaction-content" required maxLength={5000} value={content} onChange={(e) => setContent(e.target.value)} />
      <Button type="submit" className="w-fit" disabled={add.isPending || !content.trim()}>Registrar interação</Button>
    </form>
    {error ? <p className="text-sm text-destructive">Não foi possível carregar o histórico.</p> : isLoading ? <p className="text-sm text-muted-foreground">Carregando histórico…</p> : !rows.length ? <p className="text-sm text-muted-foreground">Nenhuma interação registrada.</p> : <ol className="divide-y">{rows.map((r) => <li key={r.id} className="space-y-1 py-3 text-sm">
      <p className="font-medium">{INTERACTION_TYPES[r.type as keyof typeof INTERACTION_TYPES] ?? r.type}</p>
      <p className="whitespace-pre-wrap break-words">{r.content}</p>
      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")} · {memberName(members,r.created_by)}</p>
    </li>)}</ol>}
  </section>;
}