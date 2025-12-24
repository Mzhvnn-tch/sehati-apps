interface LoginResult {
  success: boolean;
  verified: boolean;
  exists: boolean;
  userRole?: "patient" | "doctor";
}
