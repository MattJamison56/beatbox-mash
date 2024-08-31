// express.d.ts
declare namespace Express {
  export interface Request {
    user?: {
      userId: number;
      role: string;
    };
    files?: {
      [fieldname: string]: Express.Multer.File[];
    };
  }
}