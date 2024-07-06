export declare function authorIsBeneficiary(author: {
    uid: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
}, beneficiary: string, authorEmail: string): boolean;
export declare function preprocessBeneficiary(beneficiary: string): string;
