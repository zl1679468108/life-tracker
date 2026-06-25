import { Catch, ArgumentsHost, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { captureBackendError } from './error-monitor';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';
    const responseMessage = typeof message === 'string'
      ? message
      : (message as any)?.message || 'Internal server error';

    captureBackendError(exception, {
      path: ctx.getRequest().url,
      method: ctx.getRequest().method,
      status,
    });

    response.status(status).json({
      code: status,
      data: null,
      message: responseMessage,
    });
  }
}
