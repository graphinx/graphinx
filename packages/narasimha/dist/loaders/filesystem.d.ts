import { type ItemReferencePathResolver, type PantryLoader } from '../pantry.js';
export declare const filesystem: PantryLoader<{
    directory: string;
    referencePathResolver: ItemReferencePathResolver;
}>;
/**
 * Load modules from the filesystem. The directory should contain a README.md file. Included items are determined by the files present in the types/ and resolvers/ sub-directories. Resolvers are expected to be named query.*.ts, mutation.*.ts, and subscription.*.ts. Types are expected to be named *.ts.
 */
export default filesystem;
