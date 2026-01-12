import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}
