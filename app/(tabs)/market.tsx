import React, { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { SegmentedControl, type Segment } from "@/components/segmented-control";
import { MarketplaceContent } from "./marketplace";
import { HistoryContent } from "./history";
import { EarningsContent } from "./earnings";

const segments: Segment[] = [
  { key: "marketplace", label: "Marketplace" },
  { key: "history", label: "History" },
  { key: "earnings", label: "Earnings" },
];

export default function MarketScreen() {
  const [activeTab, setActiveTab] = useState("marketplace");

  return (
    <ScreenContainer className="p-0">
      <SegmentedControl
        segments={segments}
        activeKey={activeTab}
        onSelect={setActiveTab}
      />
      {activeTab === "marketplace" && <MarketplaceContent />}
      {activeTab === "history" && <HistoryContent />}
      {activeTab === "earnings" && <EarningsContent />}
    </ScreenContainer>
  );
}
