import json
import os
import sqlite3
from calendar import monthrange
from contextlib import contextmanager
from datetime import date, timedelta
from pathlib import Path
from typing import Literal, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "access.env")
DB_PATH = BASE_DIR / "restaurant.db"
DEFAULT_DRINKS = [
    "橙皮山楂", "金银花水", "茉莉蜜茶", "王老吉", "清爽绿豆", "乌梅山楂",
    "冷泡茉莉", "枇杷雪梨", "红豆薏米", "东方树叶", "蜂蜜柚子", "冰茶",
    "北冰洋", "酸梅汤", "茉莉清茶", "阿萨姆奶茶", "椰汁", "冰红茶",
    "茶pai", "元气森林荔枝", "元气森林白桃", "元气森林葡萄", "可乐", "雪碧",
    "无糖可乐",
]
DEFAULT_BEERS = ["雪花", "珠江", "青岛", "sapporo", "heineken", "modelo", "corona"]
CATALOG_VERSION = "2"
SLOT_HOURS = {
    "am_pink": 4.0, "am_blue_1": 3.5, "am_red": 3.5, "am_blue_2": 3.5,
    "am_orange": 3.5, "am_blue_3": 3.5, "am_yellow": 3.5,
    "pm_pink": 4.0, "pm_red": 4.75, "pm_blue_1": 4.5, "pm_orange": 4.5,
    "pm_blue_2": 4.5, "pm_blue_3": 4.0, "pm_yellow": 4.0,
}

app = FastAPI(title="宝藏 API", version="2.0.0")


