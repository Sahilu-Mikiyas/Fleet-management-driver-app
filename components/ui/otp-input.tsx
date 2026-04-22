import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 4, value, onChange, disabled = false }: OTPInputProps) {
  const colors = useColors();
  const inputRefs = useRef<Array<TextInput | null>>([]);
  
  // Ensure the value array is always exactly `length` long
  const valueArray = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = (text: string, index: number) => {
    const newValue = [...valueArray];
    newValue[index] = text;
    const combinedValue = newValue.join("");
    onChange(combinedValue);

    // Auto-focus next input
    if (text !== "" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && valueArray[index] === "" && index > 0) {
      // If pressing backspace on an empty field, focus the previous one and clear it
      inputRefs.current[index - 1]?.focus();
      const newValue = [...valueArray];
      newValue[index - 1] = "";
      onChange(newValue.join(""));
    }
  };

  return (
    <View className="flex-row justify-center gap-3">
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 ${
            valueArray[index] ? "border-primary" : "border-border"
          } bg-surface`}
          style={{ color: colors.foreground }}
          maxLength={1}
          keyboardType="number-pad"
          value={valueArray[index]}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          editable={!disabled}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}
