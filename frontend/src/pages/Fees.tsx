import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Plus, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Fees() {
  const { user } = useAuthStore();
  const [isFeeStructureModalOpen, setIsFeeStructureModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const isAdminOrTeacher = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const [feeStructureData, setFeeStructureData] = useState({
    name: '',
    type: 'TUITION' as 'TUITION' | 'TRANSPORT' | 'HOSTEL' | 'LIBRARY' | 'LAB' | 'SPORTS' | 'OTHER',
    amount: '',
    classId: '',
    billingCycle: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME',
    dueDate: 5,
  });

  const [paymentData, setPaymentData] = useState({
    studentId: '',
    feeStructureId: '',
    amount: '',
    discount: '',
    scholarship: '',
    dueDate: '',
    paymentMethod: 'Cash',
    transactionId: '',
    remarks: '',
  });

  const { data: feeStructures } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => api.get('/fees/structures').then((res) => res.data),
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/fees/payments').then((res) => res.data),
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((res) => res.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/academic/classes').then((res) => res.data),
  });

  const createFeeStructureMutation = useMutation({
    mutationFn: (data: any) => api.post('/fees/structures', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setIsFeeStructureModalOpen(false);
      setFeeStructureData({
        name: '',
        type: 'TUITION',
        amount: '',
        classId: '',
        billingCycle: 'MONTHLY',
        dueDate: 5,
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create fee structure');
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => api.post('/fees/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsPaymentModalOpen(false);
      setPaymentData({
        studentId: '',
        feeStructureId: '',
        amount: '',
        discount: '',
        scholarship: '',
        dueDate: '',
        paymentMethod: 'Cash',
        transactionId: '',
        remarks: '',
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create payment');
    },
  });

  const handleFeeStructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFeeStructureMutation.mutate({
      ...feeStructureData,
      amount: parseFloat(feeStructureData.amount),
      classId: feeStructureData.classId || undefined,
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPaymentMutation.mutate({
      ...paymentData,
      amount: parseFloat(paymentData.amount),
      discount: parseFloat(paymentData.discount) || 0,
      scholarship: parseFloat(paymentData.scholarship) || 0,
      dueDate: paymentData.dueDate || new Date().toISOString(),
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Fees Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage fee structures and payments</p>
        </div>
        {isAdminOrTeacher && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setIsFeeStructureModalOpen(true)}
              className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Fee Structure
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="btn btn-secondary flex items-center justify-center w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Payment
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Fee Structures</h2>
          <div className="space-y-3">
            {feeStructures?.map((fee: any) => (
              <div key={fee.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{fee.name}</p>
                    <p className="text-sm text-gray-600">{fee.type} • {fee.billingCycle}</p>
                  </div>
                  <p className="text-lg font-bold">₹{fee.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Payments</h2>
          <div className="space-y-3">
            {payments?.slice(0, 5).map((payment: any) => (
              <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{payment.student?.firstName} {payment.student?.lastName}</p>
                    <p className="text-sm text-gray-600">{payment.feeStructure?.name}</p>
                  </div>
                  <span className={`badge ${
                    payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Fee Structure Modal */}
      {isFeeStructureModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Fee Structure</h2>
              <button
                onClick={() => setIsFeeStructureModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleFeeStructureSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={feeStructureData.name}
                  onChange={(e) => setFeeStructureData({ ...feeStructureData, name: e.target.value })}
                  placeholder="e.g., Tuition Fee"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    required
                    className="input"
                    value={feeStructureData.type}
                    onChange={(e) =>
                      setFeeStructureData({ ...feeStructureData, type: e.target.value as any })
                    }
                  >
                    <option value="TUITION">Tuition</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="HOSTEL">Hostel</option>
                    <option value="LIBRARY">Library</option>
                    <option value="LAB">Lab</option>
                    <option value="SPORTS">Sports</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="input"
                    value={feeStructureData.amount}
                    onChange={(e) =>
                      setFeeStructureData({ ...feeStructureData, amount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  className="input"
                  value={feeStructureData.classId}
                  onChange={(e) =>
                    setFeeStructureData({ ...feeStructureData, classId: e.target.value })
                  }
                >
                  <option value="">All Classes</option>
                  {classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.section ? `- ${cls.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Cycle *
                  </label>
                  <select
                    required
                    className="input"
                    value={feeStructureData.billingCycle}
                    onChange={(e) =>
                      setFeeStructureData({ ...feeStructureData, billingCycle: e.target.value as any })
                    }
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="ONE_TIME">One Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (Day) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    className="input"
                    value={feeStructureData.dueDate}
                    onChange={(e) =>
                      setFeeStructureData({ ...feeStructureData, dueDate: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFeeStructureModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFeeStructureMutation.isPending}
                  className="btn btn-primary"
                >
                  {createFeeStructureMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Payment</h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  required
                  className="input"
                  value={paymentData.studentId}
                  onChange={(e) => setPaymentData({ ...paymentData, studentId: e.target.value })}
                >
                  <option value="">Select Student</option>
                  {students?.students?.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Structure *
                </label>
                <select
                  required
                  className="input"
                  value={paymentData.feeStructureId}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, feeStructureId: e.target.value })
                  }
                >
                  <option value="">Select Fee Structure</option>
                  {feeStructures?.map((fee: any) => (
                    <option key={fee.id} value={fee.id}>
                      {fee.name} - ₹{fee.amount}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="input"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={paymentData.dueDate}
                    onChange={(e) => setPaymentData({ ...paymentData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={paymentData.discount}
                    onChange={(e) => setPaymentData({ ...paymentData, discount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={paymentData.scholarship}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, scholarship: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  className="input"
                  value={paymentData.paymentMethod}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, paymentMethod: e.target.value })
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID
                </label>
                <input
                  type="text"
                  className="input"
                  value={paymentData.transactionId}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, transactionId: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  className="input"
                  rows={3}
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                  className="btn btn-primary"
                >
                  {createPaymentMutation.isPending ? 'Creating...' : 'Create Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

