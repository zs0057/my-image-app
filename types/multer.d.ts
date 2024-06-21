declare namespace Express {
  export interface Multer {
    File: {
      path: string;
      originalname: string;
      mimetype: string;
      size: number;
    };
  }

  export interface Request {
    file: Multer.File;
  }
}
