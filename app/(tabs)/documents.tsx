import React, { useState, useRef } from "react";
import {
  ScrollView, Text, View, Pressable, Alert, Modal, Image,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { useDocuments, DocumentType, type Document } from "@/lib/documents-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const documentTypes: { type: DocumentType; label: string; icon: string; hint: string }[] = [
  { type: "license",      label: "Driver's License",        icon: "🪪", hint: "Front & back of your license" },
  { type: "registration", label: "Vehicle Registration",    icon: "📋", hint: "Current registration certificate" },
  { type: "insurance",    label: "Insurance Certificate",   icon: "🛡️", hint: "Active insurance policy" },
  { type: "inspection",   label: "Vehicle Inspection",      icon: "🔍", hint: "Latest inspection report" },
  { type: "other",        label: "Other Documents",         icon: "📄", hint: "Any other required documents" },
];

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  verified: { bg: "bg-success/15", text: "text-success", border: "border-success/30" },
  pending:  { bg: "bg-warning/15", text: "text-warning", border: "border-warning/30" },
  rejected: { bg: "bg-error/15",   text: "text-error",   border: "border-error/30"   },
  expired:  { bg: "bg-warning/15", text: "text-warning", border: "border-warning/30" },
};

const statusIcon: Record<string, string> = {
  verified: "✅", pending: "⏳", rejected: "❌", expired: "⚠️",
};

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${["B", "KB", "MB"][i]}`;
}

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onPicked: (type: DocumentType, uri: string, fileName: string, fileSize: number) => void;
}

function UploadModal({ visible, onClose, onPicked }: UploadModalProps) {
  const colors = useColors();
  const [selectedType, setSelectedType] = useState<DocumentType>("license");

  const launch = async (useCamera: boolean) => {
    const { status } = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please grant permission to access photos.");
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, mediaTypes: ["images"] });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = asset.uri.split("/").pop() ?? "document.jpg";
      onPicked(selectedType, asset.uri, fileName, asset.fileSize ?? 800_000);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-3xl px-6 pt-4 pb-10">
          <View className="items-center mb-4">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>
          <Text className="text-lg font-bold text-foreground mb-1">Upload Document</Text>
          <Text className="text-sm text-muted mb-5">Select the document type, then choose the source.</Text>

          {/* Type selector */}
          <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Document Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
            <View className="flex-row gap-2 pr-4">
              {documentTypes.map((dt) => (
                <Pressable
                  key={dt.type}
                  onPress={() => setSelectedType(dt.type)}
                  className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                    selectedType === dt.type ? "bg-primary border-primary" : "bg-surface border-border"
                  }`}
                >
                  <Text className="text-sm">{dt.icon}</Text>
                  <Text className={`text-xs font-semibold ${selectedType === dt.type ? "text-white" : "text-foreground"}`}>
                    {dt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Source buttons */}
          <View className="gap-3">
            <Pressable
              onPress={() => launch(true)}
              className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Text className="text-xl">📷</Text>
              <Text className="text-white font-bold">Take Photo</Text>
            </Pressable>
            <Pressable
              onPress={() => launch(false)}
              className="bg-surface border border-border rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Text className="text-xl">🖼️</Text>
              <Text className="text-foreground font-bold">Choose from Gallery</Text>
            </Pressable>
            <Pressable onPress={onClose} className="py-3 items-center">
              <Text className="text-muted font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function DocumentsContent() {
  const colors = useColors();
  const { documents, addDocument, deleteDocument } = useDocuments();
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const filteredDocuments = selectedType
    ? documents.filter((doc) => doc.type === selectedType)
    : documents;

  const expiredCount = documents.filter((d) => d.status === "expired").length;
  const pendingCount = documents.filter((d) => d.status === "pending").length;

  const handlePickedDocument = async (
    type: DocumentType, uri: string, fileName: string, fileSize: number
  ) => {
    const label = documentTypes.find((d) => d.type === type)?.label ?? "Document";
    await addDocument({
      id: `doc-${Date.now()}`,
      type,
      name: label,
      fileName,
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "pending",
      fileSize,
      mimeType: "image/jpeg",
      // Store the local URI in notes so it can be previewed
      notes: uri,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Uploaded", `${label} added — awaiting admin verification.`);
  };

  const handleDelete = (docId: string, docName: string) => {
    Alert.alert("Delete Document", `Remove "${docName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deleteDocument(docId);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Header */}
        <View className="bg-navy px-6 pt-8 pb-6">
          <Text className="text-white text-2xl font-bold">Documents</Text>
          <Text className="text-white/70 text-sm mt-1">Licenses, registration & certifications</Text>
          <View className="flex-row gap-3 mt-4">
            <View className="bg-white/15 rounded-xl px-3 py-2 flex-1 items-center">
              <Text className="text-white text-lg font-bold">{documents.length}</Text>
              <Text className="text-white/70 text-xs">Total</Text>
            </View>
            <View className="bg-white/15 rounded-xl px-3 py-2 flex-1 items-center">
              <Text className="text-white text-lg font-bold">{documents.filter(d => d.status === "verified").length}</Text>
              <Text className="text-white/70 text-xs">Verified</Text>
            </View>
            <View className={`rounded-xl px-3 py-2 flex-1 items-center ${expiredCount > 0 ? "bg-error/40" : "bg-white/15"}`}>
              <Text className="text-white text-lg font-bold">{expiredCount}</Text>
              <Text className="text-white/70 text-xs">Expired</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4 gap-4">
          {/* Alerts */}
          {expiredCount > 0 && (
            <View className="bg-error/10 border border-error/30 rounded-2xl px-4 py-3 flex-row items-center gap-3">
              <Text className="text-xl">⚠️</Text>
              <View className="flex-1">
                <Text className="text-error font-bold text-sm">{expiredCount} document{expiredCount > 1 ? "s" : ""} expired</Text>
                <Text className="text-error/80 text-xs mt-0.5">Renew immediately to stay compliant</Text>
              </View>
            </View>
          )}
          {pendingCount > 0 && (
            <View className="bg-warning/10 border border-warning/30 rounded-2xl px-4 py-3 flex-row items-center gap-3">
              <Text className="text-xl">⏳</Text>
              <View className="flex-1">
                <Text className="text-warning font-bold text-sm">{pendingCount} awaiting verification</Text>
                <Text className="text-warning/80 text-xs mt-0.5">Admin review in progress</Text>
              </View>
            </View>
          )}

          {/* Upload button */}
          <Pressable
            onPress={() => setUploadModalVisible(true)}
            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-sm"
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Text className="text-xl">📤</Text>
            <Text className="text-white font-bold text-base">Upload New Document</Text>
          </Pressable>

          {/* Type filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 pr-4">
              <Pressable onPress={() => setSelectedType(null)}>
                <View className={`px-4 py-2 rounded-full border ${selectedType === null ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                  <Text className={`text-sm font-semibold ${selectedType === null ? "text-white" : "text-foreground"}`}>
                    All ({documents.length})
                  </Text>
                </View>
              </Pressable>
              {documentTypes.map((dt) => {
                const count = documents.filter((d) => d.type === dt.type).length;
                const isActive = selectedType === dt.type;
                return (
                  <Pressable key={dt.type} onPress={() => setSelectedType(dt.type)}>
                    <View className={`px-4 py-2 rounded-full border flex-row items-center gap-1 ${isActive ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                      <Text className="text-sm">{dt.icon}</Text>
                      <Text className={`text-sm font-semibold ${isActive ? "text-white" : "text-foreground"}`}>{count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Document cards */}
          {filteredDocuments.length === 0 ? (
            <View className="bg-surface rounded-2xl p-10 items-center border border-border">
              <Text className="text-5xl mb-3">📄</Text>
              <Text className="text-foreground font-bold text-base mb-1">No Documents</Text>
              <Text className="text-muted text-sm text-center">
                {selectedType
                  ? `No ${documentTypes.find((d) => d.type === selectedType)?.label.toLowerCase()} uploaded yet`
                  : "Tap Upload to add your first document"}
              </Text>
            </View>
          ) : (
            filteredDocuments.map((doc) => {
              const s = statusStyle[doc.status] ?? statusStyle.pending;
              const hasImagePreview = doc.notes?.startsWith("file://") || doc.notes?.startsWith("content://") || doc.notes?.startsWith("ph://");
              return (
                <View key={doc.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
                  {/* Image preview if available */}
                  {hasImagePreview && (
                    <Image source={{ uri: doc.notes }} className="w-full h-36" resizeMode="cover" />
                  )}
                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-row items-center gap-2 flex-1 pr-3">
                        <Text className="text-xl">{documentTypes.find((d) => d.type === doc.type)?.icon ?? "📄"}</Text>
                        <View className="flex-1">
                          <Text className="text-foreground font-bold text-sm">{doc.name}</Text>
                          <Text className="text-muted text-xs mt-0.5">{doc.fileName}</Text>
                        </View>
                      </View>
                      <View className={`px-2 py-1 rounded-lg border ${s.bg} ${s.border}`}>
                        <Text className={`text-xs font-bold ${s.text}`}>
                          {statusIcon[doc.status]} {doc.status}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-3 flex-wrap">
                      <Text className="text-xs text-muted">Uploaded {doc.uploadedAt}</Text>
                      {doc.expiryDate && (
                        <Text className="text-xs text-muted">· Expires {doc.expiryDate}</Text>
                      )}
                      <Text className="text-xs text-muted">· {formatFileSize(doc.fileSize)}</Text>
                    </View>

                    {doc.rejectionReason && (
                      <View className="bg-error/10 rounded-xl px-3 py-2 mt-3 border border-error/20">
                        <Text className="text-error text-xs font-bold mb-0.5">Rejected:</Text>
                        <Text className="text-error/80 text-xs">{doc.rejectionReason}</Text>
                      </View>
                    )}

                    {/* Actions */}
                    <View className="flex-row gap-2 mt-4">
                      {(doc.status === "rejected" || doc.status === "expired") && (
                        <Pressable
                          onPress={() => setUploadModalVisible(true)}
                          className="flex-1 bg-warning/15 border border-warning/30 rounded-xl py-2.5 items-center"
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        >
                          <Text className="text-warning text-xs font-bold">🔄 Re-upload</Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => handleDelete(doc.id, doc.name)}
                        className="flex-1 bg-error/10 border border-error/20 rounded-xl py-2.5 items-center"
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <Text className="text-error text-xs font-bold">🗑️ Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* Requirements note */}
          <View className="bg-primary/8 border border-primary/20 rounded-2xl p-4">
            <Text className="text-foreground font-bold text-sm mb-2">📋 Requirements</Text>
            {[
              "Driver's License — valid government-issued",
              "Vehicle Registration — current certificate",
              "Insurance — active policy",
              "All documents must be clear and not expired",
            ].map((line) => (
              <Text key={line} className="text-muted text-xs leading-5">• {line}</Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <UploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onPicked={handlePickedDocument}
      />
    </>
  );
}

export default function DocumentsScreen() {
  return (
    <ScreenContainer className="p-0">
      <DocumentsContent />
    </ScreenContainer>
  );
}
