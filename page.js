"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const navItems = [["overview", "⌂", "الرئيسية"], ["problems", "◎", "بنك المشكلات"], ["teams", "♧", "اكتشف الفرق"], ["projects", "▤", "مشاريعي"], ["profile", "◉", "ملفي الشخصي"]];

async function api(path, { token, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "حدث خطأ في الاتصال بالخادم");
  return data;
}

export default function Home() {
  const [token, setToken] = useState("");
  const [student, setStudent] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ name: "", email: "", password: "", university: "", major: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [active, setActive] = useState("overview");
  const [problems, setProblems] = useState([]);
  const [voted, setVoted] = useState([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("عام");
  const [newSkills, setNewSkills] = useState("Frontend, Backend");
  const [skills, setSkills] = useState([]);
  const [skillsInput, setSkillsInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  function notify(message) { setToast(message); window.setTimeout(() => setToast(""), 2800); }
  async function loadData(currentToken = token) {
    if (!currentToken) return;
    setBusy(true);
    try {
      const [me, list, mySkills] = await Promise.all([
        api("/auth/me", { token: currentToken }), api("/problems", { token: currentToken }), api("/students/me/skills", { token: currentToken })
      ]);
      setStudent(me); setProblems(list.map(normalizeProblem)); setSkills(mySkills.skills || []); setSkillsInput((mySkills.skills || []).join(", "));
    } catch (error) { notify(error.message); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const saved = window.localStorage.getItem("midad_token");
    if (saved) { setToken(saved); loadData(saved); }
  }, []);

  async function submitAuth(e) {
    e.preventDefault(); setAuthBusy(true); setAuthError("");
    try {
      const result = await api(authMode === "login" ? "/auth/login" : "/auth/register", { method: "POST", body: JSON.stringify(auth) });
      window.localStorage.setItem("midad_token", result.access_token); setToken(result.access_token); setStudent(result.student); await loadData(result.access_token);
    } catch (error) { setAuthError(error.message); }
    finally { setAuthBusy(false); }
  }
  function logout() { window.localStorage.removeItem("midad_token"); setToken(""); setStudent(null); setProblems([]); setSkills([]); }
  async function addProblem(e) {
    e.preventDefault();
    try {
      const created = await api("/problems", { token, method: "POST", body: JSON.stringify({ title: newTitle, description: newDescription, category: newCategory, required_skills: newSkills.split(",").map(x => x.trim()).filter(Boolean) }) });
      setProblems(old => [normalizeProblem(created), ...old]); setNewTitle(""); setNewDescription(""); setShowForm(false); setActive("problems"); notify("تم نشر المشكلة وحفظها في قاعدة البيانات");
    } catch (error) { notify(error.message); }
  }
  async function vote(id) {
    try { const result = await api(`/problems/${id}/vote`, { token, method: "POST" }); setVoted(old => [...old, id]); setProblems(old => old.map(p => p.id === id ? { ...p, votes: result.votes_count } : p)); notify("تم تسجيل تصويتك"); }
    catch (error) { notify(error.message.includes("Already voted") ? "سبق وصوّتِ لهذه المشكلة" : error.message); }
  }
  async function saveSkills(e) {
    e.preventDefault();
    try { const result = await api("/students/me/skills", { token, method: "PUT", body: JSON.stringify({ skills: skillsInput.split(",").map(x => x.trim()).filter(Boolean) }) }); setSkills(result.skills); notify("تم حفظ مهاراتك"); }
    catch (error) { notify(error.message); }
  }

  const filteredProblems = useMemo(() => problems.filter(p => `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(query.toLowerCase())), [problems, query]);
  const pageTitle = navItems.find(n => n[0] === active)?.[2] || "الرئيسية";

  if (!token || !student) return <main className="auth-shell"><form className="auth-card" onSubmit={submitAuth}>
    <div className="brand auth-brand"><div className="brand-mark">M</div><div><strong>MIDAD</strong><span>مِــــداد</span></div></div>
    <span className="eyebrow">FROM PROBLEMS TO POSSIBILITIES</span><h1>{authMode === "login" ? "مرحبًا بعودتك" : "انضمي إلى مِداد"}</h1><p>مساحة تجمع احتياجات المجتمع الجامعي بالطلاب القادرين على تحويلها إلى حلول.</p>
    {authMode === "register" && <><label>الاسم الكامل<input required minLength="2" value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="اسمك" /></label><label>الجامعة<input value={auth.university} onChange={e => setAuth({ ...auth, university: e.target.value })} placeholder="اسم الجامعة" /></label><label>التخصص<input value={auth.major} onChange={e => setAuth({ ...auth, major: e.target.value })} placeholder="علوم الحاسب" /></label></>}
    <label>البريد الإلكتروني<input required type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="name@example.com" /></label>
    <label>كلمة المرور<input required type="password" minLength={authMode === "register" ? 8 : 1} value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder={authMode === "register" ? "8 أحرف على الأقل" : "كلمة المرور"} /></label>
    {authError && <p className="auth-error">{authError}</p>}
    <button className="primary-btn full" disabled={authBusy}>{authBusy ? "جارٍ المعالجة..." : authMode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</button>
    <button type="button" className="text-btn auth-switch" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "ما عندك حساب؟ أنشئي حسابًا" : "لديك حساب؟ سجّلي الدخول"}</button>
  </form></main>;

  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">M</div><div><strong>MIDAD</strong><span>مِــــداد</span></div></div><div className="workspace-label">مساحة الطالب</div>
      <nav className="nav-list">{navItems.map(([key, icon, label]) => <button key={key} className={`nav-item ${active === key ? "active" : ""}`} onClick={() => setActive(key)}><span className="nav-icon">{icon}</span><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✦</div><strong>عندك فكرة؟</strong><p>حوّلي احتياجك إلى فرصة ابتكار.</p><button onClick={() => setShowForm(true)}>أضيفي مشكلة <span>＋</span></button></div>
      <div className="user-mini"><div className="avatar">{student.name?.[0] || "ط"}</div><div><strong>{student.name}</strong><span>{student.major || "طالبة جامعية"}</span></div><button className="logout-btn" onClick={logout}>خروج</button></div></div>
    </aside>
    <section className="main-area"><header className="topbar"><div className="breadcrumb"><span>MIDAD</span><b>/</b>{pageTitle}</div><div className="top-actions"><label className="search-box"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث عن مشكلة..." /></label><div className="top-avatar">{student.name?.[0] || "ط"}</div></div></header>
      <div className="content">
        {active === "overview" && <><section className="welcome-row"><div><div className="eyebrow"><span className="pulse" /> مساحة الابتكار الجامعي</div><h1>أهلًا {student.name}، <em>مستعدة تصنعين أثر؟</em> ✨</h1><p>اكتشفي المشكلات، شاركي مهاراتك، وابدئي مشروعًا يصنع فرقًا.</p></div><button className="primary-btn" onClick={() => setShowForm(true)}>＋ أضيفي مشكلة</button></section>
          <section className="stats-grid"><Stat label="المشكلات المنشورة" value={problems.length} trend="احتياجات المجتمع الجامعي" icon="◎" /><Stat label="مهاراتي" value={skills.length} trend="مهارات محفوظة في ملفك" icon="⌘" /><Stat label="تصويتاتي" value={voted.length} trend="مشاركاتك في بنك المشكلات" icon="♡" /><Stat label="حالة الاتصال" value={busy ? "..." : "متصل"} trend="البيانات من الخادم" icon="●" /></section>
          <section className="section-heading"><div><span className="eyebrow">DISCOVER</span><h2>مشكلات تستحق الحل</h2><p>احتياجات حقيقية قد تتحول إلى مشاريع تقنية.</p></div><button className="text-btn" onClick={() => setActive("problems")}>عرض الكل ←</button></section>
          <div className="problem-grid">{problems.slice(0, 2).map(p => <ProblemCard key={p.id} problem={p} voted={voted.includes(p.id)} onVote={() => vote(p.id)} />)}</div>
        </>}
        {active === "problems" && <><PageIntro eyebrow="PROBLEM HUB" title="بنك المشكلات" description="شارك مشكلة تواجهك، أو اكتشف احتياجات يمكن تحويلها إلى حلول." action={<button className="primary-btn" onClick={() => setShowForm(true)}>＋ أضف مشكلة</button>} />
          {busy && <p className="loading-note">جارٍ تحميل المشكلات...</p>}<div className="problem-list">{filteredProblems.map(p => <ProblemCard key={p.id} problem={p} voted={voted.includes(p.id)} onVote={() => vote(p.id)} />)}</div>{!filteredProblems.length && <EmptyState text="لا توجد مشكلات مطابقة حاليًا. كوني أول من يضيف مشكلة." />}</>}
        {active === "teams" && <><PageIntro eyebrow="TEAM MATCHING" title="اكتشفي فريقك" description="ابدئي بمشاركة مهاراتك، ثم سنعرض لك الطلاب المطابقين لمتطلبات المشكلات." /><div className="panel"><h3>مهاراتك المسجلة</h3><p>اكتبي المهارات مفصولة بفاصلة إنجليزية، مثل Java, Python, UI/UX.</p><form className="skills-form" onSubmit={saveSkills}><input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="Java, Python, React" /><button className="primary-btn">حفظ المهارات</button></form><div className="skill-tags">{skills.map(s => <span key={s}>{s}</span>)}</div></div></>}
        {active === "projects" && <><PageIntro eyebrow="MY PROJECTS" title="مشاريعي" description="ستظهر هنا المشاريع التي تنضمين إليها. هذه المساحة جاهزة للمرحلة التالية." /><div className="empty-state"><span>▤</span><p>لا توجد مشاريع مرتبطة بحسابك حتى الآن.</p></div></>}
        {active === "profile" && <><PageIntro eyebrow="MY PROFILE" title="ملفي الشخصي" description="بيانات حسابك المسجلة في منصة مِداد." /><div className="profile-card"><div className="profile-cover" /><div className="profile-info"><div className="profile-avatar">{student.name?.[0]}</div><h2>{student.name}</h2><p>{student.major || "التخصص غير محدد"} · {student.university || "الجامعة غير محددة"}</p><div className="tag-row">{skills.map(s => <span key={s}>{s}</span>)}</div><button className="secondary-btn" onClick={() => setActive("teams")}>إدارة مهاراتي</button></div></div></>}
      </div>
    </section>
    {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><form className="modal" onSubmit={addProblem} onClick={e => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowForm(false)}>×</button><span className="eyebrow">NEW PROBLEM</span><h2>شاركي مشكلة تستحق الحل</h2><p>ستُحفظ المشكلة في قاعدة البيانات وتصبح متاحة للطلاب.</p><label>عنوان المشكلة<input required minLength="5" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="مثال: صعوبة الوصول للفرص التقنية" /></label><label>وصف المشكلة<textarea required minLength="10" rows="4" value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="ما المشكلة؟ ومن المتأثر بها؟" /></label><label>التصنيف<input value={newCategory} onChange={e => setNewCategory(e.target.value)} /></label><label>المهارات المطلوبة<input value={newSkills} onChange={e => setNewSkills(e.target.value)} placeholder="Frontend, Python, Database" /></label><button className="primary-btn full" type="submit">نشر المشكلة</button></form></div>}
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}
function normalizeProblem(p) { return { id: p.id, title: p.title, description: p.description, category: p.category, status: p.status, votes: p.votes_count, affected: "—", skills: p.required_skills || [] }; }
function Stat({ label, value, trend, icon }) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><b>{icon}</b></div><strong>{value}</strong><small>{trend}</small></div>; }
function PageIntro({ eyebrow, title, description, action }) { return <section className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</section>; }
function ProblemCard({ problem, voted, onVote }) { return <article className="problem-card"><div className="problem-card-top"><span className="category">{problem.category}</span><span className="status-pill">{problem.status}</span></div><h3>{problem.title}</h3><p>{problem.description}</p><div className="skill-tags">{problem.skills.map(s => <span key={s}>{s}</span>)}</div><div className="problem-footer"><div className="problem-metrics"><span>♡ {problem.votes} تصويت</span></div><button className={`vote-btn ${voted ? "voted" : ""}`} onClick={onVote}>{voted ? "تم التصويت ✓" : "صوّت للمشكلة ↑"}</button></div></article>; }
function EmptyState({ text }) { return <div className="empty-state"><span>⌕</span><p>{text}</p></div>; }
