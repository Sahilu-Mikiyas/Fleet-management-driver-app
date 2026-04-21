import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type DocumentType = "license" | "registration" | "insurance" | "inspection" | "other";
export type VerificationStatus = "pending" | "verified" | "rejected" | "expired";

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  fileName: string;
  uploadedAt: string;
  expiryDate?: string;
  status: VerificationStatus;
  fileSize: number;
  mimeType: string;
  notes?: string;
  rejectionReason?: string;
}

interface DocumentsContextType {
  documents: Document[];
  addDocument: (document: Document) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  updateDocumentStatus: (documentId: string, status: VerificationStatus) => Promise<void>;
  getDocumentsByType: (type: DocumentType) => Document[];
  getExpiredDocuments: () => Document[];
  isLoading: boolean;
}

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load documents from AsyncStorage on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const stored = await AsyncStorage.getItem("driver_documents");
      if (stored) {
        setDocuments(JSON.parse(stored));
      } else {
        // Initialize with mock documents
        const mockDocs: Document[] = [
          {
            id: "doc-1",
            type: "license",
            name: "Driver's License",
            fileName: "license_2024.pdf",
            uploadedAt: "2026-03-15",
            expiryDate: "2027-03-15",
            status: "verified",
            fileSize: 2048000,
            mimeType: "application/pdf",
          },
          {
            id: "doc-2",
            type: "registration",
            name: "Vehicle Registration",
            fileName: "vehicle_reg_2024.pdf",
            uploadedAt: "2026-03-20",
            expiryDate: "2027-03-20",
            status: "verified",
            fileSize: 1536000,
            mimeType: "application/pdf",
          },
          {
            id: "doc-3",
            type: "insurance",
            name: "Vehicle Insurance",
            fileName: "insurance_2024.pdf",
            uploadedAt: "2026-03-25",
            expiryDate: "2026-09-25",
            status: "pending",
            fileSize: 1024000,
            mimeType: "application/pdf",
            notes: "Awaiting verification from admin",
          },
        ];
        setDocuments(mockDocs);
        await AsyncStorage.setItem("driver_documents", JSON.stringify(mockDocs));
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addDocument = async (document: Document) => {
    try {
      const updated = [...documents, document];
      setDocuments(updated);
      await AsyncStorage.setItem("driver_documents", JSON.stringify(updated));
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const updated = documents.filter((doc) => doc.id !== documentId);
      setDocuments(updated);
      await AsyncStorage.setItem("driver_documents", JSON.stringify(updated));
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  };

  const updateDocumentStatus = async (documentId: string, status: VerificationStatus) => {
    try {
      const updated = documents.map((doc) =>
        doc.id === documentId ? { ...doc, status } : doc
      );
      setDocuments(updated);
      await AsyncStorage.setItem("driver_documents", JSON.stringify(updated));
    } catch (error) {
      console.error("Error updating document status:", error);
      throw error;
    }
  };

  const getDocumentsByType = (type: DocumentType) => {
    return documents.filter((doc) => doc.type === type);
  };

  const getExpiredDocuments = () => {
    const today = new Date();
    return documents.filter((doc) => {
      if (!doc.expiryDate) return false;
      const expiry = new Date(doc.expiryDate);
      return expiry < today;
    });
  };

  return (
    <DocumentsContext.Provider
      value={{
        documents,
        addDocument,
        deleteDocument,
        updateDocumentStatus,
        getDocumentsByType,
        getExpiredDocuments,
        isLoading,
      }}
    >
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentsContext);
  if (!context) {
    throw new Error("useDocuments must be used within DocumentsProvider");
  }
  return context;
}
