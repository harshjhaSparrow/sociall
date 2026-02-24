import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ChevronLeft, Ghost, EyeOff, Shield, ArrowRight, Radar, Map as MapIcon, PauseCircle, Trash2 } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [discoveryRadius, setDiscoveryRadius] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profile = await api.profile.get(user.uid);
          if (profile) {
            setIsGhostMode(!!profile.isGhostMode);
            // Default to true/10 if not set
            setIsDiscoverable(profile.isDiscoverable !== false);
            setDiscoveryRadius(profile.discoveryRadius || 10);
          }
        } catch (e) {
          console.error("Failed to load settings", e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const toggleGhostMode = async () => {
    if (!user) return;
    const newValue = !isGhostMode;
    setIsGhostMode(newValue);
    try {
      await api.profile.createOrUpdate(user.uid, { isGhostMode: newValue });
    } catch (e) {
      console.error("Failed to update ghost mode", e);
      // Revert on failure
      setIsGhostMode(!newValue);
    }
  };

  const toggleDiscoverable = async () => {
    if (!user) return;
    const newValue = !isDiscoverable;
    setIsDiscoverable(newValue);
    try {
      await api.profile.createOrUpdate(user.uid, { isDiscoverable: newValue });
    } catch (e) {
      console.error("Failed to update discoverable status", e);
      setIsDiscoverable(!newValue);
    }
  };

  const handleRadiusChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setDiscoveryRadius(val);
  };

  const saveRadius = async () => {
    if (!user) return;
    try {
      await api.profile.createOrUpdate(user.uid, { discoveryRadius: discoveryRadius });
    } catch (e) {
      console.error("Failed to save radius", e);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone and all your data (posts, messages, profile) will be erased."
    );
    if (confirmDelete && user) {
      try {
        setLoading(true);
        const success = await api.profile.delete(user.uid);
        if (success) {
          await logout();
          navigate('/auth');
        } else {
          alert("Failed to delete account. Please try again.");
        }
      } catch (e) {
        console.error("Account deletion failed:", e);
        alert("An error occurred while deleting your account.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

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
        <span className="font-bold text-white text-lg">Settings</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-4 space-y-6">

        {/* Discovery Section */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Discovery Settings</h3>

          {/* Radius Slider */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Radar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-base">Discovery Radius</h4>
                <p className="text-xs text-slate-400 mt-0.5">Show users & posts within {discoveryRadius}km</p>
              </div>
              <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">{discoveryRadius}km</span>
            </div>

            <div className="px-2">
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
              <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
                <span>1km</span>
                <span>50km</span>
              </div>
            </div>
          </div>

          {/* Pause Discoverability */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!isDiscoverable ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <PauseCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-base">Pause Discoverability</h4>
                <p className="text-xs text-slate-400 leading-tight mt-0.5">
                  Hide me from the map and discovery lists without disabling location features completely.
                </p>
              </div>

              <button
                onClick={toggleDiscoverable}
                className={`
                            relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75
                            ${!isDiscoverable ? 'bg-orange-500' : 'bg-slate-700'}
                        `}
              >
                <span
                  aria-hidden="true"
                  className={`
                                pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                                ${!isDiscoverable ? 'translate-x-5' : 'translate-x-0'}
                            `}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Privacy & Safety</h3>

          {/* Ghost Mode Toggle */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 mb-4">
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGhostMode ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {isGhostMode ? <Ghost className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-base">Ghost Mode</h4>
                <p className="text-xs text-slate-400 leading-tight mt-0.5">
                  Completely hide your location and presence. You remain invisible on the map.
                </p>
              </div>

              <button
                onClick={toggleGhostMode}
                className={`
                            relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75
                            ${isGhostMode ? 'bg-purple-600' : 'bg-slate-700'}
                        `}
              >
                <span
                  aria-hidden="true"
                  className={`
                                pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                                ${isGhostMode ? 'translate-x-5' : 'translate-x-0'}
                            `}
                />
              </button>
            </div>
            {isGhostMode && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex gap-2">
                <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-200 font-medium">You are currently invisible. Your location is hidden from all users.</p>
              </div>
            )}
          </div>
        </section>

        {/* Account Section */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Account</h3>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <button
              onClick={() => navigate('/edit-profile')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors border-b border-slate-800"
            >
              <span className="text-slate-200 font-medium">Edit Profile</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={handleLogout}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-red-400 font-medium"
            >
              Sign Out
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full p-4 flex items-center justify-between hover:bg-red-500/10 transition-colors text-red-500 font-bold border-t border-slate-800"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </div>
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