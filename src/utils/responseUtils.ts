import { Response } from 'express';

interface ErrorResponse {
  message: string;
  statusCode: number;
}

interface SuccessObjectResponse<T> {
  response: T;
  statusCode: number;
}

interface SuccessMessageResponse {
  message: string;
  statusCode: number;
}

function buildErrorResponse(res: Response, message: string, code: number) {
  const errorResponse: ErrorResponse = {
    message,
    statusCode: code
  };
  return res.status(code).send(errorResponse);
}

function buildObjectResponse<T>(res: Response, object: T) {
  const successResponse: SuccessObjectResponse<T> = {
    response: object,
    statusCode: 200
  };
  return res.status(200).send(successResponse);
}

function buildResponse(res: Response, message: string, code: number) {
  const successResponse: SuccessMessageResponse = {
    message,
    statusCode: code
  };
  return res.status(200).send(successResponse);
}

export { buildErrorResponse, buildObjectResponse, buildResponse };
