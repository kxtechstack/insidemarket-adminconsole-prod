import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Globe, Link as LinkIcon, FileText, Search, RotateCcw, Upload, Play, Loader2, AlertCircle, Check, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const PIPELINE_BASE_URL = import.meta.env.VITE_API_URL;

const isValidUrl = (urlStr: string): boolean => {
  if (!urlStr || !urlStr.trim()) return false;
  const trimmed = urlStr.trim();
  if (/\s/.test(trimmed)) return false;

  try {
    const urlToTest = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(urlToTest);
    return Boolean(
      parsed.hostname &&
      parsed.hostname.includes('.') &&
      parsed.hostname.split('.').pop()!.length >= 2
    );
  } catch (e) {
    return false;
  }
};

const formatUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

interface CustomDataSource {
  id: string;
  client_id: string;
  source_name: string;
  source_type: 'website' | 'pdf' | 'text';
  url_or_path: string | null;
  storage_path: string | null;
  text_content: string | null;
  created_at: string;
  last_run_status: 'success' | 'failed' | null;
  last_run_at: string | null;
  last_article_id: string | null;
}

interface CustomDataSourcesTabProps {
  selectedClientId: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const CustomDataSourcesTab: React.FC<CustomDataSourcesTabProps> = ({
  selectedClientId,
  showToast
}) => {
  const [sources, setSources] = useState<CustomDataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracks which source IDs currently have a run in progress
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());

