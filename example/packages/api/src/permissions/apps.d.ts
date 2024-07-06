import { type Context } from '#lib';
export declare function userCanEditApp(_: unknown, { id }: {
    id: string;
}, { user }: {
    user?: Context['user'] | undefined;
}): Promise<boolean>;
