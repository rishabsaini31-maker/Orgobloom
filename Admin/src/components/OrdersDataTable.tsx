"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import PermissionGate from "@/components/PermissionGate";

type Order = any;

interface OrdersDataTableProps {
  orders: Order[];
  selectedOrderIds: string[];
  onToggleOrderSelection: (orderId: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onStatusUpdate: (orderId: string, status: string) => void;
  onViewOrder: (orderId: string) => void;
  onCreateShipment: (orderId: string) => void;
  updatingId: string | null;
  statusOptions: string[];
  getStatusColor: (status: string) => string;
}

export default function OrdersDataTable({
  orders,
  selectedOrderIds,
  onToggleOrderSelection,
  onToggleSelectAll,
  onStatusUpdate,
  onViewOrder,
  onCreateShipment,
  updatingId,
  statusOptions,
  getStatusColor,
}: OrdersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const allVisibleSelected =
    orders.length > 0 &&
    orders.every((order) => selectedOrderIds.includes(order.id));

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={(e) => onToggleSelectAll(e.target.checked)}
            aria-label="Select all orders"
          />
        ),
        cell: ({ row }) => {
          const order = row.original;
          const checked = selectedOrderIds.includes(order.id);
          return (
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggleOrderSelection(order.id)}
              aria-label={`Select order ${order.id?.slice(0, 8)}`}
            />
          );
        },
      },
      {
        accessorKey: "id",
        header: "Order ID",
        cell: ({ getValue }) => (
          <span className="text-xs text-gray-900 font-mono">
            {String(getValue() || "").slice(0, 8)}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ getValue }) => (
          <span className="text-xs text-gray-600">
            {(getValue() as string) || "-"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => (
          <span className="text-xs text-gray-600">
            {(getValue() as string) || "-"}
          </span>
        ),
      },
      {
        accessorKey: "itemsCount",
        header: "Items",
        cell: ({ getValue }) => (
          <span className="text-xs text-gray-600">
            {Number(getValue() || 0)}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-gray-900">
            ₹{Number(getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const order = row.original;
          return (
            <PermissionGate
              allowedRoles={["ADMIN", "SUPER_ADMIN"]}
              fallback={<span className="text-xs">{order.status}</span>}
            >
              <select
                value={order.status || "PENDING"}
                onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                disabled={updatingId === order.id}
                className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer relative z-20 appearance-none pointer-events-auto will-change-auto ${getStatusColor(
                  order.status,
                )}`}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </PermissionGate>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ getValue }) => (
          <span className="text-xs text-gray-600">
            {getValue()
              ? new Date(String(getValue())).toLocaleDateString()
              : "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const order = row.original;
          const isConfirmed = order.status === "CONFIRMED";
          const isUpdating = updatingId === order.id;

          return (
            <div className="flex gap-2">
              <button
                className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition text-xs"
                onClick={() => onViewOrder(order.id)}
              >
                View
              </button>
              {isConfirmed && (
                <PermissionGate
                  allowedRoles={["ADMIN", "SUPER_ADMIN"]}
                  fallback={null}
                >
                  <button
                    className="px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onCreateShipment(order.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Creating..." : "Create Shipment"}
                  </button>
                </PermissionGate>
              )}
            </div>
          );
        },
      },
    ],
    [
      allVisibleSelected,
      getStatusColor,
      onCreateShipment,
      onStatusUpdate,
      onToggleOrderSelection,
      onToggleSelectAll,
      onViewOrder,
      selectedOrderIds,
      statusOptions,
      updatingId,
    ],
  );

  const table = useReactTable({
    data: orders.slice(0, 50),
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto overscroll-contain [&_select]:relative [&_select]:z-10 [&_select]:touch-none">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="bg-gray-50 border-b border-gray-200"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-900 cursor-pointer"
                  onClick={
                    header.column.getCanSort()
                      ? header.column.getToggleSortingHandler()
                      : undefined
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-200 hover:bg-gray-50 transition relative"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-xs">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length > 50 && (
        <div className="px-4 py-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
          Showing 50 of {orders.length} orders
        </div>
      )}
    </div>
  );
}
