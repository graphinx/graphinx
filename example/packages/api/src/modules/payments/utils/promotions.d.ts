export declare function priceWithPromotionsApplied(ticket: {
    price: number;
    id: string;
}, user: {
    id: string;
} | undefined): Promise<any>;
