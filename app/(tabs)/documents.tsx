import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useDocuments, DocumentType } from "@/lib/documents-context";

const documentTypes: { type: DocumentType; label: string; icon: string }[] = [
  { type: "license", label: "Driver's License", icon: "🪪" },
  { type: "registration", label: "Vehicle Registration", icon: "📋" },
  { type: "insurance", label: "Insurance Certificate", icon: "🛡️" },
  { type: "inspection", label: "Vehicle Inspection", icon: "🔍" },
  { type: "other", label: "Other Documents", icon: "📄" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "verified":
      return "bg-green-100 text-green-700 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    case "expired":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "verified":
      return "✅";
    case "pending":
      return "⏳";
    case "rejected":
      return "❌";
    case "expired":
      return "⚠️";
    default:
      return "❓";
  }
};

export default function DocumentsScreen() {
  const { documents, deleteDocument } = useDocuments();
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);

  const filteredDocuments = selectedType
    ? documents.filter((doc) => doc.type === selectedType)
    : documents;

  const handleDelete = (docId: string, docName: string) => {
    Alert.alert("Delete Document", `Are you sure you want to delete "${docName}"?`, [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteDocument(docId);
            Alert.alert("Success", "Document deleted successfully");
          } catch (error) {
            Alert.alert("Error", "Failed to delete document");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const expiredCount = documents.filter((doc) => doc.status === "expired").length;
  const pendingCount = documents.filter((doc) => doc.status === "pending").length;

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold mb-2">Documents</Text>
          <Text className="text-white text-sm opacity-80">Manage your licenses and registrations</Text>
        </View>

        <View className="px-4 py-6 gap-6">
          {/* Status Summary */}
          <View className="gap-3">
            {expiredCount > 0 && (
              <View className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex-row items-center gap-3">
                <Text className="text-2xl">⚠️</Text>
                <View className="flex-1">
                  <Text className="text-orange-900 font-semibold">{expiredCount} Document(s) Expired</Text>
                  <Text className="text-orange-700 text-xs">Please renew immediately</Text>
                </View>
              </View>
            )}

            {pendingCount > 0 && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-row items-center gap-3">
                <Text className="text-2xl">⏳</Text>
                <View className="flex-1">
                  <Text className="text-yellow-900 font-semibold">{pendingCount} Document(s) Pending</Text>
                  <Text className="text-yellow-700 text-xs">Awaiting admin verification</Text>
                </View>
              </View>
            )}
          </View>

          {/* Document Type Filter */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">Filter by Type</Text>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => setSelectedType(null)}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
              >
                <View
                  className={`px-4 py-2 rounded-full border ${
                    selectedType === null
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedType === null ? "text-white" : "text-foreground"
                    }`}
                  >
                    All ({documents.length})
                  </Text>
                </View>
              </Pressable>

              {documentTypes.map((docType) => {
                const count = documents.filter((doc) => doc.type === docType.type).length;
                return (
                  <Pressable
                    key={docType.type}
                    onPress={() => setSelectedType(docType.type)}
                    style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
                  >
                    <View
                      className={`px-4 py-2 rounded-full border ${
                        selectedType === docType.type
                          ? "bg-primary border-primary"
                          : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          selectedType === docType.type ? "text-white" : "text-foreground"
                        }`}
                      >
                        {docType.icon} {count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Upload New Document Button */}
          <Pressable
            onPress={() => {
              Alert.alert(
                "Upload Document",
                "In a production app, this would open the device file picker to select a document to upload."
              );
            }}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <View className="bg-primary rounded-lg py-4 items-center flex-row justify-center gap-2">
              <Text className="text-2xl">📤</Text>
              <Text className="text-white font-bold">Upload New Document</Text>
            </View>
          </Pressable>

          {/* Documents List */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">
              {selectedType
                ? documentTypes.find((dt) => dt.type === selectedType)?.label
                : "All Documents"}
            </Text>

            {filteredDocuments.length === 0 ? (
              <View className="bg-surface rounded-lg p-8 items-center border border-border">
                <Text className="text-4xl mb-2">📄</Text>
                <Text className="text-foreground font-semibold mb-1">No Documents</Text>
                <Text className="text-muted text-sm text-center">
                  {selectedType
                    ? `No ${documentTypes.find((dt) => dt.type === selectedType)?.label.toLowerCase()} documents yet`
                    : "Upload your first document to get started"}
                </Text>
              </View>
            ) : (
              filteredDocuments.map((doc) => (
                <View key={doc.id} className="bg-surface rounded-lg border border-border overflow-hidden">
                  {/* Document Header */}
                  <View className="p-4 border-b border-border">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold text-base">{doc.name}</Text>
                        <Text className="text-muted text-xs mt-1">{doc.fileName}</Text>
                      </View>
                      <View
                        className={`px-3 py-1 rounded-full border ${getStatusColor(doc.status)}`}
                      >
                        <Text className="text-xs font-semibold">
                          {getStatusIcon(doc.status)} {doc.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Document Details */}
                  <View className="px-4 py-3 gap-2">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-muted text-xs">Uploaded</Text>
                      <Text className="text-foreground text-xs font-mono">{doc.uploadedAt}</Text>
                    </View>

                    {doc.expiryDate && (
                      <View className="flex-row justify-between items-center">
                        <Text className="text-muted text-xs">Expires</Text>
                        <Text className="text-foreground text-xs font-mono">{doc.expiryDate}</Text>
                      </View>
                    )}

                    <View className="flex-row justify-between items-center">
                      <Text className="text-muted text-xs">File Size</Text>
                      <Text className="text-foreground text-xs font-mono">
                        {formatFileSize(doc.fileSize)}
                      </Text>
                    </View>

                    {doc.notes && (
                      <View className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 mt-2">
                        <Text className="text-blue-700 dark:text-blue-300 text-xs">{doc.notes}</Text>
                      </View>
                    )}

                    {doc.rejectionReason && (
                      <View className="bg-red-50 dark:bg-red-900/20 rounded p-2 mt-2">
                        <Text className="text-red-700 dark:text-red-300 text-xs font-semibold mb-1">
                          Rejection Reason:
                        </Text>
                        <Text className="text-red-700 dark:text-red-300 text-xs">
                          {doc.rejectionReason}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Document Actions */}
                  <View className="px-4 py-3 flex-row gap-2 border-t border-border bg-surface/50">
                    <Pressable
                      onPress={() => {
                        Alert.alert(
                          "View Document",
                          "In a production app, this would open the document viewer."
                        );
                      }}
                      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
                      className="flex-1"
                    >
                      <View className="bg-primary/10 rounded py-2 items-center">
                        <Text className="text-primary font-semibold text-sm">👁️ View</Text>
                      </View>
                    </Pressable>

                    {doc.status === "rejected" || doc.status === "expired" ? (
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            "Re-upload Document",
                            "In a production app, this would allow you to re-upload the document."
                          );
                        }}
                        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
                        className="flex-1"
                      >
                        <View className="bg-orange-100 rounded py-2 items-center">
                          <Text className="text-orange-700 font-semibold text-sm">🔄 Re-upload</Text>
                        </View>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => handleDelete(doc.id, doc.name)}
                        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
                        className="flex-1"
                      >
                        <View className="bg-red-100 rounded py-2 items-center">
                          <Text className="text-red-700 font-semibold text-sm">🗑️ Delete</Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Document Requirements */}
          <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <Text className="text-blue-900 dark:text-blue-100 font-semibold mb-2">📋 Document Requirements</Text>
            <Text className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed mb-2">
              • Driver's License: Valid government-issued ID
            </Text>
            <Text className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed mb-2">
              • Vehicle Registration: Current registration certificate
            </Text>
            <Text className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed mb-2">
              • Insurance: Active vehicle insurance policy
            </Text>
            <Text className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
              • All documents must be clear, legible, and not expired
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
