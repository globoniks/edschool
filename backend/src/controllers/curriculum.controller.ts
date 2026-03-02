import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const createCurriculumSchema = z.object({
  classId: z.string(),
  subjectId: z.string(),
  academicYear: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

const updateCurriculumSchema = createCurriculumSchema.partial();

const createChapterSchema = z.object({
  curriculumId: z.string(),
  title: z.string().min(1),
  order: z.number().int().min(0).optional(),
  description: z.string().optional(),
});

const updateChapterSchema = z.object({
  title: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
  description: z.string().optional(),
});

/** GET /api/curriculum - list curricula (filter by classId, subjectId, academicYear) */
export const listCurricula = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, subjectId, academicYear } = req.query;
    const where: { schoolId: string; classId?: string; subjectId?: string; academicYear?: string } = { schoolId };
    if (classId) where.classId = classId as string;
    if (subjectId) where.subjectId = subjectId as string;
    if (academicYear) where.academicYear = academicYear as string;

    const curricula = await prisma.curriculum.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true } },
        _count: { select: { chapters: true } },
      },
      orderBy: [{ academicYear: 'desc' }, { classId: 'asc' }],
    });
    res.json(curricula);
  } catch (error) {
    next(error);
  }
};

/** GET /api/curriculum/class/:classId - all curricula for a class (with chapters) */
export const getCurriculaByClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const schoolId = req.user!.schoolId;

    const class_ = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!class_) throw new AppError('Class not found', 404);

    const curricula = await prisma.curriculum.findMany({
      where: { classId, schoolId },
      include: {
        subject: { select: { id: true, name: true } },
        chapters: { orderBy: { order: 'asc' } },
      },
      orderBy: { subject: { name: 'asc' } },
    });
    res.json(curricula);
  } catch (error) {
    next(error);
  }
};

/** GET /api/curriculum/:id - get one curriculum with chapters */
export const getCurriculum = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const curriculum = await prisma.curriculum.findFirst({
      where: { id, schoolId },
      include: {
        class: true,
        subject: true,
        chapters: { orderBy: { order: 'asc' } },
      },
    });
    if (!curriculum) throw new AppError('Curriculum not found', 404);
    res.json(curriculum);
  } catch (error) {
    next(error);
  }
};

/** POST /api/curriculum - create curriculum */
export const createCurriculum = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createCurriculumSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const [class_, subject] = await Promise.all([
      prisma.class.findFirst({ where: { id: data.classId, schoolId } }),
      prisma.subject.findFirst({ where: { id: data.subjectId, schoolId } }),
    ]);
    if (!class_) throw new AppError('Class not found', 404);
    if (!subject) throw new AppError('Subject not found', 404);

    const curriculum = await prisma.curriculum.create({
      data: {
        schoolId,
        classId: data.classId,
        subjectId: data.subjectId,
        academicYear: data.academicYear,
        name: data.name ?? `${class_.name} ${subject.name}`,
        description: data.description,
      },
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(curriculum);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/curriculum/:id - update curriculum */
export const updateCurriculum = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = updateCurriculumSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const curriculum = await prisma.curriculum.findFirst({
      where: { id, schoolId },
    });
    if (!curriculum) throw new AppError('Curriculum not found', 404);

    const updated = await prisma.curriculum.update({
      where: { id },
      data: body,
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true } },
        chapters: { orderBy: { order: 'asc' } },
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/curriculum/:id */
export const deleteCurriculum = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const curriculum = await prisma.curriculum.findFirst({
      where: { id, schoolId },
    });
    if (!curriculum) throw new AppError('Curriculum not found', 404);

    await prisma.curriculum.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/** POST /api/curriculum/chapters - add chapter */
export const createChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createChapterSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const curriculum = await prisma.curriculum.findFirst({
      where: { id: data.curriculumId, schoolId },
    });
    if (!curriculum) throw new AppError('Curriculum not found', 404);

    const maxOrder = await prisma.curriculumChapter.aggregate({
      where: { curriculumId: data.curriculumId },
      _max: { order: true },
    });
    const order = data.order ?? (maxOrder._max.order ?? 0) + 1;

    const chapter = await prisma.curriculumChapter.create({
      data: {
        curriculumId: data.curriculumId,
        title: data.title,
        order,
        description: data.description,
      },
    });
    res.status(201).json(chapter);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/curriculum/chapters/:id - update chapter */
export const updateChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = updateChapterSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const chapter = await prisma.curriculumChapter.findFirst({
      where: { id },
      include: { curriculum: true },
    });
    if (!chapter || chapter.curriculum.schoolId !== schoolId) throw new AppError('Chapter not found', 404);

    const updated = await prisma.curriculumChapter.update({
      where: { id },
      data: body,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/curriculum/chapters/:id */
export const deleteChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const chapter = await prisma.curriculumChapter.findFirst({
      where: { id },
      include: { curriculum: true },
    });
    if (!chapter || chapter.curriculum.schoolId !== schoolId) throw new AppError('Chapter not found', 404);

    await prisma.curriculumChapter.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const reorderChaptersSchema = z.object({
  curriculumId: z.string(),
  chapterIds: z.array(z.string()).min(1),
});

/** POST /api/curriculum/chapters/reorder - set order of chapters by ordered id list */
export const reorderChapters = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = reorderChaptersSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const curriculum = await prisma.curriculum.findFirst({
      where: { id: data.curriculumId, schoolId },
    });
    if (!curriculum) throw new AppError('Curriculum not found', 404);

    await prisma.$transaction(
      data.chapterIds.map((id, index) =>
        prisma.curriculumChapter.updateMany({
          where: { id, curriculumId: data.curriculumId },
          data: { order: index },
        })
      )
    );

    const updated = await prisma.curriculum.findFirst({
      where: { id: data.curriculumId },
      include: { chapters: { orderBy: { order: 'asc' } } },
    });
    res.json(updated?.chapters ?? []);
  } catch (error) {
    next(error);
  }
};
