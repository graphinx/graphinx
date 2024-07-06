import { type Prisma } from '@churros/db/prisma';
import type { Context } from '../lib/index.js';
/**
 * Articles that the given user can see
 * **WARNING: DO *NOT* SPREAD THIS INTO A PRISMA QUERY's `where` DIRECTLY, USE "AND":**
 *
 * ```
 * where: { AND: [ prismaQueryAccessibleArticles(), { ... } ]
 * ```
 *
 * @param user the user
 * @param level if 'wants', only return articles that the user _wants_ to see, if 'can', shows all the articles they have access to
 * @returns a Prisma.ArticleWhereInput, an object to pass inside of a `where` field in a prisma query
 */
export declare function prismaQueryAccessibleArticles(user: Context['user'], level: 'can' | 'wants'): Prisma.ArticleWhereInput;
