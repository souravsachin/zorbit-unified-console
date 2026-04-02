import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  Table2,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Sample preview data (matches PII Showcase records)                 */
/* ------------------------------------------------------------------ */

const PREVIEW_ROWS = [
  { fullName: 'Saurab Mehta', age: '42', gender: 'Male', email: 'saurab.mehta@gmail.com', phone: '+91-98765-43210', address: '12 MG Road, Bangalore 560001', bankAccount: 'HDFC-XXXX-XXXX-4521', ssn: '123-45-6789' },
  { fullName: 'Priya Sharma', age: '35', gender: 'Female', email: 'priya.sharma@outlook.com', phone: '+91-87654-32100', address: '45 Park Street, Kolkata 700016', bankAccount: 'SBI-XXXX-XXXX-8832', ssn: '234-56-7890' },
  { fullName: 'Rahul Tripathi', age: '29', gender: 'Male', email: 'rahul.t@yahoo.com', phone: '+91-76543-21000', address: '78 Anna Salai, Chennai 600002', bankAccount: 'ICICI-XXXX-XXXX-3345', ssn: '345-67-8901' },
];

type PIIType = 'PII - Name' | 'PII - Email' | 'PII - Phone' | 'PII - Address' | 'PII - Financial' | 'PII - Government ID' | 'Non-PII';
type TokenStrategy = 'Tokenize' | 'Nickname' | 'Pass-through';

interface FieldMapping {
  column: string;
  detectedType: PIIType;
  strategy: TokenStrategy;
}

const INITIAL_MAPPINGS: FieldMapping[] = [
  { column: 'fullName', detectedType: 'PII - Name', strategy: 'Tokenize' },
  { column: 'age', detectedType: 'Non-PII', strategy: 'Pass-through' },
  { column: 'gender', detectedType: 'Non-PII', strategy: 'Pass-through' },
  { column: 'email', detectedType: 'PII - Email', strategy: 'Tokenize' },
  { column: 'phone', detectedType: 'PII - Phone', strategy: 'Tokenize' },
  { column: 'address', detectedType: 'PII - Address', strategy: 'Tokenize' },
  { column: 'bankAccount', detectedType: 'PII - Financial', strategy: 'Tokenize' },
  { column: 'ssn', detectedType: 'PII - Government ID', strategy: 'Tokenize' },
];

const PII_TYPE_OPTIONS: PIIType[] = [
  'PII - Name', 'PII - Email', 'PII - Phone', 'PII - Address', 'PII - Financial', 'PII - Government ID', 'Non-PII',
];

const STRATEGY_OPTIONS: TokenStrategy[] = ['Tokenize', 'Nickname', 'Pass-through'];

