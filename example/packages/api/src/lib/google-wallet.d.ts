import type { Event, Group, Registration, User } from '@churros/db/prisma';
export declare function makeGoogleWalletObject(event: Event & {
    group: Group;
}, registration: Registration & {
    author: User | null;
}): {
    id: string;
    classId: string;
    logo: {
        sourceUri: {
            uri: string;
        };
        contentDescription: {
            defaultValue: {
                language: string;
                value: string;
            };
        };
    };
    cardTitle: {
        defaultValue: {
            language: string;
            value: string;
        };
    };
    subheader: {
        defaultValue: {
            language: string;
            value: any;
        };
    };
    header: {
        defaultValue: {
            language: string;
            value: any;
        };
    };
    textModulesData: {
        id: string;
        header: string;
        body: any;
    }[];
    barcode: {
        type: string;
        value: any;
        alternateText: string;
    };
    hexBackgroundColor: string;
    heroImage: {
        sourceUri: {
            uri: string;
        };
        contentDescription: {
            defaultValue: {
                language: string;
                value: string;
            };
        };
    };
};
export declare const GOOGLE_WALLET_CLASS: {
    id: string;
    classTemplateInfo: {
        cardTemplateOverride: {
            cardRowTemplateInfos: {
                twoItems: {
                    startItem: {
                        firstValue: {
                            fields: {
                                fieldPath: string;
                            }[];
                        };
                    };
                    endItem: {
                        firstValue: {
                            fields: {
                                fieldPath: string;
                            }[];
                        };
                    };
                };
            }[];
        };
    };
};
export declare function registerGoogleWalletClass(data: typeof GOOGLE_WALLET_CLASS): Promise<string>;
