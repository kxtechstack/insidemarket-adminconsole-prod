import { Customer } from "../../types";

// Helper to format last active timestamp from Supabase
export const formatLastActive = (dateVal?: string | null): string => {
  if (!dateVal || dateVal === "Never" || dateVal === "null" || dateVal === "undefined") {
    return "Never";
  }
  const str = String(dateVal).trim();
  if (!str) return "Never";

  if (str.includes("T") || (str.includes("-") && str.length >= 10)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
  }

  return str;
};

// Helper to count enabled service subscriptions from enabled_modules JSONB
export const getServiceSubscriptionsCount = (c: Customer): number => {
  const enabled = c.enabled_modules ?? c.enabledModules ?? c.monitoringConfig?.enabledModules;
  if (!enabled) return 0;

  if (Array.isArray(enabled)) {
    return enabled.filter(Boolean).length;
  }

  if (typeof enabled === 'object') {
    return Object.values(enabled).filter(Boolean).length;
  }

  if (typeof enabled === 'string') {
    try {
      const parsed = JSON.parse(enabled);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).length;
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.values(parsed).filter(Boolean).length;
      }
    } catch (e) {}
  }

  return 0;
};

// Helper to obtain client design statistics dynamically loaded from Supabase PostgreSQL database
export const getClientMeta = (c: Customer) => {
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

  // Count active service subscriptions from enabled_modules
  const subscriptions = getServiceSubscriptionsCount(c);
  const lastActive = formatLastActive(c.last_active ?? c.lastActive);
  const location = c.location || "London, UK";

  return { 
    users: userCount, 
    subscriptions, 
    lastActive, 
    location 
  };
};
