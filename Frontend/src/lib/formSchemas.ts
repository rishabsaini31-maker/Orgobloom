import { z } from "zod";

/**
 * Validation schemas for all frontend forms
 * Used with React Hook Form + Zod
 */

// Auth schemas
export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const passwordResetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Profile schemas
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be 10 digits")
    .optional()
    .or(z.literal("")),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

// Address schemas
export const addressSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  isDefault: z.boolean().default(false),
});

// Checkout schemas
export const checkoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["card", "cod", "upi"]).refine(() => true, {
    message: "Select a valid payment method",
  }),
  agreeToTerms: z.boolean().refine((val) => val, {
    message: "You must agree to terms and conditions",
  }),
});

// Cart item schema
export const cartItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  weight: z.string().optional(),
});

// Cart schema
export const cartSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart must have at least one item"),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  deliveryCharge: z.number().nonnegative(),
  total: z.number().positive(),
});

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Newsletter schema
export const newsletterSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Product review schema
export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Rating required").max(5, "Max rating is 5"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
  verified: z.boolean().default(false),
});

// Type exports for use with React Hook Form
export type Register = z.infer<typeof registerSchema>;
export type Login = z.infer<typeof loginSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Checkout = z.infer<typeof checkoutSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Newsletter = z.infer<typeof newsletterSchema>;
export type Review = z.infer<typeof reviewSchema>;
