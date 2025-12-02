import React, { useEffect, useMemo, useState } from 'react';
import ImpactDashboard from '../customers/ImpactDashboard';
import { useAuthContext } from '../context/AuthContext';
import { profileService } from '../api/services/profile.service';

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs uppercase tracking-[0.3em] text-gray-500">{label}</span>
    <span className="text-base font-semibold text-gray-900">{value ?? '—'}</span>
  </div>
);

const PACKAGING_CHOICES = [
  {
    key: 'reusable',
    label: 'Reusable Kit',
    tagline: 'Best overall impact',
    description: 'Returnable steel or glass containers you drop off next delivery.',
    impact: '~0.6 kg CO₂, 5 L water saved / order',
  },
  {
    key: 'compostable',
    label: 'Compostable',
    tagline: 'Plant-based packaging',
    description: 'Certified compostable bowls + lids with low footprint inks.',
    impact: '~0.4 kg CO₂, 3 L water saved / order',
  },
  {
    key: 'minimal',
    label: 'Minimal',
    tagline: 'Lightweight essentials',
    description: 'Only what you need: recycled paper wrap + utensils on request.',
    impact: '~0.25 kg CO₂, 1.5 L water saved / order',
  },
  {
    key: 'standard',
    label: 'Standard Packaging',
    tagline: 'Default restaurant setup',
    description: 'No eco bonus applied. Use when you need conventional packaging.',
    impact: '0 bonus eco points',
  },
];

const getStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);

export default function Impact() {
  const { user, setUser } = useAuthContext();
  const firstName = user?.name?.split(' ')[0] || 'EcoBiter';
  const rewardPoints = user?.rewardPoints ?? 0;
  const [packagingChoice, setPackagingChoice] = useState('standard');
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stored = getStorage()?.getItem('ecobites_packaging_pref');
    const derived = stored || user?.preferences?.packaging || 'standard';
    setPackagingChoice(derived);
  }, [user?.preferences?.packaging]);

  const packagingLookup = useMemo(() => (
    PACKAGING_CHOICES.reduce((acc, choice) => {
      acc[choice.key] = choice;
      return acc;
    }, {})
  ), []);

  const handlePackagingSelect = async (key) => {
    setPackagingChoice(key);
    getStorage()?.setItem('ecobites_packaging_pref', key);
    if (typeof setUser === 'function' && user) {
      setUser({ ...user, preferences: { ...(user.preferences || {}), packaging: key } });
    }

    if (!user?._id) return;

    setIsSaving(true);
    try {
      await profileService.updatePreferences({ packaging: key });
      setFeedback(`${packagingLookup[key]?.label || 'Preference'} saved for upcoming orders.`);
    } catch (error) {
      console.error('Failed to persist packaging preference from Impact view:', error);
      setFeedback('Unable to save preference. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(''), 2400);
    }
  };

  const dashboardUserId = user?._id;

  return (
    <div className="min-h-screen bg-emerald-50/60 px-4 pt-24 pb-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-md">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Impact view</p>
              <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">Hi {firstName}, here is your impact</h1>
              <p className="mt-4 max-w-xl text-lg text-gray-600">
                Track how reusable packaging choices, seasonal meals, and combined deliveries reduce CO₂, water, and packaging waste over time.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-8 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Eco Reward Balance</p>
              <p className="text-4xl font-bold text-emerald-900">{rewardPoints}</p>
              <p className="mt-1 text-sm text-emerald-700">points</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InfoRow label="Name" value={user?.name || '—'} />
            <InfoRow label="Email" value={user?.email || '—'} />
            <InfoRow label="Preferred packaging" value={packagingLookup[packagingChoice]?.label || 'Mix of eco options'} />
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Packaging preference</p>
              <h2 className="text-3xl font-bold text-gray-900">Choose how your meals arrive</h2>
              <p className="text-base text-gray-600">Pick the option that fits your lifestyle. We’ll highlight restaurants that can honor your selection.</p>
            </div>
            {(feedback || isSaving) ? (
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                {isSaving ? 'Saving preference…' : feedback}
              </div>
            ) : null}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PACKAGING_CHOICES.map((choice) => {
              const selected = choice.key === packagingChoice;
              return (
                <button
                  type="button"
                  key={choice.key}
                  onClick={() => handlePackagingSelect(choice.key)}
                  disabled={isSaving}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selected ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                  } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">{choice.tagline}</p>
                      <h3 className="text-2xl font-bold text-gray-900">{choice.label}</h3>
                    </div>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        selected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {selected ? '✓' : choice.label.slice(0, 1)}
                    </span>
                  </div>
                  <p className="mt-3 text-base text-gray-600">{choice.description}</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-700">Impact: {choice.impact}</p>
                </button>
              );
            })}
          </div>
        </section>

        <ImpactDashboard userId={dashboardUserId} />
      </div>
    </div>
  );
}
