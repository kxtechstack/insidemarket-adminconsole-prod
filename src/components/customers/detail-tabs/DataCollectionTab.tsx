import React from "react";
import { 
  FileText, 
  RotateCcw, 
  Trash2,
  Play,
  Pause,
  Plug,
  Edit,
  Save,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Plus,
  Loader2,
  List,
  Eye,
  EyeOff,
  Calendar,
  BarChart3,
  AlertCircle,
  SkipForward,
  MinusCircle
} from "lucide-react";
import { useIntelligenceModules } from "../../../data/intelligenceModules";
import { COLLECTION_PROMPTS } from "../../../data/prompts";

interface DataCollectionTabProps {
  selectedClientId: string;
  activeModuleId: string;
  setActiveModuleId: (id: string) => void;
  enabledModules: Record<string, boolean>;
  setEnabledModules?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  customTasks: Record<string, any[]>;
  selectedCustomSignals: Record<string, string[]>;
  selectedSignals: Record<string, string[]>;
  editCompany: string;
  editSector: string;
  customPrompts: Record<string, Record<string, any>>;
  setCustomPrompts: React.Dispatch<React.SetStateAction<Record<string, Record<string, any>>>>;
  editingModuleIdState: string | null;
  setEditingModuleIdState: (id: string | null) => void;
  editPromptValue: string;
  setEditPromptValue: (v: string) => void;
  pausedModules: Record<string, Record<string, boolean>>;
  setPausedModules: React.Dispatch<React.SetStateAction<Record<string, Record<string, boolean>>>>;
  runningModuleId: string | null;
  setRunningModuleId: (id: string | null) => void;
  moduleLastRan: Record<string, Record<string, string>>;
  setModuleLastRan: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  showHistoryModuleId: string | null;
  setShowHistoryModuleId: (id: string | null) => void;
  tempSchedule: any;
  setTempSchedule: (v: any) => void;
  moduleSchedules: Record<string, Record<string, any>>;
  setModuleSchedules: React.Dispatch<React.SetStateAction<Record<string, Record<string, any>>>>;
  confirmDeleteModuleId: string | null;
  setConfirmDeleteModuleId: (id: string | null) => void;
  setActiveDetailTab: (tab: any) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

import { supabase } from "../../../lib/supabase";

const STAGE_LABELS: Record<string, string> = {
  'fetching': 'Fetching Articles',
  'after_url_check': 'Checking Duplicates',
  'after_topic_dedup': 'Removing Similar Topics',
  'after_quality_filter': 'Quality Check',
  'pushed_to_processed': 'Classifying with AI',
  'completed': 'Completed',
  'failed': 'Failed'
};

// Converts a YYYY-MM-DD date (treated as an IST calendar day) into the
// correct UTC start/end timestamps for that day. Needed because schedules
// run in IST but Supabase timestamps are UTC — a 2 AM IST job actually
// happened at 6:30 PM UTC the day before.
const getISTDayBoundsUTC = (dateStr: string) => {
  const startIso = new Date(`${dateStr}T00:00:00.000+05:30`).toISOString();
  const endIso = new Date(`${dateStr}T23:59:59.999+05:30`).toISOString();
  return { startIso, endIso };
};

// Gives today's date as YYYY-MM-DD in IST (not UTC), so the report
// doesn't default to yesterday's date in the early morning hours.
const getTodayIST = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export const DataCollectionTab: React.FC<DataCollectionTabProps> = ({
  selectedClientId,
  activeModuleId,
  setActiveModuleId,
  enabledModules,
  setEnabledModules,
  customTasks,
  selectedCustomSignals,
  selectedSignals,
  editCompany,
  editSector,
  customPrompts,
  setCustomPrompts,
  editingModuleIdState,
  setEditingModuleIdState,
  editPromptValue,
  setEditPromptValue,
  pausedModules,
  setPausedModules,
  runningModuleId,
  setRunningModuleId,
  moduleLastRan,
  setModuleLastRan,
  showHistoryModuleId,
  setShowHistoryModuleId,
  tempSchedule,
  setTempSchedule,
  moduleSchedules,
  setModuleSchedules,
  confirmDeleteModuleId,
  setConfirmDeleteModuleId,
  setActiveDetailTab,
  showToast
}) => {
  const { modules: INTELLIGENCE_MODULES } = useIntelligenceModules();
  const [dbPrompts, setDbPrompts] = React.useState<any[]>([]);
  const [dataSources, setDataSources] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  
  // New state for manual prompt management
  const [showAddPromptForm, setShowAddPromptForm] = React.useState(false);
  const [allModulesList, setAllModulesList] = React.useState<any[]>([]);
  const [allSubmodulesList, setAllSubmodulesList] = React.useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = React.useState("");
  const [selectedSubmoduleId, setSelectedSubmoduleId] = React.useState("");
  const [newPromptText, setNewPromptText] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Data Source Form State
  const [showAddDataSourceForm, setShowAddDataSourceForm] = React.useState(false);
  const [newDataSourceDisplayName, setNewDataSourceDisplayName] = React.useState("");
  const [newDataSourceDescription, setNewDataSourceDescription] = React.useState("");
  const [newDataSourceBadgeColor, setNewDataSourceBadgeColor] = React.useState("indigo");
  const [newDataSourceId, setNewDataSourceId] = React.useState("");
  const [isSavingDataSource, setIsSavingDataSource] = React.useState(false);
  const [isDeletingDataSourceId, setIsDeletingDataSourceId] = React.useState<string | null>(null);
  const [showDataSourceList, setShowDataSourceList] = React.useState(false);

  // Edit Data Source State
  const [editingDataSourceId, setEditingDataSourceId] = React.useState<string | null>(null);
  const [editDataSourceIdValue, setEditDataSourceIdValue] = React.useState("");
  const [editDataSourceDisplayName, setEditDataSourceDisplayName] = React.useState("");
  const [editDataSourceDescription, setEditDataSourceDescription] = React.useState("");
  const [editDataSourceBadgeColor, setEditDataSourceBadgeColor] = React.useState("");

  React.useEffect(() => {
    if (newDataSourceDisplayName && !newDataSourceId) {
      setNewDataSourceId(newDataSourceDisplayName.replace(/\s+/g, ''));
    }
  }, [newDataSourceDisplayName]);

  const handleToggleDataSourceField = async (id: string, field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .schema('admin')
        .from('data_sources')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
      fetchDataSources();
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const handleDeleteDataSource = async (id: string) => {
    if (!id) return;
    
    setIsDeletingDataSourceId(id);
    try {
      console.log(`[Delete] Attempting to delete source: ${id}`);
      const { error, data } = await supabase
        .schema('admin')
        .from('data_sources')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error("[Delete] Supabase error:", error);
        throw error;
      }
      
      console.log(`[Delete] Success. Deleted data:`, data);
      
      // Update local state immediately
      setDataSources(prev => prev.filter(src => src.id !== id));
      setConfirmDeleteId(null);
      
      // Re-fetch to be absolutely sure
      await fetchDataSources();
      showToast("Data source deleted");
    } catch (err: any) {
      console.error("[Delete] Catch error:", err);
      showToast(err.message || "Failed to delete source", 'error');
    } finally {
      setIsDeletingDataSourceId(null);
    }
  };

  const handleUpdateDataSource = async () => {
    if (!editingDataSourceId || !editDataSourceDisplayName || !editDataSourceIdValue) return;
    setIsSavingDataSource(true);
    try {
      const { error } = await supabase
        .schema('admin')
        .from('data_sources')
        .update({
          id: editDataSourceIdValue,
          display_name: editDataSourceDisplayName,
          description: editDataSourceDescription,
          badge_color: editDataSourceBadgeColor
        })
        .eq('id', editingDataSourceId);

      if (error) throw error;
      
      setEditingDataSourceId(null);
      setEditDataSourceIdValue("");
      fetchDataSources();
      showToast("Data source updated");
    } catch (err: any) {
      console.error("Error updating data source:", err);
      showToast(err.message || "Failed to update source", 'error');
    } finally {
      setIsSavingDataSource(false);
    }
  };

  const handleSaveDataSource = async () => {
    if (!newDataSourceDisplayName || !newDataSourceId) return;
    setIsSavingDataSource(true);
    try {
      const { error } = await supabase
        .schema('admin')
        .from('data_sources')
        .insert([{
          id: newDataSourceId,
          display_name: newDataSourceDisplayName,
          description: newDataSourceDescription,
          badge_color: newDataSourceBadgeColor,
          is_active: true
        }]);

      if (error) throw error;
      
      setShowAddDataSourceForm(false);
      setNewDataSourceDisplayName("");
      setNewDataSourceDescription("");
      setNewDataSourceBadgeColor("indigo");
      setNewDataSourceId("");
      fetchDataSources();
      showToast("Data source added successfully");
    } catch (err: any) {
      console.error("Error saving data source:", err);
      showToast(err.message || "Failed to save data source", 'error');
    } finally {
      setIsSavingDataSource(false);
    }
  };

  const fetchDataSources = async () => {
    try {
      const { data, error } = await supabase
        .schema('admin')
        .from('data_sources')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      setDataSources(data || []);
    } catch (err) {
      console.error("Error fetching data sources:", err);
    }
  };

  const fetchModulesAndSubmodules = async () => {
    try {
      const [
        { data: mData },
        { data: sData }
      ] = await Promise.all([
        supabase.schema('admin').from('modules').select('*').order('module_name'),
        supabase.schema('admin').from('submodules').select('*').order('submodule_name')
      ]);
      if (mData) setAllModulesList(mData);
      if (sData) setAllSubmodulesList(sData);
    } catch (err) {
      console.error("Error fetching modules/submodules:", err);
    }
  };

  const fetchPrompts = async () => {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.schema('admin')
        .from('prompts')
        .select(`
          *,
          modules ( module_name ),
          submodules ( submodule_name ),
          custom_tasks ( name )
        `)
        .eq('client_id', selectedClientId);
      
      if (error) throw error;
      const promptsData = data || [];
      setDbPrompts(promptsData);
      fetchSubmoduleSchedules(promptsData);
    } catch (err) {
      console.error("Error fetching prompts:", err);
    } finally {
      loadingStatusFetched.current = true;
      setLoading(false);
    }
  };

  const [savingSchedulePromptId, setSavingSchedulePromptId] = React.useState<string | null>(null);

  const fetchSingleSchedule = async (submoduleId: string, promptId: string) => {
    if (!selectedClientId || !submoduleId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/schedules/${selectedClientId}/${submoduleId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json?.schedule) {
        const { source, frequency, schedule_time, is_active } = json.schedule;
        const formattedTime = schedule_time
          ? (schedule_time.length >= 5 ? schedule_time.slice(0, 5) : schedule_time)
          : '02:00';
        const schedObj = {
          tool: source || 'Exa',
          frequency: frequency || 'Daily',
          time: formattedTime,
          isActive: is_active ?? true
        };
        setModuleSchedules(prev => ({
          ...prev,
          [selectedClientId]: {
            ...(prev[selectedClientId] || {}),
            [promptId]: schedObj,
            [submoduleId]: schedObj
          }
        }));
        setTempSchedule(prev => prev ? {
          ...prev,
          tool: source || prev.tool,
          frequency: frequency || prev.frequency,
          time: formattedTime
        } : {
          tool: source || 'Perplexity',
          frequency: frequency || 'Daily',
          time: formattedTime
        });
      }
    } catch (e) {
      console.warn(`Error fetching schedule for ${submoduleId}:`, e);
    }
  };

