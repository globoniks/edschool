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

  // STEP 7/8: Demo School for RBAC testing (code = demo-school)
  const demoSchool = await prisma.school.upsert({
    where: { code: 'demo-school' },
    update: {},
    create: {
      name: 'Demo School',
      code: 'demo-school',
      address: '456 Demo Avenue',
      phone: '+1987654321',
      email: 'admin@demoschool.com',
      isActive: true,
    },
  });
  console.log('✅ Demo School created:', demoSchool.name);

  // Upsert predefined tags (STEP 7: permission arrays per spec)
  const tagAcademic = await prisma.tag.upsert({
    where: { slug: 'ACADEMIC' },
    update: { permissions: ['manageAcademic', 'createExam'] },
    create: { slug: 'ACADEMIC', name: 'Academic', type: 'SUB_ADMIN', permissions: ['manageAcademic', 'createExam'] },
  });
  const tagFinance = await prisma.tag.upsert({
    where: { slug: 'FINANCE' },
    update: { permissions: ['manageFees', 'viewReports'] },
    create: { slug: 'FINANCE', name: 'Finance', type: 'SUB_ADMIN', permissions: ['manageFees', 'viewReports'] },
  });
  const tagHr = await prisma.tag.upsert({
    where: { slug: 'HR' },
    update: { permissions: ['manageTeachers', 'manageStaff'] },
    create: { slug: 'HR', name: 'HR', type: 'SUB_ADMIN', permissions: ['manageTeachers', 'manageStaff'] },
  });
  const tagTransport = await prisma.tag.upsert({
    where: { slug: 'TRANSPORT' },
    update: { permissions: ['manageTransport'] },
    create: { slug: 'TRANSPORT', name: 'Transport', type: 'SUB_ADMIN', permissions: ['manageTransport'] },
  });
  const tagHod = await prisma.tag.upsert({
    where: { slug: 'HOD' },
    update: { permissions: ['hodViewSubmissions', 'hodEnterExamMarks'] },
    create: { slug: 'HOD', name: 'HOD', type: 'TEACHER', permissions: ['hodViewSubmissions', 'hodEnterExamMarks'] },
  });
  console.log('✅ Tags created');

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

  // Create SUB_ADMIN users (one per area, each with one tag)
  const academicAdminUser = await prisma.user.upsert({
    where: { email: 'academic@school.com' },
    update: {},
    create: {
      email: 'academic@school.com',
      password: hashedPassword,
      role: 'SUB_ADMIN',
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
  await prisma.userTag.upsert({
    where: { userId_tagId: { userId: academicAdminUser.id, tagId: tagAcademic.id } },
    update: {},
    create: { userId: academicAdminUser.id, tagId: tagAcademic.id },
  });
  console.log('✅ Sub-admin (Academic) user created:', academicAdminUser.email);

  const financeAdminUser = await prisma.user.upsert({
    where: { email: 'finance@school.com' },
    update: {},
    create: {
      email: 'finance@school.com',
      password: hashedPassword,
      role: 'SUB_ADMIN',
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
  await prisma.userTag.upsert({
    where: { userId_tagId: { userId: financeAdminUser.id, tagId: tagFinance.id } },
    update: {},
    create: { userId: financeAdminUser.id, tagId: tagFinance.id },
  });
  console.log('✅ Sub-admin (Finance) user created:', financeAdminUser.email);

  const hrAdminUser = await prisma.user.upsert({
    where: { email: 'hr@school.com' },
    update: {},
    create: {
      email: 'hr@school.com',
      password: hashedPassword,
      role: 'SUB_ADMIN',
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
  await prisma.userTag.upsert({
    where: { userId_tagId: { userId: hrAdminUser.id, tagId: tagHr.id } },
    update: {},
    create: { userId: hrAdminUser.id, tagId: tagHr.id },
  });
  console.log('✅ Sub-admin (HR) user created:', hrAdminUser.email);

  const transportManagerUser = await prisma.user.upsert({
    where: { email: 'transport@school.com' },
    update: {},
    create: {
      email: 'transport@school.com',
      password: hashedPassword,
      role: 'SUB_ADMIN',
      schoolId: school.id,
      isActive: true,
      profile: {
        create: {
          firstName: 'Transport',
          lastName: 'Manager',
          phone: '+1234567896',
        },
      },
    },
    include: { profile: true },
  });
  await prisma.userTag.upsert({
    where: { userId_tagId: { userId: transportManagerUser.id, tagId: tagTransport.id } },
    update: {},
    create: { userId: transportManagerUser.id, tagId: tagTransport.id },
  });
  console.log('✅ Sub-admin (Transport) user created:', transportManagerUser.email);

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
  await prisma.userTag.upsert({
    where: { userId_tagId: { userId: teacherUser.id, tagId: tagHod.id } },
    update: {},
    create: { userId: teacherUser.id, tagId: tagHod.id },
  });
  console.log('✅ Teacher (with HOD tag) created:', teacher.employeeId);

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

  // Create Students (no student login – parents see all data via parent portal)
  const student1 = await prisma.student.upsert({
    where: { admissionNumber: 'ADM001' },
    update: {},
    create: {
      schoolId: school.id,
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

  // Link parent to students (parent@school.com has two children: student1 and student2)
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

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parent.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: student2.id,
      relationship: 'Parent',
      isPrimary: false,
    },
  });

  // Additional students (no login – parents see via parent portal)
  await prisma.student.upsert({
    where: { admissionNumber: 'ADM003' },
    update: {},
    create: {
      schoolId: school.id,
      admissionNumber: 'ADM003',
      firstName: 'Charlie',
      lastName: 'Student',
      dateOfBirth: new Date('2011-03-10'),
      gender: 'Male',
      classId: class1.id,
      admissionDate: new Date('2024-04-01'),
      isActive: true,
    },
  });
  await prisma.student.upsert({
    where: { admissionNumber: 'ADM004' },
    update: {},
    create: {
      schoolId: school.id,
      admissionNumber: 'ADM004',
      firstName: 'Diana',
      lastName: 'Student',
      dateOfBirth: new Date('2010-11-25'),
      gender: 'Female',
      classId: class2.id,
      admissionDate: new Date('2024-04-01'),
      isActive: true,
    },
  });

  console.log('✅ Parent-Student links created');

  // STEP 8 — Demo users (@test.com, password 123456) for RBAC testing
  const demoPasswordHash = await bcrypt.hash('123456', 10);

  const superAdminTest = await prisma.user.upsert({
    where: { email: 'superadmin@test.com' },
    update: {},
    create: {
      email: 'superadmin@test.com',
      password: demoPasswordHash,
      role: 'SUPER_ADMIN',
      schoolId: demoSchool.id,
      isActive: true,
      profile: { create: { firstName: 'Super', lastName: 'Admin Test', phone: '+1000000001' } },
    },
    include: { profile: true },
  });
  console.log('✅ Demo user: superadmin@test.com (SUPER_ADMIN)');

  const schoolAdminTest = await prisma.user.upsert({
    where: { email: 'schooladmin@test.com' },
    update: {},
    create: {
      email: 'schooladmin@test.com',
      password: demoPasswordHash,
      role: 'SCHOOL_ADMIN',
      schoolId: demoSchool.id,
      isActive: true,
      profile: { create: { firstName: 'School', lastName: 'Admin Test', phone: '+1000000002' } },
    },
    include: { profile: true },
  });
  console.log('✅ Demo user: schooladmin@test.com (SCHOOL_ADMIN)');

  const academicTest = await prisma.user.upsert({
    where: { email: 'academic@test.com' },
    update: {},
    create: {
      email: 'academic@test.com',
      password: demoPasswordHash,
      role: 'SUB_ADMIN',
      schoolId: demoSchool.id,
      isActive: true,
      profile: { create: { firstName: 'Academic', lastName: 'Sub Admin', phone: '+1000000003' } },
    },
    include: { profile: true },
  });
  await prisma.userTag.upsert({
    where: { userId_tagId: { userId: academicTest.id, tagId: tagAcademic.id } },
    update: {},
    create: { userId: academicTest.id, tagId: tagAcademic.id },
  });
  console.log('✅ Demo user: academic@test.com (SUB_ADMIN, ACADEMIC tag)');

  const financeTest = await prisma.user.upsert({
    where: { email: 'finance@test.com' },
    update: {},
    create: {
      email: 'finance@test.com',
      password: demoPasswordHash,
      role: 'SUB_ADMIN',
      schoolId: demoSchool.id,
      isActive: true,
      profile: { create: { firstName: 'Finance', lastName: 'Sub Admin', phone: '+1000000004' } },
    },
    include: { profile: true },
  });
  await prisma.userTag.upsert({
    where: { userId_tagId: { userId: financeTest.id, tagId: tagFinance.id } },
    update: {},
    create: { userId: financeTest.id, tagId: tagFinance.id },
  });
  console.log('✅ Demo user: finance@test.com (SUB_ADMIN, FINANCE tag)');

  const teacherTest = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      email: 'teacher@test.com',
      password: demoPasswordHash,
      role: 'TEACHER',
      schoolId: demoSchool.id,
      isActive: true,
      profile: { create: { firstName: 'Demo', lastName: 'Teacher', phone: '+1000000005' } },
    },
    include: { profile: true },
  });
  const teacherTestProfile = await prisma.teacher.upsert({
    where: { employeeId: 'DEMO-T001' },
    update: {},
    create: {
      schoolId: demoSchool.id,
      userId: teacherTest.id,
      employeeId: 'DEMO-T001',
      firstName: 'Demo',
      lastName: 'Teacher',
      email: 'teacher@test.com',
      phone: '+1000000005',
      qualification: 'B.Ed.',
      experience: 3,
      isActive: true,
    },
  });
  console.log('✅ Demo user: teacher@test.com (TEACHER, no HOD tag)');

  const hodTest = await prisma.user.upsert({
    where: { email: 'hod@test.com' },
    update: {},
    create: {
      email: 'hod@test.com',
      password: demoPasswordHash,
      role: 'TEACHER',
      schoolId: demoSchool.id,
      isActive: true,
      profile: { create: { firstName: 'HOD', lastName: 'Teacher', phone: '+1000000006' } },
    },
    include: { profile: true },
  });
  await prisma.teacher.upsert({
    where: { employeeId: 'DEMO-HOD01' },
    update: {},
    create: {
      schoolId: demoSchool.id,
      userId: hodTest.id,
      employeeId: 'DEMO-HOD01',
      firstName: 'HOD',
      lastName: 'Teacher',
      email: 'hod@test.com',
      phone: '+1000000006',
      qualification: 'M.Ed.',
      experience: 8,
      isActive: true,
    },
  });
  await prisma.userTag.upsert({
    where: { userId_tagId: { userId: hodTest.id, tagId: tagHod.id } },
    update: {},
    create: { userId: hodTest.id, tagId: tagHod.id },
  });
  console.log('✅ Demo user: hod@test.com (TEACHER, HOD tag)');

  // Parent needs a student: create Demo class + student, then Parent + link
  const demoClass = await prisma.class.upsert({
    where: {
      schoolId_name_section_academicYear: {
        schoolId: demoSchool.id,
        name: 'Class 1',
        section: 'A',
        academicYear: '2024-2025',
      },
    },
    update: {},
    create: {
      schoolId: demoSchool.id,
      name: 'Class 1',
      section: 'A',
      academicYear: '2024-2025',
      capacity: 40,
    },
  });
  const demoStudent = await prisma.student.upsert({
    where: { admissionNumber: 'DEMO-ADM001' },
    update: {},
    create: {
      schoolId: demoSchool.id,
      admissionNumber: 'DEMO-ADM001',
      firstName: 'Demo',
      lastName: 'Student',
      dateOfBirth: new Date('2012-01-01'),
      gender: 'Male',
      classId: demoClass.id,
      admissionDate: new Date('2024-04-01'),
      isActive: true,
    },
  });
  const parentTest = await prisma.user.upsert({
    where: { email: 'parent@test.com' },
    update: {},
    create: {
      email: 'parent@test.com',
      password: demoPasswordHash,
      role: 'PARENT',
      schoolId: demoSchool.id,
      isActive: true,
      profile: { create: { firstName: 'Demo', lastName: 'Parent', phone: '+1000000007' } },
    },
    include: { profile: true },
  });
  const parentTestProfile = await prisma.parent.upsert({
    where: { phone: '+1000000007' },
    update: {},
    create: {
      userId: parentTest.id,
      firstName: 'Demo',
      lastName: 'Parent',
      phone: '+1000000007',
      email: 'parent@test.com',
      occupation: 'Parent',
    },
  });
  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId: parentTestProfile.id, studentId: demoStudent.id },
    },
    update: {},
    create: {
      parentId: parentTestProfile.id,
      studentId: demoStudent.id,
      relationship: 'Parent',
      isPrimary: true,
    },
  });
  console.log('✅ Demo user: parent@test.com (PARENT, 1 child)');

  // Transport: buses, routes, student transport (bus + parent pick up)
  const bus1 = await prisma.bus.upsert({
    where: { schoolId_busNumber: { schoolId: school.id, busNumber: 'BUS-001' } },
    update: {},
    create: {
      schoolId: school.id,
      busNumber: 'BUS-001',
      driverName: 'John Doe',
      driverPhone: '+1234567890',
      capacity: 40,
      isActive: true,
    },
  });

  const bus2 = await prisma.bus.upsert({
    where: { schoolId_busNumber: { schoolId: school.id, busNumber: 'BUS-002' } },
    update: {},
    create: {
      schoolId: school.id,
      busNumber: 'BUS-002',
      driverName: 'Jane Smith',
      driverPhone: '+1234567891',
      capacity: 35,
      isActive: true,
    },
  });

  let route1 = await prisma.route.findFirst({
    where: { schoolId: school.id, routeNumber: 'Route 1' },
  });
  if (!route1) {
    route1 = await prisma.route.create({
      data: {
        schoolId: school.id,
        busId: bus1.id,
        routeNumber: 'Route 1',
        pickupPoint: 'Main Gate',
        dropPoint: 'School Gate',
        isActive: true,
      },
    });
  }

  let route2 = await prisma.route.findFirst({
    where: { schoolId: school.id, routeNumber: 'Route 2' },
  });
  if (!route2) {
    route2 = await prisma.route.create({
      data: {
        schoolId: school.id,
        busId: bus2.id,
        routeNumber: 'Route 2',
        pickupPoint: 'North Block',
        dropPoint: 'School Gate',
        isActive: true,
      },
    });
  }

  console.log('✅ Buses and routes created');

  // Student1 (linked to parent@school.com) uses bus; student2 uses parent pick up
  await prisma.studentTransport.upsert({
    where: { studentId: student1.id },
    update: {},
    create: {
      studentId: student1.id,
      transportMode: 'BUS',
      routeId: route1.id,
      pickupPoint: 'Main Gate',
      dropPoint: 'School Gate',
    },
  });

  await prisma.studentTransport.upsert({
    where: { studentId: student2.id },
    update: {},
    create: {
      studentId: student2.id,
      transportMode: 'PARENT_PICKUP',
    },
  });

  console.log('✅ Student transport assignments created');

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
  console.log('\n🚌 TRANSPORT MANAGER:');
  console.log('  Email: transport@school.com');
  console.log('  Password: password123');
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
  console.log('\n  (Students do not log in; parents see all student data in the portal.)');
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


  // Email	Password
  // superadmin@school.com	password123
  // schooladmin@school.com	password123
  // academic@school.com	password123 (Sub-admin, Academic tag)
  // finance@school.com	password123 (Sub-admin, Finance tag)
  // hr@school.com	password123 (Sub-admin, HR tag)
  // transport@school.com	password123 (Sub-admin, Transport tag)
  // teacher@school.com	password123 (Teacher, HOD tag)
  // parent@school.com	password123
  