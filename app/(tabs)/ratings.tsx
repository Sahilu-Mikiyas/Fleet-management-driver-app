import React, { useEffect, useRef } from "react";
import { ScrollView, Text, View, Animated } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRatings } from "@/lib/ratings-context";

function StarRow({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <View className="flex-row gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <Text key={i} style={{ fontSize: 13, opacity: i < filled ? 1 : 0.25 }}>⭐</Text>
      ))}
    </View>
  );
}

function RatingCard({ rating, index }: { rating: any; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 60 }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <View className="bg-surface rounded-2xl border border-border p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-bold text-foreground">{rating.shipper}</Text>
            <Text className="text-xs text-muted mt-0.5">{rating.date}</Text>
          </View>
          <StarRow filled={rating.rating} />
        </View>
        {rating.cargoType && (
          <View className="bg-primary/10 border border-primary/20 self-start px-2.5 py-1 rounded-full mb-2">
            <Text className="text-primary text-[10px] font-bold">{rating.cargoType}</Text>
          </View>
        )}
        <Text className="text-sm text-muted leading-5">{rating.feedback}</Text>
      </View>
    </Animated.View>
  );
}

export function RatingsContent() {
  const { ratings, averageRating, totalRatings, ratingDistribution } = useRatings();
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }).start();
  }, []);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Navy header with score */}
      <Animated.View
        className="bg-navy px-6 pt-8 pb-8 items-center"
        style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }}
      >
        <Text className="text-white text-6xl font-bold">{averageRating.toFixed(1)}</Text>
        <StarRow filled={Math.round(averageRating)} />
        <Text className="text-white/60 text-sm mt-2">{totalRatings} ratings from shippers</Text>
      </Animated.View>

      <View className="px-4 pt-5 gap-4">
        {/* Distribution breakdown */}
        <View className="bg-surface rounded-2xl border border-border p-5">
          <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Rating Breakdown</Text>
          {[5, 4, 3, 2, 1].map((star) => {
            const pct = totalRatings > 0 ? (ratingDistribution[star] / totalRatings) * 100 : 0;
            return (
              <View key={star} className="flex-row items-center gap-3 mb-2.5">
                <View className="flex-row gap-0.5 w-16">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Text key={i} style={{ fontSize: 11, opacity: i < star ? 1 : 0.2 }}>⭐</Text>
                  ))}
                </View>
                <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <Animated.View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </View>
                <Text className="text-xs text-muted w-6 text-right">{ratingDistribution[star]}</Text>
              </View>
            );
          })}
        </View>

        {/* Recent ratings */}
        <Text className="text-xs font-bold text-muted uppercase tracking-widest">Recent Feedback</Text>
        {ratings.length === 0 ? (
          <View className="bg-surface rounded-2xl border border-border p-10 items-center">
            <Text className="text-4xl mb-3">⭐</Text>
            <Text className="text-foreground font-bold text-base mb-1">No Ratings Yet</Text>
            <Text className="text-muted text-sm text-center leading-5">
              Complete trips to receive ratings from shippers and build your reputation.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {ratings.map((r, i) => <RatingCard key={r.id} rating={r} index={i} />)}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function RatingsScreen() {
  return <ScreenContainer className="p-0"><RatingsContent /></ScreenContainer>;
}
