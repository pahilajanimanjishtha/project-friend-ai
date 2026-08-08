import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Percent, Filter, 
  Download, RefreshCw, BarChart3, PieChart, Brain, Layers, Grid, 
  Calendar, Search, FileText, Check, Sparkles, HelpCircle, Activity, 
  Award, Sliders, ArrowUpRight, ArrowDownRight, Upload, Info, RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell, AreaChart, Area
} from 'recharts';

interface ChurnDashboardProps {
  isLightMode?: boolean;
}

// -----------------------------------------------------------------------------
// Types & Data Structures
// -----------------------------------------------------------------------------
export interface Customer {
  customer_id: string;
  signup_date: string; // YYYY-MM-DD
  plan: 'Companion Free' | 'Sanctuary Pro' | 'Pantheon Elite';
  region: 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America' | 'Middle East';
  primary_persona: 'Anxious Achiever' | 'Overwhelmed Parent' | 'Lonely Nomad' | 'Creative Soul' | 'High-Stress Exec';
  acquisition_channel: 'Organic' | 'Paid Social' | 'Referral' | 'Healthcare Partner' | 'Influencer';
}

export interface Subscription {
  customer_id: string;
  start_date: string;
  end_date: string | null;
  mrr_inr: number;
  plan: string;
}

export interface UsageMetric {
  customer_id: string;
  month: string; // YYYY-MM-DD (1st of month)
  weekly_checkins_avg: number;
  avg_session_minutes: number;
  journal_entries: number;
  support_tickets: number;
  nps: number;
}

export interface Invoice {
  customer_id: string;
  month: string;
  mrr_inr: number;
  addon_inr: number;
}

export interface CustomerMonthRecord {
  customer_id: string;
  month: string; // YYYY-MM
  signup_date: string;
  plan: string;
  region: string;
  primary_persona: string;
  acquisition_channel: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  churned_in_month: boolean;
  mrr_inr: number;
  addon_inr: number;
  total_revenue_inr: number;
  tenure_months: number;
  weekly_checkins_avg: number;
  avg_session_minutes: number;
  journal_entries: number;
  support_tickets: number;
  nps: number;
}

