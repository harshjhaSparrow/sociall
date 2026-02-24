import {
  ArrowRight,
  ChevronLeft,
  EyeOff,
  Ghost,
  Loader2,
  PauseCircle,
  Radar,
  Trash2
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [discoveryRadius, setDiscoveryRadius] = useState(10);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const profile = await api.profile.get(user.uid);
        if (profile) {
          setIsGhostMode(!!profile.isGhostMode);
          setIsDiscoverable(profile.isDiscoverable !== false);
          setDiscoveryRadius(profile.discoveryRadius || 10);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const toggleGhostMode = async () => {
    if (!user) return;
    const newValue = !isGhostMode;
    setIsGhostMode(newValue);

    try {
      await api.profile.createOrUpdate(user.uid, {
        isGhostMode: newValue,
      });
    } catch (e) {
      setIsGhostMode(!newValue);
    }
  };

  const toggleDiscoverable = async () => {
    if (!user) return;
    const newValue = !isDiscoverable;
    setIsDiscoverable(newValue);

    try {
      await api.profile.createOrUpdate(user.uid, {
        isDiscoverable: newValue,
      });
    } catch (e) {
      setIsDiscoverable(!newValue);
    }
  };

  const handleRadiusChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDiscoveryRadius(parseInt(e.target.value));
  };

  const saveRadius = async () => {
    if (!user) return;
    try {
      await api.profile.createOrUpdate(user.uid, {
        discoveryRadius,
      });
    } catch (e) {
      console.error("Failed to save radius");
    }
  };

  const handleConfirmDelete = async () => {
    if (!user) return;

    setDeletingAccount(true);

    try {
      const success = await api.profile.delete(user.uid);

      if (success) {
        await logout();
        navigate("/auth");
      }
    } catch (e) {
      console.error("Account deletion failed:", e);
    } finally {
      setDeletingAccount(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 shadow-sm z-30 sticky top-0 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <span className="font-bold text-white text-lg">
          Settings
        </span>

        <div className="w-10" />
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-4 space-y-6">

        {/* DISCOVERY */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Discovery Settings
          </h3>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Radar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-base">
                  Discovery Radius
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Show users & posts within {discoveryRadius}km
                </p>
              </div>
              <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                {discoveryRadius}km
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="50"
              value={discoveryRadius}
              onChange={handleRadiusChange}
              onMouseUp={saveRadius}
              onTouchEnd={saveRadius}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!isDiscoverable ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                <PauseCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-base">
                  Pause Discoverability
                </h4>
                <p className="text-xs text-slate-400">
                  Hide me from the map and discovery lists.
                </p>
              </div>

              <button
                onClick={toggleDiscoverable}
                className={`relative inline-flex h-7 w-12 rounded-full transition ${!isDiscoverable ? "bg-orange-500" : "bg-slate-700"}`}
              >
                <span
                  className={`inline-block h-6 w-6 bg-white rounded-full transform transition ${!isDiscoverable ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* PRIVACY */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Privacy & Safety
          </h3>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGhostMode ? "bg-purple-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                {isGhostMode ? <Ghost className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-base">
                  Ghost Mode
                </h4>
                <p className="text-xs text-slate-400">
                  Completely hide your presence.
                </p>
              </div>

              <button
                onClick={toggleGhostMode}
                className={`relative inline-flex h-7 w-12 rounded-full transition ${isGhostMode ? "bg-purple-600" : "bg-slate-700"}`}
              >
                <span
                  className={`inline-block h-6 w-6 bg-white rounded-full transform transition ${isGhostMode ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

            {isGhostMode && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-200">
                You are currently invisible.
              </div>
            )}
          </div>
        </section>

        {/* ACCOUNT */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Account
          </h3>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <button
              onClick={() => navigate("/edit-profile")}
              className="w-full p-4 text-red-400 flex justify-between hover:bg-slate-800/50"
            >
              Edit Profile
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full p-4 text-red-400 flex justify-between hover:bg-slate-800/50"
            >
              Sign Out
            </button>

            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="w-full p-4 text-red-500 font-bold border-t border-slate-800 hover:bg-red-500/10 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </section>

        {/* Info */}
        <div className="text-center pt-8 pb-4">
          <p className="text-xs text-slate-600">Orbyt v1.0.0</p>
          <div className="flex gap-4 justify-center mt-2 text-xs text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;