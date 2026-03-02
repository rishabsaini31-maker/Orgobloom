import { memo, useState, useMemo } from "react";

/**
 * Memoized wrapper for ProductCard to prevent unnecessary re-renders
 * Compares product ID and price before triggering re-render
 */
export const memoizeProductCard = memo(
  (ProductCard: any) => ProductCard,
  (prev, next) => {
    // Only re-render if product ID or price changes
    return (
      prev?.product?.id === next?.product?.id &&
      prev?.product?.price === next?.product?.price &&
      prev?.product?.stock === next?.product?.stock &&
      prev?.priority === next?.priority
    );
  },
);

/**
 * Memoized wrapper for AddressCard
 */
export const memoizeAddressCard = memo(
  (AddressCard: any) => AddressCard,
  (prev, next) => {
    return (
      prev?.address?.id === next?.address?.id &&
      prev?.isSelected === next?.isSelected &&
      prev?.isDefault === next?.isDefault
    );
  },
);

/**
 * Memoized wrapper for OrderRow/OrderCard
 */
export const memoizeOrderRow = memo(
  (OrderRow: any) => OrderRow,
  (prev, next) => {
    return (
      prev?.order?.id === next?.order?.id &&
      prev?.order?.status === next?.order?.status &&
      prev?.order?.total === next?.order?.total
    );
  },
);

/**
 * Memoized wrapper for CartItem
 */
export const memoizeCartItem = memo(
  (CartItem: any) => CartItem,
  (prev, next) => {
    return (
      prev?.item?.productId === next?.item?.productId &&
      prev?.item?.quantity === next?.item?.quantity &&
      prev?.item?.price === next?.item?.price
    );
  },
);

/**
 * Memoized wrapper for CheckoutItem
 */
export const memoizeCheckoutItem = memo(
  (CheckoutItem: any) => CheckoutItem,
  (prev, next) => {
    return (
      prev?.item?.productId === next?.item?.productId &&
      prev?.item?.quantity === next?.item?.quantity
    );
  },
);

/**
 * Generic high-order component for memoization
 * Useful for any component that receives stable props
 */
export const withMemo = <P extends object>(
  Component: React.ComponentType<P>,
  propsComparator?: (prevProps: P, nextProps: P) => boolean,
) => {
  return memo(Component, propsComparator);
};

/**
 * Helper to memoize component list rendering
 * Returns stable array reference if items haven't changed
 */
export function useMemoList<T extends { id: string }>(items: T[]): T[] {
  const [memoized, setMemoized] = useState(items);

  useMemo(() => {
    // Only update if item IDs or count changed
    if (
      items.length !== memoized.length ||
      items.some((item, idx) => item.id !== memoized[idx]?.id)
    ) {
      setMemoized(items);
    }
  }, [items, memoized]);

  return memoized;
}

export default withMemo;
