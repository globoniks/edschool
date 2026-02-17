import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkChildToParent() {
  try {
    // Find parent by email
    const parentUser = await prisma.user.findUnique({
      where: { email: 'parent@school.com' },
      include: { parent: true },
    });

    if (!parentUser || !parentUser.parent) {
      console.error('Parent with email parent@school.com not found');
      process.exit(1);
    }

    const parent = parentUser.parent;
    console.log(`Found parent: ${parent.firstName} ${parent.lastName} (ID: ${parent.id})`);

    // List available students
    const students = await prisma.student.findMany({
      where: { isActive: true },
      include: { class: true },
      take: 10,
    });

    console.log('\nAvailable students:');
    students.forEach((student, index) => {
      console.log(
        `${index + 1}. ${student.firstName} ${student.lastName} (${student.admissionNumber}) - ${student.class?.name || 'No class'}`
      );
    });

    // Check if parent already has children
    const existingLinks = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      include: { student: true },
    });

    if (existingLinks.length > 0) {
      console.log('\nParent already has children linked:');
      existingLinks.forEach((link) => {
        console.log(`- ${link.student.firstName} ${link.student.lastName} (${link.student.admissionNumber})`);
      });
    }

    // Link the first student if parent has no children, or ask which one
    if (students.length === 0) {
      console.error('No active students found');
      process.exit(1);
    }

    // Find a student that's not already linked
    const linkedStudentIds = existingLinks.map(link => link.studentId);
    const availableStudents = students.filter(s => !linkedStudentIds.includes(s.id));
    
    if (availableStudents.length === 0) {
      console.log('\nAll available students are already linked to this parent.');
      process.exit(0);
    }

    // Link the first available student
    const studentToLink = availableStudents[0];
    console.log(`\nLinking student: ${studentToLink.firstName} ${studentToLink.lastName} (${studentToLink.admissionNumber})`);

    // Check if already linked
    const existingLink = await prisma.parentStudent.findFirst({
      where: {
        parentId: parent.id,
        studentId: studentToLink.id,
      },
    });

    if (existingLink) {
      console.log(`\nStudent ${studentToLink.firstName} ${studentToLink.lastName} is already linked to this parent.`);
      process.exit(0);
    }

    // Create the link
    const link = await prisma.parentStudent.create({
      data: {
        parentId: parent.id,
        studentId: studentToLink.id,
        relationship: 'Parent',
        isPrimary: existingLinks.length === 0, // First child is primary
      },
      include: {
        student: {
          include: { class: true },
        },
      },
    });

    console.log(
      `\n✅ Successfully linked student ${link.student.firstName} ${link.student.lastName} (${link.student.admissionNumber}) to parent ${parent.firstName} ${parent.lastName}`
    );
    console.log(`   Class: ${link.student.class?.name || 'No class'}`);
  } catch (error) {
    console.error('Error linking child to parent:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

linkChildToParent();

