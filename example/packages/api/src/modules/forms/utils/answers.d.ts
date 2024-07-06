import type { QuestionKind } from '@churros/db/prisma';
export declare const REDACTED_ANSWER: string;
export declare function castAnswer(value: string[], createdById: string | null, { scaleEnd, scaleStart, type, anonymous, }: {
    scaleEnd: number | null;
    scaleStart: number | null;
    type: QuestionKind;
    anonymous: boolean;
}, user: undefined | {
    id: string;
}): {
    answer: string[];
};
export declare function answerToString({ answer, question: { scaleEnd, scaleStart, type, anonymous }, createdById, }: {
    answer: string[];
    question: {
        type: QuestionKind;
        scaleStart: number | null;
        scaleEnd: number | null;
        anonymous: boolean;
    };
    createdById: string | null;
}, user?: undefined | {
    id: string;
}): string;
/**
 * Normalizes a scale answer, as stored in the database, to a float between 0 and 1.
 */
export declare function normalizeScaleAnswer(answer: string[]): undefined | number;
