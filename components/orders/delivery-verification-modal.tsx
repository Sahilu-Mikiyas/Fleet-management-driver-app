import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Pressable, ActivityIndicator, Modal,
  Image, Alert, Animated, Easing,
} from "react-native";
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

const OTP_LENGTH = 6;

export function DeliveryVerificationModal({ tripId, isVisible, onClose, onSuccess }: DeliveryVerificationModalProps) {
  const colors = useColors();
  const [step, setStep] = useState<"proof" | "otp">("proof");
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Slide-in animation for each step
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 200, friction: 20 }),
      ]).start();
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setEvidencePhoto(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNextStep = async () => {
    if (step === "proof") {
      if (!evidencePhoto) {
        Alert.alert("Photo Required", "Please take a photo of the delivered cargo at the destination.");
        return;
      }
      animateTransition(() => setStep("otp"));
    } else {
      if (otpCode.length < OTP_LENGTH) {
        Alert.alert("Incomplete Code", `Please enter the full ${OTP_LENGTH}-digit code from the receiver.`);
        return;
      }
      submitVerification();
    }
  };

  const submitVerification = async () => {
    setIsSubmitting(true);
    try {
      if (evidencePhoto) {
        const formData = new FormData() as any;
        formData.append("file", { uri: evidencePhoto, name: `pod-${tripId}.jpg`, type: "image/jpeg" });
        formData.append("type", "photo");
        await driverApi.uploadEvidence(tripId, formData);
      }
      await driverApi.verifyOtp(tripId, otpCode);
      await driverApi.completeAssignment(tripId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message || "Invalid OTP code. Please try again.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("proof");
    setEvidencePhoto(null);
    setOtpCode("");
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-background rounded-t-3xl pb-10 h-[82%]" style={{ overflow: "hidden" }}>

          {/* Drag handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pb-4">
            <View>
              <Text className="text-xl font-bold text-foreground">Delivery Verification</Text>
              <Text className="text-xs text-muted mt-0.5">Step {step === "proof" ? "1" : "2"} of 2</Text>
            </View>
            <Pressable
              onPress={handleClose}
              className="w-9 h-9 bg-surface rounded-full items-center justify-center border border-border"
            >
              <Text className="text-foreground font-bold text-sm">✕</Text>
            </Pressable>
          </View>

          {/* Progress bar */}
          <View className="h-1 bg-border mx-6 rounded-full mb-6 overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: step === "proof" ? "50%" : "100%" }}
            />
          </View>

          <Animated.View
            className="flex-1 px-6"
            style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}
          >
            {/* Step 1: Proof of delivery photo */}
            {step === "proof" && (
              <View className="flex-1">
                <View className="items-center mb-6">
                  <View className="w-16 h-16 rounded-2xl bg-primary/15 items-center justify-center mb-3">
                    <Text className="text-3xl">📸</Text>
                  </View>
                  <Text className="text-lg font-bold text-foreground">Proof of Delivery</Text>
                  <Text className="text-sm text-muted text-center mt-1 px-4">
                    Take a clear photo of the delivered cargo at the destination.
                  </Text>
                </View>

                <Pressable
                  onPress={pickImage}
                  className="w-full rounded-2xl border-2 border-dashed border-primary/40 items-center justify-center overflow-hidden bg-surface"
                  style={{ aspectRatio: 4 / 3 }}
                >
                  {evidencePhoto ? (
                    <>
                      <Image source={{ uri: evidencePhoto }} className="w-full h-full" resizeMode="cover" />
                      <View className="absolute inset-0 bg-black/30 items-center justify-center">
                        <Text className="text-white font-bold text-sm">Tap to retake</Text>
                      </View>
                    </>
                  ) : (
                    <View className="items-center gap-2">
                      <Text className="text-5xl">📷</Text>
                      <Text className="text-primary font-semibold text-sm">Tap to Open Camera</Text>
                      <Text className="text-muted text-xs">JPG photo required</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            )}

            {/* Step 2: 6-digit OTP */}
            {step === "otp" && (
              <View className="flex-1 items-center">
                <View className="items-center mb-8">
                  <View className="w-16 h-16 rounded-2xl bg-primary/15 items-center justify-center mb-3">
                    <Text className="text-3xl">🔐</Text>
                  </View>
                  <Text className="text-lg font-bold text-foreground">Receiver Code</Text>
                  <Text className="text-sm text-muted text-center mt-1 px-4">
                    Ask the receiver for their {OTP_LENGTH}-digit confirmation code to complete the delivery.
                  </Text>
                </View>

                <OTPInput
                  length={OTP_LENGTH}
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={isSubmitting}
                />

                <Pressable
                  onPress={() => animateTransition(() => setStep("proof"))}
                  className="mt-6"
                >
                  <Text className="text-primary text-sm font-medium">← Retake photo</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* Action button */}
          <View className="px-6">
            <Pressable
              onPress={handleNextStep}
              disabled={isSubmitting}
              className={`rounded-2xl py-4 items-center ${isSubmitting ? "bg-primary/50" : "bg-primary"}`}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {step === "proof" ? "Next — Enter OTP →" : "✓ Verify & Complete Delivery"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
