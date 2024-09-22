import { builder, log, prisma, sendMail } from '#lib';
import { GraphQLError } from 'graphql';
import { prismaUserFilterForStudentAssociationAdmins } from '../utils/index.js';

// TODO rename registration to reject-user-candidate
builder.mutationField('refuseRegistration', (t) =>
  t.field({
    authScopes: { studentAssociationAdmin: true, admin: true },
    type: 'Boolean',
    args: { email: t.arg.string(), reason: t.arg.string() },
    async resolve(_, { email, reason }, { user }) {
      if (!user) throw new GraphQLError("Vous n'êtes pas connecté·e");

      let candidate = await prisma.userCandidate.findUnique({
        where: { email, ...prismaUserFilterForStudentAssociationAdmins(user) },
      });
      if (!candidate) throw new GraphQLError('Candidat·e introuvable');

      await sendMail('signup-rejected', email, { reason }, {});
      candidate = await prisma.userCandidate.delete({ where: { email } });

      await log(
        'signup',
        'refuse',
        { message: `Refus de l'inscription de ${email} pour ${reason}` },
        candidate.id,
        user,
      );
      return true;
    },
  }),
);
