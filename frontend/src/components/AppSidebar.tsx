import {
  Activity,
  Building,
  Clock,
  FileSpreadsheet,
  FileText,
  Layers,
  Lock,
  MessageCircle,
  Pill,
  Receipt,
  Settings,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import type { TabType } from "../types";

interface AppSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  ticketCount: number;
  userRole: "ADMINISTRADOR" | "RECEPCIONISTA" | "FARMACIA";
  userName: string;
  onTriggerAdminMode: () => void;
  onLogout: () => void;
}

export function AppSidebar({
  activeTab,
  onTabChange,
  ticketCount,
  userRole,
  userName,
  onTriggerAdminMode,
  onLogout,
}: AppSidebarProps) {
  const tabs: Array<{
    id: TabType;
    label: string;
    icon: typeof Receipt;
    badge?: string | number;
    group: string;
  }> = [
    {
      id: "pos",
      label: "Admisión & POS",
      icon: Receipt,
      badge: "F1-F4",
      group: "core",
    },
    {
      id: "cola",
      label: "Cola de Espera",
      icon: Activity,
      badge: ticketCount,
      group: "core",
    },
    {
      id: "comprobantes",
      label: "Comprobantes Médicos",
      icon: FileText,
      group: "core",
    },
    { id: "cierre", label: "Arqueo de Caja", icon: Wallet, group: "core" },
    {
      id: "egresos",
      label: "Egresos & Gastos",
      icon: TrendingUp,
      group: "core",
    },
    { id: "alquileres", label: "Alquileres", icon: Building, group: "avanzada" },
    {
      id: "liquidaciones",
      label: "Liquidación Médicos",
      icon: UserCheck,
      group: "avanzada",
    },
    {
      id: "estadisticas",
      label: "Estadísticas",
      icon: Stethoscope,
      group: "avanzada",
    },
    {
      id: "reportes",
      label: "Reportes WhatsApp",
      icon: MessageCircle,
      group: "avanzada",
    },
    {
      id: "tarifario",
      label: "Tarifario Oficial",
      icon: Layers,
      group: "admin",
    },
    {
      id: "importer",
      label: "Importador Excel",
      icon: FileSpreadsheet,
      badge: "Masivo",
      group: "admin",
    },
    {
      id: "admin",
      label: "Configuración & Admin",
      icon: Settings,
      group: "admin",
    },
    {
      id: "farmacia",
      label: "Farmacia & Kardex",
      icon: Pill,
      group: "farmacia",
    },
  ];

  const groups = [
    { key: "core", label: "Operaciones" },
    { key: "avanzada", label: "Gestión Avanzada" },
    { key: "admin", label: "Administración" },
    { key: "farmacia", label: "Farmacia" },
  ];

  const visibleTabs = tabs.filter((tab) => {
    if (userRole === "RECEPCIONISTA" && (tab.group === "admin" || tab.group === "farmacia")) {
      return false;
    }
    if (userRole === "FARMACIA" && tab.group !== "farmacia") {
      return false; // El rol FARMACIA solo ve el módulo de farmacia
    }
    return true;
  });

  const visibleGroups = groups.filter((group) => {
    if (userRole === "RECEPCIONISTA" && (group.key === "admin" || group.key === "farmacia")) {
      return false;
    }
    if (userRole === "FARMACIA" && group.key !== "farmacia") {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-zinc-200 flex flex-col z-30 h-screen sticky top-0">
      <div className="p-5 border-b border-zinc-200 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-zinc-900 text-zinc-50 flex items-center justify-center">
          <Stethoscope className="h-5 w-5 stroke-[2]" />
        </div>
        <div>
          <h1 className="font-semibold text-sm text-zinc-900 tracking-tight">
            Centro Médico
          </h1>
          <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider block mt-0.5 max-w-max">
            Local LAN • Perú
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {visibleGroups.map((group) => {
          const groupTabs = visibleTabs.filter((t) => t.group === group.key);
          return (
            <div key={group.key}>
              <div className="px-3 mb-1">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  {group.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {groupTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-semibold text-xs transition-all ${
                        isActive
                          ? "bg-zinc-900 text-zinc-50 shadow-sm"
                          : "text-zinc-650 hover:text-zinc-950 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 ${isActive ? "text-zinc-50" : "text-zinc-400"}`}
                        />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge !== undefined && (
                        <span
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                              : "bg-zinc-150 text-zinc-600"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 space-y-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
              Usuario Activo
            </span>
            <button
              onClick={onLogout}
              className="text-[9px] text-red-600 hover:text-red-500 font-semibold"
            >
              Cerrar Sesión
            </button>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-zinc-900 leading-tight">
              {userName}
            </span>
            <span
              className={`text-[9px] font-medium max-w-max px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wider ${
                userRole === "ADMINISTRADOR"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : userRole === "FARMACIA"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-sky-100 text-sky-800 border border-sky-200"
              }`}
            >
              {userRole === "ADMINISTRADOR" ? "Administrador" : userRole === "FARMACIA" ? "Farmacia" : "Recepcionista"}
            </span>
          </div>
        </div>

        {userRole === "RECEPCIONISTA" && (
          <button
            onClick={onTriggerAdminMode}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[11px] transition-all"
          >
            <Lock className="h-3 w-3" /> Modo Administrador
          </button>
        )}

        {userRole === "ADMINISTRADOR" && (
          <button
            onClick={onTriggerAdminMode}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold text-[11px] transition-all"
          >
            <Lock className="h-3 w-3 text-zinc-500" /> Salir de Modo Admin
          </button>
        )}

        <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 pt-2 border-t border-zinc-200/80">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <Building className="h-3 w-3" /> Servidor OK
          </span>
          <span className="flex items-center gap-1 font-semibold">
            <Clock className="h-3 w-3 text-zinc-400" />{" "}
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </aside>
  );
}
