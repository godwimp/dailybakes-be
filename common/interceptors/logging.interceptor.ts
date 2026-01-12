import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    this.logger.log(
      `[${method}] ${url} - ${userAgent} - Request: ${JSON.stringify(body)}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `[${method}] ${url} - Response: ${responseTime}ms`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `[${method}] ${url} - Error: ${responseTime}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}