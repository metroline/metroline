export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly jsonResponse: number,
    message?: string,
  ) {
    super(message);
  }
}
