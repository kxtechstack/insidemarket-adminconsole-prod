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
  Users,
  Loader2
} from "lucide-react";
import { Customer, CustomTask } from "../types";
import { supabase } from "../lib/supabase";
import { useIntelligenceModules } from "../data/intelligenceModules";
import { COLLECTION_PROMPTS } from "../data/prompts";
import ClientDetailView from "./ClientDetailView";
import { 
  CustomerList, 
  OnboardModal, 
  AddCustomTaskModal,
  getClientMeta
} from "./customers";

interface CustomersTabProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'joinedDate' | 'apiCallsCount'>) => Promise<string | void>;
  onUpdateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function CustomersTab({ 
  customers, 
  onAddCustomer, 
  onUpdateCustomer, 
  onDeleteCustomer,
  showToast
}: CustomersTabProps) {
  
  const { modules: INTELLIGENCE_MODULES } = useIntelligenceModules();

  // Selected client for scoring configuration (modal/drawer state)
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [detailClientId, setDetailClientId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Customer | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete || !onDeleteCustomer) return;
    setIsDeletingClient(true);
    try {
      await onDeleteCustomer(clientToDelete.id);
      if (detailClientId === clientToDelete.id) {
        setDetailClientId(null);
        setSelectedClientId("");
      }
      setClientToDelete(null);
    } catch (err: any) {
      showToast(err.message || "Failed to delete client", "error");
    } finally {
      setIsDeletingClient(false);
    }
  };

  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
  const [persistedSignals, setPersistedSignals] = useState<Record<string, string[]>>({});
  const [isLoadingClientDetail, setIsLoadingClientDetail] = useState(false);
  const [persistedBasicInfo, setPersistedBasicInfo] = useState<Record<string, any>>({});

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

  // Target customer payload for new customer onboarding
  const [newCustName, setNewCustName] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustSector, setNewCustSector] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustDescription, setNewCustDescription] = useState("");
  const [newCustCoreProducts, setNewCustCoreProducts] = useState("");
  const [newCustCompetitors, setNewCustCompetitors] = useState("");
  const [newCustCoreSectors, setNewCustCoreSectors] = useState("");
  const [newCustGeographies, setNewCustGeographies] = useState("");
  const [newCustSectorsToAvoid, setNewCustSectorsToAvoid] = useState("");
  const [newCustDesignations, setNewCustDesignations] = useState("");
  const [newCustLocation, setNewCustLocation] = useState("");

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
      setEditCompany(client.company || "");
      setEditSector(client.sector || "");
      setEditLocation(client.location || "");
      setDescription(client.description || "");
    }
  }, [selectedClientId, customers]);

  // Parsing helpers
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

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustCompany) return;

    const payload = {
      name: newCustName || newCustCompany || "New Client",
      company: newCustCompany,
      sector: newCustSector,
      location: newCustLocation,
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
      geographyWeights: newCustGeographies ? { [newCustGeographies.split(',')[0].trim() || "Global"]: 1.0 } : {},
      sectorWeights: newCustCoreSectors ? { [newCustCoreSectors.toLowerCase().split(',')[0].trim() || "sector"]: 1.0 } : {},
      targetAccounts: "",
      existingRelationships: "",
      blacklistCompanies: "",
      keyContacts: "[]",
      pipelineStatus: "active",
      sectorsToEnter: "",
      designations: newCustDesignations,
      coreSectors: newCustCoreSectors
    };

    setIsCreatingClient(true);
    try {
      const newClientId = await onAddCustomer(payload);
      setShowAddModal(false);
      setNewCustName("");
      setNewCustCompany("");
      setNewCustSector("");
      setNewCustDescription("");
      setNewCustCoreProducts("");
      setNewCustCompetitors("");
      setNewCustCoreSectors("");
      setNewCustGeographies("");
      setNewCustSectorsToAvoid("");
      setNewCustDesignations("");
      setNewCustLocation("");
      
      // Select the new client and view its details automatically using the returned ID
      if (newClientId && typeof newClientId === 'string') {
        setSelectedClientId(newClientId);
        setDetailClientId(newClientId);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create client", "error");
    } finally {
      setIsCreatingClient(false);
    }
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
          <ClientDetailView 
            key={selectedClientId}
            selectedClientId={selectedClientId}
            activeClient={activeClientInModal}
            onUpdateCustomer={onUpdateCustomer}
            onDeleteCustomer={onDeleteCustomer}
            showToast={showToast}
            onBack={() => setDetailClientId(null)}
            customers={customers}
            INTELLIGENCE_MODULES={INTELLIGENCE_MODULES}
          />
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
                          <tr key={c.id} className={`hover:bg-indigo-50/20 transition-all group duration-150 ${c.status === 'suspended' ? 'opacity-60' : ''}`}>
                            <td className="py-1.5 px-5 font-semibold text-slate-900 text-xs">
                              <span className={`select-text ${c.status === 'suspended' ? 'cursor-not-allowed' : ''}`}>{c.company}</span>
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
                              <div className="flex items-center justify-end gap-1">
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
                                      ? "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/70 active:bg-indigo-100 active:scale-95 cursor-pointer" 
                                      : "text-slate-300 cursor-not-allowed"
                                  }`}
                                  title={c.status === 'active' ? "View More Details" : "Client Suspended"}
                                  aria-label={c.status === 'active' ? `View More Details for ${c.company}` : `${c.company} Is Suspended`}
                                >
                                  <Settings className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setClientToDelete(c)}
                                  className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 active:scale-95 transition-all rounded-[6px] duration-150 cursor-pointer"
                                  title={`Delete ${c.company}`}
                                  aria-label={`Delete ${c.company}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
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
                  disabled={isCreatingClient}
                  onClick={() => setShowAddModal(false)} 
                  className="bg-white hover:bg-gray-50 active:bg-gray-100 text-slate-700 text-xs font-semibold px-4 py-1.5 border border-gray-200 cursor-pointer rounded-[6px] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreatingClient}
                  className="bg-[#1e293b] hover:bg-slate-800 active:bg-slate-900 active:scale-[0.98] text-white text-xs font-semibold px-5 py-1.5 cursor-pointer rounded-[6px] flex items-center gap-2 transition-all shadow-sm disabled:opacity-60"
                >
                  {isCreatingClient ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Create Client & Activate</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-sm border border-slate-200 shadow-xl overflow-hidden rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Delete Client</h3>
              <button 
                onClick={() => !isDeletingClient && setClientToDelete(null)}
                disabled={isDeletingClient}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 font-semibold">{clientToDelete.company}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingClient}
                onClick={() => setClientToDelete(null)}
                className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3.5 py-2 border border-slate-200 cursor-pointer rounded-md transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingClient}
                onClick={handleConfirmDeleteClient}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 cursor-pointer rounded-md flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-70 active:scale-95"
              >
                {isDeletingClient ? (
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

    </div>
  );
}