@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS daily_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                record_date TEXT NOT NULL UNIQUE,
                weekday TEXT NOT NULL DEFAULT '',
                supervisor TEXT NOT NULL DEFAULT '',
                roast_duck_feedback TEXT NOT NULL DEFAULT '',
                kitchen_feedback TEXT NOT NULL DEFAULT '',
                serving_status TEXT NOT NULL DEFAULT '',
                employee_issues TEXT NOT NULL DEFAULT '[]',
                attendance TEXT NOT NULL DEFAULT '',
                special_notes TEXT NOT NULL DEFAULT '',
                holiday_notes TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT '草稿',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS supply_catalog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(category, name)
            );
            CREATE TABLE IF NOT EXISTS replenishments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                record_date TEXT NOT NULL UNIQUE,
                supplies TEXT NOT NULL DEFAULT '{}',
                drinks TEXT NOT NULL DEFAULT '{}',
                beers TEXT NOT NULL DEFAULT '{}',
                notes TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT '待确认',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS ai_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_type TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                source_summary TEXT NOT NULL DEFAULT '{}',
                content TEXT NOT NULL,
                model TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(report_type, start_date, end_date)
            );
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS shifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shift_date TEXT NOT NULL,
                employee_id INTEGER NOT NULL,
                start_time TEXT NOT NULL DEFAULT '',
                end_time TEXT NOT NULL DEFAULT '',
                position TEXT NOT NULL DEFAULT '',
                notes TEXT NOT NULL DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(shift_date, employee_id),
                FOREIGN KEY(employee_id) REFERENCES employees(id)
            );
            CREATE TABLE IF NOT EXISTS schedule_cells (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shift_date TEXT NOT NULL,
                slot_key TEXT NOT NULL,
                employee_id INTEGER NOT NULL,
                start_time TEXT NOT NULL DEFAULT '',
                end_time TEXT NOT NULL DEFAULT '',
                position TEXT NOT NULL DEFAULT '',
                color TEXT NOT NULL DEFAULT 'blue',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(shift_date, slot_key),
                FOREIGN KEY(employee_id) REFERENCES employees(id)
            );
        """)
        employee_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(employees)").fetchall()
        }
        if "active" not in employee_columns:
            conn.execute("ALTER TABLE employees ADD COLUMN active INTEGER NOT NULL DEFAULT 1")
        ai_report_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(ai_reports)").fetchall()
        }
        if "language" not in ai_report_columns:
            conn.execute("ALTER TABLE ai_reports ADD COLUMN language TEXT NOT NULL DEFAULT 'zh'")
        catalog_version = conn.execute(
            "SELECT value FROM app_settings WHERE key = 'catalog_version'"
        ).fetchone()
        if not catalog_version or catalog_version[0] != CATALOG_VERSION:
            conn.execute("DELETE FROM supply_catalog WHERE category IN ('drink', 'beer')")
            conn.executemany(
                "INSERT INTO supply_catalog(category, name) VALUES (?, ?)",
                [("drink", name) for name in DEFAULT_DRINKS]
                + [("beer", name) for name in DEFAULT_BEERS],
            )
            conn.execute(
                "INSERT OR REPLACE INTO app_settings(key, value) VALUES ('catalog_version', ?)",
                (CATALOG_VERSION,),
            )


init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmployeeIssue(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    score: Optional[float] = Field(default=None, ge=0, le=5)
    notes: str = Field(default="", max_length=1000)


class DailyReport(BaseModel):
    record_date: date
    weekday: str = ""
    supervisor: str = Field(default="", max_length=100)
    roast_duck_feedback: str = ""
    kitchen_feedback: str = ""
    serving_status: str = ""
    employee_issues: list[EmployeeIssue] = []
    attendance: str = ""
    special_notes: str = ""
    holiday_notes: str = ""
    status: Literal["草稿", "已提交"] = "草稿"


class Replenishment(BaseModel):
    record_date: date
    supplies: dict[str, bool] = {}
    drinks: dict[str, bool] = {}
    beers: dict[str, bool] = {}
    notes: str = ""
    status: Literal["待确认", "已提交", "已完成"] = "待确认"


class CatalogItem(BaseModel):
    category: Literal["drink", "beer"]
    name: str = Field(min_length=1, max_length=60)


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)


class AIReportRequest(BaseModel):
    report_type: Literal["week", "month"]
    anchor_date: date
    language: Literal["zh", "en"] = "zh"


class ScheduleCell(BaseModel):
    employee_id: int
    slot_key: str
    start_time: str = ""
    end_time: str = ""
    position: str = ""
    color: str = "blue"


class ScheduleSave(BaseModel):
    shift_date: date
    cells: list[ScheduleCell] = []


class OvertimeAnalysisRequest(BaseModel):
    start_date: date
    end_date: date
    language: Literal["zh", "en"] = "zh"


def configured_access_codes():
    return {
        "manager": os.getenv("MANAGER_ACCESS_CODE", ""),
        "leader": os.getenv("LEADER_ACCESS_CODE", ""),
        "employee": os.getenv("EMPLOYEE_ACCESS_CODE", ""),
    }


def current_role(x_access_code: str = Header(default="")):
    for role, code in configured_access_codes().items():
        if code and x_access_code == code:
            return role
    raise HTTPException(401, "访问码无效或尚未配置")


def allow_roles(*roles):
    def checker(role: str = Depends(current_role)):
        if role not in roles:
            raise HTTPException(403, "你没有权限访问这部分内容")
        return role
    return checker


def decode_report(row):
    if not row:
        return None
    item = dict(row)
    item["employee_issues"] = json.loads(item["employee_issues"])
    return item


def decode_replenishment(row):
    if not row:
        return None
    item = dict(row)
    for key in ("supplies", "drinks", "beers"):
        values = json.loads(item[key])
        item[key] = {
            name: value if isinstance(value, bool) else bool(str(value).strip())
            for name, value in values.items()
        }
    return item


def report_range(report_type: str, anchor_date: date):
    if report_type == "week":
        start = anchor_date - timedelta(days=anchor_date.weekday())
        return start, start + timedelta(days=6)
    start = anchor_date.replace(day=1)
    return start, anchor_date.replace(day=monthrange(anchor_date.year, anchor_date.month)[1])


def collect_period_data(start: date, end: date):
    with db() as conn:
        report_rows = conn.execute(
            "SELECT * FROM daily_reports WHERE record_date BETWEEN ? AND ? ORDER BY record_date",
            (start.isoformat(), end.isoformat()),
        ).fetchall()
        order_rows = conn.execute(
            "SELECT * FROM replenishments WHERE record_date BETWEEN ? AND ? ORDER BY record_date",
            (start.isoformat(), end.isoformat()),
        ).fetchall()
    reports = [decode_report(row) for row in report_rows]
    orders = [decode_replenishment(row) for row in order_rows]
    employees = []
    for report in reports:
        for item in report["employee_issues"]:
            if item.get("score") is not None or str(item.get("notes", "")).strip():
                employees.append({"date": report["record_date"], **item})
    restock_totals = {}
    for order in orders:
        for group in ("supplies", "drinks", "beers"):
            for name, selected in order[group].items():
                if selected:
                    restock_totals.setdefault(name, []).append({"date": order["record_date"]})
    summary = {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "report_days": len(reports),
        "submitted_days": sum(1 for item in reports if item["status"] == "已提交"),
        "replenishment_days": len(orders),
        "employee_records": len(employees),
        "employees": employees,
        "restock_totals": restock_totals,
    }
    return reports, orders, summary


def get_saved_ai_report(report_type: str, start: date, end: date, language: str = "zh"):
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM ai_reports WHERE report_type = ? AND start_date = ? AND end_date = ? AND language = ?",
            (report_type, start.isoformat(), end.isoformat(), language),
        ).fetchone()
    if not row:
        return None
    result = dict(row)
    result["source_summary"] = json.loads(result["source_summary"])
    return result


@app.get("/")
def root():
    return {"message": "宝藏 API", "version": "2.0.0"}


@app.post("/auth/login")
def login(x_access_code: str = Header(default="")):
    role = current_role(x_access_code)
    return {"role": role}


@app.get("/daily-reports/{record_date}")
def get_daily_report(record_date: date, _: str = Depends(allow_roles("manager", "leader"))):
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM daily_reports WHERE record_date = ?", (record_date.isoformat(),)
        ).fetchone()
    return decode_report(row)


@app.put("/daily-reports/{record_date}")
def save_daily_report(record_date: date, report: DailyReport, _: str = Depends(allow_roles("manager", "leader"))):
    if report.record_date != record_date:
        raise HTTPException(400, "路径日期与表单日期不一致")
    values = (
        record_date.isoformat(), report.weekday, report.supervisor, report.roast_duck_feedback,
        report.kitchen_feedback, report.serving_status,
        json.dumps([item.model_dump() for item in report.employee_issues], ensure_ascii=False),
        report.attendance, report.special_notes, report.holiday_notes, report.status,
    )
    with db() as conn:
        conn.execute("""
            INSERT INTO daily_reports (
                record_date, weekday, supervisor, roast_duck_feedback, kitchen_feedback,
                serving_status, employee_issues, attendance, special_notes, holiday_notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(record_date) DO UPDATE SET
                weekday=excluded.weekday, supervisor=excluded.supervisor,
                roast_duck_feedback=excluded.roast_duck_feedback,
                kitchen_feedback=excluded.kitchen_feedback, serving_status=excluded.serving_status,
                employee_issues=excluded.employee_issues, attendance=excluded.attendance,
                special_notes=excluded.special_notes, holiday_notes=excluded.holiday_notes,
                status=excluded.status, updated_at=CURRENT_TIMESTAMP
        """, values)
        row = conn.execute("SELECT * FROM daily_reports WHERE record_date = ?", (record_date.isoformat(),)).fetchone()
    return decode_report(row)


@app.get("/catalog")
def get_catalog(_: str = Depends(allow_roles("manager", "leader"))):
    with db() as conn:
        rows = conn.execute("SELECT id, category, name FROM supply_catalog ORDER BY id").fetchall()
    return {
        "drinks": [dict(row) for row in rows if row["category"] == "drink"],
        "beers": [dict(row) for row in rows if row["category"] == "beer"],
    }


@app.post("/catalog", status_code=201)
def add_catalog_item(item: CatalogItem, _: str = Depends(allow_roles("manager"))):
    name = item.name.strip()
    if not name:
        raise HTTPException(400, "名称不能为空")
    try:
        with db() as conn:
            cursor = conn.execute(
                "INSERT INTO supply_catalog(category, name) VALUES (?, ?)", (item.category, name)
            )
            item_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(409, "这个品类已经存在")
    return {"id": item_id, "category": item.category, "name": name}


@app.delete("/catalog/{item_id}")
def delete_catalog_item(item_id: int, _: str = Depends(allow_roles("manager"))):
    with db() as conn:
        item = conn.execute(
            "SELECT id, category, name FROM supply_catalog WHERE id = ?", (item_id,)
        ).fetchone()
        if not item:
            raise HTTPException(404, "这个品类不存在或已经删除")
        conn.execute("DELETE FROM supply_catalog WHERE id = ?", (item_id,))
    return {"deleted": True, **dict(item)}


@app.get("/employees")
def get_employees(_: str = Depends(allow_roles("manager", "leader"))):
    with db() as conn:
        rows = conn.execute(
            "SELECT id, name FROM employees WHERE active = 1 ORDER BY id"
        ).fetchall()
    return [dict(row) for row in rows]


@app.post("/employees", status_code=201)
def add_employee(employee: EmployeeCreate, _: str = Depends(allow_roles("manager"))):
    name = employee.name.strip()
    if not name:
        raise HTTPException(400, "员工姓名不能为空")
    try:
        with db() as conn:
            existing = conn.execute(
                "SELECT id, name, active FROM employees WHERE name = ?", (name,)
            ).fetchone()
            if existing and not existing["active"]:
                conn.execute("UPDATE employees SET active = 1 WHERE id = ?", (existing["id"],))
                return {"id": existing["id"], "name": existing["name"]}
            cursor = conn.execute("INSERT INTO employees(name) VALUES (?)", (name,))
            employee_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(409, "这名员工已经在名册中")
    return {"id": employee_id, "name": name}


@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, _: str = Depends(allow_roles("manager"))):
    with db() as conn:
        employee = conn.execute(
            "SELECT id, name FROM employees WHERE id = ?", (employee_id,)
        ).fetchone()
        if not employee:
            raise HTTPException(404, "这名员工不存在或已经移除")
        conn.execute("UPDATE employees SET active = 0 WHERE id = ?", (employee_id,))
    return {"deleted": True, **dict(employee)}


@app.get("/ai-reports")
def get_ai_report(report_type: Literal["week", "month"], anchor_date: date, language: Literal["zh", "en"] = "zh", _: str = Depends(allow_roles("manager"))):
    start, end = report_range(report_type, anchor_date)
    reports, orders, summary = collect_period_data(start, end)
    saved = get_saved_ai_report(report_type, start, end, language)
    return {
        "report_type": report_type,
        "start_date": start,
        "end_date": end,
        "source_summary": summary,
        "saved_report": saved,
        "has_source_data": bool(reports or orders),
        "ai_configured": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.post("/ai-reports/generate")
def generate_ai_report(request: AIReportRequest, _: str = Depends(allow_roles("manager"))):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            503,
            "尚未配置 OPENAI_API_KEY，请在后端设置后重新启动服务",
        )
    start, end = report_range(request.report_type, request.anchor_date)
    reports, orders, summary = collect_period_data(start, end)
    if not reports and not orders:
        raise HTTPException(400, "所选时间范围内还没有日报或补货记录")

    source = {"daily_reports": reports, "replenishments": orders, "statistics": summary}
    if request.language == "en":
        instructions = "You are a rigorous Chinese restaurant operations analyst. Use only the supplied data; never invent sales, guest counts, or unrecorded events. Write concise, professional English for management and clearly identify missing data. Preserve employee and product names exactly as entered."
        period_name = "weekly" if request.report_type == "week" else "monthly"
        prompt = f"""Create a {period_name} operations report for {start.isoformat()} through {end.isoformat()}.

Use exactly these headings:
## Executive Summary
## Food Quality and Service
## Employee Performance and Scheduling
## Special Items and Risks
## Restocking and Inventory Trends
## Priority Actions

Identify recurring problems and positive performance. Actions must be specific, practical, and prioritized. Keep employee assessments objective and do not overstate a single record.

Source data (some user-entered fields may be Chinese; analyze them and write the report in English):
{json.dumps(source, ensure_ascii=False)}"""
    else:
        period_name = "周度" if request.report_type == "week" else "月度"
        instructions = """你是一名严谨的中餐厅运营分析助手。只能依据提供的数据总结，不得编造客流、营业额或未记录的事件。使用简洁、专业、便于管理层阅读的中文。对缺失数据要明确说明。员工和产品名称保持原样。"""
        prompt = f"""请生成{period_name}运营报告，时间范围为 {start.isoformat()} 至 {end.isoformat()}。

必须按以下标题输出：
## 核心结论
## 出品与服务
## 员工表现与排班
## 特殊事项与风险
## 补货与库存趋势
## 下阶段行动建议

要求：指出重复出现的问题和正面表现；行动建议必须具体、可执行、按优先级排列；员工评价保持客观，不放大单次记录。

原始数据：
{json.dumps(source, ensure_ascii=False)}"""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_REPORT_MODEL", "gpt-5.6-terra")
        response = client.responses.create(
            model=model,
            instructions=instructions,
            input=prompt,
            reasoning={"effort": "low"},
            text={"verbosity": "medium"},
        )
        content = response.output_text.strip()
    except Exception as error:
        raise HTTPException(502, f"AI 报告生成失败：{str(error)}")

    with db() as conn:
        conn.execute("""
            INSERT INTO ai_reports(report_type, start_date, end_date, source_summary, content, model, language)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(report_type, start_date, end_date) DO UPDATE SET
                source_summary=excluded.source_summary, content=excluded.content,
                model=excluded.model, language=excluded.language, created_at=CURRENT_TIMESTAMP
        """, (
            request.report_type, start.isoformat(), end.isoformat(),
            json.dumps(summary, ensure_ascii=False), content, model, request.language,
        ))
    return get_saved_ai_report(request.report_type, start, end, request.language)


@app.get("/replenishments/{record_date}")
def get_replenishment(record_date: date, _: str = Depends(allow_roles("manager", "leader"))):
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM replenishments WHERE record_date = ?", (record_date.isoformat(),)
        ).fetchone()
    return decode_replenishment(row)


@app.put("/replenishments/{record_date}")
def save_replenishment(record_date: date, order: Replenishment, _: str = Depends(allow_roles("manager", "leader"))):
    if order.record_date != record_date:
        raise HTTPException(400, "路径日期与表单日期不一致")
    values = (
        record_date.isoformat(), json.dumps(order.supplies, ensure_ascii=False),
        json.dumps(order.drinks, ensure_ascii=False), json.dumps(order.beers, ensure_ascii=False),
        order.notes, order.status,
    )
    with db() as conn:
        conn.execute("""
            INSERT INTO replenishments(record_date, supplies, drinks, beers, notes, status)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(record_date) DO UPDATE SET
                supplies=excluded.supplies, drinks=excluded.drinks, beers=excluded.beers,
                notes=excluded.notes, status=excluded.status, updated_at=CURRENT_TIMESTAMP
        """, values)
        row = conn.execute("SELECT * FROM replenishments WHERE record_date = ?", (record_date.isoformat(),)).fetchone()
    return decode_replenishment(row)


@app.get("/schedules")
def get_schedule(start_date: date, end_date: date, _: str = Depends(current_role)):
    if end_date < start_date or (end_date - start_date).days > 62:
        raise HTTPException(400, "班表日期范围无效或超过 63 天")
    with db() as conn:
        rows = conn.execute("""
            SELECT schedule_cells.id, schedule_cells.shift_date, schedule_cells.slot_key,
                   schedule_cells.employee_id, employees.name, schedule_cells.start_time,
                   schedule_cells.end_time, schedule_cells.position, schedule_cells.color
            FROM schedule_cells
            JOIN employees ON employees.id = schedule_cells.employee_id
            WHERE schedule_cells.shift_date BETWEEN ? AND ?
            ORDER BY schedule_cells.shift_date, schedule_cells.slot_key
        """, (start_date.isoformat(), end_date.isoformat())).fetchall()
    return [dict(row) for row in rows]


@app.put("/schedules/{shift_date}")
def save_schedule(
    shift_date: date,
    schedule: ScheduleSave,
    _: str = Depends(allow_roles("manager")),
):
    if schedule.shift_date != shift_date:
        raise HTTPException(400, "路径日期与班表日期不一致")
    employee_ids = [item.employee_id for item in schedule.cells]
    unique_employee_ids = list(set(employee_ids))
    slot_keys = [item.slot_key for item in schedule.cells]
    if len(slot_keys) != len(set(slot_keys)):
        raise HTTPException(400, "同一天的班表格子重复")
    with db() as conn:
        if unique_employee_ids:
            placeholders = ",".join("?" for _ in unique_employee_ids)
            found = conn.execute(
                f"SELECT id FROM employees WHERE id IN ({placeholders})", unique_employee_ids
            ).fetchall()
            if len(found) != len(unique_employee_ids):
                raise HTTPException(400, "班表中包含不存在的员工")
        conn.execute("DELETE FROM schedule_cells WHERE shift_date = ?", (shift_date.isoformat(),))
        conn.executemany("""
            INSERT INTO schedule_cells(
                shift_date, slot_key, employee_id, start_time, end_time, position, color
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [(
            shift_date.isoformat(), item.slot_key, item.employee_id, item.start_time,
            item.end_time, item.position, item.color,
        ) for item in schedule.cells])
    return get_schedule(shift_date, shift_date, _)


@app.post("/schedules/overtime-analysis")
def analyze_overtime(
    request: OvertimeAnalysisRequest,
    _: str = Depends(allow_roles("manager")),
):
    if request.end_date < request.start_date or (request.end_date - request.start_date).days > 13:
        raise HTTPException(400, "加班分析日期范围无效或超过两周")
    threshold = float(os.getenv("OVERTIME_WEEKLY_HOURS", "40"))
    cells = get_schedule(request.start_date, request.end_date, _)
    with db() as conn:
        directory = [dict(row) for row in conn.execute("SELECT id, name FROM employees ORDER BY id").fetchall()]
    totals = {employee["id"]: 0.0 for employee in directory}
    shifts_by_employee = {employee["id"]: [] for employee in directory}
    for cell in cells:
        hours = SLOT_HOURS.get(cell["slot_key"], 0.0)
        totals[cell["employee_id"]] = totals.get(cell["employee_id"], 0.0) + hours
        shifts_by_employee.setdefault(cell["employee_id"], []).append({
            "date": cell["shift_date"], "slot_key": cell["slot_key"],
            "hours": hours, "position": cell["position"],
        })
    employees = [{
        "employee_id": employee["id"], "name": employee["name"],
        "hours": round(totals.get(employee["id"], 0.0), 2),
        "overtime_hours": round(max(0, totals.get(employee["id"], 0.0) - threshold), 2),
        "shifts": shifts_by_employee.get(employee["id"], []),
    } for employee in directory]
    overtime = [item for item in employees if item["overtime_hours"] > 0]
    recommendation = ""
    ai_used = False
    ai_error = ""
    if overtime and os.getenv("OPENAI_API_KEY"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            model = os.getenv("OPENAI_REPORT_MODEL", "gpt-5.6-terra")
            if request.language == "en":
                overtime_instructions = "You are a restaurant scheduling assistant. Base recommendations only on the supplied schedule hours. Never assume availability or job qualifications. Remind the manager to verify availability, role skills, and local labor laws. Write entirely in concise professional English, preserving employee names exactly."
                overtime_prompt = f"""Analyze the schedule from {request.start_date} through {request.end_date}. The weekly overtime warning threshold is {threshold} hours.
Use these headings:
## Overtime Risk
## Specific Shift Changes
## Checks After Adjusting
Prefer moving a complete shift from an over-limit employee to a lower-hour employee. Include the date, shift, and possible replacement. Do not split shifts.
Data: {json.dumps(employees, ensure_ascii=False)}"""
            else:
                overtime_instructions = "你是餐厅排班助手。只依据提供的班表工时提出调整建议，不得假设员工一定有空或具备某岗位资格。建议必须提醒店长确认员工可用时间、岗位能力和当地劳动法规。员工姓名保持原样。"
                overtime_prompt = f"""分析 {request.start_date} 至 {request.end_date} 的排班。每周加班预警线为 {threshold} 小时。
请用中文输出：
## 加班风险
## 建议调整的具体班次
## 调整后注意事项
优先把超时员工的完整班次转给当前工时较低的员工，列出日期、班次和候选接班人；不要拆分单个班次。
数据：{json.dumps(employees, ensure_ascii=False)}"""
            response = client.responses.create(
                model=model,
                instructions=overtime_instructions,
                input=overtime_prompt,
                reasoning={"effort": "low"},
                text={"verbosity": "medium"},
            )
            recommendation = response.output_text.strip()
            ai_used = True
        except Exception as error:
            ai_error = str(error)
    if overtime and not recommendation:
        low_hours = sorted((item for item in employees if item["overtime_hours"] == 0), key=lambda item: item["hours"])
        if request.language == "en":
            candidate_names = ", ".join(item["name"] for item in low_hours[:3]) or "no lower-hour employees available"
            recommendation = f"Consider moving complete shifts from over-limit employees to lower-hour employees: {candidate_names}. Confirm availability, role skills, and local labor rules before changing the schedule."
        else:
            candidate_names = "、".join(item["name"] for item in low_hours[:3]) or "暂无低工时员工"
            recommendation = f"建议优先将超时员工的完整班次调整给低工时员工：{candidate_names}。调整前请确认其可用时间、岗位能力和当地劳动法规。"
    if not overtime:
        recommendation = f"No employee exceeds {threshold:g} hours this week; no adjustment is needed." if request.language == "en" else f"本周没有员工超过 {threshold:g} 小时，无需调整。"
    return {
        "start_date": request.start_date, "end_date": request.end_date,
        "threshold": threshold, "employees": employees, "overtime": overtime,
        "recommendation": recommendation, "ai_used": ai_used,
        "ai_configured": bool(os.getenv("OPENAI_API_KEY")), "ai_error": ai_error,
    }
