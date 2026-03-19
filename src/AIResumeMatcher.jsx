import { useState, useRef, useCallback } from "react";

const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/analyze-cv";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0f; --surface: #111118; --surface2: #1a1a24;
    --border: rgba(255,255,255,0.07); --border-hover: rgba(255,255,255,0.15);
    --accent: #6c63ff; --accent2: #ff6584; --accent3: #43e97b;
    --text: #f0eff8; --muted: #7a7a9a;
    --font-display: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; }
  .app { min-height: 100vh; background: var(--bg); position: relative; overflow-x: hidden; }
  .noise { position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.4; }
  .glow-orb { position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0; }
  .orb1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(108,99,255,0.15), transparent 70%); top: -100px; left: -100px; }
  .orb2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,101,132,0.1), transparent 70%); bottom: 0; right: -100px; }
  .container { max-width: 960px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }
  header { padding: 48px 0 48px; text-align: center; }
  .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(108,99,255,0.12); border: 1px solid rgba(108,99,255,0.3); border-radius: 100px; padding: 6px 16px; margin-bottom: 28px; font-size: 12px; font-weight: 500; color: #a89fff; letter-spacing: 0.08em; text-transform: uppercase; }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #6c63ff; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
  h1 { font-family: var(--font-display); font-size: clamp(2.4rem, 5vw, 3.8rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; background: linear-gradient(135deg, #f0eff8 30%, #a89fff 70%, #ff6584 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 16px; }
  .subtitle { font-size: 1.05rem; color: var(--muted); font-weight: 300; max-width: 480px; margin: 0 auto; line-height: 1.6; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  @media (max-width: 680px) { .form-grid { grid-template-columns: 1fr; } }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; transition: border-color 0.2s; }
  .card:hover { border-color: var(--border-hover); }
  .card-label { font-family: var(--font-display); font-size: 0.78rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .dropzone { border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 32px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.01); }
  .dropzone:hover, .dropzone.drag { border-color: var(--accent); background: rgba(108,99,255,0.05); }
  .dropzone-icon { font-size: 28px; margin-bottom: 10px; }
  .dropzone-text { font-size: 0.88rem; color: var(--muted); line-height: 1.5; }
  .dropzone-text strong { color: #a89fff; font-weight: 500; }
  .file-selected { display: flex; align-items: center; gap: 10px; background: rgba(67,233,123,0.08); border: 1px solid rgba(67,233,123,0.2); border-radius: 10px; padding: 12px 16px; margin-top: 12px; }
  .file-name { font-size: 0.85rem; color: #43e97b; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-size { font-size: 0.75rem; color: var(--muted); }
  textarea { width: 100%; height: 180px; background: rgba(255,255,255,0.02); border: 1.5px solid var(--border); border-radius: 12px; color: var(--text); font-family: var(--font-body); font-size: 0.9rem; font-weight: 300; line-height: 1.6; padding: 14px 16px; resize: none; transition: border-color 0.2s; outline: none; }
  textarea:focus { border-color: rgba(108,99,255,0.5); }
  textarea::placeholder { color: var(--muted); }
  .btn-row { display: flex; gap: 12px; margin-bottom: 8px; }
  .btn-analyze { padding: 18px; background: linear-gradient(135deg, var(--accent), #8b5cf6); border: none; border-radius: 12px; cursor: pointer; font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: white; letter-spacing: 0.02em; transition: all 0.25s; position: relative; overflow: hidden; flex: 1; }
  .btn-analyze:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(108,99,255,0.35); }
  .btn-analyze:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-reset { background: transparent; border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; color: var(--muted); font-family: var(--font-body); font-size: 0.85rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .btn-reset:hover { border-color: var(--border-hover); color: var(--text); }
  .hint-text { text-align: center; font-size: 12px; color: var(--muted); margin-top: 8px; min-height: 18px; }
  .loading-wrap { text-align: center; padding: 48px 0; }
  .spinner { width: 48px; height: 48px; border-radius: 50%; border: 3px solid var(--border); border-top-color: var(--accent); animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { color: var(--muted); font-size: 0.95rem; font-weight: 300; }
  .error-box { background: rgba(255,101,132,0.08); border: 1px solid rgba(255,101,132,0.25); border-radius: 12px; padding: 16px 20px; color: #ff8fab; font-size: 0.88rem; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 10px; }
  .results { animation: fadeUp 0.5s ease both; margin-top: 40px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
  .results-title { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; }
  .score-section { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px; margin-bottom: 20px; display: flex; align-items: center; gap: 36px; flex-wrap: wrap; }
  .score-ring-wrap { flex-shrink: 0; position: relative; width: 130px; height: 130px; }
  .score-ring-wrap svg { transform: rotate(-90deg); }
  .score-ring-bg { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 8; }
  .score-ring-fill { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1); }
  .score-number { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .score-val { font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; line-height: 1; }
  .score-unit { font-size: 0.75rem; color: var(--muted); }
  .score-info { flex: 1; min-width: 180px; }
  .score-label { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
  .score-desc { font-size: 0.9rem; color: var(--muted); font-weight: 300; line-height: 1.6; }
  .meter-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; margin-top: 16px; }
  .meter-fill { height: 100%; border-radius: 100px; transition: width 1.2s cubic-bezier(0.34,1.56,0.64,1); }
  .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  @media (max-width: 640px) { .results-grid { grid-template-columns: 1fr; } }
  .result-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
  .result-card-title { font-family: var(--font-display); font-size: 0.78rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot-red { background: #ff6584; } .dot-purple { background: #a89fff; } .dot-green { background: #43e97b; }
  .keyword-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .keyword-tag { background: rgba(255,101,132,0.1); border: 1px solid rgba(255,101,132,0.2); color: #ff8fab; border-radius: 100px; padding: 5px 14px; font-size: 0.82rem; font-weight: 500; }
  .keyword-tag.soft { background: rgba(108,99,255,0.1); border-color: rgba(108,99,255,0.25); color: #a89fff; }
  .tips-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .tips-list li { display: flex; gap: 12px; align-items: flex-start; font-size: 0.88rem; font-weight: 300; line-height: 1.6; color: #c0bfe0; }
  .tip-num { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: rgba(108,99,255,0.2); border: 1px solid rgba(108,99,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 600; color: #a89fff; font-family: var(--font-display); margin-top: 1px; }
  .empty-state { color: var(--muted); font-size: 0.85rem; font-style: italic; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 32px 0 0; }
  footer { text-align: center; padding: 32px 0; color: var(--muted); font-size: 0.78rem; font-weight: 300; }
  footer span { color: rgba(108,99,255,0.7); }
`;

function getScoreColor(s) {
  if (s >= 75) return "#43e97b";
  if (s >= 50) return "#f59e0b";
  return "#ff6584";
}
function getScoreLabel(s) {
  if (s >= 80) return { label: "Excellent profil", desc: "Votre CV correspond très bien à cette offre. Quelques ajustements mineurs peuvent encore l'optimiser." };
  if (s >= 65) return { label: "Bon candidat", desc: "Profil solide avec quelques lacunes. Les conseils ci-dessous vous aideront à maximiser vos chances." };
  if (s >= 45) return { label: "Profil partiel", desc: "Des compétences manquantes importantes. Concentrez-vous sur les points d'amélioration listés." };
  return { label: "Faible correspondance", desc: "Ce poste requiert des compétences significativement différentes de votre profil actuel." };
}

function ScoreRing({ score }) {
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = getScoreColor(score);
  return (
    <div className="score-ring-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle className="score-ring-bg" cx="65" cy="65" r={r} />
        <circle className="score-ring-fill" cx="65" cy="65" r={r} stroke={color}
          style={{ strokeDasharray: circ, strokeDashoffset: offset }} />
      </svg>
      <div className="score-number">
        <span className="score-val" style={{ color }}>{score}</span>
        <span className="score-unit">/100</span>
      </div>
    </div>
  );
}

const tryParse = (str) => {
  try {
    const clean = str.replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
};

export default function AIResumeMatcher() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const fileRef = useRef();
  const resultsRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f); setError(null); setResult(null);
    } else {
      setError("Veuillez sélectionner un fichier PDF valide.");
    }
  };

  // Dès que l'offre change → effacer l'ancien résultat
  const handleJobDescChange = (val) => {
    setJobDesc(val);
    if (result) setResult(null);
    if (error) setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async () => {
    if (!file) return setError("Veuillez uploader votre CV en PDF.");
    if (!jobDesc.trim()) return setError("Veuillez coller l'offre d'emploi.");
    setError(null); setLoading(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("data", file);
      fd.append("jobDescription", jobDesc);
      const res = await fetch(N8N_WEBHOOK_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
      const raw = await res.json();
      let parsed = null;
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (item?.output) { parsed = tryParse(item.output); break; }
          if (item?.json?.output) { parsed = tryParse(item.json.output); break; }
        }
      } else if (raw?.output) {
        parsed = tryParse(raw.output);
      } else {
        parsed = tryParse(JSON.stringify(raw));
      }
      if (!parsed?.score) throw new Error("Réponse de l'IA invalide ou incomplète.");
      setResult(parsed);
      setAnalysisCount(c => c + 1);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(`Erreur : ${err.message}. Vérifiez que n8n est bien démarré sur localhost:5678.`);
    } finally {
      setLoading(false);
    }
  };

  const resetFile = () => { setFile(null); setResult(null); setError(null); };
  const resetAll  = () => { setFile(null); setJobDesc(""); setResult(null); setError(null); setAnalysisCount(0); };

  const scoreInfo  = result ? getScoreLabel(result.score) : null;
  const scoreColor = result ? getScoreColor(result.score) : "#6c63ff";

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="noise" />
        <div className="glow-orb orb1" />
        <div className="glow-orb orb2" />
        <div className="container">

          <header>
            <div className="badge"><span className="badge-dot" />Propulsé par Groq · Llama 3</div>
            <h1>AI Resume Matcher</h1>
            <p className="subtitle">Analysez la compatibilité entre votre CV et une offre. Changez l'offre pour relancer instantanément.</p>
          </header>

          {/* ── Formulaire — TOUJOURS visible ── */}
          <div className="form-grid">
            <div className="card">
              <div className="card-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Votre CV (PDF)
              </div>
              <div className={`dropzone${drag ? " drag" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept=".pdf"
                  onChange={(e) => handleFile(e.target.files[0])} style={{ display: "none" }} />
                <div className="dropzone-icon">📄</div>
                <div className="dropzone-text"><strong>Glissez votre PDF ici</strong><br />ou cliquez pour parcourir</div>
              </div>
              {file && (
                <div className="file-selected">
                  <span style={{ fontSize: 18 }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{(file.size / 1024).toFixed(1)} Ko</div>
                  </div>
                  <span onClick={(e) => { e.stopPropagation(); resetFile(); }}
                    style={{ cursor: "pointer", opacity: 0.5, fontSize: 16, padding: "0 4px" }} title="Changer de CV">✕</span>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                Offre d'emploi
                {result && <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--accent3)", fontWeight: 500 }}>✦ Modifiez pour relancer</span>}
              </div>
              <textarea
                placeholder="Collez ici le texte complet de l'offre d'emploi visée..."
                value={jobDesc}
                onChange={(e) => handleJobDescChange(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="error-box"><span>⚠️</span><span>{error}</span></div>}

          <div className="btn-row">
            <button className="btn-analyze" onClick={handleSubmit} disabled={loading || !file || !jobDesc.trim()}>
              {loading ? "Analyse en cours..." : analysisCount > 0 ? "✦ Relancer l'analyse" : "✦ Analyser la compatibilité"}
            </button>
            {analysisCount > 0 && (
              <button className="btn-reset" onClick={resetAll}>Tout effacer</button>
            )}
          </div>
          <p className="hint-text">
            {analysisCount > 0 && !loading
              ? `${analysisCount} analyse${analysisCount > 1 ? "s" : ""} effectuée${analysisCount > 1 ? "s" : ""} · Changez l'offre ou le CV et relancez`
              : ""}
          </p>

          {/* ── Loading ── */}
          {loading && (
            <div className="loading-wrap">
              <div className="spinner" />
              <p className="loading-text">L'IA analyse votre CV et l'offre d'emploi…</p>
            </div>
          )}

          {/* ── Résultats — apparaissent SOUS le formulaire ── */}
          {result && !loading && (
            <div className="results" ref={resultsRef}>
              <div className="results-header">
                <h2 className="results-title">
                  Résultats
                  {analysisCount > 1 && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)", marginLeft: 10 }}>· analyse #{analysisCount}</span>}
                </h2>
              </div>

              <div className="score-section">
                <ScoreRing score={result.score} />
                <div className="score-info">
                  <div className="score-label" style={{ color: scoreColor }}>{scoreInfo.label}</div>
                  <div className="score-desc">{scoreInfo.desc}</div>
                  <div className="meter-track">
                    <div className="meter-fill" style={{ width: `${result.score}%`, background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})` }} />
                  </div>
                </div>
              </div>

              <div className="results-grid">
                <div className="result-card">
                  <div className="result-card-title"><span className="dot dot-red" />Hard Skills manquants</div>
                  <div className="keyword-list">
                    {(result.mots_cles_manquants?.length > 0 || result.hard_skills_manquants?.length > 0)
                      ? (result.mots_cles_manquants || result.hard_skills_manquants).map((kw, i) => <span key={i} className="keyword-tag">{kw}</span>)
                      : <span className="empty-state">Aucun identifié 🎉</span>}
                  </div>
                </div>
                <div className="result-card">
                  <div className="result-card-title"><span className="dot dot-purple" />Soft Skills manquants</div>
                  <div className="keyword-list">
                    {result.soft_skills_manquants?.length > 0
                      ? result.soft_skills_manquants.map((kw, i) => <span key={i} className="keyword-tag soft">{kw}</span>)
                      : <span className="empty-state">Aucun identifié 🎉</span>}
                  </div>
                </div>
              </div>

              <div className="result-card">
                <div className="result-card-title"><span className="dot dot-green" />Conseils d'optimisation IA</div>
                {result.conseils?.length > 0
                  ? <ul className="tips-list">{result.conseils.map((tip, i) => (
                      <li key={i}><span className="tip-num">{i + 1}</span><span>{tip}</span></li>
                    ))}</ul>
                  : <span className="empty-state">Aucun conseil généré.</span>}
              </div>
            </div>
          )}

          <hr className="divider" />
          <footer>AI Resume Matcher · Propulsé par <span>n8n</span> + <span>Groq Llama 3</span></footer>
        </div>
      </div>
    </>
  );
}