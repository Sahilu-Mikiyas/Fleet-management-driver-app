import React, { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { SegmentedControl, type Segment } from "@/components/segmented-control";
import { ProfileContent } from "./profile";
import { DocumentsContent } from "./documents";
import { FavoritesContent } from "./favorites";

const segments: Segment[] = [
  { key: "profile", label: "Profile" },
  { key: "documents", label: "Documents" },
  { key: "saved", label: "Saved" },
];

export default function AccountScreen() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <ScreenContainer className="p-0">
      <SegmentedControl
        segments={segments}
        activeKey={activeTab}
        onSelect={setActiveTab}
      />
      {activeTab === "profile" && <ProfileContent />}
      {activeTab === "documents" && <DocumentsContent />}
      {activeTab === "saved" && <FavoritesContent />}
    </ScreenContainer>
  );
}
