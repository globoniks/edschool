import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { TrendingUp, FileText, Download } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/ToastProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ParentAcademicPerformance() {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const [downloading, setDownloading] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parents/dashboard').then((res) => res.data),
    enabled: user?.role === 'PARENT',
  });

  const activeChild = dashboardData?.children?.[0];
  const studentId = activeChild?.studentId;

  const { data: examMarks } = useQuery({
    queryKey: ['exam-marks', studentId],
    queryFn: () => api.get(`/exams/marks?studentId=${studentId}`).then((res) => res.data).catch(() => []),
    enabled: !!studentId,
  });

  const examIds = examMarks?.length
    ? Array.from(new Set((examMarks as any[]).map((m) => m.exam?.id ?? m.examId).filter(Boolean)))
    : [];

  const handleDownloadReport = async () => {
    if (!studentId || examIds.length === 0) {
      showError('No exam data available to download report');
      return;
    }
    setDownloading(true);
    try {
      const examId = examIds[0];
      const report = await api.get(`/exams/report-card/${studentId}/${examId}`).then((res) => res.data);
      const lines = [
        'Report Card',
        '============',
        `Exam: ${report.exam?.name ?? 'N/A'}`,
        '',
        'Subject-wise marks:',
        ...(report.marks || []).map((m: any) => `  ${m.subject?.name ?? 'N/A'}: ${m.marksObtained}/${m.maxMarks}`),
        '',
        `Total: ${report.summary?.obtainedMarks ?? 0} / ${report.summary?.totalMarks ?? 0}`,
        `Percentage: ${report.summary?.percentage ?? 0}%`,
        `Result: ${report.summary?.isPass ? 'PASS' : 'FAIL'}`,
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_card_${report.exam?.name?.replace(/\s+/g, '_') ?? examId}_${Date.now()}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Report card downloaded');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to download report card');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const exams = activeChild?.exams?.recent || [];

  // Calculate average percentage
  const avgPercentage = exams.length > 0
    ? Math.round(exams.reduce((sum: number, e: any) => sum + (e.marksObtained / e.maxMarks * 100), 0) / exams.length)
    : 0;

  // Prepare chart data
  const chartData = exams.map((exam: any) => ({
    subject: exam.subject,
    marks: Math.round((exam.marksObtained / exam.maxMarks) * 100),
    grade: exam.grade || 'N/A',
  }));

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Performance</h1>
          <p className="text-sm text-gray-600 mt-1">Track your child's academic progress</p>
        </div>
        <button
          onClick={handleDownloadReport}
          disabled={downloading || examIds.length === 0}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Downloading…' : 'Download Report'}
        </button>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">{avgPercentage}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Exams Taken</p>
              <p className="text-3xl font-bold text-gray-900">{exams.length}</p>
            </div>
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Subjects</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(exams.map((e: any) => e.subject)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Subject-wise Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="marks" fill="#3b82f6" name="Percentage" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Exam Results List */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Exam Results</h2>
        {exams.length > 0 ? (
          <div className="space-y-3">
            {exams.map((exam: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{exam.examName}</h3>
                    <p className="text-sm text-gray-600">{exam.subject}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(exam.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Marks: <span className="font-semibold">{exam.marksObtained}/{exam.maxMarks}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Percentage: <span className="font-semibold">
                        {Math.round((exam.marksObtained / exam.maxMarks) * 100)}%
                      </span>
                    </p>
                  </div>
                  {exam.grade && (
                    <span className="badge bg-blue-100 text-blue-800 text-lg px-3 py-1">
                      {exam.grade}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No exam results"
            description="Exam results will appear here once available"
          />
        )}
      </div>
    </div>
  );
}

