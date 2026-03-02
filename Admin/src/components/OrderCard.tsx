import { AlertCircle, ChevronRight } from "lucide-react";
import PermissionGate from "@/components/PermissionGate";

interface OrderCardProps {
  order: any;
  onViewDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  isUpdating?: boolean;
  statusOptions: string[];
  getStatusColor: (status: string) => string;
}

/**
 * Mobile-friendly card view for displaying orders
 * Used on smaller screens as alternative to table view
 */
export function OrderCard({
  order,
  onViewDetails,
  onStatusChange,
  isUpdating = false,
  statusOptions,
  getStatusColor,
}: OrderCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition p-4 mb-3">
      {/* Order ID and Date */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-600 mb-1">Order ID</p>
          <p className="text-sm font-mono font-semibold text-gray-900">
            {order.id?.slice(0, 8)}
          </p>
        </div>
        <p className="text-xs text-gray-600 text-right">
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString()
            : "-"}
        </p>
      </div>

      {/* Customer Name and Email */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-900 leading-tight">
          {order.customerName || "-"}
        </p>
        <p className="text-xs text-gray-600 mt-1 break-words">
          {order.email || "-"}
        </p>
      </div>

      {/* Items Count and Total */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-600">Items</p>
          <p className="text-sm font-semibold text-gray-900">
            {order.itemsCount || 0}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg font-bold text-gray-900">
            ₹{(order.total || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Status Selector and Actions */}
      <div className="flex items-center gap-2">
        {/* Status Dropdown */}
        <PermissionGate
          allowedRoles={["ADMIN", "SUPER_ADMIN"]}
          fallback={
            <div
              className={`flex-1 px-2 py-2 rounded text-xs font-medium ${getStatusColor(order.status)}`}
            >
              {order.status || "PENDING"}
            </div>
          }
        >
          <select
            value={order.status || "PENDING"}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
            disabled={isUpdating}
            className={`flex-1 px-2 py-2 rounded text-xs font-medium border-0 cursor-pointer appearance-none transition ${getStatusColor(
              order.status,
            )} ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </PermissionGate>

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails(order.id)}
          className="px-3 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap"
          aria-label={`View details for order ${order.id?.slice(0, 8)}`}
        >
          <span className="hidden sm:inline">View</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Compact Info Row for quick reference */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {order.status === "CANCELLED" ? (
              <span className="text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Cancelled
              </span>
            ) : (
              <span>{order.status || "PENDING"}</span>
            )}
          </span>
          {order.phone && <span>{order.phone}</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * Container component for rendering multiple order cards
 */
export function OrderCardList({
  orders,
  onViewDetails,
  onStatusChange,
  updatingId,
  statusOptions,
  getStatusColor,
}: {
  orders: any[];
  onViewDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  updatingId: string | null;
  statusOptions: string[];
  getStatusColor: (status: string) => string;
}) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.slice(0, 50).map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onViewDetails={onViewDetails}
          onStatusChange={onStatusChange}
          isUpdating={updatingId === order.id}
          statusOptions={statusOptions}
          getStatusColor={getStatusColor}
        />
      ))}
      {orders.length > 50 && (
        <div className="px-4 py-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-200 text-center">
          Showing 50 of {orders.length} orders
        </div>
      )}
    </div>
  );
}

export default OrderCard;
