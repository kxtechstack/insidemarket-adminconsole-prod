/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Plus, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  Trash2,
  X,
  FileText,
  Settings,
  ArrowLeft,
  Edit,
  Key,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  Play,
  Plug,
  Pause,
  RotateCcw,
  Users
} from "lucide-react";
import { Customer, CustomTask } from "../types";
import { supabase } from "../lib/supabase";
import { useIntelligenceModules } from "../data/intelligenceModules";
import { COLLECTION_PROMPTS } from "../data/prompts";
import { 
  CustomerList, 
  OnboardModal, 
  AddCustomTaskModal, 
  BasicInfoTab, 
  MonitoringScopeTab, 
  DataCollectionTab, 
  IntelligenceRulesTab,
  CustomDataSourcesTab
} from "./customers";

interface CustomersTabProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'joinedDate' | 'apiCallsCount'>) => Promise<void>;
  onUpdateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
}

export default function CustomersTab({ 
  customers, 
  onAddCustomer, 
  onUpdateCustomer, 
  onDeleteCustomer 
}: CustomersTabProps) {
  
  const { modules: INTELLIGENCE_MODULES } = useIntelligenceModules();

  // Selected client for scoring configuration (modal/drawer state)
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [detailClientId, setDetailClientId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [activeDetailTab, setActiveDetailTab] = useState<'basic' | 'scope' | 'collection' | 'rules' | 'datasources'>('basic');

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Form states matching scoring profile fields
  const [primaryGeographies, setPrimaryGeographies] = useState("");
  const [coreSectors, setCoreSectors] = useState("");
  const [focusProducts, setFocusProducts] = useState("");
  const [sectorsToAvoid, setSectorsToAvoid] = useState("");
  const [knownCompetitors, setKnownCompetitors] = useState("");
  const [dealSizeMin, setDealSizeMin] = useState(50000);
  const [dealSizeMax, setDealSizeMax] = useState(50000);

  // Dynamic slider weights
  const [geoWeights, setGeoWeights] = useState<Record<string, number>>({});
  const [sectorWeights, setSectorWeights] = useState<Record<string, number>>({});

  // Tier 3 parameters 
  const [targetAccounts, setTargetAccounts] = useState("");
  const [existingRelationships, setExistingRelationships] = useState("");
  const [blacklistCompanies, setBlacklistCompanies] = useState("");
  const [keyContacts, setKeyContacts] = useState("");
  const [pipelineStatus, setPipelineStatus] = useState("");
  const [sectorsToEnter, setSectorsToEnter] = useState("");
  const [designations, setDesignations] = useState("");

  // Basic client identity states (to map to the form inputs)
  const [editCompany, setEditCompany] = useState("");
  const [editSector, setEditSector] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [description, setDescription] = useState("");

  // Monitoring Scope states
  const [activeModuleId, setActiveModuleId] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([]));
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});
  const [selectedSignals, setSelectedSignals] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (INTELLIGENCE_MODULES && INTELLIGENCE_MODULES.length > 0) {
      if (!activeModuleId || (activeModuleId !== 'custom_tasks' && !INTELLIGENCE_MODULES.find(m => m.id === activeModuleId))) {
        setActiveModuleId(INTELLIGENCE_MODULES[0].id);
        if (INTELLIGENCE_MODULES[0].categories && INTELLIGENCE_MODULES[0].categories.length > 0) {
           setExpandedCategories(new Set([INTELLIGENCE_MODULES[0].categories[0].id]));
        }
      }
    }
  }, [INTELLIGENCE_MODULES, activeModuleId]);

  // Custom Tasks states
  const [customTasks, setCustomTasks] = useState<Record<string, CustomTask[]>>({});
  const [selectedCustomSignals, setSelectedCustomSignals] = useState<Record<string, string[]>>({});
  const [showAddCustomTaskModal, setShowAddCustomTaskModal] = useState(false);
  const [newCustomTaskName, setNewCustomTaskName] = useState("");
  const [newCustomSubTasks, setNewCustomSubTasks] = useState<string[]>([""]);
  const [newCustomTaskScope, setNewCustomTaskScope] = useState<"shared" | "private">("private");
  const [newCustomSignalType, setNewCustomSignalType] = useState("tender_rfp");
  const [newCustomPrimarySource, setNewCustomPrimarySource] = useState("exa");
  const [newCustomSearchPrompt, setNewCustomSearchPrompt] = useState("Government or corporate RFPs for {{tender_scope}} in {{geography}}. Return full document content. Timeframe: {{timeframe}}.");
  const [newCustomModel, setNewCustomModel] = useState("sonar-pro");
  const [newCustomMaxResults, setNewCustomMaxResults] = useState("20");
  const [newCustomMinScore, setNewCustomMinScore] = useState("");
  const [newCustomFrequency, setNewCustomFrequency] = useState("Daily");
  const [newCustomRunTime, setNewCustomRunTime] = useState("02:00");
  const [newCustomActive, setNewCustomActive] = useState(true);

  // Collection prompt interactive custom state management
  const [customPrompts, setCustomPrompts] = useState<Record<string, Record<string, { content: string; lastEdited: string }>>>({});
  const [editingModuleIdState, setEditingModuleIdState] = useState<string | null>(null);
  const [editPromptValue, setEditPromptValue] = useState<string>("");
  const [confirmDeleteModuleId, setConfirmDeleteModuleId] = useState<string | null>(null);
  const [confirmDeleteCustomTaskId, setConfirmDeleteCustomTaskId] = useState<string | null>(null);
  const [showHistoryModuleId, setShowHistoryModuleId] = useState<string | null>(null);
  const [moduleSchedules, setModuleSchedules] = useState<Record<string, Record<string, { frequency: string; time: string; lastRun: string; tool: string }>>>({});
  const [tempSchedule, setTempSchedule] = useState<{ tool: string; frequency: string; time: string } | null>(null);
  const [pausedModules, setPausedModules] = useState<Record<string, Record<string, boolean>>>({});
  const [runningModuleId, setRunningModuleId] = useState<string | null>(null);
  const [moduleLastRan, setModuleLastRan] = useState<Record<string, Record<string, string>>>({});

  // Access Details table state
  const [accessUsers, setAccessUsers] = useState<any[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  
  // Row inline editing input states
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLastActive, setEditLastActive] = useState("");
  
  // Notice for copy/reset
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [resetNoticeEmail, setResetNoticeEmail] = useState<string | null>(null);

  // Target customer payload for new customer onboarding
  const [newCustName, setNewCustName] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustSector, setNewCustSector] = useState("Market Research");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustDescription, setNewCustDescription] = useState("");
  const [newCustCoreProducts, setNewCustCoreProducts] = useState("");
  const [newCustCompetitors, setNewCustCompetitors] = useState("");
  const [newCustCoreSectors, setNewCustCoreSectors] = useState("");
  const [newCustGeographies, setNewCustGeographies] = useState("");
  const [newCustSectorsToAvoid, setNewCustSectorsToAvoid] = useState("");
  const [newCustDesignations, setNewCustDesignations] = useState("");
  const [newCustLocation, setNewCustLocation] = useState("");

  // Helper to obtain client design statistics dynamically loaded from Supabase PostgreSQL database
  const getClientMeta = (c: Customer) => {
    let userCount = 0;
    try {
      if (c.keyContacts) {
        const parsed = JSON.parse(c.keyContacts);
        if (Array.isArray(parsed)) {
          userCount = parsed.length;
        }
      }
    } catch (e) {
      // fallback
    }

    // Stable calculation fallback for subscriptions and lastActive based on real metadata
    const charSum = (c.company || "").split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const subscriptions = (charSum % 3) + 1;
    const lastActive = c.joinedDate ? `${c.joinedDate} 09:00` : "2026-06-03 10:19";
    const location = c.location || "London, UK";

    return { 
      users: userCount, 
      subscriptions, 
      lastActive, 
      location 
    };
  };

  // Select the initial customer when customers load
  useEffect(() => {
    if (customers.length > 0 && !selectedClientId) {
      const defaultClient = customers.find(c => c.company.includes("Research")) || customers[0];
      setSelectedClientId(defaultClient.id);
    }
  }, [customers, selectedClientId]);

  // Load customer attributes into state when selection changes
  useEffect(() => {
    if (!selectedClientId) return;
    const client = customers.find(c => c.id === selectedClientId);
    if (client) {
      setPrimaryGeographies(client.promptVariables?.geographicScope || client.primaryGeographies || "IN, SG, MY");
      setFocusProducts(client.promptVariables?.focusProducts || "market research, consulting, fintech, logistics");
      setCoreSectors(client.coreSectors || "market research, consulting, fintech, logistics");
      setSectorsToAvoid(client.sectorsToAvoid || "aerospace, defence");
      setKnownCompetitors(client.promptVariables?.competitors || client.knownCompetitors || "Frost & Sullivan, IDC, Gartner");
      setDealSizeMin(client.dealSizeMin ?? 50000);
      setDealSizeMax(client.dealSizeMax ?? 500000);
      
      setTargetAccounts(client.targetAccounts || "Zetwerk, NovaPay, Delhivery");
      setExistingRelationships(client.existingRelationships || "");
      setBlacklistCompanies(client.blacklistCompanies || "Competitor clients, conflicted companies");
      setKeyContacts(client.keyContacts || "");
      setPipelineStatus(client.pipelineStatus || "available — normal scoring");
      setSectorsToEnter(client.sectorsToEnter || "");
      setDesignations(client.designations || "");

      setEditCompany(client.company || "");
      setEditSector(client.sector || "");
      setEditLocation(client.location || getClientMeta(client).location || "");
      setDescription(client.description || "");

      // Initialize based on database values immediately
      const syncMonitoringState = async () => {
        const { data: dbClientSignals } = await supabase.schema('admin')
          .from('client_signals')
          .select('signal_id, signals(submodule_id)')
          .eq('client_id', selectedClientId);
        
        // Cache next signals to ensure we only apply fallback if db is truly empty
        let nextSelectedSignals: Record<string, string[]> = {};
        if (dbClientSignals && dbClientSignals.length > 0) {
          dbClientSignals.forEach((cs: any) => {
            const sig = cs.signals;
            if (sig && sig.submodule_id) {
              if (!nextSelectedSignals[sig.submodule_id]) nextSelectedSignals[sig.submodule_id] = [];
              nextSelectedSignals[sig.submodule_id].push(cs.signal_id);
            }
          });
          setSelectedSignals(nextSelectedSignals);
        }

        const { data: dbCustomTasks } = await supabase.schema('admin')
          .from('custom_tasks')
          .select('*, custom_task_subtasks(*)')
          .eq('client_id', selectedClientId);
        
        let loadedCustomTasks = false;
        if (dbCustomTasks && dbCustomTasks.length > 0) {
          loadedCustomTasks = true;
          const parsedCustomTasks = dbCustomTasks.map((task: any) => ({
            id: task.id,
            name: task.name,
            subTasks: task.custom_task_subtasks || []
          }));
          
          setCustomTasks(prev => ({
            ...prev,
            [selectedClientId]: parsedCustomTasks
          }));

          const initialCustomSignals: Record<string, string[]> = {};
          dbCustomTasks.forEach((task: any) => {
            const selectedIds = (task.custom_task_subtasks || [])
              .filter((st: any) => st.is_selected)
              .map((st: any) => st.id);
            if (selectedIds.length > 0) {
              initialCustomSignals[task.id] = selectedIds;
            }
          });
          setSelectedCustomSignals(initialCustomSignals);
        }

        // Apply fallback logic only after async checks
        const mConfig = client.monitoringConfig || { enabledModules: ["md", "fo", "cr"], selectedSignals: {} };
        const enabledMap: Record<string, boolean> = {};
        (mConfig.enabledModules || []).forEach(id => enabledMap[id] = true);
        if (enabledMap['custom_tasks'] === undefined) {
          enabledMap['custom_tasks'] = true;
        }
        setEnabledModules(enabledMap);
        
        // If no signals in db, use config signals
        if (Object.keys(nextSelectedSignals).length === 0) {
          setSelectedSignals(mConfig.selectedSignals || {});
        }

        // If no custom tasks in db, use config tasks
        if (!loadedCustomTasks) {
          const defaultTasks = [
            {
              id: "ct-1",
              name: "Milestone Compliance & Local Licenses",
              subTasks: [
                "Review regulatory filing calendars",
                "Validate pollution control board consent NOCs",
                "Confirm municipal trade license renewals"
              ]
            },
            {
              id: "ct-2",
              name: "Ad-hoc Expansion Readiness Check",
              subTasks: [
                "Track corporate real estate lease sign-offs",
                "Inspect local workforce search activity",
                "Monitor regional warehouse infrastructure logs"
              ]
            }
          ];
          const savedTasks = mConfig.customTasks || defaultTasks;
          setCustomTasks(prev => ({
            ...prev,
            [client.id]: savedTasks
          }));
          const defaultCustomSignalsSelected = {
            "ct-1": ["Review regulatory filing calendars", "Validate pollution control board consent NOCs", "Confirm municipal trade license renewals"],
            "ct-2": ["Track corporate real estate lease sign-offs", "Inspect local workforce search activity", "Monitor regional warehouse infrastructure logs"]
          };
          setSelectedCustomSignals(mConfig.selectedCustomSignals || defaultCustomSignalsSelected);
        }
      };

      syncMonitoringState();

      setActiveModuleId(INTELLIGENCE_MODULES.length > 0 ? INTELLIGENCE_MODULES[0].id : "");
      setExpandedCategories(new Set(INTELLIGENCE_MODULES.length > 0 && INTELLIGENCE_MODULES[0].categories.length > 0 ? [INTELLIGENCE_MODULES[0].categories[0].id] : []));
      
      const initGeoWeights = client.geographyWeights || { IN: 1.0, SG: 0.8, MY: 0.7 };
      const initSectorWeights = client.sectorWeights || { "market research": 0.9, consulting: 0.85, fintech: 0.8, logistics: 0.75 };
      setGeoWeights(initGeoWeights);
      setSectorWeights(initSectorWeights);

      // Load keyContacts JSON or set defaults
      let rawContacts = client.keyContacts || "";
      let parsed: any[] = [];
      let isInitialized = false;
      try {
        if (rawContacts && rawContacts.startsWith("[")) {
          parsed = JSON.parse(rawContacts);
          isInitialized = true;
        }
      } catch (e) {
        console.error("Failed to parse keyContacts json", e);
      }

      if (!isInitialized && parsed.length === 0) {
        if (client.id === 'cust-5' || client.company.includes("Research")) {
          parsed = [
            { id: "u-1", firstName: "Sarah", lastName: "Jenkins", designation: "Senior Analyst", email: "s.jenkins@researchinsights.co", lastActive: "2026-06-03 10:15", active: true },
            { id: "u-2", firstName: "David", lastName: "Vance", designation: "Research Director", email: "d.vance@researchinsights.co", lastActive: "2026-06-02 16:40", active: true },
            { id: "u-3", firstName: "Priya", lastName: "Patel", designation: "Operations Lead", email: "p.patel@researchinsights.co", lastActive: "2026-06-03 11:02", active: true }
          ];
        } else if (client.id === 'cust-1' || client.company.includes("Atherton")) {
          parsed = [
            { id: "u-1", firstName: "John", lastName: "Doe", designation: "Operations Manager", email: "j.doe@atherton.com", lastActive: "2026-06-02 18:15", active: true },
            { id: "u-2", firstName: "Robert", lastName: "Chen", designation: "Technical Lead", email: "r.chen@atherton.com", lastActive: "2026-06-01 09:30", active: false }
          ];
        } else if (client.id === 'cust-2' || client.company.includes("BioSphere")) {
          parsed = [
            { id: "u-1", firstName: "Alan", lastName: "Turing", designation: "Bioinformatics Scientist", email: "a.turing@biosphere.io", lastActive: "2026-06-01 11:20", active: true },
            { id: "u-2", firstName: "Clara", lastName: "Oswald", designation: "Research Engineer", email: "c.oswald@biosphere.io", lastActive: "2026-05-30 14:15", active: true }
          ];
        } else if (client.id === 'cust-3' || client.company.includes("Vantage")) {
          parsed = [
            { id: "u-1", firstName: "Marcus", lastName: "Aurelius", designation: "Quantitative Analyst", email: "m.aurelius@vantagequant.com", lastActive: "2026-06-03 05:30", active: true },
            { id: "u-2", firstName: "Seneca", lastName: "Miller", designation: "Portfolio Manager", email: "s.miller@vantagequant.com", lastActive: "2026-06-02 15:45", active: true }
          ];
        } else if (client.id === 'cust-4' || client.company.includes("Aether Grid") || client.company.includes("Renewables")) {
          parsed = [
            { id: "u-1", firstName: "Nikola", lastName: "Tesla", designation: "Power Grid Specialist", email: "n.tesla@aethergrid.net", lastActive: "2026-05-28 14:02", active: false }
          ];
        } else {
          parsed = [];
        }
      }
      setAccessUsers(parsed);
      setEditingRowId(null);
    }
  }, [selectedClientId, customers]);

  // Parse list values to construct sliders
  const parsedGeos = primaryGeographies
    ? primaryGeographies.split(",").map(g => g.trim()).filter(Boolean)
    : [];

  const parsedSectors = coreSectors
    ? coreSectors.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    setGeoWeights(prev => {
      const next = { ...prev };
      parsedGeos.forEach(g => {
        if (next[g] === undefined) next[g] = 0.8;
      });
      return next;
    });
  }, [primaryGeographies]);

  useEffect(() => {
    setSectorWeights(prev => {
      const next = { ...prev };
      parsedSectors.forEach(s => {
        if (next[s] === undefined) next[s] = 0.8;
      });
      return next;
    });
  }, [coreSectors]);

  const calculateCompleteness = () => {
    let score = 0;
    let total = 6;
    if (primaryGeographies.trim()) score++;
    if (coreSectors.trim()) score++;
    if (sectorsToAvoid.trim()) score++;
    if (knownCompetitors.trim()) score++;
    if (dealSizeMin > 0) score++;
    if (dealSizeMax > dealSizeMin) score++;
    
    return Math.round((score / total) * 100);
  };

  const completeness = calculateCompleteness();

  const handleSaveProfile = async () => {
    if (!selectedClientId) return;
    
    const client = customers.find(c => c.id === selectedClientId);
    if (!client) return;

    const payload: Partial<Customer> = {
      company: editCompany,
      sector: editSector,
      location: editLocation,
      description: description,
      promptVariables: {
        ...client.promptVariables,
        geographicScope: primaryGeographies,
        focusProducts: focusProducts,
        competitors: knownCompetitors,
      },
      coreSectors,
      sectorsToAvoid,
      dealSizeMin,
      dealSizeMax,
      geographyWeights: geoWeights,
      sectorWeights,
      targetAccounts,
      existingRelationships,
      blacklistCompanies,
      keyContacts: JSON.stringify(accessUsers),
      pipelineStatus,
      sectorsToEnter,
      designations,
      monitoringConfig: {
        enabledModules: Object.keys(enabledModules).filter(id => enabledModules[id]),
        selectedSignals,
        customTasks: customTasks[selectedClientId] || [],
        selectedCustomSignals: selectedCustomSignals
      }
    };

    await onUpdateCustomer(selectedClientId, payload);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedClientId) return;

    // Get all selected signal IDs from selectedSignals state
    // Delete all existing client_signals for this client first
    await supabase.schema('admin')
      .from('client_signals')
      .delete()
      .eq('client_id', selectedClientId);
    
    // Then insert all currently selected signals
    const allSelectedSignalIds = Object.values(selectedSignals).flat();
    if (allSelectedSignalIds.length > 0) {
      await supabase.schema('admin')
        .from('client_signals')
        .insert(allSelectedSignalIds.map(signalId => ({
          client_id: selectedClientId,
          signal_id: signalId
        })));
    }

    // Persist custom tasks selection state
    const currentClientCustomTasks = customTasks[selectedClientId] || [];
    for (const task of currentClientCustomTasks) {
      for (const sub of task.subTasks) {
        if (sub.id) {
          const isSelected = selectedCustomSignals[task.id]?.includes(sub.id) || false;
          await supabase.schema('admin').from('custom_task_subtasks')
            .update({ is_selected: isSelected })
            .eq('id', sub.id);
        }
      }
    }

    // Call the original profile save mechanism logic to preserve other data updates
    await handleSaveProfile();
  };

  const handleStartEditRow = (u: any) => {
    setEditingRowId(u.id);
    setEditFirstName(u.firstName);
    setEditLastName(u.lastName);
    setEditDesignation(u.designation);
    setEditEmail(u.email);
    setEditLastActive(u.lastActive);
  };

  const handleCancelEditRow = () => {
    if (editingRowId) {
      const user = accessUsers.find(u => u.id === editingRowId);
      if (user && (!user.firstName || !user.firstName.trim()) && (!user.lastName || !user.lastName.trim())) {
        setAccessUsers(accessUsers.filter(u => u.id !== editingRowId));
      }
    }
    setEditingRowId(null);
  };

  const handleSaveEditRow = async (id: string) => {
    if (!editFirstName.trim() || !editLastName.trim()) return;

    const userToSave = accessUsers.find(u => u.id === id);
    if (!userToSave) return;

    // Handle new user invite via API
    if (userToSave.isNew) {
      setIsSavingRow(true);
      setRowError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/invite-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: editEmail, 
            clientId: selectedClientId, 
            firstName: editFirstName, 
            lastName: editLastName, 
            designation: editDesignation 
          })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to send invite: ${res.statusText}`);
        }
      } catch (err: any) {
        setRowError(err.message);
        setIsSavingRow(false);
        return; // Keep in edit mode so user can fix or try again
      }
      setIsSavingRow(false);
    }

    const updated = accessUsers.map(u => {
      if (u.id === id) {
        // Strip isNew flag upon successful save/invite
        const { isNew, ...rest } = u;
        return {
          ...rest,
          firstName: editFirstName,
          lastName: editLastName,
          designation: editDesignation,
          email: editEmail,
          lastActive: editLastActive === "Never" ? "Never" : editLastActive
        };
      }
      return u;
    });
    setAccessUsers(updated);
    setEditingRowId(null);
    setRowError(null);
    
    const client = customers.find(c => c.id === selectedClientId);
    if (client) {
      onUpdateCustomer(selectedClientId, {
        keyContacts: JSON.stringify(updated)
      });
    }
  };

  const handleToggleUserActive = (id: string) => {
    const updated = accessUsers.map(u => {
      if (u.id === id) {
        return { ...u, active: !u.active };
      }
      return u;
    });
    setAccessUsers(updated);
    
    const client = customers.find(c => c.id === selectedClientId);
    if (client) {
      onUpdateCustomer(selectedClientId, {
        keyContacts: JSON.stringify(updated)
      });
    }
  };

  const handleDeleteUser = (id: string) => {
    const updated = accessUsers.filter(u => u.id !== id);
    setAccessUsers(updated);
    
    const client = customers.find(c => c.id === selectedClientId);
    if (client) {
      onUpdateCustomer(selectedClientId, {
        keyContacts: JSON.stringify(updated)
      });
    }
  };

  const handlePasswordReset = (email: string) => {
    setResetNotice(`Password reset link sent to ${email}`);
    setResetNoticeEmail(email);
    setTimeout(() => {
      setResetNotice(null);
      setResetNoticeEmail(null);
    }, 2500);
  };

  const handleAddAccessUser = () => {
    const newId = `u-${Date.now()}`;
    const newUser = {
      id: newId,
      firstName: "",
      lastName: "",
      designation: "",
      email: "",
      lastActive: "Never",
      active: true,
      isNew: true
    };
    const updated = [...accessUsers, newUser];
    setAccessUsers(updated);
    setEditingRowId(newId);
    setEditFirstName("");
    setEditLastName("");
    setEditDesignation("");
    setEditEmail("");
    setEditLastActive("Never");
    setRowError(null);
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustCompany) return;

    const payload = {
      name: newCustName || newCustCompany || "New Client",
      company: newCustCompany,
      sector: newCustSector,
      location: newCustLocation || "London, UK",
      status: 'active' as const,
      email: `${newCustCompany.toLowerCase().replace(/\s/g, '')}@example.com`,
      description: newCustDescription,
      promptVariables: {
        competitors: newCustCompetitors,
        focusProducts: newCustCoreProducts,
        geographicScope: newCustGeographies,
        reportingTone: 'strategic' as const
      },
      sectorsToAvoid: newCustSectorsToAvoid,
      dealSizeMin: 50000,
      dealSizeMax: 1000000,
      geographyWeights: { [newCustGeographies.split(',')[0] || "Global"]: 1.0 },
      sectorWeights: { [newCustCoreSectors.toLowerCase() || "market research"]: 1.0 },
      targetAccounts: "",
      existingRelationships: "",
      blacklistCompanies: "",
      keyContacts: "[]",
      pipelineStatus: "active",
      sectorsToEnter: "",
      designations: newCustDesignations,
      coreSectors: newCustCoreSectors
    };

    await onAddCustomer(payload);
    setShowAddModal(false);
    setNewCustName("");
    setNewCustCompany("");
    setNewCustDescription("");
    setNewCustCoreProducts("");
    setNewCustCompetitors("");
    setNewCustCoreSectors("");
    setNewCustGeographies("");
    setNewCustSectorsToAvoid("");
    setNewCustDesignations("");
    setNewCustLocation("");
    
    // Select the new client and view its details automatically
    setTimeout(() => {
      const newlyAdded = customers[customers.length - 1];
      if (newlyAdded) {
        setSelectedClientId(newlyAdded.id);
        setDetailClientId(newlyAdded.id);
      }
    }, 500);
  };

  useEffect(() => {
    const handleOpenOnboard = () => {
      setShowAddModal(true);
    };
    window.addEventListener("open-onboard-modal", handleOpenOnboard);
    return () => {
      window.removeEventListener("open-onboard-modal", handleOpenOnboard);
    };
  }, []);

  const activeClientInModal = customers.find(c => c.id === selectedClientId);

  // Filter clients based on search query
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      c.company.toLowerCase().includes(query) ||
      c.sector.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query)
    );
  });

  // Calculate pagination values
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col min-h-full font-sans">
      <div className="p-6 space-y-4 flex-1">
        {detailClientId && activeClientInModal ? (
          <>
          {/* Client Details Page replacing the table */}
          <div className="bg-white border border-[#e2e8f0] p-3 flex flex-col" style={{ borderRadius: "6px" }}>
          
          {/* Header section with back navigation and Client name */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#e2e8f0] pb-3 mb-4 gap-2 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDetailClientId(null)}
                className="inline-flex items-center justify-center p-2 text-slate-600 hover:text-[#0066cc] hover:bg-slate-55 border border-[#e2e8f0] transition-all rounded-[6px] cursor-pointer"
                title="Back to Clients"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-[16px] font-bold text-[#1e293b] tracking-tight">{activeClientInModal.company}</h2>
                <p className="text-[11px] text-slate-700 font-medium mt-0.5">{activeClientInModal.sector} • {getClientMeta(activeClientInModal).location}</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-700 font-medium">
              Enterprise monitoring configuration profile
            </span>
          </div>

          {/* Clean tabs selection conforming precisely to description and image format */}
          <div className="border-[#e2e8f0] border-b mb-4">
            <div className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-none">
              {[
                { id: "basic", label: "Basic Information" },
                { id: "scope", label: "Monitoring Scope" },
                { id: "collection", label: "Data Collection" },
                { id: "rules", label: "Intelligence Rules" },
                { id: "datasources", label: "Custom Data Sources" }
              ].map((tab) => {
                const isActive = activeDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`pb-2 text-[13px] font-medium transition-all relative cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? "text-black font-semibold" 
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wrapper for scrollable tabs content - flex-1 to fill */}
          <div className="flex-1 overflow-y-auto py-0">
            {activeDetailTab === 'basic' && (() => {
              const selectedClient = customers.find(c => c.id === selectedClientId);
              console.log("Selected Client details arriving from Supabase:", {
                focus_products_services: selectedClient?.promptVariables?.focusProducts,
                core_sectors: selectedClient?.coreSectors
              });
              return (
                <BasicInfoTab
                  editCompany={editCompany}
                  setEditCompany={setEditCompany}
                  editSector={editSector}
                  setEditSector={setEditSector}
                  editLocation={editLocation}
                  setEditLocation={setEditLocation}
                  description={description}
                  setDescription={setDescription}
                  coreSectors={coreSectors}
                  setCoreSectors={setCoreSectors}
                  focusProducts={focusProducts}
                  setFocusProducts={setFocusProducts}
                  knownCompetitors={knownCompetitors}
                  setKnownCompetitors={setKnownCompetitors}
                  primaryGeographies={primaryGeographies}
                  setPrimaryGeographies={setPrimaryGeographies}
                  sectorsToAvoid={sectorsToAvoid}
                  setSectorsToAvoid={setSectorsToAvoid}
                  designations={designations}
                  setDesignations={setDesignations}
                  accessUsers={accessUsers}
                  handleAddAccessUser={handleAddAccessUser}
                  resetNotice={resetNotice}
                  setResetNotice={setResetNotice}
                  editingRowId={editingRowId}
                  isSavingRow={isSavingRow}
                  rowError={rowError}
                  editFirstName={editFirstName}
                  setEditFirstName={setEditFirstName}
                  editLastName={editLastName}
                  setEditLastName={setEditLastName}
                  editDesignation={editDesignation}
                  setEditDesignation={setEditDesignation}
                  editEmail={editEmail}
                  setEditEmail={setEditEmail}
                  handleToggleUserActive={handleToggleUserActive}
                  handleSaveEditRow={handleSaveEditRow}
                  handleCancelEditRow={handleCancelEditRow}
                  handleStartEditRow={handleStartEditRow}
                  handlePasswordReset={handlePasswordReset}
                  handleDeleteUser={handleDeleteUser}
                />
              );
            })()}
            {activeDetailTab === 'scope' && (
              <MonitoringScopeTab 
                selectedClientId={selectedClientId}
                activeModuleId={activeModuleId}
                setActiveModuleId={setActiveModuleId}
                enabledModules={enabledModules}
                setEnabledModules={setEnabledModules}
                customTasks={customTasks}
                selectedCustomSignals={selectedCustomSignals}
                selectedSignals={selectedSignals}
                setSelectedCustomSignals={setSelectedCustomSignals}
                setSelectedSignals={setSelectedSignals}
                expandedCategories={expandedCategories}
                setExpandedCategories={setExpandedCategories}
                confirmDeleteCustomTaskId={confirmDeleteCustomTaskId}
                setConfirmDeleteCustomTaskId={setConfirmDeleteCustomTaskId}
                setCustomTasks={setCustomTasks}
              />
            )}
            {activeDetailTab === 'collection' && (
              <DataCollectionTab
                selectedClientId={selectedClientId}
                activeModuleId={activeModuleId}
                setActiveModuleId={setActiveModuleId}
                enabledModules={enabledModules}
                customTasks={customTasks}
                selectedCustomSignals={selectedCustomSignals}
                selectedSignals={selectedSignals}
                editCompany={editCompany}
                editSector={editSector}
                customPrompts={customPrompts}
                setCustomPrompts={setCustomPrompts}
                editingModuleIdState={editingModuleIdState}
                setEditingModuleIdState={setEditingModuleIdState}
                editPromptValue={editPromptValue}
                setEditPromptValue={setEditPromptValue}
                pausedModules={pausedModules}
                setPausedModules={setPausedModules}
                runningModuleId={runningModuleId}
                setRunningModuleId={setRunningModuleId}
                moduleLastRan={moduleLastRan}
                setModuleLastRan={setModuleLastRan}
                showHistoryModuleId={showHistoryModuleId}
                setShowHistoryModuleId={setShowHistoryModuleId}
                tempSchedule={tempSchedule}
                setTempSchedule={setTempSchedule}
                moduleSchedules={moduleSchedules}
                setModuleSchedules={setModuleSchedules}
                confirmDeleteModuleId={confirmDeleteModuleId}
                setConfirmDeleteModuleId={setConfirmDeleteModuleId}
                setActiveDetailTab={setActiveDetailTab}
              />
            )}
            {activeDetailTab === 'rules' && (
              <IntelligenceRulesTab />
            )}
            {activeDetailTab === 'datasources' && (
              <CustomDataSourcesTab
                selectedClientId={selectedClientId}
              />
            )}
              </div>
            </div>

            {/* removed global save footer from here */}
          </>
        ) : (
          /* 1. Primary View: Pristine Client Lists Table */
          <div className="bg-white border border-[#e2e8f0] overflow-hidden" style={{ borderRadius: "6px" }}>
          {customers.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">No Client Profiles Configured</p>
              <p className="text-xs text-slate-400 mt-1">Please onboard an enterprise profile to construct database tables.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Table Header Section with left-aligned search bar and right-aligned description */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center px-5 py-3 border-b border-[#e2e8f0] gap-3 bg-white">
                <div className="flex flex-row items-center gap-3.5">
                  <span className="text-[14px] font-bold text-[#1e293b] tracking-tight shrink-0">Clients</span>
                  <div className="relative w-full sm:w-56">
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-1 bg-white border border-[#e2e8f0] text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-100 text-slate-850 placeholder-slate-400 transition-all font-medium"
                      style={{ borderRadius: "6px" }}
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-650 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-slate-700 font-medium hidden sm:inline">
                  Active subscriber directories and monitoring seats
                </span>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800">No matching clients found</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Try adjusting your search query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11px] font-semibold text-slate-500 select-none">
                        <th className="py-2.5 px-5 font-sans font-medium text-slate-600">Client</th>
                        <th className="py-2.5 px-5 font-sans font-medium text-slate-600">Industry</th>
                        <th className="py-2.5 px-5 font-sans font-medium text-slate-600">Location</th>
                        <th className="py-2.5 px-5 font-sans font-medium text-slate-600 text-center">Users</th>
                        <th className="py-2.5 px-5 font-sans font-medium text-slate-600 text-center">Service Subscriptions</th>
                        <th className="py-2.5 px-5 font-sans font-medium text-slate-600">Last Active</th>
                        <th className="py-2.5 px-5 font-sans font-medium text-slate-600">Status</th>
                        <th className="py-2.5 px-5 font-sans font-medium text-slate-600 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {paginatedCustomers.map((c) => {
                        const meta = getClientMeta(c);
                        return (
                          <tr key={c.id} className="hover:bg-indigo-50/20 transition-all group duration-150">
                            <td className="py-1.5 px-5 font-semibold text-slate-900 text-xs">
                              <span className="select-text">{c.company}</span>
                            </td>
                            <td className="py-1.5 px-5 text-xs text-slate-600">
                              <span className="select-text">{c.sector}</span>
                            </td>
                            <td className="py-1.5 px-5 text-xs text-slate-600">
                              <span className="select-text">{meta.location}</span>
                            </td>
                            <td className="py-1.5 px-5 text-xs text-center text-slate-700 font-mono font-semibold">
                              {meta.users}
                            </td>
                            <td className="py-1.5 px-5 text-xs text-center text-indigo-650 font-mono font-semibold">
                              {meta.subscriptions}
                            </td>
                            <td className="py-1.5 px-5 text-xs text-slate-500">
                              {meta.lastActive}
                            </td>
                            <td className="py-1.5 px-5 text-xs">
                              <select 
                                value={c.status === 'suspended' ? 'suspended' : c.status}
                                onChange={(e) => onUpdateCustomer(c.id, { status: e.target.value as any })}
                                className="text-[11px] font-semibold border border-[#e2e8f0] rounded-md px-2 py-0.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                              >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-5 text-right">
                              <button
                                onClick={() => {
                                  if (c.status === 'active') {
                                    setSelectedClientId(c.id);
                                    setDetailClientId(c.id);
                                  }
                                }}
                                disabled={c.status !== 'active'}
                                className={`inline-flex items-center justify-center p-1.5 transition-all rounded-[6px] duration-150 ${
                                  c.status === 'active' 
                                    ? "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/70 cursor-pointer" 
                                    : "text-slate-300 cursor-not-allowed"
                                }`}
                                title={c.status === 'active' ? "View More Details" : "Client Suspended"}
                                aria-label={c.status === 'active' ? `View More Details for ${c.company}` : `${c.company} Is Suspended`}
                              >
                                <Settings className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {filteredCustomers.length > 0 && (
                <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#e2e8f0] bg-[#f8fafc] text-xs font-semibold text-slate-550">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-1.5 border border-[#e2e8f0] text-[11px] font-semibold rounded-md text-slate-750 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-3 py-1.5 border border-[#e2e8f0] text-[11px] font-semibold rounded-md text-slate-750 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500">
                        Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{" "}
                        <span className="font-semibold text-slate-800">
                          {Math.min(endIndex, filteredCustomers.length)}
                        </span>{" "}
                        of <span className="font-semibold text-slate-800">{filteredCustomers.length}</span> clients
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-[6px] -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-1.5 py-1 rounded-l-md border border-[#e2e8f0] bg-white text-slate-500 hover:bg-gray-55 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-2.5 py-1 border text-[11px] font-medium cursor-pointer transition-colors ${
                              currentPage === page
                                ? "z-10 bg-indigo-50 border-indigo-400 text-indigo-600 font-bold"
                                : "border-[#e2e8f0] bg-white text-slate-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-1.5 py-1 rounded-r-md border border-[#e2e8f0] bg-white text-slate-500 hover:bg-gray-55 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Onboard Client Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-2xl border border-gray-200 shadow-2xl overflow-hidden" style={{ borderRadius: "8px" }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Add New Client</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-650 p-1 border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer rounded-md"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleOnboardSubmit} className="px-6 py-4 space-y-1.5 max-h-[85vh] overflow-y-auto font-sans">
              
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
                  onClick={() => setShowAddModal(false)} 
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
      )}

      {showAddCustomTaskModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-[468px] border border-gray-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200" style={{ borderRadius: "12px" }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100">
              <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">New Custom Task</h3>
              <button 
                type="button"
                onClick={() => {
                  setShowAddCustomTaskModal(false);
                  setNewCustomTaskName("");
                  setNewCustomSubTasks([""]);
                }}
                className="text-gray-400 hover:text-gray-650 p-1.5 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer rounded-lg"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Input Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCustomTaskName.trim() || !selectedClientId) return;
                const filteredSubTasks = newCustomSubTasks.map(st => st.trim()).filter(Boolean);
                if (filteredSubTasks.length === 0) return;

                const { data: dbTask, error: taskError } = await supabase.schema('admin')
                  .from('custom_tasks')
                  .insert({ client_id: selectedClientId, name: newCustomTaskName.trim() })
                  .select()
                  .single();

                if (taskError || !dbTask) {
                  console.error("Failed to insert custom task", taskError);
                  return;
                }

                const { data: dbSubTasks } = await supabase.schema('admin')
                  .from('custom_task_subtasks')
                  .insert(
                    filteredSubTasks.map(st => ({
                      custom_task_id: dbTask.id,
                      name: st,
                      is_selected: true
                    }))
                  )
                  .select();

                const newTask = {
                  id: dbTask.id,
                  name: dbTask.name,
                  subTasks: dbSubTasks || []
                };

                const updatedTasks = [...(customTasks[selectedClientId] || []), newTask];

                // Update customTasks state for the client
                setCustomTasks(prev => ({
                  ...prev,
                  [selectedClientId]: updatedTasks
                }));

                const automaticallySelectedIds = (dbSubTasks || []).map((sub: any) => sub.id);

                // Auto-select all subtasks for this task
                setSelectedCustomSignals(prev => ({
                  ...prev,
                  [dbTask.id]: automaticallySelectedIds
                }));

                // Auto open category
                setExpandedCategories(prev => {
                  const next = new Set(prev);
                  next.add(dbTask.id);
                  return next;
                });

                // Auto switch active view to custom tasks
                setActiveModuleId("custom_tasks");

                // Close modal and reset fields
                setShowAddCustomTaskModal(false);
                setNewCustomTaskName("");
                setNewCustomSubTasks([""]);
              }} 
              className="p-6 space-y-6 max-h-[75vh] overflow-y-auto"
            >
              
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
                  onClick={() => {
                    setShowAddCustomTaskModal(false);
                    setNewCustomTaskName("");
                    setNewCustomSubTasks([""]);
                  }}
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
      )}

      </div>

      {/* Global Save Action Footer (Sticky/Fixed outside the workpane area) */}
      {(detailClientId && activeClientInModal && (activeDetailTab === 'basic' || activeDetailTab === 'scope' || activeDetailTab === 'collection')) && (
        <div className="sticky bottom-0 z-30 p-4 pt-3 flex justify-end bg-white/40 backdrop-blur-md border-t border-gray-200">
          <div className="flex items-center gap-3">
          {activeDetailTab === 'basic' ? (
            <button
              type="button"
              onClick={handleSaveProfile}
              className="bg-black hover:bg-slate-800 text-white text-[11px] font-bold py-2 px-10 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
              style={{ borderRadius: "6px" }}
            >
              <Save className="h-4 w-4" /> Save Changes
            </button>
          ) : (
            <div className="flex gap-3">
              {activeDetailTab === 'scope' && (
                <button
                  type="button"
                  onClick={() => {
                    setNewCustomTaskName("");
                    setNewCustomSubTasks([""]);
                    setShowAddCustomTaskModal(true);
                  }}
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[11px] font-bold py-2 px-6 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
                  style={{ borderRadius: "6px" }}
                >
                  <Plus className="h-4 w-4" /> Add Custom Task
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveConfiguration}
                className="bg-black hover:bg-slate-800 text-white text-[11px] font-bold py-2 px-10 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
                style={{ borderRadius: "6px" }}
              >
                <Check className="h-4 w-4" /> Save Configuration
              </button>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
