import { type GitlabIssue } from '../index.js';
/**
 * Maps importance label names to their value, from 0 (lowest) and then increasing.
 */
export declare const ISSUE_IMPORTANCE_LABELS: {
    'importance:rockbottom': number;
    'importance:low': number;
    'importance:medium': number;
    'importance:high': number;
    'importance:urgent': number;
};
/**
 * Maps difficulty label names to their value, from 0 (easiest) and then increasing.
 */
export declare const ISSUE_DIFFICULTY_LABELS: {
    'difficulty:braindead': number;
    'difficulty:easy': number;
    'difficulty:moderate': number;
    'difficulty:hard': number;
    'difficulty:unknown': number;
};
export declare const difficultyOrImportanceFromLabel: (map: Record<string, number>, labels: GitlabIssue["labels"]) => number | null;
