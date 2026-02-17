import { PrismaClient, UserRole } from '@prisma/client';
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

  // Create SUPER_ADMIN user
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@school.com' },
    update: {},
    create: {
      email: 'superadmin@school.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          phone: '+1234567890',
        },
      },
    },
    include: { profile: true },
  });

  console.log('✅ Super Admin user created:', superAdminUser.email);

  // Create SCHOOL_ADMIN user
  const schoolAdminUser = await prisma.user.upsert({
    where: { email: 'schooladmin@school.com' },
    update: {},
    create: {
      email: 'schooladmin@school.com',
      password: hashedPassword,
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'School',
          lastName: 'Admin',
          phone: '+1234567891',
        },
      },
    },
    include: { profile: true },
  });

  console.log('✅ School Admin user created:', schoolAdminUser.email);

  // Create ACADEMIC_ADMIN user
  const academicAdminUser = await prisma.user.upsert({
    where: { email: 'academic@school.com' },
    update: {},
    create: {
      email: 'academic@school.com',
      password: hashedPassword,
      role: 'ACADEMIC_ADMIN',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'Academic',
          lastName: 'Admin',
          phone: '+1234567892',
        },
      },
    },
    include: { profile: true },
  });

  console.log('✅ Academic Admin user created:', academicAdminUser.email);

  // Create FINANCE_ADMIN user
  const financeAdminUser = await prisma.user.upsert({
    where: { email: 'finance@school.com' },
    update: {},
    create: {
      email: 'finance@school.com',
      password: hashedPassword,
      role: 'FINANCE_ADMIN',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'Finance',
          lastName: 'Admin',
          phone: '+1234567893',
        },
      },
    },
    include: { profile: true },
  });

  console.log('✅ Finance Admin user created:', financeAdminUser.email);

  // Create HR_ADMIN user
  const hrAdminUser = await prisma.user.upsert({
    where: { email: 'hr@school.com' },
    update: {},
    create: {
      email: 'hr@school.com',
      password: hashedPassword,
      role: 'HR_ADMIN',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'HR',
          lastName: 'Admin',
          phone: '+1234567894',
        },
      },
    },
    include: { profile: true },
  });

  console.log('✅ HR Admin user created:', hrAdminUser.email);

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

  // Create HOD user (Head of Mathematics Department)
  const hodUser = await prisma.user.upsert({
    where: { email: 'hod@school.com' },
    update: {},
    create: {
      email: 'hod@school.com',
      password: hashedPassword,
      role: 'HOD',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'Head',
          lastName: 'Department',
          phone: '+1234567895',
        },
      },
    },
    include: { profile: true },
  });

  // Create HOD assignment for Mathematics
  await prisma.hOD.upsert({
    where: {
      schoolId_subjectId: {
        schoolId: school.id,
        subjectId: math.id,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      userId: hodUser.id,
      subjectId: math.id,
    },
  });

  console.log('✅ HOD user created:', hodUser.email);

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

  const student2 = await prisma.student.upsert({
    where: { admissionNumber: 'ADM002' },
    update: {},
    create: {
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

  // Create additional dummy users for testing
  const additionalUsers = [
    // Additional Admin
    {
      email: 'admin2@school.com',
      password: 'admin123',
      role: 'SCHOOL_ADMIN' as const,
      firstName: 'Sarah',
      lastName: 'Administrator',
      phone: '+1234567895',
    },
    // Additional Teachers
    {
      email: 'teacher2@school.com',
      password: 'teacher123',
      role: 'TEACHER' as const,
      firstName: 'Emily',
      lastName: 'Johnson',
      phone: '+1234567896',
      employeeId: 'EMP002',
      qualification: 'B.Ed. English',
      experience: 3,
    },
    {
      email: 'teacher3@school.com',
      password: 'teacher123',
      role: 'TEACHER' as const,
      firstName: 'Michael',
      lastName: 'Brown',
      phone: '+1234567897',
      employeeId: 'EMP003',
      qualification: 'M.Sc. Physics',
      experience: 8,
    },
    // Additional Parents
    {
      email: 'parent2@school.com',
      password: 'parent123',
      role: 'PARENT' as const,
      firstName: 'Robert',
      lastName: 'Smith',
      phone: '+1234567898',
      occupation: 'Doctor',
    },
    {
      email: 'parent3@school.com',
      password: 'parent123',
      role: 'PARENT' as const,
      firstName: 'Lisa',
      lastName: 'Williams',
      phone: '+1234567899',
      occupation: 'Lawyer',
    },
    // Additional Students
    {
      email: 'student2@school.com',
      password: 'student123',
      role: 'STUDENT' as const,
      firstName: 'Charlie',
      lastName: 'Student',
      phone: '+1234567900',
      admissionNumber: 'ADM003',
      dateOfBirth: new Date('2011-03-10'),
      gender: 'Male',
      classId: class1.id,
    },
    {
      email: 'student3@school.com',
      password: 'student123',
      role: 'STUDENT' as const,
      firstName: 'Diana',
      lastName: 'Student',
      phone: '+1234567901',
      admissionNumber: 'ADM004',
      dateOfBirth: new Date('2010-11-25'),
      gender: 'Female',
      classId: class2.id,
    },
  ];

  for (const userData of additionalUsers) {
    const hashedPwd = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPwd,
        role: userData.role,
        schoolId: school.id,
        isActive: true,
        profile: {
          create: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
          },
        },
      },
      include: { profile: true },
    });

    // Create role-specific records
    if (userData.role === 'TEACHER' && 'employeeId' in userData) {
      await prisma.teacher.upsert({
        where: { employeeId: userData.employeeId },
        update: {},
        create: {
          schoolId: school.id,
          userId: user.id,
          employeeId: userData.employeeId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          qualification: userData.qualification || '',
          experience: userData.experience || 0,
          isActive: true,
        },
      });
    } else if (userData.role === 'PARENT') {
      await prisma.parent.upsert({
        where: { phone: userData.phone },
        update: {},
        create: {
          userId: user.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          email: userData.email,
          occupation: 'occupation' in userData ? userData.occupation : undefined,
        },
      });
    } else if (userData.role === 'STUDENT' && 'admissionNumber' in userData) {
      await prisma.student.upsert({
        where: { admissionNumber: userData.admissionNumber },
        update: {},
        create: {
          schoolId: school.id,
          userId: user.id,
          admissionNumber: userData.admissionNumber,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          gender: userData.gender,
          phone: userData.phone,
          email: userData.email,
          classId: userData.classId,
          admissionDate: new Date('2024-04-01'),
          isActive: true,
        },
      });
    }

    console.log(`✅ ${userData.role} user created: ${userData.email}`);
  }

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
      createdBy: schoolAdminUser.id,
    },
  });

  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      title: 'Parent-Teacher Meeting',
      content: 'Parent-Teacher meeting scheduled for December 15, 2024. Please attend.',
      targetAudience: ['PARENTS'],
      isImportant: true,
      createdBy: schoolAdminUser.id,
    },
  });

  console.log('✅ Announcements created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n👑 ADMIN USERS:');
  console.log('  Email: admin@school.com');
  console.log('  Password: password123');
  console.log('  Email: admin2@school.com');
  console.log('  Password: admin123');
  console.log('\n👨‍🏫 TEACHER USERS:');
  console.log('  Email: teacher@school.com');
  console.log('  Password: password123');
  console.log('  Email: teacher2@school.com');
  console.log('  Password: teacher123');
  console.log('  Email: teacher3@school.com');
  console.log('  Password: teacher123');
  console.log('\n👨‍👩‍👧 PARENT USERS:');
  console.log('  Email: parent@school.com');
  console.log('  Password: password123');
  console.log('  Email: parent2@school.com');
  console.log('  Password: parent123');
  console.log('  Email: parent3@school.com');
  console.log('  Password: parent123');
  console.log('\n🎓 STUDENT USERS:');
  console.log('  Email: student@school.com');
  console.log('  Password: password123');
  console.log('  Email: student2@school.com');
  console.log('  Password: student123');
  console.log('  Email: student3@school.com');
  console.log('  Password: student123');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Quick Login Tips:');
  console.log('  - All passwords follow pattern: [role]123 or password123');
  console.log('  - Default password for original users: password123');
  console.log('  - New users use: [role]123 (e.g., admin123, teacher123)');
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


