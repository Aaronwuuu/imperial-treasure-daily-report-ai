import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const weekdayEnglish = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EN = {
  "请输入店长、领班或员工访问码": "Enter your manager, shift lead, or employee access code",
  "访问码": "Access code", "正在登录…": "Signing in…", "进入系统": "Sign in",
  "把今天的现场情况，清楚地交接给明天。": "Turn today's operations into a clear handoff for tomorrow.",
  "店长": "Manager", "领班": "Shift Lead", "员工": "Employee", "退出": "Sign out",
  "工作日期": "Work date", "选择日期": "Select date", "员工班表": "Schedule",
  "领班报告": "Shift Report", "前厅补货": "Restock", "AI 报告": "AI Reports",
  "正在读取当天记录…": "Loading daily records…", "本周班表": "Weekly Schedule",
  "选择排班周": "Select schedule week", "上一周": "Previous", "本周": "This week", "下一周": "Next",
  "点击格子中的下拉菜单安排员工，空白表示该班次无人。": "Use each cell menu to assign staff. Leave it blank when no one is scheduled.",
  "左右滑动可以查看完整的一周班表。": "Swipe sideways to view the full weekly schedule.",
  "班表": "Schedule", "日期": "Date", "午休": "Break", "检查加班风险": "Check overtime",
  "AI 分析中…": "AI analyzing…", "保存整周班表": "Save full week",
  "加班风险分析": "Overtime Risk", "工时正常": "Hours OK", "排班调整建议": "Schedule Suggestions",
  "AI 调整建议": "AI Schedule Suggestions", "员工名册管理": "Employee Directory",
  "输入新员工姓名": "Enter new employee name", "添加员工": "Add employee", "移除": "Remove",
  "值班信息": "Shift Information", "星期": "Weekday", "今日领班": "Shift lead",
  "填写领班姓名": "Enter shift lead name", "出品与服务": "Food & Service", "现场反馈": "Operations Feedback",
  "烤鸭反馈": "Roast Duck Feedback", "后厨菜品反馈": "Kitchen Feedback", "前台出菜情况": "Service Timing",
  "员工情况": "Employee Notes", "选填": "Optional", "来自当天班表": "From schedule",
  "评价选填，可直接留空": "Optional comment — leave blank if not needed", "员工上班情况": "Attendance",
  "其他事项": "Other Items", "交接提醒": "Handoff Notes", "特殊事宜": "Special Items",
  "节假日事宜": "Holiday Items", "保存草稿": "Save Draft", "提交今日总结": "Submit Daily Report",
  "补货清单": "Restock Checklist", "包装耗材": "Packaging Supplies", "饮品": "Beverages",
  "饮料": "Drinks", "啤酒": "Beer", "新增饮品种类": "Add Beverage Type", "永久保存": "Saved Permanently",
  "添加": "Add", "补货备注": "Restock Notes", "当前状态": "Status", "待确认": "Pending",
  "已提交": "Submitted", "已完成": "Completed", "保存清单": "Save Checklist", "提交补货单": "Submit Restock",
  "智能运营报告": "AI Operations Report", "AI 已连接": "AI Connected", "等待配置": "Setup Required",
  "周度报告": "Weekly Report", "月度报告": "Monthly Report", "报告范围": "Report Range",
  "有日报天数": "Days Logged", "已提交日报": "Reports Submitted", "员工记录": "Employee Notes",
  "补货记录天数": "Restock Days", "周度总结": "Weekly Summary", "月度总结": "Monthly Summary",
  "已保存": "Saved", "返回日报": "Back to Daily Report", "重新生成报告": "Regenerate Report",
  "生成 AI 报告": "Generate AI Report", "AI 正在分析…": "AI analyzing…", "草稿": "Draft",
  "黑盒": "Black Containers", "牛皮纸盒": "Kraft Boxes", "汤桶": "Soup Containers",
  "外卖袋子": "Takeout Bags", "餐巾纸及清洁用品": "Napkins & Cleaning Supplies",
  "12oz小黑盒": "12 oz Small Black Container", "锡纸盘的盖子": "Foil Tray Lid",
  "外卖大锡纸盘": "Large Takeout Foil Tray", "打米饭的小白盒": "Small White Rice Container",
  "32oz盒子": "32 oz Container", "大号牛皮纸盒": "Large Kraft Box", "小号牛皮纸盒": "Small Kraft Box",
  "64oz胖汤桶": "64 oz Wide Soup Container", "32oz高汤桶": "32 oz Tall Soup Container",
  "16oz矮汤桶": "16 oz Short Soup Container", "8oz扁汤桶": "8 oz Flat Soup Container",
  "大号外卖袋": "Large Takeout Bag", "中号外卖袋": "Medium Takeout Bag", "小号外卖袋": "Small Takeout Bag",
  "餐巾纸": "Napkins", "厕纸": "Toilet Paper", "马桶坐垫": "Toilet Seat Covers",
  "擦手纸": "Paper Towels", "绿色包装": "Green Package", "红色包装": "Red Package",
  "早班": "Morning Shift", "晚班": "Evening Shift", "已停用": "Inactive",
  "人超时": " over limit", "名员工": " employees", "本周预警线：每人": "Weekly warning threshold per employee:",
  "小时。该提示用于排班辅助，最终请以当地劳动法规和实际打卡为准。": "hours. Use this as scheduling guidance; local labor rules and actual clock-ins take precedence.",
  "新员工添加一次后，就会出现在班表每个格子的下拉菜单中。移除员工不会删除以前的班表和报告。": "Add a new employee once and they will appear in every schedule menu. Removing an employee will not delete past schedules or reports.",
  "口感、出品质量、客人反馈…": "Taste, food quality, guest feedback…", "菜品质量、缺货、退菜情况…": "Food quality, shortages, returned dishes…",
  "出菜速度、漏单、催菜情况…": "Service speed, missed orders, delayed dishes…", "迟到、请假、换班、人员安排…": "Late arrivals, leave, shift swaps, staffing…",
  "设备、客诉、预订或其他需要关注的事项…": "Equipment, complaints, reservations, or other concerns…",
  "节假日备货、排班、活动安排…": "Holiday inventory, staffing, and promotions…",
  "当天班表暂无员工。请先由店长完成排班。": "No employees are scheduled today. Ask the manager to complete the schedule first.",
  "展开分类，勾选需要补货的物品即可，不再填写数量。": "Open each category and check the items that need restocking. No quantities are required.",
  "手机上新增后所有人都能看到；停卖的饮品可点清单右侧 × 删除。": "New beverages added on a phone are visible to everyone. Remove discontinued items with the × button.",
  "供应商、到货时间或其他要求…": "Supplier, delivery time, or other requests…", "例如：雪碧": "Example: Sprite",
  "系统会自动汇总每日总结、员工表现和补货记录，再生成管理层可直接阅读的报告。": "Daily reports, employee performance, and restock records are combined into a management-ready summary.",
  "还差一步即可使用 AI": "One more step to enable AI", "尚未生成这段时间的报告": "No report has been generated for this period",
  "已有运营数据，可以开始生成。": "Operations data is ready to analyze.", "请先填写并保存这段时间内的每日记录。": "Please complete and save daily records for this period first.",
};
const tr = (language, text) => language === "en" ? (EN[text] || text) : text;
const supplyGroups = [
  { title: "黑盒", items: ["12oz小黑盒", "锡纸盘的盖子", "外卖大锡纸盘", "打米饭的小白盒", "32oz盒子"] },
  { title: "牛皮纸盒", items: ["大号牛皮纸盒", "小号牛皮纸盒"] },
  { title: "汤桶", items: ["64oz胖汤桶", "32oz高汤桶", "16oz矮汤桶", "8oz扁汤桶"] },
  { title: "外卖袋子", items: ["大号外卖袋", "中号外卖袋", "小号外卖袋"] },
  { title: "餐巾纸及清洁用品", items: ["餐巾纸", "厕纸", "马桶坐垫", "擦手纸", "绿色包装", "红色包装"] },
];
const scheduleSlots = [
  { key: "am_pink", time: "10:30am – 2:30pm", color: "pink", position: "早班" },
  { key: "am_blue_1", time: "10:45am – 2:15pm", color: "blue", position: "早班" },
  { key: "am_red", time: "10:45am – 2:15pm", color: "red", position: "早班" },
  { key: "am_blue_2", time: "11:00am – 2:30pm", color: "blue", position: "早班" },
  { key: "am_orange", time: "11:00am – 2:30pm", color: "orange", position: "早班" },
  { key: "am_blue_3", time: "11:30am – 3:00pm", color: "blue", position: "早班" },
  { key: "am_yellow", time: "11:30am – 3:00pm", color: "yellow", position: "早班" },
  { key: "break", break: true, label: "午休" },
  { key: "pm_pink", time: "4:30pm – 8:30pm", color: "pink", position: "晚班" },
  { key: "pm_red", time: "4:45pm – 9:30pm", color: "red", position: "晚班" },
  { key: "pm_blue_1", time: "5:00pm – 9:30pm", color: "blue", position: "晚班" },
  { key: "pm_orange", time: "5:00pm – 9:30pm", color: "orange", position: "晚班" },
  { key: "pm_blue_2", time: "5:00pm – 9:30pm", color: "blue", position: "晚班" },
  { key: "pm_blue_3", time: "5:30pm – 9:30pm", color: "blue", position: "晚班" },
  { key: "pm_yellow", time: "5:30pm – 9:30pm", color: "yellow", position: "晚班" },
];
const emptyReport = (recordDate) => ({
  record_date: recordDate, weekday: weekdays[new Date(`${recordDate}T12:00:00`).getDay()], supervisor: "",
  roast_duck_feedback: "", kitchen_feedback: "", serving_status: "", employee_issues: [],
  attendance: "", special_notes: "", holiday_notes: "", status: "草稿",
});
const emptyOrder = (recordDate) => ({
  record_date: recordDate, supplies: {}, drinks: {}, beers: {}, notes: "", status: "待确认",
});

