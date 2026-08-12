import React from "react";
import { X, Check, Plus, Trash2 } from "lucide-react";

interface OnboardModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newCustCompany: string;
  setNewCustCompany: (v: string) => void;
  newCustSector: string;
  setNewCustSector: (v: string) => void;
  newCustLocation: string;
  setNewCustLocation: (v: string) => void;
  newCustDescription: string;
  setNewCustDescription: (v: string) => void;
  newCustCoreProducts: string;
  setNewCustCoreProducts: (v: string) => void;
  newCustCompetitors: string;
  setNewCustCompetitors: (v: string) => void;
  newCustCoreSectors: string;
  setNewCustCoreSectors: (v: string) => void;
  newCustGeographies: string;
  setNewCustGeographies: (v: string) => void;
  newCustSectorsToAvoid: string;
  setNewCustSectorsToAvoid: (v: string) => void;
  newCustDesignations: string;
  setNewCustDesignations: (v: string) => void;
}

export const OnboardModal: React.FC<OnboardModalProps> = ({
  show,
  onClose,
  onSubmit,
  newCustCompany,
  setNewCustCompany,
  newCustSector,
  setNewCustSector,
  newCustLocation,
  setNewCustLocation,
  newCustDescription,
  setNewCustDescription,
  newCustCoreProducts,
  setNewCustCoreProducts,
  newCustCompetitors,
  setNewCustCompetitors,
  newCustCoreSectors,
  setNewCustCoreSectors,
  newCustGeographies,
  setNewCustGeographies,
  newCustSectorsToAvoid,
  setNewCustSectorsToAvoid,
  newCustDesignations,
  setNewCustDesignations
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl border border-gray-200 shadow-2xl overflow-hidden" style={{ borderRadius: "8px" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Add New Client</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-650 p-1 border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer rounded-md"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={onSubmit} className="px-6 py-4 space-y-1.5 max-h-[85vh] overflow-y-auto font-sans">
          <div className="text-[11px] font-bold text-slate-500 tracking-wider mb-0.5 uppercase">CLIENT IDENTITY</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Client Name <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="e.g. Acme Research Ltd" value={newCustCompany} onChange={(e) => setNewCustCompany(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Industry / Sector <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="e.g. Market research & strategy consulting" value={newCustSector} onChange={(e) => setNewCustSector(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Location <span className="text-red-500">*</span></label>
              <input required type="text" placeholder="e.g. London, UK" value={newCustLocation} onChange={(e) => setNewCustLocation(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Client Description <span className="text-red-500">*</span></label>
            <textarea rows={2} placeholder="What does this client do, who do they serve, what intelligence do they need? Used in all LLaMA scoring prompts." value={newCustDescription} onChange={(e) => setNewCustDescription(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50 resize-none" />
          </div>

          <div className="text-[11px] font-bold text-slate-500 tracking-wider pt-2 border-t border-gray-100 uppercase">OFFERINGS</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Focus Products or Services</label>
              <textarea rows={2} placeholder="e.g. market research, consulting" value={newCustCoreProducts} onChange={(e) => setNewCustCoreProducts(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50 resize-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Competitors</label>
              <textarea rows={2} placeholder="e.g. Frost & Sullivan, IDC" value={newCustCompetitors} onChange={(e) => setNewCustCompetitors(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50 resize-none" />
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-500 tracking-wider pt-2 border-t border-gray-100 uppercase">ICP DEFINITION</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Core Sectors</label>
              <textarea rows={2} placeholder="e.g. fintech, logistics" value={newCustCoreSectors} onChange={(e) => setNewCustCoreSectors(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50 resize-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Geographic Focus</label>
              <textarea rows={2} placeholder="e.g. IN, SG, MY" value={newCustGeographies} onChange={(e) => setNewCustGeographies(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50 resize-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Sectors to Avoid</label>
              <textarea rows={2} placeholder="e.g. aerospace, defence" value={newCustSectorsToAvoid} onChange={(e) => setNewCustSectorsToAvoid(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50 resize-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-0.5">Designations</label>
              <textarea rows={2} placeholder="e.g. CEO, Founder" value={newCustDesignations} onChange={(e) => setNewCustDesignations(e.target.value)} className="w-full px-3 py-1.5 text-[13px] bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50 resize-none" />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 mt-1">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-white hover:bg-gray-50 text-slate-700 text-xs font-semibold px-4 py-1.5 border border-gray-200 cursor-pointer rounded-[6px] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-[#1e293b] hover:bg-slate-800 text-white text-xs font-semibold px-5 py-1.5 cursor-pointer rounded-[6px] flex items-center gap-2 transition-all shadow-sm"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" /> Create Client & Activate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddCustomTaskModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newCustomTaskName: string;
  setNewCustomTaskName: (v: string) => void;
  newCustomSubTasks: string[];
  setNewCustomSubTasks: React.Dispatch<React.SetStateAction<string[]>>;
}

export const AddCustomTaskModal: React.FC<AddCustomTaskModalProps> = ({
  show,
  onClose,
  onSubmit,
  newCustomTaskName,
  setNewCustomTaskName,
  newCustomSubTasks,
  setNewCustomSubTasks
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-[468px] border border-gray-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200" style={{ borderRadius: "12px" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100">
          <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">New Custom Task</h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-650 p-1.5 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer rounded-lg"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SECTION: TASK IDENTITY */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-1">
              <h4 className="text-[10px] font-bold text-gray-400 tracking-widest">Task Identity</h4>
            </div>
            
            {/* Task Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-750">
                Task name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Competitor funding signals"
                value={newCustomTaskName}
                onChange={(e) => setNewCustomTaskName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#e0e7ff] placeholder-slate-400 font-medium transition-all"
              />
            </div>
          </div>

          {/* SECTION: REQUIRED SIGNALS / SUB-TASKS */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-1 flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-gray-400 tracking-widest">Required Signals</h4>
              <button
                type="button"
                onClick={() => setNewCustomSubTasks(prev => [...prev, ""])}
                className="text-[10.5px] text-[#4f46e5] font-bold hover:text-[#4338ca] transition-colors cursor-pointer flex items-center gap-1 bg-[#f5f3ff] px-2.5 py-1 rounded-md border border-indigo-100 animate-in fade-in"
              >
                <Plus className="h-3 w-3 stroke-[2.5]" /> Add Line
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {newCustomSubTasks.map((sub, index) => (
                <div key={index} className="flex gap-2 items-center animate-in slide-in-from-top-1 duration-150">
                  <div className="text-[10px] font-mono text-slate-400 select-none w-5 text-right">{index + 1}.</div>
                  <input
                    required
                    type="text"
                    placeholder={`e.g. Sub-task / specific milestone ${index + 1}`}
                    value={sub}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCustomSubTasks(prev => {
                        const copy = [...prev];
                        copy[index] = val;
                        return copy;
                      });
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 text-gray-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#e0e7ff] placeholder-slate-400 font-medium transition-all"
                  />
                  {newCustomSubTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewCustomSubTasks(prev => prev.filter((_, idx) => idx !== index));
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      title="Remove Line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-50 text-gray-750 text-xs font-semibold px-4.5 py-2 border border-gray-200 cursor-pointer transition-colors"
              style={{ borderRadius: "8px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold px-5 py-2 cursor-pointer transition-colors flex items-center gap-1.5 shadow-md active:scale-95"
              style={{ borderRadius: "8px" }}
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" /> Save task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
