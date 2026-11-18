import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Search,
  Filter,
  Check,
  Building,
  Receipt
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Mark Paid Modal state
  const [markPaidModal, setMarkPaidModal] = useState(null);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState(null);

  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/payments'),
      api.get('/api/members?status=Pending%20Payment'),
    ])
      .then(([resPayments, resPending]) => {
        setPayments(resPayments.data);
        setPendingMembers(resPending.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkPaidSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      const res = await api.post(`/api/payments/mark-paid/${markPaidModal.id}`, {
        paymentMode,
        notes: paymentNotes || 'Marked Paid at Front Desk',
      });

      showToast(`Payment marked Paid! Receipt: ${res.data.payment?.receiptId}`);
      setReceiptData(res.data.payment);
      setMarkPaidModal(null);
      loadData();
    } catch (err) {
      alert('Error updating payment: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = p.memberName?.toLowerCase() || '';
      const receipt = p.receiptId?.toLowerCase() || '';
      const ref = p.transactionRef?.toLowerCase() || '';
      if (!name.includes(q) && !receipt.includes(q) && !ref.includes(q)) return false;
    }
    return true;
  });

  const totalPaid = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPending = pendingMembers
    .reduce((sum, m) => sum + (m.fee || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-black font-extrabold text-sm shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
            <span>Payments &</span>
            <span className="text-yellow-400">Renewals Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete transaction ledger, cash/UPI settlement, idempotent verification, and receipt printing
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#111622] border border-emerald-500/30 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-2">
            <span>Total Collected Revenue</span>
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">${totalPaid.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Settled Online, Cash & UPI</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111622] border border-amber-500/30 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-2">
            <span>Pending Walk-In Dues</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">${totalPending.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{pendingMembers.length} Members Pending Settlement</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111622] border border-slate-800 shadow-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase mb-2">
            <span>Settled Transactions</span>
            <CreditCard size={18} className="text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{payments.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Idempotent Transaction Records</div>
        </div>
      </div>

      {/* Pending Settlement Quick-Action Panel (if any members are pending) */}
      {pendingMembers.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <h3 className="font-extrabold text-sm uppercase text-amber-400 tracking-wider">
                Pending Settlement Front-Desk Queue ({pendingMembers.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Click member to mark Cash or UPI settled</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingMembers.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/20 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-white text-xs block">{m.name}</span>
                  <span className="text-[11px] text-slate-400">Plan: {m.planName} • Fee: <strong className="text-amber-400">${(m.fee || 49).toFixed(2)}</strong></span>
                </div>
                <button
                  onClick={() => setMarkPaidModal(m)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase transition shadow"
                >
                  Mark Paid
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Paid', 'Pending', 'Failed', 'Refunded'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === status
                  ? 'bg-yellow-500 text-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Member, Receipt, Txn..."
            className="w-full bg-[#111622] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#111622] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-5">Receipt ID</th>
                <th className="py-4 px-4">Member Name</th>
                <th className="py-4 px-4">Plan / Item</th>
                <th className="py-4 px-4">Amount & Mode</th>
                <th className="py-4 px-4">Date & Time</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Loading payments ledger...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No payment records found for current filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPaid = p.status === 'Paid';
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                          {p.receiptId || 'PENDING'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-white text-sm block">{p.memberName}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px] block">
                          {p.transactionRef}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-300">
                        {p.planName || 'Gym Membership Plan'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm">${(p.amount || 0).toFixed(2)}</div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {p.paymentMode}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-400">
                        <div>{new Date(p.paymentDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : p.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        {isPaid && p.receiptId && (
                          <button
                            onClick={() => setReceiptData(p)}
                            title="View / Print Tax Receipt"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Printer size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Mark Cash / UPI Paid */}
      {markPaidModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-yellow-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
              Mark Cash / UPI Settlement
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Idempotently marks fee as Paid for <strong className="text-white">{markPaidModal.name}</strong>, generates receipt ID, and extends expiry date accurately.
            </p>

            <form onSubmit={handleMarkPaidSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan:</span>
                  <span className="font-bold text-white">{markPaidModal.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payable Fee:</span>
                  <span className="font-bold text-yellow-400 text-sm">${(markPaidModal.fee || 49).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`p-3 rounded-xl border font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                      paymentMode === 'CASH'
                        ? 'bg-yellow-500 text-black border-yellow-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <DollarSign size={16} />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`p-3 rounded-xl border font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                      paymentMode === 'UPI'
                        ? 'bg-yellow-500 text-black border-yellow-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Receipt size={16} />
                    <span>UPI / QR</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Staff Settlement Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received cash at front desk register"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setMarkPaidModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="w-1/2 py-2.5 rounded-xl bg-yellow-500 text-black font-extrabold uppercase hover:bg-yellow-400 transition disabled:opacity-50"
                >
                  {submittingPayment ? 'Settling...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-slate-200">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-800">
              <span className="text-xs uppercase font-extrabold text-yellow-400 tracking-widest block">Official Payment Receipt</span>
              <h2 className="text-2xl font-black text-white mt-1">APEX GYM & FITNESS</h2>
              <p className="text-[11px] text-slate-400">100 Olympic Way, High Performance District</p>
            </div>

            {/* Receipt Details */}
            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt No:</span>
                <span className="font-mono font-bold text-yellow-400">{receiptData.receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member:</span>
                <span className="font-bold text-white">{receiptData.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span>{receiptData.planName || 'Membership Renewal'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="font-mono font-semibold uppercase">{receiptData.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Ref:</span>
                <span className="font-mono text-[10px] text-slate-400">{receiptData.transactionRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Date:</span>
                <span>{new Date(receiptData.paymentDate).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white uppercase">Amount Paid:</span>
                <span className="font-black text-emerald-400 text-lg">${(receiptData.amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 text-center mb-5">
              WhatsApp digital copy has been dispatched to member's phone number.
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setReceiptData(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase hover:bg-slate-700 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="w-1/2 py-2.5 rounded-xl bg-yellow-500 text-black font-extrabold text-xs uppercase hover:bg-yellow-400 transition flex items-center justify-center gap-1.5"
              >
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
