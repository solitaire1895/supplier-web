import { PlanType } from "./plans";

const KEY = "nexusply_settings";

export function getCurrentPlan(): PlanType {
  if (typeof window === "undefined") return "free";

  const data = localStorage.getItem(KEY);
  if (!data) return "free";

  try {
    const settings = JSON.parse(data);
    return settings.plan || "free";
  } catch (e) {
    return "free";
  }
}
