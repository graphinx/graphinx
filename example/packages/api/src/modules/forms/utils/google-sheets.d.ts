import type { sheets_v4 } from 'googleapis';
export declare const ANSWERS_SHEET_NAME = "R\u00E9ponses";
export declare function removeAnswersRowsForUser(spreadsheetId: string, sheets: sheets_v4.Sheets, userId: string, questionsCount: number): Promise<void>;
export declare function appendFormAnswersToGoogleSheets(formId: string, sheets: sheets_v4.Sheets, userId: string): Promise<void>;
