export const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "handed_over", label: "Handed over to our delivery partner" },
  { value: "on_the_way", label: "On the way" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number]["value"] | "sent";

export function orderStatusLabel(status: string) {
  if (status === "sent") return "Sent to customer";
  return ORDER_STATUSES.find((item) => item.value === status)?.label || status;
}
