import { useState, useCallback, useRef } from "react";
import { Upload, FileText, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight, Sparkles, Building2, BarChart3, AlertCircle, X, RefreshCw, Eye } from "lucide-react";

const ASSET_CLASSES = [
  { id: "equities", label: "Renda Variável", sub: ["EUA / S&P 500", "Europa", "China / EM Ásia", "Japão", "Brasil / Latam", "Índia", "Mercados Desenvolvidos", "Mercados Emergentes"] },
  { id: "fixed_income", label: "Renda Fixa", sub: ["Treasuries EUA", "IG Corporativo", "High Yield", "Títulos Emergentes", "Inflação (TIPS)", "Renda Fixa Europa", "Títulos Brasileiros"] },
  { id: "alternatives", label: "Alternativos", sub: ["Private Equity", "Real Estate / REITs", "Infraestrutura", "Hedge Funds", "Crédito Privado"] },
  { id: "commodities", label: "Commodities", sub: ["Ouro", "Petróleo (WTI/Brent)", "Metais Industriais", "Commodities Agrícolas"] },
  { id: "fx", label: "Câmbio / FX", sub: ["USD (DXY)", "EUR/USD", "BRL/USD", "JPY/USD", "Moedas Emergentes"] },
];

const STANCE_CONFIG = {
  bullish: { label: "Otimista", color: "#1D9E75", bg: "#E1F5EE", textColor: "#085041", icon: TrendingUp },
  neutral: { label: "Neutro", color: "#EF9F27", bg: "#FAEEDA", textColor: "#633806", icon: Minus },
  bearish: { label: "Pessimista", color: "#D85A30", bg: "#FAECE7", textColor: "#4A1B0C", icon: TrendingDown },
};

function StanceBadge({ stance, small }) {
  const cfg = STANCE_CONFIG[stance] || STANCE_CONFIG.neutral;
  const Icon = cfg.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: cfg.bg, color: cfg.textColor, borderRadius: 20, padding: small ? "2px 8px" : "4px 12px", fontSize: small ? 11 : 12, fontWeight: 500 }}>
      <Icon size={small ? 10 : 12} />
      {cfg.label}
    </span>
  );
}

function ConsensusBar({ views }) {
  const total = views.length || 1;
  const bull = views.filter(v => v.stance === "bullish").length;
  const neu = views.filter(v => v.stance === "neutral").length;
  const bear = views.filter(v => v.stance === "bearish").length;
  return (
    <div>
      <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 2, marginBottom: 5 }}>
        {bull > 0 && <div style={{ flex: bull, background: "#1D9E75", borderRadius: 3 }} />}
        {neu > 0 && <div style={{ flex: neu, background: "#EF9F27", borderRadius: 3 }} />}
        {bear > 0 && <div style={{ flex: bear, background: "#D85A30", borderRadius: 3 }} />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666" }}>
        <span style={{ color: "#0F6E56" }}>{Math.round((bull / total) * 100)}% otimista</span>
        <span style={{ color: "#993C1D" }}>{Math.round((bear / total) * 100)}% pessimista</span>
      </div>
    </div>
  );
}

