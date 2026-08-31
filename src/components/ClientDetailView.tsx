/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Customer, CustomTask } from "../types";
import { supabase } from "../lib/supabase";
import { 
  BasicInfoTab, 
  MonitoringScopeTab, 
  DataCollectionTab,
  IntelligenceRulesTab,
  CustomDataSourcesTab
} from "./customers";
import { X, Check, Save, Plus, Trash2 } from "lucide-react";

interface ClientDetailViewProps {
  selectedClientId: string;
  activeClient: Customer;
  onUpdateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  onDeleteCustomer?: (id: string) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  onBack: () => void;
  customers: Customer[];
  INTELLIGENCE_MODULES: any[];
}

export default function ClientDetailView({
  selectedClientId,
  activeClient,
  onUpdateCustomer,
  onDeleteCustomer,
  showToast,
  onBack,
  customers,
  INTELLIGENCE_MODULES
}: ClientDetailViewProps) {
  
  const [activeDetailTab, setActiveDetailTab] = useState<'basic' | 'scope' | 'collection' | 'rules' | 'datasources'>('basic');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setActiveDetailTab('basic');
  }, [selectedClientId]);

  // Form states matching scoring profile fields
  const [primaryGeographies, setPrimaryGeographies] = useState(activeClient.promptVariables?.geographicScope ?? activeClient.primaryGeographies ?? "");
  const [coreSectors, setCoreSectors] = useState(activeClient.coreSectors ?? "");
  const [focusProducts, setFocusProducts] = useState(activeClient.promptVariables?.focusProducts ?? "");
  const [sectorsToAvoid, setSectorsToAvoid] = useState(activeClient.sectorsToAvoid ?? "");
  const [knownCompetitors, setKnownCompetitors] = useState(activeClient.promptVariables?.competitors ?? activeClient.knownCompetitors ?? "");
  const [dealSizeMin, setDealSizeMin] = useState(activeClient.dealSizeMin ?? 50000);
  const [dealSizeMax, setDealSizeMax] = useState(activeClient.dealSizeMax ?? 500000);

  // Dynamic slider weights
  const [geoWeights, setGeoWeights] = useState<Record<string, number>>(activeClient.geographyWeights || {});
  const [sectorWeights, setSectorWeights] = useState<Record<string, number>>(activeClient.sectorWeights || {});

  // Tier 3 parameters 
  const [targetAccounts, setTargetAccounts] = useState(activeClient.targetAccounts ?? "");
  const [existingRelationships, setExistingRelationships] = useState(activeClient.existingRelationships ?? "");
  const [blacklistCompanies, setBlacklistCompanies] = useState(activeClient.blacklistCompanies ?? "");
  const [keyContacts, setKeyContacts] = useState(activeClient.keyContacts ?? "");
  const [pipelineStatus, setPipelineStatus] = useState(activeClient.pipelineStatus || "available — normal scoring");
  const [sectorsToEnter, setSectorsToEnter] = useState(activeClient.sectorsToEnter ?? "");
  const [designations, setDesignations] = useState(activeClient.designations ?? "");

  // Basic client identity states (to map to the form inputs)
  const [editCompany, setEditCompany] = useState(activeClient.company ?? "");
  const [editSector, setEditSector] = useState(activeClient.sector ?? "");
  const [editLocation, setEditLocation] = useState(activeClient.location ?? "");
  const [description, setDescription] = useState(activeClient.description ?? "");

  // Monitoring Scope states
  const [activeModuleId, setActiveModuleId] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([]));
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});
  const [persistedEnabledModules, setPersistedEnabledModules] = useState<Record<string, boolean>>({});
  const [selectedSignals, setSelectedSignals] = useState<Record<string, string[]>>({});
  const [persistedSignals, setPersistedSignals] = useState<Record<string, string[]>>({});
  const [isSavingConfiguration, setIsSavingConfiguration] = useState(false);
  const [isLoadingClientDetail, setIsLoadingClientDetail] = useState(true);
  const [persistedBasicInfo, setPersistedBasicInfo] = useState<Record<string, any>>({});
  const [isSavingBasicInfo, setIsSavingBasicInfo] = useState(false);

  // Access Details table state
  const [accessUsers, setAccessUsers] = useState<any[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
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

  useEffect(() => {
    let parsed: any[] = [];
    try {
      if (activeClient.keyContacts && activeClient.keyContacts.startsWith("[")) {
        parsed = JSON.parse(activeClient.keyContacts);
      }
    } catch (e) {
      console.error("Failed to parse keyContacts json", e);
    }
    const isUUID = (str: any) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const enriched = parsed.map(u => ({
      ...u,
      authId: u.authId || (isUUID(u.id) ? u.id : undefined)
    }));
    setAccessUsers(enriched);
  }, [activeClient]);

  useEffect(() => {
    const geoScope = activeClient.promptVariables?.geographicScope ?? activeClient.primaryGeographies ?? "";
    const fProducts = activeClient.promptVariables?.focusProducts ?? "";
    const cSectors = activeClient.coreSectors ?? "";
    const sToAvoid = activeClient.sectorsToAvoid ?? "";
    const comps = activeClient.promptVariables?.competitors ?? activeClient.knownCompetitors ?? "";
    const desigs = activeClient.designations ?? "";
    const comp = activeClient.company ?? "";
    const sec = activeClient.sector ?? "";
    const loc = activeClient.location ?? "";
    const desc = activeClient.description ?? "";

    setPrimaryGeographies(geoScope);
    setFocusProducts(fProducts);
    setCoreSectors(cSectors);
    setSectorsToAvoid(sToAvoid);
    setKnownCompetitors(comps);
    setDesignations(desigs);
    setEditCompany(comp);
    setEditSector(sec);
    setEditLocation(loc);
    setDescription(desc);

    setTargetAccounts(activeClient.targetAccounts ?? "");
    setBlacklistCompanies(activeClient.blacklistCompanies ?? "");
    setExistingRelationships(activeClient.existingRelationships ?? "");
    setSectorsToEnter(activeClient.sectorsToEnter ?? "");
    setPipelineStatus(activeClient.pipelineStatus || "available — normal scoring");
    if (activeClient.dealSizeMin !== undefined) setDealSizeMin(activeClient.dealSizeMin);
    if (activeClient.dealSizeMax !== undefined) setDealSizeMax(activeClient.dealSizeMax);
    if (activeClient.geographyWeights) setGeoWeights(activeClient.geographyWeights);
    if (activeClient.sectorWeights) setSectorWeights(activeClient.sectorWeights);

    setPersistedBasicInfo({
      primaryGeographies: geoScope,
      focusProducts: fProducts,
      coreSectors: cSectors,
      sectorsToAvoid: sToAvoid,
      knownCompetitors: comps,
      designations: desigs,
      editCompany: comp,
      editSector: sec,
      editLocation: loc,
      description: desc,
    });
  }, [activeClient]);

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
      if (user && (user.isNew || (!user.firstName && !user.lastName))) {
        setAccessUsers(prev => prev.filter(u => u.id !== editingRowId));
      }
    }
    setEditingRowId(null);
    setRowError(null);
  };

  const handleSaveEditRow = async (id: string) => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      setRowError("First and Last name are required");
      return;
    }
    if (!editEmail.trim()) {
      setRowError("Email is required");
      return;
    }

    const trimmedEmail = editEmail.trim().toLowerCase();

    // Check if email already exists elsewhere in current client's accessUsers array
    const emailExistsInCurrent = accessUsers.some(
      u => u.id !== id && u.email && u.email.trim().toLowerCase() === trimmedEmail
    );

    if (emailExistsInCurrent) {
      setRowError("This email is already added");
      return;
    }

    // Check if email already belongs to another client in the loaded customers list
    const emailExistsInOtherClient = (customers || []).some(c => {
      if (c.id === selectedClientId) return false;
      if (!c.keyContacts) return false;
      try {
        const contacts = typeof c.keyContacts === "string" ? JSON.parse(c.keyContacts) : c.keyContacts;
        if (Array.isArray(contacts)) {
          return contacts.some(
            (u: any) => u.email && u.email.trim().toLowerCase() === trimmedEmail
          );
        }
      } catch (e) {}
      return false;
    });

    if (emailExistsInOtherClient) {
      setRowError("This email is already registered to another client");
      return;
    }

    setRowError(null);
    setIsSavingRow(true);

    try {
      let authUserId: string | null = null;
      const isNew = accessUsers.find(u => u.id === id)?.isNew;
      if (isNew) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/invite-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: editEmail.trim(),
                clientId: selectedClientId,
                name: `${editFirstName.trim()} ${editLastName.trim()}`,
                firstName: editFirstName.trim(),
                lastName: editLastName.trim(),
                designation: editDesignation.trim()
            })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const isRegisteredToOther =
            errData.error === 'email_registered_to_other_client' ||
            errData.code === 'email_registered_to_other_client' ||
            (typeof errData.message === 'string' && errData.message.toLowerCase().includes('registered to another client')) ||
            (typeof errData.error === 'string' && errData.error.toLowerCase().includes('registered to another client'));

          if (isRegisteredToOther) {
            setRowError('This email is already registered to another client');
            setIsSavingRow(false);
            return;
          }

          const isEmailAlreadyRegistered =
            errData.error === 'email_already_registered' ||
            errData.code === 'email_already_registered' ||
            (typeof errData.message === 'string' && errData.message.toLowerCase().includes('already been registered')) ||
            (typeof errData.error === 'string' && errData.error.toLowerCase().includes('already been registered')) ||
            (typeof errData.message === 'string' && errData.message.toLowerCase().includes('already registered')) ||
            (typeof errData.error === 'string' && errData.error.toLowerCase().includes('already registered'));

          if (isEmailAlreadyRegistered) {
            setRowError('This email is already registered');
            setIsSavingRow(false);
            return;
          }

          throw new Error(errData.message || errData.error || `Failed to send invite: ${res.statusText || res.status}`);
        }

        const inviteData = await res.json().catch(() => ({}));
        if (inviteData?.user?.id) {
          authUserId = inviteData.user.id;
        } else if (inviteData?.userId) {
          authUserId = inviteData.userId;
        }
      }

      const isUUID = (str: any) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const updated = accessUsers.map(u => u.id === id ? {
        ...u,
        id: authUserId || u.id,
        authId: authUserId || u.authId || (isUUID(u.id) ? u.id : undefined),
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        designation: editDesignation.trim(),
        email: editEmail.trim(),
        isNew: false
      } : u);
      
      setAccessUsers(updated);
      const validConfirmedUsers = updated.filter(u => !u.isNew);
      await onUpdateCustomer(selectedClientId, { keyContacts: JSON.stringify(validConfirmedUsers) });
      setEditingRowId(null);
      setRowError(null);
      showToast("Contact saved successfully!");
    } catch (err: any) {
      setRowError(err.message || "Failed to save contact");
    } finally {
      setIsSavingRow(false);
    }
  };

  const handleToggleUserActive = async (id: string) => {
      const updated = accessUsers.map(u => u.id === id ? { ...u, active: !u.active } : u);
      setAccessUsers(updated);
      const validConfirmedUsers = updated.filter(u => !u.isNew);
      await onUpdateCustomer(selectedClientId, { keyContacts: JSON.stringify(validConfirmedUsers) });
  };

  const handleDeleteUser = async (id: string) => {
    const userToDelete = accessUsers.find(u => u.id === id);
    if (!userToDelete) return;

    // If it is just an unsaved draft row, remove locally immediately
    if (userToDelete.isNew) {
      const updated = accessUsers.filter(u => u.id !== id);
      setAccessUsers(updated);
      setEditingRowId(null);
      setRowError(null);
      return;
    }

    const isUUID = (str: any) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const authId = userToDelete.authId || (isUUID(userToDelete.id) ? userToDelete.id : null);
    const email = userToDelete.email;

    setDeletingUserId(id);
    try {
      const deleteUrl = `${import.meta.env.VITE_API_URL || ""}/admin/delete-user`;
      const res = await fetch(deleteUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authId || id,
          id: authId || id,
          email: email
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Failed to delete user: ${res.statusText || res.status}`);
      }

      const updated = accessUsers.filter(u => u.id !== id);
      setAccessUsers(updated);
      const validConfirmedUsers = updated.filter(u => !u.isNew);
      await onUpdateCustomer(selectedClientId, { keyContacts: JSON.stringify(validConfirmedUsers) });
      showToast("Access user deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting access user:", err);
      showToast(err.message || "Failed to delete access user", "error");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handlePasswordReset = (email: string) => {
    setResetNoticeEmail(email);
    setResetNotice(`Password reset link sent to ${email}`);
    setTimeout(() => {
        setResetNotice(null);
        setResetNoticeEmail(null);
    }, 2500);
  };

  const handleAddAccessUser = () => {
    const existingUnsaved = accessUsers.find(u => u.isNew);
    if (existingUnsaved) {
      handleStartEditRow(existingUnsaved);
      return;
    }
    const newId = `u-${Date.now()}`;
    const newUser = { id: newId, firstName: "", lastName: "", designation: "", email: "", active: true, isNew: true };
    setAccessUsers([...accessUsers, newUser]);
    handleStartEditRow(newUser);
  };

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
  const [persistedCustomSignals, setPersistedCustomSignals] = useState<Record<string, string[]>>({});
  const [showAddCustomTaskModal, setShowAddCustomTaskModal] = useState(false);
  const [newCustomTaskName, setNewCustomTaskName] = useState("");
  const [newCustomSubTasks, setNewCustomSubTasks] = useState([""]);

  // Data Collection states
  const [customPrompts, setCustomPrompts] = useState<Record<string, Record<string, any>>>({});
  const [editingModuleIdState, setEditingModuleIdState] = useState<string | null>(null);
  const [editPromptValue, setEditPromptValue] = useState("");
  const [pausedModules, setPausedModules] = useState<Record<string, Record<string, boolean>>>({});
  const [runningModuleId, setRunningModuleId] = useState<string | null>(null);
  const [moduleLastRan, setModuleLastRan] = useState<Record<string, Record<string, string>>>({});
  const [showHistoryModuleId, setShowHistoryModuleId] = useState<string | null>(null);
  const [tempSchedule, setTempSchedule] = useState<string>("");
  const [moduleSchedules, setModuleSchedules] = useState<Record<string, Record<string, any>>>({});
  const [confirmDeleteModuleId, setConfirmDeleteModuleId] = useState<string | null>(null);
  
  useEffect(() => {
    // Initialize based on database values immediately
    const syncMonitoringState = async () => {
      const [clientRes, signalsRes, tasksRes] = await Promise.all([
        supabase.schema('admin')
          .from('clients')
          .select('enabled_modules')
          .eq('id', selectedClientId)
          .maybeSingle(),
        supabase.schema('admin')
          .from('client_signals')
          .select('signal_id, signals(submodule_id)')
          .eq('client_id', selectedClientId),
        supabase.schema('admin')
          .from('custom_tasks')
          .select('*, custom_task_subtasks(*)')
          .eq('client_id', selectedClientId)
      ]);
      
      const dbClient = clientRes.data;
      const dbClientSignals = signalsRes.data;
      const dbCustomTasks = tasksRes.data;
      
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
        setPersistedCustomSignals(initialCustomSignals);
      }

      // Load enabled modules from admin.clients database or fallback to activeClient.
      // For new clients, enabled_modules is empty/null, so all modules will be disabled by default.
      const rawEnabled = dbClient?.enabled_modules ?? activeClient.enabled_modules ?? activeClient.enabledModules ?? activeClient.monitoringConfig?.enabledModules;
      const enabledMap: Record<string, boolean> = {};

      if (Array.isArray(rawEnabled)) {
        rawEnabled.forEach((id: string) => {
          if (id) enabledMap[id] = true;
        });
      } else if (rawEnabled && typeof rawEnabled === 'object') {
        Object.entries(rawEnabled).forEach(([id, val]) => {
          if (val) enabledMap[id] = true;
        });
      } else if (typeof rawEnabled === 'string') {
        try {
          const parsed = JSON.parse(rawEnabled);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => {
              if (id) enabledMap[id] = true;
            });
          } else if (parsed && typeof parsed === 'object') {
            Object.entries(parsed).forEach(([id, val]) => {
              if (val) enabledMap[id] = true;
            });
          }
        } catch (e) {}
      }

      setEnabledModules(enabledMap);
      setPersistedEnabledModules(enabledMap);
      
      const mConfig = activeClient.monitoringConfig || { enabledModules: [], selectedSignals: {} };
      // If no signals in db, use config signals
      const finalSelectedSignals = Object.keys(nextSelectedSignals).length === 0 ? (mConfig.selectedSignals || {}) : nextSelectedSignals;
      setSelectedSignals(finalSelectedSignals);
      setPersistedSignals(finalSelectedSignals);

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
          [selectedClientId]: savedTasks
        }));
        const defaultCustomSignalsSelected = {
          "ct-1": ["Review regulatory filing calendars", "Validate pollution control board consent NOCs", "Confirm municipal trade license renewals"],
          "ct-2": ["Track corporate real estate lease sign-offs", "Inspect local workforce search activity", "Monitor regional warehouse infrastructure logs"]
        };
        const finalCustomSignals = mConfig.selectedCustomSignals || defaultCustomSignalsSelected;
        setSelectedCustomSignals(finalCustomSignals);
        setPersistedCustomSignals(finalCustomSignals);
      }
      setIsLoadingClientDetail(false);
    };

    syncMonitoringState();
  }, [selectedClientId, activeClient]);

  const handleSaveProfile = async () => {
    if (!selectedClientId) return;
    
    // Filter out any row where isNew is still true before saving — those were never confirmed via a successful invite
    const validConfirmedUsers = accessUsers.filter(u => !u.isNew);
    const keyContactsPayload = JSON.stringify(validConfirmedUsers);

    const payload: Partial<Customer> = {
      company: editCompany,
      sector: editSector,
      location: editLocation,
      description: description,
      promptVariables: {
        ...activeClient.promptVariables,
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
      keyContacts: keyContactsPayload,
      pipelineStatus,
      sectorsToEnter,
      designations
    };

    await onUpdateCustomer(selectedClientId, payload);
  };

  const handleSaveBasicInfo = async () => {
    setIsSavingBasicInfo(true);
    try {
      await handleSaveProfile();
      setPersistedBasicInfo({
        primaryGeographies,
        focusProducts,
        coreSectors,
        sectorsToAvoid,
        knownCompetitors,
        designations,
        editCompany,
        editSector,
        editLocation,
        description
      });
      showToast("Changes saved successfully!");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Error saving changes", 'error');
    } finally {
      setIsSavingBasicInfo(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!selectedClientId) return;

    setIsSavingConfiguration(true);
    try {
      await supabase.schema('admin')
        .from('client_signals')
        .delete()
        .eq('client_id', selectedClientId);
      
      const allSelectedSignalIds = Object.values(selectedSignals).flat();
      if (allSelectedSignalIds.length > 0) {
        await supabase.schema('admin')
          .from('client_signals')
          .insert(allSelectedSignalIds.map(signalId => ({
            client_id: selectedClientId,
            signal_id: signalId
          })));
      }

      const currentClientCustomTasks = customTasks[selectedClientId] || [];
      const subtaskUpdates = [];
      for (const task of currentClientCustomTasks) {
        for (const sub of task.subTasks) {
          if (sub.id) {
            const isSelected = selectedCustomSignals[task.id]?.includes(sub.id) || false;
            if (sub.is_selected !== isSelected) {
              subtaskUpdates.push({
                ...sub,
                is_selected: isSelected
              });
            }
          }
        }
      }

      if (subtaskUpdates.length > 0) {
        await supabase.schema('admin').from('custom_task_subtasks').upsert(subtaskUpdates);
      }

      // Filter array of enabled modules to persist in JSONB
      const enabledModulesList = Object.keys(enabledModules).filter(id => Boolean(enabledModules[id]));

      // Save directly to admin.clients in enabled_modules field (JSONB)
      const { error: clientUpdateError } = await supabase.schema('admin')
        .from('clients')
        .update({ enabled_modules: enabledModulesList })
        .eq('id', selectedClientId);

      if (clientUpdateError) {
        console.error("Error updating enabled_modules in clients table:", clientUpdateError);
      }

      // Sync submodule schedules active status to backend to ensure disabled submodules don't run on schedule
      try {
        const { data: clientPrompts } = await supabase.schema('admin')
          .from('prompts')
          .select('id, module_id, submodule_id, custom_task_id, prompt_text')
          .eq('client_id', selectedClientId);

        if (clientPrompts && clientPrompts.length > 0) {
          const syncPromises = clientPrompts.map(async (p: any) => {
            const subId = p.submodule_id || p.custom_task_id;
            const modId = p.module_id || 'custom_tasks';
            if (!subId) return;

            const isModEnabled = Boolean(enabledModules[modId]);
            let isSubActive = isModEnabled;
            if (isModEnabled) {
              if (modId === 'custom_tasks') {
                const taskList = customTasks[selectedClientId] || [];
                const task = taskList.find(t => t.id === subId);
                if (task && task.subTasks && task.subTasks.length > 0 && selectedCustomSignals[subId] !== undefined) {
                  isSubActive = selectedCustomSignals[subId].length > 0;
                }
              } else {
                const mod = INTELLIGENCE_MODULES?.find(m => m.id === modId);
                const cat = mod?.categories?.find((c: any) => c.id === subId);
                if (cat && cat.items && cat.items.length > 0 && selectedSignals[subId] !== undefined) {
                  isSubActive = selectedSignals[subId].length > 0;
                }
              }
            }

            return fetch(`${import.meta.env.VITE_API_URL}/schedules`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId: selectedClientId,
                submoduleId: subId,
                moduleId: modId,
                promptText: p.prompt_text,
                industry: activeClient.sector || 'Unknown',
                isActive: isSubActive
              })
            }).catch(e => console.warn(`Failed to sync schedule active state for ${subId}:`, e));
          });

          await Promise.allSettled(syncPromises);
        }
      } catch (scheduleSyncErr) {
        console.warn("Could not sync schedule active statuses:", scheduleSyncErr);
      }

      await onUpdateCustomer(selectedClientId, {
        enabled_modules: enabledModulesList,
        enabledModules: enabledModulesList,
        monitoringConfig: {
          enabledModules: enabledModulesList,
          selectedSignals,
          customTasks: customTasks[selectedClientId] || [],
          selectedCustomSignals: selectedCustomSignals
        }
      });
      
      setPersistedSignals(selectedSignals);
      setPersistedCustomSignals(selectedCustomSignals);
      setPersistedEnabledModules(enabledModules);
      showToast("Configuration saved successfully!");
    } catch (err: any) {
      console.error("Error saving configuration", err);
      showToast(err.message || "Failed to save configuration", 'error');
    } finally {
      setIsSavingConfiguration(false);
    }
  };

  const currentBasicInfo = {
    primaryGeographies,
    focusProducts,
    coreSectors,
    sectorsToAvoid,
    knownCompetitors,
    designations,
    editCompany,
    editSector,
    editLocation,
    description
  };
  const hasUnsavedBasicInfo = JSON.stringify(currentBasicInfo) !== JSON.stringify(persistedBasicInfo);

  const hasUnsavedConfiguration =
    JSON.stringify(selectedSignals) !== JSON.stringify(persistedSignals) ||
    JSON.stringify(selectedCustomSignals) !== JSON.stringify(persistedCustomSignals) ||
    JSON.stringify(enabledModules) !== JSON.stringify(persistedEnabledModules);

  return (
    <div className="bg-white border border-[#e2e8f0] p-3 flex flex-col" style={{ borderRadius: "6px" }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#e2e8f0] pb-3 mb-4 gap-2 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center p-2 text-slate-600 hover:text-[#0066cc] hover:bg-slate-55 border border-[#e2e8f0] transition-all rounded-[6px] cursor-pointer"
            title="Back to Clients"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-[16px] font-bold text-[#1e293b] tracking-tight">{activeClient.company}</h2>
            <p className="text-[11px] text-slate-700 font-medium mt-0.5">{activeClient.sector}</p>
          </div>
        </div>
        {onDeleteCustomer && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 active:scale-[0.98] border border-red-200 transition-all rounded-[6px] cursor-pointer shadow-xs"
            title="Delete this client"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Client</span>
          </button>
        )}
      </div>

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

      <div className="flex-1 overflow-y-auto py-0">
        <div className={activeDetailTab === 'rules' ? 'block' : 'hidden'}>
          <IntelligenceRulesTab showToast={showToast} />
        </div>
        <div className={activeDetailTab === 'datasources' ? 'block' : 'hidden'}>
          <CustomDataSourcesTab selectedClientId={selectedClientId} showToast={showToast} />
        </div>
        <div className={activeDetailTab === 'basic' ? 'block' : 'hidden'}>
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
            deletingUserId={deletingUserId}
          />
        </div>
        <div className={activeDetailTab === 'scope' ? 'block' : 'hidden'}>
          {isLoadingClientDetail ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
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
              confirmDeleteCustomTaskId={null}
              setConfirmDeleteCustomTaskId={() => {}}
              setCustomTasks={setCustomTasks}
              showToast={showToast}
            />
          )}
        </div>
        <div className={activeDetailTab === 'collection' ? 'block' : 'hidden'}>
          {isLoadingClientDetail ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <DataCollectionTab
              selectedClientId={selectedClientId}
              activeModuleId={activeModuleId}
              setActiveModuleId={setActiveModuleId}
              enabledModules={enabledModules}
              setEnabledModules={setEnabledModules}
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
              showToast={showToast}
            />
          )}
        </div>
      </div>
      {(activeDetailTab === 'basic' || activeDetailTab === 'scope') && (
        <div className="sticky bottom-0 z-30 p-4 pt-3 flex justify-end bg-white/40 backdrop-blur-md border-t border-gray-200">
          <div className="flex items-center gap-3">
          {activeDetailTab === 'basic' ? (
            <div className="relative">
              {hasUnsavedBasicInfo && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 rounded-full border-2 border-white shadow-sm z-10" title="Unsaved Changes"></span>
              )}
              <button
                type="button"
                onClick={handleSaveBasicInfo}
                disabled={isSavingBasicInfo}
                className={`text-white text-[11px] font-bold py-2 px-10 flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                  hasUnsavedBasicInfo ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-black hover:bg-slate-800'
                } ${isSavingBasicInfo ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ borderRadius: "6px" }}
              >
                {isSavingBasicInfo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
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
              <div className="relative">
                {hasUnsavedConfiguration && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 rounded-full border-2 border-white shadow-sm z-10" title="Unsaved Changes"></span>
                )}
                <button
                  type="button"
                  onClick={handleSaveConfiguration}
                  disabled={isSavingConfiguration}
                  className={`text-white text-[11px] font-bold py-2 px-10 flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                    hasUnsavedConfiguration ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-black hover:bg-slate-800'
                  } ${isSavingConfiguration ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ borderRadius: "6px" }}
                >
                  {isSavingConfiguration ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Save Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
      {/* Add Custom Task Modal */}
      {showAddCustomTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-900 tracking-tight">Add Custom Task</h3>
              <button 
                onClick={() => setShowAddCustomTaskModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const filteredSubTasks = newCustomSubTasks.filter(st => st.trim() !== "");
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

                setCustomTasks(prev => ({
                  ...prev,
                  [selectedClientId]: updatedTasks
                }));

                const automaticallySelectedIds = (dbSubTasks || []).map((sub: any) => sub.id);

                setSelectedCustomSignals(prev => ({
                  ...prev,
                  [dbTask.id]: automaticallySelectedIds
                }));

                setActiveModuleId("custom_tasks");

                setShowAddCustomTaskModal(false);
                setNewCustomTaskName("");
                setNewCustomSubTasks([""]);
              }} 
              className="p-6 space-y-6 max-h-[75vh] overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-1">
                  <h4 className="text-[10px] font-bold text-gray-400 tracking-widest">Task Identity</h4>
                </div>
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
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-1 flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-gray-400 tracking-widest">Required Signals</h4>
                  <button
                    type="button"
                    onClick={() => setNewCustomSubTasks(prev => [...prev, ""])}
                    className="text-[10.5px] text-[#4f46e5] font-bold hover:text-[#4338ca] transition-colors cursor-pointer flex items-center gap-1 bg-[#f5f3ff] px-2.5 py-1 rounded-md border border-indigo-100"
                  >
                    <Plus className="h-3 w-3 stroke-[2.5]" /> Add Line
                  </button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {newCustomSubTasks.map((sub, index) => (
                    <div key={index} className="flex gap-2 items-center">
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
      {/* Delete Client Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-sm border border-slate-200 shadow-xl overflow-hidden rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Delete Client</h3>
              <button 
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-650 p-1 rounded-md transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 font-semibold">{activeClient.company}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3.5 py-2 border border-slate-200 cursor-pointer rounded-md transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!onDeleteCustomer) return;
                  setIsDeleting(true);
                  try {
                    await onDeleteCustomer(selectedClientId);
                    setShowDeleteModal(false);
                    onBack();
                  } catch (err: any) {
                    showToast(err.message || "Failed to delete client", 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 cursor-pointer rounded-md flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-70 active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
