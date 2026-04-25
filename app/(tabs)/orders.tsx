import React from "react";
import { ScreenContainer } from "@/components/screen-container";
import { OrdersHub } from "@/components/orders-hub";

export default function OrdersScreen() {
  return (
    <ScreenContainer className="p-0 bg-background" edges={["top"]}>
      <OrdersHub />
    </ScreenContainer>
  );
}
