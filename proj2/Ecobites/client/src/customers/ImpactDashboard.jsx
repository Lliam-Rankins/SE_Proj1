import React from 'react';
import { useImpactStats } from '../hooks/useImpactStats';

const formatNumber = (value, options = {}) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  try {
    return new Intl.NumberFormat(undefined, options).format(value);
  } catch {
    return String(value);
  }
};

const StatCard = ({ label, value, unit, sublabel, icon }) => (
  <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{label}</p>
        <div className="mt-2 text-3xl font-bold text-gray-900">
          {value}
          {unit ? <span className="ml-1 text-base font-medium text-gray-500">{unit}</span> : null}
        </div>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600">
        {icon}
      </span>
    </div>
    {sublabel ? <p className="mt-3 text-xs leading-relaxed text-gray-500">{sublabel}</p> : null}
  </div>
);

const TimelineItem = ({ entry }) => (
  <li className="flex flex-col gap-1 border-b border-gray-100 py-2 last:border-0">
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-gray-800">
        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
      {entry.combined ? (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Combined order</span>
      ) : null}
    </div>
    <div className="text-xs text-gray-500">
      {formatNumber(entry.co2Kg, { maximumFractionDigits: 2 })} kg CO₂ •{' '}
      {formatNumber(entry.waterLiters, { maximumFractionDigits: 1 })} L water
    </div>
  </li>
);

const ImpactDashboard = ({ userId }) => {
  const { stats, isLoading, isError } = useImpactStats(userId);

  if (!userId) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
        Sign in to start tracking your eco impact.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Loading your impact dashboard…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">We could not load your orders. Please try again later.</p>
      </div>
    );
  }

  const { totals, equivalents, ordersTracked, combinedDeliveries, timeline } = stats;
  const hasOrders = ordersTracked > 0;
  const progressTowardsGoal = Math.min(100, Math.round((totals.co2Kg / 25) * 100));
  const nextMilestoneKg = Math.max(0, 25 - totals.co2Kg).toFixed(1);

  return (
    <section className="space-y-5">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">Impact overview</p>
        <h3 className="text-2xl font-bold text-gray-900">Your sustainable choices add up</h3>
        <p className="text-sm text-gray-500">
          Every order updates these numbers using simple heuristics for packaging, grouped deliveries, and meal spend.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
            {ordersTracked} tracked orders
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            {combinedDeliveries} combined deliveries
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="CO₂ avoided"
          value={formatNumber(totals.co2Kg, { maximumFractionDigits: 2 })}
          unit="kg"
          sublabel="vs conventional delivery choices"
          icon="🌿"
        />
        <StatCard
          label="Water saved"
          value={formatNumber(totals.waterLiters, { maximumFractionDigits: 1 })}
          unit="L"
          sublabel="thanks to greener meals + packaging"
          icon="💧"
        />
        <StatCard
          label="Packaging avoided"
          value={formatNumber(totals.packagingGrams, { maximumFractionDigits: 0 })}
          unit="g"
          sublabel="less single-use material in landfills"
          icon="📦"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-5 text-white shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Quarterly goal</p>
          <h4 className="mt-2 text-2xl font-bold">Save 25 kg of CO₂</h4>
          <p className="text-sm opacity-90">
            {progressTowardsGoal}% complete · {nextMilestoneKg} kg to go
          </p>
          <div className="mt-4 h-3 w-full rounded-full bg-white/20">
            <div className="h-3 rounded-full bg-white" style={{ width: `${progressTowardsGoal}%` }} />
          </div>
          <p className="mt-2 text-xs opacity-80">Combine orders and choose reusable kits to accelerate progress.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">Streaks & insights</p>
          {hasOrders ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>
                • {combinedDeliveries > 0
                  ? `${combinedDeliveries} delivery${combinedDeliveries > 1 ? 's' : ''} combined with neighbors`
                  : 'Group an order to unlock bonus multipliers'}
                .
              </li>
              <li>
                • Average impact per order: {formatNumber(totals.co2Kg / ordersTracked || 0, { maximumFractionDigits: 2 })} kg CO₂.
              </li>
              <li>
                • Packaging avoided per order: {formatNumber(totals.packagingGrams / (ordersTracked || 1), {
                  maximumFractionDigits: 0,
                })}{' '}
                g.
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Once you place an order, we will highlight your biggest impact wins here.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">Impact equivalents</p>
          {hasOrders ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>≈ {formatNumber(equivalents.trees, { maximumFractionDigits: 2 })} trees planted worth of CO₂.</li>
              <li>≈ {formatNumber(equivalents.showers, { maximumFractionDigits: 1 })} five-minute showers of water saved.</li>
              <li>≈ {formatNumber(equivalents.plasticBottles)} plastic bottles worth of packaging avoided.</li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Order a seasonal item or choose reusable packaging to see your first impact stats.</p>
          )}
          <div className="mt-4 text-xs text-gray-400">
            Estimates use conservative conversion factors until per-item lifecycle data is available.
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Recent orders</p>
            <span className="text-xs text-gray-500">
              {ordersTracked} tracked • {combinedDeliveries} combined
            </span>
          </div>
          {hasOrders ? (
            <ul className="mt-3">
              {timeline.map((entry, idx) => (
                <TimelineItem key={`${entry.date}-${idx}`} entry={entry} />
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Impact history appears after your first order.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          {
            title: 'Combine with a neighbor',
            detail: 'Earn +20 Eco Points and reduce courier miles.',
            icon: '👥',
          },
          {
            title: 'Seasonal swaps',
            detail: 'Order seasonal bowls twice this week for extra water savings.',
            icon: '🥗',
          },
          {
            title: 'Low-impact delivery',
            detail: 'Select bike or EV delivery when prompted at checkout.',
            icon: '🚲',
          },
        ].map((tip) => (
          <div
            key={tip.title}
            className="rounded-2xl border border-emerald-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600">
              {tip.icon}
            </div>
            <h4 className="text-lg font-semibold text-gray-900">{tip.title}</h4>
            <p className="mt-1 text-sm text-gray-600">{tip.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ImpactDashboard;
