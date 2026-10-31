import { describe, expect, it } from "vitest";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

describe("plans", () => {
  it("Start costs R$ 39,90", () => expect(PLANS.find((p) => p.id === "start")?.priceCents).toBe(3990));
  it("Pro costs R$ 59,90", () => expect(PLANS.find((p) => p.id === "pro")?.priceCents).toBe(5990));
  it("trial is 7 days", () => expect(TRIAL_DAYS).toBe(7));
});
