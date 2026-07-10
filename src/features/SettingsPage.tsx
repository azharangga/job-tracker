import { useState, useRef } from "react";
import { toast } from "@/lib/toast";
import { useTranslation } from "react-i18next";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CompanyAvatar } from "@/components/common/CompanyAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Check, Camera, Shield, User, Globe, Palette, Eye, EyeOff } from "lucide-react";
import { SUPPORTED_LANGUAGES, setLanguage, type LanguageCode } from "@/i18n";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ImageCropperDialog } from "@/components/common/ImageCropperDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { theme, set } = useTheme();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNext, setShowNext] = useState(false);

  // Cropper State
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [openCropper, setOpenCropper] = useState(false);

  // Confirm Delete Avatar State
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  if (!user) return null;

  const rawLang = i18n.resolvedLanguage ?? i18n.language ?? "id";
  const current = (rawLang.startsWith("en") ? "en" : "id") as LanguageCode;

  const onAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
      setOpenCropper(true);
    };
    reader.readAsDataURL(file);
    // Reset file input value so user can re-upload same file if they cancel
    e.target.value = "";
  };

  const handleCropSave = async (blob: Blob) => {
    setOpenCropper(false);
    setUploadingAvatar(true);
    try {
      // 1. Delete old avatar from storage bucket if it exists
      if (user.avatar_url && user.avatar_url !== "none" && user.avatar_url !== "null") {
        try {
          const oldFilename = user.avatar_url.split("/").pop();
          if (oldFilename) {
            await supabase.storage.from("avatars").remove([oldFilename]);
          }
        } catch (e) {
          console.error("Failed to delete old avatar file", e);
        }
      }

      // 2. Upload cropped blob
      const filename = `${Date.now()}_cropped.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(filename, blob, {
        contentType: "image/jpeg",
      });
      if (error) throw error;

      // 3. Update profile avatar_url
      const publicUrl = supabase.storage.from("avatars").getPublicUrl(filename).data.publicUrl;
      await updateProfile({ avatar_url: publicUrl });
      toast.success(t("settings.avatarUpdated", "Profile picture updated successfully."));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleConfirmDeleteAvatar = async () => {
    if (!user.avatar_url || user.avatar_url === "none" || user.avatar_url === "null") return;

    setOpenDeleteConfirm(false);
    setUploadingAvatar(true);
    try {
      // 1. Remove file from avatars bucket (silently catch storage errors)
      const filename = user.avatar_url.split("/").pop();
      if (filename && filename !== "none" && filename !== "null") {
        try {
          await supabase.storage.from("avatars").remove([filename]);
        } catch (storageErr) {
          console.error("Storage delete failed", storageErr);
        }
      }
      // 2. Set user avatar_url to "none" in DB (safer than null/empty string for edge function validation)
      await updateProfile({ avatar_url: "none" });
      toast.success(t("settings.avatarDeleted", "Profile picture removed successfully."));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name });
      toast.success("Profil Anda berhasil diperbarui.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onSavePassword = async () => {
    if (!cur || !next) {
      toast.error("Semua field harus diisi.");
      return;
    }
    try {
      await changePassword(cur, next);
      toast.success("Kata sandi berhasil diperbarui. Silakan masuk kembali.");
      setCur("");
      setNext("");
      // Perform auto-logout to clear session and redirect user to Login Page
      await logout();
    } catch (e) {
      const msg = (e as Error).message;
      if (
        msg.toLowerCase().includes("current password") || 
        msg.toLowerCase().includes("invalid password") || 
        msg.toLowerCase().includes("incorrect password") ||
        msg.toLowerCase().includes("tidak cocok")
      ) {
        toast.error("Kata sandi sebelumnya tidak cocok / tidak sama.");
      } else {
        toast.error(msg);
      }
    }
  };

  const inputCls =
    "w-full h-9 px-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  return (
    <AppShell>
      <PageHeader title={t("settings.title")} description={t("settings.description")} />

      <ImageCropperDialog
        open={openCropper}
        onOpenChange={setOpenCropper}
        imageSrc={cropperImage || ""}
        onCrop={handleCropSave}
      />

      <ConfirmDialog
        open={openDeleteConfirm}
        onOpenChange={setOpenDeleteConfirm}
        onConfirm={handleConfirmDeleteAvatar}
        title={t("settings.deleteAvatarTitle")}
        description={t("settings.deleteAvatarDesc")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
        {/* Left Column: Account Profile & Security */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <section className="rounded-lg bg-surface border border-hairline p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 border-b border-hairline pb-3.5 mb-5">
              <User className="h-4.5 w-4.5 text-ink shrink-0" strokeWidth={2} />
              <h2 className="text-sm font-semibold text-ink leading-none">{t("settings.profile")}</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <CompanyAvatar name={user.name} logoUrl={user.avatar_url} size={64} />
                <label className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px] text-white font-medium select-none gap-0.5">
                  <Camera className="h-4 w-4" strokeWidth={2} />
                  <span>{uploadingAvatar ? "..." : "Change"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarFileChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-ink truncate leading-tight">{user.name}</div>
                <div className="text-xs text-ink-muted truncate mt-0.5">{user.email}</div>
                {user.avatar_url && user.avatar_url !== "none" && user.avatar_url !== "null" && (
                  <button
                    onClick={() => setOpenDeleteConfirm(true)}
                    disabled={uploadingAvatar}
                    className="mt-2 block text-xs font-semibold text-destructive hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("companies.form.name")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-surface border border-hairline text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("login.email")}</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full h-9 px-3 rounded-md bg-surface-muted border border-hairline text-sm text-ink-muted focus:outline-none"
                />
              </div>
              <button
                onClick={onSaveProfile}
                disabled={saving}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? "..." : t("common.save")}
              </button>
            </div>
          </section>

          {/* Password Security */}
          <section className="rounded-lg bg-surface border border-hairline p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 border-b border-hairline pb-3.5 mb-5">
              <Shield className="h-4.5 w-4.5 text-ink shrink-0" strokeWidth={2} />
              <h2 className="text-sm font-semibold text-ink leading-none">{t("settings.security")}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("settings.currentPassword")}</label>
                <div className="relative">
                  <input
                    type={showCur ? "text" : "password"}
                    placeholder="••••••••"
                    value={cur}
                    onChange={(e) => setCur(e.target.value)}
                    className="w-full h-9 pl-3 pr-10 rounded-md bg-surface border border-hairline text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCur(!showCur)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors cursor-pointer"
                  >
                    {showCur ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{t("settings.newPassword")}</label>
                <div className="relative">
                  <input
                    type={showNext ? "text" : "password"}
                    placeholder="••••••••"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    className="w-full h-9 pl-3 pr-10 rounded-md bg-surface border border-hairline text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNext(!showNext)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors cursor-pointer"
                  >
                    {showNext ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                  </button>
                </div>
              </div>
              <button
                onClick={onSavePassword}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-active transition-colors cursor-pointer"
              >
                {t("common.save")}
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Preferences */}
        <div className="space-y-6">
          {/* Language Section */}
          <section className="rounded-lg bg-surface border border-hairline p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 border-b border-hairline pb-3.5 mb-4">
              <Globe className="h-4.5 w-4.5 text-ink shrink-0" strokeWidth={2} />
              <h2 className="text-sm font-semibold text-ink leading-none">{t("settings.language")}</h2>
            </div>
            <p className="text-xs text-ink-muted mb-4">{t("settings.languageDesc")}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "flex items-center gap-2.5 h-11 px-3 rounded-md border text-xs font-medium transition-all cursor-pointer",
                    current === lang.code
                      ? "border-primary bg-primary-soft text-primary font-semibold"
                      : "border-hairline text-ink-secondary hover:bg-surface-muted",
                  )}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.label}</span>
                  {current === lang.code && <Check className="h-3.5 w-3.5 text-ink shrink-0" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </section>

          {/* Theme Section */}
          <section className="rounded-lg bg-surface border border-hairline p-5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 border-b border-hairline pb-3.5 mb-4">
              <Palette className="h-4.5 w-4.5 text-ink shrink-0" strokeWidth={2} />
              <h2 className="text-sm font-semibold text-ink leading-none">{t("settings.appearance")}</h2>
            </div>
            <p className="text-xs text-ink-muted mb-4">{t("settings.themeDesc")}</p>

            <div className="flex gap-2">
              {(["light", "dark"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => set(mode)}
                  className={cn(
                    "flex items-center justify-center gap-2 h-9 px-4 rounded-md border text-xs font-medium capitalize flex-1 transition-all cursor-pointer",
                    theme === mode
                      ? "border-primary bg-primary-soft text-primary font-semibold"
                      : "border-hairline text-ink-secondary hover:bg-surface-muted",
                  )}
                >
                  {mode === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {mode}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
