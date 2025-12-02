import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../api/services/order.service';

const PACKAGING_IMPACT = {
  reusable: { co2Kg: 0.6, waterLiters: 5, packagingGrams: 150 },
  compostable: { co2Kg: 0.4, waterLiters: 3, packagingGrams: 90 },
  minimal: { co2Kg: 0.25, waterLiters: 1.5, packagingGrams: 60 },
  standard: { co2Kg: 0, waterLiters: 0, packagingGrams: 0 },
};

const COMBINED_BONUS = { co2Kg: 1.25, waterLiters: 4, packagingGrams: 110 };

const DEFAULT_STATS = {
  totals: { co2Kg: 0, waterLiters: 0, packagingGrams: 0 },
  equivalents: { trees: 0, showers: 0, plasticBottles: 0 },
  ordersTracked: 0,
  combinedDeliveries: 0,
  timeline: [],
};

const normalizeOrder = (order) => {
  if (!order) return null;
  const spend = Number(order.total ?? order.subtotal ?? 0) || 0;
  const ecoPoints = Number(order.ecoRewardPoints ?? 0) || 0;
  const packagingKey = String(order.packagingPreference || 'standard').toLowerCase();
  const packaging = PACKAGING_IMPACT[packagingKey] || PACKAGING_IMPACT.standard;
  const combined = Boolean(order.combineGroupId || (order.combineWith?.length));
  const spendFactor = Math.max(spend / 25, 0); // rough scaling multiplier

  const co2Kg = packaging.co2Kg + spendFactor * 0.85 + ecoPoints * 0.015 + (combined ? COMBINED_BONUS.co2Kg : 0);
  const waterLiters = packaging.waterLiters + spendFactor * 2.5 + (combined ? COMBINED_BONUS.waterLiters : 0);
  const packagingGrams = packaging.packagingGrams + spendFactor * 35 + (combined ? COMBINED_BONUS.packagingGrams : 0);

  return {
    co2Kg,
    waterLiters,
    packagingGrams,
    combined,
    date: order.createdAt || order.updatedAt || new Date().toISOString(),
  };
};

const buildStats = (orders) => {
  const safeOrders = Array.isArray(orders)
    ? orders.filter((order) => String(order.status || '').toUpperCase() !== 'CANCELLED')
    : [];

  if (safeOrders.length === 0) {
    return DEFAULT_STATS;
  }

  const impacts = safeOrders.map(normalizeOrder).filter(Boolean);

  const totals = impacts.reduce(
    (acc, impact) => ({
      co2Kg: acc.co2Kg + impact.co2Kg,
      waterLiters: acc.waterLiters + impact.waterLiters,
      packagingGrams: acc.packagingGrams + impact.packagingGrams,
    }),
    { ...DEFAULT_STATS.totals },
  );

  const combinedDeliveries = impacts.filter((impact) => impact.combined).length;

  const equivalents = {
    trees: totals.co2Kg / 21, // ≈21 kg CO₂ per mature tree annually
    showers: totals.waterLiters / 50, // ≈50 L per five-minute shower
    plasticBottles: totals.packagingGrams / 18, // ≈18 g per 500 mL bottle
  };

  const timeline = impacts
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)
    .map(({ date, co2Kg, waterLiters, combined }) => ({
      date,
      co2Kg,
      waterLiters,
      combined,
    }));

  return {
    totals,
    equivalents,
    ordersTracked: safeOrders.length,
    combinedDeliveries,
    timeline,
  };
};

export const useImpactStats = (userId) => {
  const query = useQuery({
    queryKey: ['impactStats', userId],
    queryFn: () => orderService.getByRole('customer', userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
    select: (data) => data ?? [],
  });

  const stats = useMemo(() => buildStats(query.data), [query.data]);

  return {
    ...query,
    stats,
  };
};
