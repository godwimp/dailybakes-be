import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { JwtPayload } from 'common/interfaces/jwt-payload.interface';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.access_token || null,
      ]),
        secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}