function dateToWeekValue(dateText) {
  const value = new Date(`${dateText}T12:00:00`);
  const utc = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekValueToMonday(weekValue) {
  const [yearText, weekText] = weekValue.split("-W");
  const year = Number(yearText); const week = Number(weekText);
  const januaryFourth = new Date(`${year}-01-04T12:00:00`);
  const monday = new Date(januaryFourth);
  monday.setDate(januaryFourth.getDate() - ((januaryFourth.getDay() + 6) % 7) + (week - 1) * 7);
  return monday.toLocaleDateString("en-CA");
}

async function request(path, options) {
  const accessCode = window.localStorage.getItem("restaurant_access_code") || "";
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", "X-Access-Code": accessCode }, ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "操作失败，请稍后重试");
  }
  return response.json();
}

function Field({ label, hint, children }) {
  return <label className="field"><span>{label}</span>{hint && <small>{hint}</small>}{children}</label>;
}

function ChecklistDrawer({ title, tone, items, values, onChange, onDelete, defaultOpen = false, language }) {
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

function AIContent({ content }) {
  if (!content) return null;
  return <div className="ai-content">{content.split("\n").map((line, index) => {
    if (line.startsWith("## ")) return <h3 key={index}>{line.slice(3)}</h3>;
    if (line.startsWith("# ")) return <h2 key={index}>{line.slice(2)}</h2>;
    if (line.startsWith("- ") || /^\d+\. /.test(line)) return <div className="report-point" key={index}>{line}</div>;
    return line.trim() ? <p key={index}>{line}</p> : <div className="report-space" key={index} />;
  })}</div>;
}

function LoginScreen({ onLogin, language, setLanguage }) {
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

function App() {
  const today = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const [language, setLanguageState] = useState(() => window.localStorage.getItem("baozang_language") || "zh");
  const setLanguage = (value) => { setLanguageState(value); window.localStorage.setItem("baozang_language", value); };
  const t = (text) => tr(language, text);
  const [selectedDate, setSelectedDate] = useState(today);
  const [role, setRole] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState("report");
  const [report, setReport] = useState(emptyReport(today));
  const [order, setOrder] = useState(emptyOrder(today));
  const [catalog, setCatalog] = useState({ drinks: [], beers: [] });
  const [employeeDirectory, setEmployeeDirectory] = useState([]);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [selectedEmployeeNames, setSelectedEmployeeNames] = useState([]);
  const [aiPeriod, setAiPeriod] = useState("week");
  const [aiReportInfo, setAiReportInfo] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [scheduleAnchorDate, setScheduleAnchorDate] = useState(today);
  const [overtimeAnalysis, setOvertimeAnalysis] = useState(null);
  const [analyzingOvertime, setAnalyzingOvertime] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [addingType, setAddingType] = useState("drink");
  const [employee, setEmployee] = useState({ name: "", score: 5, notes: "" });
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  const flash = (message, kind = "success") => {
    setNotice({ message, kind });
    window.setTimeout(() => setNotice(null), 2600);
  };

  useEffect(() => {
    if (!window.localStorage.getItem("restaurant_access_code")) { setCheckingAuth(false); return; }
    request("/auth/login", { method: "POST" }).then((result) => {
      setRole(result.role); setTab(result.role === "employee" ? "schedule" : "report");
    }).catch(() => window.localStorage.removeItem("restaurant_access_code")).finally(() => setCheckingAuth(false));
  }, []);

  useEffect(() => {
    if (!role || role === "employee") return;
    let active = true;
    setLoading(true);
    Promise.all([
      request(`/daily-reports/${selectedDate}`),
      request(`/replenishments/${selectedDate}`),
      request("/catalog"),
      request("/employees"),
    ]).then(([savedReport, savedOrder, savedCatalog, savedEmployees]) => {
      if (!active) return;
      setReport(savedReport || emptyReport(selectedDate));
      setOrder(savedOrder || emptyOrder(selectedDate));
      setCatalog(savedCatalog);
      setEmployeeDirectory(savedEmployees);
    }).catch((error) => flash(error.message, "error")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedDate, role]);

  useEffect(() => {
    if (role !== "manager") return;
    let active = true;
    request(`/ai-reports?report_type=${aiPeriod}&anchor_date=${selectedDate}&language=${language}`)
      .then((data) => active && setAiReportInfo(data))
      .catch((error) => flash(error.message, "error"));
    return () => { active = false; };
  }, [selectedDate, aiPeriod, role, language]);

  useEffect(() => {
    setOvertimeAnalysis(null);
  }, [language]);

  const weekDates = useMemo(() => {
    const anchor = new Date(`${scheduleAnchorDate}T12:00:00`);
    const mondayOffset = (anchor.getDay() + 6) % 7;
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(monday); day.setDate(monday.getDate() + index);
      return day.toLocaleDateString("en-CA");
    });
  }, [scheduleAnchorDate]);

  useEffect(() => {
    if (!role) return;
    request(`/schedules?start_date=${weekDates[0]}&end_date=${weekDates[6]}`)
      .then(setSchedule).catch((error) => flash(error.message, "error"));
  }, [role, weekDates]);

  useEffect(() => {
    if (!role || role === "employee") return;
    const scheduledNames = [...new Set(schedule.filter((item) => item.shift_date === selectedDate).map((item) => item.name))];
    if (!scheduledNames.length) return;
    setReport((current) => {
      const existing = new Set(current.employee_issues.map((item) => item.name));
      const missing = scheduledNames.filter((name) => !existing.has(name)).map((name) => ({ name, score: null, notes: "" }));
      return missing.length ? { ...current, employee_issues: [...current.employee_issues, ...missing] } : current;
    });
  }, [schedule, selectedDate, role, loading]);

  const updateReport = (key, value) => setReport((current) => ({ ...current, [key]: value }));
  const updateQuantity = (group, name, value) => setOrder((current) => ({
    ...current, [group]: { ...current[group], [name]: value },
  }));

  const addEmployee = () => {
    const manualName = employee.name.trim();
    const names = [...new Set([...selectedEmployeeNames, ...(manualName ? [manualName] : [])])];
    if (names.length === 0) return flash("请先选择至少一名员工", "error");
    const score = Number(employee.score);
    if (employee.score === "" || Number.isNaN(score) || score < 0 || score > 5) {
      return flash("评分请输入 0 到 5 之间的数字", "error");
    }
    const newRecords = names.map((name) => ({ name, score, notes: employee.notes }));
    updateReport("employee_issues", [...report.employee_issues, ...newRecords]);
    setEmployee({ name: "", score: 5, notes: "" });
    setSelectedEmployeeNames([]);
    flash(`已为 ${names.length} 名员工添加评分`);
  };

  const addEmployeeToDirectory = async () => {
    if (!newEmployeeName.trim()) return flash("请输入员工姓名", "error");
    try {
      const saved = await request("/employees", {
        method: "POST", body: JSON.stringify({ name: newEmployeeName.trim() }),
      });
      setEmployeeDirectory((current) => [...current, saved]);
      setSelectedEmployeeNames((current) => [...new Set([...current, saved.name])]);
      setNewEmployeeName("");
      flash(`${saved.name} 已加入员工名册`);
    } catch (error) { flash(error.message, "error"); }
  };

  const deleteEmployeeFromDirectory = async (directoryEmployee) => {
    if (!window.confirm(`确定将“${directoryEmployee.name}”移出员工名册吗？历史记录不会删除。`)) return;
    try {
      await request(`/employees/${directoryEmployee.id}`, { method: "DELETE" });
      setEmployeeDirectory((current) => current.filter((item) => item.id !== directoryEmployee.id));
      setSelectedEmployeeNames((current) => current.filter((name) => name !== directoryEmployee.name));
      flash(`${directoryEmployee.name} 已移出员工名册`);
    } catch (error) { flash(error.message, "error"); }
  };

  const generateAIReport = async () => {
    setGeneratingReport(true);
    try {
      const saved = await request("/ai-reports/generate", {
        method: "POST",
        body: JSON.stringify({ report_type: aiPeriod, anchor_date: selectedDate, language }),
      });
      setAiReportInfo((current) => ({ ...current, saved_report: saved, source_summary: saved.source_summary }));
      flash(language === "en" ? `${aiPeriod === "week" ? "Weekly" : "Monthly"} report generated and saved` : `${aiPeriod === "week" ? "周度" : "月度"}报告已生成并保存`);
    } catch (error) { flash(error.message, "error"); }
    finally { setGeneratingReport(false); }
  };

  const updateScheduleCell = (day, slot, employeeIdValue) => {
    const employeeId = Number(employeeIdValue);
    setSchedule((current) => {
      const withoutCell = current.filter((item) => !(item.shift_date === day && item.slot_key === slot.key));
      if (!employeeId) return withoutCell;
      const person = employeeDirectory.find((item) => item.id === employeeId);
      const [startTime, endTime] = slot.time.replaceAll("am", "").replaceAll("pm", "").split(" – ");
      return [...withoutCell, { shift_date: day, slot_key: slot.key, employee_id: employeeId, name: person?.name || "", start_time: startTime, end_time: endTime, position: slot.position, color: slot.color }];
    });
  };

  const saveWeeklySchedule = async () => {
    try {
      const results = await Promise.all(weekDates.map((day) => request(`/schedules/${day}`, {
        method: "PUT",
        body: JSON.stringify({ shift_date: day, cells: schedule.filter((item) => item.shift_date === day).map(({ employee_id, slot_key, start_time, end_time, position, color }) => ({ employee_id, slot_key, start_time, end_time, position, color })) }),
      })));
      setSchedule(results.flat());
      flash("本周班表已保存");
      await runOvertimeAnalysis();
    } catch (error) { flash(error.message, "error"); }
  };

  const moveScheduleWeek = (weeks) => {
    const next = new Date(`${scheduleAnchorDate}T12:00:00`);
    next.setDate(next.getDate() + weeks * 7);
    setScheduleAnchorDate(next.toLocaleDateString("en-CA"));
  };

  const runOvertimeAnalysis = async () => {
    setAnalyzingOvertime(true);
    try {
      const result = await request("/schedules/overtime-analysis", {
        method: "POST", body: JSON.stringify({ start_date: weekDates[0], end_date: weekDates[6], language }),
      });
      setOvertimeAnalysis(result);
    } catch (error) { flash(error.message, "error"); }
    finally { setAnalyzingOvertime(false); }
  };

  const logout = () => { window.localStorage.removeItem("restaurant_access_code"); setRole(null); };

  if (checkingAuth) return <div className="loading">{language === "en" ? "Verifying identity…" : "正在验证身份…"}</div>;
  if (!role) return <LoginScreen language={language} setLanguage={setLanguage} onLogin={(newRole) => { setRole(newRole); setTab(newRole === "employee" ? "schedule" : "report"); }} />;

  const saveReport = async (status) => {
    try {
      const saved = await request(`/daily-reports/${selectedDate}`, {
        method: "PUT", body: JSON.stringify({ ...report, record_date: selectedDate, status }),
      });
      setReport(saved); flash(status === "已提交" ? "今日总结已提交" : "草稿已保存");
    } catch (error) { flash(error.message, "error"); }
  };

  const saveOrder = async (status) => {
    try {
      const saved = await request(`/replenishments/${selectedDate}`, {
        method: "PUT", body: JSON.stringify({ ...order, record_date: selectedDate, status }),
      });
      setOrder(saved); flash(status === "已提交" ? "补货单已提交" : "补货单已保存");
    } catch (error) { flash(error.message, "error"); }
  };

  const addCatalogItem = async () => {
    if (!newItem.trim()) return;
    try {
      const saved = await request("/catalog", {
        method: "POST", body: JSON.stringify({ category: addingType, name: newItem.trim() }),
      });
      const key = addingType === "drink" ? "drinks" : "beers";
      setCatalog((current) => ({ ...current, [key]: [...current[key], saved] }));
      setNewItem(""); flash(`${saved.name} 已加入并永久保存`);
    } catch (error) { flash(error.message, "error"); }
  };

  const deleteCatalogItem = async (item) => {
    if (!window.confirm(`确定删除“${item.name}”吗？以后需要时仍可重新添加。`)) return;
    try {
      await request(`/catalog/${item.id}`, { method: "DELETE" });
      const key = item.category === "drink" ? "drinks" : "beers";
      setCatalog((current) => ({
        ...current,
        [key]: current[key].filter((entry) => entry.id !== item.id),
      }));
      flash(`${item.name} 已从品类中删除`);
    } catch (error) { flash(error.message, "error"); }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div><span className="eyebrow">{language === "en" ? "IMPERIAL TREASURE" : "BAO ZANG"}</span><h1>{language === "en" ? "Imperial Treasure" : "宝藏"}</h1><p>{t("把今天的现场情况，清楚地交接给明天。")}</p></div>
        <div className="header-actions"><div className="language-toggle"><button className={language === "zh" ? "active" : ""} onClick={() => setLanguage("zh")}>中</button><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button></div><span>{t(role === "manager" ? "店长" : role === "leader" ? "领班" : "员工")}</span><button onClick={logout}>{t("退出")}</button><div className="hero-mark">宝</div></div>
      </header>

      <main>
        <section className="date-card">
          <div className="date-icon">日</div>
          <div><span className="muted">{t("工作日期")}</span><strong>{selectedDate}</strong><em>{language === "en" ? weekdayEnglish[new Date(`${selectedDate}T12:00:00`).getDay()] : weekdays[new Date(`${selectedDate}T12:00:00`).getDay()]}</em></div>
          <input aria-label={t("选择日期")} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </section>

        <nav className="tabs">
          <button className={tab === "schedule" ? "active" : ""} onClick={() => setTab("schedule")}><span>▤</span> {t("员工班表")}</button>
          {role !== "employee" && <button className={tab === "report" ? "active" : ""} onClick={() => { setScheduleAnchorDate(selectedDate); setTab("report"); }}><span>✦</span> {t("领班报告")}</button>}
          {role !== "employee" && <button className={tab === "stock" ? "active" : ""} onClick={() => setTab("stock")}><span>▦</span> {t("前厅补货")}</button>}
          {role === "manager" && <button className={tab === "ai" ? "active" : ""} onClick={() => setTab("ai")}><span>◎</span> {t("AI 报告")}</button>}
        </nav>

        {tab !== "schedule" && loading ? <div className="loading">{t("正在读取当天记录…")}</div> : tab === "schedule" ? (
          <div className="page-stack">
            <section className="card schedule-card">
              <div className="section-heading"><div><span className="step blue">班</span><h2>{t("本周班表")}</h2></div><span className="pill blue">{weekDates[0]} — {weekDates[6]}</span></div>
              <div className="week-picker">
                <label><span>{t("选择排班周")}</span><input type="week" value={dateToWeekValue(scheduleAnchorDate)} onChange={(e) => e.target.value && setScheduleAnchorDate(weekValueToMonday(e.target.value))} /></label>
                <div><button onClick={() => moveScheduleWeek(-1)}>← {t("上一周")}</button><button onClick={() => setScheduleAnchorDate(today)}>{t("本周")}</button><button onClick={() => moveScheduleWeek(1)}>{t("下一周")} →</button></div>
              </div>
              <p className="section-copy">{t(role === "manager" ? "点击格子中的下拉菜单安排员工，空白表示该班次无人。" : "左右滑动可以查看完整的一周班表。")}</p>
              <div className="schedule-scroll"><div className="schedule-grid">
                <div className="schedule-title">{t("班表")}</div>
                <div className="schedule-corner">{t("日期")}</div>
                {weekDates.map((day) => <div className="schedule-day" key={day}><span>{language === "en" ? weekdayEnglish[new Date(`${day}T12:00:00`).getDay()] : weekdays[new Date(`${day}T12:00:00`).getDay()]}</span><strong>{day.slice(5).replace("-", "/")}</strong></div>)}
                {scheduleSlots.map((slot) => slot.break ? <div className="lunch-row" key={slot.key}>{t(slot.label)}</div> : <div className="schedule-row" key={slot.key}>
                  <div className="time-cell">{slot.time.split(" – ").map((part, index) => <span key={part}>{index ? `– ${part}` : part}</span>)}</div>
                  {weekDates.map((day) => {
                    const cell = schedule.find((item) => item.shift_date === day && item.slot_key === slot.key);
                    return <div className={`employee-cell ${slot.color}`} key={day}>{role === "manager" ? <select aria-label={`${day} ${slot.time}`} value={cell?.employee_id || ""} onChange={(e) => updateScheduleCell(day, slot, e.target.value)}><option value="">—</option>{cell && !employeeDirectory.some((person) => person.id === cell.employee_id) && <option value={cell.employee_id}>{cell.name} ({t("已停用")})</option>}{employeeDirectory.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select> : <span>{cell?.name || ""}</span>}</div>;
                  })}
                </div>)}
              </div></div>
              {role === "manager" && <div className="schedule-actions"><button className="secondary-button" onClick={runOvertimeAnalysis} disabled={analyzingOvertime}>{t(analyzingOvertime ? "AI 分析中…" : "检查加班风险")}</button><button className="save-schedule-button" onClick={saveWeeklySchedule}>{t("保存整周班表")}</button></div>}
            </section>
            {role === "manager" && overtimeAnalysis && <section className="card overtime-card">
              <div className="section-heading"><div><span className={`step ${overtimeAnalysis.overtime.length ? "coral" : "green"}`}>OT</span><h2>{t("加班风险分析")}</h2></div><span className={`status ${overtimeAnalysis.overtime.length ? "risk" : "done"}`}>{overtimeAnalysis.overtime.length ? (language === "en" ? `${overtimeAnalysis.overtime.length}${t("人超时")}` : `${overtimeAnalysis.overtime.length} 人超时`) : t("工时正常")}</span></div>
              <p className="section-copy">{t("本周预警线：每人")} {overtimeAnalysis.threshold} {t("小时。该提示用于排班辅助，最终请以当地劳动法规和实际打卡为准。")}</p>
              <div className="hours-list">{overtimeAnalysis.employees.filter((item) => item.hours > 0).sort((a,b) => b.hours-a.hours).map((item) => <div className={item.overtime_hours ? "overtime" : ""} key={item.employee_id}><span>{item.name}</span><div><i style={{width:`${Math.min(100, item.hours / overtimeAnalysis.threshold * 100)}%`}} /></div><strong>{item.hours}h</strong>{item.overtime_hours > 0 && <b>+{item.overtime_hours}h OT</b>}</div>)}</div>
              <div className="ai-recommendation"><div><span>✦</span><strong>{t(overtimeAnalysis.ai_used ? "AI 调整建议" : "排班调整建议")}</strong></div><AIContent content={overtimeAnalysis.recommendation} />{!overtimeAnalysis.ai_used && overtimeAnalysis.overtime.length > 0 && <small>{language === "en" ? (overtimeAnalysis.ai_configured ? "AI suggestions are temporarily unavailable; basic guidance is shown." : "Configure the OpenAI API key for more specific shift suggestions.") : (overtimeAnalysis.ai_configured ? "AI 暂时生成失败，当前显示基础建议。" : "配置 OpenAI API Key 后可获得更具体的班次调整建议。")}</small>}</div>
            </section>}
            {role === "manager" && <section className="card roster-manager">
              <div className="section-heading"><div><span className="step green">人</span><h2>{t("员工名册管理")}</h2></div><span className="pill green">{language === "en" ? `${employeeDirectory.length}${t("名员工")}` : `${employeeDirectory.length} 名员工`}</span></div>
              <p className="section-copy">{t("新员工添加一次后，就会出现在班表每个格子的下拉菜单中。移除员工不会删除以前的班表和报告。")}</p>
              <div className="roster-add-row"><input value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEmployeeToDirectory()} placeholder={t("输入新员工姓名")} /><button onClick={addEmployeeToDirectory}>＋ {t("添加员工")}</button></div>
              <div className="roster-list">{employeeDirectory.map((item) => <div key={item.id}><span className="avatar">{item.name.slice(0, 1)}</span><strong>{item.name}</strong><button aria-label={`${t("移除")} ${item.name}`} onClick={() => deleteEmployeeFromDirectory(item)}>{t("移除")}</button></div>)}</div>
            </section>}
          </div>
        ) : tab === "report" ? (
          <div className="page-stack">
            <section className="card intro-card">
              <div className="section-heading"><div><span className="step">01</span><h2>{t("值班信息")}</h2></div><span className={`status ${report.status === "已提交" ? "done" : "draft"}`}>{t(report.status)}</span></div>
              <div className="two-cols">
                <Field label={t("日期")}><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></Field>
                <Field label={t("星期")}><input value={language === "en" ? weekdayEnglish[new Date(`${selectedDate}T12:00:00`).getDay()] : report.weekday} readOnly /></Field>
              </div>
              <Field label={t("今日领班")}><input value={report.supervisor} onChange={(e) => updateReport("supervisor", e.target.value)} placeholder={t("填写领班姓名")} /></Field>
            </section>

            <section className="card">
              <div className="section-heading"><div><span className="step coral">02</span><h2>{t("出品与服务")}</h2></div><span className="pill coral">{t("现场反馈")}</span></div>
              <Field label={t("烤鸭反馈")}><textarea value={report.roast_duck_feedback} onChange={(e) => updateReport("roast_duck_feedback", e.target.value)} placeholder={t("口感、出品质量、客人反馈…")} /></Field>
              <Field label={t("后厨菜品反馈")}><textarea value={report.kitchen_feedback} onChange={(e) => updateReport("kitchen_feedback", e.target.value)} placeholder={t("菜品质量、缺货、退菜情况…")} /></Field>
              <Field label={t("前台出菜情况")}><textarea value={report.serving_status} onChange={(e) => updateReport("serving_status", e.target.value)} placeholder={t("出菜速度、漏单、催菜情况…")} /></Field>
            </section>

            <section className="card">
              <div className="section-heading"><div><span className="step blue">03</span><h2>{t("员工情况")}</h2></div><span className="pill blue">{t("选填")} · {report.employee_issues.length} {language === "en" ? "people" : "人"}</span></div>
              {report.employee_issues.length === 0 && <p className="empty-directory">{t("当天班表暂无员工。请先由店长完成排班。")}</p>}
              {report.employee_issues.map((item, index) => <div className="employee-evaluation" key={`${item.name}-${index}`}><div className="evaluation-person"><span className="avatar">{item.name.slice(0, 1)}</span><strong>{item.name}</strong><span className="schedule-source">{t("来自当天班表")}</span></div><div className="evaluation-fields"><div className="score-input"><input aria-label={language === "en" ? `${item.name} score` : `${item.name}评分`} type="number" min="0" max="5" step="0.1" inputMode="decimal" value={item.score ?? ""} onChange={(e) => updateReport("employee_issues", report.employee_issues.map((record, i) => i === index ? { ...record, score: e.target.value === "" ? null : Number(e.target.value) } : record))} placeholder={t("选填")} /><span>{language === "en" ? "pts" : "分"}</span></div><textarea value={item.notes} onChange={(e) => updateReport("employee_issues", report.employee_issues.map((record, i) => i === index ? { ...record, notes: e.target.value } : record))} placeholder={t("评价选填，可直接留空")} /></div></div>)}
              <Field label={t("员工上班情况")}><textarea value={report.attendance} onChange={(e) => updateReport("attendance", e.target.value)} placeholder={t("迟到、请假、换班、人员安排…")} /></Field>
            </section>

            <section className="card">
              <div className="section-heading"><div><span className="step green">04</span><h2>{t("其他事项")}</h2></div><span className="pill green">{t("交接提醒")}</span></div>
              <Field label={t("特殊事宜")}><textarea value={report.special_notes} onChange={(e) => updateReport("special_notes", e.target.value)} placeholder={t("设备、客诉、预订或其他需要关注的事项…")} /></Field>
              <Field label={t("节假日事宜")}><textarea value={report.holiday_notes} onChange={(e) => updateReport("holiday_notes", e.target.value)} placeholder={t("节假日备货、排班、活动安排…")} /></Field>
            </section>

            <div className="action-bar"><button className="secondary-button" onClick={() => saveReport("草稿")}>{t("保存草稿")}</button><button className="primary-button" onClick={() => saveReport("已提交")}>{t("提交今日总结")} →</button></div>
          </div>
        ) : tab === "stock" ? (
          <div className="page-stack">
            <section className="card stock-card">
              <div className="section-heading"><div><span className="step orange">01</span><h2>{t("补货清单")}</h2></div><span className={`status ${order.status === "已提交" ? "done" : "draft"}`}>{t(order.status)}</span></div>
              <p className="section-copy">{t("展开分类，勾选需要补货的物品即可，不再填写数量。")}</p>
              <div className="drawer-section"><h3>{t("包装耗材")}</h3>{supplyGroups.map((group, index) => <ChecklistDrawer key={group.title} title={group.title} tone="orange" items={group.items} values={order.supplies} onChange={(name, value) => updateQuantity("supplies", name, value)} defaultOpen={index === 0} language={language} />)}</div>
              <div className="drawer-section"><h3>{t("饮品")}</h3><ChecklistDrawer title="饮料" tone="blue" items={catalog.drinks} values={order.drinks} onChange={(name, value) => updateQuantity("drinks", name, value)} onDelete={role === "manager" ? deleteCatalogItem : undefined} language={language} /><ChecklistDrawer title="啤酒" tone="coral" items={catalog.beers} values={order.beers} onChange={(name, value) => updateQuantity("beers", name, value)} onDelete={role === "manager" ? deleteCatalogItem : undefined} language={language} /></div>
            </section>

            {role === "manager" && <section className="card add-card">
              <div className="section-heading"><div><span className="step purple">02</span><h2>{t("新增饮品种类")}</h2></div><span className="pill purple">{t("永久保存")}</span></div>
              <p className="section-copy">{t("手机上新增后所有人都能看到；停卖的饮品可点清单右侧 × 删除。")}</p>
              <div className="add-row"><select value={addingType} onChange={(e) => setAddingType(e.target.value)}><option value="drink">{t("饮料")}</option><option value="beer">{t("啤酒")}</option></select><input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCatalogItem()} placeholder={t("例如：雪碧")} /><button onClick={addCatalogItem}>{t("添加")}</button></div>
            </section>}

            <section className="card">
              <Field label={t("补货备注")}><textarea value={order.notes} onChange={(e) => setOrder({ ...order, notes: e.target.value })} placeholder={t("供应商、到货时间或其他要求…")} /></Field>
              <Field label={t("当前状态")}><select value={order.status} onChange={(e) => setOrder({ ...order, status: e.target.value })}><option value="待确认">{t("待确认")}</option><option value="已提交">{t("已提交")}</option><option value="已完成">{t("已完成")}</option></select></Field>
            </section>
            <div className="action-bar"><button className="secondary-button" onClick={() => saveOrder("待确认")}>{t("保存清单")}</button><button className="primary-button" onClick={() => saveOrder("已提交")}>{t("提交补货单")} →</button></div>
          </div>
        ) : (
          <div className="page-stack">
            <section className="card ai-setup-card">
              <div className="section-heading"><div><span className="step purple">AI</span><h2>{t("智能运营报告")}</h2></div><span className={`status ${aiReportInfo?.ai_configured ? "done" : "draft"}`}>{t(aiReportInfo?.ai_configured ? "AI 已连接" : "等待配置")}</span></div>
              <p className="section-copy">{t("系统会自动汇总每日总结、员工表现和补货记录，再生成管理层可直接阅读的报告。")}</p>
              <div className="period-toggle"><button className={aiPeriod === "week" ? "active" : ""} onClick={() => setAiPeriod("week")}>{t("周度报告")}</button><button className={aiPeriod === "month" ? "active" : ""} onClick={() => setAiPeriod("month")}>{t("月度报告")}</button></div>
              {aiReportInfo && <div className="period-range"><span>{t("报告范围")}</span><strong>{aiReportInfo.start_date} — {aiReportInfo.end_date}</strong></div>}
            </section>

            {aiReportInfo && <section className="report-stats">
              <div><strong>{aiReportInfo.source_summary.report_days}</strong><span>{t("有日报天数")}</span></div>
              <div><strong>{aiReportInfo.source_summary.submitted_days}</strong><span>{t("已提交日报")}</span></div>
              <div><strong>{aiReportInfo.source_summary.employee_records}</strong><span>{t("员工记录")}</span></div>
              <div><strong>{aiReportInfo.source_summary.replenishment_days}</strong><span>{t("补货记录天数")}</span></div>
            </section>}

            {!aiReportInfo?.ai_configured && <section className="card config-notice"><span>🔑</span><div><strong>{t("还差一步即可使用 AI")}</strong><p>{language === "en" ? <>Set <code>OPENAI_API_KEY</code> on the backend and restart the service. The key stays on the server and is never sent to phones.</> : <>请在后端设置 <code>OPENAI_API_KEY</code> 并重新启动服务。Key 只保存在服务器，不会发送到手机。</>}</p></div></section>}

            <section className="card generated-report">
              <div className="section-heading"><div><span className="step green">✓</span><h2>{t(aiPeriod === "week" ? "周度总结" : "月度总结")}</h2></div>{aiReportInfo?.saved_report && <span className="pill green">{t("已保存")}</span>}</div>
              {aiReportInfo?.saved_report ? <>
                <div className="report-meta">{language === "en" ? `Generated by ${aiReportInfo.saved_report.model}` : `由 ${aiReportInfo.saved_report.model} 生成`} · {aiReportInfo.saved_report.created_at}</div>
                <AIContent content={aiReportInfo.saved_report.content} />
              </> : <div className="empty-ai-report"><span>◎</span><strong>{t("尚未生成这段时间的报告")}</strong><p>{t(aiReportInfo?.has_source_data ? "已有运营数据，可以开始生成。" : "请先填写并保存这段时间内的每日记录。")}</p></div>}
            </section>

            <div className="action-bar ai-action"><button className="secondary-button" onClick={() => setTab("report")}>{t("返回日报")}</button><button className="primary-button" disabled={generatingReport || !aiReportInfo?.has_source_data || !aiReportInfo?.ai_configured} onClick={generateAIReport}>{t(generatingReport ? "AI 正在分析…" : aiReportInfo?.saved_report ? "重新生成报告" : "生成 AI 报告")} {!generatingReport && !aiReportInfo?.saved_report ? "→" : ""}</button></div>
          </div>
        )}
      </main>
      {notice && <div className={`toast ${notice.kind}`}>{notice.kind === "success" ? "✓" : "!"} {notice.message}</div>}
    </div>
  );
}

export default App;