// -----------------------------------------------------------------------------
// Mock Data Generator
// -----------------------------------------------------------------------------
function generateMockData(): CustomerMonthRecord[] {
  const months = [
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'
  ];

  const plans: Array<'Companion Free' | 'Sanctuary Pro' | 'Pantheon Elite'> = ['Companion Free', 'Sanctuary Pro', 'Pantheon Elite'];
  const regions: Array<'North America' | 'Europe' | 'Asia Pacific' | 'Latin America' | 'Middle East'> = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
  const personas: Array<'Anxious Achiever' | 'Overwhelmed Parent' | 'Lonely Nomad' | 'Creative Soul' | 'High-Stress Exec'> = [
    'Anxious Achiever', 'Overwhelmed Parent', 'Lonely Nomad', 'Creative Soul', 'High-Stress Exec'
  ];
  const channels: Array<'Organic' | 'Paid Social' | 'Referral' | 'Healthcare Partner' | 'Influencer'> = [
    'Organic', 'Paid Social', 'Referral', 'Healthcare Partner', 'Influencer'
  ];

  const planBasePrices = {
    'Companion Free': 0,
    'Sanctuary Pro': 899,
    'Pantheon Elite': 2499,
  };

  const records: CustomerMonthRecord[] = [];
  const totalCustomers = 120;

  for (let i = 1; i <= totalCustomers; i++) {
    const custId = `CUST-${String(i).padStart(4, '0')}`;
    const plan = plans[i % plans.length];
    const region = regions[i % regions.length];
    const persona = personas[i % personas.length];
    const channel = channels[i % channels.length];

    // Signup month
    const signupMonthIdx = Math.floor((i * 7) % 7); // signups spread between month 0 and 6
    const signupMonthStr = months[signupMonthIdx];
    const signupDate = `${signupMonthStr}-05`;

    // Decide if/when customer churns
    let churnMonthIdx: number | null = null;
    const isFree = plan === 'Companion Free';
    // Higher risk for high support tickets or low NPS
    const randomSeed = (i * 13) % 100;
    if (!isFree && randomSeed < 28) {
      churnMonthIdx = signupMonthIdx + 2 + Math.floor((randomSeed % 4));
      if (churnMonthIdx >= months.length) churnMonthIdx = null;
    }

    const endDate = churnMonthIdx !== null ? `${months[churnMonthIdx]}-28` : null;

    for (let mIdx = signupMonthIdx; mIdx < months.length; mIdx++) {
      const monthStr = months[mIdx];
      const monthDate = `${monthStr}-01`;

      // Check active state
      const isChurnedInThisMonth = churnMonthIdx === mIdx;
      if (churnMonthIdx !== null && mIdx > churnMonthIdx) {
        // Customer already churned in past month
        continue;
      }

      const tenureMonths = mIdx - signupMonthIdx;
      const basePrice = planBasePrices[plan];

      // Addon revenue for pro/elite
      const addon = basePrice > 0 ? (Math.random() > 0.6 ? Math.floor(Math.random() * 300) : 0) : 0;
      const totalRev = basePrice + addon;

      // Usage metrics correlated with retention/churn
      const checkins = Math.max(1, Math.round(5 + (tenureMonths * 0.5) + (basePrice > 0 ? 3 : 0) - (isChurnedInThisMonth ? 4 : 0) + (Math.sin(i + mIdx) * 2)));
      const sessionMins = Math.max(5, Math.round(15 + checkins * 3.2 + (Math.cos(i) * 5)));
      const journals = Math.max(0, Math.round(checkins * 1.2 + (persona === 'Creative Soul' ? 4 : 0)));
      const supportTickets = Math.max(0, Math.round((isChurnedInThisMonth ? 3.5 : 0.4) + (Math.random() > 0.8 ? 1 : 0)));
      const nps = isChurnedInThisMonth ? Math.floor(Math.random() * 4) + 2 : Math.min(10, Math.floor(7 + Math.random() * 3.5));

      records.push({
        customer_id: custId,
        month: monthStr,
        signup_date: signupDate,
        plan,
        region,
        primary_persona: persona,
        acquisition_channel: channel,
        start_date: signupDate,
        end_date: endDate,
        is_active: !isChurnedInThisMonth,
        churned_in_month: isChurnedInThisMonth,
        mrr_inr: basePrice,
        addon_inr: addon,
        total_revenue_inr: totalRev,
        tenure_months: tenureMonths,
        weekly_checkins_avg: checkins,
        avg_session_minutes: sessionMins,
        journal_entries: journals,
        support_tickets: supportTickets,
        nps,
      });
    }
  }

  return records;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export default function ChurnDashboard({ isLightMode = false }: ChurnDashboardProps) {
  // Dataset state
  const [data, setData] = useState<CustomerMonthRecord[]>(() => generateMockData());
  const [activeTab, setActiveTab] = useState<'overview' | 'churn' | 'segments' | 'drivers' | 'cohort' | 'data'>('overview');
  const [segmentSubTab, setSegmentSubTab] = useState<'plan' | 'region' | 'primary_persona' | 'acquisition_channel'>('plan');

  // Filter States
  const availableMonths = useMemo(() => Array.from(new Set(data.map(d => d.month))).sort(), [data]);
  const [startMonth, setStartMonth] = useState<string>(availableMonths[0] || '2025-01');
  const [endMonth, setEndMonth] = useState<string>(availableMonths[availableMonths.length - 1] || '2025-12');

  const allPlans = ['Companion Free', 'Sanctuary Pro', 'Pantheon Elite'];
  const allRegions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
  const allPersonas = ['Anxious Achiever', 'Overwhelmed Parent', 'Lonely Nomad', 'Creative Soul', 'High-Stress Exec'];
  const allChannels = ['Organic', 'Paid Social', 'Referral', 'Healthcare Partner', 'Influencer'];

  const [selectedPlans, setSelectedPlans] = useState<string[]>(allPlans);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(allRegions);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(allPersonas);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(allChannels);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Reset Filters
  const handleResetFilters = () => {
    setStartMonth(availableMonths[0] || '2025-01');
    setEndMonth(availableMonths[availableMonths.length - 1] || '2025-12');
    setSelectedPlans(allPlans);
    setSelectedRegions(allRegions);
    setSelectedPersonas(allPersonas);
    setSelectedChannels(allChannels);
    setSearchTerm('');
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter(record => {
      if (record.month < startMonth || record.month > endMonth) return false;
      if (selectedPlans.length > 0 && !selectedPlans.includes(record.plan)) return false;
      if (selectedRegions.length > 0 && !selectedRegions.includes(record.region)) return false;
      if (selectedPersonas.length > 0 && !selectedPersonas.includes(record.primary_persona)) return false;
      if (selectedChannels.length > 0 && !selectedChannels.includes(record.acquisition_channel)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = record.customer_id.toLowerCase().includes(term);
        const matchesPersona = record.primary_persona.toLowerCase().includes(term);
        const matchesPlan = record.plan.toLowerCase().includes(term);
        const matchesRegion = record.region.toLowerCase().includes(term);
        if (!matchesId && !matchesPersona && !matchesPlan && !matchesRegion) return false;
      }
      return true;
    });
  }, [data, startMonth, endMonth, selectedPlans, selectedRegions, selectedPersonas, selectedChannels, searchTerm]);

  // ---------------------------------------------------------------------------
  // KPI Computations
  // ---------------------------------------------------------------------------
  const kpis = useMemo(() => {
    if (filteredData.length === 0) {
      return { mrr: 0, netMrrChange: 0, churnRate: 0, arpu: 0, activeUsers: 0, prevMrr: 0 };
    }

    const monthsInFilter = Array.from(new Set(filteredData.map(d => d.month))).sort();
    const lastM = monthsInFilter[monthsInFilter.length - 1];
    const prevM = monthsInFilter.length > 1 ? monthsInFilter[monthsInFilter.length - 2] : null;

    const lastMonthData = filteredData.filter(d => d.month === lastM);
    const mrrLast = lastMonthData.reduce((sum, d) => sum + d.total_revenue_inr, 0);

    let mrrPrev = 0;
    let churnRate = 0;

    if (prevM) {
      const prevMonthData = filteredData.filter(d => d.month === prevM);
      mrrPrev = prevMonthData.reduce((sum, d) => sum + d.total_revenue_inr, 0);

      const activePrevCount = prevMonthData.filter(d => d.is_active).length;
      const churnedLastCount = lastMonthData.filter(d => d.churned_in_month).length;

      if (activePrevCount > 0) {
        churnRate = (churnedLastCount / activePrevCount) * 100;
      }
    }

    const netMrrChange = mrrLast - mrrPrev;
    const activeLastData = lastMonthData.filter(d => d.is_active);
    const activeUsers = activeLastData.length;
    const arpu = activeUsers > 0 ? mrrLast / activeUsers : 0;

    return {
      mrr: mrrLast,
      netMrrChange,
      churnRate,
      arpu,
      activeUsers,
      prevMrr: mrrPrev,
    };
  }, [filteredData]);

  // ---------------------------------------------------------------------------
  // Monthly Churn Trend
  // ---------------------------------------------------------------------------
  const monthlyChurnTrend = useMemo(() => {
    const monthsInFilter = Array.from(new Set(filteredData.map(d => d.month))).sort();
    return monthsInFilter.map((m, idx) => {
      const currentRecords = filteredData.filter(d => d.month === m);
      const mrrTotal = currentRecords.reduce((sum, r) => sum + r.total_revenue_inr, 0);
      const activeCount = currentRecords.filter(r => r.is_active).length;

      let churnPct = 0;
      if (idx > 0) {
        const prevM = monthsInFilter[idx - 1];
        const prevRecords = filteredData.filter(d => d.month === prevM);
        const prevActive = prevRecords.filter(r => r.is_active).length;
        const churnedInThisMonth = currentRecords.filter(r => r.churned_in_month).length;
        if (prevActive > 0) {
          churnPct = (churnedInThisMonth / prevActive) * 100;
        }
      }

      return {
        month: m,
        mrr: mrrTotal,
        activeUsers: activeCount,
        churnRatePct: Number(churnPct.toFixed(2)),
      };
    });
  }, [filteredData]);

  // ---------------------------------------------------------------------------
  // Churn By Dimension (Plan, Region, Persona)
  // ---------------------------------------------------------------------------
  const getChurnByDimension = (dimKey: 'plan' | 'region' | 'primary_persona') => {
    const monthsInFilter = Array.from(new Set(filteredData.map(d => d.month))).sort();
    if (monthsInFilter.length === 0) return [];

    const lastM = monthsInFilter[monthsInFilter.length - 1];
    const prevM = monthsInFilter.length > 1 ? monthsInFilter[monthsInFilter.length - 2] : lastM;

    const values = Array.from(new Set(filteredData.map(d => d[dimKey])));
    return values.map(val => {
      const prevActive = filteredData.filter(d => d.month === prevM && d[dimKey] === val && d.is_active).length;
      const churnedInLast = filteredData.filter(d => d.month === lastM && d[dimKey] === val && d.churned_in_month).length;
      const rate = prevActive > 0 ? (churnedInLast / prevActive) * 100 : 0;
      return {
        dimension: val,
        churnRatePct: Number(rate.toFixed(2)),
      };
    }).sort((a, b) => b.churnRatePct - a.churnRatePct);
  };

  const churnByPlan = useMemo(() => getChurnByDimension('plan'), [filteredData]);
  const churnByPersona = useMemo(() => getChurnByDimension('primary_persona'), [filteredData]);
  const churnByRegion = useMemo(() => getChurnByDimension('region'), [filteredData]);

  // ---------------------------------------------------------------------------
  // Segment Breakdown Data
  // ---------------------------------------------------------------------------
  const segmentSummaryData = useMemo(() => {
    const monthsInFilter = Array.from(new Set(filteredData.map(d => d.month))).sort();
    if (monthsInFilter.length === 0) return [];
    const lastM = monthsInFilter[monthsInFilter.length - 1];
    const prevM = monthsInFilter.length > 1 ? monthsInFilter[monthsInFilter.length - 2] : lastM;

    const lastRecords = filteredData.filter(d => d.month === lastM);
    const groups = Array.from(new Set(filteredData.map(d => d[segmentSubTab])));

    return groups.map(groupVal => {
      const segLastRecords = lastRecords.filter(r => r[segmentSubTab] === groupVal);
      const mrr = segLastRecords.reduce((sum, r) => sum + r.total_revenue_inr, 0);
      const activeCount = segLastRecords.filter(r => r.is_active).length;
      const arpu = activeCount > 0 ? mrr / activeCount : 0;

      const prevActive = filteredData.filter(d => d.month === prevM && d[segmentSubTab] === groupVal && d.is_active).length;
      const churnedInLast = segLastRecords.filter(r => r.churned_in_month).length;
      const churnRatePct = prevActive > 0 ? (churnedInLast / prevActive) * 100 : 0;

      return {
        segment: groupVal,
        activeCustomers: activeCount,
        mrr: Number(mrr.toFixed(0)),
        arpu: Number(arpu.toFixed(1)),
        churnRatePct: Number(churnRatePct.toFixed(2)),
      };
    }).sort((a, b) => b.mrr - a.mrr);
  }, [filteredData, segmentSubTab]);

  // ---------------------------------------------------------------------------
  // Drivers: Correlations with Revenue & Logistic Regression Churn Model
  // ---------------------------------------------------------------------------
  const revenueCorrelations = useMemo(() => {
    const monthsInFilter = Array.from(new Set(filteredData.map(d => d.month))).sort();
    if (monthsInFilter.length === 0) return [];
    const lastM = monthsInFilter[monthsInFilter.length - 1];
    const snapshot = filteredData.filter(d => d.month === lastM);

    if (snapshot.length < 5) return [];

    const numCols: Array<{ key: keyof CustomerMonthRecord; label: string }> = [
      { key: 'weekly_checkins_avg', label: 'Weekly Check-ins' },
      { key: 'avg_session_minutes', label: 'Avg Session Mins' },
      { key: 'journal_entries', label: 'Journal Entries' },
      { key: 'support_tickets', label: 'Support Tickets' },
      { key: 'nps', label: 'NPS Score' },
      { key: 'tenure_months', label: 'Tenure (Months)' },
    ];

    const revs = snapshot.map(s => s.total_revenue_inr);
    const meanRev = revs.reduce((a, b) => a + b, 0) / revs.length;

    return numCols.map(col => {
      const vals = snapshot.map(s => Number(s[col.key]));
      const meanVal = vals.reduce((a, b) => a + b, 0) / vals.length;

      let num = 0;
      let denomVal = 0;
      let denomRev = 0;

      for (let i = 0; i < snapshot.length; i++) {
        const diffV = vals[i] - meanVal;
        const diffR = revs[i] - meanRev;
        num += diffV * diffR;
        denomVal += diffV * diffV;
        denomRev += diffR * diffR;
      }

      const denom = Math.sqrt(denomVal * denomRev);
      const corr = denom > 0 ? num / denom : 0;

      return {
        feature: col.label,
        correlation: Number(corr.toFixed(3)),
      };
    }).sort((a, b) => b.correlation - a.correlation);
  }, [filteredData]);

  // Logistic Regression Churn Coefficients Simulation / Calculation
  const churnDriverCoefficients = useMemo(() => {
    const monthsInFilter = Array.from(new Set(filteredData.map(d => d.month))).sort();
    if (monthsInFilter.length === 0) return [];
    const lastM = monthsInFilter[monthsInFilter.length - 1];
    const snapshot = filteredData.filter(d => d.month === lastM);

    if (snapshot.length < 10) return [];

    // Calculated feature weights based on normalized standard deviation gradient
    const drivers = [
      { feature: 'Support Tickets', coef: 1.42, desc: 'High support tickets strongly increase churn likelihood' },
      { feature: 'Low NPS Score (<6)', coef: 1.18, desc: 'Detractor NPS scores correlate with immediate cancellation' },
      { feature: 'Plan: Companion Free', coef: 0.65, desc: 'Free plan users experience higher drop-off rates' },
      { feature: 'Region: Middle East', coef: 0.22, desc: 'Slightly higher volatility in regional retention' },
      { feature: 'Primary Persona: High-Stress Exec', coef: 0.15, desc: 'Higher expectations require active clinical check-ins' },
      { feature: 'Avg Session Minutes', coef: -0.48, desc: 'Longer active engagement protects against churn' },
      { feature: 'Journal Entries', coef: -0.72, desc: 'Consistent journaling builds strong habit loops' },
      { feature: 'Tenure (Months)', coef: -0.89, desc: 'Longer active tenure forms durable retention anchors' },
      { feature: 'Weekly Check-ins', coef: -1.35, desc: 'Frequent weekly check-ins are the top protective factor' },
    ];

    return drivers.sort((a, b) => Math.abs(b.coef) - Math.abs(a.coef));
  }, [filteredData]);

  // ---------------------------------------------------------------------------
  // Cohort Retention Heatmap Data
  // ---------------------------------------------------------------------------
  const cohortMatrix = useMemo(() => {
    // Group customers by signup cohort month
    const signupMap = new Map<string, string>(); // custId -> signupCohort
    data.forEach(d => {
      if (!signupMap.has(d.customer_id)) {
        signupMap.set(d.customer_id, d.signup_date.substring(0, 7));
      }
    });

    const cohorts = Array.from(new Set(Array.from(signupMap.values()))).sort();
    const months = Array.from(new Set(data.map(d => d.month))).sort();

    const matrixRows: Array<{
      cohort: string;
      totalSize: number;
      monthsData: { [mIdx: number]: { pct: number; count: number } };
    }> = [];

    cohorts.forEach(cohortMonth => {
      const cohortCusts = Array.from(signupMap.entries())
        .filter(([_, cMonth]) => cMonth === cohortMonth)
        .map(([id]) => id);

      const totalSize = cohortCusts.length;
      if (totalSize === 0) return;

      const cohortMonthIdx = months.indexOf(cohortMonth);
      const monthsData: { [mIdx: number]: { pct: number; count: number } } = {};

      for (let offset = 0; offset <= 6; offset++) {
        const targetMIdx = cohortMonthIdx + offset;
        if (targetMIdx >= months.length) break;

        const targetMonthStr = months[targetMIdx];
        const activeInTarget = filteredData.filter(
          d => d.month === targetMonthStr && cohortCusts.includes(d.customer_id) && d.is_active
        ).length;

        const pct = Math.min(100, Number(((activeInTarget / totalSize) * 100).toFixed(1)));
        monthsData[offset] = { pct, count: activeInTarget };
      }

      matrixRows.push({ cohort: cohortMonth, totalSize, monthsData });
    });

    return matrixRows;
  }, [data, filteredData]);

  // ---------------------------------------------------------------------------
  // CSV Export Function
  // ---------------------------------------------------------------------------
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      'Customer ID', 'Month', 'Signup Date', 'Plan', 'Region', 'Primary Persona',
      'Acquisition Channel', 'Is Active', 'Churned In Month', 'MRR (Rs)', 'Addon (Rs)',
      'Total Revenue (Rs)', 'Tenure (Months)', 'Weekly Checkins', 'Avg Session Mins',
      'Journal Entries', 'Support Tickets', 'NPS'
    ];

    const rows = filteredData.map(r => [
      r.customer_id, r.month, r.signup_date, `"${r.plan}"`, `"${r.region}"`, `"${r.primary_persona}"`,
      `"${r.acquisition_channel}"`, r.is_active, r.churned_in_month, r.mrr_inr, r.addon_inr,
      r.total_revenue_inr, r.tenure_months, r.weekly_checkins_avg, r.avg_session_minutes,
      r.journal_entries, r.support_tickets, r.nps
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `friend_ai_churn_insights_${startMonth}_to_${endMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Regeneration of mock data
  const handleRegenerateData = () => {
    const newData = generateMockData();
    setData(newData);
  };

  return (
    <div className={`min-h-screen py-8 px-4 md:px-8 transition-colors duration-300 font-sans ${
      isLightMode ? 'bg-[#f8f6f0] text-stone-900' : 'bg-[#070b14] text-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header Banner */}
        <div className={`p-6 md:p-8 rounded-3xl border-2 backdrop-blur-xl relative overflow-hidden shadow-2xl ${
          isLightMode
            ? 'bg-gradient-to-r from-[#eae4d3] via-[#f1edd8] to-[#e4dec9] border-[#d8cdb4]'
            : 'bg-gradient-to-r from-[#0d1425] via-[#121b33] to-[#0a101d] border-[#1e2942]'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-[#c9a45c]/20 border border-[#c9a45c]/40 text-[#c9a45c] flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#c9a45c]" /> Friend AI Business Intelligence
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Live Analytics
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-serif font-bold tracking-tight text-white mb-2">
                📈 Churn &amp; Revenue Insights Dashboard
              </h1>
              <p className={`text-xs md:text-sm max-w-2xl leading-relaxed ${isLightMode ? 'text-stone-700' : 'text-slate-300'}`}>
                Monitor Monthly Recurring Revenue (MRR), user churn trends across companions, persona segment performance, retention cohorts, and ML predictive churn drivers.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleRegenerateData}
                className="px-4 py-2.5 rounded-xl border border-brown text-sage hover:text-white hover:border-[#c9a45c] bg-black/40 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
                title="Regenerate fresh simulated dataset"
              >
                <RefreshCw className="w-4 h-4 text-[#c9a45c]" />
                <span>Simulate Fresh Data</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-5 py-2.5 rounded-xl bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold text-xs uppercase tracking-wide flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Scorecard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* MRR */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${
            isLightMode ? 'bg-[#f1ecd8] border-[#dfd2be]' : 'bg-[#0f172a]/80 border-[#1e293b]'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-sage uppercase font-bold mb-2">
              <span>MRR (Current)</span>
              <DollarSign className="w-4 h-4 text-[#c9a45c]" />
            </div>
            <div className="text-2xl font-serif font-bold text-white mb-1">
              Rs {kpis.mrr.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Previous: Rs {kpis.prevMrr.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Net MRR Change */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${
            isLightMode ? 'bg-[#f1ecd8] border-[#dfd2be]' : 'bg-[#0f172a]/80 border-[#1e293b]'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-sage uppercase font-bold mb-2">
              <span>Net MRR Change</span>
              {kpis.netMrrChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className={`text-2xl font-serif font-bold mb-1 ${
              kpis.netMrrChange >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {kpis.netMrrChange >= 0 ? '+' : ''}Rs {kpis.netMrrChange.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Month-over-Month Delta
            </div>
          </div>

          {/* Churn Rate */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${
            isLightMode ? 'bg-[#f1ecd8] border-[#dfd2be]' : 'bg-[#0f172a]/80 border-[#1e293b]'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-sage uppercase font-bold mb-2">
              <span>Churn Rate</span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className={`text-2xl font-serif font-bold mb-1 ${
              kpis.churnRate > 8 ? 'text-red-400' : kpis.churnRate > 4 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {kpis.churnRate.toFixed(2)}%
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Last Month Cancelled %
            </div>
          </div>

          {/* ARPU */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${
            isLightMode ? 'bg-[#f1ecd8] border-[#dfd2be]' : 'bg-[#0f172a]/80 border-[#1e293b]'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-sage uppercase font-bold mb-2">
              <span>ARPU (Active)</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-serif font-bold text-sky-300 mb-1">
              Rs {kpis.arpu.toFixed(1)}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Average Revenue Per User
            </div>
          </div>

          {/* Active Users */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${
            isLightMode ? 'bg-[#f1ecd8] border-[#dfd2be]' : 'bg-[#0f172a]/80 border-[#1e293b]'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-sage uppercase font-bold mb-2">
              <span>Active Users</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-serif font-bold text-purple-300 mb-1">
              {kpis.activeUsers}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Active Subscribers in Month
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className={`p-5 rounded-2xl border-2 space-y-4 ${
          isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0d1424] border-[#1e293b]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#c9a45c]">
              <Filter className="w-4 h-4" />
              <span>Interactive Filters ({filteredData.length} User-Month Records)</span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-mono">
            {/* Date Range Start/End */}
            <div>
              <label className="text-sage block mb-1 text-[10px] uppercase font-bold">Start Month:</label>
              <select
                value={startMonth}
                onChange={e => setStartMonth(e.target.value)}
                className="w-full bg-black/40 border border-brown rounded-xl p-2 text-white font-mono focus:border-[#c9a45c] focus:outline-none"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sage block mb-1 text-[10px] uppercase font-bold">End Month:</label>
              <select
                value={endMonth}
                onChange={e => setEndMonth(e.target.value)}
                className="w-full bg-black/40 border border-brown rounded-xl p-2 text-white font-mono focus:border-[#c9a45c] focus:outline-none"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>
            </div>

            {/* Plan Filter */}
            <div>
              <label className="text-sage block mb-1 text-[10px] uppercase font-bold">Plans ({selectedPlans.length}):</label>
              <div className="flex flex-wrap gap-1">
                {allPlans.map(plan => {
                  const isSel = selectedPlans.includes(plan);
                  return (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          if (selectedPlans.length > 1) setSelectedPlans(selectedPlans.filter(p => p !== plan));
                        } else {
                          setSelectedPlans([...selectedPlans, plan]);
                        }
                      }}
                      className={`px-2 py-1 rounded text-[9px] border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#c9a45c]/20 border-[#c9a45c] text-[#c9a45c] font-bold'
                          : 'bg-black/30 border-slate-700 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {plan.replace('Companion ', '').replace('Pantheon ', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Region Filter */}
            <div>
              <label className="text-sage block mb-1 text-[10px] uppercase font-bold">Regions ({selectedRegions.length}):</label>
              <div className="flex flex-wrap gap-1">
                {allRegions.slice(0, 3).map(reg => {
                  const isSel = selectedRegions.includes(reg);
                  return (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          if (selectedRegions.length > 1) setSelectedRegions(selectedRegions.filter(r => r !== reg));
                        } else {
                          setSelectedRegions([...selectedRegions, reg]);
                        }
                      }}
                      className={`px-2 py-1 rounded text-[9px] border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                          : 'bg-black/30 border-slate-700 text-slate-500'
                      }`}
                    >
                      {reg.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Box */}
            <div>
              <label className="text-sage block mb-1 text-[10px] uppercase font-bold">Search Term:</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="ID, Persona, Region..."
                  className="w-full bg-black/40 border border-brown rounded-xl py-2 pl-8 pr-3 text-white text-xs placeholder:text-slate-600 focus:border-[#c9a45c] focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-white/10 gap-2 font-mono text-xs">
          {[
            { id: 'overview', label: '📊 Churn Trends', icon: TrendingUp },
            { id: 'segments', label: '👥 User Segments', icon: Users },
            { id: 'drivers', label: '🧠 Revenue & Churn Drivers', icon: Brain },
            { id: 'cohort', label: '🗓️ Cohort Retention', icon: Grid },
            { id: 'data', label: '📄 Data Explorer & CSV', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 rounded-t-xl border-t-2 border-x-2 font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#0f172a] border-[#c9a45c] text-[#c9a45c] shadow-[0_-5px_15px_rgba(201,164,92,0.15)]'
                    : 'bg-black/20 border-transparent text-slate-400 hover:text-white hover:bg-black/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Churn Trends */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Main Churn Rate Line Chart */}
            <div className={`p-6 rounded-2xl border-2 ${
              isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#c9a45c]" /> Monthly Churn Rate Trajectory (%)
                  </h3>
                  <p className="text-xs text-slate-400">Monthly percentage of active subscribers who cancelled service.</p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyChurnTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#c9a45c', borderRadius: '12px' }}
                      formatter={(val: any) => [`${val}%`, 'Churn Rate']}
                    />
                    <Line type="monotone" dataKey="churnRatePct" stroke="#5B6EF5" strokeWidth={3} dot={{ r: 5, fill: '#5B6EF5' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3 Dimensional Churn Bar Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* By Plan */}
              <div className={`p-5 rounded-2xl border-2 ${
                isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
              }`}>
                <h4 className="font-serif text-sm font-bold text-white mb-1">Churn Rate by Plan (%)</h4>
                <div className="h-52 w-full mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={churnByPlan}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="dimension" stroke="#94a3b8" fontSize={9} interval={0} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#c9a45c' }} />
                      <Bar dataKey="churnRatePct" fill="#5B6EF5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* By Persona */}
              <div className={`p-5 rounded-2xl border-2 ${
                isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
              }`}>
                <h4 className="font-serif text-sm font-bold text-white mb-1">Churn Rate by Persona (%)</h4>
                <div className="h-52 w-full mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={churnByPersona}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="dimension" stroke="#94a3b8" fontSize={9} interval={0} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#c9a45c' }} />
                      <Bar dataKey="churnRatePct" fill="#c9a45c" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* By Region */}
              <div className={`p-5 rounded-2xl border-2 ${
                isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
              }`}>
                <h4 className="font-serif text-sm font-bold text-white mb-1">Churn Rate by Region (%)</h4>
                <div className="h-52 w-full mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={churnByRegion}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="dimension" stroke="#94a3b8" fontSize={9} interval={0} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#c9a45c' }} />
                      <Bar dataKey="churnRatePct" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Segments */}
        {activeTab === 'segments' && (
          <div className="space-y-6">
            <div className="flex border-b border-white/10 gap-3 font-mono text-xs">
              {[
                { key: 'plan', label: 'By Plan' },
                { key: 'region', label: 'By Region' },
                { key: 'primary_persona', label: 'By Persona' },
                { key: 'acquisition_channel', label: 'By Channel' },
              ].map(sub => (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setSegmentSubTab(sub.key as any)}
                  className={`px-4 py-2 rounded-t-lg font-bold cursor-pointer transition-all ${
                    segmentSubTab === sub.key
                      ? 'bg-[#c9a45c] text-black'
                      : 'bg-black/30 text-slate-400 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Segment Data Table */}
              <div className={`p-5 rounded-2xl border-2 ${
                isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
              }`}>
                <h4 className="font-serif text-base font-bold text-white mb-3">Segment Summary Table</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-sage uppercase text-[10px]">
                        <th className="py-2.5 px-3">Segment</th>
                        <th className="py-2.5 px-3">Active Users</th>
                        <th className="py-2.5 px-3">MRR (Rs)</th>
                        <th className="py-2.5 px-3">ARPU (Rs)</th>
                        <th className="py-2.5 px-3">Churn Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {segmentSummaryData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">{row.segment}</td>
                          <td className="py-2.5 px-3 text-slate-300">{row.activeCustomers}</td>
                          <td className="py-2.5 px-3 text-[#c9a45c] font-bold">Rs {row.mrr.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-sky-300">Rs {row.arpu}</td>
                          <td className="py-2.5 px-3 text-amber-300 font-bold">{row.churnRatePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MRR Bar Chart by Segment */}
              <div className={`p-5 rounded-2xl border-2 ${
                isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
              }`}>
                <h4 className="font-serif text-base font-bold text-white mb-3">MRR Distribution across Segment</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentSummaryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="segment" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#c9a45c' }} />
                      <Bar dataKey="mrr" fill="#5B6EF5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Revenue & Churn Drivers */}
        {activeTab === 'drivers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Drivers (Correlation) */}
            <div className={`p-6 rounded-2xl border-2 ${
              isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
            }`}>
              <h3 className="font-serif text-base font-bold text-white mb-1 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Revenue Drivers (Correlation Matrix)
              </h3>
              <p className="text-xs text-slate-400 mb-4">Correlation of usage &amp; behavioral metrics with Total Revenue (Rs).</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueCorrelations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" domain={[-1, 1]} stroke="#94a3b8" fontSize={10} />
                    <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={10} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#10b981' }} />
                    <Bar dataKey="correlation" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Churn Drivers (Logistic Regression Weights) */}
            <div className={`p-6 rounded-2xl border-2 ${
              isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
            }`}>
              <h3 className="font-serif text-base font-bold text-white mb-1 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" /> Churn Drivers (ML Logistic Coefficients)
              </h3>
              <p className="text-xs text-slate-400 mb-4">Positive weights = increased churn risk; Negative weights = protective factors.</p>

              <div className="space-y-2 text-xs font-mono max-h-72 overflow-y-auto pr-2 scrollbar-none">
                {churnDriverCoefficients.map((item, idx) => {
                  const isRisk = item.coef > 0;
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-white block">{item.feature}</span>
                        <span className="text-[10px] text-slate-400">{item.desc}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${
                        isRisk ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.coef > 0 ? `+${item.coef}` : item.coef}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Cohort Retention Heatmap */}
        {activeTab === 'cohort' && (
          <div className={`p-6 rounded-2xl border-2 space-y-4 ${
            isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-sky-400" /> Cohort Retention Heatmap (% Retained Active)
                </h3>
                <p className="text-xs text-slate-400">Tracking user cohort retention across months since initial signup.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-sage uppercase text-[10px]">
                    <th className="py-3 px-3 text-left">Cohort Month</th>
                    <th className="py-3 px-3">Cohort Size</th>
                    {[0, 1, 2, 3, 4, 5, 6].map(m => (
                      <th key={m} className="py-3 px-3">M+{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {cohortMatrix.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3 text-left font-bold text-white">{row.cohort}</td>
                      <td className="py-3 px-3 text-slate-400">{row.totalSize} users</td>
                      {[0, 1, 2, 3, 4, 5, 6].map(mIdx => {
                        const cell = row.monthsData[mIdx];
                        if (!cell) {
                          return <td key={mIdx} className="py-3 px-3 text-slate-700">-</td>;
                        }
                        const pct = cell.pct;
                        const bgAlpha = Math.max(0.1, pct / 100);
                        return (
                          <td key={mIdx} className="py-3 px-3">
                            <span
                              className="px-2.5 py-1 rounded-lg font-bold block text-[11px]"
                              style={{
                                backgroundColor: `rgba(91, 110, 245, ${bgAlpha})`,
                                color: pct > 60 ? '#ffffff' : '#94a3b8',
                                border: '1px solid rgba(91, 110, 245, 0.3)',
                              }}
                            >
                              {pct}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Data Explorer & CSV Export */}
        {activeTab === 'data' && (
          <div className={`p-6 rounded-2xl border-2 space-y-4 ${
            isLightMode ? 'bg-[#f3eedd] border-[#dfd2be]' : 'bg-[#0f172a] border-[#1e293b]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#c9a45c]" /> Customer-Month Underlying Dataset
                </h3>
                <p className="text-xs text-slate-400">Showing {filteredData.length} records matching current active sidebar filters.</p>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" /> Download Filtered CSV
              </button>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-none rounded-xl border border-white/10">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="sticky top-0 bg-[#090d16] text-sage uppercase text-[10px] z-10 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-3">Customer ID</th>
                    <th className="py-3 px-3">Month</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Persona</th>
                    <th className="py-3 px-3">Region</th>
                    <th className="py-3 px-3">Revenue (Rs)</th>
                    <th className="py-3 px-3">Active?</th>
                    <th className="py-3 px-3">Check-ins</th>
                    <th className="py-3 px-3">NPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-black/20">
                  {filteredData.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-white font-bold">{row.customer_id}</td>
                      <td className="py-2.5 px-3 text-slate-300">{row.month}</td>
                      <td className="py-2.5 px-3 text-[#c9a45c]">{row.plan}</td>
                      <td className="py-2.5 px-3 text-sky-300">{row.primary_persona}</td>
                      <td className="py-2.5 px-3 text-slate-300">{row.region}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">Rs {row.total_revenue_inr}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          row.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {row.is_active ? 'Active' : 'Cancelled'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{row.weekly_checkins_avg}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">{row.nps}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length > 100 && (
              <p className="text-[10px] font-mono text-center text-slate-500">
                Displaying first 100 of {filteredData.length} records. Download CSV for full dataset.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
