/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  Terminal, 
  History, 
  Settings as SettingsIcon, 
  BarChart3, 
  Cpu, 
  Database,
  Search,
  Activity,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Lock,
  FileText
} from "lucide-react";

import { Customer, PromptTemplate, ActivityLog, SystemSettings, DashboardStats } from "./types";
import DashboardTab from "./components/DashboardTab";
import CustomersTab from "./components/CustomersTab";
import PromptsTab from "./components/PromptsTab";
import LogsTab from "./components/LogsTab";
import SettingsTab from "./components/SettingsTab";

type TabOption = 'dashboard' | 'customers' | 'prompts' | 'logs' | 'settings';

import { supabase } from "./lib/supabase";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabOption>('customers');
  
  // Data State Arrays
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Load state and action spinners
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Synchronize and Load all tables from Supabase
  const loadConsoleData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [
        { data: clients, error: clientsErr },
        { data: icps, error: icpsErr },
        { data: users, error: usersErr }
      ] = await Promise.all([
        supabase.schema('admin').from('clients').select('*'),
        supabase.schema('admin').from('client_icp').select('*'),
        supabase.schema('admin').from('client_users').select('*')
      ]);

      if (clientsErr) throw clientsErr;
      if (icpsErr) throw icpsErr;
      if (usersErr) throw usersErr;

      const mappedCustomers: Customer[] = (clients || []).map((client: any) => {
        const icp = (icps || []).find((i: any) => i.client_id === client.id);
        const isUUID = (str: any) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const matchedUsers = (users || []).filter((u: any) => u.client_id === client.id).map((u: any) => ({
          id: u.id,
          authId: u.auth_id || u.user_id || (isUUID(u.id) ? u.id : undefined),
          firstName: u.first_name || "",
          lastName: u.last_name || "",
          designation: u.designation || "",
          email: u.email || "",
          lastActive: u.last_active || "Never",
          active: u.is_active === undefined ? true : u.is_active
        }));

        const rawFocusProducts = icp?.context_json?.focus_products_services || [];
        const rawCompetitors = icp?.context_json?.competitors || [];
        const rawCoreSectors = icp?.context_json?.core_sectors || [];
        const rawGeographicFocus = icp?.context_json?.geographic_focus || [];
        const rawSectorsToAvoid = icp?.context_json?.sectors_to_avoid || [];
        const rawDesignations = icp?.context_json?.designations || [];

        const toStringList = (val: any): string => {
          if (Array.isArray(val)) return val.join(", ");
          if (typeof val === "string") return val;
          return "";
        };

        const competitorsStr = toStringList(rawCompetitors);
        const focusProductsStr = toStringList(rawFocusProducts);
        const geographiesStr = toStringList(rawGeographicFocus);

        return {
          id: client.id,
          name: client.company_name || "",
          company: client.company_name || "",
          sector: client.industry || "",
          status: (client.status === 'suspended' ? 'suspended' : 'active') as ('active' | 'suspended'),
          email: matchedUsers[0]?.email || `${(client.company_name || "client").toLowerCase().replace(/\s/g, '')}@example.com`,
          joinedDate: client.created_at ? client.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          lastActive: client.last_active || undefined,
          last_active: client.last_active || undefined,
          apiCallsCount: 0,
          promptVariables: {
            competitors: competitorsStr,
            focusProducts: focusProductsStr,
            geographicScope: geographiesStr,
            reportingTone: "strategic" as const
          },
          primaryGeographies: geographiesStr,
          coreSectors: toStringList(rawCoreSectors),
          knownCompetitors: competitorsStr,
          sectorsToAvoid: toStringList(rawSectorsToAvoid),
          dealSizeMin: 50000,
          dealSizeMax: 1000000,
          geographyWeights: (Array.isArray(rawGeographicFocus) ? rawGeographicFocus : []).reduce((acc: any, geo: any) => {
            acc[geo] = 1.0;
            return acc;
          }, {} as Record<string, number>),
          sectorWeights: (Array.isArray(rawCoreSectors) ? rawCoreSectors : []).reduce((acc: any, sec: any) => {
            acc[sec.toLowerCase()] = 1.0;
            return acc;
          }, {} as Record<string, number>),
          targetAccounts: "",
          existingRelationships: "",
          blacklistCompanies: "",
          keyContacts: JSON.stringify(matchedUsers),
          pipelineStatus: "active",
          sectorsToEnter: "",
          designations: toStringList(rawDesignations),
          description: client.client_description || "",
          location: client.location || "",
          enabled_modules: client.enabled_modules ?? [],
          enabledModules: client.enabled_modules ?? [],
          monitoringConfig: {
            enabledModules: Array.isArray(client.enabled_modules)
              ? client.enabled_modules
              : (client.enabled_modules && typeof client.enabled_modules === 'object'
                  ? Object.keys(client.enabled_modules).filter(k => client.enabled_modules[k])
                  : []),
            selectedSignals: {},
            customTasks: [],
            selectedCustomSignals: {}
          }
        };
      });

      setCustomers(mappedCustomers);
      
      // Default to empty for items lacking defined supabase tables in user prompt
      setPrompts([]);
      setLogs([]);
      setStats({
        totalRequests: 0,
        successRate: 100,
        avgLatencyMs: 0,
        totalTokensUsed: 0,
        estimatedCostUsd: 0,
        sectorBreakdown: {},
        requestLogByDay: []
      });
      setSettings({
        geminiModel: "gemini-3.5-flash",
        temperature: 0.7,
        maxTokens: 1548,
        rateLimitEnabled: true,
        maxRequestsPerMin: 60,
        defaultSystemInstruction: "Configured locally for testing SPA.",
        intelligenceTone: "strategic"
      });

    } catch (e: any) {
      console.error("Failed to load Supabase data objects", e);
      setError(e.message || "Failed to load from Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsoleData();
  }, []);

  // Customer state mutation callbacks
  const handleAddCustomer = async (newCustPayload: Omit<Customer, 'id' | 'joinedDate' | 'apiCallsCount'>): Promise<string | undefined> => {
    try {
      const clientPayload = {
        company_name: newCustPayload.company || newCustPayload.name,
        industry: newCustPayload.sector,
        location: newCustPayload.location || "",
        client_description: newCustPayload.description || "",
        enabled_modules: []
      };
      
      const { data: newClientData, error: insertClientError } = await supabase.schema('admin')
        .from("clients")
        .insert([clientPayload])
        .select();

      if (insertClientError) throw insertClientError;

      let newClientId: string | undefined;
      if (newClientData && newClientData[0]) {
        newClientId = newClientData[0].id;
        const toArray = (str: string | undefined) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : [];
        const icpPayload = {
          client_id: newClientId,
          context_json: {
            focus_products_services: toArray(newCustPayload.promptVariables?.focusProducts),
            competitors: toArray(newCustPayload.promptVariables?.competitors || newCustPayload.knownCompetitors),
            core_sectors: toArray(newCustPayload.coreSectors),
            geographic_focus: toArray(newCustPayload.promptVariables?.geographicScope || newCustPayload.primaryGeographies),
            sectors_to_avoid: toArray(newCustPayload.sectorsToAvoid),
            designations: toArray(newCustPayload.designations)
          }
        };
        await supabase.schema('admin').from("client_icp").insert([icpPayload]);
      }
      
      await loadConsoleData(true);
      showToast("Client added successfully!");
      return newClientId;
    } catch (err: any) {
      console.error("Error creating customer", err);
      showToast(err.message || "Error creating client", 'error');
      return undefined;
    }
  };

  const handleUpdateCustomer = async (id: string, updatedPayload: Partial<Customer>) => {
    try {
      // Immediately reflect updates in local state for seamless UI reactivity
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedPayload } : c));

      // Update clients table
      const clientsUpdate: any = {};
      if (updatedPayload.company !== undefined) clientsUpdate.company_name = updatedPayload.company;
      if (updatedPayload.sector !== undefined) clientsUpdate.industry = updatedPayload.sector;
      if (updatedPayload.location !== undefined) clientsUpdate.location = updatedPayload.location;
      if (updatedPayload.description !== undefined) clientsUpdate.client_description = updatedPayload.description;
      if (updatedPayload.status !== undefined) clientsUpdate.status = updatedPayload.status;
      if (updatedPayload.enabled_modules !== undefined) {
        clientsUpdate.enabled_modules = updatedPayload.enabled_modules;
      } else if (updatedPayload.enabledModules !== undefined) {
        clientsUpdate.enabled_modules = updatedPayload.enabledModules;
      } else if (updatedPayload.monitoringConfig?.enabledModules !== undefined) {
        clientsUpdate.enabled_modules = updatedPayload.monitoringConfig.enabledModules;
      }

      if (Object.keys(clientsUpdate).length > 0) {
        await supabase.schema('admin').from("clients").update(clientsUpdate).eq("id", id);
      }

      // Update client_icp table
      const hasIcpUpdate = updatedPayload.promptVariables !== undefined || 
                           updatedPayload.sectorsToAvoid !== undefined || 
                           updatedPayload.designations !== undefined ||
                           updatedPayload.coreSectors !== undefined ||
                           updatedPayload.knownCompetitors !== undefined ||
                           updatedPayload.primaryGeographies !== undefined;
      
      if (hasIcpUpdate) {
        const toArray = (str: any) => {
          if (Array.isArray(str)) return str;
          if (typeof str === "string") return str.split(",").map(s => s.trim()).filter(Boolean);
          return [];
        };

        const { data: icpData } = await supabase.schema('admin').from("client_icp").select("*").eq("client_id", id).limit(1);
        const existingIcp = icpData?.[0];
        const existingContext = existingIcp?.context_json || {};

        const focusList = updatedPayload.promptVariables?.focusProducts !== undefined ? toArray(updatedPayload.promptVariables.focusProducts) : 
                          (existingContext.focus_products_services || []);
        
        const compList = updatedPayload.promptVariables?.competitors !== undefined ? toArray(updatedPayload.promptVariables.competitors) : 
                         (updatedPayload.knownCompetitors !== undefined ? toArray(updatedPayload.knownCompetitors) : (existingContext.competitors || []));

        const geoList = updatedPayload.promptVariables?.geographicScope !== undefined ? toArray(updatedPayload.promptVariables.geographicScope) : 
                        (updatedPayload.primaryGeographies !== undefined ? toArray(updatedPayload.primaryGeographies) : (existingContext.geographic_focus || []));

        const avoidList = updatedPayload.sectorsToAvoid !== undefined ? toArray(updatedPayload.sectorsToAvoid) : (existingContext.sectors_to_avoid || []);
        const designList = updatedPayload.designations !== undefined ? toArray(updatedPayload.designations) : (existingContext.designations || []);
        
        const coreSecList = updatedPayload.coreSectors !== undefined ? toArray(updatedPayload.coreSectors) : (existingContext.core_sectors || []);

        const updatedContext = {
          ...existingContext,
          focus_products_services: focusList,
          competitors: compList,
          core_sectors: coreSecList,
          geographic_focus: geoList,
          sectors_to_avoid: avoidList,
          designations: designList
        };

        if (existingIcp) {
          await supabase.schema('admin').from("client_icp").update({ context_json: updatedContext }).eq("client_id", id);
        } else {
          await supabase.schema('admin').from("client_icp").insert([{ client_id: id, context_json: updatedContext }]);
        }
      }

      // Update client_users table if keyContacts is updated
      if (updatedPayload.keyContacts !== undefined) {
        const parsedContacts = typeof updatedPayload.keyContacts === "string" ? JSON.parse(updatedPayload.keyContacts) : updatedPayload.keyContacts;
        if (Array.isArray(parsedContacts)) {
          const { data: currentDbUsers } = await supabase.schema('admin').from("client_users").select("*").eq("client_id", id);
          const dbUserIds = (currentDbUsers || []).map(u => u.id);

          for (const contact of parsedContacts) {
            const userPayload = {
              client_id: id,
              email: contact.email || "",
              first_name: contact.firstName || "",
              last_name: contact.lastName || "",
              designation: contact.designation || "",
              is_active: contact.active !== false,
              last_active: contact.lastActive === "Never" ? null : contact.lastActive
            };

            if (!contact.id || contact.id.startsWith("u-") || !dbUserIds.includes(contact.id)) {
              await supabase.schema('admin').from("client_users").insert([userPayload]);
            } else {
              await supabase.schema('admin').from("client_users").update(userPayload).eq("id", contact.id);
            }
          }

          const parsedUserIds = parsedContacts.map(c => c.id).filter(Boolean);
          const idsToDelete = dbUserIds.filter(dbId => !parsedUserIds.includes(dbId));
          if (idsToDelete.length > 0) {
            await supabase.schema('admin').from("client_users").delete().in("id", idsToDelete);
          }
        }
      }
      
      loadConsoleData(true).catch(console.error);
      showToast("Changes saved successfully!");
    } catch (err: any) {
      console.error("Error updating customer profile", err);
      showToast(err.message || "Error updating client", 'error');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      // Attempt server endpoint (handles auth user cleanup and cascading admin deletes)
      try {
        await fetch("/api/admin/delete-client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: id, id })
        });
      } catch (srvErr) {
        console.warn("Server delete-client endpoint failed, falling back to direct client deletion:", srvErr);
      }

      // Cleanup child records directly in Supabase
      try {
        const { data: tasks } = await supabase.schema('admin').from("custom_tasks").select("id").eq("client_id", id);
        if (tasks && tasks.length > 0) {
          const taskIds = tasks.map(t => t.id);
          await supabase.schema('admin').from("custom_task_subtasks").delete().in("custom_task_id", taskIds);
          await supabase.schema('admin').from("custom_tasks").delete().eq("client_id", id);
        }
      } catch (e) {
        console.warn("Could not delete custom task records:", e);
      }

      await Promise.allSettled([
        supabase.schema('admin').from("client_icp").delete().eq("client_id", id),
        supabase.schema('admin').from("client_users").delete().eq("client_id", id),
        supabase.schema('admin').from("prompts").delete().eq("client_id", id),
        supabase.schema('admin').from("client_custom_data_sources").delete().eq("client_id", id),
        supabase.from("article_processing_log").delete().eq("client_id", id),
        supabase.from("pipeline_job_status").delete().eq("client_id", id)
      ]);

      const { error: clientDeleteError } = await supabase.schema('admin').from("clients").delete().eq("id", id);
      if (clientDeleteError) {
        throw clientDeleteError;
      }

      // Remove from client state once deletion completes
      setCustomers(prev => prev.filter(c => c.id !== id));
      await loadConsoleData(true);
      showToast("Client deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting customer", err);
      showToast(err.message || "Error deleting client", 'error');
      await loadConsoleData(true);
      throw err;
    }
  };

  // Settings callbacks
  const handleSaveSettings = async (updatedSettingsPayload: SystemSettings) => {
    setSavingSettings(true);
    try {
      // Mocking set since no remote DB table for settings 
      setSettings(updatedSettingsPayload);
      showToast("Settings saved successfully!");
    } catch (err: any) {
      console.error("Error saving global system parameters", err);
      showToast(err.message || "Error saving settings", 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="h-screen bg-[#f9fafb] text-slate-800 flex font-sans selection:bg-indigo-100 selection:text-indigo-950 overflow-hidden">
      
      {/* Global Toast */}
      {toast && (
        <div 
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-[6px] shadow-lg flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* 1. Left Vertical Sidebar (Image 2 format) - static, non-scrolling */}
      <aside className="w-[56px] bg-white border-r border-[#e2e8f0] flex flex-col justify-between items-center py-4 shrink-0 select-none h-full">
        
        {/* Top Logo - KX */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="w-8 h-8 bg-indigo-600 rounded-[6px] flex items-center justify-center text-white font-extrabold text-[12px] tracking-tight select-none">
            KX
          </div>
          
          {/* Menu items stack with active triggers and dummy icons */}
          <nav className="flex flex-col items-center gap-1 w-full px-1">
            
            {/* Tab 1: Clients Scoring Profiles */}
            <button
              onClick={() => setActiveTab('customers')}
              id="tab-customers"
              title="Clients"
              className={`w-8 h-8 flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'customers'
                  ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-gray-50'
              }`}
              style={{ borderRadius: "4px" }}
            >
              <FileText className="h-3.5 w-3.5" />
              <div className="absolute left-[48px] bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                Clients
              </div>
            </button>

            {/* Tab 2: Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              id="tab-dashboard"
              title="Telemetry Dashboard"
              className={`w-8 h-8 flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-gray-50'
              }`}
              style={{ borderRadius: "4px" }}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <div className="absolute left-[48px] bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                Telemetry Dashboard
              </div>
            </button>

            {/* Tab 3: History */}
            <button
              onClick={() => setActiveTab('logs')}
              id="tab-logs"
              title="Audit Logs"
              className={`w-8 h-8 flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'logs'
                  ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-gray-50'
              }`}
              style={{ borderRadius: "4px" }}
            >
              <History className="h-3.5 w-3.5" />
              <div className="absolute left-[48px] bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                Audit Logs
              </div>
            </button>

            {/* Tab 4: Prompts sandbox */}
            <button
              onClick={() => setActiveTab('prompts')}
              id="tab-prompts"
              title="Prompts Sandbox"
              className={`w-8 h-8 flex items-center justify-center transition-all cursor-pointer relative group ${
                activeTab === 'prompts'
                  ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-gray-50'
              }`}
              style={{ borderRadius: "4px" }}
            >
              <Terminal className="h-3.5 w-3.5" />
              <div className="absolute left-[48px] bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                Prompts Sandbox
              </div>
            </button>

            {/* DUMMY ICON 1: Notification bells */}
            <div className="w-8 h-8 flex items-center justify-center text-slate-400 relative group">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>

            {/* DUMMY ICON 2: Telephone */}
            <div className="w-8 h-8 flex items-center justify-center text-slate-400 relative group">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>

            {/* DUMMY ICON 3: Calendar */}
            <div className="w-8 h-8 flex items-center justify-center text-slate-400 relative group">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            {/* DUMMY ICON 4: Mail Envelope */}
            <div className="w-8 h-8 flex items-center justify-center text-slate-400 relative group">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            {/* DUMMY ICON 5: Box/Archive */}
            <div className="w-8 h-8 flex items-center justify-center text-slate-400 relative group">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>

          </nav>
        </div>

        {/* Bottom Gear - Settings (triggers Tab 5 Settings & Security) */}
        <div className="w-full px-1">
          <button
            onClick={() => setActiveTab('settings')}
            id="tab-settings"
            title="Console Settings"
            className={`w-8 h-8 mx-auto flex items-center justify-center transition-all cursor-pointer relative group ${
              activeTab === 'settings'
                ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-850 hover:bg-gray-50'
            }`}
            style={{ borderRadius: "4px" }}
          >
            <SettingsIcon className="h-3.5 w-3.5 animate-hover:spin" />
            <div className="absolute left-[48px] bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
              Console Settings & API
            </div>
          </button>
        </div>

      </aside>

      {/* 2. Main content container area (occupies the rest of the window) - static header & footer layout */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Bar styled to match design image - with Selectable Text option and Meridian text removed */}
        <header className="h-[64px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            {/* Dynamic titles - Selectable & Header format requested */}
            <div className="flex items-baseline">
              {activeTab === 'customers' && (
                <span className="text-[17px] font-bold text-gray-900 select-text outline-hidden" style={{ userSelect: "text" }}>
                  Clients
                </span>
              )}
              {activeTab === 'dashboard' && (
                <span className="text-[17px] font-bold text-gray-900 select-text outline-hidden" style={{ userSelect: "text" }}>
                  Dashboard
                </span>
              )}
              {activeTab === 'logs' && (
                <span className="text-[17px] font-bold text-gray-900 select-text outline-hidden" style={{ userSelect: "text" }}>
                  Logs
                </span>
              )}
              {activeTab === 'prompts' && (
                <span className="text-[17px] font-bold text-gray-900 select-text outline-hidden" style={{ userSelect: "text" }}>
                  Prompts Sandbox
                </span>
              )}
              {activeTab === 'settings' && (
                <span className="text-[17px] font-bold text-gray-900 select-text outline-hidden" style={{ userSelect: "text" }}>
                  Settings
                </span>
              )}
            </div>
          </div>

          {/* Far Right buttons (rendered conditionally based on activeTab) */}
          <div className="flex items-center gap-2">
            {activeTab === 'customers' && (
              <>
                <button
                  onClick={() => {
                    // Dispatch custom event to trigger onboarding modal inside CustomersTab
                    window.dispatchEvent(new CustomEvent("open-onboard-modal"));
                  }}
                  id="btn-onboard"
                  className="flex items-center gap-1.5 bg-[#4f46e5] hover:bg-[#4338ca] active:bg-[#3730a3] active:scale-[0.98] text-white text-[11px] font-semibold px-3 py-1.5 transition-all cursor-pointer shadow-xs"
                  style={{ borderRadius: "5px" }}
                >
                  {/* Plus person icon */}
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  <span>Onboard Client</span>
                </button>
                
                <button 
                  className="flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 h-8 w-8 cursor-pointer transition-colors"
                  style={{ borderRadius: "5px" }}
                  title="Help & docs"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Dynamic Inner Tab Router Frame - scrollable overflow context */}
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 mx-6 my-6 bg-white border border-gray-100" style={{ borderRadius: "6px" }}>
              <Activity className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-sm font-semibold text-gray-700 font-sans">Bootstrapping Back-end Admin Console...</p>
              <p className="text-xs text-gray-400 mt-1 font-sans">Connecting to live Node Express server database configurations</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-200">
              
              {error && (
                <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    <span className="font-medium">Database Connection Error:</span> {error}
                  </div>
                  <button onClick={() => loadConsoleData()} className="text-sm underline hover:text-red-900 border border-red-200 px-3 py-1 rounded bg-white">
                    Retry
                  </button>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <DashboardTab 
                  stats={stats} 
                  onRefresh={loadConsoleData} 
                  loading={loading} 
                />
              )}

              {activeTab === 'customers' && (
                <CustomersTab
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  showToast={showToast}
                />
              )}

              {activeTab === 'prompts' && (
                <PromptsTab
                  prompts={prompts}
                  customers={customers}
                  showToast={showToast}
                />
              )}

              {activeTab === 'logs' && (
                <LogsTab 
                  logs={logs} 
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  saving={savingSettings}
                  showToast={showToast}
                />
              )}

            </div>
          )}
        </div>

      </main>
    </div>
  );
}
