import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, Animated, LayoutChangeEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

export interface Segment {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function SegmentedControl({ segments, activeKey, onSelect }: SegmentedControlProps) {
  const colors = useColors();
  const activeIndex = segments.findIndex((s) => s.key === activeKey);
  const slideAnim = useRef(new Animated.Value(activeIndex)).current;
  const segmentWidths = useRef<number[]>(new Array(segments.length).fill(0));
  const segmentOffsets = useRef<number[]>(new Array(segments.length).fill(0));
  const [, forceUpdate] = React.useState(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex,
      useNativeDriver: false,
      tension: 300,
      friction: 30,
    }).start();
  }, [activeIndex]);

  const handleSegmentLayout = (index: number, event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    segmentWidths.current[index] = width;
    segmentOffsets.current[index] = x;
    // Force re-render once all segments have been measured
    if (segmentWidths.current.every((w) => w > 0)) {
      forceUpdate((v) => v + 1);
    }
  };

  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
  };

  const allMeasured = segmentWidths.current.every((w) => w > 0);

  const indicatorLeft = allMeasured
    ? slideAnim.interpolate({
        inputRange: segments.map((_, i) => i),
        outputRange: segmentOffsets.current.map((offset) => offset),
      })
    : 0;

  const indicatorWidth = allMeasured
    ? slideAnim.interpolate({
        inputRange: segments.map((_, i) => i),
        outputRange: segmentWidths.current.map((w) => w),
      })
    : 0;

  return (
    <View
      className="bg-surface border-b border-border"
      style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0 }}
    >
      <View
        className="bg-border/30 rounded-xl overflow-hidden"
        style={{
          flexDirection: "row",
          position: "relative",
          padding: 3,
        }}
      >
        {/* Animated sliding indicator */}
        {allMeasured && (
          <Animated.View
            style={{
              position: "absolute",
              top: 3,
              bottom: 3,
              left: indicatorLeft as any,
              width: indicatorWidth as any,
              backgroundColor: colors.primary,
              borderRadius: 10,
              zIndex: 0,
            }}
          />
        )}

        {/* Segment buttons */}
        {segments.map((segment, index) => {
          const isActive = segment.key === activeKey;
          return (
            <Pressable
              key={segment.key}
              onPress={() => handlePress(segment.key)}
              onLayout={(event) => handleSegmentLayout(index, event)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isActive ? "#ffffff" : colors.muted,
                  textAlign: "center",
                }}
              >
                {segment.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
