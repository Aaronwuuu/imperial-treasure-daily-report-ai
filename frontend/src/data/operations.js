import { weekdays } from "../i18n/translations";

export const supplyGroups = [
  { title: "黑盒", items: ["12oz小黑盒", "锡纸盘的盖子", "外卖大锡纸盘", "打米饭的小白盒", "32oz盒子"] },
  { title: "牛皮纸盒", items: ["大号牛皮纸盒", "小号牛皮纸盒"] },
  { title: "汤桶", items: ["64oz胖汤桶", "32oz高汤桶", "16oz矮汤桶", "8oz扁汤桶"] },
  { title: "外卖袋子", items: ["大号外卖袋", "中号外卖袋", "小号外卖袋"] },
  { title: "餐巾纸及清洁用品", items: ["餐巾纸", "厕纸", "马桶坐垫", "擦手纸", "绿色包装", "红色包装"] },
];
export const scheduleSlots = [
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
export const emptyReport = (recordDate) => ({
  record_date: recordDate, weekday: weekdays[new Date(`${recordDate}T12:00:00`).getDay()], supervisor: "",
  roast_duck_feedback: "", kitchen_feedback: "", serving_status: "", employee_issues: [],
  attendance: "", special_notes: "", holiday_notes: "", status: "草稿",
});
export const emptyOrder = (recordDate) => ({
  record_date: recordDate, supplies: {}, drinks: {}, beers: {}, notes: "", status: "待确认",
});

export function dateToWeekValue(dateText) {
  const value = new Date(`${dateText}T12:00:00`);
  const utc = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function weekValueToMonday(weekValue) {
  const [yearText, weekText] = weekValue.split("-W");
  const year = Number(yearText); const week = Number(weekText);
  const januaryFourth = new Date(`${year}-01-04T12:00:00`);
  const monday = new Date(januaryFourth);
  monday.setDate(januaryFourth.getDate() - ((januaryFourth.getDay() + 6) % 7) + (week - 1) * 7);
  return monday.toLocaleDateString("en-CA");
}
