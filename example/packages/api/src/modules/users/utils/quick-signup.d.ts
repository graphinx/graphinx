import type { Major, QuickSignup, School } from '@churros/db/prisma';
export declare function quickSignupIsValidFor({ validUntil, school }: QuickSignup & {
    school: School & {
        majors: Major[];
    };
}, majorId: string): boolean;
export declare function cleanInvalidQuickSignups(): Promise<void>;
