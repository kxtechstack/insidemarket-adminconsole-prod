import React from "react";
import { Plus, X, Edit, Key, Trash2, Users, Save } from "lucide-react";
import { Customer } from "../../../types";

interface BasicInfoTabProps {
  editCompany: string;
  setEditCompany: (v: string) => void;
  editSector: string;
  setEditSector: (v: string) => void;
  editLocation: string;
  setEditLocation: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  coreSectors: string;
  setCoreSectors: (v: string) => void;
  focusProducts: string;
  setFocusProducts: (v: string) => void;
  knownCompetitors: string;
  setKnownCompetitors: (v: string) => void;
  primaryGeographies: string;
  setPrimaryGeographies: (v: string) => void;
  sectorsToAvoid: string;
  setSectorsToAvoid: (v: string) => void;
  designations: string;
  setDesignations: (v: string) => void;
  accessUsers: any[];
  handleAddAccessUser: () => void;
  resetNotice: string | null;
  setResetNotice: (v: string | null) => void;
  editingRowId: string | null;
  isSavingRow?: boolean;
  rowError?: string | null;
  editFirstName: string;
  setEditFirstName: (v: string) => void;
  editLastName: string;
  setEditLastName: (v: string) => void;
  editDesignation: string;
  setEditDesignation: (v: string) => void;
  editEmail: string;
  setEditEmail: (v: string) => void;
  handleToggleUserActive: (id: string) => void;
  handleSaveEditRow: (id: string) => void;
  handleCancelEditRow: () => void;
  handleStartEditRow: (user: any) => void;
  handlePasswordReset: (email: string) => void;
  handleDeleteUser: (id: string) => void;
  deletingUserId?: string | null;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  editCompany,
  setEditCompany,
  editSector,
  setEditSector,
  editLocation,
  setEditLocation,
  description,
  setDescription,
  coreSectors,
  setCoreSectors,
  focusProducts,
  setFocusProducts,
  knownCompetitors,
  setKnownCompetitors,
  primaryGeographies,
  setPrimaryGeographies,
  sectorsToAvoid,
  setSectorsToAvoid,
  designations,
  setDesignations,
  accessUsers,
  handleAddAccessUser,
  resetNotice,
  setResetNotice,
  editingRowId,
  isSavingRow,
  rowError,
  editFirstName,
  setEditFirstName,
  editLastName,
  setEditLastName,
  editDesignation,
  setEditDesignation,
  editEmail,
  setEditEmail,
  handleToggleUserActive,
  handleSaveEditRow,
  handleCancelEditRow,
  handleStartEditRow,
  handlePasswordReset,
  handleDeleteUser,
  deletingUserId
}) => {
  return (
    <div className="flex flex-col">
      {/* Subsection Header: CLIENT IDENTITY */}
      <div className="mb-2">
        <div className="text-[11px] font-bold text-slate-500 tracking-wider mb-1.5 uppercase">
          CLIENT IDENTITY
        </div>
        <div className="border-b border-[#e2e8f0]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
        <div>
          <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">
            Client Name <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Acme Research Ltd"
            value={editCompany}
            onChange={(e) => setEditCompany(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-slate-900 text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-100 placeholder-slate-400 font-medium transition-all"
            style={{ borderRadius: "6px" }}
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">
            Industry / Sector <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Market research & consulting"
            value={editSector}
            onChange={(e) => setEditSector(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-slate-900 text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-100 placeholder-slate-400 font-medium transition-all"
            style={{ borderRadius: "6px" }}
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">
            Location <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. London, UK"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-slate-900 text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-100 placeholder-slate-400 font-medium transition-all"
            style={{ borderRadius: "6px" }}
          />
        </div>
      </div>

      <div className="mt-2">
        <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">
          Client Description <span className="text-red-500 font-bold">*</span>
        </label>
        <textarea
          rows={4}
          placeholder="What they do, who they serve, what intelligence they need. Used in all LLaMA scoring prompts."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-[#0f172a] text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 resize-y min-h-[90px] font-medium transition-all"
          style={{ borderRadius: "6px" }}
        />
      </div>

      <div className="mt-3 mb-2">
        <div className="text-[11px] font-bold text-slate-500 tracking-wider mb-1.5 uppercase">OFFERINGS</div>
        <div className="border-b border-[#e2e8f0]" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">Focus Products or Services</label>
            <textarea
              rows={2}
              value={focusProducts}
              onChange={(e) => setFocusProducts(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-[#0f172a] text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 transition-all font-medium"
              style={{ borderRadius: "6px" }}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">Competitors</label>
            <textarea
              rows={2}
              value={knownCompetitors}
              onChange={(e) => setKnownCompetitors(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-[#0f172a] text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 transition-all font-medium"
              style={{ borderRadius: "6px" }}
            />
          </div>
      </div>

      <div className="mt-1 mb-1">
        <div className="text-[11px] font-bold text-slate-500 tracking-wider mb-1.5 uppercase">ICP DEFINITION</div>
        <div className="border-b border-[#e2e8f0]" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">Core Sectors</label>
            <textarea
              rows={2}
              value={coreSectors}
              onChange={(e) => setCoreSectors(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-[#0f172a] text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 transition-all font-medium"
              style={{ borderRadius: "6px" }}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">Geographic Focus</label>
            <textarea
              rows={2}
              value={primaryGeographies}
              onChange={(e) => setPrimaryGeographies(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-[#0f172a] text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 transition-all font-medium"
              style={{ borderRadius: "6px" }}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">Sectors to Avoid</label>
            <textarea
              rows={2}
              value={sectorsToAvoid}
              onChange={(e) => setSectorsToAvoid(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-[#0f172a] text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 transition-all font-medium"
              style={{ borderRadius: "6px" }}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#0f172a] mb-1">Designations</label>
            <textarea
              rows={2}
              value={designations}
              onChange={(e) => setDesignations(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] text-[#0f172a] text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 transition-all font-medium"
              style={{ borderRadius: "6px" }}
            />
          </div>
      </div>

      <div className="mt-3 mb-2">
        <div className="flex justify-between items-center mb-1.5">
          <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
            ACCESS DETAILS
          </div>
          <button
            type="button"
            onClick={handleAddAccessUser}
            className="bg-black hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold px-3 py-1 cursor-pointer transition-colors flex items-center gap-1"
            style={{ borderRadius: "6px" }}
          >
            <Plus className="h-3 w-3" /> Add Access User
          </button>
        </div>
        <div className="border-b border-[#e2e8f0]" />
      </div>

      {resetNotice && (
        <div className="mb-3 px-3.5 py-2 bg-green-50 border border-green-200 text-green-700 text-xs flex justify-between items-center" style={{ borderRadius: "6px" }}>
          <span>{resetNotice}</span>
          <button type="button" onClick={() => setResetNotice(null)} className="text-green-500 hover:text-green-700 cursor-pointer">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="border border-[#e2e8f0] mb-3" style={{ borderRadius: "6px" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#f8fafc] z-10">
              <tr className="border-b border-[#e2e8f0] text-[11px] font-semibold text-slate-500 select-none">
                <th className="py-2 px-4 font-sans font-medium text-slate-600">First Name</th>
                <th className="py-2 px-4 font-sans font-medium text-slate-600">Second Name</th>
                <th className="py-2 px-4 font-sans font-medium text-slate-600">Designation</th>
                <th className="py-2 px-4 font-sans font-medium text-slate-600">Email</th>
                <th className="py-2 px-4 font-sans font-medium text-slate-600">Last Active</th>
                <th className="py-2 px-4 font-sans font-medium text-slate-600 text-center">Active</th>
                <th className="py-2 px-4 font-sans font-medium text-slate-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {accessUsers.map((user) => {
                const isEditing = editingRowId === user.id;
                return (
                  <tr key={user.id} className="hover:bg-indigo-50/20 transition-all duration-150">
                    <td className="py-1.5 px-4 text-xs font-semibold text-[#1e293b]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFirstName}
                          placeholder="First name"
                          onChange={(e) => setEditFirstName(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#cbd5e1] text-slate-900 text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-100 placeholder-slate-400 transition-all"
                          style={{ borderRadius: "6px" }}
                        />
                      ) : (
                        <span className="select-text">{user.firstName}</span>
                      )}
                    </td>

                    <td className="py-1.5 px-4 text-xs text-slate-600">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editLastName}
                          placeholder="Second name"
                          onChange={(e) => setEditLastName(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#cbd5e1] text-slate-900 text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-100 placeholder-slate-400 transition-all"
                          style={{ borderRadius: "6px" }}
                        />
                      ) : (
                        <span className="select-text font-semibold text-[#1e293b]">{user.lastName}</span>
                      )}
                    </td>

                    <td className="py-1.5 px-4 text-xs text-slate-600">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDesignation}
                          placeholder="e.g. Senior Analyst"
                          onChange={(e) => setEditDesignation(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#cbd5e1] text-slate-900 text-xs focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-100 placeholder-slate-400 transition-all"
                          style={{ borderRadius: "6px" }}
                        />
                      ) : (
                        <span className="select-text">{user.designation || "—"}</span>
                      )}
                    </td>

                    <td className="py-1.5 px-4 text-xs text-slate-600">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="email"
                            value={editEmail}
                            placeholder="email@company.com"
                            onChange={(e) => setEditEmail(e.target.value)}
                            className={`w-full px-2 py-1 bg-white border text-slate-900 text-xs focus:outline-none focus:ring-4 placeholder-slate-400 transition-all ${
                              rowError === 'This email is already registered' ||
                              rowError === 'email_already_registered' ||
                              rowError === 'This email is already added' ||
                              rowError === 'This email is already registered to another client' ||
                              rowError === 'email_registered_to_other_client'
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                                : 'border-[#cbd5e1] focus:border-[#4f46e5] focus:ring-indigo-100'
                            }`}
                            style={{ borderRadius: "6px" }}
                          />
                          {(rowError === 'This email is already registered' ||
                            rowError === 'email_already_registered' ||
                            rowError === 'This email is already added' ||
                            rowError === 'This email is already registered to another client' ||
                            rowError === 'email_registered_to_other_client') && (
                            <span className="text-[10px] text-red-500 font-semibold leading-tight whitespace-nowrap">
                              {rowError === 'email_registered_to_other_client' || rowError === 'This email is already registered to another client'
                                ? 'This email is already registered to another client'
                                : rowError === 'email_already_registered'
                                ? 'This email is already registered'
                                : rowError}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="select-text">{user.email || "—"}</span>
                      )}
                    </td>

                    <td className="py-1.5 px-4 text-xs text-slate-500 select-text">
                      {user.lastActive || "Never"}
                    </td>

                    <td className="py-1.5 px-4 text-xs text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleUserActive(user.id)}
                        className={`relative inline-flex h-4 w-7 items-center shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${user.active ? 'bg-[#22c55e]' : 'bg-slate-200'}`}
                      >
                        <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out ${user.active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>

                    <td className="py-1.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveEditRow(user.id)}
                              disabled={isSavingRow}
                              className={`px-2 py-1 bg-black hover:bg-slate-800 text-white text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${isSavingRow ? 'opacity-50 cursor-not-allowed' : ''}`}
                              style={{ borderRadius: "6px" }}
                            >
                              {isSavingRow ? (
                                <>
                                  <span className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  Inviting...
                                </>
                              ) : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditRow}
                              disabled={isSavingRow}
                              className="px-2 py-1 border border-[#cbd5e1] hover:bg-slate-50 text-slate-700 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              style={{ borderRadius: "6px" }}
                            >
                              Cancel
                            </button>
                          </div>
                          {rowError &&
                            rowError !== 'This email is already registered' &&
                            rowError !== 'email_already_registered' &&
                            rowError !== 'This email is already added' &&
                            rowError !== 'This email is already registered to another client' &&
                            rowError !== 'email_registered_to_other_client' && (
                            <span className="text-[9px] text-red-500 font-bold max-w-[130px] text-right leading-tight">
                              {rowError}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditRow(user)}
                            className="p-1 text-slate-500 hover:text-black hover:bg-slate-50 transition-all rounded-[6px] cursor-pointer relative group"
                            style={{ borderRadius: "6px" }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                              Edit Access User
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePasswordReset(user.email)}
                            className="p-1 text-slate-500 hover:text-green-600 hover:bg-slate-50 transition-all rounded-[6px] cursor-pointer relative group"
                            style={{ borderRadius: "6px" }}
                          >
                            <Key className="h-3.5 w-3.5" />
                            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                              Send Password Reset Email
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id || isSavingRow}
                            className={`p-1 text-slate-500 hover:text-red-650 hover:bg-slate-50 transition-all rounded-[6px] cursor-pointer relative group ${
                              deletingUserId === user.id ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                            style={{ borderRadius: "6px" }}
                          >
                            {deletingUserId === user.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin block"></span>
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                              {deletingUserId === user.id ? "Deleting User..." : "Delete Access User"}
                            </span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {accessUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 bg-slate-50/30">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users className="h-6 w-6 text-slate-300" />
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-500">No Access Users Configured</p>
                        <p className="text-[10px] text-slate-400 mt-1">Initially there won't be users. Click below to add your first administrator.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddAccessUser}
                        className="mt-2 bg-black hover:bg-slate-800 text-white text-[11px] font-bold px-4 py-1.5 cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                        style={{ borderRadius: "6px" }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Access User
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
