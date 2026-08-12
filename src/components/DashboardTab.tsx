/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardStats } from "../types";

interface DashboardTabProps {
  stats: DashboardStats | null;
  onRefresh: () => void;
  loading: boolean;
}

export default function DashboardTab({ stats, onRefresh, loading }: DashboardTabProps) {
  return (
    <div className="p-6">
      <div className="bg-white border border-[#e2e8f0] p-12 rounded-[6px] flex flex-col items-center justify-center text-center">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dashboard Content Removed</p>
      </div>
    </div>
  );
}
