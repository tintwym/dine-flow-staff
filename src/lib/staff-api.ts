import { money, type CartLine, type MenuItem } from "./menu";
import { resolveMenuImage } from "./cloudinary";
import { supabase } from "./supabase";
import type {
  FeedbackRow,
  InventoryRow,
  LoyaltyRow,
  MenuAdminRow,
  ReservationRow,
  StaffOrder,
  StaffOrderItem,
  TableRow,
} from "./staff-types";
import { nextOrderStatus } from "./staff-types";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

const ORDER_SELECT =
  "id, table_number, timestamp, status, subtotal, tax, tip, total_amount, payment_method, is_paid, guest_name, guest_phone, special_notes, order_items(id, order_id, menu_item_id, menu_item_name, price, quantity, customization, status)";

export async function fetchStaffOrders(limit = 80): Promise<StaffOrder[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("orders")
    .select(ORDER_SELECT)
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffOrder[];
}

export async function fetchActiveKitchenOrders(): Promise<StaffOrder[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("orders")
    .select(ORDER_SELECT)
    .not("status", "in", "(COMPLETED,CANCELLED,SERVED)")
    .order("timestamp", { ascending: true })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffOrder[];
}

export async function advanceOrderStatus(order: StaffOrder): Promise<void> {
  const client = requireClient();
  const next = nextOrderStatus(order.status);
  if (!next) return;

  const { error } = await client
    .from("orders")
    .update({ status: next })
    .eq("id", order.id);
  if (error) throw new Error(error.message);

  await client
    .from("order_items")
    .update({ status: next })
    .eq("order_id", order.id);

  if (next === "COMPLETED" || next === "SERVED") {
    await client
      .from("restaurant_tables")
      .update({
        status: next === "COMPLETED" ? "AVAILABLE" : "OCCUPIED",
        active_order_id: next === "COMPLETED" ? null : order.id,
      })
      .eq("table_number", order.table_number);
  }
}

export async function markOrderPaid(
  orderId: number,
  method: "CASH" | "COUNTER" | "CARD_DEMO" = "CASH",
): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from("orders")
    .update({ is_paid: true, payment_method: method })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function fetchTables(): Promise<TableRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("restaurant_tables")
    .select("*")
    .order("table_number", { ascending: true });
  if (error) throw new Error(error.message);
  if (data?.length) return data as TableRow[];

  // Ensure T1–T10 exist for floor map
  const seed = Array.from({ length: 10 }, (_, i) => ({
    table_number: i + 1,
    capacity: i < 4 ? 2 : i < 8 ? 4 : 8,
    status: "AVAILABLE",
    active_order_id: null,
    qr_code_code: `TBL-${i + 1}`,
  }));
  await client.from("restaurant_tables").upsert(seed);
  return seed as TableRow[];
}

export async function updateTableStatus(
  tableNumber: number,
  status: string,
  activeOrderId: number | null = null,
): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("restaurant_tables").upsert({
    table_number: tableNumber,
    status,
    active_order_id: activeOrderId,
    qr_code_code: `TBL-${tableNumber}`,
    capacity: 4,
  });
  if (error) throw new Error(error.message);
}

export async function placeStaffOrder(
  tableNumber: number,
  cart: CartLine[],
  guestName = "Walk-in",
  paymentMethod: "CASH" | "COUNTER" | "CARD_DEMO" = "COUNTER",
  isPaid = false,
) {
  const client = requireClient();
  if (!cart.length) throw new Error("Cart is empty");

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + tax;
  const timestamp = Date.now();

  const { data: order, error: orderError } = await client
    .from("orders")
    .insert({
      table_number: tableNumber,
      timestamp,
      status: "NEW",
      subtotal,
      tax,
      tip: 0,
      total_amount: total,
      payment_method: paymentMethod,
      is_paid: isPaid,
      guest_name: guestName,
      guest_phone: "",
      special_notes: "Staff order",
      is_queued_offline: false,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Could not create order");
  }

  const lines = cart.map((line) => ({
    order_id: order.id,
    menu_item_id: line.menuItemId,
    menu_item_name: line.title,
    price: line.unitPrice,
    quantity: line.quantity,
    customization: [
      line.spiceLevel !== "Normal" ? `Spice: ${line.spiceLevel}` : null,
      line.note || null,
    ]
      .filter(Boolean)
      .join(" · "),
    status: "NEW",
  }));

  const { error: itemsError } = await client.from("order_items").insert(lines);
  if (itemsError) throw new Error(itemsError.message);

  await updateTableStatus(tableNumber, "OCCUPIED", order.id as number);

  return {
    orderId: order.id as number,
    total,
    label: money(total),
  };
}

export async function fetchMenuForStaff(): Promise<MenuItem[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("menu_items")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as MenuItem[]).map((row) => ({
    ...row,
    image_url: resolveMenuImage(row.image_url, { width: 480 }),
  }));
}

export async function fetchMenuAdmin(): Promise<MenuAdminRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("menu_items")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MenuAdminRow[];
}

