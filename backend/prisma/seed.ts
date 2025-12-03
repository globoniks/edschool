import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test school
  const school = await prisma.school.upsert({
    where: { code: 'TEST001' },
    update: {},
    create: {
      name: 'Test School',
      code: 'TEST001',
      address: '123 Education Street, Test City',
      phone: '+1234567890',
      email: 'admin@testschool.com',
      isActive: true,
    },
  });

  console.log('✅ School created:', school.name);

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      password: hashedPassword,
      role: 'ADMIN',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+1234567891',
        },
      },
    },
    include: { profile: true },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create Teacher user
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      email: 'teacher@school.com',
      password: hashedPassword,
      role: 'TEACHER',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Teacher',
          phone: '+1234567892',
        },
      },
    },
    include: { profile: true },
  });

  const teacher = await prisma.teacher.upsert({
    where: { employeeId: 'EMP001' },
    update: {},
    create: {
      schoolId: school.id,
      userId: teacherUser.id,
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Teacher',
      email: 'teacher@school.com',
      phone: '+1234567892',
      qualification: 'M.Sc. Mathematics',
      experience: 5,
      isActive: true,
    },
  });

  console.log('✅ Teacher created:', teacher.employeeId);

  // Create Parent user
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@school.com' },
    update: {},
    create: {
      email: 'parent@school.com',
      password: hashedPassword,
      role: 'PARENT',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Parent',
          phone: '+1234567893',
        },
      },
    },
    include: { profile: true },
  });

  const parent = await prisma.parent.upsert({
    where: { phone: '+1234567893' },
    update: {},
    create: {
      userId: parentUser.id,
      firstName: 'Jane',
      lastName: 'Parent',
      phone: '+1234567893',
      email: 'parent@school.com',
      occupation: 'Engineer',
    },
  });

  console.log('✅ Parent created:', parent.phone);

  // Create Classes
  const class1 = await prisma.class.upsert({
    where: {
      schoolId_name_section_academicYear: {
        schoolId: school.id,
        name: 'Class 1',
        section: 'A',
        academicYear: '2024-2025',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Class 1',
      section: 'A',
      academicYear: '2024-2025',
      capacity: 40,
    },
  });

  const class2 = await prisma.class.upsert({
    where: {
      schoolId_name_section_academicYear: {
        schoolId: school.id,
        name: 'Class 2',
        section: 'A',
        academicYear: '2024-2025',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Class 2',
      section: 'A',
      academicYear: '2024-2025',
      capacity: 40,
    },
  });

  console.log('✅ Classes created');

  // Create Subjects
  const math = await prisma.subject.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: 'Mathematics',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Mathematics',
      code: 'MATH',
      description: 'Mathematics subject',
    },
  });

  const english = await prisma.subject.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: 'English',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'English',
      code: 'ENG',
      description: 'English Language',
    },
  });

  const science = await prisma.subject.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: 'Science',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Science',
      code: 'SCI',
      description: 'Science subject',
    },
  });

  console.log('✅ Subjects created');

  // Assign subjects to classes
  await prisma.classSubject.upsert({
    where: {
      classId_subjectId: {
        classId: class1.id,
        subjectId: math.id,
      },
    },
    update: {},
    create: {
      classId: class1.id,
      subjectId: math.id,
      teacherId: teacher.id,
    },
  });

  await prisma.classSubject.upsert({
    where: {
      classId_subjectId: {
        classId: class1.id,
        subjectId: english.id,
      },
    },
    update: {},
    create: {
      classId: class1.id,
      subjectId: english.id,
      teacherId: teacher.id,
    },
  });

  console.log('✅ Class-Subject mappings created');

  // Create Student user
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@school.com' },
    update: {},
    create: {
      email: 'student@school.com',
      password: hashedPassword,
      role: 'STUDENT',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'Alice',
          lastName: 'Student',
          phone: '+1234567894',
        },
      },
    },
    include: { profile: true },
  });

  // Create Students
  const student1 = await prisma.student.upsert({
    where: { admissionNumber: 'ADM001' },
    update: {},
    create: {
      schoolId: school.id,
      userId: studentUser.id,
      admissionNumber: 'ADM001',
      firstName: 'Alice',
      lastName: 'Student',
      dateOfBirth: new Date('2010-05-15'),
      gender: 'Female',
      email: 'student@school.com',
      phone: '+1234567894',
      classId: class1.id,
      admissionDate: new Date('2024-04-01'),
      isActive: true,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      schoolId: school.id,
      admissionNumber: 'ADM002',
      firstName: 'Bob',
      lastName: 'Student',
      dateOfBirth: new Date('2010-08-20'),
      gender: 'Male',
      classId: class1.id,
      admissionDate: new Date('2024-04-01'),
      isActive: true,
    },
  });

  console.log('✅ Students created');

  // Link parent to student
  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parent.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: student1.id,
      relationship: 'Parent',
      isPrimary: true,
    },
  });

  console.log('✅ Parent-Student links created');

  // Create Fee Structure
  const tuitionFee = await prisma.feeStructure.create({
    data: {
      schoolId: school.id,
      name: 'Tuition Fee',
      type: 'TUITION',
      amount: 5000,
      billingCycle: 'MONTHLY',
      dueDate: 5,
      isActive: true,
    },
  });

  const transportFee = await prisma.feeStructure.create({
    data: {
      schoolId: school.id,
      name: 'Transport Fee',
      type: 'TRANSPORT',
      amount: 2000,
      billingCycle: 'MONTHLY',
      dueDate: 5,
      isActive: true,
    },
  });

  console.log('✅ Fee structures created');

  // Create some fee payments
  const payment1 = await prisma.feePayment.create({
    data: {
      studentId: student1.id,
      feeStructureId: tuitionFee.id,
      amount: 5000,
      discount: 0,
      scholarship: 0,
      finalAmount: 5000,
      status: 'PAID',
      paymentDate: new Date(),
      dueDate: new Date('2024-12-05'),
      paymentMethod: 'Cash',
      receiptNumber: `RCP-${Date.now()}-001`,
    },
  });

  const payment2 = await prisma.feePayment.create({
    data: {
      studentId: student1.id,
      feeStructureId: transportFee.id,
      amount: 2000,
      discount: 0,
      scholarship: 0,
      finalAmount: 2000,
      status: 'PENDING',
      dueDate: new Date('2024-12-05'),
    },
  });

  console.log('✅ Fee payments created');

  // Create Exam
  const exam1 = await prisma.exam.create({
    data: {
      schoolId: school.id,
      name: 'Mid-term Exam 2024',
      classId: class1.id,
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-10-15'),
      passingMarks: 33.0,
      isActive: true,
    },
  });

  console.log('✅ Exam created');

  // Create Exam Marks
  await prisma.examMark.create({
    data: {
      examId: exam1.id,
      studentId: student1.id,
      subjectId: math.id,
      marksObtained: 85,
      maxMarks: 100,
      grade: 'A',
    },
  });

  await prisma.examMark.create({
    data: {
      examId: exam1.id,
      studentId: student1.id,
      subjectId: english.id,
      marksObtained: 78,
      maxMarks: 100,
      grade: 'B',
    },
  });

  await prisma.examMark.create({
    data: {
      examId: exam1.id,
      studentId: student2.id,
      subjectId: math.id,
      marksObtained: 92,
      maxMarks: 100,
      grade: 'A+',
    },
  });

  console.log('✅ Exam marks created');

  // Create some attendance records
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.attendance.createMany({
    data: [
      {
        schoolId: school.id,
        studentId: student1.id,
        classId: class1.id,
        date: today,
        status: 'PRESENT',
        markedBy: teacher.id,
      },
      {
        schoolId: school.id,
        studentId: student2.id,
        classId: class1.id,
        date: today,
        status: 'PRESENT',
        markedBy: teacher.id,
      },
      {
        schoolId: school.id,
        studentId: student1.id,
        classId: class1.id,
        date: yesterday,
        status: 'PRESENT',
        markedBy: teacher.id,
      },
      {
        schoolId: school.id,
        studentId: student2.id,
        classId: class1.id,
        date: yesterday,
        status: 'ABSENT',
        markedBy: teacher.id,
      },
    ],
  });

  console.log('✅ Attendance records created');

  // Create Timetable
  await prisma.timetable.createMany({
    data: [
      {
        schoolId: school.id,
        classId: class1.id,
        subjectId: math.id,
        teacherId: teacher.id,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:00',
        room: 'Room 101',
        academicYear: '2024-2025',
      },
      {
        schoolId: school.id,
        classId: class1.id,
        subjectId: english.id,
        teacherId: teacher.id,
        dayOfWeek: 1, // Monday
        startTime: '10:00',
        endTime: '11:00',
        room: 'Room 101',
        academicYear: '2024-2025',
      },
      {
        schoolId: school.id,
        classId: class1.id,
        subjectId: science.id,
        teacherId: teacher.id,
        dayOfWeek: 2, // Tuesday
        startTime: '09:00',
        endTime: '10:00',
        room: 'Lab 1',
        academicYear: '2024-2025',
      },
    ],
  });

  console.log('✅ Timetable created');

  // Create Homework
  const homework1 = await prisma.homework.create({
    data: {
      schoolId: school.id,
      classId: class1.id,
      subjectId: math.id,
      teacherId: teacher.id,
      title: 'Algebra Practice',
      description: 'Complete exercises 1-10 from chapter 5',
      dueDate: new Date('2024-12-20'),
      status: 'ACTIVE',
    },
  });

  console.log('✅ Homework created');

  // Create Announcement
  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      title: 'Welcome to New Academic Year',
      content: 'We welcome all students and parents to the new academic year 2024-2025. Best wishes for a successful year ahead!',
      targetAudience: ['ALL'],
      isImportant: true,
      createdBy: adminUser.id,
    },
  });

  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      title: 'Parent-Teacher Meeting',
      content: 'Parent-Teacher meeting scheduled for December 15, 2024. Please attend.',
      targetAudience: ['PARENTS'],
      isImportant: true,
      createdBy: adminUser.id,
    },
  });

  console.log('✅ Announcements created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@school.com');
  console.log('  Password: password123');
  console.log('\nTeacher:');
  console.log('  Email: teacher@school.com');
  console.log('  Password: password123');
  console.log('\nParent:');
  console.log('  Email: parent@school.com');
  console.log('  Password: password123');
  console.log('\nStudent:');
  console.log('  Email: student@school.com');
  console.log('  Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


