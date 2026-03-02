import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { getParentAccessibleStudents, getTeacherAccessibleClasses } from '../utils/permissions.js';

const createStudentSchema = z.object({
  admissionNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.string(),
  bloodGroup: z.string().optional(),
  photo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  admissionDate: z.string().transform((str) => new Date(str)).optional(),
  classId: z.string().optional(),
  parentIds: z.array(z.string()).optional(),
});

const bulkStudentItemSchema = z.object({
  admissionNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.string().min(1),
  bloodGroup: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().nullable(),
});

const bulkCreateSchema = z.object({
  classId: z.string().min(1),
  students: z.array(bulkStudentItemSchema).min(1).max(500),
});

const bulkClassSchema = z.object({
  classId: z.string().min(1),
  studentIds: z.array(z.string()).min(1).max(500),
});

export const createStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createStudentSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    // Check if admission number exists
    const existing = await prisma.student.findUnique({
      where: { admissionNumber: data.admissionNumber },
    });

    if (existing) {
      throw new AppError('Admission number already exists', 400);
    }

    const { parentIds, ...studentData } = data;

    const student = await prisma.student.create({
      data: {
        ...studentData,
        schoolId,
        admissionDate: data.admissionDate || new Date(),
        parents: parentIds
          ? {
              create: parentIds.map((parentId) => ({
                parentId,
                relationship: 'Parent',
                isPrimary: false,
              })),
            }
          : undefined,
      },
      include: {
        class: true,
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
};

export const getStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, search, gender, status, page = '1', limit = '20' } = req.query;

    const MAX_LIST_LIMIT = 6000; // safe cap for 5k-student schools
    const limitNum = Math.min(Number(limit) || 20, MAX_LIST_LIMIT);
    const pageNum = Math.max(1, Number(page) || 1);

    const where: any = { schoolId };

    // Students should only see their own record
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (!me) {
        throw new AppError('Student not found', 404);
      }
      where.id = me.id;
    }
    // Parents can only see their own children
    else if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (parent) {
        const accessibleStudentIds = await getParentAccessibleStudents(parent.id);
        where.id = { in: accessibleStudentIds };
      } else {
        where.id = { in: [] }; // No access
      }
    }
    // Teachers can only see students in their assigned classes
    else if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (teacher) {
        const accessibleClassIds = await getTeacherAccessibleClasses(teacher.id);
        where.classId = { in: accessibleClassIds };
      } else {
        where.classId = { in: [] }; // No access
      }
    }

    if (classId) {
      where.classId = classId as string;
    }

    if (gender) {
      where.gender = gender as string;
    }

    if (status) {
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { admissionNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          class: true,
          parents: {
            include: {
              parent: true,
            },
          },
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({
      students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const where: any = { id, schoolId };

    // Students can only fetch their own profile
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (!me || me.id !== id) {
        throw new AppError('Forbidden', 403);
      }
    }

    const student = await prisma.student.findFirst({
      where,
      include: {
        class: true,
        parents: {
          include: {
            parent: true,
          },
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        examMarks: {
          include: {
            exam: true,
            subject: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        feePayments: {
          include: {
            feeStructure: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Students cannot update student records
    if (req.user!.role === 'STUDENT') {
      throw new AppError('Students cannot modify student records', 403);
    }

    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const data = createStudentSchema.partial().parse(req.body);

    const student = await prisma.student.findFirst({
      where: { id, schoolId },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const updated = await prisma.student.update({
      where: { id },
      data,
      include: {
        class: true,
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const student = await prisma.student.findFirst({
      where: { id, schoolId },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    await prisma.student.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Student deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

/** POST /api/students/bulk - create multiple students and assign to a class */
export const bulkCreateStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = bulkCreateSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const classExists = await prisma.class.findFirst({
      where: { id: data.classId, schoolId },
    });
    if (!classExists) {
      throw new AppError('Class not found', 404);
    }

    const existingAdmissionNumbers = await prisma.student.findMany({
      where: {
        admissionNumber: { in: data.students.map((s) => s.admissionNumber) },
      },
      select: { admissionNumber: true },
    });
    const existingSet = new Set(existingAdmissionNumbers.map((r) => r.admissionNumber));

    const toCreate = data.students.filter((s) => !existingSet.has(s.admissionNumber));
    const errors: { admissionNumber: string; message: string }[] = data.students
      .filter((s) => existingSet.has(s.admissionNumber))
      .map((s) => ({ admissionNumber: s.admissionNumber, message: 'Admission number already exists' }));

    const created: any[] = [];
    for (const s of toCreate) {
      try {
        const dob = new Date(s.dateOfBirth);
        if (isNaN(dob.getTime())) {
          errors.push({ admissionNumber: s.admissionNumber, message: 'Invalid date of birth' });
          continue;
        }
        const student = await prisma.student.create({
          data: {
            schoolId,
            classId: data.classId,
            admissionNumber: s.admissionNumber,
            firstName: s.firstName,
            lastName: s.lastName,
            dateOfBirth: dob,
            gender: s.gender,
            bloodGroup: s.bloodGroup ?? undefined,
            phone: s.phone ?? undefined,
            email: s.email ?? undefined,
            admissionDate: new Date(),
          },
          include: { class: true },
        });
        created.push(student);
      } catch (err: any) {
        errors.push({ admissionNumber: s.admissionNumber, message: err?.message || 'Failed to create' });
      }
    }

    res.status(201).json({
      created: created.length,
      errors: errors.length ? errors : undefined,
      students: created,
    });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/students/bulk-class - assign existing students to a class */
export const bulkAssignClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = bulkClassSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const classExists = await prisma.class.findFirst({
      where: { id: data.classId, schoolId },
    });
    if (!classExists) {
      throw new AppError('Class not found', 404);
    }

    const result = await prisma.student.updateMany({
      where: {
        id: { in: data.studentIds },
        schoolId,
      },
      data: { classId: data.classId },
    });

    res.json({ updated: result.count });
  } catch (error) {
    next(error);
  }
};

/** Parse a single CSV line respecting quoted fields (RFC 4180 style) */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let field = '';
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          field += line[i];
          i++;
        }
      }
      result.push(field);
    } else {
      let field = '';
      while (i < line.length && line[i] !== ',') {
        field += line[i];
        i++;
      }
      result.push(field.trim());
      if (line[i] === ',') i++;
    }
  }
  return result;
}

/** Map CSV headers to our field names (case-insensitive, flexible) */
const CSV_HEADER_MAP: Record<string, string> = {
  'admission number': 'admissionNumber',
  'admission no': 'admissionNumber',
  'admission no.': 'admissionNumber',
  'first name': 'firstName',
  'firstname': 'firstName',
  'last name': 'lastName',
  'lastname': 'lastName',
  'date of birth': 'dateOfBirth',
  'dob': 'dateOfBirth',
  'gender': 'gender',
  'email': 'email',
  'phone': 'phone',
  'blood group': 'bloodGroup',
  'bloodgroup': 'bloodGroup',
};

/** POST /api/students/import - import students from CSV (body: { classId, csv } or multipart later) */
export const importStudentsCSV = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const classId = typeof req.body?.classId === 'string' ? req.body.classId.trim() : null;
    const csvRaw = typeof req.body?.csv === 'string' ? req.body.csv : null;

    if (!classId) {
      throw new AppError('classId is required', 400);
    }
    if (!csvRaw) {
      throw new AppError('csv is required (string content of the CSV file)', 400);
    }

    const classExists = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!classExists) {
      throw new AppError('Class not found', 404);
    }

    const lines = csvRaw.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new AppError('CSV must have a header row and at least one data row', 400);
    }

    const headerLine = parseCSVLine(lines[0]);
    const headers = headerLine.map((h) => h.trim().toLowerCase().replace(/\s+/g, ' '));
    const dataRows = lines.slice(1);

    const existingAdmissionNumbers = await prisma.student.findMany({
      where: { schoolId },
      select: { admissionNumber: true },
    });
    const existingSet = new Set(existingAdmissionNumbers.map((r) => r.admissionNumber));

    const created: any[] = [];
    const errors: { row: number; admissionNumber?: string; message: string }[] = [];
    const seenInFile = new Set<string>();

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = parseCSVLine(dataRows[rowIndex]);
      const rowNum = rowIndex + 2; // 1-based + header
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        const key = CSV_HEADER_MAP[h] || h.replace(/\s/g, '');
        if (key && row[i] !== undefined) {
          record[key] = row[i].trim();
        }
      });

      const admissionNumber = (record.admissionNumber || record['Admission Number'] || '').trim();
      const firstName = (record.firstName || record['First Name'] || '').trim();
      const lastName = (record.lastName || record['Last Name'] || '').trim();
      const dateOfBirth = (record.dateOfBirth || record['Date of Birth'] || record.dob || '').trim();
      const gender = (record.gender || record['Gender'] || '').trim();
      const email = (record.email || record['Email'] || '').trim() || undefined;
      const phone = (record.phone || record['Phone'] || '').trim() || undefined;

      if (!admissionNumber || !firstName || !lastName || !dateOfBirth || !gender) {
        errors.push({ row: rowNum, admissionNumber: admissionNumber || undefined, message: 'Missing required field (Admission Number, First Name, Last Name, Date of Birth, Gender)' });
        continue;
      }
      if (seenInFile.has(admissionNumber)) {
        errors.push({ row: rowNum, admissionNumber, message: 'Duplicate admission number in file' });
        continue;
      }
      seenInFile.add(admissionNumber);
      if (existingSet.has(admissionNumber)) {
        errors.push({ row: rowNum, admissionNumber, message: 'Admission number already exists' });
        continue;
      }

      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push({ row: rowNum, admissionNumber, message: 'Invalid date of birth' });
        continue;
      }

      try {
        const student = await prisma.student.create({
          data: {
            schoolId,
            classId,
            admissionNumber,
            firstName,
            lastName,
            dateOfBirth: dob,
            gender,
            email: email || undefined,
            phone: phone || undefined,
            admissionDate: new Date(),
          },
          include: { class: true },
        });
        created.push(student);
        existingSet.add(admissionNumber);
      } catch (err: any) {
        errors.push({ row: rowNum, admissionNumber, message: err?.message || 'Failed to create' });
      }
    }

    res.status(201).json({
      created: created.length,
      errors: errors.length ? errors : undefined,
      students: created,
    });
  } catch (error) {
    next(error);
  }
};

