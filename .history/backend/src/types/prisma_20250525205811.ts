import { Prisma } from '@prisma/client';

export type User = Prisma.UserGetPayload<{}>;
export type Role = Prisma.UserScalarFieldEnum;

// Add other Prisma types as needed 