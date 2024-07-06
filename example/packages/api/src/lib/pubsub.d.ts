export declare const publishClient: any;
export declare const subscribeClient: any;
export declare const pubsub: any;
export declare function publish<T>(id: string, action: 'created' | 'updated' | 'deleted', payload: T, discriminant?: string): void;
export declare function subscriptionName(idOrTypename: string, action?: 'created' | 'updated' | 'deleted', discriminant?: string): string;