  // Logs modal state
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);

  // Form state
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<'website' | 'pdf' | 'text'>("website");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Expanded state for previously run sources
  const [isRunSourcesExpanded, setIsRunSourcesExpanded] = useState(false);

  useEffect(() => {
    fetchSources();
  }, [selectedClientId]);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .schema('admin')
        .from('custom_data_sources')
        .select('*')
        .eq('client_id', selectedClientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const activeSources = (data || []).filter(s => !s.source_name.startsWith('__DELETED__') && s.source_name !== '[DELETED]');
      setSources(activeSources);
    } catch (err) {
      console.error("Error fetching sources:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setIsLogsLoading(true);
    setIsLogsModalOpen(true);
    setLogsPage(1);
    try {
      const { data, error } = await supabase
        .from('custom_source_run_log')
        .select('*')
        .eq('client_id', selectedClientId)
        .order('run_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const handleAdd = async () => {
    const errors: Record<string, string> = {};

    if (!newName.trim()) {
      errors.name = "Source name is required";
    }

    if (newType === 'website') {
      if (!newUrl.trim()) {
        errors.url = "Website URL is required";
      } else if (!isValidUrl(newUrl)) {
        errors.url = "Please enter a valid website URL (e.g. https://example.com)";
      }
    } else if (newType === 'text') {
      if (!textContent.trim()) {
        errors.text = "Text content is required";
      }
    } else if (newType === 'pdf') {
      if (!selectedFile && !newUrl.trim()) {
        errors.pdf = "Please upload a PDF file or provide a hosted PDF URL";
      } else if (!selectedFile && newUrl.trim() && !isValidUrl(newUrl)) {
        errors.pdfUrl = "Please enter a valid PDF URL (e.g. https://example.com/document.pdf)";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      let storagePath = null;
      let finalUrl = newUrl.trim() ? formatUrl(newUrl) : null;

      // Handle PDF upload
      if (newType === 'pdf' && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${selectedClientId}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('custom-source-files')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;
        storagePath = uploadData.path;
        finalUrl = null; // Use storage path instead
      }

      const { error } = await supabase
        .schema('admin')
        .from('custom_data_sources')
        .insert([{
          client_id: selectedClientId,
          source_name: newName.trim(),
          source_type: newType,
          url_or_path: newType === 'text' ? null : finalUrl,
          storage_path: storagePath,
          text_content: newType === 'text' ? textContent : null
        }]);

      if (error) throw error;

      // Reset form
      setNewName("");
      setNewUrl("");
      setNewType("website");
      setTextContent("");
      setSelectedFile(null);
      setFormErrors({});
      setShowAddForm(false);

      // Refresh list
      fetchSources();
      showToast("Data source added successfully");
    } catch (err: any) {
      console.error("Error adding source:", err);
      showToast(err.message || "Failed to add data source", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Find source to check for storage path
      const sourceToDelete = sources.find(s => s.id === id);

      const { error } = await supabase
        .schema('admin')
        .from('custom_data_sources')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          // Foreign key constraint violation (e.g. from custom_source_content)
          // Fallback to soft-delete
          const { error: softDeleteError } = await supabase
            .schema('admin')
            .from('custom_data_sources')
            .update({ source_name: `__DELETED__${sourceToDelete?.source_name || id}` })
            .eq('id', id);
          if (softDeleteError) throw softDeleteError;
        } else {
          throw error;
        }
      }

      // Delete from storage if applicable
      if (sourceToDelete?.storage_path) {
        await supabase.storage
          .from('custom-source-files')
          .remove([sourceToDelete.storage_path]);
      }

      setConfirmDeleteId(null);
      fetchSources();
      showToast(sourceToDelete?.source_name ? `Data source "${sourceToDelete.source_name}" deleted` : "Data source deleted");
    } catch (err: any) {
      console.error("Error deleting source:", err);
      showToast(err.message || "Failed to delete source", 'error');
    }
  };

  const handleRunNow = async (id: string) => {
    const targetSource = sources.find(s => s.id === id);
    const sourceName = targetSource?.source_name || 'Data source';

    // Mark this source as running (shows spinner on its button)
    setRunningIds(prev => new Set(prev).add(id));

    try {
      const response = await fetch(`${PIPELINE_BASE_URL}/custom-source/run/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      // The route responds immediately with {status: 'started'} -- actual
      // processing happens in the background on the server. We poll the
      // source row every few seconds until last_run_at changes, so the
      // button can flip to a green tick (or error icon) once it's done.
      pollForCompletion(id);
      showToast(`Started pipeline run for "${sourceName}". Processing in background...`);
    } catch (err: any) {
      console.error("Error triggering run:", err);
      setRunningIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast(err.message || "Failed to start the run", 'error');
    }
  };

  // Poll Supabase every 3s (up to ~2 minutes) until last_run_at changes,
  // indicating the background job on the server has finished.
  const pollForCompletion = async (id: string, attempt = 0) => {
    const MAX_ATTEMPTS = 40; // ~2 minutes at 3s intervals
    const source = sources.find(s => s.id === id);
    const previousRunAt = source?.last_run_at ?? null;

    if (attempt >= MAX_ATTEMPTS) {
      setRunningIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .schema('admin')
          .from('custom_data_sources')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        const finished = data.last_run_at && data.last_run_at !== previousRunAt;

        if (finished) {
          setSources(prev => prev.map(s => (s.id === id ? data : s)));
          setRunningIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });

          // Automatically expand Previously Run Sources so user sees the completed item
          setIsRunSourcesExpanded(true);

          const sourceName = data.source_name || source?.source_name || 'Data source';
          if (data.last_run_status === 'success') {
            showToast(`Processing completed for "${sourceName}". Moved to Previously Run Sources.`, 'success');
          } else if (data.last_run_status === 'failed') {
            showToast(`Processing finished with errors for "${sourceName}". Moved to Previously Run Sources.`, 'error');
          } else {
            showToast(`Execution finished for "${sourceName}". Moved to Previously Run Sources.`, 'success');
          }
        } else {
          pollForCompletion(id, attempt + 1);
        }
      } catch (err) {
        console.error("Error polling run status:", err);
        pollForCompletion(id, attempt + 1);
      }
    }, 3000);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'website': return <Globe className="h-3.5 w-3.5" />;
      case 'pdf': return <FileText className="h-3.5 w-3.5" />;
      case 'text': return <FileText className="h-3.5 w-3.5" />;
      default: return <LinkIcon className="h-3.5 w-3.5" />;
    }
  };

  const pendingSources = sources.filter(s => s.last_run_status === null);
  const runSources = sources.filter(s => s.last_run_status !== null);

  const renderSourceRow = (source: CustomDataSource) => {
    const isRunning = runningIds.has(source.id);
    const hasSucceeded = source.last_run_status === 'success';
    const hasFailed = source.last_run_status === 'failed';
    const isPending = source.last_run_status === null;

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    return (
      <tr key={source.id} className="hover:bg-slate-50 transition-colors group">
        <td className="py-3 px-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-[4px] text-slate-500 flex-shrink-0">
              {getSourceIcon(source.source_type)}
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-800">{source.source_name}</span>
              {isPending && source.created_at ? (
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">Added {formatDate(source.created_at)}</span>
              ) : !isPending && source.last_run_at ? (
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">Last run {formatDate(source.last_run_at)}</span>
              ) : null}
            </div>
          </div>
        </td>
        <td className="py-3 px-5">
          <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold uppercase tracking-tight">
            {source.source_type === 'pdf' ? 'PDF Document' : source.source_type === 'text' ? 'Plain Text' : 'Website'}
          </span>
        </td>
        <td className="py-3 px-5">
          {source.source_type === 'text' ? (
            <span className="text-[11px] text-slate-500 italic">Text content provided</span>
          ) : (
            <a
              href={source.url_or_path || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-indigo-600 hover:underline font-mono truncate max-w-[200px] block"
            >
              {source.url_or_path || (source.storage_path ? 'Uploaded PDF' : 'N/A')}
            </a>
          )}
        </td>
        <td className="py-3 px-5 text-right">
          <div className="flex items-center justify-end gap-2">
            {isRunning ? (
              <div
                className="min-h-[32px] flex items-center justify-center gap-1.5 px-3 border border-slate-300 text-[11px] font-sans font-bold text-slate-500"
                style={{ borderRadius: "6px" }}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Running...
              </div>
            ) : hasSucceeded ? (
              <button
                onClick={() => handleRunNow(source.id)}
                title={`Last run succeeded${source.last_run_at ? ' at ' + new Date(source.last_run_at).toLocaleString() : ''}. Click to re-run.`}
                className="min-h-[32px] flex items-center justify-center gap-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-sans font-bold text-emerald-700 shadow-xs cursor-pointer active:scale-95 transition-all"
                style={{ borderRadius: "6px" }}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            ) : hasFailed ? (
              <button
                onClick={() => handleRunNow(source.id)}
                title="Last run failed. Click to retry."
                className="min-h-[32px] flex items-center justify-center gap-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-300 text-[11px] font-sans font-bold text-red-700 shadow-xs cursor-pointer active:scale-95 transition-all"
                style={{ borderRadius: "6px" }}
              >
                <AlertCircle className="h-3 w-3" />
                Retry
              </button>
            ) : (
              <button
                onClick={() => handleRunNow(source.id)}
                className="min-h-[32px] flex items-center justify-center gap-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-[11px] font-sans font-bold text-slate-700 shadow-xs cursor-pointer active:scale-95 transition-all"
                style={{ borderRadius: "6px" }}
              >
                <Play className="h-3 w-3 text-slate-600" />
                Run now
              </button>
            )}

            {confirmDeleteId === source.id ? (
              <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                <button
                  onClick={() => handleDelete(source.id)}
                  className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700 cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(source.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                title="Delete Source"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Custom Data Sources</h3>
            <p className="text-[12px] text-slate-500 mt-1">Manage specific URLs and repositories to be used as custom intelligence targets for this client.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-[6px] text-[12px] font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              View Logs
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-[6px] text-[12px] font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Data Source
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-slate-50 border border-[#e2e8f0] rounded-[6px] p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  Source Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Corporate Blog"
                  className={`w-full px-3 py-2 bg-white border rounded-[6px] text-[12px] font-medium text-slate-700 outline-none transition-colors ${
                    formErrors.name
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20"
                      : "border-[#e2e8f0] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 inline shrink-0" />
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  Source Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newType}
                  onChange={(e) => {
                    setNewType(e.target.value as any);
                    setSelectedFile(null);
                    setNewUrl("");
                    setTextContent("");
                    setFormErrors({});
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[6px] text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="website">Website</option>
                  <option value="pdf">PDF Document</option>
                  <option value="text">Plain Text</option>
                </select>
              </div>

              {newType === 'website' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    URL / Path <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => {
                      setNewUrl(e.target.value);
                      if (formErrors.url) setFormErrors(prev => ({ ...prev, url: undefined }));
                    }}
                    placeholder="https://example.com/data"
                    className={`w-full px-3 py-2 bg-white border rounded-[6px] text-[12px] font-medium text-slate-700 outline-none transition-colors ${
                      formErrors.url
                        ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20"
                        : "border-[#e2e8f0] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    }`}
                  />
                  {formErrors.url && (
                    <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 inline shrink-0" />
                      {formErrors.url}
                    </p>
                  )}
                </div>
              )}

              {newType === 'pdf' && (
                <div className="md:col-span-1 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    Upload PDF <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed rounded-[6px] text-[11px] font-bold transition-all cursor-pointer ${
                        formErrors.pdf
                          ? "border-red-400 text-red-600 hover:border-red-500 bg-red-50/20"
                          : "border-[#e2e8f0] hover:border-indigo-400 text-slate-600 hover:text-indigo-600"
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {selectedFile ? selectedFile.name : "Upload a file"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        if (file && !newName.trim()) {
                          const defaultName = file.name.replace(/\.[^/.]+$/, "");
                          setNewName(defaultName);
                        }
                        setFormErrors(prev => ({ ...prev, pdf: undefined, name: undefined }));
                      }}
                    />
                  </div>
                  {formErrors.pdf && (
                    <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 inline shrink-0" />
                      {formErrors.pdf}
                    </p>
                  )}
                </div>
              )}
            </div>

            {newType === 'pdf' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-slate-200"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                  <div className="h-[1px] flex-1 bg-slate-200"></div>
                </div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Paste a link to a hosted PDF</label>
                <input
                  type="text"
                  value={newUrl}
                  disabled={!!selectedFile}
                  onChange={(e) => {
                    setNewUrl(e.target.value);
                    if (formErrors.pdf || formErrors.pdfUrl) {
                      setFormErrors(prev => ({ ...prev, pdf: undefined, pdfUrl: undefined }));
                    }
                  }}
                  placeholder="https://example.com/document.pdf"
                  className={`w-full px-3 py-2 bg-white border rounded-[6px] text-[12px] font-medium text-slate-700 outline-none transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed ${
                    formErrors.pdfUrl
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20"
                      : "border-[#e2e8f0] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  }`}
                />
                {formErrors.pdfUrl && (
                  <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 inline shrink-0" />
                    {formErrors.pdfUrl}
                  </p>
                )}
              </div>
            )}

            {newType === 'text' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  Paste Text Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => {
                    setTextContent(e.target.value);
                    if (formErrors.text) setFormErrors(prev => ({ ...prev, text: undefined }));
                  }}
                  placeholder="Paste relevant text content here..."
                  className={`w-full h-32 px-3 py-2 bg-white border rounded-[6px] text-[12px] font-medium text-slate-700 outline-none resize-none transition-colors ${
                    formErrors.text
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20"
                      : "border-[#e2e8f0] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  }`}
                />
                {formErrors.text && (
                  <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 inline shrink-0" />
                    {formErrors.text}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedFile(null);
                  setFormErrors({});
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-[11px] font-bold text-slate-600 hover:text-slate-800 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[6px] text-[11px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                {isSubmitting ? "Saving..." : "Save Source"}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#e2e8f0] rounded-[6px] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-slate-50/50 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-5 font-medium">Source</th>
                <th className="py-3 px-5 font-medium">Type</th>
                <th className="py-3 px-5 font-medium">Details</th>
                <th className="py-3 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
                      <p className="text-[12px] font-medium">Loading data sources...</p>
                    </div>
                  </td>
                </tr>
              ) : pendingSources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-6 w-6 text-slate-300" />
                      <p className="text-[12px] font-medium">No pending data sources to run.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingSources.map(renderSourceRow)
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && runSources.length > 0 && (
          <div className="mt-8 space-y-4">
            <button
              onClick={() => setIsRunSourcesExpanded(!isRunSourcesExpanded)}
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold text-[14px] transition-colors cursor-pointer w-fit"
            >
              {isRunSourcesExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Previously Run Sources ({runSources.length})
            </button>

            {isRunSourcesExpanded && (
              <div className="bg-white border border-[#e2e8f0] rounded-[6px] overflow-hidden animate-in slide-in-from-top-2 duration-300">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-slate-50/50 text-[11px] font-semibold text-slate-500">
                      <th className="py-3 px-5 font-medium">Source</th>
                      <th className="py-3 px-5 font-medium">Type</th>
                      <th className="py-3 px-5 font-medium">Details</th>
                      <th className="py-3 px-5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {runSources.map(renderSourceRow)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {isLogsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[85vh] flex flex-col mx-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-slate-800">Custom Source Run Logs</h3>
              <button onClick={() => setIsLogsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="border border-slate-200 rounded-[6px] overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 font-bold text-slate-600">Source Name</th>
                      <th className="px-3 py-2 font-bold text-slate-600 w-24">Status</th>
                      <th className="px-3 py-2 font-bold text-slate-600">Message</th>
                      <th className="px-3 py-2 font-bold text-slate-600 w-32">Run At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLogsLoading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
                            <p className="text-[12px] font-medium">Loading logs...</p>
                          </div>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-[12px] text-slate-500">
                          No run logs found.
                        </td>
                      </tr>
                    ) : (
                      logs.slice((logsPage - 1) * 20, logsPage * 20).map((log, idx) => {
                        const title = log.source_name || 'Untitled';
                        const message = log.error_message || '-';
                        const processedAt = log.run_at;
                        let formattedDate = '-';
                        if (processedAt) {
                          try {
                            formattedDate = new Date(processedAt).toLocaleString();
                          } catch (e) {
                            formattedDate = String(processedAt);
                          }
                        }
                        return (
                          <tr key={log.id || idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-medium text-slate-800 max-w-[300px] truncate" title={title}>
                              {title}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wider ${
                                log.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                log.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-200' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-500 max-w-[200px] truncate" title={message}>
                              {(log.status === 'failed') ? message : '-'}
                            </td>
                            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                              {formattedDate}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {logs.length > 20 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-lg">
                <span className="text-[11px] text-slate-500">
                  Showing {(logsPage - 1) * 20 + 1} to {Math.min(logsPage * 20, logs.length)} of {logs.length} logs
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                    disabled={logsPage === 1}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded-[4px] disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setLogsPage(p => Math.min(Math.ceil(logs.length / 20), p + 1))}
                    disabled={logsPage >= Math.ceil(logs.length / 20)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded-[4px] disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};