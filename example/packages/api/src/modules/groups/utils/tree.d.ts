export declare function ancestorsOfGroup<T extends {
    familyId?: string | null;
    id: string;
}>(...groups: T[]): Promise<any>;
