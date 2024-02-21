import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Класс исключения для конфликта полей. Это исключение выбрасывается,
 * когда происходит конфликт данных, например, при попытке зарегистрировать
 * пользователя с уже существующим email или номером телефона.
 *
 * @param {string} field - Название поля, вызвавшего конфликт.
 * @param {string} message - Сообщение об ошибке.
 */
export class FieldConflictException extends HttpException {
  constructor(field: string, message: string) {
    super(
      { field, message, statusCode: HttpStatus.CONFLICT },
      HttpStatus.CONFLICT,
    );
  }
}
