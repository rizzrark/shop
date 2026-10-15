import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cacheKey, cacheTag, clearCache, revalidateTag, withCache } from "@/lib/cache/server";

describe("tagged cache", () => {
  beforeEach(() => {
    clearCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the first result until a tag is invalidated", async () => {
    let loads = 0;
    const load = () =>
      withCache(
        cacheKey("product", { handle: "hat" }),
        "max",
        ["products", "product-hat"],
        async () => {
          loads += 1;
          cacheTag("product-1");
          return { title: "Hat" };
        },
      );

    await expect(load()).resolves.toEqual({ title: "Hat" });
    await expect(load()).resolves.toEqual({ title: "Hat" });
    expect(loads).toBe(1);

    revalidateTag("product-1", { expire: 0 });
    await expect(load()).resolves.toEqual({ title: "Hat" });
    expect(loads).toBe(2);
  });

  it("drops every entry that carries the invalidated tag", async () => {
    await withCache("a", "max", ["products-index"], async () => "a");
    await withCache("b", "max", ["products-index", "product-hat"], async () => "b");
    await withCache("c", "max", ["pages"], async () => "c");

    revalidateTag("products-index", { expire: 0 });

    let loads = 0;
    await withCache("a", "max", ["products-index"], async () => {
      loads += 1;
      return "a2";
    });
    await withCache("c", "max", ["pages"], async () => "c");
    expect(loads).toBe(1);
  });

  it("expires a minutes entry after one hour and keeps a max entry", async () => {
    let minutesLoads = 0;
    let maxLoads = 0;
    const minutes = () =>
      withCache("grid", "minutes", ["products-index"], async () => {
        minutesLoads += 1;
        return "grid";
      });
    const max = () =>
      withCache("product", "max", ["products"], async () => {
        maxLoads += 1;
        return "product";
      });

    await minutes();
    await max();
    vi.advanceTimersByTime(60 * 60 * 1000);
    await minutes();
    await max();

    expect(minutesLoads).toBe(2);
    expect(maxLoads).toBe(1);
  });

  it("shares one load when the same key is read concurrently", async () => {
    let loads = 0;
    const load = () =>
      withCache("shared", "max", ["products"], async () => {
        loads += 1;
        await Promise.resolve();
        return "ok";
      });

    await expect(Promise.all([load(), load()])).resolves.toEqual(["ok", "ok"]);
    expect(loads).toBe(1);
  });

  it("keeps a nested entry's tags off the outer entry", async () => {
    await withCache("outer", "max", ["collections"], async () => {
      await withCache("inner", "max", ["products"], async () => {
        cacheTag("product-1");
        return "inner";
      });
      return "outer";
    });

    revalidateTag("product-1", { expire: 0 });
    let outerLoads = 0;
    await withCache("outer", "max", ["collections"], async () => {
      outerLoads += 1;
      return "outer";
    });
    expect(outerLoads).toBe(0);
  });

  it("caches an empty result", async () => {
    let loads = 0;
    const load = () =>
      withCache("missing", "max", ["products"], async () => {
        loads += 1;
        return undefined;
      });

    await expect(load()).resolves.toBeUndefined();
    await expect(load()).resolves.toBeUndefined();
    expect(loads).toBe(1);
  });

  it("rejects a tag recorded outside a cache scope", () => {
    expect(() => cacheTag("products")).toThrow(/cache scope/);
  });
});
