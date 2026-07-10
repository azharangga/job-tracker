import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Briefcase, Calendar, Award, TrendingUp, Building2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Logo } from "@/components/common/Logo";

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password, remember);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left: premium decorative dashboard preview */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-slate-950 p-12 select-none">
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full filter blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-600/15 rounded-full filter blur-[100px]" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Branding header inside left section */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight text-white/90">Job Tracker</span>
        </div>

        {/* Cards layout */}
        <div className="relative z-10 grid grid-cols-2 gap-5 my-auto max-w-md mx-auto w-full">
          <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-32 transform -rotate-[3.5deg] hover:rotate-0 hover:scale-[1.04] transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t("login.applications")}</span>
              <Briefcase className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-white mt-auto">40</div>
          </div>

          <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-32 transform rotate-[2.5deg] hover:rotate-0 hover:scale-[1.04] transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t("login.interviews")}</span>
              <Calendar className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-white mt-auto">12</div>
          </div>

          <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-32 transform -rotate-[2deg] hover:rotate-0 hover:scale-[1.04] transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t("login.offers")}</span>
              <Award className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-white mt-auto">4</div>
          </div>

          <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-32 transform rotate-[3deg] hover:rotate-0 hover:scale-[1.04] transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t("login.responseRate")}</span>
              <TrendingUp className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-white mt-auto">62%</div>
          </div>

          <div className="col-span-2 bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-32 transform -rotate-[1.5deg] hover:rotate-0 hover:scale-[1.04] transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t("login.dreamCompanies")}</span>
              <Building2 className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="text-xl font-bold tracking-tight text-white/90 mt-auto">
              Google <span className="text-white/20 mx-1">·</span> Meta <span className="text-white/20 mx-1">·</span> Apple
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="relative z-10 flex items-center gap-2 text-white/50 text-xs">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{t("login.workspaceTagline")}</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="text-title text-ink">{t("app.name")}</span>
            </div>
            <LanguageSwitcher compact={false} />
          </div>

          <h1 className="text-h1 text-ink">{t("login.title")}</h1>
          <p className="mt-2 text-sm text-ink-muted">{t("login.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-ink-secondary">{t("login.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-secondary">{t("login.password")}</label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-3 pr-10 rounded-md bg-surface border border-hairline text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-muted select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-hairline text-primary focus:ring-ring"
              />
              {t("login.rememberMe")}
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-active transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t("login.signingIn") : t("login.submit")}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
