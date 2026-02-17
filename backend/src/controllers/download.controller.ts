import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getDownloads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { search, category } = req.query;

    // For now, return mock data structure
    // TODO: Implement actual downloads when schema is updated
    const documents = [
      {
        id: '1',
        name: 'Report Card - Term 1',
        category: 'Report Cards',
        url: '/downloads/report-card-term1.pdf',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Admission Form',
        category: 'Forms',
        url: '/downloads/admission-form.pdf',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Birth Certificate Template',
        category: 'Certificates',
        url: '/downloads/birth-certificate.pdf',
        uploadedAt: new Date().toISOString(),
      },
    ].filter((doc) => {
      if (search && !doc.name.toLowerCase().includes((search as string).toLowerCase())) {
        return false;
      }
      if (category && doc.category !== category) {
        return false;
      }
      return true;
    });

    res.json(documents);
  } catch (error) {
    next(error);
  }
};

