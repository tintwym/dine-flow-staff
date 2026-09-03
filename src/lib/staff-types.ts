export type StaffRole = "kitchen" | "floor" | "cashier" | "manager";

export type StaffProfile = {
  user_id: string;
  role: StaffRole;
  display_name: string;
  pin_code: string;
};

export type StaffTab =
  | "kitchen"
  | "floor"
  | "order"
  | "history"
  | "inventory"
  | "menu"
  | "analytics"
  | "reservations"
  | "loyalty"
  | "feedback";

export type TableRow = {
  table_number: number;
  capacity: number;
  status: string;
  active_order_id: number | null;
  qr_code_code: string;
};

export type StaffOrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_item_name: string;
  price: number;
  quantity: number;
  customization: string;
  status: string;
};

export type StaffOrder = {
  id: number;
  table_number: number;
  timestamp: number;
  status: string;
  subtotal: number;
  tax: number;
  tip: number;
  total_amount: number;
  payment_method: string;
  is_paid: boolean;
  guest_name: string;
  guest_phone: string;
  special_notes: string;
  order_items?: StaffOrderItem[];
};

export type InventoryRow = {
  id: number;
  name: string;
  category: string;
  current_quantity: number;
  unit: string;
  min_threshold: number;
  reorder_quantity: number;
  unit_cost: number;
  last_updated_timestamp: number;
};

export type ReservationRow = {
  id: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests: string;
  confirmation_code: string;
  status: string;
};

export type LoyaltyRow = {
  id: number;
  name: string;
  phone: string;
  email: string;
  points: number;
  tier: string;
  total_spent: number;
  joined_timestamp: number;
};

export type FeedbackRow = {
  id: number;
  order_id: number | null;
  guest_name: string;
  overall_rating: number;
  food_quality_rating: number;
  service_speed_rating: number;
  comment: string;
  timestamp: number;
};

export type MenuAdminRow = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  is_spicy: boolean;
  preparation_time_minutes: number;
  is_available: boolean;
  current_stock: number;
  low_stock_threshold: number;
  sales_count: number;
};

export const ORDER_STATUS_FLOW = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
] as const;

export function nextOrderStatus(current: string): string | null {
  const i = ORDER_STATUS_FLOW.indexOf(
    current as (typeof ORDER_STATUS_FLOW)[number],
  );
  if (i < 0 || i >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[i + 1];
}

export function tabsForRole(role: StaffRole): { id: StaffTab; label: string }[] {
  switch (role) {
    case "kitchen":
      return [
        { id: "kitchen", label: "Kitchen" },
        { id: "inventory", label: "Inventory" },
        { id: "history", label: "History" },
      ];
    case "floor":
      return [
        { id: "floor", label: "Floor" },
        { id: "order", label: "Order" },
        { id: "kitchen", label: "Kitchen" },
        { id: "history", label: "History" },
      ];
    case "cashier":
      return [
        { id: "floor", label: "Bills" },
        { id: "order", label: "Order" },
        { id: "history", label: "History" },
      ];
    case "manager":
      return [
        { id: "kitchen", label: "Kitchen" },
        { id: "floor", label: "Floor" },
        { id: "order", label: "Order" },
        { id: "menu", label: "Menu" },
        { id: "inventory", label: "Inventory" },
        { id: "analytics", label: "Analytics" },
        { id: "reservations", label: "Reservations" },
        { id: "loyalty", label: "Loyalty" },
        { id: "feedback", label: "Feedback" },
        { id: "history", label: "History" },
      ];
  }
}
