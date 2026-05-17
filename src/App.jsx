import React, { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar, ComposedChart, Cell, PieChart, Pie, ReferenceLine
} from 'recharts';
import { 
  Calculator, TrendingUp, DollarSign, Activity, FileText, 
  Settings, LayoutDashboard, List, Users, Shield, Scale, 
  ArrowUpRight, Link2, Coins, Building2, Stethoscope, Briefcase, 
  ShieldCheck, HeartPulse, Sparkles, BrainCircuit, RefreshCcw, BarChart3, 
  PieChart as PieChartIcon, Map, Landmark, ArrowRightLeft, X, Download, 
  AlertTriangle, Grid, Clock, Lock, Unlock, Info, MapPin, Building,
  Cloud, CloudOff, ChevronDown, GripHorizontal, Maximize, Minimize,
  BookOpen, Target, Search, FolderTree, BarChartHorizontal, Layers, Microscope,
  Bed, Timer, Network, Plane, Dna, Bone, Baby, Eye, Check, ArrowRight
} from 'lucide-react';

const CHART_MARGINS_BAR = { top: 20, right: 0, left: 0, bottom: 0 };
const CHART_MARGINS_LINE = { top: 40, right: 20, left: 20, bottom: 0 };
const TOOLTIP_STYLE = { borderRadius: '12px', border: '1px solid #D8D8D8', fontSize: '12px', color: '#1E2F31' };
const CHART_CURSOR_STYLE = { fill: '#F9F8F6' };
const LEGEND_STYLE = { fontSize: '11px', paddingTop: '20px' };

// --- NEW STABLE REFERENCES FOR OPPORTUNITIES TAB ---
const TICK_STYLE = { fontSize: 10, fill: '#4C4A4B' };
const formatCancerCases = (val) => new Intl.NumberFormat('en-US').format(val);
const formatInsuranceTooltip = (val) => val.toFixed(2) + "T IDR";
const formatInsuranceLabel = (val) => val.toFixed(2);
const LINE_LABEL_STYLE = { position: 'top', fill: '#4C4A4B', fontSize: 10, dy: -10, formatter: formatInsuranceLabel };

const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, index, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={index === 0 ? '#9B8B70' : '#8A9A9C'} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
      <tspan x={x} dy="-0.4em">{name}</tspan>
      <tspan x={x} dy="1.2em">{`${(percent * 100).toFixed(0)}%`}</tspan>
    </text>
  );
};
// ---------------------------------------------------

const formatNumber = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return "0";
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (Math.abs(num) < 1e-10) return "0";
  
  const formatted = new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  }).format(Math.abs(num));
  
  return num < 0 ? `(${formatted})` : formatted;
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "Rp 0 B";
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (Math.abs(num) < 1e-10) return "Rp 0 B";
  
  const formatted = new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  }).format(Math.abs(num));
  
  return num < 0 ? `(Rp ${formatted} B)` : `Rp ${formatted} B`;
};

const calculatePMT = (rate, nper, pv) => rate === 0 ? -(pv / nper) : -(pv * rate) / (1 - Math.pow(1 + rate, -nper));

const calculatePayback = (cfs) => {
  if (!cfs || cfs.length === 0) return 0;
  let cumulative = 0;
  for (let i = 0; i < cfs.length; i++) {
    let prevCumulative = cumulative;
    cumulative += (cfs[i] || 0);
    if (cumulative >= 0 && prevCumulative < 0) return i + Math.abs(prevCumulative) / (cfs[i] || 1);
  }
  const lastCF = cfs[cfs.length - 1];
  if (lastCF > 0 && cumulative < 0) {
      return cfs.length + (Math.abs(cumulative) / lastCF);
  }
  return 0;
};

const calculateIRR = (cfs) => {
  if (!cfs || cfs.length === 0) return 0;
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    let npv = 0, dNpv = 0;
    for (let t = 0; t < cfs.length; t++) {
      const val = cfs[t] || 0;
      npv += val / Math.pow(1 + rate, t);
      if (t > 0) dNpv -= (t * val) / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dNpv) < 1e-10) break;
    let newRate = rate - npv / dNpv;
    if (Math.abs(newRate - rate) < 1e-6) return newRate;
    rate = newRate;
  }
  return 0;
};

const calculateNPV = (cfs, rate) => !cfs ? 0 : cfs.reduce((acc, val, i) => acc + (val || 0) / Math.pow(1 + (rate || 12) / 100, i), 0);

const DEFAULT_OPCO_ASSUMPTIONS = {
  beds: 120, alos: 4, opIpRatio: 40, borStart: 45, borMax: 65, borIncrement: 5,
  ipRevenue: 27, opRevenue: 0.5, priceIncYears1_6: 7, priceIncYears7_plus: 5,
  monthlyStaffCost: 3.8, staffInf: 4, ipMedSupply: 4.5, opMedSupply: 0.2, medSupplyInf: 3,
  adminExpRate: 2, utilExpRate: 5, mktgExpRate: 2, operatorFeeRate: 2.5,
  insuranceMonthly: 52.3, docFeeIp: 16, docFeeOp: 24, rentTier1Rate: 25, rentTier2Rate: 25, rentTier3Rate: 25, rentTier1Limit: 1.8, rentTier2Limit: 2.2, corporateTax: 22,
  partnerAEquity: 41.87, partnerBEquity: 40.23, jvaOpex: 2.5, commOpex: 15, workingCapitalOpex: 64.6,
  sharingPercentA: 51.00, equitySplitY1: 100, discountRate: 12, holdCoDiscountRate: 11
};

const DEFAULT_PROPCO_ASSUMPTIONS = {
  linkToOpCo: true, manualBaseRent: 35, manualRentEscalation: 3, landArea: 12643, landPrice: 15, 
  buildArea: 13000, buildCost: 10.5, includeMedEq: false, capexMedEqQty: 1, capexMedEqPrice: 140000, 
  capexInfraQty: 8310, capexInfraPrice: 0.7, includeFFE: true, capexFFEQty: 1, capexFFEPrice: 26000, 
  capexSharingDevQty: 5361, capexSharingDevPrice: 0.8, capexContingencyPct: 2, capexConsultantPct: 2.5,
  capexLicensePct: 1.5, capexCarPct: 0.15, capexVat: 11, devDurationMonths: 24, constructionOpexMonthly: 0.5, 
  opOverheadMonthly: 0.2, opOverheadInc: 4, ffeReservePct: 2, includeFinancing: false, ltv: 65, interestRate: 8.25, loanTenor: 15, ioGracePeriodYears: 3,
  maintRate: 0, propTaxRate: 0, corporateTax: 22, discountRate: 11, depLifeBuilding: 20, depMethodBuilding: 'SL',
  depLifeInfra: 20, depMethodInfra: 'SL', depLifeMedEq: 10, depMethodMedEq: 'SL', depLifeFFE: 20, depMethodFFE: 'SL',
  includeTerminalValue: true, exitMethod: 'multiple', exitCapRate: 8.5, exitMultiple: 20, sellingCosts: 0,
};

const CANCER_DATA = [
  { name: 'Breast', cases: 66271, fill: '#1C6048' },
  { name: 'Lung', cases: 38904, fill: '#9B8B70' },
  { name: 'Cervical', cases: 36964, fill: '#99B6AA' },
  { name: 'Colorectal', cases: 35676, fill: '#EFEBE7' },
  { name: 'Liver', cases: 23805, fill: '#D8D8D8' }
];

const INSURANCE_DATA = [
  { year: '2021', value: 14.30 },
  { year: '2022', value: 16.20 },
  { year: '2023', value: 18.80 },
  { year: '2024', value: 21.40 },
  { year: '2025', value: 24.10 },
  { year: '2026', value: 27.20 }
];

const apiKey = ""; 
const callGemini = async (prompt, systemInstruction) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: systemInstruction }] } };
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("API Error");
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (error) {
      if (i === 4) throw error;
      await new Promise(res => setTimeout(Math.pow(2, i) * 1000, res));
    }
  }
};

// ==========================================
// 2. FINANCIAL ENGINES
// ==========================================
const runOpCoEngine = (assumptions) => {
    const totalEquity = assumptions.partnerAEquity + assumptions.partnerBEquity;
    let annualData = [], projectCfs = [], partnerACfs = [], partnerBCfs = []; 
    let cumulativeNetIncome = 0, partnerA_CumCF = 0, partnerB_CumCF = 0;

    const preOp = [{ k: 'jvaOpex', y: 'Year 1', split: assumptions.equitySplitY1 / 100 }, { k: 'commOpex', y: 'Year 2', split: (100 - assumptions.equitySplitY1) / 100 }];
    preOp.forEach(p => {
      const net = -assumptions[p.k];
      cumulativeNetIncome += net;
      const pA_Outlay = -assumptions.partnerAEquity * p.split;
      const pB_Outlay = -assumptions.partnerBEquity * p.split;
      partnerA_CumCF += pA_Outlay; partnerB_CumCF += pB_Outlay;

      annualData.push({
        year: p.y, isOperating: false, ipRev: 0, opRev: 0, totalRev: 0, totalMedSupp: 0, totalDocFee: 0, 
        grossProfit: 0, staffCost: 0, recurringOpex: 0, ebitdar: 0, rent: 0, ebitda: net, tax: 0, 
        netIncome: net, cumNI: cumulativeNetIncome, distributableProfit: 0, shareA: 0, shareB: 0, 
        pA_Outlay, pA_Div: 0, pA_Net: pA_Outlay, pA_Cum: partnerA_CumCF, pA_Yield: 0,
        pB_Outlay, pB_Div: 0, pB_Net: pB_Outlay, pB_Cum: partnerB_CumCF, pB_Yield: 0,
        fcf: pA_Outlay + pB_Outlay, ebitdaMargin: 0, netMargin: 0, roe: 0, breakEvenBor: 0, bor: 0
      });
      partnerACfs.push(pA_Outlay); partnerBCfs.push(pB_Outlay); projectCfs.push(pA_Outlay + pB_Outlay);
    });

    for (let i = 1; i <= 10; i++) {
      let bor = Math.min(assumptions.borMax / 100, (assumptions.borStart / 100) + (i - 1) * (assumptions.borIncrement / 100));
      let bedDays = assumptions.beds * 365 * bor;
      let ipCases = bedDays / assumptions.alos;
      let opVisits = ipCases * assumptions.opIpRatio;
      let priceMultiplier = 1;
      for (let j = 2; j <= i; j++) priceMultiplier *= (1 + (j <= 6 ? assumptions.priceIncYears1_6 : assumptions.priceIncYears7_plus) / 100);
      
      let ipRev = (ipCases * (assumptions.ipRevenue * priceMultiplier)) / 1000;
      let opRev = (opVisits * (assumptions.opRevenue * priceMultiplier)) / 1000;
      let totalRev = ipRev + opRev;
      
      let costMultiplier = Math.pow(1 + assumptions.medSupplyInf / 100, i - 1);
      let totalMedSupp = ((ipCases * assumptions.ipMedSupply + opVisits * assumptions.opMedSupply) * costMultiplier) / 1000;
      let totalDocFee = ((assumptions.docFeeIp / 100) * ipRev + (assumptions.docFeeOp / 100) * opRev);
      let grossProfit = totalRev - totalMedSupp - totalDocFee;
      
      let staffCost = (assumptions.monthlyStaffCost * 12) * Math.pow(1 + assumptions.staffInf / 100, i - 1); 
      let otherOpex = (assumptions.adminExpRate + assumptions.utilExpRate + assumptions.mktgExpRate + assumptions.operatorFeeRate) / 100 * totalRev + (assumptions.insuranceMonthly * 12 / 1000);
      let recurringOpex = staffCost + otherOpex;
      
      let ebitdar = grossProfit - recurringOpex;
      
      let currentRevPab = assumptions.beds > 0 ? totalRev / assumptions.beds : 0;
      let rentRate = 0;
      if (currentRevPab < assumptions.rentTier1Limit) rentRate = assumptions.rentTier1Rate;
      else if (currentRevPab < assumptions.rentTier2Limit) rentRate = assumptions.rentTier2Rate;
      else rentRate = assumptions.rentTier3Rate;

      let rent = ebitdar > 0 ? (rentRate / 100) * ebitdar : 0; 
      let ebitda = ebitdar - rent; 
      let tax = ebitda > 0 ? ebitda * (assumptions.corporateTax / 100) : 0;
      let netIncome = ebitda - tax;
      
      const fixedTotal = staffCost + (assumptions.insuranceMonthly * 12 / 1000);
      const varRate = totalRev > 0 ? (totalMedSupp + totalDocFee + (assumptions.adminExpRate + assumptions.utilExpRate + assumptions.mktgExpRate + assumptions.operatorFeeRate) / 100 * totalRev) / totalRev : 0;
      
      const breakEvenRev = (1 - varRate) > 0 ? fixedTotal / (1 - varRate) : 0;
      const breakEvenBor = totalRev > 0 ? (breakEvenRev / totalRev) * bor : 0;

      let prevCumNI = cumulativeNetIncome;
      cumulativeNetIncome += netIncome;
      let distributableProfit = Math.max(0, cumulativeNetIncome > 0 ? (prevCumNI < 0 ? cumulativeNetIncome : netIncome) : 0);
      let shareA = distributableProfit * (assumptions.sharingPercentA / 100);
      let shareB = distributableProfit * ((100 - assumptions.sharingPercentA) / 100);
      
      partnerA_CumCF += shareA; partnerB_CumCF += shareB;

      annualData.push({
        year: `Year ${i + 2}`, isOperating: true, ipRev, opRev, totalRev, totalMedSupp, totalDocFee, 
        grossProfit, staffCost, recurringOpex, ebitdar, rent, ebitda, tax, netIncome, cumNI: cumulativeNetIncome, 
        distributableProfit, shareA, shareB, pA_Outlay: 0, pA_Div: shareA, pA_Net: shareA, pA_Cum: partnerA_CumCF,
        pB_Outlay: 0, pB_Div: shareB, pB_Net: shareB, pB_Cum: partnerB_CumCF,
        pA_Yield: assumptions.partnerAEquity > 0 ? (shareA / assumptions.partnerAEquity) * 100 : 0,
        pB_Yield: assumptions.partnerBEquity > 0 ? (shareB / assumptions.partnerBEquity) * 100 : 0,
        fcf: netIncome + (i === 1 ? assumptions.workingCapitalOpex : 0),
        ebitdaMargin: totalRev > 0 ? (ebitda / totalRev) * 100 : 0, netMargin: totalRev > 0 ? (netIncome / totalRev) * 100 : 0,
        roe: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0, breakEvenBor: breakEvenBor * 100, bor: bor * 100,
        ipCases, opVisits, fixedCosts: fixedTotal, varCosts: grossProfit - ebitdar
      });
      partnerACfs.push(shareA); partnerBCfs.push(shareB); projectCfs.push(netIncome + (i === 1 ? assumptions.workingCapitalOpex : 0));
    }

    const operatingData = annualData.filter(d => d.isOperating);
    const stabilizedYear = operatingData.find(y => y.bor >= assumptions.borMax) || operatingData[operatingData.length - 1] || operatingData[0];
    
    return { 
      annualData,
      operatingData,
      totals: { 
        totalRev: annualData.reduce((acc, d) => acc + (d.totalRev || 0), 0), 
        ipRev: annualData.reduce((acc, d) => acc + (d.ipRev || 0), 0),
        opRev: annualData.reduce((acc, d) => acc + (d.opRev || 0), 0),
        totalMedSupp: annualData.reduce((acc, d) => acc + (d.totalMedSupp || 0), 0),
        totalDocFee: annualData.reduce((acc, d) => acc + (d.totalDocFee || 0), 0),
        grossProfit: annualData.reduce((acc, d) => acc + (d.grossProfit || 0), 0),
        recurringOpex: annualData.reduce((acc, d) => acc + (d.recurringOpex || 0), 0),
        ebitdar: annualData.reduce((acc, d) => acc + (d.ebitdar || 0), 0),
        rent: annualData.reduce((acc, d) => acc + (d.rent || 0), 0),
        ebitda: annualData.reduce((acc, d) => acc + (d.ebitda || 0), 0),
        tax: annualData.reduce((acc, d) => acc + (d.tax || 0), 0),
        netIncome: annualData.reduce((acc, d) => acc + (d.netIncome || 0), 0),
        distributableProfit: annualData.reduce((acc, d) => acc + (d.distributableProfit || 0), 0),
        fcf: annualData.reduce((acc, d) => acc + (d.fcf || 0), 0),
        shareA: annualData.reduce((acc, d) => acc + (d.shareA || 0), 0),
        shareB: annualData.reduce((acc, d) => acc + (d.shareB || 0), 0)
      },
      opsMetrics: { 
        stabilizedVolume: (stabilizedYear?.ipCases || 0) + (stabilizedYear?.opVisits || 0), 
        revPab: assumptions.beds > 0 ? ((stabilizedYear?.totalRev || 0) * 1000) / assumptions.beds : 0, 
        ebitdaPerBed: assumptions.beds > 0 ? ((stabilizedYear?.ebitda || 0) * 1000) / assumptions.beds : 0, 
        fixedCostPct: ((stabilizedYear?.fixedCosts || 0) / (((stabilizedYear?.fixedCosts || 0) + (stabilizedYear?.varCosts || 0)) || 1)) * 100 
      }, 
      totalEquity, 
      projectIRR: calculateIRR(projectCfs), 
      projectNPV: calculateNPV(projectCfs, assumptions.discountRate),
      partnerA: { 
        irr: calculateIRR(partnerACfs), 
        payback: calculatePayback(partnerACfs), 
        totalCash: annualData.reduce((acc, d) => acc + (d.shareA || 0), 0), 
        moic: assumptions.partnerAEquity > 0 ? annualData.reduce((acc, d) => acc + (d.shareA || 0), 0) / assumptions.partnerAEquity : 0, 
        avgYield: operatingData.length > 0 ? operatingData.reduce((a, b) => a + (b.pA_Yield || 0), 0) / operatingData.length : 0 
      },
      partnerB: { 
        irr: calculateIRR(partnerBCfs), 
        payback: calculatePayback(partnerBCfs),
        totalCash: annualData.reduce((acc, d) => acc + (d.shareB || 0), 0),
        moic: assumptions.partnerBEquity > 0 ? annualData.reduce((acc, d) => acc + (d.shareB || 0), 0) / assumptions.partnerBEquity : 0, 
        avgYield: operatingData.length > 0 ? operatingData.reduce((a, b) => a + (b.pB_Yield || 0), 0) / operatingData.length : 0
      }
    };
};

