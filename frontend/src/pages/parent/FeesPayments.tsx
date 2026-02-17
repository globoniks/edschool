import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { DollarSign, Download, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function ParentFeesPayments() {
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/parents/dashboard').then((res) => res.data),
    enabled: user?.role === 'PARENT',
  });

  const { data: payments } = useQuery({
    queryKey: ['fee-payments'],
    queryFn: () => api.get('/fees/payments').then((res) => res.data).catch(() => []),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeChild = dashboardData?.children?.[0];
  const fees = activeChild?.fees?.dues || [];

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="text-sm text-gray-600 mt-1">Manage fee payments and view history. Contact school for payment options.</p>
        </div>
        <button
          onClick={() => {}}
          disabled
          title="Contact school for payment"
          className="btn btn-primary flex items-center gap-2 opacity-70 cursor-not-allowed"
        >
          <DollarSign className="w-4 h-4" />
          Pay Fees
        </button>
      </div>

      {/* Pending Fees */}
      {fees.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Pending Fees</h2>
          <div className="space-y-3">
            {fees.map((fee: any) => (
              <div key={fee.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{fee.feeStructureName}</p>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(fee.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      fee.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {fee.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Amount: ₹{fee.amount.toLocaleString()}
                    </p>
                    {fee.paid > 0 && (
                      <p className="text-xs text-gray-500">
                        Paid: ₹{fee.paid.toLocaleString()} | Remaining: ₹{fee.due.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">Contact school to pay</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>
        {payments && payments.length > 0 ? (
          <div className="space-y-3">
            {payments.slice(0, 10).map((payment: any) => (
              <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{payment.feeStructure?.name || 'Fee Payment'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="badge bg-green-100 text-green-800">Paid</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Amount: ₹{payment.amount.toLocaleString()}
                  </p>
                  <span
                    className="text-sm text-gray-500 flex items-center gap-1"
                    title="Receipt available at school"
                  >
                    <Download className="w-4 h-4 opacity-50" />
                    Receipt (at school)
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<DollarSign className="w-16 h-16 text-gray-400" />}
            title="No payment history"
            description="Payment history will appear here"
          />
        )}
      </div>
    </div>
  );
}

