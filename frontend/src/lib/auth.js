import { supabase } from "./supabase.js";

/**
 * Upsert a profile row for the authenticated user.
 * Called after every sign-in so Google-authenticated users also get a profile.
 */
async function upsertProfile(authUser) {
  const { id, email, user_metadata } = authUser;
  const full_name =
    user_metadata?.full_name ||
    user_metadata?.name ||
    email?.split("@")[0] ||
    "";
  const avatar_url = user_metadata?.avatar_url || user_metadata?.picture || null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      { id, email, full_name, avatar_url },
      { onConflict: "id", ignoreDuplicates: false }
    )
    .select()
    .maybeSingle();

  if (error) console.error("Profile upsert error:", error.message);
  return data;
}

/**
 * Fetch the profile row for the current user and merge with auth metadata.
 */
async function loadProfile(authUser) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) console.error("Profile fetch error:", error.message);

  // Merge auth user fields with profile row so the app always has full_name etc.
  return {
    id: authUser.id,
    email: authUser.email,
    full_name: data?.full_name || authUser.user_metadata?.full_name || "",
    avatar_url: data?.avatar_url || authUser.user_metadata?.avatar_url || null,
    college: data?.college || null,
    branch: data?.branch || null,
    graduation_year: data?.graduation_year || null,
    cgpa: data?.cgpa || null,
    preferred_language: data?.preferred_language || "en",
    // Legacy aliases used by existing components
    name: data?.full_name || authUser.user_metadata?.full_name || "",
  };
}

export const auth = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const profile = await upsertProfile(data.user);
    return loadProfile(data.user);
  },

  async signup(formData) {
    const { name, email, password, college, branch, graduation_year, cgpa } = formData;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw new Error(error.message);

    // Insert profile with academic fields provided at signup
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        full_name: name,
        college: college || null,
        branch: branch || null,
        graduation_year: graduation_year ? Number(graduation_year) : null,
        cgpa: cgpa ? Number(cgpa) : null,
      },
      { onConflict: "id" }
    );

    return loadProfile(data.user);
  },

  async loginWithGoogle() {
    // OAuth redirect — page will reload after the OAuth callback.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) throw new Error(error.message);
    // Control doesn't return here for OAuth; the browser navigates away.
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },

  async updateProfile(updates) {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) throw new Error("Not authenticated.");

    const patch = {};
    if (updates.name !== undefined) patch.full_name = updates.name;
    if (updates.full_name !== undefined) patch.full_name = updates.full_name;
    if (updates.college !== undefined) patch.college = updates.college;
    if (updates.branch !== undefined) patch.branch = updates.branch;
    if (updates.graduation_year !== undefined) patch.graduation_year = updates.graduation_year;
    if (updates.cgpa !== undefined) patch.cgpa = updates.cgpa;
    if (updates.preferred_language !== undefined) patch.preferred_language = updates.preferred_language;

    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id);
    if (error) throw new Error(error.message);

    return loadProfile(user);
  },

  /** Called by AuthContext to build user object from a Supabase session */
  async buildUserFromSession(session) {
    if (!session?.user) return null;
    return loadProfile(session.user);
  },
};
