import React from "react";
import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function NotificationsScreen() {
  const mockNotifications = [
    { id: "n1", title: "New Assignment", message: "Route A has been assigned to you", time: "2 hours ago" },
    { id: "n2", title: "Account Approved", message: "Your driver account has been approved", time: "1 day ago" },
    { id: "n3", title: "Admin Message", message: "Please ensure vehicle inspection before departure", time: "3 days ago" },
  ];

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold">Updates</Text>
          <Text className="text-white text-sm opacity-80 mt-2">{mockNotifications.length} notifications</Text>
        </View>
        <View className="px-6 py-6">
          {mockNotifications.map((notif) => (
            <View key={notif.id} className="bg-surface rounded-lg p-4 mb-3 border border-border">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-base font-semibold text-foreground flex-1">{notif.title}</Text>
                <Text className="text-xs text-muted">{notif.time}</Text>
              </View>
              <Text className="text-sm text-muted">{notif.message}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
