import React from "react";
import { Search, X, FileText, Settings } from "lucide-react";
import { Customer } from "../../types";
import { getClientMeta } from "./utils";

interface CustomerListProps {
  customers: Customer[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  onUpdateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  setSelectedClientId: (id: string) => void;
  setDetailClientId: (id: string | null) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  onUpdateCustomer,
  setSelectedClientId,
  setDetailClientId
}) => {
  // Filtering Logic
  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.company.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  return (
    <div className="bg-white border-t border-[#e2e8f0]">
      {/* Search Header Bar */}
      <div className="h-[52px] px-5 border-b border-[#e2e8f0] flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              placeholder="Search companies, sectors or contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] py-1.5 pl-9 pr-8 text-xs text-slate-900 rounded-[6px] focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-50 transition-all placeholder-slate-400 font-sans"
            />
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
  );
};
