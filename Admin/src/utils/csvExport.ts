export interface CsvOrderRow {
  id: string;
  customerName?: string;
  email?: string;
  itemsCount?: number;
  total?: number;
  status?: string;
  createdAt?: string;
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function exportOrdersToCsv(orders: CsvOrderRow[], fileName = "orders") {
  const headers = [
    "Order ID",
    "Customer Name",
    "Email",
    "Items",
    "Total",
    "Status",
    "Date",
  ];

  const rows = orders.map((order) => [
    order.id,
    order.customerName || "",
    order.email || "",
    order.itemsCount || 0,
    order.total || 0,
    order.status || "",
    order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().split("T")[0];

  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}-${date}.csv`);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
