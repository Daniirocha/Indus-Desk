/**
 * IndusDesk — Sistema Inteligente de Gestão de Chamados de TI
 * Stack: React + Tailwind (login) + Recharts + jsPDF / SheetJS + API REST (Express + SQLite)
 * Paleta: Chinese Black, Police Blue, Rackley, Weldon Blue, Silver Pink
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { apiGet, apiPatch, apiPost } from "./api.js";

// ─── PALETA DE CORES ────────────────────────────────────────────────────────
const C = {
  bg:        "#0E141C", // Chinese Black
  primary:   "#314B6E", // Police Blue
  secondary: "#607EA2", // Rackley
  card:      "#8197AC", // Weldon Blue
  text:      "#BDB3A3", // Silver Pink
  surface:   "#111923", // fundo levemente mais claro
  border:    "#1E2D3E", // borda sutil
  success:   "#3DA678",
  warning:   "#E8A838",
  danger:    "#D95B5B",
  info:      "#4E9FD1",
};

// ─── LISTA DE TÉCNICOS (UI) ──────────────────────────────────────────────────
const TECNICOSS = ["Carlos Mendes", "Ana Lima", "Roberto Faria", "Juliana Costa"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtData = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const diffHoras = (d1, d2) => {
  if (!d1 || !d2) return null;
  return Math.round((new Date(d2) - new Date(d1)) / 36e5 * 10) / 10;
};

const CORES_STATUS = {
  "Aberto":       C.danger,
  "Em andamento": C.warning,
  "Resolvido":    C.success,
};
const CORES_PRIORIDADE = {
  "alta":  C.danger,
  "média": C.warning,
  "baixa": C.success,
};
const LABEL_CAT = {
  hardware: "Hardware", software: "Software",
  comunicação: "Comunicação", rede: "Rede",
};

function gerarRelatorioPDF(chamados) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text("IndusDesk — Relatório de Chamados de TI", 14, 16);
  const body = chamados.map((c) => [
    String(c.id).padStart(4, "0"),
    c.usuario,
    LABEL_CAT[c.categoria] || c.categoria,
    c.prioridade,
    c.status,
    c.tecnico || "—",
    fmtData(c.data),
  ]);
  autoTable(doc, {
    startY: 24,
    head: [["ID", "Usuário", "Categoria", "Prioridade", "Status", "Técnico", "Data"]],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [49, 75, 110] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  doc.save("indusdesk_relatorio.pdf");
}

function gerarRelatorioXlsx(chamados) {
  const rows = chamados.map((c) => ({
    ID: c.id,
    Usuário: c.usuario,
    Descrição: c.descricao,
    Categoria: LABEL_CAT[c.categoria] || c.categoria,
    Prioridade: c.prioridade,
    Status: c.status,
    Técnico: c.tecnico || "",
    "Data abertura": fmtData(c.data),
    "Data resolução": c.dataResolucao ? fmtData(c.dataResolucao) : "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Chamados");
  XLSX.writeFile(wb, "indusdesk_relatorio.xlsx");
}

// ─── ÍCONES SVG INLINE ────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    dashboard: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>,
    ticket:    <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
    add:       <><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></>,
    tools:     <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
    history:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    report:    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    logout:    <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    bell:      <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    filter:    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
    edit:      <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    comment:   <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
    download:  <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    check:     <polyline points="20 6 9 17 4 12"/>,
    x:         <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    user:      <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    gear:      <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    tag:       <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    clock:     <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    wifi:      <><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    monitor:   <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    mail:      <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    cpu:       <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
    back:      <><polyline points="15 18 9 12 15 6"/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    send:      <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ─── BADGE DE STATUS ──────────────────────────────────────────────────────────
const BadgeStatus = ({ status }) => (
  <span style={{
    background: CORES_STATUS[status] + "22",
    color: CORES_STATUS[status],
    border: `1px solid ${CORES_STATUS[status]}44`,
    borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
    letterSpacing: "0.5px", whiteSpace: "nowrap",
  }}>{status}</span>
);

const BadgePrioridade = ({ p }) => (
  <span style={{
    background: CORES_PRIORIDADE[p] + "22",
    color: CORES_PRIORIDADE[p],
    border: `1px solid ${CORES_PRIORIDADE[p]}44`,
    borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
    textTransform: "capitalize",
  }}>{p}</span>
);

const BadgeCat = ({ cat }) => {
  const icones = { hardware: "cpu", software: "monitor", comunicação: "mail", rede: "wifi" };
  return (
    <span style={{
      background: C.primary + "44", color: C.secondary,
      border: `1px solid ${C.primary}`, borderRadius: 6,
      padding: "2px 10px", fontSize: 12, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <Icon name={icones[cat] || "tag"} size={12} color={C.secondary} />
      {LABEL_CAT[cat]}
    </span>
  );
};

// ─── COMPONENTE: TOAST NOTIFICATION ──────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "success" ? C.success : type === "error" ? C.danger : C.info;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: bg + "EE", color: "#fff", borderRadius: 10,
      padding: "14px 22px", fontWeight: 600, fontSize: 14,
      boxShadow: `0 4px 24px ${bg}55`,
      animation: "fadeInUp 0.3s ease",
      display: "flex", alignItems: "center", gap: 10, maxWidth: 340,
    }}>
      <Icon name={type === "success" ? "check" : "alert"} size={18} color="#fff" />
      {msg}
    </div>
  );
};

// ─── MODAL GENÉRICO ────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, width = 640 }) => (
  <div style={{
    position: "fixed", inset: 0, background: "#000A", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  }} onClick={onClose}>
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "90vh",
      overflowY: "auto", padding: 32, position: "relative",
      boxShadow: `0 24px 80px #000A`,
    }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.text }}>
          <Icon name="x" size={22} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── INPUT ESTILIZADO ─────────────────────────────────────────────────────────
const Input = ({ label, value, onChange, type = "text", placeholder, required, opts, disabled }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <label style={{ color: C.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
      {label}{required && <span style={{ color: C.danger }}> *</span>}
    </label>}
    {opts ? (
      <select value={value} onChange={onChange} disabled={disabled} style={{
        width: "100%", background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 8, color: value ? "#fff" : C.text, padding: "10px 14px",
        fontSize: 14, outline: "none", cursor: "pointer",
      }}>
        {opts.map(o => <option key={o.v} value={o.v} style={{ background: C.bg }}>{o.l}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        style={{
          width: "100%", background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 8, color: "#fff", padding: "10px 14px",
          fontSize: 14, outline: "none", boxSizing: "border-box",
        }} />
    )}
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 4, required }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <label style={{ color: C.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
      {label}{required && <span style={{ color: C.danger }}> *</span>}
    </label>}
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{
        width: "100%", background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 8, color: "#fff", padding: "10px 14px",
        fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box",
        fontFamily: "inherit",
      }} />
  </div>
);

// ─── BOTÃO ESTILIZADO ─────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", icon, small, disabled, style: sx = {} }) => {
  const variants = {
    primary:   { background: C.primary, color: "#fff", border: `1px solid ${C.secondary}` },
    secondary: { background: "transparent", color: C.text, border: `1px solid ${C.border}` },
    success:   { background: C.success + "22", color: C.success, border: `1px solid ${C.success}55` },
    danger:    { background: C.danger + "22", color: C.danger, border: `1px solid ${C.danger}55` },
    warning:   { background: C.warning + "22", color: C.warning, border: `1px solid ${C.warning}55` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant],
      borderRadius: 8, padding: small ? "6px 14px" : "10px 20px",
      fontWeight: 600, fontSize: small ? 13 : 14, cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex", alignItems: "center", gap: 8,
      transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
      ...sx,
    }}>
      {icon && <Icon name={icon} size={small ? 14 : 16} color="currentColor" />}
      {children}
    </button>
  );
};

// ─── CARD STAT ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, sub }) => (
  <div style={{
    background: `linear-gradient(135deg, ${C.surface} 0%, ${C.primary}22 100%)`,
    border: `1px solid ${color}33`,
    borderRadius: 14, padding: "22px 24px",
    display: "flex", alignItems: "flex-start", gap: 16,
    boxShadow: `0 4px 20px #0006`,
    flex: 1, minWidth: 180,
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: color + "22", border: `1px solid ${color}44`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon name={icon} size={22} color={color} />
    </div>
    <div>
      <div style={{ color: C.text, fontSize: 13, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: color, fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINAS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const PageDashboard = ({ chamados }) => {
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const total    = chamados.length;
  const abertos  = chamados.filter(c => c.status === "Aberto").length;
  const andamento= chamados.filter(c => c.status === "Em andamento").length;
  const resolvidos= chamados.filter(c => c.status === "Resolvido").length;

  // Dados gráfico por categoria
  const dadosCat = ["hardware", "software", "comunicação", "rede"].map(cat => ({
    name: LABEL_CAT[cat],
    total: chamados.filter(c => c.categoria === cat).length,
    resolvidos: chamados.filter(c => c.categoria === cat && c.status === "Resolvido").length,
  }));

  // Dados gráfico por prioridade
  const dadosPrio = [
    { name: "Alta",  value: chamados.filter(c => c.prioridade === "alta").length,  fill: C.danger },
    { name: "Média", value: chamados.filter(c => c.prioridade === "média").length, fill: C.warning },
    { name: "Baixa", value: chamados.filter(c => c.prioridade === "baixa").length, fill: C.success },
  ];

  // Chamados filtrados para tabela
  const filtrados = chamados.filter(c => {
    if (filtroStatus && c.status !== filtroStatus) return false;
    if (filtroCategoria && c.categoria !== filtroCategoria) return false;
    if (filtroData && !c.data.startsWith(filtroData)) return false;
    return true;
  });

  return (
    <div>
      {/* Cabeçalho da página */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: C.text, fontSize: 14, margin: "4px 0 0" }}>
          Visão geral do sistema de chamados — atualizado agora
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard label="Total de Chamados" value={total}    icon="ticket"  color={C.secondary} sub="Todos os registros" />
        <StatCard label="Abertos"            value={abertos}  icon="alert"   color={C.danger}    sub="Aguardando atendimento" />
        <StatCard label="Em Andamento"       value={andamento}icon="gear"    color={C.warning}   sub="Em atendimento" />
        <StatCard label="Resolvidos"         value={resolvidos}icon="check"  color={C.success}   sub="Concluídos com sucesso" />
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Chamados por categoria */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: 24,
        }}>
          <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 20px" }}>
            Chamados por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosCat} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" stroke={C.text} fontSize={12} />
              <YAxis stroke={C.text} fontSize={12} />
              <Tooltip
                contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}
                labelStyle={{ color: "#fff" }} itemStyle={{ color: C.text }}
              />
              <Legend wrapperStyle={{ color: C.text, fontSize: 12 }} />
              <Bar dataKey="total" name="Total" fill={C.secondary} radius={[6,6,0,0]} />
              <Bar dataKey="resolvidos" name="Resolvidos" fill={C.success} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por prioridade */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: 24,
        }}>
          <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 20px" }}>
            Distribuição por Prioridade
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dadosPrio} cx="50%" cy="50%" outerRadius={80}
                dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {dadosPrio.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}
                labelStyle={{ color: "#fff" }} itemStyle={{ color: C.text }}
              />
              <Legend wrapperStyle={{ color: C.text, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: 20, marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.text, fontSize: 13, fontWeight: 600 }}>
            <Icon name="filter" size={16} /> Filtros:
          </div>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, padding: "7px 14px", fontSize: 13, cursor: "pointer",
          }}>
            <option value="">Todos os status</option>
            <option>Aberto</option><option>Em andamento</option><option>Resolvido</option>
          </select>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.text, padding: "7px 14px", fontSize: 13, cursor: "pointer",
          }}>
            <option value="">Todas as categorias</option>
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="comunicação">Comunicação</option>
            <option value="rede">Rede</option>
          </select>
          <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
            style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
              color: C.text, padding: "7px 14px", fontSize: 13, cursor: "pointer",
            }} />
          {(filtroStatus || filtroCategoria || filtroData) && (
            <Btn variant="secondary" small onClick={() => { setFiltroStatus(""); setFiltroCategoria(""); setFiltroData(""); }}>
              Limpar filtros
            </Btn>
          )}
        </div>
      </div>

      {/* Tabela de chamados recentes */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0 }}>
            Chamados Recentes
          </h3>
          <span style={{ color: C.text, fontSize: 13 }}>{filtrados.length} registros</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.primary + "33" }}>
                {["#ID", "Usuário", "Categoria", "Prioridade", "Status", "Técnico", "Data"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: C.text, fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: C.text }}>Nenhum chamado encontrado.</td></tr>
              ) : filtrados.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? "transparent" : C.primary + "11", transition: "background 0.15s" }}>
                  <td style={{ padding: "12px 16px", color: C.secondary, fontWeight: 700, fontSize: 13 }}>#{c.id.toString().padStart(4,"0")}</td>
                  <td style={{ padding: "12px 16px", color: "#fff", fontSize: 13 }}>{c.usuario}</td>
                  <td style={{ padding: "12px 16px" }}><BadgeCat cat={c.categoria} /></td>
                  <td style={{ padding: "12px 16px" }}><BadgePrioridade p={c.prioridade} /></td>
                  <td style={{ padding: "12px 16px" }}><BadgeStatus status={c.status} /></td>
                  <td style={{ padding: "12px 16px", color: C.text, fontSize: 13 }}>{c.tecnico || <span style={{ color: C.border }}>—</span>}</td>
                  <td style={{ padding: "12px 16px", color: C.text, fontSize: 12, whiteSpace: "nowrap" }}>{fmtData(c.data)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── NOVO CHAMADO ─────────────────────────────────────────────────────────────
const PageNovoChamado = ({ onSubmit }) => {
  const [form, setForm] = useState({
    usuario: "", descricao: "", categoria: "hardware", prioridade: "média", imagem: null
  });
  const [preview, setPreview] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const fileRef = useRef();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleImagem = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, imagem: file.name }));
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!form.usuario.trim() || !form.descricao.trim()) return;
    onSubmit({ ...form, preview });
    setEnviado(true);
  };

  if (enviado) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20 }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.success + "22", border: `2px solid ${C.success}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="check" size={40} color={C.success} />
      </div>
      <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Chamado Registrado!</h2>
      <p style={{ color: C.text, textAlign: "center", maxWidth: 400 }}>
        Seu chamado foi registrado com sucesso. O time de TI irá analisá-lo e entrará em contato em breve.
      </p>
      <Btn icon="plus" onClick={() => { setEnviado(false); setForm({ usuario: "", descricao: "", categoria: "hardware", prioridade: "média", imagem: null }); setPreview(null); }}>
        Abrir Novo Chamado
      </Btn>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Novo Chamado</h1>
        <p style={{ color: C.text, fontSize: 14, margin: "4px 0 0" }}>Registre um problema técnico para atendimento</p>
      </div>

      <div style={{ maxWidth: 680, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32 }}>
        {/* Linha 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Seu nome / usuário" value={form.usuario} onChange={set("usuario")} placeholder="Ex: João Silva" required />
          <Input label="Categoria" value={form.categoria} onChange={set("categoria")} required opts={[
            { v: "hardware", l: "🖥️  Hardware" },
            { v: "software", l: "💾  Software" },
            { v: "comunicação", l: "📡  Comunicação" },
            { v: "rede", l: "🌐  Rede" },
          ]} />
        </div>

        {/* Prioridade */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: C.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>
            Prioridade <span style={{ color: C.danger }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {[["alta", C.danger, "🔴"], ["média", C.warning, "🟡"], ["baixa", C.success, "🟢"]].map(([val, cor, emoji]) => (
              <button key={val} onClick={() => setForm(f => ({ ...f, prioridade: val }))}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                  fontSize: 14, border: `2px solid`,
                  borderColor: form.prioridade === val ? cor : C.border,
                  background: form.prioridade === val ? cor + "22" : "transparent",
                  color: form.prioridade === val ? cor : C.text,
                  textTransform: "capitalize", transition: "all 0.2s",
                }}>
                {emoji} {val}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <Textarea label="Descrição do problema" value={form.descricao} onChange={set("descricao")}
          placeholder="Descreva o problema com detalhes: o que aconteceu, quando começou, qual equipamento está afetado..." required rows={5} />

        {/* Upload de imagem */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: C.text, fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
            Anexar imagem (print ou foto)
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${preview ? C.secondary : C.border}`,
              borderRadius: 10, padding: "20px", cursor: "pointer",
              textAlign: "center", background: preview ? C.primary + "11" : "transparent",
              transition: "all 0.2s",
            }}>
            {preview ? (
              <div>
                <img src={preview} alt="preview" style={{ maxHeight: 160, borderRadius: 8, marginBottom: 8 }} />
                <div style={{ color: C.secondary, fontSize: 13 }}>✓ {form.imagem}</div>
              </div>
            ) : (
              <div>
                <Icon name="download" size={28} color={C.border} />
                <div style={{ color: C.text, fontSize: 13, marginTop: 8 }}>Clique ou arraste uma imagem aqui</div>
                <div style={{ color: C.border, fontSize: 11, marginTop: 4 }}>PNG, JPG, GIF — máx. 5MB</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImagem} style={{ display: "none" }} />
        </div>

        {/* Informação de data */}
        <div style={{
          background: C.primary + "22", border: `1px solid ${C.primary}55`,
          borderRadius: 8, padding: "10px 16px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Icon name="clock" size={16} color={C.secondary} />
          <span style={{ color: C.text, fontSize: 13 }}>
            Data do chamado: <strong style={{ color: "#fff" }}>{new Date().toLocaleString("pt-BR")}</strong>
            &nbsp;— Status inicial: <strong style={{ color: C.danger }}>Aberto</strong>
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Btn icon="send" onClick={handleSubmit} disabled={!form.usuario.trim() || !form.descricao.trim()}>
            Registrar Chamado
          </Btn>
          <Btn variant="secondary" onClick={() => setForm({ usuario: "", descricao: "", categoria: "hardware", prioridade: "média", imagem: null })}>
            Limpar
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ─── ÁREA TI ──────────────────────────────────────────────────────────────────
const PageAreaTI = ({ chamados, onAtualizar, showToast }) => {
  const [selecionado, setSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalAtualizar, setModalAtualizar] = useState(null);
  const [formAtt, setFormAtt] = useState({ status: "", tecnico: "", comentario: "", solucao: "" });

  const filtrados = chamados.filter(c => {
    if (filtroStatus && c.status !== filtroStatus) return false;
    if (busca && !c.usuario.toLowerCase().includes(busca.toLowerCase()) &&
        !c.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const abrirModal = (chamado) => {
    setModalAtualizar(chamado);
    setFormAtt({ status: chamado.status, tecnico: chamado.tecnico || "", comentario: "", solucao: "" });
  };

  const salvarAtualizacao = async () => {
    const agora = new Date().toISOString();
    const comentarios = [...(modalAtualizar.comentarios || [])];
    if (formAtt.comentario.trim()) {
      comentarios.push({ autor: formAtt.tecnico || "TI", texto: formAtt.comentario, data: agora });
    }
    if (formAtt.solucao.trim()) {
      comentarios.push({ autor: formAtt.tecnico || "TI", texto: `✅ Solução aplicada: ${formAtt.solucao}`, data: agora });
    }
    try {
      await onAtualizar({
        ...modalAtualizar,
        status: formAtt.status,
        tecnico: formAtt.tecnico || modalAtualizar.tecnico,
        comentarios,
        dataResolucao: formAtt.status === "Resolvido" ? agora : modalAtualizar.dataResolucao,
      });
      showToast("Chamado atualizado com sucesso!", "success");
      setModalAtualizar(null);
      setSelecionado(null);
    } catch {
      /* erro já exibido em atualizarChamado */
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Área do TI</h1>
        <p style={{ color: C.text, fontSize: 14, margin: "4px 0 0" }}>Gerencie, atribua e resolva os chamados</p>
      </div>

      {/* Barra de ferramentas */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "14px 20px", marginBottom: 20,
        display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Icon name="search" size={16} color={C.text} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar chamado..." style={{
              width: "100%", background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 8, color: "#fff", padding: "9px 14px 9px 38px",
              fontSize: 13, outline: "none", boxSizing: "border-box",
            }} />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.text, padding: "9px 14px", fontSize: 13, cursor: "pointer",
        }}>
          <option value="">Todos os status</option>
          <option>Aberto</option><option>Em andamento</option><option>Resolvido</option>
        </select>
        <span style={{ color: C.text, fontSize: 13 }}>{filtrados.length} chamados</span>
      </div>

      {/* Lista de chamados */}
      <div style={{ display: "grid", gridTemplateColumns: selecionado ? "1fr 400px" : "1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtrados.map(c => (
            <div key={c.id}
              onClick={() => setSelecionado(selecionado?.id === c.id ? null : c)}
              style={{
                background: selecionado?.id === c.id ? C.primary + "33" : C.surface,
                border: `1px solid ${selecionado?.id === c.id ? C.secondary : C.border}`,
                borderRadius: 12, padding: "16px 20px", cursor: "pointer",
                transition: "all 0.2s",
                borderLeft: `4px solid ${CORES_STATUS[c.status]}`,
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.secondary, fontWeight: 800, fontSize: 14 }}>#{c.id.toString().padStart(4,"0")}</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{c.usuario}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <BadgePrioridade p={c.prioridade} />
                  <BadgeStatus status={c.status} />
                </div>
              </div>
              <p style={{ color: C.text, fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>
                {c.descricao.length > 110 ? c.descricao.slice(0, 110) + "..." : c.descricao}
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <BadgeCat cat={c.categoria} />
                {c.tecnico && (
                  <span style={{ color: C.text, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="user" size={12} /> {c.tecnico}
                  </span>
                )}
                <span style={{ color: C.border, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="clock" size={12} color={C.border} /> {fmtData(c.data)}
                </span>
                <span style={{ color: C.border, fontSize: 12 }}>
                  💬 {c.comentarios?.length || 0}
                </span>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div style={{ textAlign: "center", padding: 48, color: C.text }}>
              Nenhum chamado encontrado.
            </div>
          )}
        </div>

        {/* Painel de detalhes */}
        {selecionado && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: 24, position: "sticky", top: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ color: C.secondary, fontWeight: 800 }}>#{selecionado.id.toString().padStart(4,"0")}</span>
              <button onClick={() => setSelecionado(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text }}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{selecionado.usuario}</h3>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>{selecionado.descricao}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.text, fontSize: 12 }}>Categoria</span>
                <BadgeCat cat={selecionado.categoria} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.text, fontSize: 12 }}>Prioridade</span>
                <BadgePrioridade p={selecionado.prioridade} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.text, fontSize: 12 }}>Status</span>
                <BadgeStatus status={selecionado.status} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.text, fontSize: 12 }}>Técnico</span>
                <span style={{ color: "#fff", fontSize: 12 }}>{selecionado.tecnico || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.text, fontSize: 12 }}>Aberto em</span>
                <span style={{ color: "#fff", fontSize: 12 }}>{fmtData(selecionado.data)}</span>
              </div>
              {selecionado.dataResolucao && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: C.text, fontSize: 12 }}>Resolvido em</span>
                  <span style={{ color: C.success, fontSize: 12 }}>
                    {fmtData(selecionado.dataResolucao)} ({diffHoras(selecionado.data, selecionado.dataResolucao)}h)
                  </span>
                </div>
              )}
            </div>

            {selecionado.preview && (
              <img src={selecionado.preview} alt="anexo" style={{ width: "100%", borderRadius: 8, marginBottom: 16 }} />
            )}

            {/* Histórico de comentários */}
            {selecionado.comentarios?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: C.text, fontSize: 12, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="comment" size={14} /> Histórico
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selecionado.comentarios.map((cm, i) => (
                    <div key={i} style={{
                      background: C.bg, borderRadius: 8, padding: "10px 12px",
                      border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: C.secondary, fontSize: 11, fontWeight: 700 }}>{cm.autor}</span>
                        <span style={{ color: C.border, fontSize: 11 }}>{fmtData(cm.data)}</span>
                      </div>
                      <p style={{ color: C.text, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{cm.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Btn icon="edit" onClick={() => abrirModal(selecionado)} style={{ width: "100%", justifyContent: "center" }}>
              Atualizar Chamado
            </Btn>
          </div>
        )}
      </div>

      {/* Modal de atualização */}
      {modalAtualizar && (
        <Modal title={`Atualizar Chamado #${modalAtualizar.id.toString().padStart(4,"0")}`} onClose={() => setModalAtualizar(null)}>
          <Input label="Novo Status" value={formAtt.status}
            onChange={e => setFormAtt(f => ({ ...f, status: e.target.value }))}
            opts={[
              { v: "Aberto", l: "🔴 Aberto" },
              { v: "Em andamento", l: "🟡 Em andamento" },
              { v: "Resolvido", l: "🟢 Resolvido" },
            ]} />
          <Input label="Atribuir Técnico" value={formAtt.tecnico}
            onChange={e => setFormAtt(f => ({ ...f, tecnico: e.target.value }))}
            opts={[{ v: "", l: "— Selecionar técnico —" }, ...TECNICOSS.map(t => ({ v: t, l: t }))]} />
          <Textarea label="Comentário / Observação" value={formAtt.comentario}
            onChange={e => setFormAtt(f => ({ ...f, comentario: e.target.value }))}
            placeholder="Descreva o andamento do chamado..." rows={3} />
          <Textarea label="Solução aplicada" value={formAtt.solucao}
            onChange={e => setFormAtt(f => ({ ...f, solucao: e.target.value }))}
            placeholder="(Opcional) Descreva como o problema foi resolvido..." rows={3} />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <Btn icon="check" onClick={salvarAtualizacao}>Salvar Atualização</Btn>
            <Btn variant="secondary" onClick={() => setModalAtualizar(null)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── HISTÓRICO ────────────────────────────────────────────────────────────────
const PageHistorico = ({ chamados }) => {
  const [selecionado, setSelecionado] = useState(null);
  const [busca, setBusca] = useState("");

  const filtrados = chamados.filter(c =>
    !busca ||
    c.usuario.toLowerCase().includes(busca.toLowerCase()) ||
    c.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    c.id.toString().includes(busca)
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Histórico de Chamados</h1>
        <p style={{ color: C.text, fontSize: 14, margin: "4px 0 0" }}>Acompanhe todos os registros e atualizações</p>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="search" size={16} color={C.text} />
        </div>
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por usuário, descrição ou número..." style={{
            width: "100%", background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, color: "#fff", padding: "11px 14px 11px 42px",
            fontSize: 14, outline: "none", boxSizing: "border-box",
          }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selecionado ? "1fr 420px" : "1fr", gap: 20, alignItems: "start" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {filtrados.map((c, i) => (
            <div key={c.id}
              onClick={() => setSelecionado(selecionado?.id === c.id ? null : c)}
              style={{
                padding: "16px 20px",
                borderBottom: i < filtrados.length - 1 ? `1px solid ${C.border}` : "none",
                cursor: "pointer", transition: "background 0.15s",
                background: selecionado?.id === c.id ? C.primary + "33" : "transparent",
                display: "flex", alignItems: "flex-start", gap: 16,
              }}>
              {/* Linha do tempo */}
              <div style={{
                width: 10, height: 10, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                background: CORES_STATUS[c.status], boxShadow: `0 0 8px ${CORES_STATUS[c.status]}`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: C.secondary, fontWeight: 800, fontSize: 13 }}>#{c.id.toString().padStart(4,"0")}</span>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{c.usuario}</span>
                    <BadgeCat cat={c.categoria} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <BadgePrioridade p={c.prioridade} />
                    <BadgeStatus status={c.status} />
                  </div>
                </div>
                <p style={{ color: C.text, fontSize: 13, margin: "6px 0", lineHeight: 1.5 }}>
                  {c.descricao.length > 100 ? c.descricao.slice(0, 100) + "..." : c.descricao}
                </p>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.border }}>
                  <span>📅 {fmtData(c.data)}</span>
                  {c.tecnico && <span>👤 {c.tecnico}</span>}
                  <span>💬 {c.comentarios?.length || 0} comentário(s)</span>
                  {c.dataResolucao && <span style={{ color: C.success }}>✅ Resolvido em {diffHoras(c.data, c.dataResolucao)}h</span>}
                </div>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div style={{ textAlign: "center", padding: 48, color: C.text }}>
              Nenhum chamado encontrado.
            </div>
          )}
        </div>

        {/* Detalhes com histórico completo */}
        {selecionado && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: 24, position: "sticky", top: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
                Chamado #{selecionado.id.toString().padStart(4,"0")}
              </h3>
              <button onClick={() => setSelecionado(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text }}>
                <Icon name="x" size={20} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#fff", fontWeight: 600, marginBottom: 4 }}>{selecionado.usuario}</div>
              <p style={{ color: C.text, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{selecionado.descricao}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                ["Categoria", <BadgeCat cat={selecionado.categoria} />],
                ["Prioridade", <BadgePrioridade p={selecionado.prioridade} />],
                ["Status", <BadgeStatus status={selecionado.status} />],
                ["Técnico", <span style={{ color: "#fff", fontSize: 13 }}>{selecionado.tecnico || "—"}</span>],
              ].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ color: C.text, fontSize: 11, marginBottom: 4 }}>{k}</div>
                  {v}
                </div>
              ))}
            </div>

            {/* Timeline de eventos */}
            <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="history" size={14} color={C.secondary} /> Linha do Tempo
            </div>
            <div style={{ position: "relative" }}>
              {/* Evento de abertura */}
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.danger, marginTop: 4 }} />
                  <div style={{ width: 1, flex: 1, background: C.border, marginTop: 4 }} />
                </div>
                <div style={{ paddingBottom: 12 }}>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Chamado aberto</div>
                  <div style={{ color: C.border, fontSize: 11 }}>{fmtData(selecionado.data)}</div>
                  <div style={{ color: C.text, fontSize: 12, marginTop: 4 }}>por {selecionado.usuario}</div>
                </div>
              </div>

              {/* Comentários */}
              {(selecionado.comentarios || []).map((cm, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.secondary, marginTop: 4 }} />
                    {i < selecionado.comentarios.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: C.border, marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 12 }}>
                    <div style={{ color: C.secondary, fontSize: 13, fontWeight: 600 }}>{cm.autor}</div>
                    <div style={{ color: C.border, fontSize: 11 }}>{fmtData(cm.data)}</div>
                    <div style={{ color: C.text, fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{cm.texto}</div>
                  </div>
                </div>
              ))}

              {selecionado.status === "Resolvido" && (
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.success, marginTop: 4 }} />
                  <div>
                    <div style={{ color: C.success, fontSize: 13, fontWeight: 600 }}>Chamado resolvido</div>
                    <div style={{ color: C.border, fontSize: 11 }}>{fmtData(selecionado.dataResolucao)}</div>
                    <div style={{ color: C.text, fontSize: 12, marginTop: 4 }}>
                      Tempo de resolução: <strong style={{ color: C.success }}>{diffHoras(selecionado.data, selecionado.dataResolucao)}h</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── RELATÓRIOS ────────────────────────────────────────────────────────────────
const PageRelatorios = ({ chamados }) => {
  const [exportando, setExportando] = useState(false);

  const resolvidos = chamados.filter(c => c.status === "Resolvido");
  const totalHoras = resolvidos
    .map(c => diffHoras(c.data, c.dataResolucao))
    .filter(Boolean);
  const mediaResolucao = totalHoras.length
    ? (totalHoras.reduce((a, b) => a + b, 0) / totalHoras.length).toFixed(1)
    : "—";
  const taxaResolucao = chamados.length ? ((resolvidos.length / chamados.length) * 100).toFixed(1) : 0;

  const porCategoria = ["hardware", "software", "comunicação", "rede"].map(cat => ({
    categoria: LABEL_CAT[cat], total: chamados.filter(c => c.categoria === cat).length,
    resolvidos: chamados.filter(c => c.categoria === cat && c.status === "Resolvido").length,
    emAndamento: chamados.filter(c => c.categoria === cat && c.status === "Em andamento").length,
  }));

  const porTecnico = TECNICOSS.map(t => ({
    tecnico: t,
    total: chamados.filter(c => c.tecnico === t).length,
    resolvidos: chamados.filter(c => c.tecnico === t && c.status === "Resolvido").length,
  })).filter(t => t.total > 0);

  const exportarRelatorio = (tipo) => {
    setExportando(true);
    requestAnimationFrame(() => {
      try {
        if (tipo === "pdf") gerarRelatorioPDF(chamados);
        else gerarRelatorioXlsx(chamados);
      } finally {
        setExportando(false);
      }
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Relatórios</h1>
        <p style={{ color: C.text, fontSize: 14, margin: "4px 0 0" }}>Análise completa do desempenho do helpdesk</p>
      </div>

      {/* KPIs principais */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard label="Taxa de Resolução" value={`${taxaResolucao}%`} icon="check"  color={C.success} sub={`${resolvidos.length} de ${chamados.length} chamados`} />
        <StatCard label="Tempo Médio (h)"   value={mediaResolucao}      icon="clock"  color={C.warning} sub="Horas para resolução" />
        <StatCard label="Total Registrados" value={chamados.length}      icon="ticket" color={C.secondary} sub="Todos os períodos" />
        <StatCard label="Técnicos Ativos"   value={porTecnico.length}    icon="user"   color={C.card} sub="Com chamados atribuídos" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Tabela por categoria */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Total por Categoria</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.primary + "33" }}>
                {["Categoria", "Total", "Resolvidos", "Em Andamento"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.text, fontSize: 12, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porCategoria.map((r, i) => (
                <tr key={r.categoria} style={{ background: i % 2 === 0 ? "transparent" : C.primary + "11" }}>
                  <td style={{ padding: "10px 16px", color: "#fff", fontSize: 13 }}>{r.categoria}</td>
                  <td style={{ padding: "10px 16px", color: C.secondary, fontWeight: 700, fontSize: 13 }}>{r.total}</td>
                  <td style={{ padding: "10px 16px", color: C.success, fontSize: 13 }}>{r.resolvidos}</td>
                  <td style={{ padding: "10px 16px", color: C.warning, fontSize: 13 }}>{r.emAndamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabela por técnico */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Desempenho por Técnico</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.primary + "33" }}>
                {["Técnico", "Atribuídos", "Resolvidos", "Taxa"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.text, fontSize: 12, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porTecnico.map((t, i) => {
                const taxa = t.total ? ((t.resolvidos / t.total) * 100).toFixed(0) : 0;
                return (
                  <tr key={t.tecnico} style={{ background: i % 2 === 0 ? "transparent" : C.primary + "11" }}>
                    <td style={{ padding: "10px 16px", color: "#fff", fontSize: 13 }}>{t.tecnico}</td>
                    <td style={{ padding: "10px 16px", color: C.secondary, fontWeight: 700, fontSize: 13 }}>{t.total}</td>
                    <td style={{ padding: "10px 16px", color: C.success, fontSize: 13 }}>{t.resolvidos}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, background: C.border, borderRadius: 4, height: 6 }}>
                          <div style={{ width: `${taxa}%`, background: taxa > 70 ? C.success : C.warning, height: "100%", borderRadius: 4 }} />
                        </div>
                        <span style={{ color: C.text, fontSize: 12, minWidth: 32 }}>{taxa}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {porTecnico.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: C.text }}>Nenhum técnico com chamados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico linha do tempo */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>Distribuição por Categoria e Status</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={porCategoria} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="categoria" stroke={C.text} fontSize={12} />
            <YAxis stroke={C.text} fontSize={12} />
            <Tooltip contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }} labelStyle={{ color: "#fff" }} itemStyle={{ color: C.text }} />
            <Legend wrapperStyle={{ color: C.text, fontSize: 12 }} />
            <Bar dataKey="total"       name="Total"        fill={C.secondary} radius={[4,4,0,0]} />
            <Bar dataKey="resolvidos"  name="Resolvidos"   fill={C.success}   radius={[4,4,0,0]} />
            <Bar dataKey="emAndamento" name="Em Andamento" fill={C.warning}   radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Botões de exportação */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Exportar Relatório</div>
          <div style={{ color: C.text, fontSize: 13 }}>Baixe PDF (tabela) ou planilha Excel (.xlsx)</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn icon="download" variant="danger" onClick={() => exportarRelatorio("pdf")} disabled={exportando}>
            {exportando ? "Gerando..." : "Exportar PDF"}
          </Btn>
          <Btn icon="download" variant="success" onClick={() => exportarRelatorio("excel")} disabled={exportando}>
            {exportando ? "Gerando..." : "Exportar Excel (.xlsx)"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function IndusDesk({ user, onLogout }) {
  const [chamados, setChamados]   = useState([]);
  const [loadState, setLoadState] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiGet("/chamados");
        if (!cancelled) {
          setChamados(list);
          setLoadState("ok");
        }
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const recarregarChamados = useCallback(async () => {
    setLoadState("loading");
    try {
      const list = await apiGet("/chamados");
      setChamados(list);
      setLoadState("ok");
    } catch {
      setLoadState("error");
    }
  }, []);

  const [pagina, setPagina]       = useState("dashboard");
  const [toast, setToast]         = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const showToast = useCallback((msg, type = "info") => setToast({ msg, type }), []);

  const adicionarChamado = async (form) => {
    try {
      const novo = await apiPost("/chamados", {
        usuario: form.usuario,
        descricao: form.descricao,
        categoria: form.categoria,
        prioridade: form.prioridade,
        imagem: form.imagem,
        preview: form.preview,
      });
      setChamados((prev) => [novo, ...prev]);
      showToast(`Chamado #${novo.id.toString().padStart(4, "0")} registrado!`, "success");
    } catch (e) {
      showToast(e.message || "Erro ao registrar chamado.", "error");
      throw e;
    }
  };

  const atualizarChamado = async (chamadoAtualizado) => {
    try {
      const updated = await apiPatch(`/chamados/${chamadoAtualizado.id}`, chamadoAtualizado);
      setChamados((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e) {
      showToast(e.message || "Erro ao atualizar chamado.", "error");
      throw e;
    }
  };

  const menuItens = [
    { id: "dashboard",   label: "Dashboard",     icon: "dashboard" },
    { id: "novoChamado", label: "Novo Chamado",   icon: "add" },
    { id: "areaTI",      label: "Área do TI",     icon: "tools" },
    { id: "historico",   label: "Histórico",       icon: "history" },
    { id: "relatorios",  label: "Relatórios",      icon: "report" },
  ];

  const abertos = chamados.filter(c => c.status === "Aberto").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', 'SF Pro Display', system-ui, sans-serif", display: "flex" }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 6px; }
        button:hover { filter: brightness(1.12); }
        select, input, textarea { font-family: inherit !important; }
      `}</style>

      {/* ─── SIDEBAR ─── */}
      <div style={{
        width: 240, background: `linear-gradient(180deg, ${C.primary} 0%, #1a2d45 100%)`,
        borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
        boxShadow: "4px 0 24px #0008",
      }}>
        {/* Logo */}
        <div style={{ padding: "28px 22px 20px", borderBottom: `1px solid ${C.border}55` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.secondary}, ${C.card})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 14px ${C.secondary}55`,
            }}>
              <Icon name="tools" size={18} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px", lineHeight: 1 }}>IndusDesk</div>
              <div style={{ color: C.card, fontSize: 11, marginTop: 2 }}>Helpdesk Industrial</div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {menuItens.map(item => (
            <button key={item.id} onClick={() => setPagina(item.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              background: pagina === item.id ? `${C.secondary}33` : "transparent",
              color: pagina === item.id ? "#fff" : C.card,
              fontWeight: pagina === item.id ? 700 : 500,
              fontSize: 14, marginBottom: 4, transition: "all 0.15s",
              borderLeft: pagina === item.id ? `3px solid ${C.secondary}` : "3px solid transparent",
              textAlign: "left",
            }}>
              <Icon name={item.icon} size={18} color={pagina === item.id ? "#fff" : C.card} />
              {item.label}
              {item.id === "areaTI" && abertos > 0 && (
                <span style={{
                  marginLeft: "auto", background: C.danger, color: "#fff",
                  borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "1px 7px",
                }}>{abertos}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Usuário */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}55` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.secondary}, ${C.primary})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="user" size={16} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{user?.name ?? "Administrador TI"}</div>
              <div style={{ color: C.card, fontSize: 11 }}>{user?.email ?? "ti@industria.com.br"}</div>
            </div>
          </div>
          {typeof onLogout === "function" && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                marginTop: 14,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.card,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Icon name="logout" size={16} color={C.card} />
              Sair
            </button>
          )}
        </div>
      </div>

      {/* ─── CONTEÚDO PRINCIPAL ─── */}
      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Topbar */}
        <div style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: "0 32px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 50,
          boxShadow: "0 2px 16px #0006",
        }}>
          <div>
            <span style={{ color: C.text, fontSize: 13 }}>
              {menuItens.find(m => m.id === pagina)?.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Indicadores rápidos */}
            <div style={{
              display: "flex", gap: 8, background: C.bg, borderRadius: 8, padding: "6px 14px",
              border: `1px solid ${C.border}`, fontSize: 12,
            }}>
              <span style={{ color: C.danger }}>🔴 {chamados.filter(c => c.status === "Aberto").length} abertos</span>
              <span style={{ color: C.border }}>|</span>
              <span style={{ color: C.warning }}>🟡 {chamados.filter(c => c.status === "Em andamento").length} andamento</span>
              <span style={{ color: C.border }}>|</span>
              <span style={{ color: C.success }}>🟢 {chamados.filter(c => c.status === "Resolvido").length} resolvidos</span>
            </div>

            {/* Sino de notificação */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{
                width: 38, height: 38, borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.bg, cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", color: C.text, position: "relative",
              }}>
                <Icon name="bell" size={18} />
                {abertos > 0 && (
                  <span style={{
                    position: "absolute", top: 6, right: 6, width: 8, height: 8,
                    borderRadius: "50%", background: C.danger,
                  }} />
                )}
              </button>
              {notifOpen && (
                <div style={{
                  position: "absolute", right: 0, top: 48,
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 12, width: 300, boxShadow: "0 12px 40px #0008",
                  zIndex: 200,
                }}>
                  <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, color: "#fff", fontWeight: 700, fontSize: 14 }}>
                    Notificações ({abertos})
                  </div>
                  {chamados.filter(c => c.status === "Aberto").slice(0, 5).map(c => (
                    <div key={c.id} style={{
                      padding: "12px 18px", borderBottom: `1px solid ${C.border}55`,
                      cursor: "pointer",
                    }} onClick={() => { setNotifOpen(false); setPagina("areaTI"); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: C.secondary, fontSize: 12, fontWeight: 700 }}>#{c.id.toString().padStart(4,"0")}</span>
                        <BadgePrioridade p={c.prioridade} />
                      </div>
                      <div style={{ color: "#fff", fontSize: 12 }}>{c.usuario}</div>
                      <div style={{ color: C.text, fontSize: 11, marginTop: 2 }}>
                        {c.descricao.slice(0, 60)}...
                      </div>
                    </div>
                  ))}
                  {abertos === 0 && (
                    <div style={{ padding: 24, textAlign: "center", color: C.text, fontSize: 13 }}>
                      ✅ Nenhum chamado pendente!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botão novo chamado rápido */}
            <Btn icon="add" small onClick={() => setPagina("novoChamado")}>
              Novo Chamado
            </Btn>
          </div>
        </div>

        {/* Conteúdo da página */}
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}
          onClick={() => notifOpen && setNotifOpen(false)}>
          {loadState === "loading" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, color: C.text, fontSize: 15 }}>
              Carregando chamados…
            </div>
          )}
          {loadState === "error" && (
            <div style={{ textAlign: "center", padding: 48, color: C.text }}>
              <p style={{ color: "#fff", fontWeight: 700, marginBottom: 12 }}>Não foi possível conectar à API</p>
              <p style={{ marginBottom: 20 }}>
                Confira se o servidor está rodando junto com o front (
                <code style={{ color: C.secondary }}>npm run dev</code>
                ).
              </p>
              <Btn icon="gear" onClick={recarregarChamados}>Tentar novamente</Btn>
            </div>
          )}
          {loadState === "ok" && (
            <>
              {pagina === "dashboard"   && <PageDashboard chamados={chamados} />}
              {pagina === "novoChamado" && <PageNovoChamado onSubmit={adicionarChamado} />}
              {pagina === "areaTI"      && <PageAreaTI chamados={chamados} onAtualizar={atualizarChamado} showToast={showToast} />}
              {pagina === "historico"   && <PageHistorico chamados={chamados} />}
              {pagina === "relatorios"  && <PageRelatorios chamados={chamados} />}
            </>
          )}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: `1px solid ${C.border}`, padding: "14px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: C.surface,
        }}>
          <span style={{ color: C.border, fontSize: 12 }}>
            IndusDesk v1.0 — Sistema de Gestão de Chamados TI Industrial
          </span>
          <span style={{ color: C.border, fontSize: 12 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </footer>
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
