export function whatsappPhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (/^[1-9]\d{9,10}$/.test(digits)) return `55${digits}`;
  if (/^55[1-9]\d{9,10}$/.test(digits)) return digits;
  if ((phone ?? "").trim().startsWith("+") && /^[1-9]\d{7,14}$/.test(digits)) return digits;
  return null;
}
export function contactError(phone: string | null, email: string | null) {
  if (phone && !whatsappPhone(phone)) return "Informe um telefone válido com DDD ou código internacional.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Informe um e-mail válido.";
  return null;
}
export function moneyValue(value: string) {
  const raw = value.trim();
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : NaN;
}
export function isOverdue(task: { status: string; due_at: string | null }, now = Date.now()) {
  return ["pendente", "em_andamento"].includes(task.status) && !!task.due_at && new Date(task.due_at).getTime() < now;
}