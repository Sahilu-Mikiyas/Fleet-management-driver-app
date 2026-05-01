import React, { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { SegmentedControl, type Segment } from "@/components/segmented-control";
import { HomeContent } from "./index";
import { MapContent } from "./map";
import { EarningsContent } from "./earnings";
import { InspectionContent } from "./inspection";

const segments: Segment[] = [
  { key: "home", label: "Home" },
  { key: "map", label: "Map" },
  { key: "wallet", label: "Wallet" },
  { key: "inspection", label: "Inspection" },
];

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <ScreenContainer className="p-0">
      <SegmentedControl
        segments={segments}
        activeKey={activeTab}
        onSelect={setActiveTab}
      />
      {activeTab === "home" && <HomeContent />}
      {activeTab === "map" && <MapContent />}
      {activeTab === "wallet" && <EarningsContent />}
      {activeTab === "inspection" && <InspectionContent />}
    </ScreenContainer>
  );
}
