export declare function updateQueryUsage({ duration, queryName, queryType, token, user, operationName, }: {
    queryType: string;
    queryName: string;
    token?: string;
    user?: string;
    duration: number;
    operationName?: string;
}): Promise<void>;
export declare function updateRateLimitHit({ token, queryName, queryType, user, tryAgainInMs, operationName, }: {
    queryType: string;
    queryName: string;
    token?: string;
    user?: string;
    tryAgainInMs: number;
    operationName?: string;
}): Promise<void>;
export declare function updateCreatedTokensCount({ token, user }: {
    token: string;
    user: string;
}): Promise<void>;
export declare const prometheusClient: any;
