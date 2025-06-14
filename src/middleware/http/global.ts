import { NextFunction, Request, Response } from "express";
import { logger } from "../../services/logger/logger";
import { AppError } from "../../errors";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  logger.error("errorHandler middleware error", err);
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      data: null,
      error: {
        message: err.message,
      },
    });
    return;
  }
  res.status(500).json({
    data: null,
    error: {
      message: "Internal Server Error",
    },
  });
}

// TODO: each params type validation should be done as well
export function paramsValidation<T>(
  req: Request,
  _: Response,
  next: NextFunction,
) {
  const missingFields: string[] = [];

  // Iterate over the keys of the interface T
  for (const key of Object.keys(req.params) as Array<keyof T>) {
    if (!req.params[key as string]) {
      missingFields.push(key as string);
    }
  }

  if (missingFields.length > 0) {
    console.log(missingFields);
    return next(
      new AppError(400, `Missing fields: ${missingFields.join(", ")}`),
    );
  }

  next();
}

export function queryValidation<T>(
  req: Request,
  _: Response,
  next: NextFunction,
) {
  const missingFields: string[] = [];

  // Iterate over the keys of the interface T
  for (const key of Object.keys(req.query) as Array<keyof T>) {
    if (!req.query[key as string]) {
      missingFields.push(key as string);
    }
  }

  if (missingFields.length > 0) {
    console.log(`Missing fields: ${missingFields.join(", ")}`);
    return next(
      new AppError(400, `Missing fields: ${missingFields.join(", ")}`),
    );
  }

  next();
}

export async function populateLimitOffset(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const limit = req.query.limit;
  const offset = req.query.offset;
  if(Number.isNaN(Number(limit)) || Number.isNaN(Number(offset))) {
    logger.error("limit or offset not a number")
    return next(new AppError(422, "validation error"))
  }

  req.pagination = {
    limit: Number(limit),
    offset: Number(offset)
  }
  next();
}