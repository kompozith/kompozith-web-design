import { useCallback, useEffect, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  ExternalLink,
  Images,
  LayoutGrid,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { api, type AdminUserView } from "../lib/api";
import LoginScreen from "./LoginScreen";
import Dashboard from "./Dashboard";
import ProjectEditor from "./ProjectEditor";
import MediaLibrary from "./MediaLibrary";
import AccountPanel from "./AccountPanel";
import { Toast } from "./ui";

const NAV = [
  { to: "/kz-console", label: "Projects", icon: LayoutGrid, end: true },
  { to: "/kz-console/media", label: "Media", icon: Images, end: false },
  { to: "/kz-console/account", label: "Security", icon: ShieldCheck, end: false },
];

export default function AdminApp() {
  const [user, setUser] = useState<AdminUserView | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [checking, setChecking] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const navigate = useNavigate();

  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }, []);

  /* The console must never be indexed or cached, even if a proxy misbehaves. */
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow, noarchive";
    document.head.appendChild(meta);

    const previousTitle = document.title;
    document.title = "Console";
    // The site's scroll-driven dark window must not reach in here.
    document.documentElement.classList.remove("theme-dark");

    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    api
      .me()
      .then(({ user: me, mfaRequired: required }) => {
        setUser(me);
        setMfaRequired(required);
      })
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const signOut = async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
    navigate("/kz-console", { replace: true });
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080E1A]">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#5B6980]">
          Checking session…
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onAuthenticated={(me) => {
          setUser(me);
          notify(`Signed in as ${me.username}`);
          void api
            .me()
            .then(({ mfaRequired: required }) => setMfaRequired(required))
            .catch(() => undefined);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080E1A] font-sans">
      {/* ---------------------------------------------------------- top bar */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#080E1A]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 md:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF6230]">
                <ShieldCheck className="h-4 w-4 text-white" />
              </span>
              <span className="font-sans text-sm font-black tracking-tight text-[#F1F5FA]">
                Console
              </span>
            </div>

            <nav className="flex items-center gap-1">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-2 font-sans text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-white/8 text-[#F1F5FA]"
                        : "text-[#8A97AC] hover:text-[#F1F5FA]"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-sans text-[13px] text-[#8A97AC] transition-colors hover:text-[#F1F5FA]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden md:inline">View site</span>
            </a>
            <span className="hidden font-mono text-[11px] text-[#5B6980] md:inline">
              {user.username}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 font-sans text-[13px] text-[#8A97AC] transition-colors hover:border-white/25 hover:text-[#F1F5FA]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {user.mustChangePassword && (
        <div className="border-b border-amber-500/20 bg-amber-500/8">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-2.5 md:px-8">
            <p className="font-sans text-[13px] text-amber-200">
              You are still on the password generated at setup.
            </p>
            <NavLink
              to="/kz-console/account"
              className="font-sans text-[13px] font-semibold text-amber-100 underline underline-offset-2"
            >
              Change it now
            </NavLink>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <Routes>
          <Route path="/" element={<Dashboard notify={notify} />} />
          <Route
            path="/projects/:id"
            element={<ProjectEditor notify={notify} />}
          />
          <Route path="/media" element={<MediaLibrary notify={notify} />} />
          <Route
            path="/account"
            element={
              <AccountPanel
                user={user}
                mfaRequired={mfaRequired}
                onUserChange={setUser}
                notify={notify}
              />
            }
          />
          <Route path="*" element={<Navigate to="/kz-console" replace />} />
        </Routes>
      </main>

      <Toast message={toast} />
    </div>
  );
}
