// client/src/pages/Pricing.js
// Razorpay subscription checkout page

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PLANS = [
  {
    id: 'starter',
    label: 'Starter Plan',
    price: { monthly: 99, yearly: 79 },
    yearlyTotal: 948,
    saving: 20,
    tag: null,
    color: '#6366f1',
    features: [
      'ATS Score Check — 10 scans/month',
      'Resume Tailoring — 10 times/month',
      'Resume Upload (PDF)',
      '6 Resume Templates',
      'Cover Letter Generator (10/mo)',
      'Job Recommendations',
    ],
  },
  {
    id: 'pro',
    label: 'Pro Developer',
    price: { monthly: 249, yearly: 179 },
    yearlyTotal: 2148,
    saving: 28,
    tag: null,
    color: '#f59e0b',
    features: [
      'ATS Score Check — 25 scans/month',
      'Resume Tailoring — 25 times/month',
      '6 Resume Templates',
      'Cover Letter Generator (25/mo)',
      'Job Recommendations',
      'PDF Download',
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    price: { monthly: 499, yearly: 339 },
    yearlyTotal: 4068,
    saving: 32,
    tag: null,
    color: '#10b981',
    features: [
      'ATS Score Check — 50 scans/month',
      'Resume Tailoring — 50 times/month',
      '6 Resume Templates',
      'Cover Letter Generator (50/mo)',
      'Job Recommendations',
      'PDF Download',
    ],
  },
  {
    id: 'elite',
    label: 'Elite',
    price: { monthly: 999, yearly: 699 },
    yearlyTotal: 8388,
    saving: 30,
    tag: 'Most Popular',
    color: '#ec4899',
    features: [
      'ATS Score Check — 150 scans/month',
      'Resume Tailoring — 150 times/month',
      '14 Premium Resume Templates',
      'Cover Letter Generator (Unlimited)',
      'ATS Constraint Optimization',
      'Keyword Density Analysis',
      'Exact-Match JD Phrase Injection',
      'Skills Categorization (by type)',
    ],
  },
  {
    id: 'exclusive',
    label: 'Exclusive',
    price: { monthly: 1999, yearly: 1399 },
    yearlyTotal: 16788,
    saving: 30,
    tag: 'Best Value',
    color: '#8b5cf6',
    features: [
      'ATS Score Check — 500 scans/month',
      'Resume Tailoring — 500 times/month',
      '22 Premium Resume Templates',
      'All Elite Features +',
      'Verb+Context Syntax Optimization',
      'Acronym & Full-Term Expansion',
      'Timeline Format Correction',
      'ATS Parser Constraint Compliance',
    ],
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState('yearly');
  const [loading, setLoading] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      api.get('/payment/status').then(({ data }) => {
        if (data.plan) setCurrentPlan(data.plan);
      }).catch(() => {});
    }
  }, [user]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/register');
      return;
    }

    setLoading(planId);
    setError('');

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Payment gateway failed to load. Check your internet connection.');

      // 2. Create order on backend
      const { data } = await api.post('/payment/create-order', { planId, billing });

      // 3. Open Razorpay checkout
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Rezona',
        description: data.plan.description,
        order_id: data.order.id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: PLANS.find(p => p.id === planId)?.color || '#6366f1',
        },
        handler: async (response) => {
          // 4. Verify payment on backend
          try {
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              billing,
            });
            if (verifyRes.data.success) {
              setCurrentPlan(planId);
              setSuccess(`🎉 ${data.plan.name} activated successfully! Redirecting to dashboard...`);
              setTimeout(() => navigate('/dashboard'), 2000);
            }
          } catch (verifyErr) {
            setError('Payment received but verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => setLoading(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(null);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Payment initiation failed');
    }
    setLoading(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', padding: '60px 20px', color: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
          Upgrade Your Resume Game
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 32 }}>
          Choose a plan to unlock AI-powered resume tailoring, premium templates, and unlimited downloads.
        </p>

        {/* Billing Toggle */}
        <div style={{ display: 'inline-flex', background: '#1e1e2e', borderRadius: 8, padding: 4, marginBottom: 40 }}>
          <button
            onClick={() => setBilling('monthly')}
            style={{
              padding: '10px 24px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: billing === 'monthly' ? '#6366f1' : 'transparent',
              color: billing === 'monthly' ? '#fff' : '#94a3b8', fontWeight: 600, fontSize: 14,
            }}
          >Monthly</button>
          <button
            onClick={() => setBilling('yearly')}
            style={{
              padding: '10px 24px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: billing === 'yearly' ? '#6366f1' : 'transparent',
              color: billing === 'yearly' ? '#fff' : '#94a3b8', fontWeight: 600, fontSize: 14,
            }}
          >Yearly <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, marginLeft: 6 }}>Save up to 32%</span></button>
        </div>

        {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '12px 20px', borderRadius: 8, marginBottom: 20 }}>{error}</div>}
        {success && <div style={{ background: '#064e3b', color: '#6ee7b7', padding: '12px 20px', borderRadius: 8, marginBottom: 20 }}>{success}</div>}

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, textAlign: 'left' }}>
          {PLANS.map(plan => {
            const price = billing === 'monthly' ? plan.price.monthly : plan.price.yearly;
            const isActive = currentPlan === plan.id;
            return (
              <div key={plan.id} style={{
                background: '#1e1e2e', borderRadius: 12, padding: 28,
                border: plan.tag ? `2px solid ${plan.color}` : '1px solid #2d2d3d',
                position: 'relative',
              }}>
                {plan.tag && (
                  <span style={{ position: 'absolute', top: -12, left: 20, background: plan.color, color: '#fff', padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    {plan.tag}
                  </span>
                )}
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{plan.label}</h3>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>₹</span>
                  <span style={{ fontSize: 36, fontWeight: 800 }}>{price}</span>
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>/month</span>
                </div>
                {billing === 'yearly' && (
                  <p style={{ fontSize: 12, color: '#10b981', marginBottom: 16 }}>
                    Save {plan.saving}% — Billed ₹{plan.yearlyTotal}/year
                  </p>
                )}
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ padding: '6px 0', fontSize: 13.5, color: '#cbd5e1', display: 'flex', gap: 8 }}>
                      <span style={{ color: plan.color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isActive || loading === plan.id}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
                    background: isActive ? '#374151' : plan.color,
                    color: '#fff', fontWeight: 700, fontSize: 14, cursor: isActive ? 'default' : 'pointer',
                    opacity: loading === plan.id ? 0.7 : 1,
                  }}
                >
                  {isActive ? '✓ Current Plan' : loading === plan.id ? 'Processing...' : `Subscribe to ${plan.label}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
