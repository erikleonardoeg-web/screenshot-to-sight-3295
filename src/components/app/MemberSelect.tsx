import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembers } from "@/hooks/use-members";

export const NONE = "__none";

export function MemberSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: members = [] } = useMembers();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Sem responsável</SelectItem>
        {members.filter((m) => m.active).map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
