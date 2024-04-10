import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
export async function markdownToHtml(schema, markdown, items, { downlevelHeadings = true, referencePath = ((_, ref) => `/${ref.module}/${ref.name}`) } = {}) {
    return await unified()
        .use(remarkParse)
        // @ts-expect-error dunno why TS errors, but it works anyways
        .use(() => ({ children }) => {
        if (downlevelHeadings)
            for (const child of children) {
                if (child.type === 'heading')
                    child.depth = Math.min(child.depth + 1, 6);
            }
    })
        .use(remarkRehype)
        .use(rehypeStringify)
        .process(markdown)
        .then(String)
        .then(html => html
        // auto-link "query foo", "mutation bar", and "subscription baz"
        .replaceAll(/(query|mutation|subscription) ([a-zA-Z0-9]+)/g, (match, type, name) => {
        const r = items.find(r => r.name === name);
        return r ? `<a href="/${referencePath(schema, r)}">${r.name}</a>` : match;
    })
        // auto-link "registerApp" but not "user"
        .split(' ')
        .map(word => {
        const r = items.find(r => r.name === word);
        if (!r)
            return word;
        const path = referencePath(schema, r);
        return path ? `<a href="/${path}">${word}</a>` : word;
    })
        .join(' '));
}
