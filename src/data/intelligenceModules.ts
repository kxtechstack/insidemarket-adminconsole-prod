import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  TrendingUp, Lightbulb, Crosshair, MessageSquare, Shield, Eye,
  LucideIcon, ShoppingBag, Building2, Users, Globe, GitMerge,
  Cpu, DollarSign, UserCheck, Package, Tag, MapPin, Building,
  Brain, Speaker, Target, Smile, ShoppingCart, AlertTriangle,
  Radio, Gavel, Scale, Leaf, Telescope, BarChart, Microscope,
  Calendar, Layers, ArrowRightLeft, FileText, Layers2
} from "lucide-react";

export interface IntelligenceItem {
  id: string;
  label: string;
}

export interface IntelligenceCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  items: any[];
}

export interface IntelligenceModule {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  description: string;
  categories: IntelligenceCategory[];
}

const UI_MAPPINGS = [
  { icon: TrendingUp, color: '#0F6B4F', bg: '#EDFAF4' },
  { icon: Lightbulb, color: '#1D4ED8', bg: '#EEF3FF' },
  { icon: Crosshair, color: '#9A3412', bg: '#FFF3EE' },
  { icon: MessageSquare, color: '#7E22CE', bg: '#F5F0FF' },
  { icon: Shield, color: '#B45309', bg: '#FFFBEB' },
  { icon: Eye, color: '#0E7490', bg: '#F0FAFA' }
];

const CATEGORY_ICONS = [
  DollarSign, Building, ArrowRightLeft, BarChart, Cpu, GitMerge,
  Globe, Users, UserCheck, TrendingUp, FileText, Calendar, Layers
];

let cachedModules: IntelligenceModule[] | null = null;
let cachedPromise: Promise<IntelligenceModule[]> | null = null;

export function useIntelligenceModules() {
  const [modules, setModules] = useState<IntelligenceModule[]>(cachedModules || []);
  const [loading, setLoading] = useState(!cachedModules);

  useEffect(() => {
    if (cachedModules) {
      setModules(cachedModules);
      setLoading(false);
      return;
    }

    if (!cachedPromise) {
      cachedPromise = (async () => {
        const { data: dbModules, error: e1 } = await supabase.schema('admin').from('modules').select('*');
        if (e1) throw e1;
        const { data: dbSubmodules, error: e2 } = await supabase.schema('admin').from('submodules').select('*');
        if (e2) throw e2;
        const { data: dbSignals, error: e3 } = await supabase.schema('admin').from('signals').select('*');
        if (e3) throw e3;

        const transformed: IntelligenceModule[] = (dbModules || []).map((mod: any, i: number) => {
          const mapping = UI_MAPPINGS[i % UI_MAPPINGS.length];
          const submods = (dbSubmodules || []).filter((s: any) => s.module_id === mod.id);
          
          const categories: IntelligenceCategory[] = submods.map((sub: any, subI: number) => {
            const sigs = (dbSignals || []).filter((sig: any) => sig.submodule_id === sub.id);
            
            return {
              id: sub.id,
              name: sub.submodule_name,
              icon: CATEGORY_ICONS[subI % CATEGORY_ICONS.length],
              items: sigs
            };
          });

          return {
            id: mod.id,
            label: mod.module_name,
            icon: mapping.icon,
            color: mapping.color,
            bg: mapping.bg,
            description: `Signals and intelligence related to ${mod.module_name}.`,
            categories
          };
        });

        return transformed;
      })();
    }

    cachedPromise.then((transformed) => {
      cachedModules = transformed;
      setModules(transformed);
      setLoading(false);
    }).catch(e => {
      console.error("Error fetching intelligence modules:", e);
      cachedPromise = null;
      setLoading(false);
    });
  }, []);

  return { modules, loading };
}

