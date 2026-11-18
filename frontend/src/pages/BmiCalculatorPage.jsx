import React, { useState } from 'react';
import { Calculator, RotateCcw, Activity } from 'lucide-react';

const CATEGORIES = [
  { key: 'under', label: 'Underweight', min: 0, max: 18.5, color: 'text-sky-400', bar: 'bg-sky-400', tip: 'Aap ka weight normal se kam hai. Balanced diet aur strength training se healthy weight gain karein.' },
  { key: 'normal', label: 'Normal', min: 18.5, max: 25, color: 'text-emerald-400', bar: 'bg-emerald-400', tip: 'Bohat acha! Aap healthy weight range mein hain. Isi routine ko barqarar rakhein.' },
  { key: 'over', label: 'Overweight', min: 25, max: 30, color: 'text-yellow-400', bar: 'bg-yellow-400', tip: 'Aap ka weight thoda zyada hai. Cardio, regular workout aur diet control se behtar ho sakta hai.' },
  { key: 'obese', label: 'Obese', min: 30, max: 100, color: 'text-red-400', bar: 'bg-red-400', tip: 'BMI kaafi zyada hai. Apne trainer ya doctor se diet/workout plan ke liye mashwara karein.' },
];

function getCategory(bmi) {
  if (bmi < 18.5) return CATEGORIES[0];
  if (bmi < 25) return CATEGORIES[1];
  if (bmi < 30) return CATEGORIES[2];
  return CATEGORIES[3];
}

export default function BmiCalculatorPage() {
  const [unit, setUnit] = useState('metric'); // metric | imperial
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    setError('');

    let heightM;
    let weightKg;

    if (unit === 'metric') {
      const h = parseFloat(heightCm);
      const w = parseFloat(weight);
      if (!h || !w || h <= 0 || w <= 0) {
        setError('Please enter valid height (cm) and weight (kg).');
        setResult(null);
        return;
      }
      if (h < 50 || h > 272) {
        setError('Height must be between 50 and 272 cm.');
        setResult(null);
        return;
      }
      heightM = h / 100;
      weightKg = w;
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      const w = parseFloat(weight);
      const totalInches = ft * 12 + inch;
      if (totalInches <= 0 || !w || w <= 0) {
        setError('Please enter valid height (ft/in) and weight (lbs).');
        setResult(null);
        return;
      }
      if (totalInches < 20 || totalInches > 107) {
        setError('Please enter a realistic height.');
        setResult(null);
        return;
      }
      heightM = totalInches * 0.0254;
      weightKg = w * 0.45359237;
    }

    const bmi = weightKg / (heightM * heightM);
    const minHealthy = 18.5 * heightM * heightM;
    const maxHealthy = 24.9 * heightM * heightM;

    setResult({
      bmi: bmi.toFixed(1),
      category: getCategory(bmi),
      minHealthy,
      maxHealthy,
      weightKg,
    });
  };

  const handleReset = () => {
    setHeightCm('');
    setHeightFt('');
    setHeightIn('');
    setWeight('');
    setError('');
    setResult(null);
  };

  const switchUnit = (u) => {
    setUnit(u);
    handleReset();
  };

  // Marker position on gauge (BMI 10 -> 0%, BMI 40 -> 100%)
  const markerPos = result
    ? Math.min(100, Math.max(0, ((parseFloat(result.bmi) - 10) / 30) * 100))
    : 0;

  const formatRange = (kg) =>
    unit === 'metric' ? `${kg.toFixed(1)} kg` : `${(kg / 0.45359237).toFixed(1)} lbs`;

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
          <Calculator size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">BMI Calculator</h1>
          <p className="text-xs text-slate-400">Body Mass Index calculate karein aur apni fitness category jaanein.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form */}
        <form
          onSubmit={handleCalculate}
          className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-4"
        >
          {/* Unit toggle */}
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => switchUnit('metric')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                unit === 'metric' ? 'bg-yellow-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Metric (cm / kg)
            </button>
            <button
              type="button"
              onClick={() => switchUnit('imperial')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                unit === 'imperial' ? 'bg-yellow-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Imperial (ft / lbs)
            </button>
          </div>

          {/* Height */}
          {unit === 'metric' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Height (cm)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 175"
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Height (feet / inches)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  placeholder="ft"
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="in"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Weight ({unit === 'metric' ? 'kg' : 'lbs'})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={unit === 'metric' ? 'e.g. 70' : 'e.g. 154'}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/10"
            >
              <Activity size={16} />
              Calculate BMI
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </form>

        {/* Result */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 flex flex-col justify-center">
          {!result ? (
            <div className="text-center text-slate-500 text-sm py-10">
              <Calculator size={36} className="mx-auto mb-3 opacity-40" />
              Height aur weight enter karke <span className="text-yellow-400 font-semibold">Calculate BMI</span> dabayein.
            </div>
          ) : (
            <div>
              <div className="text-center mb-5">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Your BMI</div>
                <div className={`text-5xl font-extrabold ${result.category.color}`}>{result.bmi}</div>
                <div className={`mt-1 text-sm font-bold ${result.category.color}`}>{result.category.label}</div>
              </div>

              {/* Gauge */}
              <div className="mb-5">
                <div className="relative h-3 rounded-full overflow-hidden flex">
                  <div className="bg-sky-400" style={{ width: '28.3%' }} />
                  <div className="bg-emerald-400" style={{ width: '21.7%' }} />
                  <div className="bg-yellow-400" style={{ width: '16.7%' }} />
                  <div className="bg-red-400 flex-1" />
                </div>
                <div className="relative h-4">
                  <div
                    className="absolute -top-0.5 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white"
                    style={{ left: `calc(${markerPos}% - 6px)` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>10</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40+</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed mb-3">
                {result.category.tip}
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">Healthy weight range</span>
                <span className="font-bold text-emerald-400">
                  {formatRange(result.minHealthy)} – {formatRange(result.maxHealthy)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reference table */}
      <div className="mt-6 p-5 rounded-2xl bg-[#0d121c] border border-slate-800">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">BMI Categories (WHO)</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((c) => (
            <div
              key={c.key}
              className={`p-3 rounded-xl bg-slate-900/80 border ${
                result && result.category.key === c.key ? 'border-yellow-500' : 'border-slate-800'
              }`}
            >
              <div className={`text-xs font-bold ${c.color}`}>{c.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {c.key === 'under' && 'Below 18.5'}
                {c.key === 'normal' && '18.5 – 24.9'}
                {c.key === 'over' && '25 – 29.9'}
                {c.key === 'obese' && '30 and above'}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Note: BMI sirf ek andaza hai. Muscular body walon ke liye result zyada aa sakta hai. Behtar guidance ke liye apne trainer se baat karein.
        </p>
      </div>
    </div>
  );
}