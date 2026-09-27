import { auth } from "../lib/auth.js";

export const authService = {
  login: (email, password) => auth.login(email, password),
  signup: (data) => auth.signup(data),
  loginWithGoogle: () => auth.loginWithGoogle(),
  logout: () => auth.logout(),
  getCurrentUser: () => auth.getCurrentUser(),
  isAuthenticated: () => auth.isAuthenticated(),
  updateProfile: (updates) => auth.updateProfile(updates),
};
