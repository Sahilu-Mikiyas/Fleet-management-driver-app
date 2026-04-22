import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Modal, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/use-colors";
import { OTPInput } from "@/components/ui/otp-input";
import { driverApi } from "@/lib/api-client";
import * as Haptics from "expo-haptics";

interface DeliveryVerificationModalProps {
  tripId: string;
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliveryVerificationModal({ tripId, isVisible, onClose, onSuccess }: DeliveryVerificationModalProps) {
  const colors = useColors();
  const [step, setStep] = useState<"proof" | "otp">("proof");
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setEvidencePhoto(result.assets[0].uri);
    }
  };

  const handleNextStep = async () => {
    if (step === "proof") {
      if (!evidencePhoto) {
        Alert.alert("Required", "Please upload a photo of the delivered cargo.");
        return;
      }
      setStep("otp");
    } else {
      // Final submission
      if (otpCode.length < 4) {
        Alert.alert("Required", "Please enter the full 4-digit code.");
        return;
      }
      submitVerification();
    }
  };

  const submitVerification = async () => {
    setIsSubmitting(true);
    try {
      // 1. Upload Evidence
      if (evidencePhoto) {
        const formData = new FormData() as any;
        formData.append("file", {
          uri: evidencePhoto,
          name: `pod-${tripId}.jpg`,
          type: "image/jpeg",
        });
        formData.append("type", "photo");
        await driverApi.uploadEvidence(tripId, formData);
      }

      // 2. Verify OTP
      await driverApi.verifyOtp(tripId, otpCode);

      // 3. Complete Assignment (Only after OTP passes)
      await driverApi.completeAssignment(tripId);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (error: any) {
      console.error("Verification failed:", error);
      Alert.alert("Verification Failed", error.message || "Invalid OTP code. Please try again.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setStep("proof");
    setEvidencePhoto(null);
    setOtpCode("");
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-3xl pt-6 pb-12 px-6 h-[80%]">
          
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-foreground">Delivery Verification</Text>
            <Pressable onPress={handleClose} className="w-8 h-8 bg-surface rounded-full items-center justify-center">
              <Text className="text-foreground font-bold">✕</Text>
            </Pressable>
          </View>

          {/* Stepper Indicator */}
          <View className="flex-row items-center justify-center gap-4 mb-8">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${step === "proof" || step === "otp" ? "bg-primary" : "bg-surface"}`}>
              <Text className="text-white font-bold">1</Text>
            </View>
            <View className="w-12 h-1 bg-surface" />
            <View className={`w-8 h-8 rounded-full items-center justify-center ${step === "otp" ? "bg-primary" : "bg-surface"}`}>
              <Text className={`font-bold ${step === "otp" ? "text-white" : "text-muted"}`}>2</Text>
            </View>
          </View>

          {/* Step 1: Proof Upload */}
          {step === "proof" && (
            <View className="flex-1 items-center">
              <Text className="text-lg font-semibold text-foreground mb-2">Proof of Delivery</Text>
              <Text className="text-sm text-muted text-center mb-6 px-4">
                Please take a clear photo of the delivered cargo at the destination site.
              </Text>

              <Pressable 
                onPress={pickImage}
                className="w-full aspect-video bg-surface rounded-2xl border-2 border-dashed border-border items-center justify-center overflow-hidden"
              >
                {evidencePhoto ? (
                  <Image source={{ uri: evidencePhoto }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="items-center">
                    <Text className="text-4xl mb-2">📸</Text>
                    <Text className="text-primary font-semibold">Tap to Take Photo</Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <View className="flex-1 items-center">
              <Text className="text-lg font-semibold text-foreground mb-2">Receiver Verification</Text>
              <Text className="text-sm text-muted text-center mb-8 px-4">
                Ask the receiver for the 4-digit verification code. This confirms successful handover.
              </Text>

              <OTPInput 
                length={4} 
                value={otpCode} 
                onChange={setOtpCode} 
                disabled={isSubmitting} 
              />
            </View>
          )}

          {/* Action Button */}
          <Pressable
            onPress={handleNextStep}
            disabled={isSubmitting}
            className={`rounded-xl py-4 items-center shadow-sm mt-8 ${isSubmitting ? "bg-primary/50" : "bg-primary"}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {step === "proof" ? "Continue" : "Verify & Complete Delivery"}
              </Text>
            )}
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}
