import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { getParentAccessibleStudents, getTeacherAccessibleClasses } from '../utils/permissions.js';

// CSV Export utility
const convertToCSV = (data: any[], headers: string[]): string => {
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    })
  );
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

export const exportStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, search, format = 'csv', studentId } = req.query;
    const studentIds = Array.isArray(studentId) ? studentId : studentId ? [studentId] : null;

    const where: any = { schoolId };

    // Optional: export only selected student IDs (admin use)
    if (studentIds?.length) {
      where.id = { in: studentIds as string[] };
    }

    // Apply role-based filtering
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (!me) {
        throw new AppError('Student not found', 404);
      }
      where.id = me.id;
    } else if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (parent) {
        const accessibleStudentIds = await getParentAccessibleStudents(parent.id);
        where.id = { in: accessibleStudentIds };
      } else {
        where.id = { in: [] };
      }
    } else if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (teacher) {
        const accessibleClassIds = await getTeacherAccessibleClasses(teacher.id);
        where.classId = { in: accessibleClassIds };
      } else {
        where.classId = { in: [] };
      }
    }

    if (classId) {
      where.classId = classId as string;
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
        include: { class: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_STUDENTS,
      }),
      prisma.student.count({ where }),
    ]);

    const exportTruncated = total > MAX_EXPORT_STUDENTS;
    if (exportTruncated && format === 'csv') {
      res.setHeader('X-Export-Truncated', 'true');
      res.setHeader('X-Export-Total', total.toString());
      res.setHeader('X-Export-Limit', MAX_EXPORT_STUDENTS.toString());
    }

    if (format === 'csv') {
      const csvData = students.map((s) => ({
        'Admission Number': s.admissionNumber,
        'First Name': s.firstName,
        'Last Name': s.lastName,
        'Class': s.class?.name || 'N/A',
        'Gender': s.gender || 'N/A',
        'Email': s.email || 'N/A',
        'Phone': s.phone || 'N/A',
        'Status': s.isActive ? 'Active' : 'Inactive',
        'Admission Date': s.admissionDate.toISOString().split('T')[0],
      }));

      const headers = [
        'Admission Number',
        'First Name',
        'Last Name',
        'Class',
        'Gender',
        'Email',
        'Phone',
        'Status',
        'Admission Date',
      ];
      if (exportTruncated) {
        csvData.unshift({
          'Admission Number': `(Export limited to ${MAX_EXPORT_STUDENTS} of ${total} records. Use class or search filter for smaller exports.)`,
          'First Name': '',
          'Last Name': '',
          'Class': '',
          'Gender': '',
          'Email': '',
          'Phone': '',
          'Status': '',
          'Admission Date': '',
        });
      }
      const csv = convertToCSV(csvData, headers);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=students_${Date.now()}.csv`);
      res.send(csv);
    } else {
      next(new AppError('Unsupported format. Use csv', 400));
    }
  } catch (error) {
    next(error);
  }
};

export const exportTeachers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { search, format = 'csv', teacherId } = req.query;
    const teacherIds = Array.isArray(teacherId) ? teacherId : teacherId ? [teacherId] : null;

    const where: any = { schoolId };

    if (teacherIds?.length) {
      where.id = { in: teacherIds as string[] };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { employeeId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [teachers, totalTeachers] = await Promise.all([
      prisma.teacher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_TEACHERS,
      }),
      prisma.teacher.count({ where }),
    ]);

    const teachersTruncated = totalTeachers > MAX_EXPORT_TEACHERS;
    if (teachersTruncated && format === 'csv') {
      res.setHeader('X-Export-Truncated', 'true');
      res.setHeader('X-Export-Total', totalTeachers.toString());
      res.setHeader('X-Export-Limit', MAX_EXPORT_TEACHERS.toString());
    }

    if (format === 'csv') {
      const csvData = teachers.map((t) => ({
        'Employee ID': t.employeeId,
        'First Name': t.firstName,
        'Last Name': t.lastName,
        'Email': t.email || 'N/A',
        'Phone': t.phone || 'N/A',
        'Qualification': t.qualification || 'N/A',
        'Experience': `${t.experience || 0} years`,
        'Status': t.isActive ? 'Active' : 'Inactive',
      }));

      const teacherHeaders = [
        'Employee ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Qualification',
        'Experience',
        'Status',
      ];
      if (teachersTruncated) {
        csvData.unshift({
          'Employee ID': `(Export limited to ${MAX_EXPORT_TEACHERS} of ${totalTeachers} records. Use search filter for smaller exports.)`,
          'First Name': '',
          'Last Name': '',
          'Email': '',
          'Phone': '',
          'Qualification': '',
          'Experience': '',
          'Status': '',
        });
      }
      const csv = convertToCSV(csvData, teacherHeaders);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=teachers_${Date.now()}.csv`);
      res.send(csv);
    } else {
      next(new AppError('Unsupported format. Use csv', 400));
    }
  } catch (error) {
    next(error);
  }
};

