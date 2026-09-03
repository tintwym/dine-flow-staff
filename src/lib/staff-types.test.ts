import { describe, expect, it } from "vitest";
import { computeAnalytics, flattenOrderItems } from "@/lib/staff-api";
import { nextOrderStatus, tabsForRole } from "@/lib/staff-types";
import type { StaffOrder } from "@/lib/staff-types";

describe("nextOrderStatus", () => {
  it("advances along the kitchen flow", () => {
    expect(nextOrderStatus("NEW")).toBe("CONFIRMED");
    expect(nextOrderStatus("READY")).toBe("SERVED");
    expect(nextOrderStatus("COMPLETED")).toBeNull();
  });
});

describe("tabsForRole", () => {
  it("gives kitchen a focused set", () => {
    expect(tabsForRole("kitchen").map((t) => t.id)).toEqual([
      "kitchen",
      "inventory",
      "history",
    ]);
  });

  it("gives cashier bills and pay tools only", () => {
    expect(tabsForRole("cashier").map((t) => t.id)).toEqual([
      "floor",
      "order",
      "history",
    ]);
  });

  it("includes menu admin for managers", () => {
    expect(tabsForRole("manager").some((t) => t.id === "menu")).toBe(true);
  });
});

describe("computeAnalytics", () => {
  const sample: StaffOrder[] = [
    {
      id: 1,
      table_number: 1,
      timestamp: Date.now(),
      status: "COMPLETED",
      subtotal: 1000,
      tax: 80,
      tip: 0,
      total_amount: 1080,
      payment_method: "CASH",
      is_paid: true,
      guest_name: "A",
      guest_phone: "",
      special_notes: "",
      order_items: [
        {
          id: 10,
          order_id: 1,
          menu_item_id: 1,
          menu_item_name: "Mohinga",
          price: 4500,
          quantity: 2,
          customization: "",
          status: "COMPLETED",
        },
      ],
    },
  ];

  it("sums revenue and top dishes", () => {
    const stats = computeAnalytics(sample);
    expect(stats.orderCount).toBe(1);
    expect(stats.revenue).toBe(1080);
    expect(stats.topDishes[0]?.name).toBe("Mohinga");
    expect(flattenOrderItems(sample)).toHaveLength(1);
  });
});
