import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function requestNotificationPermissions() {
  if (Platform.OS === "web") {
    return { status: "granted" };
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permissions not granted");
      return { status: finalStatus, granted: false };
    }

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    return { status: finalStatus, granted: true };
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return { status: "error", granted: false };
  }
}

export function setupNotificationListeners() {
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log("Notification received:", notification);
  });

  // Handle notification tapped
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("Notification tapped:", response);
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

export async function sendTestNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "New Cargo Available! 📦",
        body: "A new cargo job matching your preferences is available",
        data: { type: "new_cargo" },
        badge: 1,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
  }
}
