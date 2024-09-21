import { builder, graphinx } from '#lib';

export type HealthCheck = {
  redis: { publish: boolean; subscribe: boolean };
  database: { prisma: boolean };
  ldap: { school: boolean; internal: boolean };
  mail: { smtp: boolean };
};

export const HealthCheckType = builder.objectRef<HealthCheck>('HealthCheck').implement({
  description: 'Results of a health self-check',
  fields: (t) => ({
    redis: t.field({
      type: builder.objectRef<HealthCheck['redis']>('RedisHealthCheck').implement({
        ...graphinx('health-checks'),
        fields: (t) => ({
          subscribe: t.boolean({
            description: 'Whether the Redis subscriber client is ready',
            resolve: ({ subscribe }) => subscribe,
          }),
          publish: t.boolean({
            description: 'Whether the Redis publisher client is ready',
            resolve: ({ publish }) => publish,
          }),
        }),
      }),
      resolve: ({ redis }) => redis,
    }),
    database: t.field({
      type: builder.objectRef<HealthCheck['database']>('DatabaseHealthCheck').implement({
        ...graphinx('health-checks'),
        fields: (t) => ({
          prisma: t.boolean({
            resolve: ({ prisma }) => prisma,
          }),
        }),
      }),
      resolve: ({ database }) => database,
    }),
    ldap: t.field({
      type: builder.objectRef<HealthCheck['ldap']>('LdapHealthCheck').implement({
        ...graphinx('health-checks'),
        fields: (t) => ({
          school: t.boolean({
            description: 'Whether the LDAP school client is ready',
            resolve: ({ school }) => school,
          }),
          internal: t.boolean({
            description: 'Whether the LDAP internal client is ready',
            resolve: ({ internal }) => internal,
          }),
        }),
      }),
      resolve: ({ ldap }) => ldap,
    }),
    mail: t.field({
      type: builder.objectRef<HealthCheck['mail']>('MailHealthCheck').implement({
        ...graphinx('health-checks'),
        fields: (t) => ({
          smtp: t.boolean({
            description: 'Whether the SMTP client is ready',
            resolve: ({ smtp }) => smtp,
          }),
        }),
      }),
      resolve: ({ mail }) => mail,
    }),
  }),
});
