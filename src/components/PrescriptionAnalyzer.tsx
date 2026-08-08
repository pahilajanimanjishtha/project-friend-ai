import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pill, Upload, Sparkles, CheckCircle, AlertTriangle, ShieldCheck, HeartPulse, RefreshCw } from 'lucide-react';

interface PrescriptionAnalyzerProps {
  isLightMode: boolean;
}

export default function PrescriptionAnalyzer({ isLightMode }: PrescriptionAnalyzerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      
      // Extract base64 part
      const base64Data = result.split(',')[1];
      setImageBase64(base64Data);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setImageMime(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const base64Data = result.split(',')[1];
      setImageBase64(base64Data);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerAnalysis = async () => {
    if (!imageBase64) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            data: imageBase64,
            mimeType: imageMime
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data.text);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to analyze the prescription. Please check the image and try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to Medical Sanctuary Companion lost. Ensure the server is online.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setAnalysisResult(null);
    setError(null);
  };

  // Helper to format structured Markdown safely into custom JSX cards
  const formatAnalysisToJSX = (text: string) => {
    if (!text) return null;
    
    // Split into lines
    const lines = text.split('\n');
    let currentSection: 'intro' | 'identified' | 'clinical' | 'somatic' | 'disclaimer' = 'intro';
    const sections: Record<string, string[]> = {
      intro: [],
      identified: [],
      clinical: [],
      somatic: [],
      disclaimer: []
    };

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('identified') || lower.includes('1.')) {
        currentSection = 'identified';
      } else if (lower.includes('clinical') || lower.includes('2.')) {
        currentSection = 'clinical';
      } else if (lower.includes('mindfulness') || lower.includes('somatic') || lower.includes('support') || lower.includes('3.')) {
        currentSection = 'somatic';
      } else if (lower.includes('warning') || lower.includes('disclaimer') || lower.includes('4.')) {
        currentSection = 'disclaimer';
      } else {
        sections[currentSection].push(line);
      }
    });

    const renderLines = (arr: string[]) => {
      return arr.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          return (
            <li key={i} className="text-xs list-disc ml-5 mt-1 leading-relaxed opacity-90">
              {trimmed.replace(/^[\*\-\s]+/, '')}
            </li>
          );
        }
        if (trimmed.match(/^\d+\./)) {
          return (
            <p key={i} className="text-xs font-semibold mt-2 text-[#c9a45c]">
              {trimmed}
            </p>
          );
        }
        return (
          <p key={i} className="text-xs leading-relaxed opacity-85 mt-1">
            {trimmed.replace(/^#+/, '')}
          </p>
        );
      });
    };

    return (
      <div className="space-y-4">
        {sections.intro.length > 0 && (
          <div className="p-4 rounded-xl bg-black/10 border border-brown/20">
            {renderLines(sections.intro)}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-5 rounded-2xl border ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/30 border-brown'}`}>
            <div className="flex items-center gap-2 mb-3 text-[#c9a45c] font-serif font-bold">
              <Pill className="w-4 h-4" /> 1. Identified Medication Info
            </div>
            <div className="space-y-1">
              {sections.identified.length > 0 ? renderLines(sections.identified) : <p className="text-xs italic opacity-50">Checking prescription package...</p>}
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/30 border-brown'}`}>
            <div className="flex items-center gap-2 mb-3 text-periwinkle font-serif font-bold">
              <ShieldCheck className="w-4 h-4" /> 2. Clinical Use & Actions
            </div>
            <div className="space-y-1">
              {sections.clinical.length > 0 ? renderLines(sections.clinical) : <p className="text-xs italic opacity-50 font-sans">Awaiting photo details...</p>}
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be]' : 'bg-brown-deep/40 border-[#c9a45c]/30'}`}>
          <div className="flex items-center gap-2 mb-3 text-emerald-400 font-serif font-bold">
            <HeartPulse className="w-4 h-4" /> 3. Mindful & Somatic Integration
          </div>
          <div className="space-y-1 font-serif text-sm italic">
            {sections.somatic.length > 0 ? renderLines(sections.somatic) : <p className="text-xs italic opacity-50">Mapping custom breathing exercises for this therapy...</p>}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-100 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold font-serif text-sm">
            <AlertTriangle className="w-5 h-5 animate-pulse" /> 4. IMPORTANT CLINICAL SAFETY DISCLAIMER
          </div>
          <div className="text-xs opacity-90 leading-relaxed font-sans">
            {sections.disclaimer.length > 0 ? renderLines(sections.disclaimer) : (
              <p>
                WARNING: This is an AI simulation companion, not a licensed medical professional or physician. You must verify all medication labels, prescription volumes, and dosing schedules with a qualified pharmacist or family physician before intake.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b-2 border-brown/20 pb-4">
        <h3 className="font-serif text-2xl font-bold">Clinical Pill Sandbox & Prescription Analyzer</h3>
        <p className="text-xs opacity-75">
          Scan your medical prescriptions, formulas, or clinical labels. Get calming neurological descriptions, somatic breathing pairings, and clear safety checks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Column */}
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
              imagePreview 
                ? 'border-[#c9a45c]/50 bg-black/10' 
                : 'border-brown/40 hover:border-[#c9a45c] bg-black/15 cursor-pointer'
            }`}
          >
            {imagePreview ? (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="Prescription preview"
                  className="max-h-64 mx-auto rounded-xl object-contain shadow-md border border-brown/20"
                  referrerPolicy="no-referrer"
                />
                <div className="flex justify-center gap-3">
                  <button
                    onClick={clearImage}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-xs uppercase tracking-wider rounded-lg font-bold transition-all cursor-pointer"
                  >
                    Remove Image
                  </button>
                  <button
                    onClick={triggerAnalysis}
                    disabled={isAnalyzing}
                    className="px-5 py-2 bg-[#c9a45c] hover:bg-[#c9a45c]/80 text-black font-mono text-xs uppercase tracking-widest rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Photo'}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center space-y-3 cursor-pointer py-10">
                <div className="p-3.5 rounded-2xl bg-[#c9a45c]/10 text-[#c9a45c] border border-[#c9a45c]/20">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Click or drag your medication photo here</p>
                  <p className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP (Max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="p-4 rounded-xl bg-black/15 border border-brown/20 text-[11px] leading-relaxed text-slate-400 space-y-1">
            <span className="font-bold text-[#c9a45c]">💡 Somatic Medicine Tip:</span>
            <p>
              When taking a dose of required medicine, pair the physical action with 2 slow diaphragmatic breaths. It signals your nervous system that you are actively caring for your vessel, accelerating deep relief.
            </p>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[250px] flex flex-col items-center justify-center text-center space-y-4 p-8 border border-brown/30 bg-black/15 rounded-3xl"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-t-[#c9a45c] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  <Pill className="w-6 h-6 text-[#c9a45c] absolute inset-0 m-auto animate-bounce" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="font-serif text-sm font-bold text-white">Consulting Medical Companion</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Translating handwriting, medical formulas, and prescription dosage rates into somatic alignment paths using Gemini-3.1-Pro-Preview...
                  </p>
                </div>
              </motion.div>
            )}

            {!isAnalyzing && error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 border border-red-500/30 bg-red-500/5 rounded-3xl text-center space-y-3"
              >
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                <p className="text-xs text-red-200">{error}</p>
                <button
                  onClick={triggerAnalysis}
                  className="px-4 py-2 bg-red-500/20 text-red-200 text-xs font-mono rounded-xl hover:bg-red-500/30"
                >
                  Retry Analysis
                </button>
              </motion.div>
            )}

            {!isAnalyzing && !analysisResult && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[300px] border border-dashed border-brown/30 bg-black/10 rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-60"
              >
                <Pill className="w-12 h-12 text-[#c9a45c]/80 animate-pulse" />
                <h4 className="font-serif text-base font-bold text-white">Awaiting Medication Scan</h4>
                <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
                  Upload an image of your pills, medicinal package, or prescription card to receive beautiful, safe somatic coaching and clinical context.
                </p>
              </motion.div>
            )}

            {!isAnalyzing && analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#c9a45c] bg-[#c9a45c]/10 border border-[#c9a45c]/25 px-3 py-1 rounded-full">
                    ✓ Analysis Completed
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">Model: gemini-3.1-pro-preview</p>
                </div>
                {formatAnalysisToJSX(analysisResult)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
