'use client';

import type { Metadata } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCreatePool } from '@/hooks/useFactory';
import { CreatePoolFormData } from '@/types';
import { formatUSDC, explorerTx } from '@/lib/utils';
import { parseUnits } from 'viem';
import { ChevronRight, ChevronLeft, Loader2, Lock, Globe, Info } from 'lucide-react';

const CYCLE_OPTIONS = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
];

const GRACE_OPTIONS = [
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
];

const initialForm: CreatePoolFormData = {
  name: '',
  description: '',
  isPrivate: false,
  contributionAmount: '100',
  maxMembers: 5,
  cycleDurationDays: 7,
  gracePeriodHours: 24,
  minReputationScore: 0,
};

export default function CreatePoolPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CreatePoolFormData>(initialForm);

  const { createPool, hash, isPending, isConfirming, isSuccess, error, reset } = useCreatePool();

  useEffect(() => {
    if (isConfirming) {
      toast.loading('Deploying pool...', { id: 'create' });
    }
    if (isSuccess && hash) {
      toast.success(
        <span>
          Pool deployed!{' '}
          <a href={explorerTx(hash)} target="_blank" rel="noopener noreferrer" className="underline">
            View tx
          </a>
        </span>,
        { id: 'create', duration: 5000 }
      );
      // Redirect to dashboard after a short delay to let the chain index
      setTimeout(() => router.push('/dashboard'), 2000);
    }
    if (error) {
      toast.error(`Failed: ${error.message.slice(0, 100)}`, { id: 'create' });
    }
  }, [isConfirming, isSuccess, hash, error, router]);

  const potAmount = (() => {
    try {
      const amount = parseUnits(form.contributionAmount || '0', 6);
      return amount * BigInt(form.maxMembers);
    } catch {
      return 0n;
    }
  })();

  const handleSubmit = () => {
    createPool(form);
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const isStep1Valid = form.name.trim().length > 0 && form.name.length <= 50;
  const isStep2Valid =
    parseFloat(form.contributionAmount) > 0 &&
    form.maxMembers >= 2 &&
    form.maxMembers <= 20;

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center page-container">
          <div className="text-center">
            <h1 className="font-heading font-bold text-2xl mb-4">Connect Wallet</h1>
            <p className="text-gray-400 mb-6">You need a wallet to create a pool.</p>
            <ConnectButton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 page-container">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl mb-2">Create a Savings Circle</h1>
            <p className="text-gray-400">Deploy a new Susu pool on Polkadot Hub</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    s === step
                      ? 'bg-accent text-primary'
                      : s < step
                      ? 'bg-success text-primary'
                      : 'bg-surface text-gray-400 border border-border'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    s === step ? 'text-accent' : s < step ? 'text-success' : 'text-gray-500'
                  }`}
                >
                  {s === 1 ? 'Details' : s === 2 ? 'Financial' : 'Requirements'}
                </span>
                {s < 3 && <div className="w-8 h-0.5 bg-border" />}
              </div>
            ))}
          </div>

          <div className="card">
            {/* Step 1: Pool Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="font-heading font-semibold text-xl">Pool Details</h2>

                <div>
                  <label className="label">
                    Pool Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Friday Circle, Market Women Savings..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={50}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">{form.name.length}/50</div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Describe your savings circle..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {form.description.length}/200
                  </div>
                </div>

                <div>
                  <label className="label">Pool Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isPrivate: false })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        !form.isPrivate
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-border/80'
                      }`}
                    >
                      <Globe size={20} className="text-accent mb-2" />
                      <div className="font-semibold text-sm">Public</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Anyone meeting the criteria can join
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isPrivate: true })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.isPrivate
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-border/80'
                      }`}
                    >
                      <Lock size={20} className="text-accent mb-2" />
                      <div className="font-semibold text-sm">Private</div>
                      <div className="text-xs text-gray-400 mt-1">
                        You manually approve each member
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Financial Settings */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-heading font-semibold text-xl">Financial Settings</h2>

                <div>
                  <label className="label">Contribution Amount (mUSDC per cycle)</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="input pr-16"
                      placeholder="100"
                      min="1"
                      step="1"
                      value={form.contributionAmount}
                      onChange={(e) => setForm({ ...form, contributionAmount: e.target.value })}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">
                      mUSDC
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <Info size={12} />
                    Winner receives {formatUSDC(potAmount)} mUSDC each cycle
                  </div>
                </div>

                <div>
                  <label className="label">Number of Members: {form.maxMembers}</label>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={form.maxMembers}
                    onChange={(e) => setForm({ ...form, maxMembers: parseInt(e.target.value) })}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2 min</span>
                    <span>20 max</span>
                  </div>
                </div>

                <div>
                  <label className="label">Cycle Duration</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {CYCLE_OPTIONS.map(({ label, days }) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setForm({ ...form, cycleDurationDays: days })}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                          form.cycleDurationDays === days
                            ? 'bg-accent text-primary border-accent'
                            : 'border-border text-gray-400 hover:border-accent/50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Grace Period (for late contributions)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {GRACE_OPTIONS.map(({ label, hours }) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setForm({ ...form, gracePeriodHours: hours })}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                          form.gracePeriodHours === hours
                            ? 'bg-accent text-primary border-accent'
                            : 'border-border text-gray-400 hover:border-accent/50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Requirements & Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-heading font-semibold text-xl">Requirements & Review</h2>

                <div>
                  <label className="label">
                    Minimum Reputation Score: {form.minReputationScore}{' '}
                    <span className="text-gray-400 font-normal">
                      ({form.minReputationScore === 0
                        ? 'Open to everyone'
                        : form.minReputationScore <= 300
                        ? 'NEWCOMER+'
                        : form.minReputationScore <= 600
                        ? 'TRUSTED+'
                        : form.minReputationScore <= 850
                        ? 'VETERAN+'
                        : 'CHAMPION only'})
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="900"
                    step="50"
                    value={form.minReputationScore}
                    onChange={(e) =>
                      setForm({ ...form, minReputationScore: parseInt(e.target.value) })
                    }
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Open (0)</span>
                    <span>Trusted (301)</span>
                    <span>Veteran (601)</span>
                    <span>Champion (851)</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-surface rounded-xl p-5 space-y-3">
                  <h3 className="font-heading font-semibold text-sm text-gray-300 uppercase tracking-wide">
                    Pool Summary
                  </h3>
                  {[
                    { label: 'Name', value: form.name },
                    { label: 'Type', value: form.isPrivate ? '🔒 Private' : '🌐 Public' },
                    { label: 'Contribution', value: `${form.contributionAmount} mUSDC` },
                    { label: 'Members', value: `${form.maxMembers} max` },
                    { label: 'Pot per cycle', value: `${formatUSDC(potAmount)} mUSDC` },
                    {
                      label: 'Cycle duration',
                      value: CYCLE_OPTIONS.find((o) => o.days === form.cycleDurationDays)?.label || '',
                    },
                    {
                      label: 'Grace period',
                      value:
                        GRACE_OPTIONS.find((o) => o.hours === form.gracePeriodHours)?.label || '',
                    },
                    {
                      label: 'Min reputation',
                      value: form.minReputationScore === 0 ? 'None' : form.minReputationScore,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-text-primary font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="btn-secondary flex items-center gap-2 disabled:opacity-0"
              >
                <ChevronLeft size={16} /> Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className="btn-primary flex items-center gap-2"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || isConfirming}
                  className="btn-primary flex items-center gap-2"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {isPending ? 'Waiting for wallet...' : 'Deploying...'}
                    </>
                  ) : (
                    <>Deploy Pool</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
