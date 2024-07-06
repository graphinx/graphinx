/**
 * Maps user input replacement keys (e.g. [prenom]) to their user property keys (e.g. firstName)
 */
export declare const REPLACE_MAP: {
    readonly prénom: "firstName";
    readonly nom: "lastName";
    readonly 'nom de famille': "lastName";
    readonly filière: "major.shortName";
    readonly uid: "uid";
    readonly promo: "graduationYear";
    readonly année: "yearTier";
};
