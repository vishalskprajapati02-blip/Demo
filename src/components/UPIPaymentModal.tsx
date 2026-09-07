import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { formatINR } from '../utils/timeUtils';
import { playSalonChime } from '../utils/soundUtils';
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  Loader2,
  ArrowRight,
  RefreshCw,
  X,
  Sparkles,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onPaymentSuccess: (details: {
    transactionRef: string;
    paidAmount: number;
    paidAt: string;
  }) => void;
}

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onPaymentSuccess,
}) => {
  const [paymentState, setPaymentState] = useState<'scan' | 'processing' | 'success' | 'failed'>('scan');
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 minutes timer
  const [simulatedTxnRef, setSimulatedTxnRef] = useState<string>('');
  const [selectedPayOption, setSelectedPayOption] = useState<'full' | 'token'>(
    appointment.paymentPreference === 'upi_advance' ? 'token' : 'full'
  );

  const payableAmount = selectedPayOption === 'token' ? 99 : appointment.price;
  const salonVpa = 'roopam.salon@okhdfcbank';

  // Generate QR Code URL with UPI payment scheme
  const upiIntentUri = `upi://pay?pa=${salonVpa}&pn=Roopam%20Luxury%20Salon&am=${payableAmount}&cu=INR&tn=Roopam%20Salon%20Pass%20${appointment.code}`;
  const qrPlaceholderUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    upiIntentUri
  )}`;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPaymentState('scan');
      setSecondsRemaining(300);
      setCopiedVpa(false);
    }
  }, [isOpen]);

  // Countdown timer for QR code validity
  useEffect(() => {
    if (!isOpen || paymentState !== 'scan') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, paymentState]);

  if (!isOpen) return null;

  const handleCopyVpa = () => {
    navigator.clipboard?.writeText(salonVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleStartSimulatedPayment = () => {
    setPaymentState('processing');

    // Simulate realistic 2-second UPI network handshake
    setTimeout(() => {
      // 12-digit mock UPI UTR reference number
      const randomUtr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const ref = `UPI/IND/${appointment.code}/${randomUtr.slice(0, 6)}`;
      setSimulatedTxnRef(ref);
      setPaymentState('success');
      playSalonChime();

      onPaymentSuccess({
        transactionRef: ref,
        paidAmount: payableAmount,
        paidAt: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      });
    }, 2200);
  };

  const handleSimulateFailure = () => {
    setPaymentState('processing');
    setTimeout(() => {
      setPaymentState('failed');
    }, 1500);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="upi-payment-overlay"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200 relative">
        {/* Top Accent Header with UPI branding */}
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  UPI Instant Pay
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  NPCI Verified
                </span>
              </div>
              <h3 className="text-sm font-semibold text-stone-100">
                Roopam Luxury Salon &amp; Spa
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            title="Close UPI overlay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6">
          {/* STATE 1: SCAN QR CODE */}
          {paymentState === 'scan' && (
            <div className="space-y-4">
              {/* Payment Amount Badge */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div>
                  <span className="text-xs text-stone-600 block">Total Payable Amount</span>
                  <span className="font-mono text-2xl font-extrabold text-stone-900">
                    {formatINR(payableAmount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">Booking Reference</span>
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                    #{appointment.code}
                  </span>
                </div>
              </div>

              {/* Amount Option Selector (Full vs Advance Token) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPayOption('full')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedPayOption === 'full'
                      ? 'border-amber-600 bg-amber-50/60 font-semibold text-stone-900 ring-1 ring-amber-600'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span className="block text-[11px] text-stone-500">Full Amount</span>
                  <span className="text-stone-900 font-bold">{formatINR(appointment.price)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPayOption('token')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedPayOption === 'token'
                      ? 'border-amber-600 bg-amber-50/60 font-semibold text-stone-900 ring-1 ring-amber-600'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span className="block text-[11px] text-stone-500">Advance Token</span>
                  <span className="text-stone-900 font-bold">{formatINR(99)}</span>
                </button>
              </div>

              {/* QR Code Frame with Image Placeholder */}
              <div className="text-center p-4 rounded-2xl bg-stone-50 border border-stone-200 relative group">
                <div className="relative inline-block mx-auto bg-white p-3 rounded-2xl shadow-sm border border-stone-200">
                  {/* The QR Code Placeholder Image */}
                  <img
                    id="upi-qr-placeholder-img"
                    src={qrPlaceholderUrl}
                    alt="UPI Payment QR Code Placeholder"
                    referrerPolicy="no-referrer"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto transition-transform"
                    onError={(e) => {
                      // Fallback SVG representation if remote QR server is unreachable in iframe
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = document.getElementById('upi-qr-svg-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />

                  {/* Fallback QR SVG in case network offline */}
                  <div
                    id="upi-qr-svg-fallback"
                    className="hidden w-48 h-48 sm:w-52 sm:h-52 flex-col items-center justify-center bg-stone-100 rounded-xl p-3 border border-stone-300"
                  >
                    <QrCode className="w-24 h-24 text-stone-800 stroke-[1.2]" />
                    <span className="text-[11px] font-mono text-stone-600 mt-2">
                      Scan: {salonVpa}
                    </span>
                  </div>

                  {/* Center Indian UPI logo overlay badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/95 px-2 py-1 rounded-md shadow-xs border border-stone-200 flex items-center gap-1 text-[10px] font-bold text-amber-700">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>UPI PAY</span>
                    </div>
                  </div>
                </div>

                {/* Expiry Timer */}
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    QR Code active • Expires in{' '}
                    <strong className="font-mono text-stone-800">{formatTimer(secondsRemaining)}</strong>
                  </span>
                </div>
              </div>

              {/* Supported UPI Apps Row */}
              <div>
                <span className="text-[11px] text-stone-500 block text-center mb-1.5 font-medium">
                  Scan &amp; pay with any UPI Application
                </span>
                <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] font-semibold text-stone-700">
                  <span className="px-2.5 py-1 bg-stone-100 rounded-lg border border-stone-200">
                    Google Pay
                  </span>
                  <span className="px-2.5 py-1 bg-stone-100 rounded-lg border border-stone-200">
                    PhonePe
                  </span>
                  <span className="px-2.5 py-1 bg-stone-100 rounded-lg border border-stone-200">
                    Paytm
                  </span>
                  <span className="px-2.5 py-1 bg-stone-100 rounded-lg border border-stone-200">
                    BHIM
                  </span>
                  <span className="px-2.5 py-1 bg-stone-100 rounded-lg border border-stone-200">
                    CRED
                  </span>
                </div>
              </div>

              {/* UPI ID / VPA Details with Copy Action */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-medium block">
                    Merchant UPI ID / VPA
                  </span>
                  <span className="font-mono font-bold text-stone-800">{salonVpa}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyVpa}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer shadow-2xs"
                >
                  {copiedVpa ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-stone-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Simulation Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  id="simulate-upi-success-btn"
                  type="button"
                  onClick={handleStartSimulatedPayment}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Simulate UPI Payment (₹{payableAmount})</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
                  <span>Demo simulation for sandbox</span>
                  <button
                    type="button"
                    onClick={handleSimulateFailure}
                    className="hover:text-rose-600 underline cursor-pointer"
                  >
                    Simulate Failed Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: PROCESSING / VERIFYING */}
          {paymentState === 'processing' && (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-amber-600" />
                </div>
              </div>

              <div>
                <h4 className="font-serif font-bold text-lg text-stone-900">
                  Verifying UPI Transaction...
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Connecting to NPCI UPI network and awaiting response from customer bank account.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono text-stone-600 max-w-xs mx-auto">
                Paying <strong>{formatINR(payableAmount)}</strong> to {salonVpa}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Please do not close this window</span>
              </div>
            </div>
          )}

          {/* STATE 3: SUCCESS CONFIRMATION */}
          {paymentState === 'success' && (
            <div className="py-6 px-2 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 mb-1">
                  Payment Verified • 100% Secure
                </span>
                <h4 className="font-serif font-bold text-xl text-stone-900">
                  Payment of {formatINR(payableAmount)} Received!
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  Thank you, {appointment.customerName}! Your salon appointment pass is now fully paid.
                </p>
              </div>

              {/* Digital Payment Receipt Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="text-stone-500">Transaction Status</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Success
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500">UPI Reference Number</span>
                  <span className="font-mono font-bold text-stone-800 text-[11px]">
                    {simulatedTxnRef}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Paid To</span>
                  <span className="font-semibold text-stone-800">{salonVpa}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Payment Date &amp; Time</span>
                  <span className="text-stone-700">
                    {appointment.date} • {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                  <span className="font-semibold text-stone-900">Amount Paid</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatINR(payableAmount)}
                  </span>
                </div>
              </div>

              <button
                id="upi-payment-done-btn"
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition cursor-pointer"
              >
                View Updated Salon Pass
              </button>
            </div>
          )}

          {/* STATE 4: FAILED / RETRY */}
          {paymentState === 'failed' && (
            <div className="py-8 px-2 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <XCircle className="w-10 h-10" />
              </div>

              <div>
                <h4 className="font-serif font-bold text-lg text-stone-900">
                  Payment Verification Failed
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  The simulated UPI gateway timed out or declined the request. You can retry or choose to pay at the salon reception desk.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentState('scan')}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Payment</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Pay at Salon Instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