  const fetchSubmoduleSchedules = async (promptsList: any[]) => {
    if (!selectedClientId || !promptsList.length) return;

    const uniqueItems = Array.from(
      new Map(
        promptsList
          .filter(p => !!(p.submodule_id || p.custom_task_id))
          .map(p => [p.submodule_id || p.custom_task_id, { promptId: p.id, submoduleId: p.submodule_id || p.custom_task_id }])
      ).values()
    );

    try {
      const results = await Promise.allSettled(
        uniqueItems.map(async ({ promptId, submoduleId }) => {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/schedules/${selectedClientId}/${submoduleId}`);
            if (!res.ok) return null;
            const json = await res.json();
            if (json?.schedule) {
              return { promptId, submoduleId, schedule: json.schedule };
            }
          } catch (e) {
            console.warn(`Failed to fetch schedule for ${submoduleId}:`, e);
          }
          return null;
        })
      );

      const newSchedules: Record<string, any> = {};
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
          const { promptId, submoduleId, schedule } = r.value;
          const formattedTime = schedule.schedule_time
            ? (schedule.schedule_time.length >= 5 ? schedule.schedule_time.slice(0, 5) : schedule.schedule_time)
            : '02:00';
          const schedObj = {
            tool: schedule.source || 'Perplexity',
            frequency: schedule.frequency || 'Daily',
            time: formattedTime,
            isActive: schedule.is_active ?? true
          };
          newSchedules[promptId] = schedObj;
          newSchedules[submoduleId] = schedObj;
        }
      });

      if (Object.keys(newSchedules).length > 0) {
        setModuleSchedules(prev => ({
          ...prev,
          [selectedClientId]: {
            ...(prev[selectedClientId] || {}),
            ...newSchedules
          }
        }));
      }
    } catch (err) {
      console.error("Error loading submodule schedules:", err);
    }
  };

  const checkSubmoduleEnabled = (modId: string, subId: string): boolean => {
    if (!enabledModules || !enabledModules[modId]) {
      return false;
    }
    if (modId === 'custom_tasks') {
      const clientTasks = customTasks[selectedClientId] || [];
      const task = clientTasks.find(t => t.id === subId);
      if (task && task.subTasks && task.subTasks.length > 0) {
        if (selectedCustomSignals[subId] !== undefined) {
          return selectedCustomSignals[subId].length > 0;
        }
      }
      return true;
    }
    const mod = allModules.find(m => m.id === modId);
    const cat = mod?.categories?.find((c: any) => c.id === subId);
    if (cat && cat.items && cat.items.length > 0) {
      if (selectedSignals[subId] !== undefined) {
        return selectedSignals[subId].length > 0;
      }
    }
    return true;
  };

  const handleSaveSchedule = async (
    promptId: string,
    submoduleId: string,
    moduleId: string,
    source: string,
    promptText: string,
    frequency: string,
    scheduleTime: string
  ) => {
    setSavingSchedulePromptId(promptId);

    const isSubActive = checkSubmoduleEnabled(moduleId, submoduleId);

    // Immediate UI feedback update
    const scheduleObj = {
      tool: source,
      frequency,
      time: scheduleTime,
      isActive: isSubActive
    };

    setModuleSchedules(prev => {
      const clientScheds = { ...(prev[selectedClientId] || {}) };
      clientScheds[promptId] = scheduleObj;
      clientScheds[submoduleId] = scheduleObj;
      // Also update time for all prompts in local state immediately
      Object.keys(clientScheds).forEach(key => {
        if (clientScheds[key]) {
          clientScheds[key] = {
            ...clientScheds[key],
            time: scheduleTime
          };
        }
      });
      return {
        ...prev,
        [selectedClientId]: clientScheds
      };
    });

    try {
      let industry = editSector;
      if (!industry) {
        const { data: clientData } = await supabase
          .schema('admin')
          .from('clients')
          .select('industry')
          .eq('id', selectedClientId)
          .single();
        industry = clientData?.industry || 'Unknown';
      }

      const promptPayload = {
        clientId: selectedClientId,
        submoduleId,
        moduleId,
        source,
        promptText,
        industry: industry || 'Unknown',
        frequency,
        isActive: isSubActive
      };

      const clientPayload = {
        scheduleTime
      };

      const [promptRes, clientRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptPayload)
        }),
        fetch(`${import.meta.env.VITE_API_URL}/schedules/client/${selectedClientId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientPayload)
        })
      ]);

      if (!promptRes.ok) {
        let errMsg = `Failed to save prompt schedule (${promptRes.status})`;
        try {
          const errJson = await promptRes.json();
          if (errJson.error || errJson.message) errMsg = errJson.error || errJson.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      if (!clientRes.ok) {
        let errMsg = `Failed to update client schedule time (${clientRes.status})`;
        try {
          const errJson = await clientRes.json();
          if (errJson.error || errJson.message) errMsg = errJson.error || errJson.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      if (dbPrompts && dbPrompts.length > 0) {
        await fetchSubmoduleSchedules(dbPrompts);
      }

      showToast("Schedule configuration saved successfully", 'success');
      setShowHistoryModuleId(null);
      setTempSchedule(null);
    } catch (err: any) {
      console.error("Error saving schedule to backend:", err);
      showToast(err.message || "Failed to save schedule to backend", 'error');
    } finally {
      setSavingSchedulePromptId(null);
    }
  };

  const loadingStatusFetched = React.useRef(false);

  const [pipelineStatuses, setPipelineStatuses] = React.useState<Record<string, {
    status: 'idle' | 'running' | 'completed' | 'failed';
    stage?: string;
    counts?: any;
    error?: string;
    jobId?: string;
    signalsStored?: number;
  }>>({});

  const [clientStatusBySubmodule, setClientStatusBySubmodule] = React.useState<Record<string, any>>({});
  const clientStatusBySubmoduleRef = React.useRef<Record<string, any>>({});

  React.useEffect(() => {
    clientStatusBySubmoduleRef.current = clientStatusBySubmodule;
  }, [clientStatusBySubmodule]);

  const [articleLogsBySubmodule, setArticleLogsBySubmodule] = React.useState<Record<string, any[]>>({});
  const [logsModalSubmoduleId, setLogsModalSubmoduleId] = React.useState<string | null>(null);
  const [retryingFailed, setRetryingFailed] = React.useState(false);
  const [retryingSubmoduleId, setRetryingSubmoduleId] = React.useState<string | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = React.useState(false);
  const [logsActiveTab, setLogsActiveTab] = React.useState<'completed' | 'skipped' | 'failed'>('completed');
  const [logsPage, setLogsPage] = React.useState(1);

  // Retry Logs / Failed queue state
  const [isRetryLogsModalOpen, setIsRetryLogsModalOpen] = React.useState(false);
  const [retryLogsFilterSubmoduleId, setRetryLogsFilterSubmoduleId] = React.useState<string | null>(null);
  const [retryQueue, setRetryQueue] = React.useState<Array<{
    id: string | number;
    submodule_id: string;
    submodule_name: string;
    title: string;
    status: 'pending' | 'retrying' | 'completed' | 'failed';
    error_message?: string;
    created_at?: string;
    processed_at?: string;
  }>>([]);
  const [activeRetryArticleId, setActiveRetryArticleId] = React.useState<string | number | null>(null);

  // Daily Report State
  const [isDailyReportOpen, setIsDailyReportOpen] = React.useState(false);
  const [reportDate, setReportDate] = React.useState<string>(() => getTodayIST());
  const [dailyReportLoading, setDailyReportLoading] = React.useState(false);
  const [selectedReportModuleId, setSelectedReportModuleId] = React.useState<string | null>(null);
  const [dailyReportJobs, setDailyReportJobs] = React.useState<any[]>([]);
  const [dailyReportLogs, setDailyReportLogs] = React.useState<any[]>([]);
  const [dailySummary, setDailySummary] = React.useState<{
    totalFetched: number;
    totalProcessed: number;
    totalFailed: number;
  }>({ totalFetched: 0, totalProcessed: 0, totalFailed: 0 });

  const [moduleBreakdown, setModuleBreakdown] = React.useState<Array<{
    moduleId: string;
    moduleName: string;
    color: string;
    bg: string;
    icon: any;
    fetched: number;
    processed: number;
    failed: number;
  }>>([]);

  const [submoduleReportRows, setSubmoduleReportRows] = React.useState<Array<{
    submoduleId: string;
    submoduleName: string;
    fetched: number;
    afterUrlCheck: number;
    afterTopicDedup: number;
    afterQualityFilter: number;
    signalsStored: number;
    completed: number;
    skipped: number;
    failed: number;
  }>>([]);

  const fetchArticleLogs = async (date: string | null = null) => {
    if (!selectedClientId) return;
    try {
      const activeDate = date || reportDate || getTodayIST();
      const { startIso, endIso } = getISTDayBoundsUTC(activeDate);

      const { data, error } = await supabase
        .from('article_processing_log')
        .select('*')
        .eq('client_id', selectedClientId)
        .gte('processed_at', startIso)
        .lte('processed_at', endIso)
        .order('processed_at', { ascending: false });

      if (error || !data) {
        setArticleLogsBySubmodule({});
        return;
      }

      const logsBySub: Record<string, any[]> = {};

      data.forEach(log => {
        const subId = log.submodule_id;
        if (!subId) return;

        if (!logsBySub[subId]) {
          logsBySub[subId] = [];
        }
        logsBySub[subId].push(log);
      });

      // If a submodule has a run actively in-flight, handle running state
      Object.keys(clientStatusBySubmoduleRef.current).forEach(subId => {
        const activeStatus = clientStatusBySubmoduleRef.current[subId];
        if (activeStatus?.status === 'running') {
          if (!activeStatus.jobId) {
            logsBySub[subId] = [];
          }
        }
      });

      setArticleLogsBySubmodule(logsBySub);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDailyReportSummary = (jobs: any[], logs: any[]) => {
    const totalFetched = jobs.reduce((sum, j) => sum + (j.count_fetched || 0), 0);
    // CHANGED: count directly from article_processing_log instead of
    // pipeline_job_status.count_stored_final -- that column is only set once
    // by the original run and never updated by retries, so it goes stale
    // the moment any article gets successfully retried.
    const totalProcessed = logs.filter(l => l.status === 'completed').length;
    const totalFailed = logs.filter(l => l.status === 'failed').length;

    setDailySummary({
      totalFetched,
      totalProcessed,
      totalFailed
    });
  };

  const fetchModuleBreakdown = (jobs: any[], logs: any[]) => {
    const subToModMap: Record<string, string> = {};
    dbPrompts.forEach(p => {
      const subId = p.submodule_id || p.custom_task_id;
      if (subId) {
        subToModMap[subId] = p.module_id || 'custom_tasks';
      }
    });
    allSubmodulesList.forEach(s => {
      if (s.id) {
        subToModMap[s.id] = s.module_id;
      }
    });
    (customTasks[selectedClientId] || []).forEach(t => {
      if (t.id) subToModMap[t.id] = 'custom_tasks';
      (t.subTasks || []).forEach((st: any) => {
        if (st.id) subToModMap[st.id] = 'custom_tasks';
      });
    });

    const breakdown = allModules.map(mod => {
      const modJobs = jobs.filter(j => subToModMap[j.submodule_id] === mod.id);
      const modLogs = logs.filter(l => subToModMap[l.submodule_id] === mod.id);

      const fetched = modJobs.reduce((sum, j) => sum + (j.count_fetched || 0), 0);
      // CHANGED: same fix as fetchDailyReportSummary -- count from logs, not
      // the stale job-level counter.
      const processed = modLogs.filter(l => l.status === 'completed').length;
      const failed = modLogs.filter(l => l.status === 'failed').length;

      return {
        moduleId: mod.id,
        moduleName: mod.label,
        color: mod.color,
        bg: mod.bg,
        icon: mod.icon,
        fetched,
        processed,
        failed
      };
    });
    setModuleBreakdown(breakdown);
  };

  const fetchDailyReportData = async (dateStr: string) => {
    if (!selectedClientId) return;
    setDailyReportLoading(true);
    try {
      const { startIso, endIso } = getISTDayBoundsUTC(dateStr);

      const [jobsRes, logsRes] = await Promise.all([
        supabase
          .from('pipeline_job_status')
          .select('*')
          .eq('client_id', selectedClientId)
          .gte('started_at', startIso)
          .lte('started_at', endIso),
        supabase
          .from('article_processing_log')
          .select('*')
          .eq('client_id', selectedClientId)
          .gte('processed_at', startIso)
          .lte('processed_at', endIso)
      ]);

      const jobs = jobsRes.data || [];
      const logs = logsRes.data || [];

      setDailyReportJobs(jobs);
      setDailyReportLogs(logs);
      fetchDailyReportSummary(jobs, logs);
      fetchModuleBreakdown(jobs, logs);

      const logsBySub: Record<string, any[]> = {};
      logs.forEach(log => {
        const subId = log.submodule_id;
        if (!subId) return;
        if (!logsBySub[subId]) {
          logsBySub[subId] = [];
        }
        logsBySub[subId].push(log);
      });
      setArticleLogsBySubmodule(logsBySub);
    } catch (err) {
      console.error("Error fetching daily report data:", err);
    } finally {
      setDailyReportLoading(false);
    }
  };

  React.useEffect(() => {
    if (!selectedReportModuleId) {
      setSubmoduleReportRows([]);
      return;
    }

    const isCustomModule = selectedReportModuleId === 'custom_tasks';
    const activePrompts = dbPrompts.filter(p => {
      if (isCustomModule) {
        return p.custom_task_id !== null && p.module_id === null;
      }
      return p.module_id === selectedReportModuleId;
    });

    const subRows = activePrompts.map(p => {
      const subId = p.submodule_id || p.custom_task_id || p.id;
      const subName = p.submodules?.submodule_name || p.custom_tasks?.name || 'Unknown Item';

      const subJobs = dailyReportJobs.filter(j => j.submodule_id === subId);
      const subLogs = dailyReportLogs.filter(l => l.submodule_id === subId);

      const fetched = subJobs.reduce((sum, j) => sum + (j.count_fetched || 0), 0);
      const afterUrlCheck = subJobs.reduce((sum, j) => sum + (j.count_after_url_check || 0), 0);
      const afterTopicDedup = subJobs.reduce((sum, j) => sum + (j.count_after_topic_dedup || 0), 0);
      const afterQualityFilter = subJobs.reduce((sum, j) => sum + (j.count_after_quality_filter || 0), 0);
      // CHANGED: same fix -- signalsStored now counts real completed log
      // rows instead of the stale job-level counter, so it stays accurate
      // after retries.
      const signalsStored = subLogs.filter(l => l.status === 'completed').length;

      const completed = subLogs.filter(l => l.status === 'completed').length;
      const skipped = subLogs.filter(l => l.status === 'skipped').length;
      const failed = subLogs.filter(l => l.status === 'failed').length;

      return {
        submoduleId: subId,
        submoduleName: subName,
        fetched,
        afterUrlCheck,
        afterTopicDedup,
        afterQualityFilter,
        signalsStored,
        completed,
        skipped,
        failed
      };
    });
    setSubmoduleReportRows(subRows);
  }, [selectedReportModuleId, dailyReportJobs, dailyReportLogs, dbPrompts]);

  React.useEffect(() => {
    if (isDailyReportOpen && selectedClientId) {
      fetchDailyReportData(reportDate);
    }
  }, [isDailyReportOpen, reportDate, selectedClientId]);

  React.useEffect(() => {
    fetchArticleLogs();
  }, [selectedClientId]);

  React.useEffect(() => {
    // Check if any submodule status transitioned to 'completed'
    const anyCompleted = Object.values(clientStatusBySubmodule).some(s => s.status === 'completed');
    if (anyCompleted) {
      fetchArticleLogs();
    }
  }, [JSON.stringify(Object.values(clientStatusBySubmodule).map(s => s.status))]);

  const openRetryLogs = async (submoduleId: string | null = null) => {
    setLogsModalSubmoduleId(submoduleId);
    setRetryLogsFilterSubmoduleId(submoduleId);
    setLogsActiveTab('failed');
    setLogsPage(1);
    
    const activeDate = reportDate || getTodayIST();
    const { startIso, endIso } = getISTDayBoundsUTC(activeDate);

    await fetchArticleLogs(activeDate);
    
    // Check if we need to initialize or load failed articles for this date
    let failedItems: any[] = [];
    if (submoduleId) {
      const logs = articleLogsBySubmodule[submoduleId] || [];
      failedItems = logs.filter(l => l.status === 'failed');
    } else {
      Object.values(articleLogsBySubmodule).forEach(logs => {
        logs.forEach(l => {
          if (l.status === 'failed') failedItems.push(l);
        });
      });
      if (dailyReportLogs.length > 0) {
        dailyReportLogs.forEach(l => {
          if (l.status === 'failed' && !failedItems.some(f => f.id === l.id)) {
            failedItems.push(l);
          }
        });
      }
    }

    if (failedItems.length === 0) {
      try {
        let q = supabase
          .from('article_processing_log')
          .select('*')
          .eq('client_id', selectedClientId)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .eq('status', 'failed');
        if (submoduleId) q = q.eq('submodule_id', submoduleId);
        const { data: dbFailed } = await q.order('created_at', { ascending: false });
        if (dbFailed && dbFailed.length > 0) {
          failedItems = dbFailed;
        }
      } catch (err) {
        console.warn("Error fetching DB failed logs:", err);
      }
    }

    if (failedItems.length > 0 && (retryQueue.length === 0 || !retryingFailed)) {
      const queue = failedItems.map((item, idx) => ({
        id: item.id || `failed-${idx}`,
        submodule_id: item.submodule_id || submoduleId || '',
        submodule_name: dbPrompts.find(p => (p.submodule_id || p.custom_task_id) === item.submodule_id)?.submodules?.submodule_name ||
                        allSubmodulesList.find(s => s.id === item.submodule_id)?.name ||
                        item.submodule_id || 'General Pipeline',
        title: item.title || item.article_title || item.url || `Article #${idx + 1}`,
        status: 'failed' as const,
        error_message: item.error_message || item.message || 'Processing failed previously',
        created_at: item.created_at,
        processed_at: item.processed_at
      }));
      setRetryQueue(queue);
    } else if (failedItems.length === 0 && !retryingFailed) {
      setRetryQueue([]);
    }

    setIsLogsModalOpen(true);
  };

  const handleRetrySingleArticle = async (item: any) => {
    // There's no backend endpoint to retry one specific article -- only
    // per-client or per-submodule. This retries the whole submodule that
    // article belongs to (which will also pick up any other failed
    // articles in that same submodule).
    await handleRetryFailed(item.submodule_id || undefined);
  };

  const handleRetryFailed = async (targetSubmoduleId?: string) => {
  if (!selectedClientId) return;

  setRetryingFailed(true);
  setRetryingSubmoduleId(targetSubmoduleId || null);

  // Fire the real backend retry -- this is the ONLY place that actually
  // reprocesses articles. We do not simulate or fake any outcome here.
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/retry-failed/${selectedClientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetSubmoduleId ? { submoduleId: targetSubmoduleId } : {})
    });
  } catch (e) {
    console.warn("Backend retry error:", e);
    setRetryingFailed(false);
    setRetryingSubmoduleId(null);
    showToast("Failed to start retry", "error");
    return;
  }

  showToast("Retrying failed articles...", "success");

  // Poll the real failed-count endpoint until it reaches 0 or stops
  // changing (e.g. stuck on a rate limit), then refresh from the DB.
  let lastCount: number | null = null;
  let stableTicks = 0;

  const poll = async () => {
    try {
      const url = targetSubmoduleId
        ? `${import.meta.env.VITE_API_URL}/failed-count/${selectedClientId}?submoduleId=${targetSubmoduleId}`
        : `${import.meta.env.VITE_API_URL}/failed-count/${selectedClientId}`;
      const res = await fetch(url);
      const { count } = await res.json();

      if (count === 0 || count === lastCount) {
        stableTicks = count === lastCount ? stableTicks + 1 : 0;
        if (count === 0 || stableTicks >= 3) {
          setRetryingFailed(false);
          setRetryingSubmoduleId(null);
          await fetchArticleLogs(reportDate);
          if (isDailyReportOpen) await fetchDailyReportData(reportDate);
          showToast(count === 0 ? "Retry complete!" : "Retry paused (rate limited) — will resume automatically.", "success");
          return;
        }
      }
      lastCount = count;
      setTimeout(poll, 3000);
    } catch (e) {
      console.warn("Poll error:", e);
      setRetryingFailed(false);
      setRetryingSubmoduleId(null);
    }
  };

  setTimeout(poll, 3000);
};

  React.useEffect(() => {
    if (!selectedClientId) {
      setClientStatusBySubmodule({});
      return;
    }
    
    let isMounted = true;
    let timerId: any = null;

    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase.from('pipeline_job_status')
          .select('job_id, submodule_id, status, current_stage, count_fetched, count_after_url_check, count_after_topic_dedup, count_after_quality_filter, count_stored_final, started_at, completed_at, updated_at')
          .eq('client_id', selectedClientId)
          .order('started_at', { ascending: false });

        if (error) {
          if (error.code !== 'PGRST116') {
             console.error('Error fetching pipeline status:', error);
          }
          if (isMounted) {
            setClientStatusBySubmodule({});
          }
          return;
        }
        
        if (isMounted && data) {
          const statusMap: Record<string, any> = {};
          
          data.forEach(job => {
            const subId = job.submodule_id;
            if (!subId || statusMap[subId]) return; // already have latest for this sub

            const timestamp = job.completed_at || job.updated_at || job.started_at;
            let formattedDate = '-';
            if (timestamp) {
              try {
                formattedDate = new Date(timestamp).toLocaleString();
              } catch (e) {
                formattedDate = String(timestamp);
              }
            }

            statusMap[subId] = {
              hasRun: true,
              jobId: job.job_id,
              status: job.status,
              stage: job.current_stage,
              formattedDate,
              counts: {
                fetched: job.count_fetched ?? 0,
                afterUrlCheck: job.count_after_url_check ?? 0,
                afterTopicDedup: job.count_after_topic_dedup ?? 0,
                afterQualityFilter: job.count_after_quality_filter ?? 0,
                storedFinal: job.count_stored_final ?? 0
              }
            };
          });

          setClientStatusBySubmodule(statusMap);
          fetchArticleLogs();
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) {
          timerId = setTimeout(fetchStatus, 5000);
        }
      }
    };

    timerId = setTimeout(fetchStatus, 1500);
    
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [selectedClientId, Object.values(pipelineStatuses).some(p => p.status === 'running')]);

  const handleRunPipeline = async (promptId: string, clientId: string, promptContent: string, submoduleId: string, source: string) => {
    const initialCounts = {
      fetched: 0,
      afterUrlCheck: 0,
      afterTopicDedup: 0,
      afterQualityFilter: 0,
      storedFinal: 0,
      processed: 0
    };

    setPipelineStatuses(prev => ({ 
      ...prev, 
      [promptId]: { 
        status: 'running', 
        stage: 'starting',
        counts: initialCounts
      } 
    }));
    setClientStatusBySubmodule(prev => ({
      ...prev,
      [submoduleId]: {
        hasRun: true,
        status: 'running',
        stage: 'starting',
        formattedDate: new Date().toLocaleString(),
        counts: initialCounts
      }
    }));
    setArticleLogsBySubmodule(prev => ({ ...prev, [submoduleId]: [] }));

    try {
      const { data: clientData, error: clientErr } = await supabase.schema('admin').from('clients').select('industry').eq('id', clientId).single();
      if (clientErr) throw clientErr;
      const industry = clientData?.industry || 'Unknown';

      const res = await fetch(`${import.meta.env.VITE_API_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, promptText: promptContent, industry, submoduleId, source, moduleId: activeModuleId })
      });
      if (!res.ok) {
        let errorMsg = `API failed: ${res.statusText}`;
        const isConflict = res.status === 409;
        
        try {
          const errorData = await res.json();
          if (errorData && (errorData.error || errorData.message)) {
            errorMsg = errorData.error || errorData.message;
          }
        } catch (e) {
          // If 409 but no body, it's definitely an "already running" error
          if (isConflict) errorMsg = "already running";
        }

        // If it's a 409 or the message contains our target keywords, throw a specific error
        if (isConflict || errorMsg.toLowerCase().includes('already running') || errorMsg.toLowerCase().includes('conflict')) {
          throw new Error("Another submodule is currently running for this client — please wait for it to finish before starting a new one.");
        }
        
        throw new Error(errorMsg);
      }
      const { jobId } = await res.json();
      
      setPipelineStatuses(prev => ({ 
        ...prev, 
        [promptId]: { 
          ...prev[promptId], 
          status: 'running', 
          stage: 'started', 
          jobId,
          counts: initialCounts
        } 
      }));

      const poll = async () => {
        try {
          const { data: statusData, error } = await supabase.from('pipeline_job_status')
            .select('job_id, submodule_id, status, current_stage, count_fetched, count_after_url_check, count_after_topic_dedup, count_after_quality_filter, count_stored_final, started_at, completed_at, updated_at')
            .eq('job_id', jobId)
            .maybeSingle();

          if (error) {
            if (error.code !== 'PGRST116') {
              console.warn('Error polling pipeline status for job:', jobId, error);
            }
            setTimeout(poll, 2500);
            return;
          }

          if (!statusData) {
            setTimeout(poll, 2500);
            return;
          }

          const currentCounts = {
            fetched: statusData.count_fetched ?? 0,
            afterUrlCheck: statusData.count_after_url_check ?? 0,
            afterTopicDedup: statusData.count_after_topic_dedup ?? 0,
            afterQualityFilter: statusData.count_after_quality_filter ?? 0,
            storedFinal: statusData.count_stored_final ?? 0,
            processed: statusData.count_stored_final ?? 0
          };

          const timestamp = statusData.completed_at || statusData.updated_at || statusData.started_at;
          let formattedDate = '-';
          if (timestamp) {
            try {
              formattedDate = new Date(timestamp).toLocaleString();
            } catch (e) {
              formattedDate = String(timestamp);
            }
          }

          setClientStatusBySubmodule(prev => ({
            ...prev,
            [submoduleId]: {
              hasRun: true,
              jobId: statusData.job_id || jobId,
              status: statusData.status,
              stage: statusData.current_stage,
              formattedDate,
              counts: currentCounts
            }
          }));

          if (statusData.status === 'completed') {
            setPipelineStatuses(prev => ({
              ...prev,
              [promptId]: { 
                status: 'completed', 
                stage: 'completed',
                jobId,
                counts: currentCounts,
                signalsStored: currentCounts.storedFinal 
              }
            }));
            setModuleLastRan(prev => ({
              ...prev,
              [clientId]: {
                ...(prev[clientId] || {}),
                [promptId]: `Last run completed - ${currentCounts.storedFinal} signals stored`
              }
            }));
            fetchArticleLogs();
          } else if (statusData.status === 'failed') {
            setPipelineStatuses(prev => ({
              ...prev,
              [promptId]: { 
                status: 'failed', 
                stage: 'failed',
                jobId,
                counts: currentCounts,
                error: 'Pipeline failed' 
              }
            }));
            fetchArticleLogs();
          } else {
            setPipelineStatuses(prev => ({
              ...prev,
              [promptId]: { 
                status: 'running', 
                stage: statusData.current_stage || 'running', 
                jobId,
                counts: currentCounts
              }
            }));
            fetchArticleLogs();
            setTimeout(poll, 2500);
          }
        } catch (pollErr: any) {
           console.error('Polling error:', pollErr);
           setTimeout(poll, 3000);
        }
      };

      setTimeout(poll, 1500);
    } catch (err: any) {
      const errorMessage = err.message?.toLowerCase().includes('already running')
        ? "Another submodule is currently running for this client — please wait for it to finish before starting a new one."
        : err.message;
      setPipelineStatuses(prev => ({ ...prev, [promptId]: { status: 'failed', error: errorMessage } }));
    }
  };

  React.useEffect(() => {
    fetchPrompts();
    fetchModulesAndSubmodules();
    fetchDataSources();
  }, [selectedClientId]);

  const handleAddPrompt = async () => {
    const isCustomModule = selectedModuleId === 'custom_tasks';
    if (!selectedModuleId || !selectedSubmoduleId || !newPromptText.trim()) return;
    setIsSaving(true);
    try {
      const insertData: any = {
        client_id: selectedClientId,
        prompt_text: newPromptText,
        status: 'Running'
      };

      if (isCustomModule) {
        insertData.custom_task_id = selectedSubmoduleId;
      } else {
        insertData.module_id = selectedModuleId;
        insertData.submodule_id = selectedSubmoduleId;
      }

      const { data, error } = await supabase.schema('admin')
        .from('prompts')
        .insert(insertData)
        .select(`
          *,
          modules ( module_name ),
          submodules ( submodule_name ),
          custom_tasks ( name )
        `)
        .single();

      if (error) throw error;
      
      setDbPrompts(prev => [data, ...prev]);
      setShowAddPromptForm(false);
      setSelectedModuleId("");
      setSelectedSubmoduleId("");
      setNewPromptText("");
      showToast("Processing prompt added");
    } catch (err: any) {
      console.error("Error adding prompt:", err);
      showToast(err.message || "Failed to add prompt", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePrompt = async (promptId: string, text: string) => {
    try {
      const { error } = await supabase.schema('admin')
        .from('prompts')
        .update({ prompt_text: text, last_run: new Date().toISOString() })
        .eq('id', promptId);
      
      if (error) throw error;
      
      setDbPrompts(prev => prev.map(p => p.id === promptId ? { ...p, prompt_text: text, last_run: new Date().toISOString() } : p));
      setEditingModuleIdState(null);
      showToast("Prompt updated successfully");
    } catch (err: any) {
      console.error("Failed to update prompt:", err);
      showToast(err.message || "Failed to update prompt", 'error');
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      const { error } = await supabase.schema('admin')
        .from('prompts')
        .delete()
        .eq('id', promptId);
      
      if (error) throw error;
      setDbPrompts(prev => prev.filter(p => p.id !== promptId));
      setConfirmDeleteModuleId(null);
      showToast("Prompt deleted");
    } catch (err: any) {
      console.error("Failed to delete prompt:", err);
      showToast(err.message || "Failed to delete prompt", 'error');
    }
  };

  const allModules = [...INTELLIGENCE_MODULES, {
    id: 'custom_tasks',
    label: 'Custom Tasks',
    icon: FileText,
    color: '#7E22CE',
    bg: '#F5F0FF',
    description: 'Bespoke custom intelligence monitoring tasks and sub-tasks defined specifically for this client.',
    categories: []
  }];

  const getSourceDescription = (source: string) => {
    const src = dataSources.find(s => s.id === source);
    return src?.description || "";
  };

  const hoursArray = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, '0') + ":00";
    let label = h;
    if (i === 0) label = "00:00 — midnight";
    if (i === 12) label = "12:00 — noon";
    return { value: h, label };
  });

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
              ? (customTasks[selectedClientId] || []).reduce((acc, task) => acc + (selectedCustomSignals[task.id]?.length || 0), 0)
              : module.categories.reduce((acc, cat) => acc + (selectedSignals[cat.id]?.length || 0), 0);
            const totalCount = isCustom
              ? (customTasks[selectedClientId] || []).reduce((acc, task) => acc + task.subTasks.length, 0)
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
                  {setEnabledModules && (
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
                  )}
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

      {/* 2. Main Pane: Prompt Management */}
      <div className="flex-1 flex flex-col bg-slate-50/10 min-w-0">
        {allModules.map((module) => {
          if (activeModuleId !== module.id) return null;
          const isEnabled = Boolean(enabledModules[module.id]);
          return (
            <div key={module.id} className="flex flex-col h-full overflow-hidden">
              {/* Pane Header */}
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
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setShowAddDataSourceForm(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-[6px] text-[11px] font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Data Source
                    </button>
                    <button
                      onClick={() => setShowDataSourceList(!showDataSourceList)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-[6px] text-[11px] font-bold transition-all active:scale-95 shadow-sm cursor-pointer ${
                        showDataSourceList 
                        ? "bg-slate-100 border-slate-300 text-slate-700" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {showDataSourceList ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showDataSourceList ? "Hide Sources" : "View Sources"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReportModuleId(null);
                        setIsDailyReportOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-[6px] text-[11px] font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                      Daily Report
                    </button>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              <div className={`flex-1 overflow-y-auto p-4 bg-slate-50/30 ${!isEnabled ? "flex flex-col items-center justify-center text-center" : ""}`}>
                {showAddDataSourceForm && (
                  <div className="mb-6 bg-slate-50 border border-[#e2e8f0] rounded-[6px] p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Display Name</label>
                        <input
                          type="text"
                          value={newDataSourceDisplayName}
                          onChange={(e) => setNewDataSourceDisplayName(e.target.value)}
                          placeholder="e.g. My Custom Source"
                          className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[6px] text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">ID (Auto-filled)</label>
                        <input
                          type="text"
                          value={newDataSourceId}
                          onChange={(e) => setNewDataSourceId(e.target.value)}
                          placeholder="MyCustomSource"
                          className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[6px] text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Description</label>
                        <input
                          type="text"
                          value={newDataSourceDescription}
                          onChange={(e) => setNewDataSourceDescription(e.target.value)}
                          placeholder="Short description of the source..."
                          className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[6px] text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Badge Color</label>
                        <select
                          value={newDataSourceBadgeColor}
                          onChange={(e) => setNewDataSourceBadgeColor(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[6px] text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="indigo">Indigo</option>
                          <option value="rose">Rose</option>
                          <option value="cyan">Cyan</option>
                          <option value="emerald">Emerald</option>
                          <option value="amber">Amber</option>
                          <option value="slate">Slate</option>
                          <option value="violet">Violet</option>
                          <option value="fuchsia">Fuchsia</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setShowAddDataSourceForm(false);
                          setNewDataSourceDisplayName("");
                          setNewDataSourceId("");
                          setNewDataSourceDescription("");
                        }}
                        disabled={isSavingDataSource}
                        className="px-4 py-2 text-[11px] font-bold text-slate-600 hover:text-slate-800 cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDataSource}
                        disabled={isSavingDataSource || !newDataSourceDisplayName || !newDataSourceId}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-black text-white rounded-[6px] text-[11px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingDataSource && <Loader2 className="h-3 w-3 animate-spin" />}
                        {isSavingDataSource ? "Saving..." : "Save Data Source"}
                      </button>
                    </div>
                  </div>
                )}

                {showDataSourceList && (
                  <div className="mb-6 bg-white border border-slate-200 rounded-[6px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                    <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manage Data Sources</h4>
                      <span className="text-[10px] text-slate-400 font-medium">{dataSources.length} total sources</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/30">
                            <th className="px-3.5 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Source</th>
                            <th className="px-3.5 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">ID</th>
                            <th className="px-3.5 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Description</th>
                            <th className="px-3.5 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Badge</th>
                            <th className="px-3.5 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">Active</th>
                            <th className="px-3.5 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {dataSources.map((src) => (
                            <tr key={src.id} className="hover:bg-slate-50/40 transition-colors group h-[42px]">
                              {editingDataSourceId === src.id ? (
                                <>
                                  <td className="px-3.5 py-2">
                                    <input 
                                      type="text" 
                                      value={editDataSourceDisplayName} 
                                      onChange={(e) => setEditDataSourceDisplayName(e.target.value)}
                                      autoFocus
                                      className="w-full text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </td>
                                  <td className="px-3.5 py-2">
                                    <input 
                                      type="text" 
                                      value={editDataSourceIdValue} 
                                      onChange={(e) => setEditDataSourceIdValue(e.target.value)}
                                      className="w-full text-[9px] font-mono tracking-tight text-slate-400 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </td>
                                  <td className="px-3.5 py-2">
                                    <input 
                                      type="text" 
                                      value={editDataSourceDescription} 
                                      onChange={(e) => setEditDataSourceDescription(e.target.value)}
                                      placeholder="Description..."
                                      className="w-full text-[10.5px] text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </td>
                                  <td className="px-3.5 py-2">
                                    <select
                                      value={editDataSourceBadgeColor}
                                      onChange={(e) => setEditDataSourceBadgeColor(e.target.value)}
                                      className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-1 outline-none focus:border-indigo-500"
                                    >
                                      <option value="indigo">Indigo</option>
                                      <option value="rose">Rose</option>
                                      <option value="cyan">Cyan</option>
                                      <option value="emerald">Emerald</option>
                                      <option value="amber">Amber</option>
                                      <option value="slate">Slate</option>
                                      <option value="violet">Violet</option>
                                      <option value="fuchsia">Fuchsia</option>
                                    </select>
                                  </td>
                                  <td className="px-3.5 py-2 text-center">
                                    <button
                                      onClick={() => handleToggleDataSourceField(src.id, 'is_active', !src.is_active)}
                                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                                        src.is_active ? 'bg-indigo-500' : 'bg-slate-200'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                                          src.is_active ? 'translate-x-4' : 'translate-x-0.5'
                                        }`}
                                      />
                                    </button>
                                  </td>
                                  <td className="px-3.5 py-2 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                       <button 
                                         onClick={handleUpdateDataSource}
                                         disabled={isSavingDataSource}
                                         className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                                         title="Save Changes"
                                       >
                                         {isSavingDataSource ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                       </button>
                                       <button 
                                         onClick={() => setEditingDataSourceId(null)}
                                         disabled={isSavingDataSource}
                                         className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
                                         title="Cancel"
                                       >
                                         <RotateCcw className="h-3.5 w-3.5" />
                                       </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3.5 py-2">
                                    <span className="text-[11px] font-bold text-slate-700">{src.display_name}</span>
                                  </td>
                                  <td className="px-3.5 py-2">
                                    <span className="text-[9px] text-slate-400 font-mono tracking-tight">{src.id}</span>
                                  </td>
                                  <td className="px-3.5 py-2">
                                    <p className="text-[10.5px] text-slate-500 max-w-[180px] truncate leading-normal" title={src.description}>
                                      {src.description || <span className="text-slate-300 italic text-[9.5px]">No description</span>}
                                    </p>
                                  </td>
                                  <td className="px-3.5 py-2">
                                    <span className={`text-[9px] font-bold text-${src.badge_color}-700 bg-${src.badge_color}-50/80 border border-${src.badge_color}-100 px-1.5 py-0.5 rounded-[3px] font-sans inline-block`}>
                                      {src.display_name}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2 text-center">
                                    <button
                                      onClick={() => handleToggleDataSourceField(src.id, 'is_active', !src.is_active)}
                                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                                        src.is_active ? 'bg-indigo-500' : 'bg-slate-200'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                                          src.is_active ? 'translate-x-4' : 'translate-x-0.5'
                                        }`}
                                      />
                                    </button>
                                  </td>
                                  <td className="px-3.5 py-2 text-right">
                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {confirmDeleteId === src.id ? (
                                        <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                                          <button
                                            onClick={() => handleDeleteDataSource(src.id)}
                                            disabled={isDeletingDataSourceId === src.id}
                                            className="px-2 py-1 bg-red-500 text-white text-[9px] font-bold rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                                          >
                                            {isDeletingDataSourceId === src.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "Confirm"}
                                          </button>
                                          <button
                                            onClick={() => setConfirmDeleteId(null)}
                                            disabled={isDeletingDataSourceId === src.id}
                                            className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => {
                                              setEditingDataSourceId(src.id);
                                              setEditDataSourceIdValue(src.id);
                                              setEditDataSourceDisplayName(src.display_name);
                                              setEditDataSourceDescription(src.description || "");
                                              setEditDataSourceBadgeColor(src.badge_color);
                                            }}
                                            disabled={isDeletingDataSourceId === src.id}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all disabled:opacity-50"
                                            title="Edit Source"
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => setConfirmDeleteId(src.id)}
                                            disabled={isDeletingDataSourceId === src.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-50"
                                            title="Delete Source"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {!isEnabled ? (
                  <div className="h-full w-full max-w-2xl flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50 grayscale opacity-80 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="p-4 bg-white rounded-full mb-4 shadow-sm">
                      <RotateCcw className="h-8 w-8 text-slate-300" />
                    </div>
                    <h4 className="text-[16px] font-bold text-slate-800 mb-2 font-sans">Module Disabled for this Client</h4>
                    <p className="text-[12px] text-slate-600 max-w-[320px] leading-relaxed mb-6 font-sans font-medium">
                      Enable the toggle next to <strong className="text-slate-800">{module.label}</strong> in the Monitoring Scope panel to activate signal tracking and start configuring collection.
                    </p>
                    <button
                      onClick={() => {
                        if (setEnabledModules) {
                          setEnabledModules(prev => ({ ...prev, [module.id]: true }));
                        }
                        setActiveDetailTab('scope');
                      }}
                      className="bg-slate-600 hover:bg-slate-700 text-white text-[13px] font-bold py-2.5 px-8 rounded-[6px] transition-all active:scale-95 shadow-sm"
                    >
                      Enable {module.label}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pb-12">
                    {/* Add Prompt Button & Form */}
                    <div className="mb-4">
                      {!showAddPromptForm ? (
                        <button
                          onClick={() => {
                            setShowAddPromptForm(true);
                            setSelectedModuleId(module.id);
                            setSelectedSubmoduleId("");
                            setNewPromptText("");
                          }}
                          className="w-full py-3 border-2 border-dashed border-slate-200 rounded-[6px] bg-white hover:bg-slate-50 hover:border-indigo-300 transition-all text-slate-500 hover:text-indigo-600 font-bold text-[13px] flex items-center justify-center gap-2 group shadow-sm active:scale-[0.99]"
                        >
                          <span className="text-[16px] group-hover:scale-110 transition-transform">+</span>
                          Add Prompt
                        </button>
                      ) : (
                        <div className="bg-white border border-indigo-200 rounded-[6px] p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-[14px] font-bold text-slate-800">Add New Collection Prompt</h5>
                            <button onClick={() => setShowAddPromptForm(false)} className="text-slate-400 hover:text-slate-600 text-[18px]">×</button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Module</label>
                              <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-[6px] text-[12px] font-bold text-slate-500 cursor-not-allowed">
                                {module.label}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                {module.id === 'custom_tasks' ? 'Custom Task' : 'Submodule'}
                              </label>
                              <select 
                                value={selectedSubmoduleId}
                                onChange={(e) => setSelectedSubmoduleId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="">Select {module.id === 'custom_tasks' ? 'Task' : 'Submodule'}</option>
                                {module.id === 'custom_tasks' ? (
                                  (customTasks[selectedClientId] || []).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))
                                ) : (
                                  allSubmodulesList
                                    .filter(s => s.module_id === module.id)
                                    .map(s => (
                                      <option key={s.id} value={s.id}>{s.submodule_name}</option>
                                    ))
                                )}
                              </select>
                            </div>
                          </div>

                            <div className="space-y-1.5 mb-4">
                              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Prompt Content</label>
                              <textarea
                                value={newPromptText}
                                onChange={(e) => setNewPromptText(e.target.value)}
                                placeholder="Enter extraction and analysis prompt..."
                                className="w-full h-[120px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-[12px] font-mono text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setShowAddPromptForm(false)}
                                className="px-4 py-2 text-[11px] font-bold text-slate-600 hover:text-slate-800"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleAddPrompt}
                                disabled={isSaving || !selectedModuleId || !selectedSubmoduleId || !newPromptText}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[6px] text-[11px] font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                              >
                                {isSaving ? "Saving..." : "Save Prompt"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                    {(() => {
                      const isCustomModule = module.id === 'custom_tasks';
                      
                      const relevantPrompts = dbPrompts
                        .filter(p => {
                          if (isCustomModule) {
                            return p.custom_task_id !== null && p.module_id === null;
                          }
                          return p.module_id === module.id;
                        })
                        .map(p => ({
                          db_id: p.id,
                          id: p.id,
                          moduleId: p.module_id || 'custom_tasks',
                          moduleName: p.modules?.module_name || (isCustomModule ? 'Custom Tasks' : 'Unknown Module'),
                          submoduleId: p.submodule_id || p.custom_task_id,
                          categoryId: p.module_id || 'custom_tasks',
                          submoduleName: p.submodules?.submodule_name || p.custom_tasks?.name || 'Unknown Item',
                          name: p.submodules?.submodule_name || p.custom_tasks?.name || "Intelligence Item",
                          content: p.prompt_text,
                          lastEdited: p.last_run ? new Date(p.last_run).toLocaleString() : 'Never',
                          status: p.status,
                          is_custom: isCustomModule
                        }));

                      if (relevantPrompts.length === 0) {
                        return (
                          <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-[6px]">
                            <p className="text-[13px] text-slate-500 font-medium">
                              No prompts found for this module. Click "Add Prompt" to create one.
                            </p>
                          </div>
                        );
                      }

                      return relevantPrompts.map(prompt => {
                        const isEditing = editingModuleIdState === prompt.id;
                        const isPaused = prompt.status === 'Paused';

                        const currentContent = isEditing ? editPromptValue : prompt.content;
                        const currentLastEdited = prompt.lastEdited;

                        const promptStatus = {
                          ...pipelineStatuses[prompt.id],
                          ...clientStatusBySubmodule[prompt.submoduleId]
                        };
                        const promptLogs = articleLogsBySubmodule[prompt.submoduleId] || [];

                        const effectiveStatus = promptStatus;

                        // pipeline_job_status.status can stay stuck on 'failed' forever --
                        // retrying an article updates article_processing_log, not this
                        // job-level column. So show "Failed" only if a real failed article
                        // row still exists for this job; otherwise treat it as completed.
                        const jobFailedArticleCount = promptStatus.jobId
                          ? promptLogs.filter(l => l.job_id === promptStatus.jobId && l.status === 'failed').length
                          : promptLogs.filter(l => l.status === 'failed').length;
                        const displayStatus = effectiveStatus?.status === 'failed' && jobFailedArticleCount === 0
                          ? 'completed'
                          : effectiveStatus?.status;

                        // NEW: live count of this job's articles currently mid-retry.
                        // The backend sets status='retrying' the instant it picks an
                        // article up (manual button OR the automatic hourly sweep),
                        // and this component already re-fetches article logs every
                        // 5s regardless of any button click -- so this reflects
                        // background retries too, not just ones started from here.
                        const retryingCount = promptStatus.jobId
                          ? promptLogs.filter(l => l.job_id === promptStatus.jobId && l.status === 'retrying').length
                          : promptLogs.filter(l => l.status === 'retrying').length;

                          // NEW: scopes the "Article Log" summary line to only the
                        // current run's job_id, instead of every run logged today,
                        // so re-running the same prompt shows a fresh count instead
                        // of accumulating on top of the previous run's numbers.
                        const currentRunLogs = promptStatus.jobId
                          ? promptLogs.filter(l => l.job_id === promptStatus.jobId)
                          : promptLogs;

                        return (
                          <div key={prompt.id} className="space-y-3 mb-6 last:mb-0">
                            {confirmDeleteModuleId === prompt.id ? (
                              <div className="bg-red-50/70 border border-red-200 rounded-[6px] p-5 text-center space-y-3 animate-in fade-in duration-250">
                                <div className="p-2.5 bg-red-100 text-red-600 rounded-full w-10 h-10 flex items-center justify-center mx-auto animate-pulse">
                                  <Trash2 className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="text-[13px] font-bold text-slate-850">Delete Signal Tracking</h5>
                                  <p className="text-[11.5px] text-slate-600 max-w-md mx-auto leading-relaxed">
                                    Are you sure you want to delete this prompt? This action cannot be undone.
                                  </p>
                                </div>
                                <div className="flex items-center justify-center gap-2.5 pt-1">
                                  <button
                                    onClick={() => setConfirmDeleteModuleId(null)}
                                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeletePrompt(prompt.id);
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[6px] text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                                  >
                                    Confirm & Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <React.Fragment>
                                <div className="bg-white border border-[#e2e8f0] rounded-[6px] overflow-hidden">
                                <div className="p-3.5 space-y-3">
                                  {/* Card Header */}
                                  <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                      <h4 className="text-[12px] font-bold text-slate-800 font-sans">
                                        {prompt.is_custom ? prompt.name : prompt.submoduleName}
                                      </h4>
                                      {!prompt.is_custom && (
                                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight">
                                          {prompt.moduleName}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1.5 ml-1">
                                        {!isPaused ? (
                                          <>
                                            {(!effectiveStatus || effectiveStatus.hasRun === false || effectiveStatus.status === 'never run') ? (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-slate-200/50 bg-slate-50 text-slate-500 font-bold text-[9.5px] leading-tight select-none">
                                                <span>Never run</span>
                                              </span>
                                            ) : retryingCount > 0 ? (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-amber-200/50 bg-amber-50 text-amber-700 font-bold text-[9.5px] leading-tight select-none">
                                                <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-600" />
                                                <span>Retrying ({retryingCount})</span>
                                              </span>
                                            ) : displayStatus === 'completed' ? (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-emerald-200/50 bg-emerald-50 text-emerald-700 font-bold text-[9.5px] leading-tight select-none">
                                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                                <span>Completed</span>
                                              </span>
                                            ) : displayStatus === 'failed' ? (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-red-200/50 bg-red-50 text-red-700 font-bold text-[9.5px] leading-tight select-none">
                                                <ShieldAlert className="h-2.5 w-2.5 text-red-500" />
                                                <span>Failed</span>
                                              </span>
                                            ) : displayStatus === 'running' ? (
                                              null
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-slate-200/50 bg-slate-50 text-slate-500 font-bold text-[9.5px] leading-tight select-none">
                                                <span>{displayStatus}</span>
                                              </span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                await supabase.schema('admin').from('prompts').update({ status: 'Paused' }).eq('id', prompt.id);
                                                setDbPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, status: 'Paused' } : p));
                                              }}
                                              className="flex items-center justify-center h-5 w-5 p-0.5 hover:bg-amber-50 active:scale-95 text-amber-500 hover:text-amber-600 rounded transition-all cursor-pointer"
                                              title="Pause Monitoring"
                                            >
                                              <Pause className="h-3 w-3 fill-amber-500 text-amber-500 stroke-[2.5]" />
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-amber-200/50 bg-amber-50 text-amber-700 font-bold text-[9.5px] leading-tight select-none">
                                              <Pause className="h-2.5 w-2.5 text-amber-500 fill-amber-500 stroke-[2.5]" />
                                              <span>Paused</span>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                await supabase.schema('admin').from('prompts').update({ status: 'Running' }).eq('id', prompt.id);
                                                setDbPrompts(prev => prev.map(p => p.id === prompt.id ? { ...p, status: 'Running' } : p));
                                              }}
                                              className="flex items-center justify-center h-5 w-5 p-0.5 hover:bg-emerald-50 active:scale-95 text-emerald-500 hover:text-emerald-600 rounded transition-all cursor-pointer"
                                              title="Resume Monitoring"
                                            >
                                              <Play className="h-3 w-3 fill-emerald-500 text-emerald-500 stroke-[2.5]" />
                                            </button>
                                          </>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium font-sans">
                                        <span>Last edited:</span>
                                        <span className="text-slate-800 font-semibold">{currentLastEdited}</span>
                                        <span className="text-slate-300 select-none">•</span>
                                        {(!promptStatus?.hasRun) ? (
                                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-[4px] font-bold text-[9.5px] border border-slate-200/50">
                                            <span>Never Run</span>
                                          </span>
                                        ) : promptStatus.status === 'running' || runningModuleId === prompt.id ? (
                                          <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-[4px] font-bold text-[9.5px] border border-indigo-100/50">
                                            <span className="animate-spin text-indigo-500 font-sans font-bold inline-block">↻</span>
                                            <span>Running...</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-[4px] font-bold text-[9.5px] border border-emerald-100/50">
                                            <span className="text-emerald-500 font-sans font-bold">✓</span>
                                            <span>
                                              {promptStatus.formattedDate || moduleLastRan[selectedClientId]?.[prompt.id]}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="h-3 w-[1px] bg-slate-200 mx-1"></div>
                                      <button 
                                        onClick={() => {
                                          if (showHistoryModuleId === prompt.id) {
                                            setShowHistoryModuleId(null);
                                            setTempSchedule(null);
                                          } else {
                                            const activeDataSources = dataSources.filter(s => s.is_active);
                                            const firstActiveSourceId = activeDataSources[0]?.id || 'Perplexity';
                                            const suggestedTool = prompt.categoryId === 'md2' ? 'Exa' : prompt.categoryId === 'md4' ? 'Tavily' : 'Perplexity';
                                            const defaultTool = activeDataSources.some(s => s.id === suggestedTool) ? suggestedTool : firstActiveSourceId;

                                            const currentSched = moduleSchedules[selectedClientId]?.[prompt.id] || moduleSchedules[selectedClientId]?.[module.id] || {
                                              frequency: 'Daily',
                                              time: '02:00',
                                              lastRun: '04/06/2026, 12:00:00',
                                              tool: defaultTool
                                            };

                                            const rawTool = currentSched.tool;
                                            const activeTool = activeDataSources.some(s => s.id === rawTool) ? rawTool : firstActiveSourceId;

                                            setTempSchedule({
                                              tool: activeTool,
                                              frequency: currentSched.frequency,
                                              time: currentSched.time
                                            });
                                            setShowHistoryModuleId(prompt.id);
                                            if (prompt.submoduleId) {
                                              fetchSingleSchedule(prompt.submoduleId, prompt.id);
                                            }
                                          }
                                        }}
                                        className={`p-1 transition-colors cursor-pointer rounded ${showHistoryModuleId === prompt.id ? "text-indigo-600 bg-indigo-50/80" : "text-slate-400 hover:text-indigo-600"}`}
                                        title="Data Collection API Configuration"
                                      >
                                        <Plug className="h-3.5 w-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setEditingModuleIdState(prompt.id);
                                          setEditPromptValue(prompt.content);
                                        }}
                                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                        title="Edit Prompt"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => setConfirmDeleteModuleId(prompt.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                        title="Delete Prompt"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Prompt Content / Expandable Editor */}
                                  {isEditing ? (
                                    <div className="relative">
                                      <textarea
                                        value={editPromptValue}
                                        onChange={(e) => setEditPromptValue(e.target.value)}
                                        className="w-full text-[11.5px] text-slate-700 font-mono leading-relaxed bg-white p-3 pr-12 border border-[#4f46e5] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-indigo-600 min-h-[120px] resize-y"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          handleUpdatePrompt(prompt.id, editPromptValue);
                                        }}
                                        className="absolute bottom-3 right-3 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[4px] transition-colors shadow-sm cursor-pointer z-10"
                                        title="Save Prompt"
                                      >
                                        <Save className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <textarea
                                      readOnly
                                      value={prompt.content}
                                      className="w-full text-[11.5px] text-slate-700 font-mono leading-relaxed bg-slate-50/50 p-3 border border-slate-100 rounded-[6px] focus:outline-none min-h-[100px] resize-y cursor-default select-text"
                                      style={{ borderRadius: "6px" }}
                                    />
                                  )}

                                  {/* Prompt Tags Row */}
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <div className="flex-1"></div>
                                    <span className="text-[10px] text-slate-400 font-mono font-medium whitespace-nowrap">
                                      {prompt.content.length} chars
                                    </span>
                                  </div>

                                  {/* Frequency & Tool Details/Config */}
                                  {showHistoryModuleId === prompt.id && (() => {
                                     const activeDataSources = dataSources.filter(s => s.is_active);
                                     const firstActiveSourceId = activeDataSources[0]?.id || 'Perplexity';
                                     const suggestedTool = prompt.categoryId === 'md2' ? 'Exa' : prompt.categoryId === 'md4' ? 'Tavily' : 'Perplexity';
                                     const defaultTool = activeDataSources.some(s => s.id === suggestedTool) ? suggestedTool : firstActiveSourceId;

                                     const currentSched = moduleSchedules[selectedClientId]?.[prompt.id] || moduleSchedules[selectedClientId]?.[module.id] || {
                                       frequency: 'Daily',
                                       time: '02:00',
                                       lastRun: '04/06/2026, 12:00:00',
                                       tool: defaultTool
                                     };

                                     const rawTool = tempSchedule ? tempSchedule.tool : currentSched.tool;
                                     const activeTool = activeDataSources.some(s => s.id === rawTool) ? rawTool : firstActiveSourceId;
                                     const activeFrequency = tempSchedule ? tempSchedule.frequency : currentSched.frequency;
                                     const activeTime = tempSchedule ? tempSchedule.time : currentSched.time;

                                     const promptStatus = {
                                       ...pipelineStatuses[prompt.id],
                                       ...clientStatusBySubmodule[prompt.submoduleId]
                                     };
                                     const promptLogs = articleLogsBySubmodule[prompt.submoduleId] || [];

                                   return (
                                     <div className="mt-3 bg-transparent border border-slate-200/80 rounded-[8px] p-4.5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200 font-sans">
                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                         {/* Column 1: Source */}
                                         <div className="flex flex-col">
                                           <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5 align-middle select-none">
                                             <Plug className="h-3 w-3 text-slate-400 rotate-45" />
                                             <span>Source <span className="text-rose-500 font-bold">*</span></span>
                                           </div>
                                           <div className="relative">
                                             <div className="w-full px-3 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-[6px] flex items-center justify-between min-h-[38px] hover:border-slate-300 transition-all cursor-pointer">
                                               <span>{dataSources.find(s => s.id === activeTool)?.display_name || activeTool}</span>
                                               <div className="flex items-center gap-1.5">
                                                 {(() => {
                                                   const src = dataSources.find(s => s.id === activeTool);
                                                   if (!src) return null;
                                                   return (
                                                     <span className={`text-[9.5px] font-bold text-${src.badge_color}-600 bg-${src.badge_color}-50 border border-${src.badge_color}-150 px-1.5 py-0.5 rounded-[4px] font-sans font-medium`}>
                                                       {src.display_name}
                                                     </span>
                                                   );
                                                 })()}
                                                 <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                               </div>
                                             </div>
                                             <select
                                               value={activeTool}
                                               onChange={(e) => {
                                                 const val = e.target.value;
                                                 setTempSchedule(prev => prev ? { ...prev, tool: val } : { tool: val, frequency: activeFrequency, time: activeTime });
                                               }}
                                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                                             >
                                               {dataSources.filter(s => s.is_active).map(src => (
                                                 <option key={src.id} value={src.id}>{src.display_name}</option>
                                               ))}
                                             </select>
                                           </div>
                                           <span className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                                              {getSourceDescription(activeTool)}
                                           </span>
                                         </div>

                                         {/* Column 2: Frequency */}
                                         <div className="flex flex-col">
                                           <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5 align-middle select-none">
                                             <RefreshCw className="h-3 w-3 text-slate-400" />
                                             <span>Frequency</span>
                                           </div>
                                           <div className="relative">
                                             <div className="w-full px-3 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-[6px] flex items-center justify-between min-h-[38px] hover:border-slate-300 transition-all cursor-pointer">
                                               <span>{activeFrequency}</span>
                                               <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                             </div>
                                             <select
                                               value={activeFrequency}
                                               onChange={(e) => {
                                                 const val = e.target.value;
                                                 setTempSchedule(prev => prev ? { ...prev, frequency: val } : { tool: activeTool, frequency: val, time: activeTime });
                                               }}
                                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                                             >
                                               <option value="Daily">Daily</option>
                                               <option value="Hourly">Hourly</option>
                                               <option value="Weekly">Weekly</option>
                                               <option value="Monthly">Monthly</option>
                                               <option value="Once">Once</option>
                                               <option value="Manual only">Manual only</option>
                                             </select>
                                           </div>
                                           <span className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                                             How often this prompt runs
                                           </span>
                                         </div>

                                         {/* Column 3: Schedule */}
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5 align-middle select-none">
                                              <Save className="h-3 w-3 text-slate-400" />
                                              <span>Schedule (IST)</span>
                                            </div>
                                            <div className="flex gap-2.5 items-center">
                                              <div className="relative flex-1">
                                                <input
                                                  type="time"
                                                  value={activeTime ? (activeTime.length > 5 ? activeTime.slice(0, 5) : activeTime) : "02:00"}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    setTempSchedule(prev => prev ? { ...prev, time: val } : { tool: activeTool, frequency: activeFrequency, time: val });
                                                  }}
                                                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-[6px] min-h-[38px] hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                                                />
                                              </div>

                                              {/* Action Buttons Group */}
                                              <div className="flex gap-1.5 shrink-0">
                                                <button
                                                  type="button"
                                                  disabled={savingSchedulePromptId === prompt.id}
                                                  onClick={() => handleSaveSchedule(
                                                    prompt.id,
                                                    prompt.submoduleId,
                                                    prompt.moduleId,
                                                    activeTool,
                                                    prompt.content,
                                                    activeFrequency,
                                                    activeTime
                                                  )}
                                                  className="flex items-center justify-center h-[38px] w-[38px] bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-[6px] cursor-pointer hover:bg-indigo-100 transition-colors shadow-xs active:scale-95 disabled:opacity-50"
                                                  title="Save APISchedule"
                                                >
                                                  {savingSchedulePromptId === prompt.id ? (
                                                    <span className="animate-spin text-indigo-600 font-sans font-bold inline-block">↻</span>
                                                  ) : (
                                                    <Save className="h-4 w-4" />
                                                  )}
                                                </button>

                                                <button
                                                  type="button"
                                                  disabled={runningModuleId === prompt.id || promptStatus?.status === 'running'}
                                                  onClick={() => handleRunPipeline(prompt.id, selectedClientId, prompt.content, prompt.submoduleId, activeTool)}
                                                  className="min-h-[38px] flex items-center justify-center gap-1.5 px-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-[12px] font-sans font-medium text-slate-700 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                                                  style={{ borderRadius: "6px" }}
                                                >
                                                  {promptStatus?.status === 'running' ? (
                                                    <span className="animate-spin text-slate-500 font-sans font-bold inline-block">↻</span>
                                                  ) : (
                                                    <Play className="h-3.5 w-3.5 text-slate-500 fill-slate-500" />
                                                  )}
                                                  <span>{promptStatus?.status === 'running' ? 'Running...' : 'Run now'}</span>
                                                </button>
                                              </div>
                                            </div>
                                            {(pipelineStatuses[prompt.id] || promptStatus?.status === 'running') ? (
                                              <div className="mt-2 text-[10.5px] p-2.5 rounded-[6px] border bg-slate-50 border-slate-200">
                                                {(pipelineStatuses[prompt.id]?.status === 'running' || promptStatus?.status === 'running') && (
                                                  <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                                                      <span className="animate-spin inline-block">↻</span>
                                                      <span>Pipeline started{pipelineStatuses[prompt.id]?.jobId ? ` — Job ID: ${pipelineStatuses[prompt.id].jobId}` : ''}</span>
                                                    </div>
                                                    <div className="text-slate-600 ml-4 font-medium">Stage: {STAGE_LABELS[promptStatus?.stage || pipelineStatuses[prompt.id]?.stage || 'fetching'] || promptStatus?.stage || pipelineStatuses[prompt.id]?.stage || 'fetching'}</div>
                                                  </div>
                                                )}
                                                {pipelineStatuses[prompt.id]?.status === 'completed' && (
                                                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    <span>Last Run {STAGE_LABELS[pipelineStatuses[prompt.id]?.status || 'completed'] || 'Completed'} — {pipelineStatuses[prompt.id].signalsStored || 0} signals stored</span>
                                                  </div>
                                                )}
                                                {pipelineStatuses[prompt.id]?.status === 'failed' && (
                                                  <div className="text-red-600 font-semibold flex items-center gap-1.5">
                                                    <ShieldAlert className="h-3.5 w-3.5" />
                                                    <span>Error: {pipelineStatuses[prompt.id].error}</span>
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                                                Time the job runs each cycle
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  {promptStatus && promptStatus.hasRun !== false && (
                                    <React.Fragment>
                                      <div className="bg-slate-50 border-t border-slate-100 px-3.5 py-2 flex items-center justify-between text-[10.5px] text-slate-500 font-sans shadow-inner">
                                        <div className="flex items-center gap-4">
                                          <span>Fetched: <strong className="text-slate-700 font-bold">{promptStatus.counts?.fetched ?? 0}</strong></span>
                                          <span>After URL Dedup: <strong className="text-slate-700 font-bold">{promptStatus.counts?.afterUrlCheck ?? 0}</strong></span>
                                          <span>After Topic Dedup: <strong className="text-slate-700 font-bold">{promptStatus.counts?.afterTopicDedup ?? 0}</strong></span>
                                          <span>After Quality Filter: <strong className="text-slate-700 font-bold">{promptStatus.counts?.afterQualityFilter ?? 0}</strong></span>
                                          <span>Signals Stored: <strong className="text-slate-700 font-bold">
                                            {promptStatus.jobId
                                              ? promptLogs.filter(l => l.job_id === promptStatus.jobId && l.status === 'completed').length
                                              : promptStatus.counts?.storedFinal ?? 0}
                                          </strong></span>
                                          {retryingCount > 0 && (
                                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                              Retrying {retryingCount} article{retryingCount > 1 ? 's' : ''}...
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Article Processing Log Summary */}
                                      <div className="bg-white border-t border-slate-100 px-4 py-2 font-sans flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-[10.5px]">
                                          <span className="font-bold text-slate-700">Article Log:</span>
                                          <span className="text-slate-500">
                                            Total: {currentRunLogs.length} | Completed: {currentRunLogs.filter(l => l.status === 'completed').length} | Skipped: {currentRunLogs.filter(l => l.status === 'skipped').length} | Failed: {currentRunLogs.filter(l => l.status === 'failed').length}
                                            {retryingCount > 0 && (
                                              <> | <span className="text-amber-700 font-bold">Retrying: {retryingCount}</span></>
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={async () => {
                                              setLogsModalSubmoduleId(prompt.submoduleId);
                                              setLogsPage(1);
                                              await fetchArticleLogs(reportDate);
                                              setIsLogsModalOpen(true);
                                            }}
                                            className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[4px] text-[10px] font-bold transition-colors cursor-pointer"
                                          >
                                            View Logs
                                          </button>
                                        </div>
                                      </div>
                                    </React.Fragment>
                                  )}
                                </div>
                              </div>
                            </React.Fragment>
                          )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Report Modal */}
      {isDailyReportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-4.5 w-4.5 text-indigo-600" />
                <div>
                  <h3 className="text-[14px] font-bold text-slate-800">Daily Intelligence Collection Report</h3>
                  <p className="text-[11px] text-slate-500">Overview of signals fetched, processed, and logged for this client.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {/* Date Filter (a) */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-1.5 shadow-xs">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-600">Date:</span>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="text-[11.5px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
                  />
                </div>
                {/* Retry Failed button for entire client (all modules & submodules) */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRetryFailed()}
                    disabled={retryingFailed}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-[6px] text-[11px] font-bold transition-all active:scale-95 disabled:opacity-75 cursor-pointer shadow-xs"
                    title="Retry all failed articles for this client across all modules and submodules"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${retryingFailed ? 'animate-spin text-red-600' : 'text-red-500'}`} />
                    {retryingFailed ? "Retrying..." : "Retry Failed"}
                  </button>
                  <button
                    onClick={() => openRetryLogs(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                    title="Show retry logs specifically for failed articles"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-600" />
                    Show Logs
                  </button>
                </div>
                <button 
                  onClick={() => setIsDailyReportOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-5 space-y-6">
              {dailyReportLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                  <span className="text-xs font-semibold">Loading daily collection data...</span>
                </div>
              ) : (
                <>
                  {/* (b) Client-Wide Summary */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Client-Wide Daily Summary ({reportDate})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="bg-slate-50/70 border border-slate-200 rounded-[8px] p-4 text-center">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Fetched</span>
                        <span className="text-[26px] font-extrabold text-slate-800 font-mono tracking-tight">{dailySummary.totalFetched}</span>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-[8px] p-4 text-center">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Signals Stored</span>
                        <span className="text-[26px] font-extrabold text-emerald-700 font-mono tracking-tight">{dailySummary.totalProcessed}</span>
                      </div>
                      <div className="bg-red-50/50 border border-red-200 rounded-[8px] p-4 text-center">
                        <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block mb-1">Total Failed</span>
                        <span className="text-[26px] font-extrabold text-red-700 font-mono tracking-tight">{dailySummary.totalFailed}</span>
                      </div>
                    </div>
                  </div>

                  {/* (c) Per-Module Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Per-Module Breakdown</h4>
                      <span className="text-[10px] text-slate-400 font-medium">Click on any module to view its submodule breakdown</span>
                    </div>
                    <div className="border border-slate-200 rounded-[6px] overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600">Module</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 text-center w-28">Fetched</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 text-center w-28">Signals Stored</th>
                            <th className="px-3.5 py-2.5 font-bold text-slate-600 text-center w-28">Failed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {moduleBreakdown.map((mod) => {
                            const isSelected = selectedReportModuleId === mod.moduleId;
                            return (
                              <tr
                                key={mod.moduleId}
                                onClick={() => setSelectedReportModuleId(prev => prev === mod.moduleId ? null : mod.moduleId)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-50/70 hover:bg-indigo-100/60 font-medium'
                                    : 'hover:bg-slate-50/70'
                                }`}
                              >
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center justify-between pr-2">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1 rounded" style={{ backgroundColor: mod.bg }}>
                                        <mod.icon className="h-3.5 w-3.5" style={{ color: mod.color }} />
                                      </div>
                                      <span className={`text-slate-800 ${isSelected ? 'font-bold text-indigo-900' : 'font-bold'}`}>
                                        {mod.moduleName}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}>
                                      {isSelected ? 'Hide Submodules' : 'View Submodules'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3.5 py-2.5 text-center font-semibold font-mono text-slate-700">{mod.fetched}</td>
                                <td className="px-3.5 py-2.5 text-center font-semibold font-mono text-emerald-600">{mod.processed}</td>
                                <td className="px-3.5 py-2.5 text-center font-semibold font-mono text-red-600">{mod.failed}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* (d) Per-Submodule Table: ONLY rendered when a module is selected */}
                  {selectedReportModuleId && (
                    <div className="animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Submodule Details: {allModules.find(m => m.id === selectedReportModuleId)?.label || 'Selected Module'}
                          </h4>
                          <button
                            onClick={() => setSelectedReportModuleId(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                          >
                            (hide)
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Filtered for {reportDate}</span>
                      </div>
                      <div className="border border-slate-200 rounded-[6px] overflow-x-auto">
                        <table className="w-full text-left text-[11px] whitespace-nowrap">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2 font-bold text-slate-600">Submodule Name</th>
                              <th className="px-2.5 py-2 font-bold text-slate-600 text-center">Fetched</th>
                              <th className="px-2.5 py-2 font-bold text-slate-600 text-center">After URL Dedup</th>
                              <th className="px-2.5 py-2 font-bold text-slate-600 text-center">After Topic Dedup</th>
                              <th className="px-2.5 py-2 font-bold text-slate-600 text-center">After Quality Filter</th>
                              <th className="px-2.5 py-2 font-bold text-slate-600 text-center">Signals Stored</th>
                              <th className="px-2.5 py-2 font-bold text-slate-600 text-center">Completed</th>
                              <th className="px-2.5 py-2 font-bold text-slate-600 text-center">Skipped</th>
                              <th className="px-2.5 py-2 font-bold text-slate-600 text-center">Failed</th>
                              <th className="px-3 py-2 font-bold text-slate-600 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {submoduleReportRows.map((row) => (
                              <tr key={row.submoduleId} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-3 py-2.5 font-bold text-slate-800 max-w-[200px] truncate" title={row.submoduleName}>
                                  {row.submoduleName}
                                </td>
                                <td className="px-2.5 py-2.5 text-center font-semibold font-mono text-slate-700">{row.fetched}</td>
                                <td className="px-2.5 py-2.5 text-center font-semibold font-mono text-slate-700">{row.afterUrlCheck}</td>
                                <td className="px-2.5 py-2.5 text-center font-semibold font-mono text-slate-700">{row.afterTopicDedup}</td>
                                <td className="px-2.5 py-2.5 text-center font-semibold font-mono text-slate-700">{row.afterQualityFilter}</td>
                                <td className="px-2.5 py-2.5 text-center font-bold font-mono text-indigo-600">{row.signalsStored}</td>
                                <td className="px-2.5 py-2.5 text-center font-semibold font-mono text-emerald-600">{row.completed}</td>
                                <td className="px-2.5 py-2.5 text-center font-semibold font-mono text-amber-600">{row.skipped}</td>
                                <td className="px-2.5 py-2.5 text-center font-semibold font-mono text-red-600">{row.failed}</td>
                                <td className="px-3 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={async () => {
                                        setLogsModalSubmoduleId(row.submoduleId);
                                        setLogsPage(1);
                                        await fetchArticleLogs(reportDate);
                                        setIsLogsModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-[4px] text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                      View Logs
                                    </button>
                                    {row.failed > 0 && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleRetryFailed(row.submoduleId)}
                                          disabled={retryingFailed}
                                          className="px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-[4px] text-[10px] font-bold transition-colors disabled:opacity-75 cursor-pointer flex items-center gap-1"
                                          title="Retry failed articles for this submodule"
                                        >
                                          <RefreshCw className={`h-2.5 w-2.5 ${retryingFailed && (retryingSubmoduleId === row.submoduleId || !retryingSubmoduleId) ? 'animate-spin text-red-600' : 'text-red-500'}`} />
                                          {retryingFailed && (retryingSubmoduleId === row.submoduleId || !retryingSubmoduleId) ? "Retrying..." : "Retry"}
                                        </button>
                                        <button
                                          onClick={() => openRetryLogs(row.submoduleId)}
                                          className="px-2 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[4px] text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                          title="Show logs for failed articles of this submodule"
                                        >
                                          <FileText className="h-2.5 w-2.5 text-slate-500" />
                                          Show Logs
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {submoduleReportRows.length === 0 && (
                              <tr>
                                <td colSpan={10} className="px-3 py-6 text-center text-slate-500 text-[12px]">
                                  No submodules configured for this module.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unified 3-Tab Article Processing & Retry Logs Modal */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col font-sans border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                  <span>
                    {logsModalSubmoduleId
                      ? (dbPrompts.find(p => (p.submodule_id || p.custom_task_id) === logsModalSubmoduleId)?.submodules?.submodule_name || 'Submodule Article Logs')
                      : 'Article Processing Logs'}
                  </span>
                  {logsModalSubmoduleId && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Filtered Submodule
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {logsModalSubmoduleId 
                    ? `Viewing execution logs and retry manager for selected submodule (${reportDate})` 
                    : `Viewing execution logs across all client submodules for ${reportDate}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {logsActiveTab === 'failed' && (() => {
                  const modalLogs = logsModalSubmoduleId
                    ? (articleLogsBySubmodule[logsModalSubmoduleId] || [])
                    : Object.values(articleLogsBySubmodule).flat();
                  const failedCount = modalLogs.filter(l => l.status === 'failed').length;
                  if (failedCount > 0) {
                    return (
                      <button
                        onClick={() => handleRetryFailed(logsModalSubmoduleId || undefined)}
                        disabled={retryingFailed}
                        className="px-3 py-1.5 text-white bg-red-600 hover:bg-red-700 rounded-[6px] text-[11px] font-bold transition-all shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                        title="Retry all failed articles"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${retryingFailed ? 'animate-spin' : ''}`} />
                        {retryingFailed ? "Retrying Failed..." : `Retry Failed (${failedCount})`}
                      </button>
                    );
                  }
                  return null;
                })()}

                <button 
                  onClick={() => setIsLogsModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>

            {/* 3-Tab Navigation Bar: 1. Completed, 2. Skipped, 3. Failed */}
            {(() => {
              const allScopeLogs = logsModalSubmoduleId
                ? (articleLogsBySubmodule[logsModalSubmoduleId] || [])
                : Object.values(articleLogsBySubmodule).flat();
              
              const completedLogs = allScopeLogs.filter(l => l.status === 'completed');
              const skippedLogs = allScopeLogs.filter(l => l.status === 'skipped');
              const failedLogs = allScopeLogs.filter(l => l.status === 'failed' || (l.status === 'retrying' && l.status !== 'completed'));

              return (
                <div className="flex items-center justify-between px-5 border-b border-slate-200 bg-slate-50/40">
                  <div className="flex items-center gap-2">
                    {/* Tab 1: Completed */}
                    <button
                      onClick={() => {
                        setLogsActiveTab('completed');
                        setLogsPage(1);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
                        logsActiveTab === 'completed'
                          ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs rounded-t-md'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Completed</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {completedLogs.length}
                      </span>
                    </button>

                    {/* Tab 2: Skipped */}
                    <button
                      onClick={() => {
                        setLogsActiveTab('skipped');
                        setLogsPage(1);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
                        logsActiveTab === 'skipped'
                          ? 'border-amber-600 text-amber-700 bg-white shadow-xs rounded-t-md'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      }`}
                    >
                      <SkipForward className="h-3.5 w-3.5 text-amber-600" />
                      <span>Skipped</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                        {skippedLogs.length}
                      </span>
                    </button>

                    {/* Tab 3: Failed Articles */}
                    <button
                      onClick={() => {
                        setLogsActiveTab('failed');
                        setLogsPage(1);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
                        logsActiveTab === 'failed'
                          ? 'border-red-600 text-red-700 bg-white shadow-xs rounded-t-md'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      }`}
                    >
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      <span>Failed Articles</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        failedLogs.length > 0 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {failedLogs.length}
                      </span>
                    </button>
                  </div>

                  {logsModalSubmoduleId && (
                    <button
                      onClick={() => {
                        setLogsModalSubmoduleId(null);
                        setLogsPage(1);
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
                    >
                      Show All Submodules
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Retrying indicator -- real status comes from polling, nothing simulated */}
            {retryingFailed && (
              <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-100 flex items-center gap-1.5 text-[11px] text-amber-900 font-semibold">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                Retrying failed articles... this may take a moment.
              </div>
            )}

            {/* Tab 1: Completed Articles Tab Content */}
            {logsActiveTab === 'completed' && (
              <div className="flex-1 overflow-auto p-4">
                {(() => {
                  const modalLogs = logsModalSubmoduleId 
                    ? (articleLogsBySubmodule[logsModalSubmoduleId] || []) 
                    : Object.values(articleLogsBySubmodule).flat().sort((a, b) => {
                        const timeA = new Date(a.processed_at || a.created_at || 0).getTime();
                        const timeB = new Date(b.processed_at || b.created_at || 0).getTime();
                        return timeB - timeA;
                      });

                  const completedLogs = modalLogs.filter(l => l.status === 'completed');

                  if (completedLogs.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <CheckCircle2 className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                        <p className="text-[13px] font-semibold text-slate-700">No completed articles yet</p>
                        <p className="text-[11px] text-slate-400 mt-1">Processed articles will appear here once pipeline jobs run or retries finish.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="border border-slate-200 rounded-[6px] overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 font-bold text-slate-600">Article Title</th>
                            <th className="px-3 py-2 font-bold text-slate-600 w-36">Submodule</th>
                            <th className="px-3 py-2 font-bold text-slate-600 w-24">Status</th>
                            <th className="px-3 py-2 font-bold text-slate-600">Message / Signals</th>
                            <th className="px-3 py-2 font-bold text-slate-600 w-36">Processed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {completedLogs.slice((logsPage - 1) * 20, logsPage * 20).map((log, idx) => {
                            const title = log.title || log.article_title || log.url || 'Untitled Article';
                            const subName = log.submodule_name ||
                              dbPrompts.find(p => (p.submodule_id || p.custom_task_id) === log.submodule_id)?.submodules?.submodule_name ||
                              allSubmodulesList.find(s => s.id === log.submodule_id)?.name ||
                              log.submodule_id || '-';
                            const message = log.error_message || log.message || 'Signals saved successfully';
                            const processedAt = log.processed_at || log.created_at;
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
                                <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[280px]">
                                  <div className="flex items-center gap-1.5 truncate" title={title}>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <span className="truncate">{title}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 truncate max-w-[140px]" title={subName}>
                                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium truncate block">
                                    {subName}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="px-1.5 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    Completed
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-500 max-w-[200px] truncate" title={message}>
                                  {message}
                                </td>
                                <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap font-mono text-[10px]">
                                  {formattedDate}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Tab 2: Skipped Articles Tab Content */}
            {logsActiveTab === 'skipped' && (
              <div className="flex-1 overflow-auto p-4">
                {(() => {
                  const modalLogs = logsModalSubmoduleId 
                    ? (articleLogsBySubmodule[logsModalSubmoduleId] || []) 
                    : Object.values(articleLogsBySubmodule).flat().sort((a, b) => {
                        const timeA = new Date(a.processed_at || a.created_at || 0).getTime();
                        const timeB = new Date(b.processed_at || b.created_at || 0).getTime();
                        return timeB - timeA;
                      });

                  const skippedLogs = modalLogs.filter(l => l.status === 'skipped');

                  if (skippedLogs.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <MinusCircle className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                        <p className="text-[13px] font-semibold text-slate-700">No skipped articles</p>
                        <p className="text-[11px] text-slate-400 mt-1">Articles skipped by deduplication or relevance checks will appear here.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="border border-slate-200 rounded-[6px] overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 font-bold text-slate-600">Article Title</th>
                            <th className="px-3 py-2 font-bold text-slate-600 w-36">Submodule</th>
                            <th className="px-3 py-2 font-bold text-slate-600 w-24">Status</th>
                            <th className="px-3 py-2 font-bold text-slate-600">Reason / Filter Note</th>
                            <th className="px-3 py-2 font-bold text-slate-600 w-36">Processed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {skippedLogs.slice((logsPage - 1) * 20, logsPage * 20).map((log, idx) => {
                            const title = log.title || log.article_title || log.url || 'Untitled Article';
                            const subName = log.submodule_name ||
                              dbPrompts.find(p => (p.submodule_id || p.custom_task_id) === log.submodule_id)?.submodules?.submodule_name ||
                              allSubmodulesList.find(s => s.id === log.submodule_id)?.name ||
                              log.submodule_id || '-';
                            const message = log.error_message || log.message || 'Filtered out during deduplication / relevance check';
                            const processedAt = log.processed_at || log.created_at;
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
                                <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[280px]">
                                  <div className="flex items-center gap-1.5 truncate" title={title}>
                                    <MinusCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <span className="truncate">{title}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 truncate max-w-[140px]" title={subName}>
                                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium truncate block">
                                    {subName}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="px-1.5 py-0.5 rounded-[4px] font-bold text-[9px] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                    Skipped
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-500 max-w-[200px] truncate" title={message}>
                                  {message}
                                </td>
                                <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap font-mono text-[10px]">
                                  {formattedDate}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Tab 3: Failed Articles Tab Content */}
            {logsActiveTab === 'failed' && (
              <div className="flex-1 overflow-auto p-4">
                {(() => {
                  const modalLogs = logsModalSubmoduleId 
                    ? (articleLogsBySubmodule[logsModalSubmoduleId] || []) 
                    : Object.values(articleLogsBySubmodule).flat();
                  
                  // Failed or currently retrying articles
                  const failedLogs = modalLogs.filter(l => l.status === 'failed' || (l.status === 'retrying' && l.status !== 'completed'));

                  if (failedLogs.length === 0 && !retryingFailed) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                        <p className="text-[13px] font-bold text-slate-800">No Failed Articles</p>
                        <p className="text-[11.5px] text-slate-500 mt-1 max-w-sm mx-auto">
                          All articles for this selection have been successfully processed and moved to Completed logs.
                        </p>
                        <button 
                          onClick={() => {
                            setLogsActiveTab('completed');
                            setLogsPage(1);
                          }}
                          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-[6px] text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          View Completed Logs
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="border border-slate-200 rounded-[6px] overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 font-bold text-slate-600">Article Title</th>
                            <th className="px-3 py-2 font-bold text-slate-600 w-36">Submodule</th>
                            <th className="px-3 py-2 font-bold text-slate-600 w-28 text-center">Status</th>
                            <th className="px-3 py-2 font-bold text-slate-600">Reason / Details</th>
                            <th className="px-3 py-2 font-bold text-slate-600 w-24 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {failedLogs.map((item, idx) => {
                            const isActive = activeRetryArticleId === item.id || item.status === 'retrying';
                            const title = item.title || item.article_title || item.url || `Failed Article #${idx + 1}`;
                            const subName = item.submodule_name || 
                              dbPrompts.find(p => (p.submodule_id || p.custom_task_id) === item.submodule_id)?.submodules?.submodule_name ||
                              allSubmodulesList.find(s => s.id === item.submodule_id)?.name ||
                              item.submodule_id || 'General';
                            const errorMessage = item.error_message || item.message || 'Processing failed';

                            return (
                              <tr 
                                key={item.id || idx}
                                className={`transition-colors ${
                                  isActive 
                                    ? 'bg-amber-50/80 border-l-2 border-l-amber-500' 
                                    : 'hover:bg-slate-50/50'
                                }`}
                              >
                                <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[280px]">
                                  <div className="flex items-start gap-2">
                                    {isActive ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 shrink-0 mt-0.5" />
                                    ) : (
                                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                    )}
                                    <div className="truncate">
                                      <span className="truncate block font-semibold text-slate-800" title={title}>
                                        {title}
                                      </span>
                                      {isActive && (
                                        <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                          Processing signal extraction...
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 truncate max-w-[140px]" title={subName}>
                                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium truncate block">
                                    {subName}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {isActive ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] font-bold text-[9.5px] uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                      Retrying...
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] font-bold text-[9.5px] uppercase tracking-wider bg-red-100 text-red-800 border border-red-300">
                                      Failed
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 max-w-[220px] truncate" title={errorMessage}>
                                  {isActive ? (
                                    <span className="text-amber-700 font-semibold italic flex items-center gap-1">
                                      Reprocessing signals...
                                    </span>
                                  ) : (
                                    <span className="text-red-600 font-medium">
                                      {errorMessage}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <button
                                    onClick={() => handleRetrySingleArticle(item)}
                                    disabled={retryingFailed}
                                    className="px-2.5 py-1 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1 ml-auto"
                                  >
                                    {isActive && <Loader2 className="h-2.5 w-2.5 animate-spin text-red-600" />}
                                    Retry
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-lg">
              {(() => {
                const modalLogs = logsModalSubmoduleId 
                  ? (articleLogsBySubmodule[logsModalSubmoduleId] || []) 
                  : Object.values(articleLogsBySubmodule).flat();
                
                const currentTabLogs = logsActiveTab === 'completed' 
                  ? modalLogs.filter(l => l.status === 'completed')
                  : logsActiveTab === 'skipped'
                  ? modalLogs.filter(l => l.status === 'skipped')
                  : modalLogs.filter(l => l.status === 'failed' || (l.status === 'retrying' && l.status !== 'completed'));

                if (currentTabLogs.length > 20) {
                  return (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-slate-500">
                        Showing {(logsPage - 1) * 20 + 1} to {Math.min(logsPage * 20, currentTabLogs.length)} of {currentTabLogs.length} {logsActiveTab} logs
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
                          onClick={() => setLogsPage(p => Math.min(Math.ceil(currentTabLogs.length / 20), p + 1))}
                          disabled={logsPage >= Math.ceil(currentTabLogs.length / 20)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded-[4px] disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-slate-500">
                      Total {currentTabLogs.length} {logsActiveTab} logs
                    </span>
                    <button
                      onClick={() => setIsLogsModalOpen(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-[4px] font-bold text-slate-700 text-[11px] transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
