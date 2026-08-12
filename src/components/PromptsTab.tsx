/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptTemplate, Customer, ActivityLog } from "../types";

interface PromptsTabProps {
  prompts: PromptTemplate[];
  customers: Customer[];
}

export default function PromptsTab({
  prompts,
  customers
}: PromptsTabProps) {
  return (
    <div className="p-6">
      <div className="bg-white border border-[#e5e7eb] p-12 rounded-[6px] flex flex-col items-center justify-center text-center">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prompts Sandbox Content Removed</p>
      </div>
    </div>
  );
}
