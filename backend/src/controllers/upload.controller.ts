import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/errorHandler.js';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const schoolId = (req as AuthRequest).user?.schoolId || 'default';
    const schoolDir = path.join(uploadsDir, schoolId);
    if (!fs.existsSync(schoolDir)) {
      fs.mkdirSync(schoolDir, { recursive: true });
    }
    cb(null, schoolDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images, PDFs, and common document types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Allowed: images, PDF, Word, Excel', 400));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const schoolId = req.user!.schoolId;
    const fileUrl = `/uploads/${schoolId}/${req.file.filename}`;

    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMultiple = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new AppError('No files uploaded', 400);
    }

    const schoolId = req.user!.schoolId;
    const files = Array.isArray(req.files) ? req.files : [req.files];

    const uploadedFiles = files.map((file) => ({
      url: `/uploads/${schoolId}/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.json({ files: uploadedFiles });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const schoolId = req.user!.schoolId;
    const filePath = path.join(uploadsDir, schoolId, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      throw new AppError('File not found', 404);
    }
  } catch (error) {
    next(error);
  }
};





