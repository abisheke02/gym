import { useState, useEffect } from 'react';
import { subscriptionAPI } from '../services/api';
import { CheckCircle, CreditCard, Calendar, Zap, Shield, Star, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const PLAN_META = {
  monthly:     { color: 'border-gray-200 dark:border-gray-700', badge: null,          icon: Clock,   iconColor: 'text-gray-500' },
  half_yearly: { color: 'border-[#005c5b]',                     badge: 'Popular',     icon: Zap,     iconColor: 'text-[#005c5b]' },
  yearly:      { color: 'border-amber-400',                     badge: 'Best Value',  icon: Star,    iconColor: 'text-amber-500' },
};

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Subscriptions = () => {
  const [plans, setPlans] = useState({});
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [currentRes, historyRes] = await Promise.all([
        subscriptionAPI.getCurrent(),
        subscriptionAPI.getHistory(),
      ]);
      setPlans(currentRes.data.plans || {});
      setCurrent(currentRes.data.subscription);
      setHistory(historyRes.data.history || []);
    } catch {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planType) => {
    setPaying(planType);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment service unavailable. Check your internet connection.');
        setPaying(null);
        return;
      }

      const orderRes = await subscriptionAPI.createOrder({ plan_type: planType });
      const { order, plan, key_id } = orderRes.data;

      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'IRONMAN FITNESS',
        description: `${plan.label} Subscription`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await subscriptionAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: planType,
            });
            toast.success(`${plan.label} subscription activated!`);
            fetchData();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: 'Gym Owner' },
        theme: { color: '#005c5b' },
        modal: { ondismiss: () => setPaying(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not initiate payment');
    } finally {
      setPaying(null);
    }
  };

  const daysLeft = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005c5b]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Software Subscription
          </h1>
          <p className="text-xs text-gray-400 font-bold mt-0.5">
            Manage your IRONMAN FITNESS platform plan
          </p>
        </div>
        <Shield className="w-8 h-8 text-[#005c5b] opacity-60" />
      </div>

      {/* Current Subscription Banner */}
      {current ? (
        <div className="bg-[#005c5b] text-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-white/80" />
            <div>
              <p className="font-black text-sm uppercase tracking-wide">
                {current.plan_type.replace('_', ' ')} Plan — Active
              </p>
              <p className="text-xs text-white/70 font-bold">
                Expires {new Date(current.end_date).toLocaleDateString('en-IN')}
                {' '}· {daysLeft(current.end_date)} days left
              </p>
            </div>
          </div>
          <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
            ₹{parseFloat(current.amount).toLocaleString()}
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            No active subscription. Choose a plan below to continue using the platform.
          </p>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(plans).map(([planType, plan]) => {
          const meta = PLAN_META[planType] || PLAN_META.monthly;
          const MetaIcon = meta.icon;
          const isActive = current?.plan_type === planType && current?.status === 'active';
          return (
            <div
              key={planType}
              className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 ${meta.color} p-5 flex flex-col gap-3 shadow-sm`}
            >
              {meta.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest bg-[#005c5b] text-white px-3 py-0.5 rounded-full">
                  {meta.badge}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MetaIcon className={`w-5 h-5 ${meta.iconColor}`} />
                  <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wide">
                    {plan.label}
                  </span>
                </div>
                {isActive && (
                  <span className="text-[10px] font-black bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full uppercase">
                    Current
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  ₹{plan.amount.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 font-bold">
                  / {plan.months === 1 ? 'month' : `${plan.months} months`}
                </span>
              </div>

              {plan.savings && (
                <span className="text-xs font-black text-[#005c5b] dark:text-[#01a2a1]">
                  {plan.savings} — ₹{Math.round(plan.amount / plan.months)}/mo
                </span>
              )}

              <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold flex-1">
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> Unlimited members</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> All branches</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> Attendance + Reports</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> WhatsApp integration</li>
                {plan.months >= 6 && (
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> Priority support</li>
                )}
                {plan.months === 12 && (
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" /> Custom branding</li>
                )}
              </ul>

              <button
                onClick={() => handlePurchase(planType)}
                disabled={paying === planType || isActive}
                className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-[#005c5b] hover:bg-[#004746] text-white'
                }`}
              >
                {paying === planType ? 'Processing...' : isActive ? 'Active Plan' : `Subscribe — ₹${plan.amount.toLocaleString()}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Transaction History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#005c5b]" />
            <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
              Payment History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-4 py-2.5 text-left">Plan</th>
                  <th className="px-4 py-2.5 text-left">Amount</th>
                  <th className="px-4 py-2.5 text-left">Period</th>
                  <th className="px-4 py-2.5 text-left">Payment ID</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white capitalize">
                      {h.plan_type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-2.5 font-black text-[#005c5b] dark:text-[#01a2a1]">
                      ₹{parseFloat(h.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(h.start_date).toLocaleDateString('en-IN')} – {new Date(h.end_date).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-[10px]">
                      {h.payment_id ? h.payment_id.slice(-12) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border border-current ${
                        h.status === 'active'
                          ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                          : h.status === 'expired'
                          ? 'text-gray-400 bg-gray-100 dark:bg-gray-700'
                          : 'text-red-500 bg-red-50'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
