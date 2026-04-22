import React, { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { SegmentedControl, type Segment } from "@/components/segmented-control";
import { HomeContent } from "./index";
import { MapContent } from "./map";
import { InspectionContent } from "./inspection";

const segments: Segment[] = [
  { key: "home", label: "Home" },
  { key: "map", label: "Map" },
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
      {activeTab === "inspection" && <InspectionContent />}
    </ScreenContainer>
  );
}
