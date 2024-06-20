import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); // Log the error stack for debugging purposes

  // Set a default status code if it doesn't exist
  const status = err.status || 500;

  // Send the error response
  res.status(status).json({
    status: status,
    message: err.message || 'Internal Server Error'
  });
};
