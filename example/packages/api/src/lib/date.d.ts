export declare const dateFromNumbers: (numbers: number[]) => Date | undefined;
export declare function schoolYearStart(): Date;
export declare function yearTier(graduationYear: number): number;
export declare function fromYearTier(tier: number): number;
export declare function parseYearTier(yearTierDisplay: string): number;
export declare function soonest(...dates: Array<Date | null | undefined>): Date | undefined;
export declare function latest(...dates: Array<Date | null | undefined>): Date | undefined;
export declare function formatDate(date: Date | undefined | null, style?: Intl.DateTimeFormatOptions['dateStyle']): string;
export declare function formatDateTime(date: Date | undefined | null, dateStyle?: Intl.DateTimeFormatOptions['dateStyle'], timeStyle?: Intl.DateTimeFormatOptions['timeStyle']): string;
export declare function isWithinPartialInterval(date: Date, { start, end }: {
    start?: Date | null;
    end?: Date | null;
}): boolean;
