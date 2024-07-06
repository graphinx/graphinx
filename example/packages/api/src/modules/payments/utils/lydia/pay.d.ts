import type { LydiaAccount, LydiaTransaction, ShopItem, ShopPayment } from '@churros/db/prisma';
export declare function payEventRegistrationViaLydia(phone: string, registrationId?: string): Promise<void>;
export declare function cancelLydiaTransaction(transaction: LydiaTransaction, vendorToken: string): Promise<void>;
export declare function payShopPaymentViaLydia(phone: string, shopPayment: ShopPayment & {
    shopItem: ShopItem & {
        lydiaAccount: LydiaAccount | null;
    };
    lydiaTransaction: LydiaTransaction | null;
}): Promise<void>;
