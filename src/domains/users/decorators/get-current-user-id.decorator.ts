import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUserId = createParamDecorator(
  (_, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user.id;
  },
);
