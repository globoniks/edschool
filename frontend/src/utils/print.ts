export function printElement(elementId: string, title?: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Print'}</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12pt;
              color: #000;
            }
            .no-print {
              display: none;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

export function printReportCard(studentName: string, examName: string, marks: any[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const totalMarks = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const maxMarks = marks.reduce((sum, m) => sum + m.maxMarks, 0);
  const percentage = ((totalMarks / maxMarks) * 100).toFixed(2);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Report Card - ${studentName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .student-info {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #000;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
          }
          .summary {
            margin-top: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border: 1px solid #000;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Report Card</h1>
          <h2>${examName}</h2>
        </div>
        <div class="student-info">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Marks Obtained</th>
              <th>Max Marks</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${marks.map((m) => `
              <tr>
                <td>${m.subjectName}</td>
                <td>${m.marksObtained}</td>
                <td>${m.maxMarks}</td>
                <td>${m.grade || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <p><strong>Total Marks:</strong> ${totalMarks} / ${maxMarks}</p>
          <p><strong>Percentage:</strong> ${percentage}%</p>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

export const usePrint = {
  printAttendance: (child: any) => {
    if (!child) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const attendance = child.attendance || {};
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance Report - ${child.firstName} ${child.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Attendance Report</h1>
            <h2>${child.firstName} ${child.lastName}</h2>
            <p>Class: ${child.class?.name || 'N/A'}</p>
          </div>
          <p><strong>Attendance Percentage:</strong> ${attendance.percentage || 0}%</p>
          <p><strong>Present Days:</strong> ${attendance.presentCount || 0}</p>
          <p><strong>Total Days:</strong> ${attendance.totalCount || 0}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  },
};





