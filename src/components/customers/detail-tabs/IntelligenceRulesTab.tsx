import React, { useState, useEffect } from "react";
import { useIntelligenceModules } from "../../../data/intelligenceModules";
import { supabase } from "../../../lib/supabase";
import { Save, AlertCircle, Edit, Link } from "lucide-react";

export const IntelligenceRulesTab: React.FC = () => {
  const { modules, loading: modulesLoading } = useIntelligenceModules();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const sharedModule = {
    id: 'shared',
    label: 'Shared Rules',
    icon: Link,
    color: '#6366f1',
    bg: '#f5f3ff',
    description: 'Applies across all modules and clients',
    categories: []
  };

  const displayModules = [...modules, sharedModule];
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [titleText, setTitleText] = useState("");
  const [promptText, setPromptText] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  useEffect(() => {
    async function fetchPrompts() {
      if (!selectedModuleId) return;
      const selectedModule = displayModules.find(m => m.id === selectedModuleId);
      if (!selectedModule) return;
      
      setLoadingPrompts(true);
      try {
        let query = supabase
          .from("prompts")
          .select("id, title, description, prompt_template, is_active, updated_at")
          .order('id');

        if (selectedModuleId === 'shared') {
          query = query.is('module_id', null);
        } else {
          query = query.eq('module_id', selectedModuleId);
        }

        const { data, error } = await query;
        
        if (!error && data) {
          setPrompts(data);
        } else {
          setPrompts([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPrompts(false);
      }
      setSelectedPrompt(null);
      setIsEditMode(false);
    }
    
    fetchPrompts();
  }, [selectedModuleId, modules]);

  const handleSelectPrompt = (prompt: any) => {
    setSelectedPrompt(prompt);
    setTitleText(prompt.title || "");
    setPromptText(prompt.prompt_template || "");
    setDescriptionText(prompt.description || "");
    setSaveSuccess(false);
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!selectedPrompt) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("prompts")
        .update({ 
          title: titleText,
          prompt_template: promptText,
          description: descriptionText,
          updated_at: now
        })
        .eq("id", selectedPrompt.id);
        
      if (!error) {
        setSaveSuccess(true);
        const updatedPrompt = { 
          ...selectedPrompt, 
          title: titleText,
          prompt_template: promptText, 
          description: descriptionText,
          updated_at: now 
        };
        setSelectedPrompt(updatedPrompt);
        setPrompts(prompts.map(p => p.id === selectedPrompt.id ? updatedPrompt : p));
        setIsEditMode(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error("Error saving prompt:", error);
        alert(`Failed to save: ${error.message}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (modulesLoading) {
    return <div className="p-8 text-center text-slate-500">Loading modules...</div>;
  }

  const selectedModule = displayModules.find(m => m.id === selectedModuleId);

  return (
    <div className="flex h-full border-t border-slate-200">
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-[#e2e8f0] flex flex-col shrink-0 min-h-0 h-[calc(100vh-140px)]">
        <div className="h-[40px] px-4 border-b border-[#e2e8f0] flex items-center">
          <h3 className="text-[11px] font-bold text-slate-900 tracking-wider uppercase">Intelligence Modules</h3>
        </div>
        
        <div className="flex-1 min-h-0 p-1.5 space-y-1 overflow-y-auto">
          {displayModules.map((module) => {
            const isActive = selectedModuleId === module.id;
            return (
              <div 
                key={module.id} 
                onClick={() => setSelectedModuleId(module.id)}
                className={`group flex items-center justify-between p-1.5 px-2.5 border rounded-[6px] cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? "border-indigo-600 bg-white" 
                    : "border-transparent bg-white/50 hover:bg-white hover:border-[#e2e8f0]"
                }`}
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
                      {module.id === 'shared' ? 'Applies across all modules and clients' : 'Global Rules'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-slate-50/50 overflow-y-auto h-[calc(100vh-140px)] relative">
        <div className="p-6 max-w-6xl mx-auto">
          {selectedModule ? (
            <div className="space-y-6">
              {loadingPrompts ? (
                <div className="text-center py-8 text-slate-500 text-sm">Loading rules...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* List of Prompts */}
                  <div className="lg:col-span-1 space-y-2">
                    {selectedModuleId === 'shared' && (
                      <div className="mb-4 p-2.5 bg-amber-50/50 border border-amber-200/50 rounded-[6px] text-[10.5px] text-amber-800 font-medium leading-normal">
                        These rules are shared across every module and every client — editing one changes it everywhere.
                      </div>
                    )}
                    <h3 className="text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-3">Configured Rules</h3>
                    {prompts.map((prompt) => (
                      <div 
                        key={prompt.id} 
                        onClick={() => handleSelectPrompt(prompt)}
                        className={`p-3 rounded-[6px] border cursor-pointer transition-all ${
                          selectedPrompt?.id === prompt.id 
                            ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600/10' 
                            : 'bg-white border-[#e2e8f0] hover:border-indigo-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="font-sans text-[13px] font-bold text-slate-800 truncate pr-2">{prompt.title || prompt.id}</div>
                          <div className="text-[9px] text-slate-400 font-medium font-sans whitespace-nowrap">
                            {prompt.updated_at ? new Date(prompt.updated_at).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans line-clamp-2 leading-relaxed">{prompt.description}</div>
                      </div>
                    ))}
                  </div>

                  {/* Editor */}
                  <div className="lg:col-span-2">
                    {selectedPrompt ? (
                      <div className="bg-white rounded-[6px] border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
                          <div className="flex flex-col flex-1 mr-4">
                            <div className="flex items-center gap-2">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={titleText}
                                  onChange={(e) => setTitleText(e.target.value)}
                                  className="text-[14px] font-bold text-slate-800 font-sans px-2 py-1 border border-slate-200 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                  placeholder="Enter title..."
                                />
                              ) : (
                                <h4 className="text-[14px] font-bold text-slate-800 font-sans">{selectedPrompt.title || selectedPrompt.id}</h4>
                              )}
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-emerald-200/50 bg-emerald-50 text-emerald-700 font-bold text-[9.5px] leading-tight select-none">
                                Active
                              </span>
                            </div>
                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight mt-1">
                              {selectedModule?.label}
                            </p>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={descriptionText}
                                onChange={(e) => setDescriptionText(e.target.value)}
                                className="w-full text-[11.5px] text-slate-700 mt-1.5 px-2 py-1 border border-slate-200 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-sans"
                                placeholder="Enter description..."
                                spellCheck={false}
                              />
                            ) : (
                              <p className="text-[11.5px] text-slate-500 mt-0.5 font-sans leading-relaxed">{selectedPrompt.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium font-sans mr-2">
                              <span>Last edited:</span>
                              <span className="text-slate-800 font-semibold">
                                {selectedPrompt.updated_at ? new Date(selectedPrompt.updated_at).toLocaleString() : 'Never'}
                              </span>
                            </div>

                            <button
                              onClick={() => setIsEditMode(true)}
                              className={`p-1 transition-colors cursor-pointer rounded ${
                                isEditMode 
                                  ? "text-indigo-600 bg-indigo-50/80" 
                                  : "text-slate-400 hover:text-indigo-600"
                              }`}
                              title="Edit Prompt"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            
                            {isEditMode && (
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[4px] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                                title="Save Prompt"
                              >
                                <Save className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {saveSuccess && (
                          <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-2 text-[10px] font-bold text-emerald-700 flex items-center justify-center">
                            Prompt updated successfully.
                          </div>
                        )}

                        <div className="flex-1 p-3.5 pt-0 relative">
                          <textarea
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            readOnly={!isEditMode}
                            className={`w-full h-full text-[11.5px] text-slate-700 font-mono leading-relaxed p-3 rounded-[6px] focus:outline-none resize-none transition-all ${
                              isEditMode 
                                ? "bg-white border border-[#4f46e5] focus:ring-1 focus:ring-indigo-600" 
                                : "bg-slate-50/50 border border-slate-100 cursor-not-allowed"
                            }`}
                            spellCheck={false}
                            placeholder={isEditMode ? "Enter prompt template..." : "Click Edit to modify this rule"}
                          />
                        </div>
                        <div className="px-4 py-2 border-t border-slate-50 bg-white flex justify-end">
                          <span className="text-[10px] text-slate-400 font-mono font-medium whitespace-nowrap">
                            {promptText.length} chars
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[600px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="text-center text-slate-500">
                          <p className="text-[13px] font-medium">Select a rule to edit</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                {selectedModule ? (
                  <selectedModule.icon className="w-8 h-8 text-slate-400" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">{selectedModule?.label}</h3>
                <p className="text-sm text-slate-500 max-w-sm">No intelligence rules configured for this module yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
