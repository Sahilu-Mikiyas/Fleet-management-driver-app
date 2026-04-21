import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPayload {
  type: "new_cargo" | "approval" | "rejection" | "urgent" | "message";
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  static async requestPermissions() {
    if (Platform.OS === "web") {
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  }

  static async sendLocalNotification(payload: NotificationPayload) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: {
            type: payload.type,
            ...payload.data,
          },
          sound: "default",
          badge: 1,
        },
        trigger: { type: "time", seconds: 1 } as any,
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  static async sendCargoNotification(cargoTitle: string, compensation: number) {
    await this.sendLocalNotification({
      type: "new_cargo",
      title: "New Cargo Available! 📦",
      body: `${cargoTitle} - $${compensation.toFixed(0)}`,
      data: { cargoTitle, compensation },
    });
  }

  static async sendApprovalNotification(tripId: string) {
    await this.sendLocalNotification({
      type: "approval",
      title: "Trip Approved! ✅",
      body: "Your trip has been approved by admin. You can now start the trip.",
      data: { tripId },
    });
  }

  static async sendRejectionNotification(tripId: string, reason?: string) {
    await this.sendLocalNotification({
      type: "rejection",
      title: "Trip Rejected ❌",
      body: reason || "Your trip has been rejected. Please contact support.",
      data: { tripId, reason },
    });
  }

  static async sendUrgentAlert(message: string) {
    await this.sendLocalNotification({
      type: "urgent",
      title: "Urgent Alert 🚨",
      body: message,
    });
  }

  static async sendMessageNotification(senderName: string, message: string) {
    await this.sendLocalNotification({
      type: "message",
      title: `Message from ${senderName} 💬`,
      body: message,
      data: { senderName, message },
    });
  }

  static setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (notification: Notifications.Notification) => void
  ) {
    // Handle notification when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Handle notification tap
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (onNotificationTapped) {
        onNotificationTapped(response.notification);
      }
    });

    return () => {
      foregroundSubscription.remove();
      backgroundSubscription.remove();
    };
  }
}
