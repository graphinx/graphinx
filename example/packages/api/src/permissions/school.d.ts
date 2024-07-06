import type { Major, User } from '@churros/db/prisma';
export declare function userIsStudentOfSchool(user: User, school: {
    majors: Major[];
}): boolean;
export declare function userIsStudentOfMajor(user: User, major: Major): boolean;
