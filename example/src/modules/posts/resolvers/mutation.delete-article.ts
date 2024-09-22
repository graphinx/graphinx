import { builder, log, prisma, publish } from '#lib';

builder.mutationField('deleteArticle', (t) =>
  t.field({
    type: 'Boolean',
    args: { id: t.arg.id() },
    async authScopes(_, { id }, { user }) {
      if (!user) return false;
      if (user.canEditGroups) return true;

      const article = await prisma.article.findUniqueOrThrow({ where: { id } });

      // Who can delete this article?
      return (
        // Admins
        user.admin ||
        // The author
        user.id === article.authorId ||
        // Other authors of the group
        user.groups.some(
          ({ groupId, canEditArticles }) => canEditArticles && groupId === article.groupId,
        )
      );
    },
    async resolve(_, { id }, { user }) {
      await prisma.article.delete({ where: { id } });

      await log('article', 'delete', { message: `Article ${id} deleted` }, id, user);
      publish(id, 'deleted', id);
      return true;
    },
  }),
);
