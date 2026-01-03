import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clearWalletConnectStorage() {
  // 1. Force Clear ALL LocalStorage to prevent any persistence
  localStorage.clear();

  // 2. Clear SessionStorage completely
  sessionStorage.clear();

  // 3. Clear all visible Cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  console.log("🧹 NUKED ALL STORAGE for fresh start");
}
