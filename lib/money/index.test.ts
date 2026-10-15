import { describe, expect, it } from "vitest";

import { formatCurrencySymbol, formatPrice } from "@/lib/money";

describe("money formatting", () => {
  it("formats a shop price in the default locale", () => {
    expect(formatPrice({ amount: "12.5", currencyCode: "USD" })).toBe("$12.50");
    expect(formatCurrencySymbol("EUR")).toBe("€");
  });
});
