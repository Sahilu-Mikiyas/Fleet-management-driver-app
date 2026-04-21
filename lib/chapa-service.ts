/**
 * Chapa Payment Gateway Service
 * Ethiopian payment gateway integration for driver earnings payout
 */

export interface ChapaInitializePaymentRequest {
  amount: number;
  currency?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  tx_ref: string;
  return_url?: string;
  customization?: {
    title?: string;
    description?: string;
  };
}

export interface ChapaTransaction {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  date: string;
  reference: string;
  description: string;
}

export interface ChapaPaymentResponse {
  status: "success" | "error";
  message: string;
  data?: {
    checkout_url: string;
    tx_ref: string;
  };
}

class ChapaPaymentService {
  private apiKey: string;
  private baseUrl = "https://api.chapa.co/v1";
  private publicKey: string;

  constructor(apiKey: string, publicKey: string) {
    this.apiKey = apiKey;
    this.publicKey = publicKey;
  }

  /**
   * Initialize payment with Chapa
   */
  async initializePayment(
    request: ChapaInitializePaymentRequest
  ): Promise<ChapaPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency || "ETB",
          email: request.email,
          first_name: request.first_name,
          last_name: request.last_name,
          phone_number: request.phone_number,
          tx_ref: request.tx_ref,
          return_url: request.return_url || "https://example.com/callback",
          customization: {
            title: request.customization?.title || "Fleet Driver Earnings",
            description:
              request.customization?.description || "Payout for completed trips",
          },
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        return {
          status: "success",
          message: "Payment initialized successfully",
          data: {
            checkout_url: data.data.checkout_url,
            tx_ref: data.data.tx_ref,
          },
        };
      } else {
        return {
          status: "error",
          message: data.message || "Failed to initialize payment",
        };
      }
    } catch (error) {
      console.error("Error initializing Chapa payment:", error);
      return {
        status: "error",
        message: "Network error. Please try again.",
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(txRef: string): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${txRef}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();

      if (data.status === "success") {
        return {
          status: data.data.status,
          message: "Payment verified",
        };
      } else {
        return {
          status: "error",
          message: "Failed to verify payment",
        };
      }
    } catch (error) {
      console.error("Error verifying Chapa payment:", error);
      return {
        status: "error",
        message: "Network error. Please try again.",
      };
    }
  }

  /**
   * Generate unique transaction reference
   */
  generateTxRef(): string {
    return `FD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format amount for Chapa (ETB)
   */
  formatAmount(amount: number): number {
    return Math.round(amount * 100) / 100; // Round to 2 decimal places
  }
}

// Mock Chapa service for development
export class MockChapaService {
  /**
   * Mock payment initialization
   */
  async initializePayment(
    request: ChapaInitializePaymentRequest
  ): Promise<ChapaPaymentResponse> {
    return {
      status: "success",
      message: "Mock payment initialized",
      data: {
        checkout_url: `https://checkout.chapa.co/checkout/web/payment/${request.tx_ref}`,
        tx_ref: request.tx_ref,
      },
    };
  }

  /**
   * Mock payment verification
   */
  async verifyPayment(txRef: string): Promise<{ status: string; message: string }> {
    // Simulate random success/failure for testing
    const isSuccess = Math.random() > 0.3;
    return {
      status: isSuccess ? "completed" : "failed",
      message: isSuccess ? "Payment verified successfully" : "Payment verification failed",
    };
  }

  /**
   * Generate unique transaction reference
   */
  generateTxRef(): string {
    return `FD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format amount for Chapa (ETB)
   */
  formatAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}

// Export both real and mock services
export { ChapaPaymentService };
export default ChapaPaymentService;
