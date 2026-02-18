import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server | null = null;

// User socket connections map
const userSockets = new Map<string, Set<string>>();

// Notification types
export enum NotificationType {
  ORDER_PLACED = "ORDER_PLACED",
  ORDER_CONFIRMED = "ORDER_CONFIRMED",
  ORDER_SHIPPED = "ORDER_SHIPPED",
  ORDER_DELIVERED = "ORDER_DELIVERED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  LOW_STOCK = "LOW_STOCK",
  NEW_REVIEW = "NEW_REVIEW",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  createdAt: Date;
  read: boolean;
}

// Initialize Socket.io
export const initializeSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        process.env.ADMIN_URL || "http://localhost:3002",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      // Allow anonymous connections for public notifications
      return next();
    }

    try {
      const decoded = jwt.verify(
        token.replace("Bearer ", ""),
        process.env.JWT_SECRET || "your-secret-key",
      ) as any;
      socket.data.userId = decoded.user?.id;
      socket.data.userRole = decoded.user?.role;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;

    if (userId) {
      // Track user connections
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Join admin room if user is admin
      if (socket.data.userRole === "ADMIN") {
        socket.join("admin");
      }
    }

    socket.on("disconnect", () => {
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId)!.delete(socket.id);
        if (userSockets.get(userId)!.size === 0) {
          userSockets.delete(userId);
        }
      }
    });

    // Handle marking notifications as read
    socket.on("mark_read", (notificationId: string) => {
      // In production, update database
      console.log(`Notification ${notificationId} marked as read`);
    });

    // Handle getting unread count
    socket.on("get_unread_count", async () => {
      // In production, query database
      socket.emit("unread_count", { count: 0 });
    });
  });

  return io;
};

// Get IO instance
export const getIO = (): Server | null => io;

// Send notification to specific user
export const sendToUser = (
  userId: string,
  notification: Notification,
): void => {
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }
};

// Send notification to all admins
export const sendToAdmins = (notification: Notification): void => {
  if (io) {
    io.to("admin").emit("notification", notification);
  }
};

// Send notification to all connected users
export const broadcast = (notification: Notification): void => {
  if (io) {
    io.emit("notification", notification);
  }
};

// Create notification helper
export const createNotification = (
  type: NotificationType,
  title: string,
  message: string,
  data?: any,
): Notification => ({
  id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  title,
  message,
  data,
  createdAt: new Date(),
  read: false,
});

// Notification helpers for common events
export const notifications = {
  orderPlaced: (userId: string, orderNumber: string) => {
    const notification = createNotification(
      NotificationType.ORDER_PLACED,
      "Order Placed",
      `Your order #${orderNumber} has been placed successfully.`,
      { orderNumber },
    );
    sendToUser(userId, notification);
    return notification;
  },

  orderConfirmed: (userId: string, orderNumber: string) => {
    const notification = createNotification(
      NotificationType.ORDER_CONFIRMED,
      "Order Confirmed",
      `Your order #${orderNumber} has been confirmed.`,
      { orderNumber },
    );
    sendToUser(userId, notification);
    return notification;
  },

  orderShipped: (
    userId: string,
    orderNumber: string,
    trackingNumber?: string,
  ) => {
    const notification = createNotification(
      NotificationType.ORDER_SHIPPED,
      "Order Shipped",
      `Your order #${orderNumber} has been shipped.${trackingNumber ? ` Tracking: ${trackingNumber}` : ""}`,
      { orderNumber, trackingNumber },
    );
    sendToUser(userId, notification);
    return notification;
  },

  orderDelivered: (userId: string, orderNumber: string) => {
    const notification = createNotification(
      NotificationType.ORDER_DELIVERED,
      "Order Delivered",
      `Your order #${orderNumber} has been delivered.`,
      { orderNumber },
    );
    sendToUser(userId, notification);
    return notification;
  },

  paymentSuccess: (userId: string, orderNumber: string, amount: number) => {
    const notification = createNotification(
      NotificationType.PAYMENT_SUCCESS,
      "Payment Successful",
      `Payment of ₹${amount} for order #${orderNumber} was successful.`,
      { orderNumber, amount },
    );
    sendToUser(userId, notification);
    return notification;
  },

  paymentFailed: (userId: string, orderNumber: string) => {
    const notification = createNotification(
      NotificationType.PAYMENT_FAILED,
      "Payment Failed",
      `Payment for order #${orderNumber} failed. Please try again.`,
      { orderNumber },
    );
    sendToUser(userId, notification);
    return notification;
  },

  lowStock: (productName: string, stock: number) => {
    const notification = createNotification(
      NotificationType.LOW_STOCK,
      "Low Stock Alert",
      `${productName} is running low on stock (${stock} remaining).`,
      { productName, stock },
    );
    sendToAdmins(notification);
    return notification;
  },

  newReview: (productName: string, rating: number) => {
    const notification = createNotification(
      NotificationType.NEW_REVIEW,
      "New Review",
      `New ${rating}-star review for ${productName}.`,
      { productName, rating },
    );
    sendToAdmins(notification);
    return notification;
  },

  systemAnnouncement: (title: string, message: string) => {
    const notification = createNotification(
      NotificationType.SYSTEM_ANNOUNCEMENT,
      title,
      message,
    );
    broadcast(notification);
    return notification;
  },
};

export default {
  initializeSocket,
  getIO,
  sendToUser,
  sendToAdmins,
  broadcast,
  createNotification,
  notifications,
  NotificationType,
};
