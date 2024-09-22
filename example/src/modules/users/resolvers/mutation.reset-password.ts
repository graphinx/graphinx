import { builder, log, objectValuesFlat, prisma, purgeSessionsUser } from '#lib';
import { hashPassword, verifyPassword } from '#modules/users/utils';

import { userIsAdminOf } from '#permissions';
import { CredentialType as PrismaCredentialType } from '@churros/db/prisma';
import { GraphQLError } from 'graphql';
// TODO rename to change-password

builder.mutationField('resetPassword', (t) =>
  t.field({
    type: 'Boolean',
    errors: {},
    args: {
      uid: t.arg.string(),
      oldPassword: t.arg.string(),
      newPassword: t.arg.string(),
      disconnectAll: t.arg.boolean(),
    },
    async authScopes(_, { uid }, { user }) {
      const studentAssociationIds = objectValuesFlat(
        await prisma.user.findUniqueOrThrow({
          where: { id: user?.id },
          select: {
            major: {
              select: { schools: { select: { studentAssociations: { select: { id: true } } } } },
            },
          },
        }),
      );

      const result = Boolean(userIsAdminOf(user, studentAssociationIds) || uid === user?.uid);
      if (!result) {
        console.error(
          `Cannot edit password: ${uid} =?= ${user?.uid ?? '<none>'} OR ${JSON.stringify(
            user?.admin,
          )}`,
        );
      }

      return result;
    },
    async resolve(_, { uid, oldPassword, newPassword, disconnectAll }, { user }) {
      const userEdited = await prisma.user.findUniqueOrThrow({
        where: { uid },
        include: {
          major: {
            include: {
              ldapSchool: true,
            },
          },
          credentials: true,
        },
      });

      if (newPassword.length < 8)
        throw new GraphQLError('Le mot de passe doit faire au moins 8 caractères');

      for (const credential of userEdited.credentials.filter(
        (c) => c.type === PrismaCredentialType.Password,
      )) {
        if (await verifyPassword(credential.value, oldPassword)) {
          await prisma.user.update({
            where: { id: userEdited.id },
            data: {
              credentials: {
                delete: { id: credential.id },
                create: {
                  type: PrismaCredentialType.Password,
                  value: await hashPassword(newPassword),
                },
              },
            },
          });

          // TODO: support for ldap7
          // if (userEdited.major?.ldapSchool) {
          //   try {
          //     await resetLdapUserPassword(userEdited, newPassword);
          //   } catch (error) {
          //     console.error(error);
          //   }
          // }

          await log(
            'password-reset',
            'reset',
            { message: `Reset password for ${userEdited.email}` },
            userEdited.id,
            user,
          );

          if (disconnectAll) purgeSessionsUser(userEdited.uid);

          return true;
        }
      }

      throw new GraphQLError('Mot de passe incorrect');
    },
  }),
);