export async function upsertMenuItem(
  item: Partial<MenuAdminRow> & { title: string; category: string; price: number },
): Promise<void> {
  const client = requireClient();
  const payload = {
    title: item.title,
    description: item.description ?? "",
    category: item.category,
    price: item.price,
    image_url: item.image_url ?? "",
    is_vegetarian: item.is_vegetarian ?? false,
    is_gluten_free: item.is_gluten_free ?? false,
    is_spicy: item.is_spicy ?? false,
    preparation_time_minutes: item.preparation_time_minutes ?? 12,
    is_available: item.is_available ?? true,
    current_stock: item.current_stock ?? 20,
    low_stock_threshold: item.low_stock_threshold ?? 5,
  };
  if (item.id) {
    const { error } = await client.from("menu_items").update(payload).eq("id", item.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await client.from("menu_items").insert(payload);
    if (error) throw new Error(error.message);
  }
}

export async function deleteMenuItem(id: number): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("menu_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchInventory(): Promise<InventoryRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("inventory_items")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryRow[];
}

export async function upsertInventoryItem(
  item: Partial<InventoryRow> & { name: string; category: string },
): Promise<void> {
  const client = requireClient();
  const payload = {
    name: item.name,
    category: item.category,
    current_quantity: item.current_quantity ?? 0,
    unit: item.unit ?? "units",
    min_threshold: item.min_threshold ?? 0,
    reorder_quantity: item.reorder_quantity ?? 0,
    unit_cost: item.unit_cost ?? 0,
    last_updated_timestamp: Date.now(),
  };
  if (item.id) {
    const { error } = await client
      .from("inventory_items")
      .update(payload)
      .eq("id", item.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await client.from("inventory_items").insert(payload);
    if (error) throw new Error(error.message);
  }
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("inventory_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchReservations(): Promise<ReservationRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("reservations")
    .select("*")
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReservationRow[];
}

export async function upsertReservation(
  row: Partial<ReservationRow> & {
    guest_name: string;
    reservation_date: string;
    reservation_time: string;
    party_size: number;
  },
): Promise<void> {
  const client = requireClient();
  const code =
    row.confirmation_code ||
    `DF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const payload = {
    guest_name: row.guest_name,
    guest_phone: row.guest_phone ?? "",
    guest_email: row.guest_email ?? "",
    party_size: row.party_size,
    reservation_date: row.reservation_date,
    reservation_time: row.reservation_time,
    special_requests: row.special_requests ?? "",
    confirmation_code: code,
    status: row.status ?? "CONFIRMED",
  };
  if (row.id) {
    const { error } = await client.from("reservations").update(payload).eq("id", row.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await client.from("reservations").insert(payload);
    if (error) throw new Error(error.message);
  }
}

export async function deleteReservation(id: number): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("reservations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchLoyalty(): Promise<LoyaltyRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("loyalty_members")
    .select("*")
    .order("points", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as LoyaltyRow[];
}

export async function upsertLoyalty(
  row: Partial<LoyaltyRow> & { name: string },
): Promise<void> {
  const client = requireClient();
  const payload = {
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    points: row.points ?? 0,
    tier: row.tier ?? "SILVER",
    total_spent: row.total_spent ?? 0,
    joined_timestamp: row.joined_timestamp ?? Date.now(),
  };
  if (row.id) {
    const { error } = await client.from("loyalty_members").update(payload).eq("id", row.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await client.from("loyalty_members").insert(payload);
    if (error) throw new Error(error.message);
  }
}

export async function fetchFeedback(): Promise<FeedbackRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("feedback")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as FeedbackRow[];
}

export async function submitFeedback(row: {
  order_id?: number | null;
  guest_name: string;
  overall_rating: number;
  food_quality_rating: number;
  service_speed_rating: number;
  comment?: string;
}): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("feedback").insert({
    order_id: row.order_id ?? null,
    guest_name: row.guest_name,
    overall_rating: row.overall_rating,
    food_quality_rating: row.food_quality_rating,
    service_speed_rating: row.service_speed_rating,
    comment: row.comment ?? "",
    timestamp: Date.now(),
  });
  if (error) throw new Error(error.message);
}

export function subscribeStaffRealtime(onChange: () => void): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel("staff-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "order_items" },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "restaurant_tables" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase?.removeChannel(channel);
  };
}

export function flattenOrderItems(orders: StaffOrder[]): StaffOrderItem[] {
  return orders.flatMap((o) =>
    (o.order_items ?? []).map((i) => ({ ...i, order_id: o.id })),
  );
}

export function computeAnalytics(orders: StaffOrder[]) {
  const paidOrDone = orders.filter(
    (o) => o.is_paid || ["COMPLETED", "SERVED"].includes(o.status),
  );
  const revenue = paidOrDone.reduce((s, o) => s + (o.total_amount || 0), 0);
  const avgCheck = paidOrDone.length ? revenue / paidOrDone.length : 0;
  const dishMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of paidOrDone) {
    for (const item of o.order_items ?? []) {
      const prev = dishMap.get(item.menu_item_name) ?? {
        name: item.menu_item_name,
        qty: 0,
        revenue: 0,
      };
      prev.qty += item.quantity;
      prev.revenue += item.price * item.quantity;
      dishMap.set(item.menu_item_name, prev);
    }
  }
  const topDishes = [...dishMap.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);
  return {
    orderCount: paidOrDone.length,
    revenue,
    avgCheck,
    unpaidOpen: orders.filter((o) => !o.is_paid && !["COMPLETED", "CANCELLED"].includes(o.status)).length,
    topDishes,
  };
}
