import React from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRatings } from "@/lib/ratings-context";

export function RatingsContent() {
  const { ratings, averageRating, totalRatings, ratingDistribution } = useRatings();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Text key={i} className="text-lg">
        {i < rating ? "⭐" : "☆"}
      </Text>
    ));
  };

  return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-8">
          <View className="items-center">
            <Text className="text-5xl font-bold text-white mb-2">{averageRating.toFixed(1)}</Text>
            <View className="flex-row gap-1 mb-2">{renderStars(Math.round(averageRating))}</View>
            <Text className="text-white text-sm opacity-80">{totalRatings} ratings from shippers</Text>
          </View>
        </View>

        <View className="px-6 py-6">
          {/* Rating Distribution */}
          <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Rating Breakdown</Text>
            {[5, 4, 3, 2, 1].map((rating) => (
              <View key={rating} className="flex-row items-center gap-3 mb-3">
                <View className="flex-row gap-1 w-12">
                  {renderStars(rating)}
                </View>
                <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary"
                    style={{
                      width: `${totalRatings > 0 ? (ratingDistribution[rating] / totalRatings) * 100 : 0}%`,
                    }}
                  />
                </View>
                <Text className="text-sm text-muted w-8 text-right">{ratingDistribution[rating]}</Text>
              </View>
            ))}
          </View>

          {/* Recent Ratings */}
          <Text className="text-lg font-bold text-foreground mb-4">Recent Feedback</Text>

          {ratings.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-3xl mb-2">📝</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">No Ratings Yet</Text>
              <Text className="text-sm text-muted text-center">
                Complete trips to receive ratings from shippers and build your reputation
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {ratings.map((rating) => (
                <View key={rating.id} className="bg-surface rounded-lg p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="font-semibold text-foreground">{rating.shipper}</Text>
                      <Text className="text-xs text-muted mt-1">{rating.date}</Text>
                    </View>
                    <View className="flex-row gap-1">{renderStars(rating.rating)}</View>
                  </View>

                  <Text className="text-xs bg-primary/10 text-primary rounded px-2 py-1 self-start mb-2">
                    {rating.cargoType}
                  </Text>

                  <Text className="text-sm text-foreground leading-relaxed">{rating.feedback}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
  );
}

export default function RatingsScreen() {
  return (
    <ScreenContainer className="p-0">
      <RatingsContent />
    </ScreenContainer>
  );
}