function UploadZone({ onFilesAdded, uploading }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (files.length) onFilesAdded(files);
  }, [onFilesAdded]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? "#1D9E75" : "#d0d0d0"}`,
        borderRadius: 16, padding: "36px 24px", textAlign: "center", cursor: "pointer",
        background: dragOver ? "#E1F5EE" : "transparent",
        transition: "all 0.2s",
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf" multiple style={{ display: "none" }} onChange={e => onFilesAdded(Array.from(e.target.files))} />
      <Upload size={28} style={{ color: dragOver ? "#1D9E75" : "#aaa", margin: "0 auto 12px" }} />
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: "#333" }}>
        {uploading ? "Processando com IA..." : "Arraste PDFs de relatórios aqui"}
      </div>
      <div style={{ fontSize: 12, color: "#999" }}>Suporta relatórios de qualquer gestora · Extração automática via IA</div>
    </div>
  );
}

function AISynthesis({ views, assetLabel }) {
  const [synthesis, setSynthesis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!views.length) return;
    setLoading(true);
    setError(null);
    try {
      const viewsText = views.map(v =>
        `Gestora: ${v.manager}\nAtivo: ${v.asset}\nPositioning: ${v.stance}\nVisão: ${v.summary}\nData: ${v.date}`
      ).join("\n\n---\n\n");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Você é um analista sênior de investimentos. Analise as visões de diversas gestoras globais e produza uma síntese consolidada em português brasileiro. Responda SOMENTE com JSON válido, sem markdown, sem texto antes ou depois. Formato:
{
  "consensus": "bullish|neutral|bearish",
  "consensus_strength": "forte|moderado|fraco",
  "summary": "2-3 frases resumindo o consenso geral",
  "key_themes": ["tema 1", "tema 2", "tema 3"],
  "main_divergence": "principal ponto de discordância entre as gestoras (1 frase)",
  "risks": ["risco 1", "risco 2"]
}`,
          messages: [{ role: "user", content: `Analise estas visões de gestoras globais para ${assetLabel}:\n\n${viewsText}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setSynthesis(parsed);
    } catch (e) {
      setError("Erro ao gerar síntese. Verifique a conexão.");
    }
    setLoading(false);
  };

  if (!views.length) return null;

  return (
    <div style={{ background: synthesis ? "#E1F5EE" : "#f8f8f6", border: `1px solid ${synthesis ? "#5DCAA5" : "#e0e0e0"}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: synthesis ? 14 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} style={{ color: synthesis ? "#1D9E75" : "#aaa" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: synthesis ? "#085041" : "#999", textTransform: "uppercase", letterSpacing: "0.06em" }}>Síntese de IA</span>
        </div>
        <button onClick={generate} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#1D9E75", background: "white", border: "1px solid #5DCAA5", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 500 }}>
          <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          {loading ? "Analisando..." : synthesis ? "Atualizar" : "Gerar análise"}
        </button>
      </div>
      {error && <div style={{ fontSize: 13, color: "#D85A30", marginTop: 8 }}>{error}</div>}
      {synthesis && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <StanceBadge stance={synthesis.consensus} />
            <span style={{ fontSize: 12, color: "#666" }}>Consenso {synthesis.consensus_strength}</span>
          </div>
          <p style={{ fontSize: 13, color: "#085041", lineHeight: 1.6, marginBottom: 14 }}>{synthesis.summary}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#0F6E56", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Temas centrais</div>
              {synthesis.key_themes?.map((t, i) => (
                <div key={i} style={{ fontSize: 12, color: "#085041", display: "flex", gap: 6, marginBottom: 3 }}>
                  <span style={{ color: "#1D9E75" }}>·</span>{t}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#993C1D", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Riscos identificados</div>
              {synthesis.risks?.map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: "#4A1B0C", display: "flex", gap: 6, marginBottom: 3 }}>
                  <span style={{ color: "#D85A30" }}>·</span>{r}
                </div>
              ))}
            </div>
          </div>
          {synthesis.main_divergence && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#FAEEDA", borderRadius: 8, fontSize: 12, color: "#633806" }}>
              <strong>Divergência: </strong>{synthesis.main_divergence}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ViewCard({ view, onDelete }) {
  const cfg = STANCE_CONFIG[view.stance] || STANCE_CONFIG.neutral;
  return (
    <div style={{ background: "white", border: "1px solid #ebebeb", borderRadius: 12, padding: "14px 16px", marginBottom: 10, borderLeft: `3px solid ${cfg.color}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0f0ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#555", flexShrink: 0 }}>
            {view.manager.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{view.manager}</div>
            <div style={{ fontSize: 11, color: "#999" }}>{view.date} · {view.source}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StanceBadge stance={view.stance} small />
          <button onClick={() => onDelete(view.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 2, display: "flex" }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0 }}>{view.summary}</p>
      {view.asset && <div style={{ marginTop: 6, fontSize: 11, color: "#999" }}>Ativo extraído: <strong style={{ color: "#555" }}>{view.asset}</strong></div>}
    </div>
  );
}

async function extractViewsFromPDF(file) {
  const base64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Você é especialista em análise de relatórios de gestoras de investimento. Extraia as visões de mercado do documento. Responda SOMENTE com JSON válido, sem markdown. Formato:
{
  "manager": "nome da gestora",
  "report_title": "título do relatório",
  "report_date": "data (mês/ano)",
  "views": [
    {
      "asset_class": "equities|fixed_income|alternatives|commodities|fx",
      "asset": "nome específico do ativo ou região",
      "stance": "bullish|neutral|bearish",
      "summary": "resumo da visão em 1-2 frases em português",
      "key_rationale": "principal argumento em 1 frase"
    }
  ]
}`,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: "Extraia todas as visões de mercado deste relatório de gestora de investimentos." }
        ]
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

export default function App() {
  const [activeClass, setActiveClass] = useState("equities");
  const [activeAsset, setActiveAsset] = useState(null);
  const [views, setViews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState({ equities: true });
  const [processingFiles, setProcessingFiles] = useState([]);

  const handleFiles = async (files) => {
    setUploading(true);
    setUploadError(null);
    for (const file of files) {
      setProcessingFiles(p => [...p, file.name]);
      try {
        const extracted = await extractViewsFromPDF(file);
        const manager = extracted.manager || file.name.replace(".pdf", "");
        const date = extracted.report_date || new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        const source = extracted.report_title || "Relatório";
        const newViews = (extracted.views || []).map((v, i) => ({
          id: `${Date.now()}-${i}`,
          manager, date, source,
          asset_class: v.asset_class || "equities",
          asset: v.asset || "Geral",
          stance: v.stance || "neutral",
          summary: v.summary || v.key_rationale || "",
        }));
        setViews(prev => [...prev, ...newViews]);
      } catch (e) {
        setUploadError(`Erro ao processar ${file.name}. Certifique-se de que é um relatório de gestora válido.`);
      }
      setProcessingFiles(p => p.filter(n => n !== file.name));
    }
    setUploading(false);
  };

  const deleteView = (id) => setViews(v => v.filter(x => x.id !== id));

  const currentClass = ASSET_CLASSES.find(c => c.id === activeClass);
  const filteredViews = views.filter(v => {
    if (activeAsset) return v.asset_class === activeClass && v.asset === activeAsset;
    return v.asset_class === activeClass;
  });

  const getClassViews = (classId) => views.filter(v => v.asset_class === classId);
  const getAssetViews = (classId, asset) => views.filter(v => v.asset_class === classId && v.asset === asset);

  const toggleClass = (classId) => {
    setExpandedClasses(p => ({ ...p, [classId]: !p[classId] }));
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', 'Trebuchet MS', sans-serif", background: "#f7f6f3", color: "#1a1a18" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .view-card { animation: fadeIn 0.3s ease; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 240, background: "#1a1a18", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75" }} />
            <span style={{ color: "white", fontWeight: 600, fontSize: 14, letterSpacing: "-0.02em" }}>Market Intel</span>
          </div>
          <div style={{ fontSize: 10, color: "#666", paddingLeft: 16 }}>Visões consolidadas · {views.length} registros</div>
        </div>

        <button onClick={() => setShowUpload(v => !v)} style={{ margin: "0 14px 16px", display: "flex", alignItems: "center", gap: 8, background: showUpload ? "#1D9E75" : "#2a2a28", color: showUpload ? "white" : "#aaa", border: "none", borderRadius: 10, padding: "9px 14px", cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "all 0.2s" }}>
          <Upload size={14} />
          {uploading ? "Processando..." : "Upload de relatório"}
        </button>

        <div style={{ flex: 1, overflow: "auto", paddingBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 20px", marginBottom: 6 }}>Classes de ativos</div>
          {ASSET_CLASSES.map(cls => {
            const clsViews = getClassViews(cls.id);
            const isActive = activeClass === cls.id;
            const isExpanded = expandedClasses[cls.id];
            return (
              <div key={cls.id}>
                <div
                  onClick={() => { setActiveClass(cls.id); setActiveAsset(null); toggleClass(cls.id); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", cursor: "pointer", background: isActive ? "#242422" : "transparent", borderRight: isActive ? "2px solid #1D9E75" : "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isExpanded ? <ChevronDown size={12} style={{ color: "#555" }} /> : <ChevronRight size={12} style={{ color: "#555" }} />}
                    <span style={{ fontSize: 13, color: isActive ? "white" : "#888", fontWeight: isActive ? 500 : 400 }}>{cls.label}</span>
                  </div>
                  {clsViews.length > 0 && <span style={{ fontSize: 10, background: "#2a2a28", color: "#666", borderRadius: 10, padding: "1px 6px" }}>{clsViews.length}</span>}
                </div>
                {isExpanded && cls.sub.map(sub => {
                  const subViews = getAssetViews(cls.id, sub);
                  const isActiveSub = activeAsset === sub && isActive;
                  return (
                    <div key={sub} onClick={() => { setActiveClass(cls.id); setActiveAsset(sub); }} style={{ padding: "5px 20px 5px 44px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: isActiveSub ? "#1D9E75" : "#666" }}>{sub}</span>
                      {subViews.length > 0 && <span style={{ fontSize: 10, color: "#444", background: "#222" , borderRadius: 8, padding: "1px 5px" }}>{subViews.length}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid #2a2a28", fontSize: 11, color: "#444" }}>
          <div style={{ marginBottom: 2 }}>Gestoras detectadas</div>
          <div style={{ color: "#666", fontSize: 10 }}>{[...new Set(views.map(v => v.manager))].slice(0, 3).join(", ") || "Nenhuma ainda"}{views.length > 3 ? " ..." : ""}</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "white", borderBottom: "1px solid #ebebeb", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{activeAsset || currentClass?.label}</div>
            <div style={{ fontSize: 12, color: "#999" }}>{filteredViews.length} visões de gestoras · {[...new Set(filteredViews.map(v => v.manager))].length} gestoras</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {filteredViews.length > 0 && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {["bullish", "neutral", "bearish"].map(s => {
                  const cnt = filteredViews.filter(v => v.stance === s).length;
                  return cnt > 0 ? <StanceBadge key={s} stance={s} small /> : null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upload panel */}
        {showUpload && (
          <div style={{ background: "white", borderBottom: "1px solid #ebebeb", padding: 20, flexShrink: 0 }}>
            <UploadZone onFilesAdded={handleFiles} uploading={uploading} />
            {processingFiles.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {processingFiles.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, background: "#f0f0ee", borderRadius: 8, padding: "4px 10px" }}>
                    <RefreshCw size={11} style={{ color: "#1D9E75", animation: "spin 1s linear infinite" }} />
                    {f}
                  </div>
                ))}
              </div>
            )}
            {uploadError && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#D85A30" }}>
                <AlertCircle size={13} />{uploadError}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {filteredViews.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#ccc" }}>
              <FileText size={40} style={{ marginBottom: 16, color: "#ddd" }} />
              <div style={{ fontWeight: 500, fontSize: 16, color: "#bbb", marginBottom: 6 }}>Nenhuma visão para {activeAsset || currentClass?.label}</div>
              <div style={{ fontSize: 13, color: "#ccc", marginBottom: 20 }}>Faça upload de um relatório de gestora para começar</div>
              <button onClick={() => setShowUpload(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1D9E75", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                <Upload size={14} />
                Upload de relatório
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: 760 }}>
              {/* Consensus summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                {["bullish", "neutral", "bearish"].map(s => {
                  const cnt = filteredViews.filter(v => v.stance === s).length;
                  const cfg = STANCE_CONFIG[s];
                  const Icon = cfg.icon;
                  return (
                    <div key={s} style={{ background: "white", border: "1px solid #ebebeb", borderRadius: 12, padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Icon size={13} style={{ color: cfg.color }} />
                        <span style={{ fontSize: 11, color: "#999" }}>{cfg.label}</span>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 600, color: cnt > 0 ? cfg.color : "#ddd", fontFamily: "'DM Mono', monospace" }}>{cnt}</div>
                      <div style={{ fontSize: 10, color: "#bbb" }}>gestora{cnt !== 1 ? "s" : ""}</div>
                    </div>
                  );
                })}
              </div>

              {/* Consensus bar */}
              {filteredViews.length > 1 && (
                <div style={{ background: "white", border: "1px solid #ebebeb", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Distribuição de consenso</div>
                  <ConsensusBar views={filteredViews} />
                </div>
              )}

              {/* AI Synthesis */}
              <AISynthesis views={filteredViews} assetLabel={activeAsset || currentClass?.label} />

              {/* Individual views */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Visões individuais · {filteredViews.length}
              </div>
              {filteredViews.map(v => (
                <div key={v.id} className="view-card">
                  <ViewCard view={v} onDelete={deleteView} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
