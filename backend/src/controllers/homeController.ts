import { NextFunction, Request, Response } from 'express'

export const home = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      message: `Hello there!😋`,
    })
  } catch (error) {
    next(error)
  }
}