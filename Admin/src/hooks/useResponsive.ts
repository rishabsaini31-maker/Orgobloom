import { useState, useEffect } from "react";

/**
 * Custom hook to detect if device screen size is mobile/tablet
 * Breakpoints: mobile < 768px, tablet 768px-1024px, desktop >= 1024px
 */
export function useMediaQuery() {
  const [deviceType, setDeviceType] = useState<"mobile" | "tablet" | "desktop">(
    "desktop",
  );
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });

      // Determine device type
      if (width < 768) {
        setDeviceType("mobile");
      } else if (width < 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    windowSize,
  };
}

/**
 * Custom hook for managing view toggle (table/card)
 * Persists preference to localStorage
 */
export function useViewMode(storageKey: string = "orderViewMode") {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem(storageKey);
    if (saved === "card" || saved === "table") {
      setViewMode(saved);
    }
    setIsLoaded(true);
  }, [storageKey]);

  const toggleViewMode = (newMode?: "table" | "card") => {
    const mode = newMode || (viewMode === "table" ? "card" : "table");
    setViewMode(mode);
    localStorage.setItem(storageKey, mode);
  };

  return {
    viewMode,
    toggleViewMode,
    isLoaded,
    isTableView: viewMode === "table",
    isCardView: viewMode === "card",
  };
}

/**
 * Breakpoint detection hook
 * Useful for responsive component rendering
 */
export function useBreakpoint() {
  const { windowSize } = useMediaQuery();

  return {
    isSmall: windowSize.width < 640,
    isMedium: windowSize.width >= 640 && windowSize.width < 768,
    isLarge: windowSize.width >= 768 && windowSize.width < 1024,
    isXLarge: windowSize.width >= 1024,
  };
}

/**
 * Responsive layout hook
 * Returns layout configuration based on screen size
 */
export function useResponsiveLayout() {
  const { deviceType } = useMediaQuery();

  const getColumnsPerRow = () => {
    if (deviceType === "mobile") return 1;
    if (deviceType === "tablet") return 2;
    return 3;
  };

  const getItemsPerPage = () => {
    if (deviceType === "mobile") return 10;
    if (deviceType === "tablet") return 20;
    return 50;
  };

  const getGridGap = () => {
    if (deviceType === "mobile") return "gap-2";
    return "gap-4";
  };

  return {
    deviceType,
    columnsPerRow: getColumnsPerRow(),
    itemsPerPage: getItemsPerPage(),
    gridGap: getGridGap(),
    containerClass: `grid-cols-${getColumnsPerRow()}`,
  };
}

export default {
  useMediaQuery,
  useViewMode,
  useBreakpoint,
  useResponsiveLayout,
};
