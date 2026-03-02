/**
 * Accessibility utilities for ARIA labels, keyboard navigation, and screen reader support
 */

/**
 * Generate ARIA label for product add to cart button
 */
export function getProductAriaLabel(productName: string): string {
  return `Add ${productName} to cart`;
}

/**
 * Generate ARIA description for product price
 */
export function getPriceAriaDescription(
  price: number,
  originalPrice?: number,
): string {
  if (originalPrice && originalPrice > price) {
    const discount = Math.round(
      ((originalPrice - price) / originalPrice) * 100,
    );
    return `Price: ₹${price}. Originally ₹${originalPrice}, now ${discount}% off`;
  }
  return `Price: ₹${price}`;
}

/**
 * Generate ARIA label for rating
 */
export function getRatingAriaLabel(
  rating: number,
  reviewCount: number,
): string {
  return `Rated ${rating} out of 5 stars based on ${reviewCount} reviews`;
}

/**
 * Generate ARIA label for quantity selector
 */
export function getQuantityAriaLabel(
  productName: string,
  quantity: number,
): string {
  return `Quantity selector for ${productName}, current quantity: ${quantity}`;
}

/**
 * Generate ARIA label for address selection
 */
export function getAddressAriaLabel(
  name: string,
  address: string,
  isDefault: boolean,
): string {
  const defaultText = isDefault ? " (default address)" : "";
  return `Address: ${name}, ${address}${defaultText}`;
}

/**
 * Generate ARIA label for status badge
 */
export function getStatusAriaLabel(status: string): string {
  const statusText = status.replace(/_/g, " ").toLowerCase();
  return `Order status: ${statusText}`;
}

/**
 * Keyboard event handlers for accessibility
 */
export const keyboardHandlers = {
  /**
   * Handle Enter and Space keys for button actions
   */
  handleActivationKey: (
    event: React.KeyboardEvent<HTMLDivElement>,
    callback: () => void,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Handle arrow keys for list navigation
   */
  handleArrowNavigation: (
    event: React.KeyboardEvent<HTMLElement>,
    items: any[],
    currentIndex: number,
    setIndex: (index: number) => void,
  ) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex(currentIndex > 0 ? currentIndex - 1 : items.length - 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex(currentIndex < items.length - 1 ? currentIndex + 1 : 0);
    } else if (event.key === "Home") {
      event.preventDefault();
      setIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setIndex(items.length - 1);
    }
  },

  /**
   * Handle Escape key for modals/dropdowns
   */
  handleEscape: (
    event: React.KeyboardEvent<HTMLElement>,
    callback: () => void,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      callback();
    }
  },
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Focus first focusable element in container
   */
  focusFirst: (container: HTMLElement | null) => {
    const focusable = container?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as HTMLElement | undefined;
    focusable?.focus();
  },

  /**
   * Trap focus within container
   */
  trapFocus: (
    event: React.KeyboardEvent<HTMLElement>,
    container: HTMLElement | null,
  ) => {
    if (event.key !== "Tab") return;

    const focusable = container?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>;

    if (!focusable || focusable.length === 0) return;

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  },

  /**
   * Return focus to element after modal closes
   */
  returnFocus: (element: HTMLElement | null) => {
    setTimeout(() => {
      element?.focus();
    }, 0);
  },
};

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  polite: boolean = true,
) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", polite ? "polite" : "assertive");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only"; // Visually hidden but read by screen readers
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    announcement.remove();
  }, 1000);
}

/**
 * Skip links for keyboard navigation
 */
export const skipLinks = {
  generateSkipLink: (href: string, text: string) => ({
    href,
    text,
    className:
      "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-black focus:text-white focus:p-2 focus:z-50",
  }),

  mainContentSkip: { href: "#main-content", text: "Skip to main content" },
  navigationSkip: { href: "#navigation", text: "Skip to navigation" },
};

/**
 * Semantic HTML alternatives
 */
export const semanticElements = {
  /**
   * Use <button> instead of <div onClick>
   */
  buttonRole: (onClick: () => void) => ({
    as: "button",
    onClick,
    role: undefined, // Button has implicit role
  }),

  /**
   * Use proper form elements with labels
   */
  formGroup: (label: string, inputId: string) => ({
    label: { htmlFor: inputId },
    input: { id: inputId },
  }),

  /**
   * Use <main> for main content
   */
  main: { id: "main-content", role: "main" },

  /**
   * Use <nav> for navigation
   */
  nav: { id: "navigation", role: "navigation" },

  /**
   * Use <article> for content areas
   */
  article: { role: "article" },

  /**
   * Use <section> with aria-label for grouped content
   */
  section: (label: string) => ({ role: "region", "aria-label": label }),
};

/**
 * Test accessibility attributes
 */
export function validateAccessibility(element: HTMLElement): string[] {
  const issues: string[] = [];

  // Check for images without alt text
  const images = element.querySelectorAll("img");
  images.forEach((img) => {
    if (!img.alt || img.alt.trim() === "") {
      issues.push(`Image missing alt text: ${img.src}`);
    }
  });

  // Check for buttons without accessible names
  const buttons = element.querySelectorAll("button, [role='button']");
  buttons.forEach((button) => {
    const text = button.textContent?.trim();
    const ariaLabel = button.getAttribute("aria-label");
    if (!text && !ariaLabel) {
      issues.push(`Button missing accessible name`);
    }
  });

  // Check for form inputs without labels
  const inputs = element.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    const id = input.id;
    const ariaLabel = input.getAttribute("aria-label");
    const label = id ? element.querySelector(`label[for="${id}"]`) : null;
    if (!ariaLabel && !label) {
      issues.push(`Input missing associated label or aria-label`);
    }
  });

  // Check for color-only indicators (should also use icons/text)
  const colorOnlyElements = element.querySelectorAll("[style*='color']");
  // This is a simplified check - would need more context in real usage

  return issues;
}

export default {
  getProductAriaLabel,
  getPriceAriaDescription,
  getRatingAriaLabel,
  getQuantityAriaLabel,
  getAddressAriaLabel,
  getStatusAriaLabel,
  keyboardHandlers,
  focusManagement,
  announceToScreenReader,
  skipLinks,
  semanticElements,
  validateAccessibility,
};
