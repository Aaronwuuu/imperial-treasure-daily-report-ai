const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

export async function request(path, options) {
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