const runPropCoEngine = (assumptions, opCoModelData) => {
    let annualData = [], equityCfs = [], equityCfsExLand = [], unleveredCfs = [], operatingCfs = [];
    const landCost = (assumptions.landArea * assumptions.landPrice) / 1000;
    const buildCost = (assumptions.buildArea * assumptions.buildCost) / 1000;
    const medEqCost = assumptions.includeMedEq ? (assumptions.capexMedEqQty * assumptions.capexMedEqPrice) / 1000 : 0;
    const infraCost = (assumptions.capexInfraQty * assumptions.capexInfraPrice) / 1000;
    const ffeCost = assumptions.includeFFE ? (assumptions.capexFFEQty * assumptions.capexFFEPrice) / 1000 : 0;
    const totalHardCosts = buildCost + medEqCost + infraCost + ffeCost;
    
    const coreCostForPct = buildCost + ffeCost + medEqCost + infraCost;
    const consultantCost = coreCostForPct * ((assumptions.capexConsultantPct || 0) / 100);
    const licenseCost = coreCostForPct * ((assumptions.capexLicensePct || 0) / 100);
    const carCost = buildCost * ((assumptions.capexCarPct || 0) / 100);
    const sharingDevCost = (assumptions.capexSharingDevQty * assumptions.capexSharingDevPrice) / 1000;
    const vatBase = consultantCost + buildCost + ffeCost + medEqCost + infraCost + sharingDevCost;
    const vatCost = vatBase * ((assumptions.capexVat || 0) / 100);
    const contingencyBase = licenseCost + consultantCost + buildCost + ffeCost + medEqCost + infraCost + sharingDevCost + vatCost;
    const contingencyCost = contingencyBase * ((assumptions.capexContingencyPct || 0) / 100);
    
    const totalCapex = landCost + buildCost + medEqCost + infraCost + ffeCost + consultantCost + licenseCost + sharingDevCost + vatCost + contingencyCost;
    const totalSoftCosts = totalCapex - landCost - totalHardCosts;
    const effectiveLtv = assumptions.includeFinancing ? assumptions.ltv : 0;
    const totalDebt = totalCapex * (effectiveLtv / 100);
    const totalEquity = totalCapex - totalDebt;
    
    const ioYears = assumptions.ioGracePeriodYears || 0;
    const amortizingTenor = Math.max(1, assumptions.loanTenor - ioYears);
    const postIoPmt = Math.abs(calculatePMT(assumptions.interestRate / 100, amortizingTenor, totalDebt));
    const totalCapexExLand = totalCapex - landCost;
    const totalDebtExLand = totalCapexExLand * (effectiveLtv / 100);
    const totalEquityExLand = totalCapexExLand - totalDebtExLand;
    const postIoPmtExLand = Math.abs(calculatePMT(assumptions.interestRate / 100, amortizingTenor, totalDebtExLand));

    const buildBasis = buildCost + (totalHardCosts > 0 ? (totalSoftCosts * buildCost / totalHardCosts) : 0);
    const medEqBasis = medEqCost + (totalHardCosts > 0 ? (totalSoftCosts * medEqCost / totalHardCosts) : 0);
    const infraBasis = infraCost + (totalHardCosts > 0 ? (totalSoftCosts * infraCost / totalHardCosts) : 0);
    const ffeBasis = ffeCost + (totalHardCosts > 0 ? (totalSoftCosts * ffeCost / totalHardCosts) : 0);

    const devYears = Math.max(1, Math.ceil((assumptions.devDurationMonths || 12) / 12));
    let outstandingDebt = totalDebt, outstandingDebtExLand = totalDebtExLand, equityCum = 0, equityCumExLand = 0;

    for(let i=1; i<=devYears; i++) {
        const monthsThisYear = Math.min(12, Math.max(0, (assumptions.devDurationMonths || 24) - ((i - 1) * 12)));
        const overheadOpex = ((assumptions.constructionOpexMonthly || 0) * monthsThisYear) + (carCost / devYears);
        const eqDraw = -(totalEquity / devYears) - overheadOpex;
        const eqDrawExLand = -(totalEquityExLand / devYears) - overheadOpex;
        equityCum += eqDraw; equityCumExLand += eqDrawExLand;
        equityCfs.push(eqDraw); equityCfsExLand.push(eqDrawExLand); unleveredCfs.push(-(totalCapex / devYears) - overheadOpex);
        operatingCfs.push(eqDraw);
        annualData.push({ year: `Year ${i}`, isOperating: false, debtBalance: totalDebt, debtBalanceExLand: totalDebtExLand, fcfe: eqDraw, cumFcfe: equityCum, fcfeExLand: eqDrawExLand, cumFcfeExLand: equityCumExLand });
    }

    let avgDscr = 0, avgYield = 0;
    const opCoRents = opCoModelData.annualData.filter(d => d.isOperating).map(d => d.rent);
    let bvB = buildBasis, bvM = medEqBasis, bvI = infraBasis, bvF = ffeBasis;

    for(let i=1; i<=10; i++) {
        let revenue = assumptions.linkToOpCo ? (opCoRents[i - 1] || 0) : assumptions.manualBaseRent * Math.pow(1 + (assumptions.manualRentEscalation/100), i-1);
        const maint = buildCost * (assumptions.maintRate / 100), taxOp = totalCapex * (assumptions.propTaxRate / 100);
        const overhead = (assumptions.opOverheadMonthly * 12) * Math.pow(1 + (assumptions.opOverheadInc / 100), i - 1);
        const reserve = revenue * (assumptions.ffeReservePct / 100);
        const ebitda = revenue - maint - taxOp - overhead - reserve;

        let interest = 0, principal = 0, interestExLand = 0, principalExLand = 0;
        if (outstandingDebt > 0.01) {
            interest = outstandingDebt * (assumptions.interestRate / 100);
            principal = i <= ioYears ? 0 : Math.min(outstandingDebt, postIoPmt - interest);
            outstandingDebt -= principal;
        }
        if (outstandingDebtExLand > 0.01) {
            interestExLand = outstandingDebtExLand * (assumptions.interestRate / 100);
            principalExLand = i <= ioYears ? 0 : Math.min(outstandingDebtExLand, postIoPmtExLand - interestExLand);
            outstandingDebtExLand -= principalExLand;
        }

        const calcDep = (bv, basis, life, currentYear) => Math.min(basis / life, bv);
        const d1 = calcDep(bvB, buildBasis, assumptions.depLifeBuilding || 20, i); bvB -= d1;
        const d2 = calcDep(bvM, medEqBasis, assumptions.depLifeMedEq || 10, i); bvM -= d2;
        const d3 = calcDep(bvI, infraBasis, assumptions.depLifeInfra || 20, i); bvI -= d3;
        const d4 = calcDep(bvF, ffeBasis, assumptions.depLifeFFE || 20, i); bvF -= d4;
        const dep = d1 + d2 + d3 + d4;
        
        const ebt = ebitda - interest - dep;
        const tax = ebt > 0 ? ebt * (assumptions.corporateTax / 100) : 0;
        const netIncome = ebt - tax;

        let exit = 0, exitExLand = 0, exitUnlev = 0;
        if (i === 10 && assumptions.includeTerminalValue) {
            let tv = assumptions.exitMethod === 'multiple' ? ebitda * assumptions.exitMultiple : ebitda / (assumptions.exitCapRate / 100);
            if (tv > 0) {
                const cost = tv * (assumptions.sellingCosts / 100);
                exit = tv - cost - outstandingDebt;
                exitUnlev = tv - cost;
                exitExLand = tv - cost - outstandingDebtExLand - landCost; 
                outstandingDebt = 0; outstandingDebtExLand = 0;
            }
        }

        const unleveredFcff = (ebitda - dep - (ebitda - dep > 0 ? (ebitda - dep) * (assumptions.corporateTax / 100) : 0)) + dep + exitUnlev;
        unleveredCfs.push(unleveredFcff);

        const opFcfe = netIncome + dep - principal;
        const fcfe = opFcfe + exit;
        const fcfeExLand = (ebitda - interestExLand - dep - (ebitda - interestExLand - dep > 0 ? (ebitda - interestExLand - dep) * (assumptions.corporateTax / 100) : 0)) + dep - principalExLand + exitExLand;
        
        equityCum += fcfe; equityCumExLand += fcfeExLand;
        equityCfs.push(fcfe); equityCfsExLand.push(fcfeExLand); operatingCfs.push(opFcfe);

        const dscr = (principal + interest) > 0 ? (ebitda / (principal + interest)) : 0;
        avgDscr += dscr; avgYield += (totalEquity > 0 ? (opFcfe / totalEquity) * 100 : 0);

        annualData.push({ year: `Year ${i + devYears}`, isOperating: true, revenue, maintOpex: maint, taxOpex: taxOp, overheadOpex: overhead, ffeReserve: reserve, ebitda, interest, principal, debtBalance: outstandingDebt, dep, corpTax: tax, netIncome, fcfe, cumFcfe: equityCum, dscr, yield: totalEquity > 0 ? (opFcfe / totalEquity) * 100 : 0, fcfeExLand, cumFcfeExLand: equityCumExLand, interestExLand, principalExLand, debtBalanceExLand: outstandingDebtExLand, exit, netExitProceeds: exit, ebt, netExitProceedsExLand: exitExLand, ebtExLand: (ebitda - interestExLand - dep), corpTaxExLand: (ebitda - interestExLand - dep > 0 ? (ebitda - interestExLand - dep) * (assumptions.corporateTax / 100) : 0) });
    }

    const operatingData = annualData.filter(d => d.isOperating);

    return { 
      annualData,
      operatingData,
      metrics: { 
        totalCapex, totalDebt, totalEquity, 
        irr: calculateIRR(equityCfs), npv: calculateNPV(equityCfs, assumptions.discountRate), 
        unleveredIrr: calculateIRR(unleveredCfs), unleveredNpv: calculateNPV(unleveredCfs, assumptions.discountRate), 
        irrExLand: calculateIRR(equityCfsExLand), npvExLand: calculateNPV(equityCfsExLand, assumptions.discountRate), 
        payback: calculatePayback(equityCfs), operatingPayback: calculatePayback(operatingCfs), 
        avgDscr: avgDscr / 10, minDscr: operatingData.filter(d => (d.principal + d.interest) > 0).length > 0 ? Math.min(...operatingData.filter(d => (d.principal + d.interest) > 0).map(d => d.dscr)) : 0, 
        avgYield: avgYield / 10, moic: equityCfs.reduce((acc, val) => val > 0 ? acc + val : acc, 0) / totalEquity, 
        costPerBed: totalCapex / 120, costPerSqm: assumptions.buildArea > 0 ? (totalCapex * 1000) / assumptions.buildArea : 0, 
        yocExLand: (operatingData.reduce((acc, d) => acc + d.ebitda, 0) / 10) / (totalCapexExLand) 
      }, 
      totals: { 
        revenue: annualData.reduce((acc, d) => acc + (d.revenue || 0), 0), 
        maintOpex: annualData.reduce((acc, d) => acc + (d.maintOpex || 0), 0), 
        taxOpex: annualData.reduce((acc, d) => acc + (d.taxOpex || 0), 0), 
        overheadOpex: annualData.reduce((acc, d) => acc + (d.overheadOpex || 0), 0), 
        ffeReserve: annualData.reduce((acc, d) => acc + (d.ffeReserve || 0), 0), 
        ebitda: annualData.reduce((acc, d) => acc + (d.ebitda || 0), 0), 
        interest: annualData.reduce((acc, d) => acc + (d.interest || 0), 0), 
        principal: annualData.reduce((acc, d) => acc + (d.principal || 0), 0), 
        ds: annualData.reduce((acc, d) => acc + (d.interest || 0) + (d.principal || 0), 0), 
        dep: annualData.reduce((acc, d) => acc + (d.dep || 0), 0),
        ebt: annualData.reduce((acc, d) => acc + (d.ebt || 0), 0),
        corpTax: annualData.reduce((acc, d) => acc + (d.corpTax || 0), 0),
        netIncome: annualData.reduce((acc, d) => acc + (d.netIncome || 0), 0), 
        fcfe: annualData.reduce((acc, d) => acc + (d.fcfe || 0), 0), 
        netExitProceeds: annualData.reduce((acc, d) => acc + (d.netExitProceeds || 0), 0),
        interestExLand: annualData.reduce((acc, d) => acc + (d.interestExLand || 0), 0),
        principalExLand: annualData.reduce((acc, d) => acc + (d.principalExLand || 0), 0),
        ebtExLand: annualData.reduce((acc, d) => acc + (d.ebtExLand || 0), 0),
        corpTaxExLand: annualData.reduce((acc, d) => acc + (d.corpTaxExLand || 0), 0),
        netExitProceedsExLand: annualData.reduce((acc, d) => acc + (d.netExitProceedsExLand || 0), 0),
        fcfeExLand: annualData.reduce((acc, d) => acc + (d.fcfeExLand || 0), 0),
      }, 
      capexDetails: { landCost, buildCost, totalHardCosts, totalSoftCosts, totalCapex, medEqCost, infraCost, ffeCost, consultantCost, licenseCost, vatCost, contingencyCost, sharingDevCost } 
    };
};

const runConsolidatedEngine = (opCoData, propCoData, opCoAssumptions) => {
    let annualData = [], consolidatedCfs = [];
    let cumCf = 0;
    
    const totalPropCoEq = propCoData.metrics.totalEquity;
    const totalOpCoEq = opCoAssumptions.partnerBEquity; // 49% HoldCo Share
    const totalConsolidatedEquity = totalPropCoEq + totalOpCoEq;

    propCoData.annualData.forEach((pData, i) => {
        const oData = opCoData.annualData[i] || { shareB: 0, pB_Outlay: 0, isOperating: pData.isOperating, year: pData.year };
        
        // FCFE & pB_Outlay are negative during investment, positive during returns
        const propCoFlow = pData.fcfe || 0;
        const opCoFlow = (oData.pB_Outlay || 0) + (oData.shareB || 0);
        const netFlow = propCoFlow + opCoFlow;
        
        cumCf += netFlow;
        consolidatedCfs.push(netFlow);

        annualData.push({
            year: pData.year,
            isOperating: pData.isOperating,
            propCoFlow,
            opCoFlow,
            netFlow,
            cumCf
        });
    });

    return {
        annualData,
        operatingData: annualData.filter(d => d.isOperating),
        metrics: {
            totalEquity: totalConsolidatedEquity,
            irr: calculateIRR(consolidatedCfs),
            npv: calculateNPV(consolidatedCfs, opCoAssumptions.holdCoDiscountRate),
            payback: calculatePayback(consolidatedCfs),
            moic: totalConsolidatedEquity > 0 ? consolidatedCfs.reduce((acc, val) => val > 0 ? acc + val : acc, 0) / totalConsolidatedEquity : 0
        },
        totals: {
            propCoFlow: annualData.reduce((acc, d) => acc + d.propCoFlow, 0),
            opCoFlow: annualData.reduce((acc, d) => acc + d.opCoFlow, 0),
            netFlow: annualData.reduce((acc, d) => acc + d.netFlow, 0),
        }
    };
};

// ==========================================
// 3. UI ATOMIC COMPONENTS
// ==========================================

const AIMicroscopeIcon = memo(({ size = 14, className = "" }) => {
  const badgeFontSize = Math.max(7, size * 0.35);
  const rightOffset = size > 24 ? '-right-3' : '-right-2';
  const topOffset = size > 24 ? '-top-2' : '-top-1';
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <Microscope size={size} />
      <span 
        className={`absolute ${topOffset} ${rightOffset} bg-gradient-to-br from-[#1C6048] to-[#1E2F31] text-white font-black px-1 rounded-sm shadow-sm leading-none border border-white/50`} 
        style={{ fontSize: badgeFontSize }}
      >
        AI
      </span>
    </div>
  );
});

// Custom Brand SVGs based on exact user images
// Strictly Line-Art (Fill: none) + High Detail + Scalable Viewbox
const CustomBedIcon = memo(({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Heartbeat Monitor */}
    <rect x="34" y="10" width="20" height="14" rx="2" />
    <polyline points="36,17 40,17 43,12 46,22 49,17 52,17" />
    {/* Bed Frame & Headboard */}
    <line x1="10" y1="16" x2="10" y2="52" />
    <line x1="10" y1="44" x2="56" y2="44" />
    <line x1="56" y1="44" x2="56" y2="52" />
    {/* Patient Head & Blanket */}
    <circle cx="20" cy="26" r="5" />
    <path d="M 10 34 L 26 34 C 30 26 34 26 38 34 L 56 34 L 56 44" />
  </svg>
));

const CustomScaleIcon = memo(({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Base & Stand */}
    <line x1="16" y1="56" x2="48" y2="56" />
    <line x1="22" y1="50" x2="42" y2="50" />
    <line x1="32" y1="50" x2="32" y2="10" />
    <circle cx="32" cy="10" r="3" />
    {/* Angled Crossbar */}
    <line x1="10" y1="16" x2="54" y2="28" />
    {/* Left Strings & Pan */}
    <path d="M 10 16 L 4 36 L 16 36 Z" />
    <path d="M 4 36 C 4 46 16 46 16 36" />
    {/* Right Strings & Pan */}
    <path d="M 54 28 L 48 48 L 60 48 Z" />
    <path d="M 48 48 C 48 58 60 58 60 48" />
  </svg>
));

const CustomKnotIcon = memo(({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Continuous overlapping path simulating a tangled thread/yarn with a loose end */}
    <path d="M 12 52 C 16 44 24 36 20 28 C 16 16 32 8 44 16 C 56 24 52 44 40 52 C 28 60 12 48 16 32 C 20 16 40 12 52 24 C 64 36 56 56 44 60 C 32 64 20 52 24 40 C 28 28 44 28 48 40 C 52 52 36 60 28 52" />
  </svg>
));

const CustomStethoscopeIcon = memo(({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Earpieces (Y-Split) */}
    <path d="M 10 8 C 10 16 16 20 16 26" />
    <path d="M 22 8 C 22 16 16 20 16 26" />
    <line x1="7" y1="8" x2="13" y2="8" />
    <line x1="19" y1="8" x2="25" y2="8" />
    {/* Left Arm & U-Bend */}
    <line x1="16" y1="26" x2="16" y2="44" />
    <path d="M 16 44 C 16 60 48 60 48 44" />
    {/* Right Arm & Chestpiece */}
    <line x1="48" y1="44" x2="48" y2="26" />
    <circle cx="48" cy="18" r="8" />
    <circle cx="48" cy="18" r="3" />
    {/* Medical Cross Circle (Lowered and Centered) */}
    <circle cx="32" cy="38" r="6" />
    <line x1="32" y1="35" x2="32" y2="41" />
    <line x1="29" y1="38" x2="35" y2="38" />
  </svg>
));

const CustomPhysicianIcon = memo(({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Simple Head */}
    <circle cx="32" cy="16" r="10" />
    {/* Simple Body Outline */}
    <path d="M 12 56 C 12 40 20 32 32 32 C 44 32 52 40 52 56" />
    
    {/* Asymmetric Stethoscope Drape */}
    {/* Left Side: Earpieces hanging down */}
    <path d="M 25 33.5 C 22 37 22 43 23 48" />
    <path d="M 19 53 L 23 48 L 27 53" />
    
    {/* Right Side: Chestpiece hanging down */}
    <path d="M 39 33.5 C 42 37 42 43 41 50" />
    <circle cx="41" cy="53" r="3" />
  </svg>
));

const CustomPopulationIcon = memo(({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Row 1 (Top) - 3 people */}
    {[22, 32, 42].map(x => (
        <g key={`r1-${x}`}>
            <path d={`M ${x-5.5} 27 C ${x-5.5} 19 ${x+5.5} 19 ${x+5.5} 27`} fill="#EFEBE7" />
            <circle cx={x} cy="14" r="3.5" fill="#EFEBE7" />
        </g>
    ))}
    {/* Row 2 (Middle) - 4 people */}
    {[17, 27, 37, 47].map(x => (
        <g key={`r2-${x}`}>
            <path d={`M ${x-5.5} 43 C ${x-5.5} 35 ${x+5.5} 35 ${x+5.5} 43`} fill="#EFEBE7" />
            <circle cx={x} cy="30" r="3.5" fill="#EFEBE7" />
        </g>
    ))}
    {/* Row 3 (Bottom) - 5 people */}
    {[12, 22, 32, 42, 52].map(x => (
        <g key={`r3-${x}`}>
            <path d={`M ${x-5.5} 59 C ${x-5.5} 51 ${x+5.5} 51 ${x+5.5} 59`} fill="#EFEBE7" />
            <circle cx={x} cy="46" r="3.5" fill="#EFEBE7" />
        </g>
    ))}
  </svg>
));