export const exportExams = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { examId, format = 'csv' } = req.query;

    if (!examId) {
      throw new AppError('Exam ID is required', 400);
    }

    const exam = await prisma.exam.findFirst({
      where: { id: examId as string, schoolId },
      include: {
        marks: {
          take: MAX_EXPORT_FEE_PAYMENTS, // cap marks rows for large schools
          include: {
            student: true,
            subject: true,
          },
        },
      },
    });

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    if (format === 'csv') {
      const csvData = exam.marks.map((mark) => ({
        'Student Name': `${mark.student.firstName} ${mark.student.lastName}`,
        'Admission Number': mark.student.admissionNumber,
        'Subject': mark.subject.name,
        'Marks Obtained': mark.marksObtained,
        'Total Marks': mark.totalMarks,
        'Percentage': `${((mark.marksObtained / mark.totalMarks) * 100).toFixed(2)}%`,
        'Grade': mark.grade || 'N/A',
      }));

      const csv = convertToCSV(csvData, [
        'Student Name',
        'Admission Number',
        'Subject',
        'Marks Obtained',
        'Total Marks',
        'Percentage',
        'Grade',
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=exam_${exam.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
      res.send(csv);
    } else {
      next(new AppError('Unsupported format. Use csv', 400));
    }
  } catch (error) {
    next(error);
  }
};

export const exportFees = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId, format = 'csv' } = req.query;

    const where: any = { schoolId };

    if (studentId) {
      where.studentId = studentId as string;
    }

    const [payments, totalPayments] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        include: {
          student: true,
          feeStructure: true,
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_FEE_PAYMENTS,
      }),
      prisma.feePayment.count({ where }),
    ]);

    const paymentsTruncated = totalPayments > MAX_EXPORT_FEE_PAYMENTS;
    if (paymentsTruncated && format === 'csv') {
      res.setHeader('X-Export-Truncated', 'true');
      res.setHeader('X-Export-Total', totalPayments.toString());
      res.setHeader('X-Export-Limit', MAX_EXPORT_FEE_PAYMENTS.toString());
    }

    if (format === 'csv') {
      const csvData = payments.map((p) => ({
        'Student Name': `${p.student.firstName} ${p.student.lastName}`,
        'Admission Number': p.student.admissionNumber,
        'Fee Type': p.feeStructure.type,
        'Amount': p.amount,
        'Discount': p.discount || 0,
        'Scholarship': p.scholarship || 0,
        'Total Paid': p.amount - (p.discount || 0) - (p.scholarship || 0),
        'Payment Method': p.paymentMethod,
        'Transaction ID': p.transactionId || 'N/A',
        'Payment Date': p.paymentDate.toISOString().split('T')[0],
      }));

      const paymentHeaders = [
        'Student Name',
        'Admission Number',
        'Fee Type',
        'Amount',
        'Discount',
        'Scholarship',
        'Total Paid',
        'Payment Method',
        'Transaction ID',
        'Payment Date',
      ];
      if (paymentsTruncated) {
        csvData.unshift({
          'Student Name': `(Export limited to ${MAX_EXPORT_FEE_PAYMENTS} of ${totalPayments} records. Use studentId or date filter for smaller exports.)`,
          'Admission Number': '',
          'Fee Type': '',
          'Amount': '',
          'Discount': '',
          'Scholarship': '',
          'Total Paid': '',
          'Payment Method': '',
          'Transaction ID': '',
          'Payment Date': '',
        });
      }
      const csv = convertToCSV(csvData, paymentHeaders);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=fee_payments_${Date.now()}.csv`);
      res.send(csv);
    } else {
      next(new AppError('Unsupported format. Use csv', 400));
    }
  } catch (error) {
    next(error);
  }
};

