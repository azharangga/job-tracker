import * as liveRepo from "./index";
import * as demoRepo from "./demo";

// Check if app is currently in demo mode by looking at localStorage
function isDemo() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("demo_user_session");
}

export function getRepository() {
  return isDemo() ? demoRepo : liveRepo;
}
