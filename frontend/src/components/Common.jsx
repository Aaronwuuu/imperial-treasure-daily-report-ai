import { useState } from "react";
import { tr } from "../i18n/translations";
import { request } from "../services/api";

export function Field({ label, hint, children }) {
  return <label className="field"><span>{label}</span>{hint && <small>{hint}</small>}{children}</label>;
}

export function ChecklistDrawer({ title, tone, items, values, onChange, onDelete, defaultOpen = false, language }) {
  const selectedCount = items.filter((item) => values[typeof item === "string" ? item : item.name]).length;
  return (
    <details className={`check-drawer ${tone}`} open={defaultOpen || undefined}>
      <summary><span>{tr(language, title)}</span><div><em>{language === "en" ? (selectedCount ? `${selectedCount} selected` : `${items.length} items`) : (selectedCount ? `已选 ${selectedCount}` : `${items.length} 项`)}</em><b>⌄</b></div></summary>
      <div className="check-list">
        {items.map((item) => {
          const name = typeof item === "string" ? item : item.name;
          return <div className={`check-item ${values[name] ? "checked" : ""}`} key={name}>
            <label><input type="checkbox" checked={Boolean(values[name])} onChange={(e) => onChange(name, e.target.checked)} /><span className="checkmark">✓</span><strong>{tr(language, name)}</strong></label>
            {onDelete && <button className="delete-item" type="button" aria-label={language === "en" ? `Delete ${name}` : `删除${name}`} onClick={() => onDelete(item)}>×</button>}
          </div>;
        })}
      </div>
    </details>
  );
}

export function AIContent({ content }) {
  if (!content) return null;
  return <div className="ai-content">{content.split("\n").map((line, index) => {
    if (line.startsWith("## ")) return <h3 key={index}>{line.slice(3)}</h3>;
    if (line.startsWith("# ")) return <h2 key={index}>{line.slice(2)}</h2>;
    if (line.startsWith("- ") || /^\d+\. /.test(line)) return <div className="report-point" key={index}>{line}</div>;
    return line.trim() ? <p key={index}>{line}</p> : <div className="report-space" key={index} />;
  })}</div>;
}

export function LoginScreen({ onLogin, language, setLanguage }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const login = async () => {
    if (!code.trim()) return;
    setBusy(true); setError("");
    window.localStorage.setItem("restaurant_access_code", code.trim());
    try { const result = await request("/auth/login", { method: "POST" }); onLogin(result.role); }
    catch (err) { window.localStorage.removeItem("restaurant_access_code"); setError(err.message); }
    finally { setBusy(false); }
  };
  return <div className="login-page"><div className="login-card"><div className="language-toggle"><button className={language === "zh" ? "active" : ""} onClick={() => setLanguage("zh")}>中文</button><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button></div><div className="hero-mark">宝</div><span className="eyebrow">{language === "en" ? "IMPERIAL TREASURE" : "BAO ZANG"}</span><h1>{language === "en" ? "Imperial Treasure" : "宝藏"}</h1><p>{tr(language, "请输入店长、领班或员工访问码")}</p><input type="password" inputMode="text" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder={tr(language, "访问码")} autoFocus />{error && <small>{error}</small>}<button onClick={login} disabled={busy}>{tr(language, busy ? "正在登录…" : "进入系统")}</button></div></div>;
}
