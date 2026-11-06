import { describe, expect, it } from "vitest";
import { contactError, whatsappPhone, moneyValue, isOverdue } from "@/lib/contact";
import { dashboardMetrics } from "@/lib/dashboard";
describe("CRM Phase 4 rules", () => {
  it("opens Brazilian phone with DDD through the official country format", () => {
    expect(whatsappPhone("(11) 99999-9999")).toBe("5511999999999");
    expect(whatsappPhone("+55 11 99999-9999")).toBe("5511999999999");
    expect(whatsappPhone(null)).toBeNull();
    expect(whatsappPhone("123")).toBeNull();
  });
  it("rejects malformed phone and email", () => {
    expect(contactError("123",null)).not.toBeNull();
    expect(contactError(null,"invalid@domain")).not.toBeNull();
    expect(contactError("11999999999","lead@example.com")).toBeNull();
  });
  it("rejects negative and invalid budget amounts", () => {
    expect(moneyValue("1.234,56")).toBe(1234.56);
    expect(moneyValue("1234.56")).toBe(1234.56);
    expect(moneyValue("-10")).toBeNaN();
    expect(moneyValue("abc")).toBeNaN();
  });
  it("only pending or in-progress past tasks are overdue", () => {
    const now = Date.parse("2026-11-05T12:00:00Z");
    for (const status of ["pendente","em_andamento"]) expect(isOverdue({status,due_at:"2026-11-04T12:00:00Z"},now)).toBe(true);
    for (const status of ["cancelada","concluida"]) expect(isOverdue({status,due_at:"2026-11-04T12:00:00Z"},now)).toBe(false);
    expect(isOverdue({status:"pendente",due_at:null},now)).toBe(false);
  });
  it("uses configured won/lost markers and only real values", () => {
    const result = dashboardMetrics([{stage:"custom_01",created_at:"2026-11-01",updated_at:"2026-11-04",estimated_value:150}], [{status:"enviado",amount:250,budget_date:"2026-11-02"}], [], [{key:"custom_01",is_won:true,is_lost:false}],Date.parse("2026-11-05"),7);
    expect(result.won).toBe(1); expect(result.saleValue).toBe(150); expect(result.budgetValue).toBe(250);
    expect(dashboardMetrics([],[],[],[],Date.now(),0).saleValue).toBeNull();
  });
});