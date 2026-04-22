import React, { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { SegmentedControl, type Segment } from "@/components/segmented-control";
import { MessagesContent } from "./messages";
import { NotificationsContent } from "./notifications";
import { RatingsContent } from "./ratings";

const segments: Segment[] = [
  { key: "messages", label: "Messages" },
  { key: "updates", label: "Updates" },
  { key: "ratings", label: "Ratings" },
];

export default function InboxScreen() {
  const [activeTab, setActiveTab] = useState("messages");

  return (
    <ScreenContainer className="p-0">
      <SegmentedControl
        segments={segments}
        activeKey={activeTab}
        onSelect={setActiveTab}
      />
      {activeTab === "messages" && <MessagesContent />}
      {activeTab === "updates" && <NotificationsContent />}
      {activeTab === "ratings" && <RatingsContent />}
    </ScreenContainer>
  );
}
