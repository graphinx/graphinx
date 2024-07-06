import { PayPalTransactionStatus } from '@churros/db/prisma';
export declare function initiatePaypalPayment(title: string, price: number, referenceId: string): Promise<string>;
export declare function finishPaypalPayment(orderId: string): Promise<string>;
export declare function paypalPaymentStatus(status: string): PayPalTransactionStatus;
export declare function checkPaypalPayment(orderId: string): Promise<{
    paid: boolean;
    status: PayPalTransactionStatus;
}>;
