import React, { useEffect } from "react";
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Trash2,
  Check,
  Settings
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useIntelligenceModules } from "../../../data/intelligenceModules";

interface MonitoringScopeTabProps {
  selectedClientId: string;
  activeModuleId: string;
  setActiveModuleId: (id: string) => void;
  enabledModules: Record<string, boolean>;
  setEnabledModules: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  customTasks: Record<string, any[]>;
  selectedCustomSignals: Record<string, string[]>;
  selectedSignals: Record<string, string[]>;
  setSelectedCustomSignals: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setSelectedSignals: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  expandedCategories: Set<string>;
  setExpandedCategories: React.Dispatch<React.SetStateAction<Set<string>>>;
  confirmDeleteCustomTaskId: string | null;
  setConfirmDeleteCustomTaskId: (id: string | null) => void;
  setCustomTasks: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const MonitoringScopeTab: React.FC<MonitoringScopeTabProps> = ({
  selectedClientId,
  activeModuleId,
  setActiveModuleId,
  enabledModules,
  setEnabledModules,
  customTasks,
  selectedCustomSignals,
  selectedSignals,
  setSelectedCustomSignals,
  setSelectedSignals,
  expandedCategories,
  setExpandedCategories,
  confirmDeleteCustomTaskId,
  setConfirmDeleteCustomTaskId,
  setCustomTasks,
  showToast
}) => {
  const { modules: INTELLIGENCE_MODULES, loading } = useIntelligenceModules();

  const currentClientCustomTasks = customTasks[selectedClientId] || [];

  const allModules = [...INTELLIGENCE_MODULES, {
    id: 'custom_tasks',
    label: 'Custom Tasks',
    icon: FileText,
    color: '#7E22CE',
    bg: '#F5F0FF',
    description: 'Bespoke custom intelligence monitoring tasks and sub-tasks defined specifically for this client.',
    categories: []
  }];

  const handleToggleSignal = async (category: any, signal: any, isSelected: boolean) => {
    const next = { ...selectedSignals };
    const arr = next[category.id] || [];
    if (isSelected) {
      next[category.id] = arr.filter(i => i !== signal.id);
    } else {
      next[category.id] = [...arr, signal.id];
    }
    setSelectedSignals(next);
  };

  const handleToggleCategory = async (category: any, isAllSelected: boolean) => {
    const next = { ...selectedSignals };
    next[category.id] = isAllSelected ? [] : category.items.map((s: any) => s.id);
    setSelectedSignals(next);
  };

  const handleToggleModuleAll = async (module: any, isClear: boolean) => {
    const next = { ...selectedSignals };
    module.categories.forEach((cat: any) => {
      next[cat.id] = isClear ? [] : cat.items.map((s: any) => s.id);
    });
    setSelectedSignals(next);
  };

  return (
    <div className="flex bg-white h-[600px] border border-[#e2e8f0] rounded-[6px]">
      {/* 1. Left Sidebar: Module Selection */}
      <div className="w-[280px] border-r border-[#e2e8f0] flex flex-col bg-white shrink-0">
        <div className="h-[40px] px-4 border-b border-[#e2e8f0] flex items-center">
          <h3 className="text-[11px] font-bold text-slate-900 tracking-wider uppercase">Intelligence Modules</h3>
        </div>
        
        <div className="flex-1 min-h-0 p-1.5 space-y-1 overflow-y-auto">
          {allModules.map((module) => {
            const isEnabled = Boolean(enabledModules[module.id]);
            const isActive = activeModuleId === module.id;
            const isCustom = module.id === 'custom_tasks';
            const selectedCount = isCustom
              ? currentClientCustomTasks.reduce((acc, task) => acc + (selectedCustomSignals[task.id]?.length || 0), 0)
              : module.categories.reduce((acc, cat) => acc + (selectedSignals[cat.id]?.length || 0), 0);
            const totalCount = isCustom
              ? currentClientCustomTasks.reduce((acc, task) => acc + task.subTasks.length, 0)
              : module.categories.reduce((acc, cat) => acc + cat.items.length, 0);

            return (
              <div 
                key={module.id} 
                onClick={() => setActiveModuleId(module.id)}
                className={`group flex items-center justify-between p-1.5 px-2.5 border rounded-[6px] cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? "border-indigo-600 bg-white" 
                    : "border-transparent bg-white/50 hover:bg-white hover:border-[#e2e8f0]"
                } ${!isEnabled ? "opacity-60 grayscale-[0.5]" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className={`p-1.5 rounded-[6px] transition-colors ${isActive ? "" : "bg-slate-100"}`}
                    style={{ backgroundColor: isActive ? module.bg : undefined }}
                  >
                    <module.icon 
                      className={`h-4 w-4 ${isActive ? "" : "text-slate-500"}`} 
                      style={{ color: isActive ? module.color : undefined }}
                    />
                  </div>
                  <div>
                    <p className={`text-[12px] font-semibold tracking-tight ${isActive ? "text-indigo-900" : "text-slate-700"}`}>
                      {module.label}
                    </p>
                    <p className="text-[10px] text-slate-600 font-medium">
                      {isEnabled ? `${selectedCount}/${totalCount} signals` : "Disabled"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEnabled && selectedCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: module.bg, color: module.color }}>
                      {selectedCount}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEnabledModules(prev => ({ ...prev, [module.id]: !isEnabled }));
                    }}
                    className={`relative inline-flex h-4 w-7 items-center shrink-0 cursor-pointer rounded-full transition-all duration-300 ${
                      isEnabled ? "bg-black" : "bg-slate-300"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white transition duration-300 ease-in-out ${
                      isEnabled ? "translate-x-3.5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Active Summary Box */}
        <div className="p-3 border-t border-[#e2e8f0] bg-slate-50/80">
          <h4 className="text-[11px] font-bold text-slate-900 tracking-wider mb-2 uppercase">Active Summary</h4>
          <div className="space-y-1.5">
            {allModules.filter(m => Boolean(enabledModules[m.id])).map(m => {
              const isCustom = m.id === 'custom_tasks';
              const count = isCustom
                ? (customTasks[selectedClientId] || []).reduce((acc, task) => acc + (selectedCustomSignals[task.id]?.length || 0), 0)
                : m.categories.reduce((acc, cat) => acc + (selectedSignals[cat.id]?.length || 0), 0);
              return (
                <div key={m.id} className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">{m.label}</span>
                  <span className="font-bold text-slate-800" style={{ color: m.color }}>{count}</span>
                </div>
              );
            })}
            {allModules.filter(m => Boolean(enabledModules[m.id])).length === 0 && (
              <p className="text-[11px] text-slate-500">No modules enabled</p>
            )}
            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-900">Total active signals</span>
              <span className="text-[13px] font-bold text-indigo-600">
                {allModules
                  .filter(m => Boolean(enabledModules[m.id]))
                  .reduce((total, m) => {
                    const isCustom = m.id === 'custom_tasks';
                    const count = isCustom
                      ? (customTasks[selectedClientId] || []).reduce((acc, task) => acc + (selectedCustomSignals[task.id]?.length || 0), 0)
                      : m.categories.reduce((acc, cat) => acc + (selectedSignals[cat.id]?.length || 0), 0);
                    return total + count;
                  }, 0)
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main Content: Module Configuration */}
      <div className="flex-1 flex flex-col bg-[#fcfdfe]">
        {activeModuleId ? (
          <>
            {/* Module Header */}
            {(() => {
              const isCustom = activeModuleId === 'custom_tasks';
              const module = isCustom 
                ? allModules.find(m => m.id === 'custom_tasks')!
                : INTELLIGENCE_MODULES.find(m => m.id === activeModuleId);
              
              if (!module) return null;

              const isEnabled = Boolean(enabledModules[module.id]);
              const totalSelected = isCustom
                ? (customTasks[selectedClientId] || []).reduce((acc, task) => acc + (selectedCustomSignals[task.id]?.length || 0), 0)
                : module.categories.reduce((acc, cat) => acc + (selectedSignals[cat.id]?.length || 0), 0);
              const totalAvailable = isCustom
                ? (customTasks[selectedClientId] || []).reduce((acc, task) => acc + task.subTasks.length, 0)
                : module.categories.reduce((acc, cat) => acc + cat.items.length, 0);

              return (
                <>
                  <div className="h-[40px] px-4 bg-white border-b border-[#e2e8f0] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 shrink-0">
                        <module.icon className="h-4 w-4" style={{ color: module.color }} />
                        <h2 className="text-[14px] font-bold text-[#0f172a] whitespace-nowrap">{module.label}</h2>
                        {!isEnabled && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold tracking-tight">Disabled</span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-600 font-medium truncate whitespace-nowrap overflow-hidden">
                        {module.description}
                      </p>
                    </div>

                    {isEnabled && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (isCustom) {
                              const next = { ...selectedCustomSignals };
                              (customTasks[selectedClientId] || []).forEach(task => {
                                next[task.id] = [...task.subTasks];
                              });
                              setSelectedCustomSignals(next);
                              setExpandedCategories(new Set((customTasks[selectedClientId] || []).map(t => t.id)));
                            } else {
                              handleToggleModuleAll(module, false);
                              setExpandedCategories(new Set(module.categories.map(c => c.id)));
                            }
                          }}
                          className="text-[10px] font-bold px-2 py-1 border border-slate-200 rounded-[6px] hover:bg-slate-50 text-slate-700 transition-colors"
                        >
                          Select all
                        </button>
                        <button
                          onClick={() => {
                            if (isCustom) {
                              const next = { ...selectedCustomSignals };
                              (customTasks[selectedClientId] || []).forEach(task => {
                                next[task.id] = [];
                              });
                              setSelectedCustomSignals(next);
                            } else {
                              handleToggleModuleAll(module, true);
                            }
                          }}
                          className="text-[10px] font-bold px-2 py-1 border border-slate-200 rounded-[6px] hover:bg-slate-50 text-slate-700 transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={`flex-1 overflow-y-auto p-2 px-4 pt-1.5 ${!isEnabled ? "flex flex-col items-center justify-center" : ""}`}>
                    {!isEnabled ? (
                      <div className="h-full w-full max-w-2xl flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50 grayscale opacity-80 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
                          <RotateCcw className="h-8 w-8 text-slate-300" />
                        </div>
                        <h4 className="text-[16px] font-bold text-slate-800 mb-2 font-sans">Module Disabled for this Client</h4>
                        <p className="text-[12px] text-slate-600 max-w-[320px] leading-relaxed mb-6 font-sans font-medium">
                          Enable the toggle next to <strong className="text-slate-800">{module.label}</strong> in the left panel to activate signal tracking and start configuring categories.
                        </p>
                        <button 
                          onClick={() => setEnabledModules(prev => ({ ...prev, [module.id]: true }))}
                          className="bg-slate-600 hover:bg-slate-700 text-white text-[13px] font-bold py-2.5 px-8 rounded-[6px] transition-all active:scale-95 shadow-sm"
                        >
                          Enable {module.label}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pb-8">
                        {/* Statistics bar */}
                        <div className="flex items-center justify-between p-1 py-1 px-4 bg-white border border-[#e2e8f0] rounded-[6px] mb-1">
                          <p className="text-[10px] font-medium text-slate-700">
                            <strong className="text-indigo-600 font-bold">{totalSelected}</strong> of <strong className="text-slate-900 font-bold">{totalAvailable}</strong> signals selected
                          </p>
                          <div className="flex h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-500" 
                              style={{ width: `${(totalSelected / totalAvailable) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Category Accordions */}
                        {isCustom ? (
                          (customTasks[selectedClientId] || []).map((task) => {
                            const isExpanded = expandedCategories.has(task.id);
                            const taskSelection = selectedCustomSignals[task.id] || [];
                            const hasSomeSelected = taskSelection.length > 0;
                            const isAllSelected = taskSelection.length === task.subTasks.length;

                            if (confirmDeleteCustomTaskId === task.id) {
                              return (
                                <div 
                                  key={task.id} 
                                  className="bg-red-50/70 border border-red-200 rounded-[6px] p-5 text-center space-y-3 animate-in fade-in duration-200 my-1.5"
                                >
                                  <div className="p-2.5 bg-red-100 text-red-600 rounded-full w-10 h-10 flex items-center justify-center mx-auto">
                                    <Trash2 className="h-5 w-5 text-red-600 animate-bounce" />
                                  </div>
                                  <div className="space-y-1">
                                    <h5 className="text-[13px] font-bold text-slate-850">Delete Custom Task</h5>
                                    <p className="text-[11.5px] text-slate-600 max-w-md mx-auto leading-relaxed">
                                      Are you sure you want to delete <strong className="text-slate-800">"{task.name}"</strong>? This will remove the custom intelligence task and its tracked signals.
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-center gap-2.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteCustomTaskId(null);
                                      }}
                                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-705 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();

                                        const { error } = await supabase.schema('admin')
                                          .from('custom_tasks')
                                          .delete()
                                          .eq('id', task.id);

                                        if (error) {
                                          console.error("Failed to delete custom task:", error);
                                          return;
                                        }

                                        setCustomTasks(prev => {
                                          const updated = { ...prev };
                                          updated[selectedClientId] = (prev[selectedClientId] || []).filter(t => t.id !== task.id);
                                          return updated;
                                        });
                                        setSelectedCustomSignals(prev => {
                                          const updated = { ...prev };
                                          delete updated[task.id];
                                          return updated;
                                        });
                                        setConfirmDeleteCustomTaskId(null);
                                        showToast("Custom task deleted");
                                      }}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[6px] text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                                    >
                                      Confirm Delete
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div 
                                key={task.id} 
                                className={`bg-white border rounded-[6px] overflow-hidden transition-all duration-300 ${
                                  isExpanded ? "border-slate-300" : "border-[#e2e8f0] hover:border-slate-300"
                                } ${hasSomeSelected && !isExpanded ? 'border-l-2' : ''}`}
                                style={{ borderLeftColor: hasSomeSelected && !isExpanded ? '#7E22CE' : undefined }}
                              >
                                {/* Task Header */}
                                <div 
                                  className={`p-1 px-3 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? "bg-[#f8fafc]" : "bg-white hover:bg-[#fcfdfe]"}`}
                                  onClick={() => {
                                    const next = new Set(expandedCategories);
                                    if (isExpanded) next.delete(task.id);
                                    else next.add(task.id);
                                    setExpandedCategories(next);
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="p-1 px-1.5 rounded-[6px] flex items-center justify-center transition-transform"
                                      style={{ backgroundColor: '#F5F0FF', transform: isExpanded ? "scale(1.02)" : "scale(1)" }}
                                    >
                                      <FileText className="h-3.5 w-3.5" style={{ color: '#7E22CE' }} />
                                    </div>
                                    <div>
                                      <h4 className="text-[12px] font-bold text-slate-800">{task.name}</h4>
                                      <p className="text-[9px] text-slate-600 font-bold tracking-wider">{taskSelection.length} of {task.subTasks.length} active</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-all ${
                                        hasSomeSelected 
                                          ? "opacity-100" 
                                          : "opacity-40"
                                        }`}
                                        style={{ backgroundColor: hasSomeSelected ? '#F5F0FF' : "#f1f5f9", color: hasSomeSelected ? '#7E22CE' : "#64748b" }}
                                      >
                                        {taskSelection.length}/{task.subTasks.length}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const next = { ...selectedCustomSignals };
                                          next[task.id] = isAllSelected ? [] : task.subTasks.map((s: any) => s.id || s);
                                          setSelectedCustomSignals(next);
                                        }}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-[4px] transition-all cursor-pointer ${
                                          isAllSelected 
                                            ? "bg-slate-100 border-slate-200 text-slate-700" 
                                            : "bg-white border-purple-200 text-[#7E22CE] hover:bg-purple-50"
                                        }`}
                                      >
                                        {isAllSelected ? "Clear" : "Select All"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmDeleteCustomTaskId(task.id);
                                        }}
                                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer animate-in fade-in"
                                        title="Delete Custom Task Group"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 animate-in" />
                                      </button>
                                    </div>
                                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="p-3 border-t border-[#f1f5f9]">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {task.subTasks.map((item: any) => {
                                        const subId = item.id || item;
                                        const subName = item.name || item;
                                        const isSelected = taskSelection.includes(subId);
                                        return (
                                          <div 
                                            key={subId}
                                            onClick={() => {
                                              const next = { ...selectedCustomSignals };
                                              const arr = next[task.id] || [];
                                              if (isSelected) {
                                                next[task.id] = arr.filter(i => i !== subId);
                                              } else {
                                                next[task.id] = [...arr, subId];
                                              }
                                              setSelectedCustomSignals(next);
                                            }}
                                            className={`flex items-start gap-2.5 p-2 rounded-[5px] cursor-pointer border transition-all duration-150 ${
                                              isSelected 
                                                ? "border-purple-600 bg-purple-50/20" 
                                                : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
                                            }`}
                                          >
                                            <div 
                                              className={`mt-0.5 h-4 w-4 rounded-[3px] border flex items-center justify-center transition-all ${
                                                isSelected ? "bg-[#7E22CE] border-[#7E22CE]" : "bg-white border-slate-300"
                                              }`}
                                            >
                                              {isSelected && <Check className="h-3 w-3 text-white stroke-[3]" />}
                                            </div>
                                            <span className={`text-[11.5px] leading-relaxed transition-colors ${
                                              isSelected ? "text-purple-900 font-semibold" : "text-slate-700 font-medium"
                                            }`}>
                                              {subName}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          module.categories.map((category) => {
                            const isExpanded = expandedCategories.has(category.id);
                            const categorySelection = selectedSignals[category.id] || [];
                            const hasSomeSelected = categorySelection.length > 0;
                            const isAllSelected = categorySelection.length === category.items.length;

                            return (
                              <div 
                                key={category.id} 
                                className={`bg-white border rounded-[6px] overflow-hidden transition-all duration-300 ${
                                  isExpanded ? "border-slate-300" : "border-[#e2e8f0] hover:border-slate-300"
                                } ${hasSomeSelected && !isExpanded ? 'border-l' : ''}`}
                                style={{ borderLeftColor: hasSomeSelected && !isExpanded ? module.color : undefined }}
                              >
                                <div 
                                  className={`p-1 px-3 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? "bg-[#f8fafc]" : "bg-white hover:bg-[#fcfdfe]"}`}
                                  onClick={() => {
                                    const next = new Set(expandedCategories);
                                    if (isExpanded) next.delete(category.id);
                                    else next.add(category.id);
                                    setExpandedCategories(next);
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="p-1 px-1.5 rounded-[6px] flex items-center justify-center transition-transform"
                                      style={{ backgroundColor: module.bg, transform: isExpanded ? "scale(1.02)" : "scale(1)" }}
                                    >
                                      <category.icon className="h-3.5 w-3.5" style={{ color: module.color }} />
                                    </div>
                                    <div>
                                      <h4 className="text-[12px] font-bold text-slate-800">{category.name}</h4>
                                      <p className="text-[9px] text-slate-600 font-bold tracking-wider">{categorySelection.length} of {category.items.length} active</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-all ${
                                        hasSomeSelected 
                                          ? "opacity-100" 
                                          : "opacity-40"
                                        }`}
                                        style={{ backgroundColor: hasSomeSelected ? module.bg : "#f1f5f9", color: hasSomeSelected ? module.color : "#64748b" }}
                                      >
                                        {categorySelection.length}/{category.items.length}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleCategory(category, isAllSelected);
                                        }}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-[4px] transition-all ${
                                          isAllSelected 
                                            ? "bg-slate-100 border-slate-200 text-slate-700" 
                                            : "bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                        }`}
                                      >
                                        {isAllSelected ? "Clear" : "Select All"}
                                      </button>
                                    </div>
                                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="p-2 pt-1 border-t border-[#f1f5f9]">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                                      {category.items.map((item: any) => {
                                        const isSelected = categorySelection.includes(item.id);
                                        return (
                                          <div 
                                            key={item.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleSignal(category, item, isSelected);
                                            }}
                                            className={`flex items-start gap-2 p-0.5 px-1.5 rounded-[5px] cursor-pointer border transition-all duration-150 ${
                                              isSelected 
                                                ? "border-indigo-600 bg-indigo-50/30" 
                                                : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
                                            }`}
                                          >
                                            <div 
                                              className={`mt-0.5 h-3.5 w-3.5 rounded-[3px] border flex items-center justify-center transition-all ${
                                                isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                                              }`}
                                            >
                                              {isSelected && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                                            </div>
                                            <span className={`text-[11px] leading-relaxed transition-colors ${
                                              isSelected ? "text-indigo-900 font-bold" : "text-slate-700 font-medium"
                                            }`}>
                                              {item.signal_name || item.name}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40 grayscale">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <Settings className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-800 mb-2">Configure Intelligence Scope</h3>
            <p className="text-[12px] text-slate-500 max-w-sm">
              Select a module from the sidebar to refine what signals are monitored and harvested for this client's profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
