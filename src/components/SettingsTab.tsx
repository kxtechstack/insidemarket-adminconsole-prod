/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Settings, 
  Cpu, 
  Sliders, 
  Lock, 
  HelpCircle, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  Terminal,
  Activity,
  Zap
} from "lucide-react";
import { SystemSettings, ModelOption } from "../types";

interface SettingsTabProps {
  settings: SystemSettings | null;
  onSaveSettings: (settings: SystemSettings) => Promise<void>;
  saving: boolean;
}

export default function SettingsTab({ settings, onSaveSettings, saving }: SettingsTabProps) {
  const [geminiModel, setGeminiModel] = useState("gemini-3.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1548);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [maxRequestsPerMin, setMaxRequestsPerMin] = useState(60);
  const [defaultSystemInstruction, setDefaultSystemInstruction] = useState("");
  const [intelligenceTone, setIntelligenceTone] = useState("strategic");

  const [toastMessage, setToastMessage] = useState("");

  const modelOptions: ModelOption[] = [
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Default)", type: "flash" },
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Advanced Reasoning)", type: "pro" },
    { value: "custom-simulation-runner", label: "Dynamic Simulation Model Framework", type: "custom" }
  ];

  // Load backend states if loaded
  useEffect(() => {
    if (settings) {
      setGeminiModel(settings.geminiModel || "gemini-3.5-flash");
      setTemperature(settings.temperature || 0.7);
      setMaxTokens(settings.maxTokens || 1548);
      setRateLimitEnabled(settings.rateLimitEnabled ?? true);
      setMaxRequestsPerMin(settings.maxRequestsPerMin || 60);
      setDefaultSystemInstruction(settings.defaultSystemInstruction || "");
      setIntelligenceTone(settings.intelligenceTone || "strategic");
    }
  }, [settings]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemSettings = {
      geminiModel,
      temperature: Number(temperature),
      maxTokens: Number(maxTokens),
      rateLimitEnabled,
      maxRequestsPerMin: Number(maxRequestsPerMin),
      defaultSystemInstruction,
      intelligenceTone
    };
    await onSaveSettings(updated);
    setToastMessage("Settings updated successfully!");
    setTimeout(() => setToastMessage(""), 3000);
  };

  if (!settings) {
    return (
      <div className="flex justify-center p-12 bg-white border border-[#e5e7eb] rounded-[6px]">
        <span className="text-gray-400 font-medium">Loading server configs...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-4 flex-1 w-full">
        
        {/* Toast feedback */}
        {toastMessage && (
          <div className="bg-emerald-500 text-white font-semibold text-xs px-4 py-3 rounded-[6px] flex items-center gap-2 animate-bounce fixed top-4 right-4 z-50">
            <CheckCircle2 className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        <form id="settings-form" onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* Model Configurations card */}
          <div className="bg-white border border-[#e5e7eb] p-4 rounded-[6px] space-y-3.5">
            <div className="flex items-center gap-1.5 mb-1 bg-white">
              <Cpu className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-gray-900">Model Target & Core Inference Parameters</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-850">
              <div>
                <label className="block font-bold text-gray-600 mb-1 flex items-center gap-1 text-[10px]">
                  Gemini LLM Deployment Engine:
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[6px] text-gray-800"
                  id="select-gemini-model"
                >
                  {modelOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1 text-[10px]">
                  Default Report Output Tone Preset:
                </label>
                <select
                  value={intelligenceTone}
                  onChange={(e) => setIntelligenceTone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[6px] text-gray-800"
                  id="select-intelligence-tone"
                >
                  <option value="strategic">Strategic Intelligence (Detailed, SWOT analysis focused)</option>
                  <option value="formal">Formal Academic (Highly technical, data driven)</option>
                  <option value="actionable">Actionable Operational (SLA compliance, concise bulletins)</option>
                  <option value="concise">Concise raw outline (Maximum metric density, brief summaries)</option>
                </select>
              </div>
            </div>

            {/* Sliding and Integer knobs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-655 text-[10px]">Temperature Override ({temperature})</label>
                  <span className="text-[9px] text-gray-400 font-mono">0.0 (Strict) - 1.0 (Creative)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full text-indigo-500 bg-gray-200 cursor-pointer accent-indigo-600 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-655 mb-1 text-[10px]">Max Output Generate Token Budget</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="8192"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[6px] text-gray-900 font-mono"
                />
                <span className="text-[10px] text-gray-455 mt-1 block">Maximum token size for a single response completion</span>
              </div>
            </div>
          </div>

          {/* System Instructions Settings card */}
          <div className="bg-white border border-[#e5e7eb] p-4 rounded-[6px] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-gray-900">System Instructions Injector</h3>
              </div>
              
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-[4px] font-mono">
                Injected on serve-init
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                Default System Instructions (Role/Context/Format Guidelines)
              </label>
              <textarea
                required
                rows={4}
                placeholder="You are an elite research agent tasked with structural competitor analysis..."
                value={defaultSystemInstruction}
                onChange={(e) => setDefaultSystemInstruction(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f9fafb] border border-[#d1d5db] rounded-[6px] focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-gray-900 leading-relaxed"
              />
              <span className="text-[10px] text-gray-455 mt-1 block leading-tight">
                This system context instructs the Gemini model on its role, limitations, and standard tone prior to compiling variables.
              </span>
            </div>
          </div>

          {/* Security & Access Restrictions and API Management */}
          <div className="bg-white border border-[#e5e7eb] p-4 rounded-[6px] space-y-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-gray-900">Security Boundaries & API Rate Limiting</h3>
            </div>

            <div className="space-y-3 text-xs text-gray-800">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={rateLimitEnabled}
                  onChange={(e) => setRateLimitEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-0.5 rounded-sm"
                  id="chk-rate-limit"
                />
                <div>
                  <label htmlFor="chk-rate-limit" className="font-semibold text-gray-855 block cursor-pointer select-none">
                    Enable client query rate thresholds
                  </label>
                  <p className="text-[10px] text-gray-455 mt-0.5">
                    Enforces strict request limits on client IDs to prevent API key depletion and unexpected billing.
                  </p>
                </div>
              </div>

              {rateLimitEnabled && (
                <div className="flex items-center gap-2.5 pl-6 max-w-sm">
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">Threshold cap:</span>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={maxRequestsPerMin}
                    onChange={(e) => setMaxRequestsPerMin(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-xs bg-white border border-[#d1d5db] rounded-[6px] font-mono text-center"
                  />
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">requests per min</span>
                </div>
              )}

              <hr className="border-gray-100" />

              {/* Secret key deployment state warning */}
              <div className="bg-slate-50 p-3 border border-[#e5e7eb] rounded-[6px] flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-bold text-gray-900 font-mono tracking-tight">Active Key Credentials Status:</h4>
                  <p className="text-[10px] text-gray-555 mt-1 leading-normal">
                    Secret keys are injected using standard container setups. 
                    Never hardcode critical API endpoints inside client-side JS bundles. 
                    Modify secrets in the **Settings & Secrets Manager** within Google AI Studio workspace tab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Submit Form Action Bar - Sticky at bottom */}
      <div className="sticky bottom-0 z-30 p-4 pt-3 flex justify-end bg-white/40 backdrop-blur-md border-t border-gray-200">
        <button
          form="settings-form"
          type="submit"
          disabled={saving}
          id="btn-save-settings"
          className="flex items-center gap-2 bg-black hover:bg-slate-800 disabled:opacity-50 text-white text-[11px] font-bold py-2 px-10 rounded-[6px] cursor-pointer transition-all shadow-lg active:scale-95"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving Configurations..." : "Save System Settings"}
        </button>
      </div>
    </div>
  );
}
