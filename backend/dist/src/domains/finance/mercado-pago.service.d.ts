export declare class MercadoPagoService {
    createPaymentPreference(payload: {
        orderId: string;
        amount: number;
        title: string;
        customerEmail?: string;
    }): Promise<{
        externalReferenceId: string;
        checkoutUrl: string;
    }>;
    createPosQrOrder(payload: {
        posId: string;
        orderId: string;
        amount: number;
        title: string;
    }): Promise<{
        externalReferenceId: string;
        qrCodeData: string;
    }>;
    verifyPaymentNotification(paymentId: string): Promise<{
        status: string;
        orderId: string;
        amount: number;
    }>;
}