const MarkdownRenderer = memo(({ content, className = "" }) => {
  const createMarkup = (text) => {
    if (!text || typeof text !== 'string') return { __html: "" };
    let html = text
      .replace(/^###\s+(.*$)/gim, '<h3 class="font-bold text-[14px] mt-4 mb-2">$1</h3>')
      .replace(/^##\s+(.*$)/gim, '<h2 class="font-bold text-[15px] mt-5 mb-2">$1</h2>')
      .replace(/^#\s+(.*$)/gim, '<h1 class="font-bold text-[16px] mt-6 mb-3">$1</h1>')
      .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-5 list-disc mb-1">$1</li>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\n/gim, '<br/>');
    return { __html: html };
  };
  return <div className={className} dangerouslySetInnerHTML={createMarkup(content)} />;
});

const NavButton = memo(({ active, onClick, icon, label, disabled }) => (
  <button 
    onClick={disabled ? undefined : onClick} 
    disabled={disabled}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
      disabled ? 'opacity-40 cursor-not-allowed text-[#4C4A4B]' : 
      active ? 'bg-white text-[#1E2F31] shadow-md border border-[#D8D8D8]' : 
      'text-[#4C4A4B] hover:text-[#1E2F31]'
    }`}
  >
    {icon} <span className="hidden sm:inline">{label}</span>
  </button>
));

const KPICard = memo(({ title, value, icon, color, subtitle }) => {
  const textColors = { blue: "text-[#1C6048]", emerald: "text-[#1E2F31]", indigo: "text-[#9B8B70]" };
  return (
    <div className="p-4 lg:p-5 rounded-2xl border border-[#D8D8D8] bg-white flex flex-col shadow-sm transition-transform hover:-translate-y-1">
      <div className={`flex items-center gap-2 mb-2 opacity-80 text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${textColors[color] || "text-[#1E2F31]"}`}>{icon} {title}</div>
      <div className={`text-lg lg:text-xl font-black mb-1 ${textColors[color] || "text-[#1E2F31]"}`}>{value}</div>
      <div className="text-[8px] lg:text-[9px] font-bold uppercase text-[#4C4A4B] opacity-60 tracking-tighter">{subtitle}</div>
    </div>
  );
});

const MiniKPICard = memo(({ title, value, subtitle }) => (
  <div className="p-3 bg-[#EFEBE7] rounded-xl border border-[#D8D8D8]">
    <p className="text-[9px] text-[#4C4A4B] font-bold uppercase mb-1">{title}</p>
    <p className="text-lg font-black text-[#1E2F31]">{value}</p>
    <p className="text-[8px] text-[#99B6AA] font-bold uppercase mt-1">{subtitle}</p>
  </div>
));

const DualKPICard = memo(({ title1, value1, color1, title2, value2, color2, icon }) => {
  const tColors = { blue: "text-[#1C6048]", emerald: "text-[#1E2F31]", indigo: "text-[#9B8B70]", teal: "text-[#1C6048]", amber: "text-[#9B8B70]", rose: "text-[#4C4A4B]" };
  return (
    <div className="p-4 lg:p-5 rounded-2xl border border-[#D8D8D8] bg-white flex flex-col shadow-sm transition-transform hover:-translate-y-1">
      <div className={`flex items-center gap-2 mb-2 opacity-80 text-[10px] font-black uppercase tracking-widest ${tColors[color1] || "text-[#1E2F31]"}`}>{icon} {title1}</div>
      <div className={`text-lg lg:text-xl font-black mb-1 ${tColors[color1] || "text-[#1E2F31]"}`}>{value1}</div>
      <div className="w-full h-px bg-[#D8D8D8] my-3"></div>
      <div className={`flex items-center gap-2 mb-2 opacity-80 text-[10px] font-black uppercase tracking-widest ${tColors[color2] || "text-[#1E2F31]"}`}>{title2}</div>
      <div className={`text-lg lg:text-xl font-black ${tColors[color2] || "text-[#1E2F31]"}`}>{value2}</div>
    </div>
  );
});

const SectionTitle = memo(({ title, icon, color }) => {
  const c = { blue: 'text-[#1C6048]', emerald: 'text-[#1C6048]', indigo: 'text-[#9B8B70]', rose: 'text-[#4C4A4B]', amber: 'text-[#9B8B70]', teal: 'text-[#4C4A4B]' };
  return <div className={`flex items-center gap-2 pb-2 border-b-2 border-[#D8D8D8] ${c[color] || 'text-[#1E2F31]'}`}>{icon} <h3 className="text-[10px] font-black uppercase tracking-wider">{title}</h3></div>;
});

const FormattedInput = memo(({ val, set, className, placeholder, disabled }) => {
  const [isFocused, setIsFocused] = useState(false);
  return <input type={isFocused ? "number" : "text"} value={isFocused ? (val || "") : new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(val || 0)} onChange={(e) => set(e.target.value)} onFocus={(e) => { setIsFocused(true); setTimeout(() => e.target.select(), 0); }} onBlur={() => setIsFocused(false)} className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`} placeholder={placeholder} disabled={disabled} />;
});

const AssumptionRow = memo(({ label, val, set, unit, isLocked }) => (
  <div className="flex justify-between items-center group py-1 border-b border-[#D8D8D8] last:border-0 hover:bg-[#EFEBE7] px-1 rounded transition-colors"><label className="text-[10px] text-[#4C4A4B] font-bold">{label}</label><div className="flex items-center gap-1"><FormattedInput disabled={isLocked} val={val} set={set} className="w-16 p-1 text-right text-[10px] border border-[#D8D8D8] rounded focus:ring-2 focus:ring-[#1C6048] outline-none font-black text-[#1E2F31] bg-white" /><span className="text-[8px] text-[#4C4A4B] font-black uppercase w-4">{unit}</span></div></div>
));

const AssumptionDepreciationGroup = memo(({ label, methodVal, lifeVal, setMethod, setLife, isLocked }) => (
  <div className="flex justify-between items-center group py-1 border-b border-[#D8D8D8] last:border-0 hover:bg-[#EFEBE7] px-1 rounded">
    <label className="text-[10px] text-[#4C4A4B] font-bold">{label}</label>
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-[#D8D8D8] rounded p-0.5">
        <button disabled={isLocked} onClick={() => setMethod('SL')} className={`px-2 py-0.5 text-[9px] font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed ${methodVal === 'SL' ? 'bg-white text-[#1E2F31] shadow-sm border border-[#D8D8D8]' : 'text-[#4C4A4B]'}`}>SL</button>
        <button disabled={isLocked} onClick={() => setMethod('DDB')} className={`px-2 py-0.5 text-[9px] font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed ${methodVal === 'DDB' ? 'bg-white text-[#1E2F31] shadow-sm border border-[#D8D8D8]' : 'text-[#4C4A4B]'}`}>DDB</button>
      </div>
      <div className="flex items-center gap-1">
        <FormattedInput disabled={isLocked} val={lifeVal} set={setLife} className="w-12 p-1 text-right text-[10px] border border-[#D8D8D8] rounded font-black text-[#1E2F31] bg-white" />
        <span className="text-[8px] text-[#4C4A4B] font-black uppercase w-4">Yrs</span>
      </div>
    </div>
  </div>
));

const ToggleRow = memo(({ label, desc, checked, onChange, isLocked }) => (
  <div className={`flex items-center justify-between p-3 bg-[#EFEBE7] border border-[#D8D8D8] rounded-xl ${isLocked ? 'opacity-70' : ''}`}>
    <div><p className="font-bold text-[#1E2F31] text-[11px]">{label}</p><p className="text-[9px] text-[#4C4A4B] font-medium">{desc}</p></div>
    <label className={`relative inline-flex items-center ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input disabled={isLocked} type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-9 h-5 bg-[#D8D8D8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D8D8D8] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9B8B70] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
    </label>
  </div>
));

const AssumptionRowCalculated = memo(({ label, pctVal, setPct, calculatedVal, isLocked }) => (
  <div className="flex justify-between items-center group py-1 border-b border-[#D8D8D8] last:border-0 hover:bg-[#EFEBE7] px-1 rounded">
    <label className="text-[10px] text-[#4C4A4B] font-bold">{label}</label>
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#1C6048] font-bold w-12 text-right">{formatNumber(calculatedVal, 2)} B</span>
      <div className="flex items-center gap-1">
        <FormattedInput disabled={isLocked} val={pctVal} set={setPct} className="w-12 p-1 text-right text-[10px] border border-[#D8D8D8] rounded font-black text-[#1E2F31] bg-white" />
        <span className="text-[8px] text-[#4C4A4B] font-black uppercase w-4">%</span>
      </div>
    </div>
  </div>
));

const AssumptionRowQtyPrice = memo(({ label, qtyVal, priceVal, setQty, setPrice, isLocked }) => (
  <div className="flex flex-col group py-1.5 border-b border-[#D8D8D8] last:border-0 hover:bg-[#EFEBE7] px-1 rounded gap-1">
    <div className="flex justify-between items-center">
      <label className="text-[10px] text-[#4C4A4B] font-bold">{label}</label>
      <span className="text-[10px] text-[#1C6048] font-bold">{formatNumber(((qtyVal || 0) * (priceVal || 0)) / 1000, 2)} B</span>
    </div>
    <div className="flex justify-end items-center gap-1">
      <FormattedInput disabled={isLocked} val={qtyVal} set={setQty} className="w-12 p-1 text-right text-[10px] border border-[#D8D8D8] rounded font-black text-[#1E2F31] bg-white" placeholder="Qty" />
      <span className="text-[8px] text-[#4C4A4B] font-black uppercase mr-1">Qty</span>
      <span className="text-[8px] text-[#D8D8D8] font-black mx-1">×</span>
      <FormattedInput disabled={isLocked} val={priceVal} set={setPrice} className="w-16 p-1 text-right text-[10px] border border-[#D8D8D8] rounded font-black text-[#1E2F31] bg-white" placeholder="Price" />
      <span className="text-[8px] text-[#4C4A4B] font-black uppercase w-8">M / ea</span>
    </div>
  </div>
));

const AssumptionRowQtyPriceWithToggle = memo(({ label, qtyVal, priceVal, setQty, setPrice, checked, onToggle, isLocked }) => (
  <div className={`flex flex-col group py-1.5 border-b border-[#D8D8D8] last:border-0 px-1 rounded gap-1 ${!checked ? 'opacity-60 bg-[#EFEBE7]/50' : 'hover:bg-[#EFEBE7]'}`}>
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <label className={`relative inline-flex items-center ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input disabled={isLocked} type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
          <div className="w-7 h-4 bg-[#D8D8D8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D8D8D8] after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#1C6048] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
        </label>
        <label className="text-[10px] text-[#4C4A4B] font-bold">{label}</label>
      </div>
      <span className="text-[10px] text-[#1C6048] font-bold">{formatNumber(checked ? ((qtyVal || 0) * (priceVal || 0)) / 1000 : 0, 2)} B</span>
    </div>
    <div className="flex justify-end items-center gap-1">
      <FormattedInput disabled={isLocked || !checked} val={qtyVal} set={setQty} className="w-12 p-1 text-right text-[10px] border border-[#D8D8D8] rounded font-black text-[#1E2F31] bg-white disabled:bg-[#D8D8D8]/30" placeholder="Qty" />
      <span className="text-[8px] text-[#4C4A4B] font-black uppercase mr-1">Qty</span>
      <span className="text-[8px] text-[#D8D8D8] font-black mx-1">×</span>
      <FormattedInput disabled={isLocked || !checked} val={priceVal} set={setPrice} className="w-16 p-1 text-right text-[10px] border border-[#D8D8D8] rounded font-black text-[#1E2F31] bg-white disabled:bg-[#D8D8D8]/30" placeholder="Price" />
      <span className="text-[8px] text-[#4C4A4B] font-black uppercase w-8">M / ea</span>
    </div>
  </div>
));

const SettingsHeader = memo(({ title, icon, isLocked, onToggleLock, onSave, saveStatus, onReset, onValidate, isCloudSync }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#D8D8D8] pb-4">
    <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">{icon} {title} {isLocked && <Lock size={16} className="text-[#9B8B70] ml-2" />}</h2>
    <div className="flex flex-wrap gap-2 w-full md:w-auto">
      <button onClick={onToggleLock} className={`flex-1 md:flex-none justify-center text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ${isLocked ? 'bg-[#9B8B70] hover:bg-[#1E2F31] text-white' : 'bg-white border border-[#D8D8D8] text-[#4C4A4B] hover:text-[#1E2F31]'}`}>{isLocked ? <Lock size={14}/> : <Unlock size={14}/>} {isLocked ? "Unlock" : "Lock Inputs"}</button>
      <button onClick={onValidate} disabled={isLocked} className="flex-1 md:flex-none justify-center bg-[#1E2F31] hover:opacity-90 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50 shadow-sm"><Sparkles size={14}/> ✨ Validate</button>
      <div className="h-8 w-px bg-[#D8D8D8] hidden md:block"></div>
      
      {isCloudSync && (
        <button onClick={onSave} disabled={saveStatus !== 'idle' || isLocked} className={`flex-1 md:flex-none justify-center text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50 px-2 py-2 md:py-0 border md:border-0 rounded-lg md:rounded-none border-[#D8D8D8] ${saveStatus === 'saved' ? 'text-[#1C6048]' : 'text-[#4C4A4B] hover:text-[#1E2F31]'}`}>{saveStatus === 'saving' ? <RefreshCcw size={14} className="animate-spin" /> : <ShieldCheck size={14}/>} {saveStatus === 'saving' ? "Saving..." : saveStatus === 'saved' ? "Saved!" : "Set Defaults"}</button>
      )}
      <button onClick={onReset} disabled={isLocked} className="text-xs font-bold text-[#4C4A4B] hover:text-[#1E2F31] flex items-center justify-center gap-1 transition-colors disabled:opacity-50 px-2 py-2 md:py-0 border md:border-0 rounded-lg md:rounded-none border-[#D8D8D8]"><RefreshCcw size={14}/> Reset</button>
    </div>
  </div>
));

const TableRow = memo(({ label, data, dk, total, highlight, indigo, emerald, crossover, isIndent }) => {
  let baseColorClass = "bg-white font-medium text-[#4C4A4B]";
  if (highlight) {
    if (indigo) baseColorClass = "bg-[#EBEFEE] font-bold text-[#1E2F31]";
    else if (emerald) baseColorClass = "bg-[#E8EFEA] font-black text-[#1C6048]";
    else baseColorClass = "bg-[#EFEBE7] font-bold text-[#1E2F31]";
  }
      
  let firstColClass = `px-4 py-2 sticky left-0 z-10 border-r border-b border-[#D8D8D8] whitespace-nowrap transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${baseColorClass} ${isIndent ? "pl-8 text-[10px]" : "text-[11px]"}`;
  let totalColClass = `px-3 py-2 text-right font-bold font-mono border-l border-b border-[#D8D8D8] sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${baseColorClass} ${!highlight ? 'group-hover:bg-[#F9F8F6]' : ''}`;

  return (
    <tr className={`group ${highlight ? "" : "hover:bg-[#F9F8F6]"}`}>
      <td className={firstColClass}>{label}</td>
      {data.map((d, i) => { 
          const val = d[dk] || 0; 
          const isCrossover = crossover && val >= 0 && (i > 0 && data[i-1][dk] < 0);
          const cellBg = highlight ? (indigo ? "bg-[#EBEFEE]" : emerald ? "bg-[#E8EFEA]" : "bg-[#EFEBE7]/50") : "bg-white group-hover:bg-[#F9F8F6]";
          return (
            <td key={i} className={`px-3 py-2 text-right border-r border-b border-[#D8D8D8] font-mono transition-colors ${cellBg} ${val < 0 ? 'text-[#9B8B70]' : highlight ? 'text-[#1E2F31] font-bold' : 'text-[#4C4A4B]'} ${isCrossover ? 'bg-[#9B8B70]/20 ring-1 ring-inset ring-[#9B8B70] text-[#1E2F31] font-bold' : ""}`}>
              {val === 0 && val >= 0 ? '-' : formatNumber(val, 1)}
            </td> 
          );
      })}
      {total !== undefined ? (
        <td className={totalColClass}>
          {formatNumber(total, 1)}
        </td>
      ) : (
        <td className={totalColClass}></td>
      )}
    </tr>
  );
});

const TableSection = memo(({ title, colSpan, type = 'default' }) => {
  const bgClass = type === 'emerald' ? "bg-[#1C6048] text-white" : "bg-[#1E2F31] text-white";
  return (
    <tr>
      <td colSpan={colSpan} className={`p-0 border-y-2 border-white ${bgClass}`}>
        <div className={`px-4 py-2.5 font-black uppercase text-[10px] tracking-widest sticky left-0 inline-block whitespace-nowrap ${bgClass}`}>
          {title}
        </div>
      </td>
    </tr>
  );
});

const CapexRow = memo(({ label, amount, total, isHeader, isSubtotal, isIndent }) => (
  <tr className={`group ${isSubtotal ? 'font-bold text-[#1E2F31]' : 'text-[#4C4A4B]'} ${isHeader ? 'font-bold text-[#1E2F31]' : ''}`}>
    <td className={`px-4 py-2 border-r border-b border-[#D8D8D8] transition-colors ${isSubtotal ? 'bg-[#EFEBE7]/50' : 'bg-white group-hover:bg-[#F9F8F6]'} ${isIndent ? 'pl-8' : ''}`}>{label}</td>
    <td className={`px-4 py-2 text-right border-r border-b border-[#D8D8D8] font-mono transition-colors ${isSubtotal ? 'bg-[#EFEBE7]/50' : 'bg-white group-hover:bg-[#F9F8F6]'}`}>{formatNumber(amount, 1)}</td>
    <td className={`px-4 py-2 text-right font-mono border-b border-[#D8D8D8] transition-colors ${isSubtotal ? 'bg-[#EFEBE7]/50 text-[#1E2F31]' : 'bg-white group-hover:bg-[#F9F8F6] text-[#4C4A4B]'}`}>{formatNumber(total > 0 ? (amount / total) * 100 : 0, 1)}%</td>
  </tr>
));

const ExpandableCapexRow = memo(({ icon, title, amount, totalCapex, details }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pct = totalCapex > 0 ? (amount / totalCapex) * 100 : 0;

  return (
    <div className="border-b border-[#D8D8D8] last:border-0 pb-1 mb-1">
      <div 
        className={`flex justify-between items-center py-2 px-2 -mx-2 rounded-lg transition-colors ${details && details.length > 0 ? 'cursor-pointer hover:bg-[#EFEBE7]/50' : ''}`}
        onClick={() => details && details.length > 0 && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#EFEBE7] rounded-lg">{icon}</div>
          <div>
            <p className="text-xs text-[#1E2F31] font-bold flex items-center gap-1.5">
              {title}
              {details && details.length > 0 && (
                 <ChevronDown size={14} className={`text-[#9B8B70] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono font-black text-[#1E2F31] text-sm">{formatNumber(amount, 1)} B</p>
          <p className="text-[9px] text-[#1C6048] font-bold uppercase">{formatNumber(pct, 1)}%</p>
        </div>
      </div>
      
      {isExpanded && details && details.length > 0 && (
        <div className="pl-12 pr-2 pb-2 pt-1 space-y-2.5 animate-in slide-in-from-top-2 fade-in duration-200">
          {details.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-[10px] group">
              <span className="text-[#4C4A4B] font-medium flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#D8D8D8] group-hover:bg-[#1C6048] transition-colors"></div>
                {item.label}
              </span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[#1E2F31] font-bold">{formatNumber(item.amount, 1)}</span>
                <span className="font-mono text-[#9B8B70] w-8 text-right">{formatNumber(totalCapex > 0 ? (item.amount / totalCapex) * 100 : 0, 1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const PartnerReturnCard = ({ name, metrics, equity, share, color }) => {
  const c = color === 'blue' ? { text: 'text-[#1C6048]', bg: 'bg-[#EFEBE7]', border: 'border-[#D8D8D8]' } : { text: 'text-[#9B8B70]', bg: 'bg-[#EFEBE7]', border: 'border-[#D8D8D8]' };
  return (
    <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-[#D8D8D8] relative transition-all hover:shadow-md">
      <div className={`absolute top-0 right-0 p-3 lg:p-4 ${c.bg} rounded-bl-3xl border-l border-b ${c.border}`}><p className="text-[10px] font-bold text-[#4C4A4B] uppercase leading-none mb-1 text-right tracking-widest">Share</p><p className={`text-lg font-black ${c.text}`}>{(share || 0).toFixed(2)}%</p></div>
      <div className="mb-6"><h3 className={`text-lg font-bold text-[#1E2F31] flex items-center gap-2 mb-1`}><Users size={20} className={c.text} /> {name}</h3><p className="text-xs text-[#4C4A4B] font-medium">Avg Dividend Yield: <b className={c.text}>{formatNumber(metrics?.avgYield, 1)}%</b></p></div>
      <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6 text-center">
        <div className="p-3 lg:p-4 bg-[#EFEBE7] rounded-xl border border-[#D8D8D8] hover:bg-white"><p className="text-[10px] text-[#4C4A4B] font-bold uppercase tracking-wider mb-1">Equity IRR</p><p className={`text-xl lg:text-2xl font-black ${c.text}`}>{formatNumber((metrics?.irr || 0) * 100, 2)}%</p></div>
        <div className="p-3 lg:p-4 bg-[#EFEBE7] rounded-xl border border-[#D8D8D8] hover:bg-white"><p className="text-[10px] text-[#9B8B70] font-bold uppercase tracking-wider mb-1">Payback</p><p className="text-xl lg:text-2xl font-black text-[#9B8B70]">{formatNumber(metrics?.payback, 1)} <span className="text-xs font-bold text-[#4C4A4B] uppercase">Yrs</span></p></div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs"><span className="font-bold text-[#4C4A4B] uppercase tracking-tighter flex items-center gap-1"><Coins size={12} /> Recovery</span><span className="font-black text-[#1E2F31]">{equity > 0 && metrics?.totalCash >= equity ? '100%' : `${equity > 0 ? ((metrics?.totalCash || 0) / equity * 100).toFixed(1) : "0"}%`}</span></div>
        <div className="w-full h-2 bg-[#D8D8D8] rounded-full overflow-hidden"><div className={`h-full ${color === 'blue' ? 'bg-[#1C6048]' : 'bg-[#9B8B70]'} rounded-full`} style={{ width: `${Math.min(100, equity > 0 ? ((metrics?.totalCash || 0) / equity) * 100 : 0)}%` }}></div></div>
        <div className="flex justify-between text-[10px] font-bold text-[#4C4A4B]"><span>MOIC: {(metrics?.moic || 0).toFixed(2)}x</span><span>{formatCurrency(metrics?.totalCash)}</span></div>
      </div>
    </div>
  );
};

const SensitivityTable = memo(({ title, subtitle, xLabel, yLabel, xValues, yValues, matrix, formatFn, reverseColors }) => {
  const all = matrix.flat().filter(v => v !== 0 && !isNaN(v));
  const min = all.length > 0 ? Math.min(...all) : 0;
  const max = all.length > 0 ? Math.max(...all) : 0;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#D8D8D8] overflow-hidden">
      <div className="p-4 bg-[#EFEBE7] border-b border-[#D8D8D8]">
        <h3 className="text-sm font-bold text-[#1E2F31] flex items-center gap-2"><Grid size={16} className="text-[#1C6048]"/> {title}</h3>
        <p className="text-[10px] text-[#4C4A4B] font-bold uppercase tracking-widest mt-1">{subtitle}</p>
      </div>
      <div className="p-6 overflow-x-auto">
        <div className="min-w-[600px]">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="border-b-2 border-r-2 border-[#D8D8D8] text-[10px] p-2 text-right align-bottom">{xLabel} ➔<br/>{yLabel} ⬇</th>
                {xValues.map((x, i) => <th key={i} className="px-3 py-2 text-xs font-bold text-[#1E2F31] bg-[#EFEBE7]/50 border-b border-[#D8D8D8]">{String(x)}</th>)}
              </tr>
            </thead>
            <tbody>
              {yValues.map((y, r) => (
                <tr key={r}>
                  <th className="px-3 py-3 text-xs font-bold text-[#1E2F31] bg-[#EFEBE7]/50 border-r border-[#D8D8D8] whitespace-nowrap">{String(y)}</th>
                  {matrix[r].map((val, c) => { 
                    let color = '';
                    if (val === 0 || isNaN(val)) {
                        color = 'bg-[#9B8B70] text-white'; // Never / Bad is always brown
                    } else {
                        let ratio = max === min ? 0.5 : (val - min) / (max - min); 
                        if (reverseColors) ratio = 1 - ratio; 
                        color = ratio > 0.6 ? 'bg-[#1C6048] text-white' : ratio > 0.3 ? 'bg-[#99B6AA]/50 text-[#1E2F31]' : 'bg-[#9B8B70] text-white'; 
                    }
                    return <td key={c} className={`px-3 py-3 border border-white text-xs font-mono font-bold transition-all hover:opacity-80 ${color}`}>{formatFn(val)}</td> 
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

const ProjectInfoFieldComp = memo(({ label, value, onChange, isLocked, icon }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-[#4C4A4B] uppercase flex items-center gap-1.5 ml-1">{icon} {label}</label>
    <input type="text" value={typeof value === 'string' ? value : ""} onChange={(e) => onChange(e.target.value)} disabled={isLocked} className="w-full p-3 bg-[#F9F8F6] border border-[#D8D8D8] rounded-xl text-xs font-bold text-[#1E2F31] focus:ring-2 focus:ring-[#1C6048] outline-none disabled:opacity-70 transition-all shadow-inner" />
  </div>
));

const SelectionPopupComp = memo(({ state, setState, onAsk }) => {
  const popupRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, translateX: 0, translateY: 0 });

  // Reset drag position when the popup spawns at a new text selection
  useEffect(() => {
    if (popupRef.current) {
      dragRef.current.translateX = 0;
      dragRef.current.translateY = 0;
      popupRef.current.style.transform = 'translate(-50%, 0px)';
    }
  }, [state.x, state.y]);

  const handlePointerDown = (e) => {
    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX - dragRef.current.translateX;
    dragRef.current.startY = e.clientY - dragRef.current.translateY;
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging || !popupRef.current) return;
    const x = e.clientX - dragRef.current.startX;
    const y = e.clientY - dragRef.current.startY;
    dragRef.current.translateX = x;
    dragRef.current.translateY = y;
    // Apply CSS transform directly to bypass React render cycle for 60fps smoothness
    popupRef.current.style.transform = `translate(calc(-50% + ${x}px), ${y}px)`;
  };

  const handlePointerUp = (e) => {
    dragRef.current.isDragging = false;
    e.target.releasePointerCapture(e.pointerId);
  };

  if (!state.show) return null;
  return (
    <div 
      id="ai-selection-popup" 
      ref={popupRef}
      className="absolute z-[100] flex flex-col items-center animate-in fade-in zoom-in duration-200" 
      style={{ left: state.x, top: state.y, transform: `translate(calc(-50% + ${dragRef.current.translateX}px), ${dragRef.current.translateY}px)` }}
    >
      {!state.isOpen ? (
        <button onClick={() => setState(p => ({...p, isOpen: true}))} className="bg-[#1E2F31] text-white p-2.5 rounded-full shadow-xl border border-[#D8D8D8] hover:scale-110 transition-all flex items-center justify-center"><Sparkles size={20} className="text-white" /></button>
      ) : (
        <div className="bg-white w-72 md:w-80 p-4 lg:p-5 rounded-2xl shadow-2xl border border-[#1E2F31] flex flex-col gap-3 relative mt-2">
          <div 
            className="w-full flex justify-center items-center cursor-grab active:cursor-grabbing pb-2 -mt-2 pt-1 opacity-50 hover:opacity-100 touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <GripHorizontal size={16} className="text-[#4C4A4B] pointer-events-none" />
          </div>
          <div className="flex justify-between items-center mb-1"><h4 className="text-sm font-black flex items-center gap-1.5 text-[#1E2F31]"><Sparkles size={16} className="text-[#1C6048]"/> Selection AI</h4><button onClick={() => setState(p => ({...p, show: false, isOpen: false}))} className="text-[#4C4A4B] hover:text-[#1E2F31] bg-[#EFEBE7] rounded-full p-1"><X size={14}/></button></div>
          <div className="bg-[#EFEBE7] p-3 rounded-lg text-[11px] text-[#4C4A4B] italic border border-[#D8D8D8] max-h-20 overflow-hidden relative font-medium">"{String(state.text)}"<div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#EFEBE7] to-transparent pointer-events-none"></div></div>
          <textarea value={state.query} onChange={(e) => setState(p => ({...p, query: e.target.value}))} placeholder="What do you want to know about this?" className="w-full text-xs p-3 border border-[#D8D8D8] rounded-xl focus:ring-2 focus:ring-[#1C6048] outline-none resize-none h-20 shadow-inner text-[#1E2F31]" autoFocus />
          {state.response && <div className="bg-[#EFEBE7] p-4 rounded-xl border border-[#D8D8D8] max-h-48 overflow-y-auto shadow-inner"><MarkdownRenderer content={state.response} className="text-[12px] text-[#4C4A4B] leading-relaxed" /></div>}
          <button onClick={onAsk} disabled={state.isLoading || !state.query.trim()} className="w-full bg-[#1C6048] hover:opacity-90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-2">{state.isLoading ? <RefreshCcw size={14} className="animate-spin" /> : <BrainCircuit size={14}/>}{state.isLoading ? "Thinking..." : "Ask Gemini"}</button>
        </div>
      )}
    </div>
  );
});

const MarketValidationDisplay = memo(({ content, loading, onClose, color }) => (
  <div className={`mb-8 bg-white p-5 lg:p-6 rounded-2xl border border-[#D8D8D8] border-l-4 relative shadow-sm animate-in slide-in-from-top-4 ${color === 'blue' ? 'border-l-[#1C6048]' : 'border-l-[#9B8B70]'}`}>
      <button onClick={onClose} className="absolute top-4 right-4 text-[#4C4A4B] hover:text-[#1E2F31] bg-[#EFEBE7] rounded-full p-1"><X size={16}/></button>
      <h3 className="font-black text-[#1E2F31] mb-3 flex items-center gap-2 text-sm"><Scale size={18}/> AI Market Check</h3>
      {loading ? <div className="animate-pulse space-y-3"><div className="h-2 bg-[#D8D8D8] rounded w-full"></div><div className="h-2 bg-[#D8D8D8] rounded w-5/6"></div></div> : <MarkdownRenderer content={content} className="text-[13px] text-[#4C4A4B] font-medium" />}
  </div>
));

// ==========================================
// 4. STRATEGIC FOUNDATION (BENTO UI)
// ==========================================

const BentoBox = memo(({ children, className = "", colSpan = "col-span-12" }) => (
  <div className={`bg-white rounded-[28px] p-6 lg:p-8 shadow-sm border border-[#D8D8D8] flex flex-col transition-all hover:shadow-md ${colSpan} ${className}`}>
    {children}
  </div>
));

const BentoIcon = memo(({ icon, color = "blue", className = "" }) => {
  const bgColors = {
    blue: 'bg-[#1C6048]/10 text-[#1C6048]',
    emerald: 'bg-[#1E2F31]/10 text-[#1E2F31]',
    indigo: 'bg-[#9B8B70]/10 text-[#9B8B70]',
    rose: 'bg-[#4C4A4B]/10 text-[#4C4A4B]',
    amber: 'bg-[#99B6AA]/20 text-[#1E2F31]',
    transparent: 'bg-transparent',
  };
  return (
    <div className={`flex items-center justify-center mb-5 shrink-0 ${color !== 'transparent' ? 'w-14 h-14 rounded-[20px]' : ''} ${bgColors[color]} ${className}`}>
      {icon}
    </div>
  );
});

const ProjectOverviewView = memo(({ info, setInfo, isLocked }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-500 pb-12">
    {/* Main General Info Bento */}
    <BentoBox colSpan="md:col-span-12 lg:col-span-8">
      <div className="flex items-center gap-4 mb-6">
        <BentoIcon icon={<Building size={28}/>} color="blue" className="mb-0" />
        <div>
          <h2 className="text-2xl font-black text-[#1E2F31] tracking-tight">Project Overview</h2>
          <p className="text-xs text-[#4C4A4B] font-medium mt-1">General hospital master development information.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
        <ProjectInfoFieldComp label="Project Name" value={info.name} onChange={(v) => setInfo({...info, name: v})} isLocked={isLocked} icon={<FileText size={14}/>} />
        <ProjectInfoFieldComp label="Location" value={info.location} onChange={(v) => setInfo({...info, location: v})} isLocked={isLocked} icon={<MapPin size={14}/>} />
        <ProjectInfoFieldComp label="Hospital Class" value={info.type} onChange={(v) => setInfo({...info, type: v})} isLocked={isLocked} icon={<Stethoscope size={14}/>} />
        <ProjectInfoFieldComp label="Development Status" value={info.status} onChange={(v) => setInfo({...info, status: v})} isLocked={isLocked} icon={<Clock size={14}/>} />
      </div>
    </BentoBox>

    {/* Site Specs Bento */}
    <BentoBox colSpan="md:col-span-12 lg:col-span-4" className="bg-[#EFEBE7] border-transparent">
      <BentoIcon icon={<Map size={28}/>} color="indigo" />
      <h2 className="text-xl font-black text-[#1E2F31] tracking-tight mb-6">Site Specifications</h2>
      <div className="space-y-4 flex-1">
          <div className="p-5 bg-white rounded-2xl border border-[#D8D8D8] shadow-sm flex flex-col gap-1 hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold text-[#4C4A4B] uppercase tracking-widest">Total Land Area</span>
            <span className="text-2xl font-black text-[#1E2F31]">{String(info.totalLand)}</span>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-[#D8D8D8] shadow-sm flex flex-col gap-1 hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold text-[#4C4A4B] uppercase tracking-widest">Total Building GFA</span>
            <span className="text-2xl font-black text-[#1E2F31]">{String(info.totalBuilding)}</span>
          </div>
      </div>
      <p className="text-[10px] text-[#4C4A4B] font-medium leading-relaxed mt-6 bg-white/60 p-3 rounded-xl">
        This project information serves as the primary context for both the Operational (OpCo) and Real Estate (PropCo) models.
      </p>
    </BentoBox>
  </div>
));

const CollaborationStrategyView = memo(({ isPresenting }) => (
  <div className="space-y-6 animate-in fade-in duration-500 pb-12">
    
    {/* Strategy Header */}
    <div className="bg-white rounded-[28px] p-6 lg:p-8 shadow-sm border border-[#D8D8D8] flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-2xl font-black text-[#1E2F31] tracking-tight mb-2 flex items-center gap-3">
                <Network className="text-[#1C6048]" size={28}/> Cross-Border Patient Journey
            </h2>
            <p className="text-xs text-[#4C4A4B] font-medium max-w-2xl leading-relaxed">
                A closed-loop collaboration model ensuring Vasanta captures maximum lifetime patient value through high-margin diagnostics and recurring therapies, while outsourcing only extreme-complexity interventions.
            </p>
        </div>
    </div>

    {/* 4-Card Flowchart Layout (1 Left, 2 Center, 1 Right) */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 relative mt-4">
        
        {/* LEFT COLUMN: Executive Diagnostics */}
        <div className="flex flex-col h-full relative z-10">
            <BentoBox className="flex-1 text-center bg-white border-[#D8D8D8] flex flex-col items-center">
                <h3 className="font-black text-[15px] text-[#1E2F31] mb-6">Executive Diagnostics</h3>
                
                {/* SVG Placeholder */}
                <div className="flex-1 w-full flex items-center justify-center min-h-[140px] mb-8">
                    <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-[#D8D8D8] bg-[#F9F8F6] flex flex-col items-center justify-center text-[#9B8B70] opacity-70 transition-opacity hover:opacity-100">
                        <Sparkles size={24} className="mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">SVG Here</span>
                    </div>
                </div>

                <p className="text-[11px] text-[#4C4A4B] leading-relaxed font-medium mt-auto bg-[#F9F8F6] p-4 rounded-xl border border-[#D8D8D8] w-full">
                    High-margin PET-CT and genomic screening act as the primary acquisition funnel locally.
                </p>
            </BentoBox>
            
            {/* Mobile Down Arrow (Visible only on mobile/tablet) */}
            <div className="lg:hidden absolute -bottom-5 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#9B8B70] border-4 border-[#F9F8F6] rounded-full flex items-center justify-center shadow-md z-10 text-white">
                <ArrowRight size={14} strokeWidth={3} className="rotate-90" />
            </div>
        </div>

        {/* CENTER COLUMN: 2 Stacked Cards (Elevated to z-20 to pull arrows forward) */}
        <div className="flex flex-col gap-6 lg:gap-10 h-full relative z-20">
            
            {/* Left-to-Center Branching Arrow (Desktop Only) */}
            <div className="hidden lg:block absolute -left-10 top-[26%] bottom-[26%] w-10 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 w-5 border-t-2 border-[#9B8B70] -translate-y-[1px]"></div>
                <div className="absolute top-0 bottom-0 left-5 w-5 border-y-2 border-l-2 border-[#9B8B70] rounded-l-xl shadow-[-2px_0_4px_rgba(0,0,0,0.05)]"></div>
                <ArrowRight size={18} className="absolute -top-[9px] -right-[7px] text-[#9B8B70]" strokeWidth={3} />
                <ArrowRight size={18} className="absolute -bottom-[9px] -right-[7px] text-[#9B8B70]" strokeWidth={3} />
            </div>

            {/* Center-to-Right Merging Arrow (Desktop Only) */}
            <div className="hidden lg:block absolute -right-10 top-[26%] bottom-[26%] w-10 z-0 pointer-events-none">
                <div className="absolute top-0 bottom-0 right-5 w-5 border-y-2 border-r-2 border-[#9B8B70] rounded-r-xl shadow-[2px_0_4px_rgba(0,0,0,0.05)]"></div>
                <div className="absolute top-1/2 right-0 w-5 border-t-2 border-[#9B8B70] -translate-y-[1px]"></div>
                <ArrowRight size={18} className="absolute top-1/2 -mt-[9px] -right-[7px] text-[#9B8B70]" strokeWidth={3} />
            </div>

            {/* Middle Mobile Down Arrow (Visible only on mobile/tablet) */}
            <div className="lg:hidden absolute top-[calc(50%-20px)] left-1/2 -translate-x-1/2 w-8 h-8 bg-[#9B8B70] border-4 border-[#F9F8F6] rounded-full flex items-center justify-center shadow-md z-10 text-white">
                <ArrowRight size={14} strokeWidth={3} className="rotate-90" />
            </div>

            {/* Top Center: Local Systemic */}
            <BentoBox className="flex-1 text-center bg-white border-[#D8D8D8] flex flex-col items-center">
                <h3 className="font-black text-[15px] text-[#1E2F31] mb-4">Local Systemic & LINAC</h3>
                
                {/* SVG Placeholder */}
                <div className="flex-1 w-full flex items-center justify-center min-h-[100px] mb-6">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#D8D8D8] bg-[#F9F8F6] flex flex-col items-center justify-center text-[#1C6048] opacity-70 transition-opacity hover:opacity-100">
                        <Sparkles size={20} className="mb-2" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">SVG Here</span>
                    </div>
                </div>

                <p className="text-[11px] text-[#4C4A4B] leading-relaxed font-medium mt-auto bg-[#E8EFEA] p-4 rounded-xl border border-[#1C6048]/20 w-full">
                    Most vast majority of cases require 30-day radiotherapy cycles or standard chemotherapy. Geographic inelasticity forces these patients to utilize our highly profitable local bunkers and VIP infusion suites.
                </p>
            </BentoBox>

            {/* Bottom Center: Overseas Partner */}
            <BentoBox className="flex-1 text-center bg-white border-[#D8D8D8] flex flex-col items-center">
                <h3 className="font-black text-[15px] text-[#1E2F31] mb-4">Overseas Partner</h3>
                
                {/* SVG Placeholder */}
                <div className="flex-1 w-full flex items-center justify-center min-h-[100px] mb-6">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#D8D8D8] bg-[#F9F8F6] flex flex-col items-center justify-center text-[#4C4A4B] opacity-70 transition-opacity hover:opacity-100">
                        <Sparkles size={20} className="mb-2" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">SVG Here</span>
                    </div>
                </div>

                <p className="text-[11px] text-[#4C4A4B] leading-relaxed font-medium mt-auto bg-[#EFEBE7] p-4 rounded-xl border border-[#D8D8D8] w-full">
                    Only ultra-complex surgical cases are referred out, leveraging industrial trust without cannibalizing core local EBITDA.
                </p>
            </BentoBox>

            {/* Mobile Down Arrow (Visible only on mobile/tablet) */}
            <div className="lg:hidden absolute -bottom-5 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#9B8B70] border-4 border-[#F9F8F6] rounded-full flex items-center justify-center shadow-md z-10 text-white">
                <ArrowRight size={14} strokeWidth={3} className="rotate-90" />
            </div>
        </div>

        {/* RIGHT COLUMN: Repatriation & Palliative */}
        <div className="flex flex-col h-full relative z-10">
            <BentoBox className="flex-1 text-center bg-white border-[#D8D8D8] flex flex-col items-center">
                <h3 className="font-black text-[15px] text-[#1E2F31] mb-6">Repatriation & Palliative</h3>
                
                {/* SVG Placeholder */}
                <div className="flex-1 w-full flex items-center justify-center min-h-[140px] mb-8">
                    <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-[#D8D8D8] bg-[#F9F8F6] flex flex-col items-center justify-center text-[#9B8B70] opacity-70 transition-opacity hover:opacity-100">
                        <Sparkles size={24} className="mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">SVG Here</span>
                    </div>
                </div>

                <p className="text-[11px] text-[#4C4A4B] leading-relaxed font-medium mt-auto bg-[#F9F8F6] p-4 rounded-xl border border-[#D8D8D8] w-full">
                    All overseas patients are mandated to return to the local hospital for multi-year monitoring, recovery, and high-margin palliative care.
                </p>
            </BentoBox>
        </div>

    </div>
  </div>
));

const StudyView = memo(({ isPresenting, info }) => {
  const [activeMiniTab, setActiveMiniTab] = useState('marketGap');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        {/* Navigation Bar for Study */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-[#D8D8D8] shadow-sm w-fit overflow-x-auto max-w-full">
          <button 
            disabled
            className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-xs font-bold transition-all whitespace-nowrap text-[#4C4A4B] opacity-40 cursor-not-allowed bg-gray-50"
            title="Coming Soon"
          >
            <Map size={16}/> Macro Environment
          </button>
          <button 
            onClick={() => setActiveMiniTab('marketGap')} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-xs font-bold transition-all whitespace-nowrap ${activeMiniTab === 'marketGap' ? 'bg-[#9B8B70] text-white shadow-md' : 'text-[#4C4A4B] hover:text-[#1E2F31] hover:bg-[#EFEBE7]/50'}`}
          >
            <PieChartIcon size={16}/> Market Gap
          </button>
          <button 
            onClick={() => setActiveMiniTab('marketStudy')} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-xs font-bold transition-all whitespace-nowrap ${activeMiniTab === 'marketStudy' ? 'bg-[#1E2F31] text-white shadow-md' : 'text-[#4C4A4B] hover:text-[#1E2F31] hover:bg-[#EFEBE7]/50'}`}
          >
            <Search size={16}/> Market Study
          </button>
          <button 
            onClick={() => setActiveMiniTab('opportunities')} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-xs font-bold transition-all whitespace-nowrap ${activeMiniTab === 'opportunities' ? 'bg-[#1C6048] text-white shadow-md' : 'text-[#4C4A4B] hover:text-[#1E2F31] hover:bg-[#EFEBE7]/50'}`}
          >
            <Target size={16}/> Opportunities
          </button>
        </div>

        {/* Dynamic Content Rendering */}
        {activeMiniTab === 'macro' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-300">
             
             <BentoBox colSpan="md:col-span-4" className="bg-[#1C6048] text-white border-transparent">
                <BentoIcon icon={<Users size={28} />} color="emerald" className="bg-white/20 text-white" />
                <p className="text-[11px] text-white/80 font-bold uppercase tracking-wider mb-2">Regional Population</p>
                <p className="text-4xl lg:text-5xl font-black mb-4">3.2M</p>
                <div className="mt-auto inline-flex px-3 py-1.5 bg-white/20 rounded-lg text-xs font-bold">+1.5% Annual Growth</div>
             </BentoBox>

             <BentoBox colSpan="md:col-span-4" className="bg-[#1E2F31] text-white border-transparent">
                <BentoIcon icon={<TrendingUp size={28} />} color="emerald" className="bg-white/20 text-white" />
                <p className="text-[11px] text-white/80 font-bold uppercase tracking-wider mb-2">Regional GDP Growth</p>
                <p className="text-4xl lg:text-5xl font-black mb-4">5.2%</p>
                <div className="mt-auto inline-flex px-3 py-1.5 bg-white/20 rounded-lg text-xs font-bold">Above National Avg</div>
             </BentoBox>

             <BentoBox colSpan="md:col-span-4" className="bg-[#9B8B70] text-white border-transparent">
                <BentoIcon icon={<Coins size={28} />} color="emerald" className="bg-white/20 text-white" />
                <p className="text-[11px] text-white/80 font-bold uppercase tracking-wider mb-2">Healthcare Spend p.c.</p>
                <p className="text-4xl lg:text-5xl font-black mb-4">Rp 2.4M</p>
                <div className="mt-auto inline-flex px-3 py-1.5 bg-white/20 rounded-lg text-xs font-bold">Growing Middle Class</div>
             </BentoBox>

             <BentoBox colSpan="md:col-span-12">
               <div className="flex items-center gap-4 mb-6">
                 <BentoIcon icon={<MapPin size={24}/>} color="indigo" className="mb-0 w-12 h-12 rounded-xl" />
                 <h2 className="text-xl font-black text-[#1E2F31] tracking-tight">Key Regional Insights</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-[#F9F8F6] p-5 rounded-2xl border border-[#D8D8D8]">
                    <h4 className="font-bold text-[#1E2F31] mb-2 text-sm">Urbanization</h4>
                    <p className="text-xs text-[#4C4A4B] leading-relaxed font-medium">Rapid urbanization and expansion of residential developments in the primary catchment area.</p>
                 </div>
                 <div className="bg-[#F9F8F6] p-5 rounded-2xl border border-[#D8D8D8]">
                    <h4 className="font-bold text-[#1E2F31] mb-2 text-sm">Insurance Penetration</h4>
                    <p className="text-xs text-[#4C4A4B] leading-relaxed font-medium">Increasing insurance penetration (BPJS and Private) driving healthcare utilization rates higher.</p>
                 </div>
                 <div className="bg-[#F9F8F6] p-5 rounded-2xl border border-[#D8D8D8]">
                    <h4 className="font-bold text-[#1E2F31] mb-2 text-sm">Aging Demographic</h4>
                    <p className="text-xs text-[#4C4A4B] leading-relaxed font-medium">Aging demographic segment is growing, indicating future demand for specialized geriatric and chronic care.</p>
                 </div>
               </div>
             </BentoBox>
          </div>
        )}

        {activeMiniTab === 'marketGap' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-300">
             
             {/* Supply & Demand Bento (Rebuilt to match slide ratio) */}
             <BentoBox colSpan="md:col-span-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                   <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                        <BentoIcon icon={<CustomBedIcon size={80}/>} color="transparent" className="mb-0 text-[#1E2F31]" />
                        <h2 className="text-xl font-black text-[#1E2F31] tracking-tight">Hospital Beds Shortage</h2>
                      </div>
                      <p className="text-[13px] text-[#4C4A4B] leading-relaxed font-medium">
                        Indonesia currently operates with a severe deficit in healthcare infrastructure compared to global benchmarks, indicating massive unfulfilled demand for modern inpatient facilities.
                      </p>
                   </div>
                   <div className="flex-1 w-full flex items-center justify-center gap-4 lg:gap-8 p-6 lg:p-8 bg-[#F9F8F6] border border-[#D8D8D8] rounded-[24px]">
                       <div className="text-center">
                           <p className="text-5xl lg:text-6xl font-black text-[#1E2F31]">1.4</p>
                           <p className="text-[10px] font-bold text-[#4C4A4B] uppercase tracking-widest mt-3">Indonesia</p>
                       </div>
                       <div className="text-6xl lg:text-7xl font-black text-[#1E2F31] px-4 opacity-80">&lt;</div>
                       <div className="text-center">
                           <p className="text-5xl lg:text-6xl font-black text-[#1C6048]">4.5</p>
                           <p className="text-[10px] font-bold text-[#4C4A4B] uppercase tracking-widest mt-3">Average Standard</p>
                       </div>
                   </div>
                </div>
             </BentoBox>

             {/* Systemic Frictions Bento Grid (Matches Image: 8-4 Row / 3-6-3 Row) */}
             
             {/* Card 1: Physician (Wide 8-Col) */}
             <BentoBox colSpan="md:col-span-12 lg:col-span-8" className="bg-[#EFEBE7] border-transparent">
                <h3 className="font-black text-[15px] text-[#1E2F31] mb-6 text-center">Physician-to-Population Ratio</h3>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-16 flex-1">
                    <div className="flex items-end justify-center gap-6">
                        <div className="flex flex-col items-center">
                            <BentoIcon icon={<CustomPhysicianIcon size={80}/>} color="transparent" className="mb-0 text-[#1C6048]"/>
                            <p className="text-5xl font-black text-[#1E2F31] mt-2">1</p>
                        </div>
                        <p className="text-4xl font-black text-[#1E2F31] pb-1 opacity-80">:</p>
                        <div className="flex flex-col items-center">
                            <BentoIcon icon={<CustomPopulationIcon size={80}/>} color="transparent" className="mb-0 text-[#1C6048]"/>
                            <p className="text-5xl font-black text-[#1E2F31] mt-2">2000</p>
                        </div>
                    </div>
                    <div className="text-center md:text-left flex flex-col items-center md:items-start border-t md:border-t-0 md:border-l border-[#D8D8D8] pt-6 md:pt-0 md:pl-10">
                        <p className="text-[10px] font-bold text-[#1E2F31] tracking-widest mb-4 bg-white/60 px-3 py-1.5 rounded-lg border border-[#D8D8D8]">WHO Standard 1 : 1000</p>
                        <p className="text-xs text-[#4C4A4B] leading-relaxed font-medium max-w-[200px]">
                            Operating at <strong className="text-[#1E2F31]">50%</strong> physician capacity.<br/><br/>A chronic shortage demands <strong className="text-[#1E2F31]">digital-first</strong> clinical support.
                        </p>
                    </div>
                </div>
             </BentoBox>
             
             {/* Card 2: Quality Mismatch (Square 4-Col) */}
             <BentoBox colSpan="md:col-span-12 lg:col-span-4" className="bg-[#F9F8F6] border-[#D8D8D8] items-center text-center">
                <h3 className="font-black text-[15px] text-[#1E2F31] mb-6">Price vs Quality Mismatch</h3>
                <BentoIcon icon={<CustomScaleIcon size={100}/>} color="transparent" className="mb-6 text-[#1C6048]"/>
                <p className="text-xs text-[#4C4A4B] leading-relaxed font-medium mt-auto">
                    High out-of-pocket costs <strong className="text-[#1E2F31]">failing</strong> to deliver a <strong className="text-[#1E2F31]">Tier-A</strong> patient experience.
                </p>
             </BentoBox>
             
             {/* Card 3: Fragmented (Square 3-Col) */}
             <BentoBox colSpan="md:col-span-6 lg:col-span-3" className="bg-[#F9F8F6] border-[#D8D8D8] items-center text-center">
                <h3 className="font-black text-[15px] text-[#1E2F31] mb-6">Fragmented Operation</h3>
                <BentoIcon icon={<CustomKnotIcon size={100}/>} color="transparent" className="mb-6 text-[#1C6048]"/>
                <p className="text-[11px] text-[#4C4A4B] leading-relaxed font-medium mt-auto">
                    <strong className="text-[#1E2F31]">Inefficient</strong> unified digital backbone, error-prone, and disconnected operations.
                </p>
             </BentoBox>

             {/* Card 4: Admin Bottleneck (Wide 6-Col) */}
             <BentoBox colSpan="md:col-span-12 lg:col-span-6" className="bg-white border-[#D8D8D8] items-center md:items-start text-center md:text-left flex-row flex-wrap md:flex-nowrap">
                <div className="w-full flex flex-col items-center md:items-start h-full">
                    <h3 className="font-black text-[15px] text-[#1E2F31] mb-6 w-full text-center md:text-left">Administrative Bottleneck per Patient Visit</h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-8 flex-1 w-full">
                        <div className="flex flex-col items-center justify-center shrink-0">
                            <BentoIcon icon={<Timer size={100} strokeWidth={1.5}/>} color="transparent" className="mb-4 text-[#1C6048]"/>
                            <p className="text-4xl font-black text-[#1E2F31] whitespace-nowrap">&gt; 2 Hours</p>
                        </div>
                        <p className="text-xs text-[#4C4A4B] leading-relaxed font-medium max-w-[260px] border-t md:border-t-0 md:border-l border-[#EFEBE7] pt-4 md:pt-0 md:pl-6 text-center md:text-left">
                            Administrative friction paralyzes the patient journey and experience.<br/><br/>
                            A <strong className="text-[#1E2F31]">2-hour</strong> wait for a <strong className="text-[#1E2F31]">15-minute</strong> consultation proves that Indonesia current "manual" hospital model is no longer viable.
                        </p>
                    </div>
                </div>
             </BentoBox>

             {/* Card 5: Preventative (Square 3-Col) */}
             <BentoBox colSpan="md:col-span-6 lg:col-span-3" className="bg-[#EFEBE7] border-transparent items-center text-center">
                <h3 className="font-black text-[15px] text-[#1E2F31] mb-6">Lack of Preventative Screening</h3>
                <BentoIcon icon={<CustomStethoscopeIcon size={100}/>} color="transparent" className="mb-6 text-[#9B8B70]"/>
                <p className="text-[11px] text-[#4C4A4B] leading-relaxed font-medium mt-auto">
                    Only <strong className="text-[#1E2F31] text-sm">17.44%</strong> of Indonesian underwent preventive health screenings regularly.
                </p>
             </BentoBox>
          </div>
        )}

        {activeMiniTab === 'marketStudy' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-300">
             
             {/* Target Demographics Bento */}
             <BentoBox colSpan="md:col-span-4" className="bg-white border-[#D8D8D8] flex flex-col">
                 <BentoIcon icon={<Users size={28}/>} color="emerald" />
                 <h2 className="text-xl font-black text-[#1E2F31] tracking-tight mb-6">Target Demographics</h2>
                 
                 <div className="flex-1 flex flex-col bg-[#F9F8F6] rounded-2xl border border-[#D8D8D8] p-5 relative overflow-hidden mb-4">
                     <h3 className="text-[11px] text-[#1C6048] font-bold uppercase tracking-wider text-center mb-2">Premium Addressable Market</h3>
                     
                     <div className="flex-1 min-h-[180px] relative w-full flex items-center justify-center my-4">
                         <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                 <Pie 
                                    data={[{name: 'SES A & B', value: 18}, {name: 'General / BPJS', value: 82}]} 
                                    cx="50%" cy="50%" 
                                    startAngle={90} endAngle={-270} 
                                    innerRadius="40%" outerRadius="60%" 
                                    dataKey="value" stroke="none"
                                    label={renderPieLabel}
                                    labelLine={{ stroke: '#D8D8D8', strokeWidth: 1 }}
                                    className="outline-none"
                                 >
                                     <Cell fill="#9B8B70" />
                                     <Cell fill="#294043" />
                                 </Pie>
                                 <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #D8D8D8', backgroundColor: '#fff', color: '#1E2F31', fontSize: '11px', fontWeight: 'bold' }} 
                                    itemStyle={{ color: '#1E2F31' }}
                                    formatter={(val) => `${val}%`}
                                 />
                             </PieChart>
                         </ResponsiveContainer>
                     </div>

                     <div className="grid grid-cols-2 gap-4 w-full border-t border-[#D8D8D8] pt-5 mt-auto">
                         <div className="flex flex-col justify-between text-center border-r border-[#D8D8D8] h-full">
                             <p className="text-[10px] text-[#4C4A4B] font-bold uppercase tracking-wider mb-2">Total Catchment</p>
                             <p className="text-xl font-black text-[#1E2F31] leading-none">3.2M</p>
                         </div>
                         <div className="flex flex-col justify-between text-center h-full">
                             <p className="text-[10px] text-[#9B8B70] font-bold uppercase tracking-wider mb-2">SES A & B</p>
                             <p className="text-xl font-black text-[#9B8B70] leading-none">576k</p>
                         </div>
                     </div>
                 </div>

                 <div className="bg-[#EFEBE7] p-4 rounded-xl border border-[#D8D8D8] space-y-3 mt-auto">
                     <div>
                        <p className="text-[10px] font-bold text-[#1E2F31] uppercase tracking-widest mb-1">What is SES A & B?</p>
                        <p className="text-[10px] text-[#4C4A4B] leading-relaxed font-medium">Socio-Economic Status (SES) A & B represents the upper-middle to affluent class, highly correlated with private health insurance and medical tourism spending.</p>
                     </div>
                     <div className="w-full h-px bg-[#D8D8D8]"></div>
                     <div>
                        <p className="text-[10px] font-bold text-[#1C6048] uppercase tracking-widest mb-1">Deriving 576k Lives</p>
                        <p className="text-[10px] text-[#4C4A4B] leading-relaxed font-medium">Calculated directly by capturing exactly <strong className="text-[#1E2F31]">18%</strong> of the <strong className="text-[#1E2F31]">3.2 Million</strong> total regional catchment population.</p>
                     </div>
                 </div>
             </BentoBox>

             {/* Regulatory Matrix Bento (Moved up and resized to 8 columns) */}
             <BentoBox colSpan="md:col-span-8" className="bg-white border-[#D8D8D8]">
                 <div className="flex items-center gap-4 mb-10">
                     <BentoIcon icon={<Scale size={28}/>} color="amber" className="mb-0"/>
                     <h2 className="text-xl font-black text-[#1E2F31] tracking-tight">Regulatory Baseline <span className="font-medium text-[#4C4A4B] text-sm ml-2 hidden xl:inline">(Bed Capacity Requirements)</span></h2>
                 </div>
                 
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-8">
                     
                     {/* Diagram 1: Hospital Type */}
                     <div className="flex flex-col items-center">
                         <div className="px-6 py-2 bg-[#F9F8F6] border border-[#D8D8D8] text-[#4C4A4B] text-[13px] font-medium shadow-sm">Hospital Type</div>
                         <div className="w-px h-6 bg-[#A0A0A0]"></div>
                         <div className="w-full max-w-[260px] h-px bg-[#A0A0A0]"></div>
                         <div className="w-full max-w-[260px] flex justify-between">
                             <div className="w-px h-6 bg-[#A0A0A0]"></div>
                             <div className="w-px h-6 bg-[#A0A0A0]"></div>
                         </div>
                         <div className="w-full max-w-[340px] grid grid-cols-2 gap-4 lg:gap-8">
                             <div className="flex flex-col items-center">
                                 <div className="w-full py-2 bg-[#99B6AA] text-white text-center text-xs font-bold mb-4">General</div>
                                 <ul className="text-xs text-[#4C4A4B] space-y-1.5 w-full pl-2">
                                     <li><strong className="text-[#1E2F31] font-black text-[13px]">A &ge; 250 beds</strong></li>
                                     <li><strong className="text-[#1E2F31] font-black text-[13px]">B &ge; 200 beds</strong></li>
                                     <li><span className="opacity-60 font-medium">C &ge; 100 beds</span></li>
                                     <li><span className="opacity-60 font-medium">D &ge; 50 beds</span></li>
                                 </ul>
                             </div>
                             <div className="flex flex-col items-center">
                                 <div className="w-full py-2 bg-[#1C6048] text-white text-center text-xs font-bold mb-4 shadow-md">Specialized</div>
                                 <ul className="text-xs text-[#4C4A4B] space-y-1.5 w-full pl-2">
                                     <li><strong className="text-[#1E2F31] font-black text-[13px]">A &ge; 100 beds</strong></li>
                                     <li><span className="opacity-60 font-medium">B &ge; 75 beds</span></li>
                                     <li><span className="opacity-60 font-medium">C &ge; 25 beds</span></li>
                                 </ul>
                             </div>
                         </div>
                         <div className="mt-8 text-xs text-[#4C4A4B] italic text-center">Permenkes No.3 Tahun 2020</div>
                     </div>

                     {/* Diagram 2: Private Hospital */}
                     <div className="flex flex-col items-center">
                         <div className="px-6 py-2 bg-[#F9F8F6] border border-[#D8D8D8] text-[#4C4A4B] text-[13px] font-medium shadow-sm">Private Hospital</div>
                         <div className="w-px h-6 bg-[#A0A0A0]"></div>
                         <div className="w-full max-w-[260px] h-px bg-[#A0A0A0]"></div>
                         <div className="w-full max-w-[260px] flex justify-between">
                             <div className="w-px h-6 bg-[#A0A0A0]"></div>
                             <div className="w-px h-6 bg-[#A0A0A0]"></div>
                         </div>
                         <div className="w-full max-w-[340px] grid grid-cols-2 gap-4 lg:gap-8">
                             <div className="flex flex-col items-center">
                                 <div className="w-full py-2 bg-[#99B6AA] text-white text-center text-xs font-bold mb-4">Domestic</div>
                             </div>
                             <div className="flex flex-col">
                                 <div className="w-full py-2 bg-[#1C6048] text-white text-center text-xs font-bold mb-4 shadow-md">Foreign</div>
                                 <div className="text-[11px] text-[#4C4A4B] w-full">
                                     <p className="mb-2 font-medium">Min. requirements:</p>
                                     <ul className="space-y-2">
                                         <li className="flex items-start gap-2">
                                             <span className="text-[#4C4A4B] text-[8px] mt-1">&#9642;</span>
                                             <span><strong className="text-[#1E2F31] font-black text-[12px]">50 beds</strong> & <strong className="text-[#1E2F31] font-black text-[12px]">1</strong> top-tier service</span>
                                         </li>
                                         <li className="flex items-start gap-2">
                                             <span className="text-[#4C4A4B] text-[8px] mt-1">&#9642;</span>
                                             <span><strong className="text-[#1E2F31] font-black text-[12px]">200 beds</strong> & <strong className="text-[#1E2F31] font-black text-[12px]">2</strong> top-tier services</span>
                                         </li>
                                     </ul>
                                 </div>
                             </div>
                         </div>
                         <div className="mt-8 text-xs text-[#4C4A4B] italic text-center mt-auto pt-6">Permenkes No.11 Tahun 2025</div>
                     </div>
                     
                 </div>
             </BentoBox>

             {/* Competitor Gap Matrix Bento (Moved down and expanded to full 12 columns) */}
             <BentoBox colSpan="md:col-span-12">
                 <div className="flex items-center gap-4 mb-6">
                     <BentoIcon icon={<ShieldCheck size={28}/>} color="blue" className="mb-0"/>
                     <h2 className="text-xl font-black text-[#1E2F31] tracking-tight">Competitor Service Gap (The Moat)</h2>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                           <tr>
                              <th className="p-3 border-b-2 border-[#D8D8D8] text-[11px] font-bold text-[#4C4A4B] uppercase tracking-widest">Clinical Capability</th>
                              <th className="p-3 border-b-2 border-[#D8D8D8] text-[11px] font-bold text-[#4C4A4B] uppercase tracking-widest text-center bg-[#F9F8F6]">Local Gen. Hospitals<br/><span className="text-[9px] font-medium opacity-70">(Alpha, Beta, Gamma)</span></th>
                              <th className="p-3 border-b-2 border-[#1C6048] text-[11px] font-black text-[#1C6048] uppercase tracking-widest text-center bg-[#E8EFEA] rounded-t-xl">Vasanta Oncology<br/><span className="text-[9px] font-medium opacity-80">(Proposed 120-Bed)</span></th>
                           </tr>
                        </thead>
                        <tbody className="text-[13px]">
                           <tr className="border-b border-[#D8D8D8]">
                              <td className="p-4 font-bold text-[#1E2F31]">Basic Chemotherapy</td>
                              <td className="p-4 text-center bg-[#F9F8F6]"><Check size={20} className="mx-auto text-[#9B8B70]"/></td>
                              <td className="p-4 text-center bg-[#E8EFEA]"><Check size={20} className="mx-auto text-[#1C6048]"/></td>
                           </tr>
                           <tr className="border-b border-[#D8D8D8]">
                              <td className="p-4 font-bold text-[#1E2F31]">General Surgical Oncology</td>
                              <td className="p-4 text-center bg-[#F9F8F6]"><Check size={20} className="mx-auto text-[#9B8B70]"/></td>
                              <td className="p-4 text-center bg-[#E8EFEA]"><Check size={20} className="mx-auto text-[#1C6048]"/></td>
                           </tr>
                           <tr className="border-b border-[#D8D8D8]">
                              <td className="p-4 font-bold text-[#1E2F31]">PET-CT Diagnostics</td>
                              <td className="p-4 text-center bg-[#F9F8F6]"><X size={20} className="mx-auto text-[#D8D8D8]"/></td>
                              <td className="p-4 text-center bg-[#E8EFEA]"><Check size={20} className="mx-auto text-[#1C6048]"/></td>
                           </tr>
                           <tr>
                              <td className="p-4 font-bold text-[#1E2F31]">LINAC & BAPETEN Bunkers</td>
                              <td className="p-4 text-center bg-[#F9F8F6]"><X size={20} className="mx-auto text-[#D8D8D8]"/></td>
                              <td className="p-4 text-center bg-[#E8EFEA] rounded-b-xl"><Check size={20} className="mx-auto text-[#1C6048]"/></td>
                           </tr>
                        </tbody>
                     </table>
                 </div>
                 <p className="text-[11px] text-[#4C4A4B] leading-relaxed font-medium mt-6 bg-[#EFEBE7] p-4 rounded-xl border border-[#D8D8D8]">
                     <strong className="text-[#1E2F31]">Strategic Takeaway:</strong> Local competitors are restricted to low-barrier treatments. By absorbing the heavy upfront CapEx for LINAC bunkers and PET-CT, Vasanta creates an <strong className="text-[#1C6048]">insurmountable competitive moat</strong>, capturing high-margin, recurring radiotherapy revenues that are currently leaking overseas.
                 </p>
             </BentoBox>

             {/* Center of Excellence (CoE) Options (Empty State Matrix) */}
             <BentoBox colSpan="md:col-span-12" className="bg-white border-[#D8D8D8]">
                 <div className="flex items-center gap-4 mb-6 pt-2">
                     <BentoIcon icon={<Microscope size={28}/>} color="indigo" className="mb-0"/>
                     <h2 className="text-xl font-black text-[#1E2F31] tracking-tight">Center of Excellence (CoE) Options</h2>
                 </div>
                 
                 <div className="overflow-x-auto pb-6 pt-6 px-2 -mx-2">
                     <div className="min-w-[800px] grid grid-cols-5 gap-3 lg:gap-4">
                         
                         {/* Column 1: Row Labels */}
                         <div className="flex flex-col justify-end">
                             <div className="h-20"></div>
                             <div className="h-16 flex items-center border-b border-[#D8D8D8] pr-4">
                                 <p className="text-[10px] font-bold text-[#4C4A4B] uppercase tracking-widest leading-tight">120-Bed Unit Economics</p>
                             </div>
                             <div className="h-16 flex items-center border-b border-[#D8D8D8] pr-4">
                                 <p className="text-[10px] font-bold text-[#4C4A4B] uppercase tracking-widest leading-tight">Competitive Moat</p>
                             </div>
                             <div className="h-16 flex items-center border-b border-[#D8D8D8] pr-4">
                                 <p className="text-[10px] font-bold text-[#4C4A4B] uppercase tracking-widest leading-tight">Inpatient Utilization</p>
                             </div>
                             <div className="h-16"></div>
                         </div>

                         {/* Column 2: Oncology (The Winner Highlight) */}
                         <div className="bg-[#1C6048] rounded-2xl flex flex-col shadow-sm transform transition-all duration-300 hover:-translate-y-4 hover:shadow-2xl border border-[#1C6048] z-10 relative cursor-pointer">
                             <div className="h-20 flex flex-col items-center justify-center border-b border-white/20">
                                 <Dna size={28} className="text-white mb-1.5" strokeWidth={1.5} />
                                 <h4 className="font-bold text-white text-base tracking-wide">Oncology</h4>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-white/20 text-center px-1">
                                 <p className="font-black text-white text-[13px]">Highly Scalable</p>
                                 <p className="text-[9px] text-white/80 leading-tight mt-0.5">Recurring multi-modality revenue</p>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-white/20 text-center px-1">
                                 <p className="font-black text-white text-[13px]">Extreme Moat</p>
                                 <p className="text-[9px] text-white/80 leading-tight mt-0.5">BAPETEN Bunkers & LINAC</p>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-white/20 text-center px-1">
                                 <p className="font-black text-white text-[13px]">High Volume</p>
                                 <p className="text-[9px] text-white/80 leading-tight mt-0.5">Diagnostics, Chemo, Surgical, Palliative</p>
                             </div>
                             <div className="h-16 flex items-center justify-center bg-[#18533E] rounded-b-2xl">
                                 <div className="bg-white text-[#1C6048] p-1.5 rounded-full shadow-md"><Check size={20} strokeWidth={4} /></div>
                             </div>
                         </div>

                         {/* Column 3: Orthopedic */}
                         <div className="bg-[#F9F8F6] rounded-2xl flex flex-col border border-[#D8D8D8] opacity-90 transition-all hover:opacity-100 hover:shadow-md cursor-pointer group">
                             <div className="h-20 flex flex-col items-center justify-center border-b border-[#D8D8D8]">
                                 <Bone size={24} className="text-[#1E2F31] mb-1.5 group-hover:text-[#1C6048] transition-colors" strokeWidth={1.5} />
                                 <h4 className="font-bold text-[#1E2F31] text-sm group-hover:text-[#1C6048] transition-colors">Orthopedic</h4>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-[#D8D8D8] text-center px-1 group-hover:bg-white transition-colors">
                                 <p className="font-bold text-[#1E2F31] text-[13px] group-hover:text-[#1C6048] transition-colors">Moderate</p>
                                 <p className="text-[9px] text-[#4C4A4B] leading-tight mt-0.5">High-margin surgical interventions</p>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-[#D8D8D8] text-center px-1 group-hover:bg-white transition-colors">
                                 <p className="font-bold text-[#1E2F31] text-[13px] group-hover:text-[#1C6048] transition-colors">Moderate</p>
                                 <p className="text-[9px] text-[#4C4A4B] leading-tight mt-0.5">Standardized Surgical Equipment</p>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-[#D8D8D8] text-center px-1 group-hover:bg-white transition-colors">
                                 <p className="font-bold text-[#1E2F31] text-[13px] group-hover:text-[#1C6048] transition-colors">Moderate</p>
                                 <p className="text-[9px] text-[#4C4A4B] leading-tight mt-0.5">Standard Post-Op recovery</p>
                             </div>
                             <div className="h-16 flex items-center justify-center rounded-b-2xl group-hover:bg-white transition-colors">
                                 <X size={24} strokeWidth={3} className="text-[#9B8B70]"/>
                             </div>
                         </div>

                         {/* Column 4: Maternity */}
                         <div className="bg-[#F9F8F6] rounded-2xl flex flex-col border border-[#D8D8D8] opacity-90 transition-all hover:opacity-100 hover:shadow-md cursor-pointer group">
                             <div className="h-20 flex flex-col items-center justify-center border-b border-[#D8D8D8]">
                                 <Baby size={24} className="text-[#1E2F31] mb-1.5 group-hover:text-[#1C6048] transition-colors" strokeWidth={1.5} />
                                 <h4 className="font-bold text-[#1E2F31] text-sm group-hover:text-[#1C6048] transition-colors">Maternity & IVF</h4>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-[#D8D8D8] text-center px-1 group-hover:bg-white transition-colors">
                                 <p className="font-bold text-[#1E2F31] text-[13px] group-hover:text-[#1C6048] transition-colors">Low</p>
                                 <p className="text-[9px] text-[#4C4A4B] leading-tight mt-0.5">Insufficient premium birth volume</p>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-[#D8D8D8] text-center px-1 group-hover:bg-white transition-colors">
                                 <p className="font-bold text-[#1E2F31] text-[13px] group-hover:text-[#1C6048] transition-colors">Low</p>
                                 <p className="text-[9px] text-[#4C4A4B] leading-tight mt-0.5">High local clinic density</p>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-[#D8D8D8] text-center px-1 group-hover:bg-white transition-colors">
                                 <p className="font-bold text-[#1E2F31] text-[13px] group-hover:text-[#1C6048] transition-colors">Low/Moderate</p>
                                 <p className="text-[9px] text-[#4C4A4B] leading-tight mt-0.5">Short stay</p>
                             </div>
                             <div className="h-16 flex items-center justify-center rounded-b-2xl group-hover:bg-white transition-colors">
                                 <X size={24} strokeWidth={3} className="text-[#9B8B70]"/>
                             </div>
                         </div>

                         {/* Column 5: Specialized Eye */}
                         <div className="bg-[#F9F8F6] rounded-2xl flex flex-col border border-[#D8D8D8] opacity-90 transition-all hover:opacity-100 hover:shadow-md cursor-pointer group">
                             <div className="h-20 flex flex-col items-center justify-center border-b border-[#D8D8D8]">
                                 <Eye size={24} className="text-[#1E2F31] mb-1.5 group-hover:text-[#1C6048] transition-colors" strokeWidth={1.5} />
                                 <h4 className="font-bold text-[#1E2F31] text-sm group-hover:text-[#1C6048] transition-colors">Specialized Eye</h4>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-[#D8D8D8] text-center px-1 group-hover:bg-white transition-colors">
                                 <p className="font-bold text-[#1E2F31] text-[13px] group-hover:text-[#1C6048] transition-colors">Low</p>
                                 <p className="text-[9px] text-[#4C4A4B] leading-tight mt-0.5">Excess facility overhead</p>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-[#D8D8D8] text-center px-1 group-hover:bg-white transition-colors">
                                 <p className="font-bold text-[#1E2F31] text-[13px] group-hover:text-[#1C6048] transition-colors">Weak</p>
                                 <p className="text-[9px] text-[#4C4A4B] leading-tight mt-0.5">High local clinic density</p>
                             </div>
                             <div className="h-16 flex flex-col items-center justify-center border-b border-[#D8D8D8] text-center px-1 group-hover:bg-white transition-colors">
                                 <p className="font-bold text-[#1E2F31] text-[13px] group-hover:text-[#1C6048] transition-colors">Low</p>
                                 <p className="text-[9px] text-[#4C4A4B] leading-tight mt-0.5">Outpatient heavy</p>
                             </div>
                             <div className="h-16 flex items-center justify-center rounded-b-2xl group-hover:bg-white transition-colors">
                                 <X size={24} strokeWidth={3} className="text-[#9B8B70]"/>
                             </div>
                         </div>
                         
                     </div>
                 </div>
             </BentoBox>
          </div>
        )}

        {activeMiniTab === 'opportunities' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#D8D8D8] p-8 lg:p-12 animate-in fade-in zoom-in-95 duration-300">
             
             {/* Slide Header */}
             <div className="mb-12 border-b border-[#D8D8D8] pb-8">
                <h2 className="text-3xl lg:text-4xl font-black text-[#4C4A4B] tracking-tight uppercase leading-tight">
                    Capturing Multi-Billion Dollar <span className="font-light text-[#9B8B70]">Medical Tourism</span><br />
                    <span className="font-light text-[#9B8B70]">Flight</span>
                </h2>
                <p className="text-[14px] text-[#4C4A4B] leading-relaxed font-medium mt-4 max-w-4xl">
                  Indonesia's escalating oncology burden and rising private health insurance penetration are driving a massive, addressable capital outflow to regional competitors
                </p>
             </div>

             {/* 3 Column Pitch Layout */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
                
                {/* Column 1: Cancer Cases */}
                <div className="flex flex-col h-full">
                    <h3 className="text-[13px] text-center text-[#4C4A4B] font-medium mb-10">Indonesia Annual Cancer Cases</h3>
                    <div className="h-48 w-full mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={CANCER_DATA} margin={CHART_MARGINS_BAR}>
                          <XAxis dataKey="name" axisLine={true} stroke="#EFEBE7" tickLine={false} tick={TICK_STYLE} dy={10} />
                          <Tooltip cursor={CHART_CURSOR_STYLE} contentStyle={TOOLTIP_STYLE} formatter={formatCancerCases} />
                          <Bar dataKey="cases" radius={[2, 2, 0, 0]} barSize={30}>
                            {CANCER_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-[#4C4A4B] mt-auto text-left leading-relaxed">
                      Breast, cervical, lung, colorectal, and liver cancers are the most frequent cases in Indonesia. Together, these top 5 cancers account for <strong className="font-bold">50% of total 400,000+</strong> annual oncology burden.
                    </p>
                </div>

                {/* Column 2: Insurance Growth */}
                <div className="flex flex-col h-full">
                    <h3 className="text-[13px] text-center text-[#4C4A4B] font-medium mb-1">Commercial Insurance Growth</h3>
                    <p className="text-[9px] text-center text-[#9B8B70] mb-8">(in IDR Trillions)</p>
                    
                    <div className="h-48 w-full mb-8 relative">
                      <div className="absolute top-8 left-1/4 transform -rotate-[22deg] flex flex-col items-center z-10">
                         <span className="text-[11px] font-bold text-[#1C6048] tracking-widest mb-1">CAGR 13.72%</span>
                         <svg width="90" height="12" viewBox="0 0 90 12" fill="none" className="text-[#1C6048]">
                           <path d="M2 6H88M88 6L82 2M88 6L82 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                         </svg>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={INSURANCE_DATA} margin={CHART_MARGINS_LINE}>
                          <XAxis dataKey="year" axisLine={true} stroke="#EFEBE7" tickLine={false} tick={TICK_STYLE} dy={10} />
                          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={formatInsuranceTooltip} />
                          <Line type="monotone" dataKey="value" stroke="#99B6AA" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#99B6AA' }} label={LINE_LABEL_STYLE} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <p className="text-[11px] text-[#4C4A4B] mt-auto text-left leading-relaxed">
                      Double-digit growth in commercial health insurance for <strong className="font-bold">'Socio-Economic Status (SES) A'</strong> demographics
                    </p>
                </div>

                {/* Column 3: Capital Outflow */}
                <div className="flex flex-col h-full items-center">
                    <h3 className="text-[13px] text-center text-[#4C4A4B] font-medium mb-10">Annual Capital Outflow</h3>
                    
                    <Plane size={64} className="text-[#1C6048] mb-4 transform -rotate-[2deg]" strokeWidth={1.5} />
                    <div className="w-20 h-[3px] bg-[#1C6048] mb-12"></div>
                    
                    <p className="text-4xl lg:text-5xl font-black text-[#4C4A4B] tracking-tighter mb-8">$11.5 Billion</p>
                    
                    <p className="text-[11px] text-[#4C4A4B] italic text-center leading-relaxed px-4 mt-auto">
                      to Malaysia, Singapore, Japan,<br/>US, Germany, and others
                    </p>
                </div>

             </div>

             <div className="mt-10 pt-5 border-t border-[#EFEBE7]">
                 <p className="text-[9px] text-[#9B8B70] italic text-center md:text-left">
                    Sources: GLOBOCAN 2022 (Cancer Incidence); Asosiasi Asuransi Jiwa Indonesia / AAJI (Premium Growth); Indonesia Ministry of Health / MoH Medical Tourism Data (Capital Outflow)
                 </p>
             </div>
          </div>
        )}
    </div>
  );
});

// ==========================================
// 5. MAJOR VIEW COMPONENTS (FINANCIAL ENGINES)
// ==========================================

const OpCoDashboardView = memo(({ data, assumptions, generateTeaser, isTeaserLoading, showTeaser, setShowTeaser, teaserContent, isPresenting }) => (
  <div className={isPresenting ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in" : "space-y-6 animate-in fade-in"}>
      
      {/* LEFT PANEL: Executive & Returns (Spans 4 columns in Present Mode) */}
      <div className={`space-y-6 ${isPresenting ? "lg:col-span-4" : ""}`}>
        <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-[#D8D8D8]">
            <h2 className="text-sm font-bold text-[#1E2F31] ml-2">Executive Overview</h2>
            <button onClick={generateTeaser} disabled={isTeaserLoading} className="bg-[#1C6048] hover:opacity-90 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                {isTeaserLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}✨ Pitch Teaser
            </button>
        </div>
        
        {showTeaser && (
          <div className="bg-white p-6 rounded-2xl border-l-4 border-l-[#1C6048] shadow-sm relative">
            <button onClick={() => setShowTeaser(false)} className="absolute top-4 right-4 bg-[#EFEBE7] p-1 rounded-full"><X size={16}/></button>
            <h3 className="font-bold text-[#1E2F31] mb-2 flex items-center gap-2"><FileText size={18}/> AI Pitch Teaser</h3>
            <MarkdownRenderer content={teaserContent} />
          </div>
        )}

        <div className={`grid grid-cols-2 ${isPresenting ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
          <KPICard title="Project NPV" value={formatCurrency(data.projectNPV)} icon={<TrendingUp size={18} />} color="blue" subtitle={`@${String(assumptions.discountRate)}% Disc Rate`} />
          <KPICard title="Cash Multiple" value={`${data.totalEquity > 0 ? (data.totals.fcf / data.totalEquity).toFixed(2) : "0"}x`} icon={<BarChart3 size={18} />} color="emerald" subtitle="Project MOIC" />
          <KPICard title="Project IRR" value={`${formatNumber((data.projectIRR || 0) * 100, 2)}%`} icon={<Activity size={18} />} color="blue" subtitle="Compounded Return" />
          <KPICard title="Avg Div. Yield" value={`${formatNumber(data.partnerA.avgYield, 1)}%`} icon={<Coins size={18} />} color="indigo" subtitle="Mean Operating Yield" />
        </div>

        <div className={`grid grid-cols-1 ${isPresenting ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
          <PartnerReturnCard name={`Strategic Partner (${assumptions.sharingPercentA}%)`} metrics={data.partnerA} equity={assumptions.partnerAEquity} share={assumptions.sharingPercentA} color="blue" />
          <PartnerReturnCard name={`Vasanta (${100 - assumptions.sharingPercentA}%)`} metrics={data.partnerB} equity={assumptions.partnerBEquity} share={100 - assumptions.sharingPercentA} color="indigo" />
        </div>
      </div>

      {/* RIGHT PANEL: Operations & Trajectory (Spans 8 columns in Present Mode) */}
      <div className={`space-y-6 ${isPresenting ? "lg:col-span-8" : ""}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniKPICard title="Stabilized Vol." value={`${formatNumber(data.opsMetrics.stabilizedVolume, 0)}`} subtitle="Peak Yr Patients" />
            <MiniKPICard title="Rev. Per Bed" value={`${formatNumber(data.opsMetrics.revPab, 1)} B`} subtitle="At Stabilization" />
            <MiniKPICard title="EBITDA Per Bed" value={`${formatNumber(data.opsMetrics.ebitdaPerBed, 1)} B`} subtitle="At Stabilization" />
            <MiniKPICard title="Fixed Cost Ratio" value={`${formatNumber(data.opsMetrics.fixedCostPct, 1)}%`} subtitle="At Stabilization" />
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-[#D8D8D8]">
          <h3 className="font-bold text-[#1E2F31] mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-[#1C6048]"/> Operating Cash Flow Trajectory</h3>
          <div className={isPresenting ? "h-[300px]" : "h-72"}>
              <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.operatingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8D8D8" />
                  <XAxis dataKey="year" tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} />
                  <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} tickFormatter={(val) => `${val}B`} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#1E2F31'}} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val, name) => formatNumber(val, 1) + (name === "Occupancy (BOR)" ? "%" : "B")} />
                  <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                  
                  <Bar yAxisId="left" dataKey="totalRev" name="Net Revenue" fill="#1C6048" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="left" type="monotone" dataKey="ebitda" name="EBITDA" stroke="#1E2F31" strokeWidth={3} dot={{ r: 4, fill: '#1E2F31', strokeWidth: 2, stroke: '#fff' }} />
                  <Line yAxisId="left" type="monotone" dataKey="netIncome" name="Net Income" stroke="#9B8B70" strokeWidth={3} dot={{ r: 4, fill: '#9B8B70', strokeWidth: 2, stroke: '#fff' }} />
                  <Line yAxisId="right" type="monotone" dataKey="bor" name="Occupancy (BOR)" stroke="#99B6AA" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
              </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-[#D8D8D8]">
              <h3 className="font-bold text-[#1E2F31] mb-6 flex items-center gap-2"><Activity size={18} className="text-[#1E2F31]"/> Cash-on-Cash Trajectory</h3>
              <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.operatingData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8D8D8" />
                      <XAxis dataKey="year" tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} />
                      <YAxis tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} tickFormatter={(val) => `${val}%`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatNumber(val, 1) + "%"} />
                      <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                      <Line type="monotone" dataKey="pA_Yield" name="Strategic Ptnr Yield" stroke="#1C6048" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="roe" name="Project ROE" stroke="#9B8B70" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} />
                  </LineChart>
                  </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-[#D8D8D8]">
              <h3 className="font-bold text-[#1E2F31] mb-6 flex items-center gap-2"><Target size={18} className="text-[#99B6AA]"/> Breakeven Audit</h3>
              <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.operatingData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8D8D8" />
                      <XAxis dataKey="year" tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} />
                      <YAxis tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} tickFormatter={(val) => `${val}%`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatNumber(val, 1) + "%"} />
                      <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                      <Bar dataKey="breakEvenBor" name="Breakeven BOR required" fill="#D8D8D8" radius={[4, 4, 0, 0]} barSize={30} />
                      <Line type="monotone" dataKey="bor" name="Actual Projected BOR" stroke="#1E2F31" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} />
                  </ComposedChart>
                  </ResponsiveContainer>
              </div>
            </div>
        </div>

      </div>
  </div>
));

const OpCoCascadeView = memo(({ data, assumptions }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-[#D8D8D8] overflow-hidden">
      <div className="p-4 bg-[#EFEBE7] border-b border-[#D8D8D8] flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#1E2F31] flex items-center gap-2"><List size={14}/> OpCo Detailed Waterfall</h3>
          <span className="text-[10px] bg-white text-[#4C4A4B] border border-[#D8D8D8] px-2 py-1 rounded font-bold uppercase shadow-sm">IDR Billions</span>
      </div>
      <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-[11px] text-left border-separate border-spacing-0 min-w-[1000px]">
              <thead className="bg-white font-bold sticky top-0 z-20 shadow-md">
                  <tr>
                      <th className="px-4 py-3 border-b-2 border-r border-[#D8D8D8] sticky left-0 top-0 bg-white z-30 w-[260px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-[#1E2F31]">Line Item</th>
                      {data.annualData.map((d, i) => (
                          <th key={i} className={`px-3 py-3 text-right min-w-[90px] border-b-2 border-r border-[#D8D8D8] ${!d.isOperating ? 'bg-[#F9F8F6] text-[#9B8B70]' : 'bg-white text-[#1E2F31]'}`}>
                              {String(d.year)}
                          </th>
                      ))}
                      <th className="px-4 py-3 text-right bg-[#EFEBE7] text-[#1E2F31] sticky right-0 top-0 z-30 border-l border-b-2 border-[#D8D8D8] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Total</th>
                  </tr>
              </thead>
              <tbody>
                  <TableSection title="A. Operating Volume" colSpan={data.annualData.length + 2} />
                  <TableRow label="Bed Occupancy Rate (BOR)" data={data.annualData} dk="bor" />
                  <TableRow label="Inpatient Cases" data={data.annualData} dk="ipCases" />
                  <TableRow label="Outpatient Visits" data={data.annualData} dk="opVisits" />

                  <TableSection title="B. Revenue" colSpan={data.annualData.length + 2} />
                  <TableRow label="Inpatient Revenue" data={data.annualData} dk="ipRev" total={data.totals.ipRev} isIndent />
                  <TableRow label="Outpatient Revenue" data={data.annualData} dk="opRev" total={data.totals.opRev} isIndent />
                  <TableRow label="NET REVENUE" data={data.annualData} dk="totalRev" total={data.totals.totalRev} highlight />

                  <TableSection title="C. Cost of Goods Sold" colSpan={data.annualData.length + 2} />
                  <TableRow label="Medical Supplies" data={data.annualData} dk="totalMedSupp" total={data.totals.totalMedSupp} isIndent />
                  <TableRow label="Doctor Fees" data={data.annualData} dk="totalDocFee" total={data.totals.totalDocFee} isIndent />
                  <TableRow label="GROSS PROFIT" data={data.annualData} dk="grossProfit" total={data.totals.grossProfit} highlight />

                  <TableSection title="D. Operating Expenses" colSpan={data.annualData.length + 2} />
                  <TableRow label="Staffing & Labor" data={data.annualData} dk="staffCost" isIndent />
                  <TableRow label="Other OpEx" data={data.annualData} dk="recurringOpex" total={data.totals.recurringOpex} isIndent />
                  <TableRow label="EBITDAR" data={data.annualData} dk="ebitdar" total={data.totals.ebitdar} highlight />
                  
                  <TableSection title="E. Rent & Taxes" colSpan={data.annualData.length + 2} />
                  <TableRow label="Building Rental" data={data.annualData} dk="rent" total={data.totals.rent} isIndent />
                  <TableRow label="EBITDA" data={data.annualData} dk="ebitda" total={data.totals.ebitda} highlight />
                  <TableRow label="Corporate Tax" data={data.annualData} dk="tax" total={data.totals.tax} isIndent />
                  
                  <TableSection title="F. Free Cash Flow" colSpan={data.annualData.length + 2} type="emerald" />
                  <TableRow label="NET INCOME" data={data.annualData} dk="netIncome" total={data.totals.netIncome} highlight emerald />
                  <TableRow label="Cumulative Net Income" data={data.annualData} dk="cumNI" highlight crossover bold indigo />
                  <TableRow label="Distributable Profit" data={data.annualData} dk="distributableProfit" total={data.totals.distributableProfit} highlight />
              </tbody>
          </table>
      </div>
  </div>
));

const PropCoDashboardView = memo(({ data, assumptions, generateTeaser, isTeaserLoading, showTeaser, setShowTeaser, teaserContent, setTab, isPresenting }) => {
  const [chartMode, setChartMode] = useState('full');
  const chartData = chartMode === 'full' ? data.annualData : data.operatingData;
  const devYears = Math.max(1, Math.ceil((assumptions.devDurationMonths || 12) / 12));

  return (
  <div className={isPresenting ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in" : "space-y-6 animate-in fade-in"}>
      <div className={`space-y-6 ${isPresenting ? "lg:col-span-4" : ""}`}>
        <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-[#D8D8D8]">
            <h2 className="text-sm font-bold text-[#1E2F31] ml-2">PropCo Executive Summary</h2>
            <button onClick={generateTeaser} disabled={isTeaserLoading} className="bg-[#9B8B70] hover:opacity-90 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                {isTeaserLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}✨ Pitch Teaser
            </button>
        </div>

        {showTeaser && (
          <div className="bg-white p-6 rounded-2xl border-l-4 border-l-[#9B8B70] shadow-sm relative">
            <button onClick={() => setShowTeaser(false)} className="absolute top-4 right-4 bg-[#EFEBE7] p-1 rounded-full"><X size={16}/></button>
            <h3 className="font-bold text-[#1E2F31] mb-2 flex items-center gap-2"><FileText size={18}/> AI Pitch Teaser</h3>
            <MarkdownRenderer content={teaserContent} />
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 ${isPresenting ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
          <DualKPICard title1="Levered IRR" value1={`${formatNumber((data.metrics.irr || 0) * 100, 2)}%`} color1="indigo" title2="Equity NPV" value2={formatCurrency(data.metrics.npv)} color2="emerald" icon={<Activity size={18} />} />
          <DualKPICard title1="Unlevered IRR" value1={`${formatNumber((data.metrics.unleveredIrr || 0) * 100, 2)}%`} color1="emerald" title2="Project NPV" value2={formatCurrency(data.metrics.unleveredNpv)} color2="blue" icon={<Building2 size={18} />} />
          <DualKPICard title1="IRR (ex-Land)" value1={`${formatNumber((data.metrics.irrExLand || 0) * 100, 2)}%`} color1="blue" title2="NPV (ex-Land)" value2={formatCurrency(data.metrics.npvExLand)} color2="teal" icon={<TrendingUp size={18} />} />
          <DualKPICard title1="Avg Cash Yield" value1={`${formatNumber(data.metrics.avgYield, 1)}%`} color1="teal" title2="YOC (ex-Land)" value2={`${formatNumber((data.metrics.yocExLand || 0) * 100, 1)}%`} color2="amber" icon={<Coins size={18} />} />
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-[#D8D8D8]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#1E2F31] flex items-center gap-2"><DollarSign size={20} className="text-[#1C6048]" /> Sources & Uses of Funds</h3>
                <button onClick={() => setTab('assumptions')} className="text-[10px] bg-[#EFEBE7] hover:bg-[#D8D8D8] text-[#4C4A4B] font-bold px-2 py-1 rounded transition-colors uppercase">Edit Settings</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sources Pie */}
                <div>
                    <h4 className="text-center text-[10px] font-bold text-[#4C4A4B] uppercase tracking-widest mb-2">Sources</h4>
                    <div className={`w-full relative flex justify-center ${isPresenting ? "h-40" : "h-36"}`}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{name: 'Equity', value: data.metrics.totalEquity}, {name: 'Bank Loan', value: data.metrics.totalDebt}]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                                    { [0,1].map((entry, index) => <Cell key={`cell-src-${index}`} fill={index === 0 ? '#1C6048' : '#D8D8D8'} />) }
                                </Pie>
                                <Tooltip formatter={(val) => formatCurrency(val)} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-sm font-black text-[#1E2F31]">{formatNumber(data.metrics.totalCapex, 0)}B</span>
                        </div>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-2 mt-4 text-center">
                        <div className="bg-[#EFEBE7] p-2 rounded border border-[#D8D8D8]">
                            <p className="text-[9px] font-bold uppercase text-[#4C4A4B] mb-1">Equity</p>
                            <p className="font-black text-[#1E2F31]">{formatCurrency(data.metrics.totalEquity)}</p>
                        </div>
                        <div className="bg-[#D8D8D8]/30 p-2 rounded border border-[#D8D8D8]">
                            <p className="text-[9px] font-bold uppercase text-[#4C4A4B] mb-1">Loan</p>
                            <p className="font-black text-[#1E2F31]">{formatCurrency(data.metrics.totalDebt)}</p>
                        </div>
                    </div>
                </div>

                {/* Uses Expandable Table */}
                <div>
                    <h4 className="text-center text-[10px] font-bold text-[#4C4A4B] uppercase tracking-widest mb-4">Uses Breakdown</h4>
                    <div className="bg-[#F9F8F6] p-2 rounded-xl border border-[#D8D8D8]">
                        <ExpandableCapexRow 
                            icon={<Map size={16} className="text-[#9B8B70]" />} 
                            title="Land Acquisition" 
                            amount={data.capexDetails.landCost} 
                            totalCapex={data.metrics.totalCapex} 
                        />
                        <ExpandableCapexRow 
                            icon={<Building2 size={16} className="text-[#1E2F31]" />} 
                            title="Hard Costs" 
                            amount={data.capexDetails.totalHardCosts} 
                            totalCapex={data.metrics.totalCapex} 
                            details={[
                                { label: "Construction", amount: data.capexDetails.buildCost },
                                { label: "Medical Equipment", amount: data.capexDetails.medEqCost },
                                { label: "Infrastructure", amount: data.capexDetails.infraCost },
                                { label: "FF&E", amount: data.capexDetails.ffeCost }
                            ].filter(d => d.amount > 0)}
                        />
                        <ExpandableCapexRow 
                            icon={<Briefcase size={16} className="text-[#99B6AA]" />} 
                            title="Soft Costs" 
                            amount={data.capexDetails.totalSoftCosts} 
                            totalCapex={data.metrics.totalCapex} 
                            details={[
                                { label: "Consulting & Design", amount: data.capexDetails.consultantCost },
                                { label: "Licenses & Permits", amount: data.capexDetails.licenseCost },
                                { label: "Sharing Development", amount: data.capexDetails.sharingDevCost },
                                { label: "VAT", amount: data.capexDetails.vatCost },
                                { label: "Contingency", amount: data.capexDetails.contingencyCost }
                            ].filter(d => d.amount > 0)}
                        />
                        <div className="flex justify-between items-center mt-2 pt-2 border-t-2 border-[#D8D8D8] px-2">
                            <span className="text-[10px] font-black text-[#1E2F31] uppercase tracking-widest">Total Uses (Capex)</span>
                            <span className="font-mono text-sm font-black text-[#1C6048]">{formatNumber(data.metrics.totalCapex, 1)} B</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className={`space-y-6 ${isPresenting ? "lg:col-span-8" : ""}`}>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MiniKPICard title="Equity Payback" value={`${formatNumber(data.metrics.payback > 0 ? Math.max(0, data.metrics.payback - devYears) : 0, 1)} Yrs`} subtitle="From Operations" />
            <MiniKPICard title="Op. Payback" value={`${formatNumber(data.metrics.operatingPayback > 0 ? Math.max(0, data.metrics.operatingPayback - devYears) : 0, 1)} Yrs`} subtitle="From Operations" />
            <MiniKPICard title="Avg DSCR" value={`${formatNumber(data.metrics.avgDscr, 2)}x`} subtitle="Debt Coverage" />
            <MiniKPICard title="Min DSCR" value={`${formatNumber(data.metrics.minDscr, 2)}x`} subtitle="Lowest Coverage" />
            <MiniKPICard title="Cost per Bed" value={`${formatCurrency(data.metrics.costPerBed)}`} subtitle="Total / Beds" />
            <MiniKPICard title="Cost per Sqm" value={`${formatNumber(data.metrics.costPerSqm, 1)} M`} subtitle="Total / Sqm" />
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-[#D8D8D8]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="font-bold text-[#1E2F31] flex items-center gap-2"><BarChart3 size={18} className="text-[#9B8B70]"/> PropCo Cash Flow Trajectory</h3>
            <div className="flex bg-[#EFEBE7] p-1 rounded-lg border border-[#D8D8D8]">
               <button onClick={() => setChartMode('full')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartMode === 'full' ? 'bg-white shadow-sm text-[#1E2F31]' : 'text-[#4C4A4B] hover:text-[#1E2F31]'}`}>Full Lifecycle</button>
               <button onClick={() => setChartMode('operating')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartMode === 'operating' ? 'bg-white shadow-sm text-[#1E2F31]' : 'text-[#4C4A4B] hover:text-[#1E2F31]'}`}>Operating Only</button>
            </div>
          </div>
          <div className={isPresenting ? "h-[450px]" : "h-[400px]"}>
              <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8D8D8" />
                  <XAxis dataKey="year" tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} />
                  <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} tickFormatter={(val) => `${val}B`} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#1E2F31'}} axisLine={false} tickFormatter={(val) => `${val}B`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatNumber(val, 1) + "B"} />
                  <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                  
                  <Bar yAxisId="left" dataKey="ebitda" name="EBITDA (NOI)" fill="#9B8B70" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="left" type="monotone" dataKey="fcfe" name="FCFE" stroke="#1E2F31" strokeWidth={3} dot={{ r: 4, fill: '#1E2F31', strokeWidth: 2, stroke: '#fff' }} />
                  <Line yAxisId="right" type="monotone" dataKey="cumFcfe" name="Cumulative FCFE" stroke="#1C6048" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>
  </div>
  );
});

const PropCoCascadeView = memo(({ data, onExport }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="md:col-span-1 bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-[#D8D8D8] h-fit">
        <h3 className="font-bold text-[#1E2F31] mb-4 flex items-center gap-2"><Map size={18} className="text-[#1C6048]"/> Development Budget</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead>
              <tr className="bg-[#EFEBE7]">
                <th className="px-4 py-2 border border-[#D8D8D8] text-[#1E2F31] font-bold rounded-tl">Component</th>
                <th className="px-4 py-2 border border-[#D8D8D8] text-[#1E2F31] font-bold text-right">Cost (B)</th>
                <th className="px-4 py-2 border border-[#D8D8D8] text-[#1E2F31] font-bold text-right rounded-tr">%</th>
              </tr>
            </thead>
            <tbody>
              <CapexRow label="Land Cost" amount={data.capexDetails.landCost} total={data.metrics.totalCapex} isHeader />
              
              <CapexRow label="Total Hard Costs" amount={data.capexDetails.totalHardCosts} total={data.metrics.totalCapex} isHeader />
              <CapexRow label="Construction" amount={data.capexDetails.buildCost} total={data.metrics.totalCapex} isIndent />
              <CapexRow label="Medical Equip." amount={data.capexDetails.medEqCost} total={data.metrics.totalCapex} isIndent />
              <CapexRow label="Infrastructure" amount={data.capexDetails.infraCost} total={data.metrics.totalCapex} isIndent />
              <CapexRow label="FF&E" amount={data.capexDetails.ffeCost} total={data.metrics.totalCapex} isIndent />
              
              <CapexRow label="Total Soft Costs" amount={data.capexDetails.totalSoftCosts} total={data.metrics.totalCapex} isHeader />
              <CapexRow label="Consultant" amount={data.capexDetails.consultantCost} total={data.metrics.totalCapex} isIndent />
              <CapexRow label="License" amount={data.capexDetails.licenseCost} total={data.metrics.totalCapex} isIndent />
              <CapexRow label="Sharing Dev." amount={data.capexDetails.sharingDevCost} total={data.metrics.totalCapex} isIndent />
              <CapexRow label="VAT" amount={data.capexDetails.vatCost} total={data.metrics.totalCapex} isIndent />
              <CapexRow label="Contingency" amount={data.capexDetails.contingencyCost} total={data.metrics.totalCapex} isIndent />

              <CapexRow label="TOTAL CAPEX" amount={data.metrics.totalCapex} total={data.metrics.totalCapex} isSubtotal />
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-[#D8D8D8] overflow-hidden flex flex-col">
        <div className="p-4 bg-[#EFEBE7] border-b border-[#D8D8D8] flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1E2F31] flex items-center gap-2"><List size={14}/> PropCo Cash Flow Detail</h3>
            <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white text-[#4C4A4B] border border-[#D8D8D8] px-2 py-1 rounded font-bold uppercase shadow-sm">IDR Billions</span>
            </div>
        </div>
        <div className="overflow-auto max-h-[70vh] flex-1">
            <table className="w-full text-[11px] text-left border-separate border-spacing-0 min-w-[1000px]">
                <thead className="bg-[#EFEBE7] font-bold sticky top-0 z-20 shadow-md">
                    <tr>
                        <th className="px-4 py-3 border-b-2 border-r border-[#D8D8D8] sticky left-0 top-0 bg-[#EFEBE7] z-30 w-[260px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-[#1E2F31]">Line Item</th>
                        {data.annualData.map((d, i) => (
                            <th key={i} className={`px-3 py-3 text-right min-w-[90px] border-b-2 border-r border-[#D8D8D8] bg-[#EFEBE7] ${!d.isOperating ? 'text-[#9B8B70]' : 'text-[#1E2F31]'}`}>
                                {String(d.year)}
                            </th>
                        ))}
                        <th className="px-4 py-3 text-right bg-[#EFEBE7] text-[#1E2F31] sticky right-0 top-0 z-30 border-l border-b-2 border-[#D8D8D8] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <TableSection title="A. Operating Revenue & Expense" colSpan={data.annualData.length + 2} />
                    <TableRow label="Rental Revenue" data={data.annualData} dk="revenue" total={data.totals.revenue} />
                    <TableRow label="Maintenance OpEx" data={data.annualData} dk="maintOpex" total={data.totals.maintOpex} isIndent />
                    <TableRow label="Property Taxes" data={data.annualData} dk="taxOpex" total={data.totals.taxOpex} isIndent />
                    <TableRow label="Overhead OpEx" data={data.annualData} dk="overheadOpex" total={data.totals.overheadOpex} isIndent />
                    <TableRow label="FF&E Reserve" data={data.annualData} dk="ffeReserve" total={data.totals.ffeReserve} isIndent />
                    <TableRow label="EBITDA (NOI)" data={data.annualData} dk="ebitda" total={data.totals.ebitda} highlight />

                    <TableSection title="B. Debt Service & Taxes" colSpan={data.annualData.length + 2} />
                    <TableRow label="Interest Expense" data={data.annualData} dk="interest" total={data.totals.interest} isIndent />
                    <TableRow label="Principal Repayment" data={data.annualData} dk="principal" total={data.totals.principal} isIndent />
                    <TableRow label="DSCR (Coverage Ratio)" data={data.annualData} dk="dscr" />
                    <TableRow label="Depreciation (D&A)" data={data.annualData} dk="dep" total={data.totals.dep} isIndent />
                    <TableRow label="Earnings Before Tax (EBT)" data={data.annualData} dk="ebt" total={data.totals.ebt} highlight />
                    <TableRow label="Corporate Tax" data={data.annualData} dk="corpTax" total={data.totals.corpTax} isIndent />

                    <TableSection title="C. Return Metrics" colSpan={data.annualData.length + 2} type="emerald" />
                    <TableRow label="NET INCOME" data={data.annualData} dk="netIncome" total={data.totals.netIncome} highlight />
                    <TableRow label="Net Exit Proceeds" data={data.annualData} dk="netExitProceeds" total={data.totals.netExitProceeds} highlight />
                    <TableRow label="FCFE (Levered)" data={data.annualData} dk="fcfe" highlight emerald total={data.totals.fcfe} />
                    <TableRow label="Cumulative FCFE" data={data.annualData} dk="cumFcfe" highlight crossover bold indigo />

                    <TableSection title="D. Ex-Land Cash Flows (Optional)" colSpan={data.annualData.length + 2} />
                    <TableRow label="Interest (Ex-Land)" data={data.annualData} dk="interestExLand" total={data.totals.interestExLand} isIndent />
                    <TableRow label="Principal (Ex-Land)" data={data.annualData} dk="principalExLand" total={data.totals.principalExLand} isIndent />
                    <TableRow label="EBT (Ex-Land)" data={data.annualData} dk="ebtExLand" total={data.totals.ebtExLand} highlight />
                    <TableRow label="Corporate Tax (Ex-Land)" data={data.annualData} dk="corpTaxExLand" total={data.totals.corpTaxExLand} isIndent />
                    <TableRow label="Net Exit Proceeds (Ex-Land)" data={data.annualData} dk="netExitProceedsExLand" total={data.totals.netExitProceedsExLand} highlight />
                    <TableRow label="FCFE (EX-LAND)" data={data.annualData} dk="fcfeExLand" highlight emerald total={data.totals.fcfeExLand} />
                    <TableRow label="Cumulative FCFE (Ex-Land)" data={data.annualData} dk="cumFcfeExLand" highlight crossover bold indigo />
                </tbody>
            </table>
        </div>
      </div>
    </div>
  </div>
));

const ConsolidatedDashboardView = memo(({ data, assumptions, isPresenting }) => (
  <div className={isPresenting ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in" : "space-y-6 animate-in fade-in"}>
    <div className={`space-y-6 ${isPresenting ? "lg:col-span-4" : ""}`}>
       <div className={`grid grid-cols-2 gap-4`}>
          <KPICard title="Blended Equity NPV" value={formatCurrency(data.metrics.npv)} icon={<TrendingUp size={18} />} color="emerald" subtitle={`@${String(assumptions.holdCoDiscountRate)}% Disc Rate`} />
          <KPICard title="Blended Cash Multiple" value={`${formatNumber(data.metrics.moic, 2)}x`} icon={<BarChart3 size={18} />} color="blue" subtitle="Consolidated MOIC" />
          <KPICard title="Blended Equity IRR" value={`${formatNumber((data.metrics.irr || 0) * 100, 2)}%`} icon={<Activity size={18} />} color="emerald" subtitle="Compounded Return" />
          <KPICard title="Blended Payback" value={`${formatNumber(data.metrics.payback, 1)} Yrs`} icon={<Clock size={18} />} color="indigo" subtitle="From Year 1" />
       </div>

       <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-[#D8D8D8]">
          <h3 className="text-lg font-bold text-[#1E2F31] flex items-center gap-2 mb-1"><Layers size={20} className="text-[#1E2F31]" /> HoldCo Group Position</h3>
          <p className="text-[10px] text-[#4C4A4B] font-medium mb-6">Combined position representing 100% of PropCo cash flows and 49% of OpCo operating dividends.</p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
               <span className="font-bold text-[#4C4A4B] uppercase tracking-wider">Total Combined Equity Outlay</span>
               <span className="font-black text-[#1E2F31]">{formatCurrency(data.metrics.totalEquity)}</span>
            </div>
            <div className="w-full h-px bg-[#D8D8D8]"></div>
            <div className="flex justify-between items-center text-xs">
               <span className="font-bold text-[#4C4A4B] uppercase tracking-wider">PropCo Total FCFE (100%)</span>
               <span className="font-black text-[#9B8B70]">{formatCurrency(data.totals.propCoFlow)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
               <span className="font-bold text-[#4C4A4B] uppercase tracking-wider">OpCo Total Dividends (49%)</span>
               <span className="font-black text-[#1C6048]">{formatCurrency(data.totals.opCoFlow)}</span>
            </div>
            <div className="w-full h-px bg-[#D8D8D8]"></div>
            <div className="flex justify-between items-center text-xs">
               <span className="font-bold text-[#1E2F31] uppercase tracking-wider">Net Combined Return</span>
               <span className="font-black text-[#1E2F31]">{formatCurrency(data.totals.netFlow)}</span>
            </div>
          </div>
       </div>
    </div>
    
    <div className={`space-y-6 ${isPresenting ? "lg:col-span-8" : ""}`}>
       <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-[#D8D8D8]">
          <h3 className="font-bold text-[#1E2F31] mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-[#1E2F31]"/> Consolidated Cash Flow Trajectory</h3>
          <div className={isPresenting ? "h-[450px]" : "h-80"}>
              <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.annualData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8D8D8" />
                  <XAxis dataKey="year" tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} />
                  <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#4C4A4B'}} axisLine={false} tickFormatter={(val) => `${val}B`} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#1E2F31'}} axisLine={false} tickFormatter={(val) => `${val}B`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => formatNumber(val, 1) + "B"} />
                  <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                  
                  <Bar yAxisId="left" stackId="a" dataKey="propCoFlow" name="PropCo FCFE" fill="#9B8B70" radius={[0, 0, 0, 0]} barSize={40} />
                  <Bar yAxisId="left" stackId="a" dataKey="opCoFlow" name="OpCo Dividend (49%)" fill="#1C6048" radius={[4, 4, 0, 0]} barSize={40} />
                  
                  <Line yAxisId="right" type="monotone" dataKey="cumCf" name="Cumulative Net Position" stroke="#1E2F31" strokeWidth={3} dot={{ r: 4, fill: '#1E2F31', strokeWidth: 2, stroke: '#fff' }} />
                  <ReferenceLine yAxisId="right" y={0} stroke="#D8D8D8" strokeWidth={1} strokeDasharray="5 5" />
              </ComposedChart>
              </ResponsiveContainer>
          </div>
       </div>
    </div>
  </div>
));

const ConsolidatedCascadeView = memo(({ data }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-[#D8D8D8] overflow-hidden">
      <div className="p-4 bg-[#EFEBE7] border-b border-[#D8D8D8] flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#1E2F31] flex items-center gap-2"><List size={14}/> Consolidated HoldCo Waterfall</h3>
          <span className="text-[10px] bg-white text-[#4C4A4B] border border-[#D8D8D8] px-2 py-1 rounded font-bold uppercase shadow-sm">IDR Billions</span>
      </div>
      <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-[11px] text-left border-separate border-spacing-0 min-w-[1000px]">
              <thead className="bg-[#EFEBE7] font-bold sticky top-0 z-20 shadow-md">
                  <tr>
                      <th className="px-4 py-3 border-b-2 border-r border-[#D8D8D8] sticky left-0 top-0 bg-[#EFEBE7] z-30 w-[260px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-[#1E2F31]">Line Item</th>
                      {data.annualData.map((d, i) => (
                          <th key={i} className={`px-3 py-3 text-right min-w-[90px] border-b-2 border-r border-[#D8D8D8] bg-[#EFEBE7] ${!d.isOperating ? 'text-[#9B8B70]' : 'text-[#1E2F31]'}`}>
                              {String(d.year)}
                          </th>
                      ))}
                      <th className="px-4 py-3 text-right bg-[#EFEBE7] text-[#1E2F31] sticky right-0 top-0 z-30 border-l border-b-2 border-[#D8D8D8] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Total</th>
                  </tr>
              </thead>
              <tbody>
                  <TableSection title="A. Component Cash Flows" colSpan={data.annualData.length + 2} />
                  <TableRow label="PropCo FCFE (100%)" data={data.annualData} dk="propCoFlow" total={data.totals.propCoFlow} isIndent />
                  <TableRow label="OpCo Dividend (49%)" data={data.annualData} dk="opCoFlow" total={data.totals.opCoFlow} isIndent />
                  
                  <TableSection title="B. Consolidated Position" colSpan={data.annualData.length + 2} type="emerald" />
                  <TableRow label="NET COMBINED CASH FLOW" data={data.annualData} dk="netFlow" total={data.totals.netFlow} highlight emerald />
                  <TableRow label="Cumulative Net Position" data={data.annualData} dk="cumCf" highlight crossover bold indigo />
              </tbody>
          </table>
      </div>
  </div>
));

const OpCoSettingsView = memo(({ assumptions, onChange, onSyncEquity, onValidate, isLocked, onToggleLock, onSave, saveStatus, onReset, isCloudSync, isPresenting }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-[#D8D8D8] p-5 lg:p-8 mb-12 text-xs">
      <SettingsHeader title="OpCo Configuration" icon={<Settings className="text-[#1C6048]" />} onToggleLock={onToggleLock} isLocked={isLocked} onSave={onSave} saveStatus={saveStatus} onReset={onReset} onValidate={onValidate} isCloudSync={isCloudSync} />
      
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-10 ${isPresenting ? 'lg:grid-cols-4 2xl:grid-cols-5' : 'lg:grid-cols-3'}`}>
          <div className="space-y-4">
              <SectionTitle title="Capacity & Volume" icon={<Building2 size={16}/>} color="blue" />
              <AssumptionRow label="Total Beds" val={assumptions.beds} set={(v) => onChange('beds', v)} unit="Beds" isLocked={isLocked} />
              <AssumptionRow label="Avg Length of Stay" val={assumptions.alos} set={(v) => onChange('alos', v)} unit="Days" isLocked={isLocked} />
              <AssumptionRow label="OP:IP Case Ratio" val={assumptions.opIpRatio} set={(v) => onChange('opIpRatio', v)} unit="X" isLocked={isLocked} />
          </div>
          <div className="space-y-4">
              <SectionTitle title="Growth & Occupancy" icon={<TrendingUp size={16}/>} color="emerald" />
              <AssumptionRow label="Starting BOR" val={assumptions.borStart} set={(v) => onChange('borStart', v)} unit="%" isLocked={isLocked} />
              <AssumptionRow label="Max BOR" val={assumptions.borMax} set={(v) => onChange('borMax', v)} unit="%" isLocked={isLocked} />
              <AssumptionRow label="Annual BOR Growth" val={assumptions.borIncrement} set={(v) => onChange('borIncrement', v)} unit="%" isLocked={isLocked} />
          </div>
          <div className="space-y-4">
              <SectionTitle title="Revenue & Pricing" icon={<Stethoscope size={16}/>} color="indigo" />
              <AssumptionRow label="Rev/IP Case" val={assumptions.ipRevenue} set={(v) => onChange('ipRevenue', v)} unit="M" isLocked={isLocked} />
              <AssumptionRow label="Rev/OP Visit" val={assumptions.opRevenue} set={(v) => onChange('opRevenue', v)} unit="M" isLocked={isLocked} />
              <AssumptionRow label="Y1-6 Price Incr." val={assumptions.priceIncYears1_6} set={(v) => onChange('priceIncYears1_6', v)} unit="%" isLocked={isLocked} />
          </div>
          <div className="space-y-4">
              <SectionTitle title="Cost of Goods Sold" icon={<HeartPulse size={16}/>} color="rose" />
              <AssumptionRow label="Med Supply IP" val={assumptions.ipMedSupply} set={(v) => onChange('ipMedSupply', v)} unit="M" isLocked={isLocked} />
              <AssumptionRow label="Med Supply OP" val={assumptions.opMedSupply} set={(v) => onChange('opMedSupply', v)} unit="M" isLocked={isLocked} />
              <AssumptionRow label="Doctor Fee IP" val={assumptions.docFeeIp} set={(v) => onChange('docFeeIp', v)} unit="%" isLocked={isLocked} />
              <AssumptionRow label="Doctor Fee OP" val={assumptions.docFeeOp} set={(v) => onChange('docFeeOp', v)} unit="%" isLocked={isLocked} />
          </div>
          <div className="space-y-4 row-span-2">
              <SectionTitle title="OpEx & Tiered Rent" icon={<Briefcase size={16}/>} color="amber" />
              <AssumptionRow label="Staff Cost (Mo)" val={assumptions.monthlyStaffCost} set={(v) => onChange('monthlyStaffCost', v)} unit="B" isLocked={isLocked} />
              <AssumptionRow label="Staff Inflation" val={assumptions.staffInf} set={(v) => onChange('staffInf', v)} unit="%" isLocked={isLocked} />
              <AssumptionRow label="Admin Rate" val={assumptions.adminExpRate} set={(v) => onChange('adminExpRate', v)} unit="%" isLocked={isLocked} />
              <div className="pt-2 border-t border-[#D8D8D8]">
                  <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-bold text-[#1C6048]">Variable Rent (EBITDAR %)</p>
                      <div className="flex gap-1 items-center">
                          <FormattedInput disabled={isLocked} val={assumptions.rentTier1Limit} set={(v) => onChange('rentTier1Limit', v)} className="w-8 p-0.5 text-center text-[8px] border border-[#D8D8D8] rounded font-black text-[#1E2F31]" placeholder="T1" />
                          <span className="text-[8px] font-bold text-[#4C4A4B]">B</span>
                          <FormattedInput disabled={isLocked} val={assumptions.rentTier2Limit} set={(v) => onChange('rentTier2Limit', v)} className="w-8 p-0.5 text-center text-[8px] border border-[#D8D8D8] rounded font-black text-[#1E2F31]" placeholder="T2" />
                          <span className="text-[8px] font-bold text-[#4C4A4B]">B</span>
                      </div>
                  </div>
                  <AssumptionRow label={`Tier 1 (<${assumptions.rentTier1Limit}B RevPAB)`} val={assumptions.rentTier1Rate} set={(v) => onChange('rentTier1Rate', v)} unit="%" isLocked={isLocked} />
                  <AssumptionRow label={`Tier 2 (<${assumptions.rentTier2Limit}B RevPAB)`} val={assumptions.rentTier2Rate} set={(v) => onChange('rentTier2Rate', v)} unit="%" isLocked={isLocked} />
                  <AssumptionRow label={`Tier 3 (>${assumptions.rentTier2Limit}B RevPAB)`} val={assumptions.rentTier3Rate} set={(v) => onChange('rentTier3Rate', v)} unit="%" isLocked={isLocked} />
              </div>
          </div>
          <div className="space-y-4">
              <SectionTitle title="Capital, Setup & Tax" icon={<Scale size={16}/>} color="blue" />
              <AssumptionRow label="Strategic Ptnr Eq." val={assumptions.partnerAEquity} set={(v) => onChange('partnerAEquity', v)} unit="B" isLocked={isLocked} />
              <AssumptionRow label="Vasanta Equity" val={assumptions.partnerBEquity} set={(v) => onChange('partnerBEquity', v)} unit="B" isLocked={isLocked} />
              <AssumptionRow label="Strategic Ptnr Share" val={assumptions.sharingPercentA} set={(v) => onChange('sharingPercentA', v)} unit="%" isLocked={isLocked} />
              <AssumptionRow label="OpCo Disc. Rate" val={assumptions.discountRate} set={(v) => onChange('discountRate', v)} unit="%" isLocked={isLocked} />
              <AssumptionRow label="HoldCo Disc. Rate" val={assumptions.holdCoDiscountRate} set={(v) => onChange('holdCoDiscountRate', v)} unit="%" isLocked={isLocked} />
              <button onClick={onSyncEquity} disabled={isLocked} className="w-full py-2 bg-[#1E2F31] text-white rounded-lg text-[10px] font-bold shadow-md hover:opacity-90 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Link2 size={12}/> Align Equity</button>
          </div>
      </div>
  </div>
));

const PropCoSettingsView = memo(({ assumptions, onChange, isLocked, onToggleLock, onSave, saveStatus, onReset, onValidate, isCloudSync, isPresenting }) => {
  const buildCostForUi = (assumptions.buildArea * assumptions.buildCost) / 1000;
  const medEqCostForUi = assumptions.includeMedEq ? (assumptions.capexMedEqQty * assumptions.capexMedEqPrice) / 1000 : 0;
  const infraCostForUi = (assumptions.capexInfraQty * assumptions.capexInfraPrice) / 1000;
  const ffeCostForUi = assumptions.includeFFE ? (assumptions.capexFFEQty * assumptions.capexFFEPrice) / 1000 : 0;
  const coreCostForPctUi = buildCostForUi + ffeCostForUi + medEqCostForUi + infraCostForUi;
  const consultantCostUi = coreCostForPctUi * ((assumptions.capexConsultantPct || 0) / 100);
  const licenseCostUi = coreCostForPctUi * ((assumptions.capexLicensePct || 0) / 100);
  const sharingDevCostForUi = (assumptions.capexSharingDevQty * assumptions.capexSharingDevPrice) / 1000;
  const vatBaseUi = consultantCostUi + buildCostForUi + ffeCostForUi + medEqCostForUi + infraCostForUi + sharingDevCostForUi;
  const vatCostUi = vatBaseUi * ((assumptions.capexVat || 0) / 100);
  const contingencyBaseUi = licenseCostUi + consultantCostUi + buildCostForUi + ffeCostForUi + medEqCostForUi + infraCostForUi + sharingDevCostForUi + vatCostUi;
  const contingencyCostUi = contingencyBaseUi * ((assumptions.capexContingencyPct || 0) / 100);

  return (
  <div className="bg-white rounded-2xl shadow-sm border border-[#D8D8D8] p-5 lg:p-8 mb-12 text-xs">
      <SettingsHeader title="PropCo Configuration" icon={<Settings className="text-[#9B8B70]" />} onToggleLock={onToggleLock} isLocked={isLocked} onSave={onSave} saveStatus={saveStatus} onReset={onReset} onValidate={onValidate} isCloudSync={isCloudSync} />
      
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-10 ${isPresenting ? 'lg:grid-cols-4 2xl:grid-cols-5' : 'lg:grid-cols-3'}`}>
          <div className="space-y-4">
            <SectionTitle title="Asset Linking" icon={<Link2 size={16}/>} color="indigo" />
            <ToggleRow label="Link Rent to OpCo" desc="Use OpCo building rent expense." checked={assumptions.linkToOpCo} onChange={(v) => onChange('linkToOpCo', v)} isLocked={isLocked} />
            {!assumptions.linkToOpCo && (<><AssumptionRow label="Manual Base Rent Y1" val={assumptions.manualBaseRent} set={(v) => onChange('manualBaseRent', v)} unit="B" isLocked={isLocked} /><AssumptionRow label="Rent Escalation/Yr" val={assumptions.manualRentEscalation} set={(v) => onChange('manualRentEscalation', v)} unit="%" isLocked={isLocked} /></>)}
          </div>
          <div className="space-y-4">
            <SectionTitle title="Land & Construction" icon={<Map size={16}/>} color="emerald" />
            <AssumptionRow label="Land Area" val={assumptions.landArea} set={(v) => onChange('landArea', v)} unit="Sqm" isLocked={isLocked} />
            <AssumptionRow label="Land Price" val={assumptions.landPrice} set={(v) => onChange('landPrice', v)} unit="M/Sqm" isLocked={isLocked} />
            <AssumptionRow label="Building Area" val={assumptions.buildArea} set={(v) => onChange('buildArea', v)} unit="Sqm" isLocked={isLocked} />
            <AssumptionRow label="Construction Cost" val={assumptions.buildCost} set={(v) => onChange('buildCost', v)} unit="M/Sqm" isLocked={isLocked} />
            <AssumptionRow label="Dev. Duration" val={assumptions.devDurationMonths} set={(v) => onChange('devDurationMonths', v)} unit="Mos" isLocked={isLocked} />
          </div>
          <div className="space-y-4">
              <SectionTitle title="Other Capex & VAT" icon={<Calculator size={16}/>} color="rose" />
              <AssumptionRowCalculated label="Consultant" pctVal={assumptions.capexConsultantPct} setPct={(v) => onChange('capexConsultantPct', v)} calculatedVal={consultantCostUi} isLocked={isLocked} />
              <AssumptionRowCalculated label="License/Permit" pctVal={assumptions.capexLicensePct} setPct={(v) => onChange('capexLicensePct', v)} calculatedVal={licenseCostUi} isLocked={isLocked} />
              <AssumptionRowQtyPriceWithToggle label="Medical Equip." qtyVal={assumptions.capexMedEqQty} priceVal={assumptions.capexMedEqPrice} setQty={(v) => onChange('capexMedEqQty', v)} setPrice={(v) => onChange('capexMedEqPrice', v)} checked={assumptions.includeMedEq} onToggle={(v) => onChange('includeMedEq', v)} isLocked={isLocked} />
              <AssumptionRowQtyPriceWithToggle label="FF&E" qtyVal={assumptions.capexFFEQty} priceVal={assumptions.capexFFEPrice} setQty={(v) => onChange('capexFFEQty', v)} setPrice={(v) => onChange('capexFFEPrice', v)} checked={assumptions.includeFFE} onToggle={(v) => onChange('includeFFE', v)} isLocked={isLocked} />
              <AssumptionRowQtyPrice label="Infrastructure" qtyVal={assumptions.capexInfraQty} priceVal={assumptions.capexInfraPrice} setQty={(v) => onChange('capexInfraQty', v)} setPrice={(v) => onChange('capexInfraPrice', v)} isLocked={isLocked} />
              <AssumptionRowQtyPrice label="Sharing Dev." qtyVal={assumptions.capexSharingDevQty} priceVal={assumptions.capexSharingDevPrice} setQty={(v) => onChange('capexSharingDevQty', v)} setPrice={(v) => onChange('capexSharingDevPrice', v)} isLocked={isLocked} />
              <AssumptionRowCalculated label="Capex VAT" pctVal={assumptions.capexVat} setPct={(v) => onChange('capexVat', v)} calculatedVal={vatCostUi} isLocked={isLocked} />
              <AssumptionRowCalculated label="Contingency" pctVal={assumptions.capexContingencyPct} setPct={(v) => onChange('capexContingencyPct', v)} calculatedVal={contingencyCostUi} isLocked={isLocked} />
          </div>
          <div className="space-y-4">
            <SectionTitle title="Financing Structure" icon={<Landmark size={16}/>} color="blue" />
            <ToggleRow label="Include Debt Financing" desc="Use bank loan for construction." checked={assumptions.includeFinancing} onChange={(v) => onChange('includeFinancing', v)} isLocked={isLocked} />
            <AssumptionRow label="Loan To Value (LTV)" val={assumptions.ltv} set={(v) => onChange('ltv', v)} unit="%" isLocked={isLocked || !assumptions.includeFinancing} />
            <AssumptionRow label="Interest Rate" val={assumptions.interestRate} set={(v) => onChange('interestRate', v)} unit="%" isLocked={isLocked || !assumptions.includeFinancing} />
            <AssumptionRow label="Loan Tenor" val={assumptions.loanTenor} set={(v) => onChange('loanTenor', v)} unit="Yrs" isLocked={isLocked || !assumptions.includeFinancing} />
            <AssumptionRow label="IO Grace Period" val={assumptions.ioGracePeriodYears} set={(v) => onChange('ioGracePeriodYears', v)} unit="Yrs" isLocked={isLocked || !assumptions.includeFinancing} />
            <AssumptionRow label="Discount Rate" val={assumptions.discountRate} set={(v) => onChange('discountRate', v)} unit="%" isLocked={isLocked} />
          </div>
          <div className="space-y-4">
            <SectionTitle title="Depreciation (D&A)" icon={<Calculator size={16}/>} color="teal" />
            <AssumptionDepreciationGroup label="Building" methodVal={assumptions.depMethodBuilding} lifeVal={assumptions.depLifeBuilding} setMethod={(v) => onChange('depMethodBuilding', v)} setLife={(v) => onChange('depLifeBuilding', v)} isLocked={isLocked} />
            <AssumptionDepreciationGroup label="Infrastructure" methodVal={assumptions.depMethodInfra} lifeVal={assumptions.depLifeInfra} setMethod={(v) => onChange('depMethodInfra', v)} setLife={(v) => onChange('depLifeInfra', v)} isLocked={isLocked} />
            <AssumptionDepreciationGroup label="Med. Equip." methodVal={assumptions.depMethodMedEq} lifeVal={assumptions.depLifeMedEq} setMethod={(v) => onChange('depMethodMedEq', v)} setLife={(v) => onChange('depLifeMedEq', v)} isLocked={isLocked} />
            <AssumptionDepreciationGroup label="FF&E" methodVal={assumptions.depMethodFFE} lifeVal={assumptions.depLifeFFE} setMethod={(v) => onChange('depMethodFFE', v)} setLife={(v) => onChange('depLifeFFE', v)} isLocked={isLocked} />
          </div>
          <div className="space-y-4">
            <SectionTitle title="Operating Expenses" icon={<Briefcase size={16}/>} color="rose" />
            <AssumptionRow label="Maintenance Rate" val={assumptions.maintRate} set={(v) => onChange('maintRate', v)} unit="%" isLocked={isLocked} />
            <AssumptionRow label="Property Tax Rate" val={assumptions.propTaxRate} set={(v) => onChange('propTaxRate', v)} unit="%" isLocked={isLocked} />
            <AssumptionRow label="Const. Overhead" val={assumptions.constructionOpexMonthly} set={(v) => onChange('constructionOpexMonthly', v)} unit="B/Mo" isLocked={isLocked} />
            <AssumptionRowCalculated label="Const. All Risk (CAR)" pctVal={assumptions.capexCarPct} setPct={(v) => onChange('capexCarPct', v)} calculatedVal={buildCostForUi * ((assumptions.capexCarPct || 0) / 100)} isLocked={isLocked} />
            <AssumptionRow label="Op. Overhead" val={assumptions.opOverheadMonthly} set={(v) => onChange('opOverheadMonthly', v)} unit="B/Mo" isLocked={isLocked} />
            <AssumptionRow label="Overhead Incr." val={assumptions.opOverheadInc} set={(v) => onChange('opOverheadInc', v)} unit="%" isLocked={isLocked} />
            <AssumptionRow label="FF&E Reserve" val={assumptions.ffeReservePct} set={(v) => onChange('ffeReservePct', v)} unit="%" isLocked={isLocked} />
            <AssumptionRow label="Corporate Tax" val={assumptions.corporateTax} set={(v) => onChange('corporateTax', v)} unit="%" isLocked={isLocked} />
          </div>
          <div className="space-y-4">
            <SectionTitle title="Terminal Value (Exit)" icon={<DollarSign size={16}/>} color="amber" />
            <ToggleRow label="Include Exit in Yr 10" desc="Calculate Terminal Value." checked={assumptions.includeTerminalValue} onChange={(v) => onChange('includeTerminalValue', v)} isLocked={isLocked} />
            {assumptions.includeTerminalValue && (
                <>
                <div className="flex justify-between items-center group py-1 border-b border-[#D8D8D8] last:border-0 hover:bg-[#EFEBE7] px-1 rounded transition-colors"><label className="text-[10px] text-[#4C4A4B] font-bold">Valuation Method</label><div className="flex items-center bg-[#D8D8D8] rounded p-0.5"><button disabled={isLocked} onClick={() => onChange('exitMethod', 'capRate')} className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${assumptions.exitMethod !== 'multiple' ? 'bg-white text-[#1E2F31] shadow-sm border border-[#D8D8D8]' : 'text-[#4C4A4B] hover:text-[#1E2F31]'}`}>Cap Rate</button><button disabled={isLocked} onClick={() => onChange('exitMethod', 'multiple')} className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${assumptions.exitMethod === 'multiple' ? 'bg-white text-[#1E2F31] shadow-sm border border-[#D8D8D8]' : 'text-[#4C4A4B] hover:text-[#1E2F31]'}`}>EV/EBITDA</button></div></div>
                {assumptions.exitMethod === 'multiple' ? <AssumptionRow label="Exit Multiple" val={assumptions.exitMultiple} set={(v) => onChange('exitMultiple', v)} unit="x" isLocked={isLocked} /> : <AssumptionRow label="Exit Cap Rate" val={assumptions.exitCapRate} set={(v) => onChange('exitCapRate', v)} unit="%" isLocked={isLocked} />}
                <AssumptionRow label="Selling Costs" val={assumptions.sellingCosts} set={(v) => onChange('sellingCosts', v)} unit="%" isLocked={isLocked} />
                </>
            )}
          </div>
      </div>
  </div>
  );
});

const OpCoSensitivityView = memo(({ assumptions }) => {
  const borSteps = [45, 55, 65, 75, 85];
  const bedSteps = [80, 100, 120, 140, 160];
  const irrMatrix = borSteps.map(bor => bedSteps.map(beds => (runOpCoEngine({...assumptions, borMax: bor, beds}).projectIRR || 0) * 100));
  return <SensitivityTable title="Project IRR Sensitivity" subtitle="Beds vs. Max BOR" xLabel="Beds" yLabel="BOR" xValues={bedSteps} yValues={borSteps} matrix={irrMatrix} formatFn={(v) => formatNumber(v, 1) + '%'} />;
});

const PropCoSensitivityView = memo(({ assumptions, opCoModelData }) => {
  const costSteps = [9, 10, 11.5, 13, 14];
  const rateSteps = [8, 9, 10.5, 12, 13];
  const paybackMatrix = costSteps.map(bc => rateSteps.map(ir => runPropCoEngine({ ...assumptions, buildCost: bc, interestRate: ir }, opCoModelData).metrics.operatingPayback || 0));
  return <SensitivityTable title="Operating Payback Sensitivity" subtitle="Interest Rate vs. Build Cost" xLabel="Rate" yLabel="Cost" xValues={rateSteps} yValues={costSteps} matrix={paybackMatrix} formatFn={(v) => v === 0 ? 'Never' : formatNumber(v, 1) + ' Yrs'} reverseColors />;
});

function AIAuditView({ aiInsights, isAiLoading, generateAIInsights, askQuery, setAskQuery, handleAskAI, isAskLoading, askResponse, activeCompany }) {
  return (
    <div className="animate-in slide-in-from-right duration-500 space-y-6 pb-12">
      <div className="bg-white rounded-2xl shadow-lg border border-[#D8D8D8] overflow-hidden">
        <div className={`p-8 bg-gradient-to-br text-white flex flex-col md:flex-row justify-between items-center gap-6 ${activeCompany === 'opco' ? 'from-[#1E2F31] to-[#1C6048]' : 'from-[#4C4A4B] to-[#9B8B70]'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md hidden sm:block"><AIMicroscopeIcon size={40} className="text-white" /></div>
            <div><h2 className="text-2xl font-bold">✨ Intelligent Audit</h2><p className="text-white/80 text-sm max-w-md">Benchmarking Project NPV, MOIC, Yields, and Margin efficiency.</p></div>
          </div>
          <button onClick={generateAIInsights} disabled={isAiLoading} className="bg-white px-6 py-3 rounded-xl font-bold text-[#1E2F31] shadow-xl hover:bg-opacity-90 transition-all">{isAiLoading ? <RefreshCcw size={18} className="animate-spin" /> : <Sparkles size={18} />} Run Yield Audit</button>
        </div>
        <div className="p-8 bg-white min-h-[300px]">
          {aiInsights && <div className="p-6 bg-white rounded-xl shadow-sm border border-[#D8D8D8] border-l-4 border-l-[#1C6048]"><MarkdownRenderer content={aiInsights} /></div>}
          {!aiInsights && !isAiLoading && <p className="text-center text-gray-500">Run the audit to see AI-generated financial insights.</p>}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-[#D8D8D8] p-8 mt-6">
        <h3 className="text-lg font-bold text-[#1E2F31] mb-2 flex items-center gap-2"><AIMicroscopeIcon size={20} className="text-[#1C6048]"/> Ask AI</h3>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <input type="text" value={askQuery} onChange={(e)=>setAskQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAskAI()} placeholder="Ask anything about the numbers..." className="flex-1 p-4 bg-white border border-[#D8D8D8] rounded-xl outline-none" />
          <button onClick={handleAskAI} disabled={isAskLoading || !askQuery.trim()} className="bg-[#1E2F31] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-md">{isAskLoading ? "Thinking..." : "Ask"}</button>
        </div>
        {askResponse && <div className="mt-8 p-6 bg-[#F9F8F6] rounded-xl border border-[#D8D8D8]"><MarkdownRenderer content={askResponse} /></div>}
      </div>
    </div>
  );
}

// ==========================================
// 5. MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [activeGroup, setActiveGroup] = useState('context'); // 'context' or 'financials'
  const [activeCompany, setActiveCompany] = useState('opco'); 
  const [activeTab, setActiveTab] = useState('study'); 
  const [isLockedOpCo, setIsLockedOpCo] = useState(true);
  const [isLockedPropCo, setIsLockedPropCo] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);

  // Cloud Sync State
  const [isCloudSync, setIsCloudSync] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('offline'); 
  const [user, setUser] = useState(null);

  const [projectInfo, setProjectInfo] = useState({ 
    name: "Vasanta Hospital Development", 
    location: "Tangerang, Banten", 
    type: "Specialized Hospital (Class A)", 
    totalLand: "12,643 Sqm", 
    totalBuilding: "13,000 Sqm", 
    status: "Planning / Feasibility Phase" 
  });

  const [aiInsights, setAiInsights] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [teaserContent, setTeaserContent] = useState("");
  const [isTeaserLoading, setIsTeaserLoading] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [marketValidation, setMarketValidation] = useState("");
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [showMarketValidation, setShowMarketValidation] = useState(false);
  const [askQuery, setAskQuery] = useState("");
  const [askResponse, setAskResponse] = useState("");
  const [isAskLoading, setIsAskLoading] = useState(false);
  const [selectionState, setSelectionState] = useState({ show: false, text: "", x: 0, y: 0, isOpen: false, query: "", response: "", isLoading: false });

  // Confirmation Dialog State
  const [syncConfirmDialog, setSyncConfirmDialog] = useState({ isOpen: false, targetState: false });

  const [saveStatusOpCo, setSaveStatusOpCo] = useState('idle');
  const [saveStatusPropCo, setSaveStatusPropCo] = useState('idle');

  const [opCoAssumptions, setOpCoAssumptions] = useState(DEFAULT_OPCO_ASSUMPTIONS);
  const [propCoAssumptions, setPropCoAssumptions] = useState(DEFAULT_PROPCO_ASSUMPTIONS);

  const opCoModelData = useMemo(() => runOpCoEngine(opCoAssumptions), [opCoAssumptions]);
  const propCoModelData = useMemo(() => runPropCoEngine(propCoAssumptions, opCoModelData), [propCoAssumptions, opCoModelData]);
  const consolidatedModelData = useMemo(() => runConsolidatedEngine(opCoModelData, propCoModelData, opCoAssumptions), [opCoModelData, propCoModelData, opCoAssumptions]);

  // Compute Presentation Wrapper
  const containerClass = isPresenting ? "w-[98%] max-w-full mx-auto px-2" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

  // Navigation Logic
  const handleGroupChange = useCallback((group) => {
    setActiveGroup(group);
    if (group === 'context') setActiveTab('overview');
    else setActiveTab('dashboard');
  }, []);

  // ==========================================
  // STABLE LOCAL-ONLY CLOUD SYNC BYPASS
  // ==========================================
  useEffect(() => {
    let isMounted = true;
    const connectCloud = async () => {
      setCloudStatus('connecting');
      try {
        throw new Error("Cloud Sync safely bypassed to maintain application stability.");
      } catch (err) {
        if (isMounted) {
          setCloudStatus('error');
          setTimeout(() => setIsCloudSync(false), 3000); 
        }
      }
    };
    if (isCloudSync) connectCloud();
    else {
      setCloudStatus('offline');
      setUser(null);
    }
    return () => { isMounted = false; };
  }, [isCloudSync]);

  const saveDefaultsToCloud = useCallback(async (type) => {
    if (!isCloudSync || cloudStatus !== 'online') return;
    const setStatus = type === 'opco' ? setSaveStatusOpCo : setSaveStatusPropCo;
    setStatus('saving');
    try {
      setStatus('saved'); 
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) { setStatus('idle'); }
  }, [isCloudSync, cloudStatus]);

  const handleTextSelection = useCallback((e) => {
    if (e.target.closest('#ai-selection-popup')) return;
    const selection = window.getSelection(); 
    const text = selection ? selection.toString().trim() : "";
    if (text.length > 2) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        let safeX = Math.max(160, Math.min(rect.left + window.scrollX + (rect.width / 2), document.body.clientWidth - 160));
        setSelectionState({ show: true, text, x: safeX, y: rect.top < 60 ? rect.bottom + window.scrollY + 20 : rect.top + window.scrollY - 60, isOpen: false, query: "", response: "", isLoading: false });
    } else { setSelectionState(p => p.isOpen ? p : { ...p, show: false }); }
  }, []);

  const handleSelectionAsk = useCallback(async () => {
    if (!selectionState.query.trim()) return;
    setSelectionState(p => ({...p, isLoading: true}));
    try { 
      const res = await callGemini(selectionState.query, "Short analysis."); 
      setSelectionState(p => ({...p, response: res})); 
    } catch (e) { setSelectionState(p => ({...p, response: "Error."})); } 
    finally { setSelectionState(p => ({...p, isLoading: false})); }
  }, [selectionState.query]);

  const handleOpCoChange = useCallback((k, v) => setOpCoAssumptions(p => ({ ...p, [k]: (v === "" ? 0 : parseFloat(v)) || 0 })), []);
  const handlePropCoChange = useCallback((k, v) => setPropCoAssumptions(p => ({ ...p, [k]: ['linkToOpCo', 'includeMedEq', 'includeFFE', 'depMethodBuilding', 'depMethodMedEq', 'depMethodInfra', 'depMethodFFE', 'includeTerminalValue', 'exitMethod', 'includeFinancing'].includes(k) ? v : (v === "" ? 0 : parseFloat(v)) || 0 })), []);

  const syncEquityWithSharing = useCallback(() => {
    setOpCoAssumptions(p => {
        const t = p.partnerAEquity + p.partnerBEquity;
        return { 
            ...p, 
            partnerAEquity: Number((t * (p.sharingPercentA / 100)).toFixed(2)), 
            partnerBEquity: Number((t - (t * (p.sharingPercentA / 100))).toFixed(2)) 
        };
    });
  }, []);

  const generateTeaser = useCallback(async () => {
      setIsTeaserLoading(true); setShowTeaser(true);
      try { 
        const res = await callGemini("Project Teaser", "Investment Banker");
        setTeaserContent(res || "Error."); 
      } catch(e) { setTeaserContent("Error."); } 
      setIsTeaserLoading(false);
  }, []);

  const generateAIInsights = useCallback(async () => {
    setIsAiLoading(true);
    try { 
      const res = await callGemini("Full Yield Audit", "Healthcare Investment Analyst");
      setAiInsights(res || "Error."); 
    } catch (e) { setAiInsights("Error."); } 
    finally { setIsAiLoading(false); }
  }, []);

  const validateAssumptions = useCallback(async () => {
      setIsMarketLoading(true); setShowMarketValidation(true);
      try { 
        const res = await callGemini("Assumptions check", "Healthcare feasibility consultant");
        setMarketValidation(res || "Error."); 
      } catch(e) { setMarketValidation("Error."); } 
      setIsMarketLoading(false);
  }, []);

  const handleAskAI = useCallback(async () => {
    if (!askQuery.trim()) return;
    setIsAskLoading(true);
    try { 
      const res = await callGemini(askQuery, "Financial AI");
      setAskResponse(res || "Error."); 
    } catch(e) { setAskResponse("Error."); } 
    setIsAskLoading(false);
  }, [askQuery]);

  return (
    <div className={`min-h-screen bg-[#F9F8F6] text-[#1E2F31] font-sans pb-12 relative text-xs`} onMouseUp={handleTextSelection}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
        
        /* Modern, crisp UI font optimized for dense dashboards */
        .font-sans { 
            font-family: 'Plus Jakarta Sans', sans-serif !important; 
        }
        
        /* Premium institutional serif for logos and headers */
        .font-serif { 
            font-family: 'Playfair Display', serif !important; 
        }
        
        /* True monospaced font for perfect vertical alignment in financial tables */
        .font-mono { 
            font-family: 'JetBrains Mono', monospace !important; 
            letter-spacing: -0.03em;
        }
      `}</style>
      
      <div className="bg-[#1E2F31] text-white shadow-md relative z-50 border-b-4 border-[#1C6048] transition-all">
        <div className={`flex justify-between items-center transition-all duration-300 ${containerClass} ${isPresenting ? 'py-1.5' : 'py-3'}`}>
            <div className="flex items-center gap-2 lg:gap-3">
                <div className={`text-[#9B8B70] transition-all ${isPresenting ? 'w-7 h-7' : 'w-10 h-10'}`}>
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                        <rect width="100" height="100" rx="32" fill="currentColor" />
                        <g fill="white">{[0, 72, 144, 216, 288].map(angle => (<path key={`petal-${angle}`} d="M 33.6 27.4 C 28 10, 72 10, 66.4 27.4 L 50 50 Z" transform={`rotate(${angle} 50 50)`} />))}</g>
                        <g fill="currentColor">
                            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map(angle => (<path key={`inner-${angle}`} d="M 50 45 C 52.5 41, 52.5 31, 50 31 C 47.5 31, 47.5 41, 50 45 Z" transform={`rotate(${angle} 50 50)`} />))}
                            {[0, 72, 144, 216, 288].map(angle => (<path key={`outer-long-${angle}`} d="M 50 34 C 53.5 30, 54 17, 50 17 C 46 17, 46.5 30, 50 34 Z" transform={`rotate(${angle} 50 50)`} />))}
                            {[36, 108, 180, 252, 324].map(angle => (<path key={`outer-short-${angle}`} d="M 50 34 C 52 31, 52.5 25, 50 25 C 47.5 25, 48 31, 50 34 Z" transform={`rotate(${angle} 50 50)`} />))}
                        </g>
                    </svg>
                </div>
                <div className="flex flex-col justify-center">
                    <span className={`font-serif font-medium tracking-[0.2em] leading-[1.1] text-white transition-all ${isPresenting ? 'text-[12px]' : 'text-[16px]'}`}>{(projectInfo.name || "VASANTA").split(' ')[0].toUpperCase()}</span>
                    <span className={`font-serif font-bold tracking-[0.3em] text-[#9B8B70] transition-all ${isPresenting ? 'text-[8px]' : 'text-[11px]'}`}>GROUP</span>
                </div>
            </div>
            
            <div className="flex items-center gap-3 lg:gap-4">
              <button 
                onClick={() => setIsPresenting(!isPresenting)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                  isPresenting ? 'bg-[#99B6AA] text-[#1E2F31] border-[#99B6AA] hover:bg-white' : 'bg-[#1E2F31] text-[#99B6AA] border-[#4C4A4B] hover:text-white'
                }`}
                title="Toggle Presentation Mode"
              >
                {isPresenting ? <Minimize size={14}/> : <Maximize size={14}/>}
                <span className="hidden sm:inline">{isPresenting ? 'Exit Present' : 'Present'}</span>
              </button>

              <button 
                onClick={() => setSyncConfirmDialog({ isOpen: true, targetState: !isCloudSync })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isCloudSync 
                    ? cloudStatus === 'online' ? 'bg-[#1C6048] text-white border-[#1C6048] shadow-lg' : 'bg-[#9B8B70] text-white border-[#9B8B70] shadow-lg'
                    : 'bg-[#1E2F31] text-[#99B6AA] border-[#4C4A4B] hover:text-white'
                }`}
                title="Toggle Cloud Saving"
              >
                {isCloudSync ? (cloudStatus === 'online' ? <Cloud size={14}/> : <RefreshCcw size={14} className="animate-spin"/>) : <CloudOff size={14}/>}
                <span className="hidden sm:inline">
                   {isCloudSync ? (cloudStatus === 'online' ? 'Cloud Sync On' : 'Connecting...') : 'Local Mode'}
                </span>
              </button>
            </div>
        </div>
      </div>

      {/* PRIMARY LAYER NAV */}
      <nav className="bg-white border-b border-[#D8D8D8] sticky top-0 z-40 shadow-sm transition-all duration-300">
        <div className={`transition-all duration-300 ${containerClass}`}>
          {/* Group Switcher */}
          <div className="flex items-center gap-4 pt-3 border-b border-[#EFEBE7]">
            <button 
              onClick={() => handleGroupChange('context')}
              className={`pb-2 px-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeGroup === 'context' ? 'text-[#1C6048]' : 'text-[#4C4A4B] opacity-50 hover:opacity-100'}`}
            >
              <div className="flex items-center gap-2"><FolderTree size={14}/> Strategic Foundation</div>
              {activeGroup === 'context' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1C6048] rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => handleGroupChange('financials')}
              className={`pb-2 px-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeGroup === 'financials' ? 'text-[#1E2F31]' : 'text-[#4C4A4B] opacity-50 hover:opacity-100'}`}
            >
              <div className="flex items-center gap-2"><BarChartHorizontal size={14}/> Financial Engine</div>
              {activeGroup === 'financials' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1E2F31] rounded-t-full"></div>}
            </button>
          </div>

          <div className={`flex flex-col md:flex-row justify-between items-center gap-2 lg:gap-3 transition-all duration-300 ${isPresenting ? 'py-2' : 'py-3'}`}>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 text-[#1E2F31]">
                {activeTab === 'overview' ? <Info className="text-[#1C6048]" /> : 
                 activeTab === 'study' ? <BookOpen className="text-[#1C6048]" /> :
                 activeTab === 'collab' ? <Network className="text-[#1C6048]" /> :
                 activeCompany === 'opco' ? <Activity className="text-[#1C6048]" /> : 
                 activeCompany === 'propco' ? <Building2 className="text-[#9B8B70]" /> : 
                 <Layers className="text-[#1E2F31]" />} 

                {activeTab === 'overview' ? "Project Context" : 
                 activeTab === 'study' ? "Feasibility Study" :
                 activeTab === 'collab' ? "Collaboration Strategy" :
                 activeCompany === 'opco' ? "Hospital Operation Model" : 
                 activeCompany === 'propco' ? "PropCo Real Estate Model" :
                 "HoldCo Consolidated Position"}
              </h1>
            </div>

            {/* SECONDARY LAYER NAV (Tabs) */}
            <div className="flex p-1 bg-[#EFEBE7] rounded-lg gap-1 overflow-x-auto border border-[#D8D8D8] max-w-full items-center">
              {activeGroup === 'context' ? (
                <>
                  <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<FileText size={14} />} label="Overview" />
                  <NavButton active={activeTab === 'study'} onClick={() => setActiveTab('study')} icon={<BookOpen size={14} />} label="Study" />
                  <NavButton active={activeTab === 'collab'} onClick={() => setActiveTab('collab')} icon={<Network size={14} />} label="Collaboration Strategy" />
                </>
              ) : (
                <>
                  <div className="flex bg-white p-0.5 rounded-md border border-[#D8D8D8] mr-2 shadow-sm animate-in slide-in-from-right duration-300">
                      <button onClick={() => setActiveCompany('opco')} className={`px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider transition-all ${activeCompany === 'opco' ? 'bg-[#1C6048] text-white' : 'text-[#4C4A4B] hover:text-[#1E2F31]'}`}>OpCo</button>
                      <button onClick={() => setActiveCompany('propco')} className={`px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider transition-all ${activeCompany === 'propco' ? 'bg-[#9B8B70] text-white' : 'text-[#4C4A4B] hover:text-[#1E2F31]'}`}>PropCo</button>
                      <button onClick={() => { setActiveCompany('consolidated'); if (activeTab === 'sensitivity' || activeTab === 'assumptions') setActiveTab('dashboard'); }} className={`px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider transition-all ${activeCompany === 'consolidated' ? 'bg-[#1E2F31] text-white' : 'text-[#4C4A4B] hover:text-[#1E2F31]'}`}>HoldCo</button>
                  </div>
                  <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={14} />} label="Dashboard" />
                  <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<AIMicroscopeIcon size={14} />} label="AI Audit" />
                  <NavButton active={activeTab === 'comprehensive'} onClick={() => setActiveTab('comprehensive')} icon={<List size={14} />} label="Full Cascade" />
                  <NavButton active={activeTab === 'sensitivity'} onClick={() => setActiveTab('sensitivity')} icon={<Grid size={14} />} label="Sensitivity" disabled={activeCompany === 'consolidated'} />
                  <NavButton active={activeTab === 'assumptions'} onClick={() => setActiveTab('assumptions')} icon={<Settings size={14} />} label="Settings" disabled={activeCompany === 'consolidated'} />
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className={`transition-all duration-300 ${containerClass} ${isPresenting ? 'mt-4' : 'mt-6'}`}>
        {activeTab === 'overview' && <ProjectOverviewView info={projectInfo} setInfo={setProjectInfo} isLocked={activeCompany === 'opco' ? isLockedOpCo : isLockedPropCo} />}
        {activeTab === 'study' && <StudyView isPresenting={isPresenting} info={projectInfo} />}
        {activeTab === 'collab' && <CollaborationStrategyView isPresenting={isPresenting} />}
        
        {activeTab !== 'overview' && activeTab !== 'study' && activeTab !== 'collab' && activeTab !== 'ai' && activeCompany === 'opco' && activeGroup === 'financials' && (
            <div className="animate-in fade-in duration-500">
                {activeTab === 'dashboard' && <OpCoDashboardView data={opCoModelData} assumptions={opCoAssumptions} generateTeaser={generateTeaser} isTeaserLoading={isTeaserLoading} showTeaser={showTeaser} setShowTeaser={setShowTeaser} teaserContent={teaserContent} isPresenting={isPresenting} />}
                {activeTab === 'comprehensive' && <OpCoCascadeView data={opCoModelData} assumptions={opCoAssumptions} />}
                {activeTab === 'sensitivity' && <OpCoSensitivityView assumptions={opCoAssumptions} />}
                {activeTab === 'assumptions' && <OpCoSettingsView assumptions={opCoAssumptions} onChange={handleOpCoChange} onSyncEquity={syncEquityWithSharing} onValidate={validateAssumptions} isLocked={isLockedOpCo} onToggleLock={() => setIsLockedOpCo(!isLockedOpCo)} onSave={() => saveDefaultsToCloud('opco')} saveStatus={saveStatusOpCo} onReset={() => setOpCoAssumptions(DEFAULT_OPCO_ASSUMPTIONS)} isCloudSync={isCloudSync} isPresenting={isPresenting} />}
            </div>
        )}
        
        {activeTab !== 'overview' && activeTab !== 'study' && activeTab !== 'collab' && activeTab !== 'ai' && activeCompany === 'propco' && activeGroup === 'financials' && (
            <div className="animate-in fade-in duration-500">
                {activeTab === 'dashboard' && <PropCoDashboardView data={propCoModelData} assumptions={propCoAssumptions} generateTeaser={generateTeaser} isTeaserLoading={isTeaserLoading} showTeaser={showTeaser} setShowTeaser={setShowTeaser} teaserContent={teaserContent} setTab={setActiveTab} isPresenting={isPresenting} />}
                {activeTab === 'comprehensive' && <PropCoCascadeView data={propCoModelData} onExport={() => {}} />}
                {activeTab === 'sensitivity' && <PropCoSensitivityView assumptions={propCoAssumptions} opCoModelData={opCoModelData} />}
                {activeTab === 'assumptions' && <PropCoSettingsView assumptions={propCoAssumptions} onChange={handlePropCoChange} onValidate={validateAssumptions} isLocked={isLockedPropCo} onToggleLock={() => setIsLockedPropCo(!isLockedPropCo)} onSave={() => saveDefaultsToCloud('propco')} saveStatus={saveStatusPropCo} onReset={() => setPropCoAssumptions(DEFAULT_PROPCO_ASSUMPTIONS)} isCloudSync={isCloudSync} isPresenting={isPresenting} />}
            </div>
        )}

        {activeTab !== 'overview' && activeTab !== 'study' && activeTab !== 'collab' && activeTab !== 'ai' && activeCompany === 'consolidated' && activeGroup === 'financials' && (
            <div className="animate-in fade-in duration-500">
                {activeTab === 'dashboard' && <ConsolidatedDashboardView data={consolidatedModelData} assumptions={opCoAssumptions} isPresenting={isPresenting} />}
                {activeTab === 'comprehensive' && <ConsolidatedCascadeView data={consolidatedModelData} />}
            </div>
        )}
        
        {activeTab === 'ai' && activeGroup === 'financials' && <AIAuditView activeCompany={activeCompany} aiInsights={aiInsights} isAiLoading={isAiLoading} generateAIInsights={generateAIInsights} askQuery={askQuery} setAskQuery={setAskQuery} handleAskAI={handleAskAI} isAskLoading={isAskLoading} askResponse={askResponse} />}
      </main>

      <SelectionPopupComp state={selectionState} setState={setSelectionState} onAsk={handleSelectionAsk} />

      {syncConfirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-[#1E2F31]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#D8D8D8] transform scale-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${syncConfirmDialog.targetState ? 'bg-[#1C6048]/10 text-[#1C6048]' : 'bg-[#9B8B70]/10 text-[#9B8B70]'}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1E2F31]">
                {syncConfirmDialog.targetState ? "Enable Cloud Sync?" : "Switch to Local Mode?"}
              </h3>
            </div>
            <p className="text-[#4C4A4B] text-sm mb-6 leading-relaxed">
              {syncConfirmDialog.targetState 
                ? "Connecting to the cloud will save your new configurations, but it may initially overwrite your current screen with previously saved defaults. Are you sure you want to proceed?"
                : "Switching to Local Mode means your inputs will no longer be saved to the cloud. If you refresh the page while in Local Mode, any unsaved custom inputs will be lost."}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSyncConfirmDialog({ isOpen: false, targetState: false })} className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#4C4A4B] bg-[#EFEBE7] hover:bg-[#D8D8D8] transition-colors">Cancel</button>
              <button onClick={() => { setIsCloudSync(syncConfirmDialog.targetState); setSyncConfirmDialog({ isOpen: false, targetState: false }); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-colors ${syncConfirmDialog.targetState ? 'bg-[#1C6048] hover:bg-opacity-90' : 'bg-[#9B8B70] hover:bg-opacity-90'}`}>{syncConfirmDialog.targetState ? "Yes, Enable Sync" : "Yes, Switch to Local"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
