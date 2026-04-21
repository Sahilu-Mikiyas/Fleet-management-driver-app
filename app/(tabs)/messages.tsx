import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

interface Message {
  id: string;
  sender: "driver" | "dispatcher";
  content: string;
  timestamp: string;
  type: "text" | "status_update" | "alert";
}

interface Conversation {
  id: string;
  dispatcherName: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

export default function MessagesScreen() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const conversations: Conversation[] = [
    {
      id: "c1",
      dispatcherName: "John Manager",
      lastMessage: "Your next assignment is ready",
      timestamp: "2 min ago",
      unread: 1,
      messages: [
        {
          id: "m1",
          sender: "dispatcher",
          content: "Good morning! How's your day going?",
          timestamp: "9:00 AM",
          type: "text",
        },
        {
          id: "m2",
          sender: "driver",
          content: "Morning! All good, ready for assignments",
          timestamp: "9:05 AM",
          type: "text",
        },
        {
          id: "m3",
          sender: "dispatcher",
          content: "Your next assignment is ready",
          timestamp: "9:15 AM",
          type: "status_update",
        },
      ],
    },
    {
      id: "c2",
      dispatcherName: "Sarah Support",
      lastMessage: "Please update your vehicle documents",
      timestamp: "1 hour ago",
      unread: 0,
      messages: [
        {
          id: "m4",
          sender: "dispatcher",
          content: "Please update your vehicle documents",
          timestamp: "8:00 AM",
          type: "alert",
        },
      ],
    },
  ];

  const currentConversation = conversations.find((c) => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    Alert.alert("Message Sent", "Your message has been sent to the dispatcher");
    setMessageText("");
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      "Emergency Alert",
      "Send an emergency alert to all dispatchers?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Alert",
          onPress: () => {
            Alert.alert("Alert Sent", "Emergency alert has been sent to all dispatchers");
          },
          style: "destructive",
        },
      ]
    );
  };

  if (selectedConversation && currentConversation) {
    return (
      <ScreenContainer className="p-0">
        <View className="flex-1">
          {/* Chat Header */}
          <View className="bg-primary px-6 py-4 flex-row justify-between items-center">
            <Pressable onPress={() => setSelectedConversation(null)}>
              <Text className="text-white text-lg">← Back</Text>
            </Pressable>
            <Text className="text-white text-lg font-bold">{currentConversation.dispatcherName}</Text>
            <View className="w-6" />
          </View>

          {/* Messages */}
          <ScrollView className="flex-1 px-6 py-4 gap-3">
            {currentConversation.messages.map((msg) => (
              <View
                key={msg.id}
                className={`flex-row ${msg.sender === "driver" ? "justify-end" : "justify-start"}`}
              >
                <View
                  className={`max-w-xs px-4 py-3 rounded-lg ${
                    msg.sender === "driver"
                      ? "bg-primary rounded-br-none"
                      : msg.type === "alert"
                      ? "bg-red-100 dark:bg-red-900 rounded-bl-none"
                      : msg.type === "status_update"
                      ? "bg-blue-100 dark:bg-blue-900 rounded-bl-none"
                      : "bg-surface rounded-bl-none"
                  }`}
                >
                  <Text
                    className={`${
                      msg.sender === "driver"
                        ? "text-white"
                        : msg.type === "alert"
                        ? "text-red-900 dark:text-red-100"
                        : msg.type === "status_update"
                        ? "text-blue-900 dark:text-blue-100"
                        : "text-foreground"
                    }`}
                  >
                    {msg.content}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      msg.sender === "driver"
                        ? "text-white opacity-70"
                        : msg.type === "alert"
                        ? "text-red-800 dark:text-red-200"
                        : msg.type === "status_update"
                        ? "text-blue-800 dark:text-blue-200"
                        : "text-muted"
                    }`}
                  >
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View className="px-6 py-4 border-t border-border gap-3">
            <View className="flex-row gap-2 items-end">
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#9BA1A6"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
              <Pressable
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
                style={({ pressed }) => [
                  { transform: [{ scale: pressed && messageText.trim() ? 0.97 : 1 }] },
                ]}
              >
                <View className="bg-primary rounded-lg px-4 py-3 items-center">
                  <Text className="text-white font-bold">Send</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold mb-2">Messages</Text>
          <Text className="text-white text-sm opacity-80">Chat with your dispatcher</Text>
        </View>

        <View className="px-6 py-6 gap-6">
          {/* Emergency Alert Button */}
          <Pressable
            onPress={handleEmergencyAlert}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <View className="bg-error rounded-lg py-4 items-center border-2 border-error">
              <Text className="text-base font-bold text-white">🚨 Emergency Alert</Text>
            </View>
          </Pressable>

          {/* Quick Messages */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Quick Messages</Text>
            <View className="gap-2">
              {[
                "Running late - 10 minutes",
                "Vehicle breakdown - need assistance",
                "Passenger issue - need guidance",
                "Completed assignment early",
              ].map((msg, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    Alert.alert("Message Sent", `"${msg}" has been sent to dispatcher`);
                  }}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                >
                  <View className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                    <Text className="text-sm text-foreground">{msg}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Conversations */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Conversations</Text>
            {conversations.map((conv) => (
              <Pressable
                key={conv.id}
                onPress={() => setSelectedConversation(conv.id)}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              >
                <View className="bg-surface rounded-lg p-4 border border-border flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Text className="text-base font-semibold text-foreground">
                        {conv.dispatcherName}
                      </Text>
                      {conv.unread > 0 && (
                        <View className="bg-error rounded-full px-2 py-1">
                          <Text className="text-white text-xs font-bold">{conv.unread}</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted">{conv.lastMessage}</Text>
                    <Text className="text-xs text-muted mt-1">{conv.timestamp}</Text>
                  </View>
                  <Text className="text-lg">→</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
