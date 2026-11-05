import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { whatsappPhone } from "@/lib/contact";

export function WhatsAppButton({ phone }: { phone: string | null }) {
  return <Button type="button" variant="outline" onClick={(e) => {
    e.stopPropagation();
    const number = whatsappPhone(phone);
    if (!number) { toast.error(phone ? "Telefone inválido. Confira o DDD." : "Nenhum telefone cadastrado."); return; }
    window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
  }}><MessageCircle className="text-success" /> WhatsApp</Button>;
}