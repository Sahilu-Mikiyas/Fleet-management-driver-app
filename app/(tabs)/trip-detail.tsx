import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { mockAssignments, mockManifests, mockDriverNotes, formatTime, mockVehicles } from "@/lib/mock-data";
import * as Linking from "expo-linking";

export default function TripDetailScreen() {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const [status, setStatus] = useState("assigned");
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);

  const assignment = mockAssignments.find((a) => a.id === assignmentId);
  const vehicle = mockVehicles.find((v) => v.id === assignment?.vehicle_id);
  const manifests = mockManifests.filter((m) => m.assignment_id === assignmentId);
  const notes = mockDriverNotes[assignmentId as keyof typeof mockDriverNotes];

  if (!assignment) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground text-lg">Trip not found</Text>
      </ScreenContainer>
    );
  }

  const handleStartTrip = () => {
    if (approvalStatus !== "approved") {
      Alert.alert(
        "Waiting for Approval",
        "This trip is awaiting admin approval. You'll be notified once it's approved."
      );
      return;
    }

    Alert.alert("Start Trip", "Are you ready to begin this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start",
        onPress: () => {
          setStatus("en_route");
          Alert.alert("Trip Started", "You are now en route to your destination");
        },
      },
    ]);
  };

  const handleCompleteTrip = () => {
    Alert.alert("Complete Trip", "Mark this trip as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: () => {
          setStatus("completed");
          setShowCompletionSummary(true);
        },
      },
    ]);
  };

  const handleOpenMaps = () => {
    const origin = "40.7128,-74.0060";
    const destination = "40.7580,-73.9855";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    Linking.openURL(url);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "assigned":
        return "bg-blue-100 dark:bg-blue-900";
      case "en_route":
        return "bg-yellow-100 dark:bg-yellow-900";
      case "completed":
        return "bg-green-100 dark:bg-green-900";
      default:
        return "bg-gray-100 dark:bg-gray-900";
    }
  };

  const getStatusTextColor = (s: string) => {
    switch (s) {
      case "assigned":
        return "text-blue-700 dark:text-blue-200";
      case "en_route":
        return "text-yellow-700 dark:text-yellow-200";
      case "completed":
        return "text-green-700 dark:text-green-200";
      default:
        return "text-gray-700 dark:text-gray-200";
    }
  };

  const getApprovalColor = (approval: string) => {
    switch (approval) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900";
      case "approved":
        return "bg-green-100 dark:bg-green-900";
      case "rejected":
        return "bg-red-100 dark:bg-red-900";
      default:
        return "bg-gray-100 dark:bg-gray-900";
    }
  };

  const getApprovalTextColor = (approval: string) => {
    switch (approval) {
      case "pending":
        return "text-yellow-700 dark:text-yellow-200";
      case "approved":
        return "text-green-700 dark:text-green-200";
      case "rejected":
        return "text-red-700 dark:text-red-200";
      default:
        return "text-gray-700 dark:text-gray-200";
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold mb-2">{assignment.route_name}</Text>
          <View className="flex-row gap-2 mt-2">
            <View className={`${getStatusColor(status)} rounded-full px-3 py-1`}>
              <Text className={`${getStatusTextColor(status)} text-xs font-semibold capitalize`}>
                {status.replace("_", " ")}
              </Text>
            </View>
            <View className={`${getApprovalColor(approvalStatus)} rounded-full px-3 py-1`}>
              <Text className={`${getApprovalTextColor(approvalStatus)} text-xs font-semibold capitalize`}>
                {approvalStatus === "pending" ? "⏳ Pending Approval" : approvalStatus === "approved" ? "✓ Approved" : "✗ Rejected"}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="px-6 py-6 gap-6">
          {/* Approval Status Alert */}
          {approvalStatus === "pending" && (
            <View className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <Text className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                ⏳ Awaiting Admin Approval
              </Text>
              <Text className="text-sm text-yellow-800 dark:text-yellow-200">
                This trip is pending approval from an administrator. You'll receive a notification once it's reviewed.
              </Text>
            </View>
          )}

          {approvalStatus === "approved" && (
            <View className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <Text className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                ✓ Trip Approved
              </Text>
              <Text className="text-sm text-green-800 dark:text-green-200">
                Your trip has been approved by the admin. You can now start the trip.
              </Text>
            </View>
          )}

          {approvalStatus === "rejected" && (
            <View className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <Text className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                ✗ Trip Rejected
              </Text>
              <Text className="text-sm text-red-800 dark:text-red-200">
                This trip has been rejected. Please contact support for more information.
              </Text>
            </View>
          )}

          {/* Route Information */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Route Information</Text>
            <View className="gap-3">
              <View>
                <Text className="text-xs text-muted mb-1">Route ID</Text>
                <Text className="text-base font-semibold text-foreground">{assignment.route_id}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Scheduled Departure</Text>
                <Text className="text-base font-semibold text-foreground">
                  {formatTime(assignment.scheduled_departure)}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Estimated Arrival</Text>
                <Text className="text-base font-semibold text-foreground">
                  {formatTime(assignment.scheduled_arrival)}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Duration</Text>
                <Text className="text-base font-semibold text-foreground">~1 hour 30 minutes</Text>
              </View>
            </View>
          </View>

          {/* Vehicle Information */}
          {vehicle && (
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">Vehicle Information</Text>
              <View className="gap-3">
                <View>
                  <Text className="text-xs text-muted mb-1">License Plate</Text>
                  <Text className="text-base font-semibold text-foreground">{vehicle.license_plate}</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Vehicle Model</Text>
                  <Text className="text-base font-semibold text-foreground">{vehicle.model}</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Capacity</Text>
                  <Text className="text-base font-semibold text-foreground">{vehicle.capacity} Passengers</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted mb-1">Current Passengers</Text>
                  <Text className="text-base font-semibold text-foreground">{manifests.length}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Passenger Manifest */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Passenger Manifest</Text>
            {manifests.length === 0 ? (
              <Text className="text-sm text-muted">No passengers assigned</Text>
            ) : (
              <View className="gap-2">
                {manifests.map((manifest) => (
                  <View key={manifest.id} className="flex-row justify-between items-center py-2 border-b border-border last:border-b-0">
                    <Text className="text-sm font-medium text-foreground">{manifest.passenger_name}</Text>
                    <Text className="text-sm font-semibold text-muted">{manifest.reserved_seat}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Special Instructions */}
          {notes && (
            <View className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <Text className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Special Instructions</Text>
              <Text className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{notes.special_instructions}</Text>
            </View>
          )}

          {/* Dispatcher Contact */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Dispatcher Contact</Text>
            <View className="gap-3">
              <View>
                <Text className="text-xs text-muted mb-1">Name</Text>
                <Text className="text-base font-semibold text-foreground">John Manager</Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Phone</Text>
                <Pressable onPress={() => Linking.openURL("tel:+1234567890")}>
                  <Text className="text-base font-semibold text-primary">+1 (234) 567-8900</Text>
                </Pressable>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Email</Text>
                <Pressable onPress={() => Linking.openURL("mailto:dispatcher@fleet.com")}>
                  <Text className="text-base font-semibold text-primary">dispatcher@fleet.com</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            {status === "assigned" && (
              <>
                <Pressable
                  onPress={handleStartTrip}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  <View className={`${approvalStatus !== "approved" ? "bg-gray-400" : "bg-primary"} rounded-lg py-4 items-center`}>
                    <Text className="text-base font-semibold text-white">
                      {approvalStatus === "pending" ? "Awaiting Approval..." : "Start Trip"}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleOpenMaps}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  <View className="bg-surface border border-border rounded-lg py-4 items-center">
                    <Text className="text-base font-semibold text-foreground">View on Map</Text>
                  </View>
                </Pressable>
              </>
            )}

            {status === "en_route" && (
              <>
                <Pressable
                  onPress={handleOpenMaps}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  <View className="bg-primary rounded-lg py-4 items-center">
                    <Text className="text-base font-semibold text-white">Navigate</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleCompleteTrip}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  <View className="bg-success rounded-lg py-4 items-center">
                    <Text className="text-base font-semibold text-white">Complete Trip</Text>
                  </View>
                </Pressable>
              </>
            )}

            {status === "completed" && (
              <Pressable onPress={() => router.back()} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <View className="bg-surface border border-border rounded-lg py-4 items-center">
                  <Text className="text-base font-semibold text-foreground">Back to Dashboard</Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Completion Summary */}
          {showCompletionSummary && (
            <View className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <Text className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">Trip Completed! 🎉</Text>
              <Text className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                Great job! You've successfully completed this trip. Your earnings have been added to your account.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