const PROCESSING_STAGES = [
  'Classifying fields...',
  'Extracting PII data...',
  'Generating tokens...',
  'Storing to operational DB...',
];

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Upload' },
    { num: 2, label: 'Map Fields' },
    { num: 3, label: 'Processing' },
    { num: 4, label: 'Complete' },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => {
        const done = currentStep > s.num;
        const active = currentStep === s.num;
        return (
          <React.Fragment key={s.num}>
            {i > 0 && (
              <div className={`h-0.5 w-10 ${done ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            )}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done
                    ? 'bg-indigo-500 text-white'
                    : active
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 dark:ring-indigo-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs mt-1 ${active ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                {s.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const PIIUploadPage: React.FC = () => {
  const { orgId } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [mappings, setMappings] = useState<FieldMapping[]>(INITIAL_MAPPINGS);

  // Step 3 state
  const [processingStage, setProcessingStage] = useState(0);

  const simulateFileSelect = useCallback(() => {
    setSelectedFile({ name: 'customers_q1_2026.csv', size: '2.4 MB' });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    simulateFileSelect();
  }, [simulateFileSelect]);

  // Auto-advance processing stages
  useEffect(() => {
    if (currentStep !== 3) return;
    if (processingStage >= PROCESSING_STAGES.length) {
      const timer = setTimeout(() => setCurrentStep(4), 500);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setProcessingStage((s) => s + 1), 1000);
    return () => clearTimeout(timer);
  }, [currentStep, processingStage]);

  const startProcessing = () => {
    setProcessingStage(0);
    setCurrentStep(3);
  };

  const resetAll = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setMappings(INITIAL_MAPPINGS);
    setProcessingStage(0);
  };

  const updateMapping = (idx: number, field: keyof FieldMapping, value: string) => {
    setMappings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
          <Upload className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload &amp; Ingest</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload data files for PII detection, classification, and tokenization
          </p>
        </div>
      </div>

      <StepIndicator currentStep={currentStep} />

      {/* ------------------------------------------------------------ */}
      {/*  Step 1 — File Selection                                      */}
      {/* ------------------------------------------------------------ */}
      {currentStep === 1 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="border-l-4 border-indigo-500 pl-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Step 1: Select File</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a CSV or Excel file containing records to process</p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => { if (!selectedFile) { fileInputRef.current?.click(); simulateFileSelect(); } }}
            className={`
              border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors
              ${dragOver
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                : selectedFile
                ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'}
            `}
          >
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={simulateFileSelect} />

            {selectedFile ? (
              <>
                <FileSpreadsheet className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedFile.size}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="mt-3 text-xs text-red-500 hover:text-red-600 underline"
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                  Drop CSV or Excel file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Accepted formats: .csv, .xlsx, .xls</p>
              </>
            )}
          </div>

          {selectedFile && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Step 2 — Field Mapping & PII Detection                       */}
      {/* ------------------------------------------------------------ */}
      {currentStep === 2 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-8">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Step 2: Field Mapping &amp; PII Detection</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review auto-detected PII classifications and adjust as needed</p>
          </div>

          {/* Preview table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Table2 className="w-4 h-4" /> Data Preview (first 3 rows)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    {Object.keys(PREVIEW_ROWS[0]).map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW_ROWS.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                      {Object.entries(row).map(([col, val]) => {
                        const mapping = mappings.find((m) => m.column === col);
                        const isPii = mapping ? mapping.detectedType !== 'Non-PII' : false;
                        return (
                          <td
                            key={col}
                            className={`px-3 py-2 whitespace-nowrap ${isPii ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20' : 'text-gray-700 dark:text-gray-300'}`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Field mapping panel */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Field Classification &amp; Tokenization Strategy
            </h3>
            <div className="space-y-2">
              {mappings.map((m, idx) => {
                const isPii = m.detectedType !== 'Non-PII';
                return (
                  <div
                    key={m.column}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isPii
                        ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10'
                        : 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10'
                    }`}
                  >
                    {/* Column name */}
                    <span className="w-28 text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 shrink-0">{m.column}</span>

                    {/* PII badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isPii ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    }`}>
                      {isPii ? 'PII' : 'SAFE'}
                    </span>

                    {/* Type dropdown */}
                    <select
                      value={m.detectedType}
                      onChange={(e) => updateMapping(idx, 'detectedType', e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex-1 min-w-[140px]"
                    >
                      {PII_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    {/* Strategy dropdown */}
                    <select
                      value={m.strategy}
                      onChange={(e) => updateMapping(idx, 'strategy', e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-32"
                    >
                      {STRATEGY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={startProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              Process File <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Step 3 — Processing Animation                                */}
      {/* ------------------------------------------------------------ */}
      {currentStep === 3 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="border-l-4 border-indigo-500 pl-4 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Step 3: Processing</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Classifying, extracting, tokenizing, and storing data</p>
          </div>

          <div className="max-w-lg mx-auto space-y-6">
            {/* Progress bar */}
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min((processingStage / PROCESSING_STAGES.length) * 100, 100)}%` }}
              />
            </div>

            {/* Stages */}
            <div className="space-y-3">
              {PROCESSING_STAGES.map((stage, i) => {
                const done = processingStage > i;
                const active = processingStage === i;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : active ? (
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                    )}
                    <span className={`text-sm ${done ? 'text-green-600 dark:text-green-400 font-medium' : active ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/*  Step 4 — Completion Summary                                  */}
      {/* ------------------------------------------------------------ */}
      {currentStep === 4 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">File Processed Successfully</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            All PII fields have been detected, tokenized, and stored securely.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">342</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Records Processed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">2,394</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PII Fields Detected</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">2,394</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tokens Generated</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Link
              to={`/O/${orgId}/pii-showcase`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              <Eye className="w-4 h-4" /> View in PII Showcase
            </Link>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Upload Another File
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default PIIUploadPage;
