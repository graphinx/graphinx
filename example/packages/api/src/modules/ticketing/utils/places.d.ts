export declare const placesLeft: (ticket: {
    name: string;
    capacity: number;
    registrations: Array<{
        paid: boolean;
        opposedAt: Date | null;
        cancelledAt: Date | null;
    }>;
    group: null | {
        capacity: number;
        tickets: Array<{
            registrations: Array<{
                paid: boolean;
                opposedAt: Date | null;
                cancelledAt: Date | null;
            }>;
        }>;
    };
}) => number;
