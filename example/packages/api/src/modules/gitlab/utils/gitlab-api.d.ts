import { IssueState } from '../index.js';
export type GitlabIssue = {
    state: string;
    description: string;
    updatedAt: string;
    iid: number;
    labels: {
        nodes: Array<{
            title: string;
        }>;
    };
    title: string;
    discussions: {
        nodes: Array<{
            notes: {
                nodes: Array<{
                    body: string;
                    system: boolean;
                    internal: boolean;
                    author: {
                        avatarUrl: string;
                        name: string;
                        webUrl: string;
                    };
                    createdAt: string;
                }>;
            };
        }>;
    };
};
export type GitlabAPIResponse = {
    fromIssuebot: Array<GitlabIssue & {
        closedAsDuplicateOf: null | GitlabIssue;
    }>;
    fromGitlabUsers: Array<GitlabIssue & {
        closedAsDuplicateOf: null | GitlabIssue;
    }>;
};
export declare const gitlabAPIIssueQuery = "\n  state\n  description\n  updatedAt\n  iid\n  labels { nodes { title }}\n  title\n  discussions { nodes { notes { nodes {\n    body\n    system\n    internal\n    author { avatarUrl name webUrl }\n    createdAt\n  }}}}\n";
export declare function makeIssue({ state, description, updatedAt, iid, labels, title, discussions }: GitlabIssue, duplicatedFrom: number | undefined): {
    title: string;
    body: string;
    difficulty: number | null;
    importance: number | null;
    number: number;
    state: IssueState;
    submittedAt: Date;
    deployedIn: string;
    duplicatedFrom: number | null;
    comments: {
        body: string;
        authorName: string;
        authorAvatarUrl: string;
        authorGitlabUrl: string;
        addedAt: Date;
    }[];
};
