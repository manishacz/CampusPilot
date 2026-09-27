import { useState } from "react";
import { Loader2, Check, AlertCircle, User, GraduationCap, Calendar, Award, Languages } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Label } from "@/components/ui/label.js";
import { Separator } from "@/components/ui/separator.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.js";
import { Alert, AlertDescription } from "@/components/ui/alert.js";
import { useAuth } from "../hooks/useAuth.js";
import { useLocale } from "../context/LocaleContext.jsx";

const BRANCHES = ["CSE", "IT", "ECE", "EEE", "Mech", "Civil", "Chem", "Aero", "Other"];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
];

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { locale, changeLocale } = useLocale();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: user?.name || "",
    college: user?.college || "",
    branch: user?.branch || "",
    graduation_year: user?.graduation_year?.toString() || "",
    cgpa: user?.cgpa?.toString() || "",
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: form.name,
        college: form.college,
        branch: form.branch,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        cgpa: form.cgpa ? Number(form.cgpa) : null,
      });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const displayValue = (val) => val || "Not set";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your details are used for eligibility matching.
        </p>
      </div>

      {saved && (
        <Alert className="border-success/30 bg-success/5">
          <Check className="size-3.5 text-success" />
          <AlertDescription className="text-success font-medium">Profile updated successfully.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-3.5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Identity section */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-muted text-sm font-medium text-muted-foreground shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Academic details — structured settings rows */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Academic Details</h3>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="college">College</Label>
              <Input id="college" value={form.college} onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="branch">Branch</Label>
                <Select value={form.branch} onValueChange={(v) => setForm((f) => ({ ...f, branch: v }))}>
                  <SelectTrigger id="branch" className="w-full h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grad_year">Graduation year</Label>
                <Input id="grad_year" type="number" value={form.graduation_year} onChange={(e) => setForm((f) => ({ ...f, graduation_year: e.target.value }))} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cgpa">CGPA</Label>
              <Input id="cgpa" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={(e) => setForm((f) => ({ ...f, cgpa: e.target.value }))} className="h-9" />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label>Preferred language</Label>
              <Select value={locale} onValueChange={changeLocale}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" disabled={saving} size="sm">
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                Save changes
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <ProfileRow icon={User} label="Name" value={displayValue(user?.name)} />
            <div className="border-t border-border" />
            <ProfileRow icon={GraduationCap} label="College" value={displayValue(user?.college)} />
            <div className="border-t border-border" />
            <ProfileRow icon={GraduationCap} label="Branch" value={displayValue(user?.branch)} />
            <div className="border-t border-border" />
            <ProfileRow icon={Calendar} label="Graduation year" value={displayValue(user?.graduation_year?.toString())} />
            <div className="border-t border-border" />
            <ProfileRow icon={Award} label="CGPA" value={displayValue(user?.cgpa?.toString())} />
          </div>
        )}
      </div>

      {/* Language section */}
      {!editing && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preferences</h3>
          </div>
          <ProfileRow icon={Languages} label="Preferred language" value={LANGUAGES.find((l) => l.code === locale)?.label || "English"} />
        </div>
      )}
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
