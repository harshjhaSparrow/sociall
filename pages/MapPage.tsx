import L from "leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet/dist/leaflet.css";

import { ChevronRight, Loader2, User, X } from "lucide-react";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

import { Instagram } from "lucide-react";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useNavigate } from "react-router-dom";
import { useUserLocation } from "../components/LocationGuard";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { POPULAR_INTERESTS, UserProfile } from "../types";
import { calculateDistance } from "../util/location";

/* -------------------- TYPES -------------------- */

type NearbyUser = UserProfile & {
  distDisplay: string;
  distMeters: number;
};

/* -------------------- DISTANCE -------------------- */

const getDistanceMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/* -------------------- MAP CLICK HANDLER -------------------- */

const MapEventHandler: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const map = useMap();

  useEffect(() => {
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [map, onClick]);

  return null;
};

/* -------------------- MAIN -------------------- */

const MapPage: React.FC = () => {
  const { location: myLocation } = useUserLocation();
  const { user: currentUser } = useAuth();
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);

  /* ---------------- FETCH USERS ---------------- */

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.profile.getAllWithLocation(currentUser?.uid);
        setUsers(data);
      } catch (e) {
        console.error("Failed to load map users", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  /* ---------------- NEARBY USERS ---------------- */

 const nearbyUsers = useMemo(() => {
    if (!myLocation) return [];
    
    // Default to 10km if not set
    const maxDistanceKm = currentUserProfile?.discoveryRadius || 10;
    const maxDistanceMeters = maxDistanceKm * 1000;

    return users
      .filter(u => u.uid !== currentUser?.uid && u.lastLocation)
      .map(u => {
        const distMeters = getDistanceMeters(
          myLocation.lat, myLocation.lng, 
          u.lastLocation!.lat, u.lastLocation!.lng
        );
        const distDisplay = calculateDistance(
          myLocation.lat, myLocation.lng, 
          u.lastLocation!.lat, u.lastLocation!.lng
        );
        return { ...u, distMeters, distDisplay };
      })
      .filter(u => u.distMeters <= maxDistanceMeters) // Apply Radius Filter
      .sort((a, b) => a.distMeters - b.distMeters);
  }, [users, myLocation, currentUser, currentUserProfile]);

  console.log("nearbyUsersnearbyUsers", nearbyUsers);

  /* ---------------- USER ICON ---------------- */

  const createUserIcon = useCallback(
    (user: NearbyUser) =>
      L.divIcon({
        className: "bg-transparent",
        html: `
          <div class="w-12 h-12 relative group">
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-800"></div>
            <div class="absolute bottom-1.5 left-0 right-0 top-0 rounded-full bg-slate-800 p-0.5 overflow-hidden border border-slate-700 shadow-md">
              ${
                user.photoURL
                  ? `<img src="${user.photoURL}" class="w-full h-full object-cover rounded-full" />`
                  : `<div class="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 font-bold">${user.displayName[0]}</div>`
              }
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
      }),
    [],
  );

  const myIcon = L.divIcon({
    className: "bg-transparent",
    html: `
      <div class="relative w-6 h-6">
        <div class="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>
        <div class="absolute inset-0 bg-primary-600 rounded-full border-2 border-slate-900 shadow-lg"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  /* ---------------- LOADING ---------------- */

  if (loading || !myLocation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  /* ---------------- RENDER ---------------- */

  return (
    <div className="h-[calc(100dvh-64px)] w-full relative bg-slate-950">
      <MapContainer
        center={[myLocation.lat, myLocation.lng]}
        zoom={14}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapEventHandler onClick={() => setSelectedUser(null)} />

        <Marker position={[myLocation.lat, myLocation.lng]} icon={myIcon} />

        <MarkerClusterGroup chunkedLoading>
          {nearbyUsers.map((user) => (
            <Marker
              key={user.uid}
              position={[user.lastLocation!.lat, user.lastLocation!.lng]}
              icon={createUserIcon(user)}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  setSelectedUser(user);
                  setIsListOpen(false);
                },
              }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* SELECTED USER CARD */}
      {selectedUser && (
        <div className="absolute bottom-6 left-4 right-4 z-[1002] bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
              {selectedUser.photoURL ? (
                <img
                  src={selectedUser.photoURL}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 m-auto text-slate-500" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">
                {selectedUser.displayName}
              </h3>
              <p className="text-sm text-primary-400">
                {selectedUser.distDisplay} away
              </p>
            </div>

            <button
              onClick={() => navigate(`/profile/${selectedUser.uid}`)}
              className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING NEARBY BUTTON */}
      {!isListOpen && !selectedUser && nearbyUsers.length > 0 && (
        <button
          onClick={() => setIsListOpen(true)}
          className="absolute bottom-6 left-4 z-[1001] bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl p-2 pr-4 flex items-center gap-3 border border-slate-800"
        >
          {/* Stacked Avatars */}
          <div className="flex -space-x-3 items-center">
            {nearbyUsers.slice(0, 3).map((u, i) => (
              <div
                key={u.uid}
                className={`w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden relative z-[${3 - i}]`}
              >
                {u.photoURL ? (
                  <img
                    src={u.photoURL}
                    alt={u.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                    {u.displayName[0]}
                  </div>
                )}
              </div>
            ))}
            {nearbyUsers.length > 3 && (
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 relative z-0">
                +{nearbyUsers.length - 3}
              </div>
            )}
          </div>

          <div className="text-left">
            <p className="font-bold text-white text-sm">
              {nearbyUsers.length} Nearby
            </p>
            <p className="text-[10px] text-primary-400 font-medium">
              Tap to view list
            </p>
          </div>
        </button>
      )}

      {/* BOTTOM DRAWER */}
      {isListOpen && (
        <div className="fixed inset-0 z-[2050] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsListOpen(false)}
          />

          <div className="bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col border-t border-slate-800 relative z-10">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between">
              <h2 className="text-lg font-bold text-white">People Nearby</h2>
              <button
                onClick={() => setIsListOpen(false)}
                className="text-slate-400"
              >
                <X />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-3 bg-slate-950">
              {nearbyUsers.map((u) => (
                <div
                  key={u.uid}
                  className="bg-slate-900 p-4 rounded-2xl border border-slate-800"
                >
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                          {u.displayName[0]}
                        </div>
                      )}
                    </div>

                    {/* Info Side */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3
                            className="font-bold text-white text-lg leading-tight cursor-pointer hover:text-primary-400 transition-colors"
                            onClick={() => navigate(`/profile/${u.uid}`)}
                          >
                            {u.displayName}
                          </h3>
                          {u.lastLocation?.name ? (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {u.lastLocation.name}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-500 mt-0.5 italic">
                              {u.distDisplay}
                            </p>
                          )}
                        </div>
                        {u.instagramHandle && (
                          <a
                            href={`https://instagram.com/${u.instagramHandle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-pink-400 hover:text-pink-300 p-1.5 bg-pink-500/10 rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Bio */}
                      <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {u.bio || "No bio available."}
                      </p>

                      {/* Interests Chips */}
                      {u.interests && u.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {u.interests.slice(0, 3).map((iid) => {
                            const tag = POPULAR_INTERESTS.find(
                              (p) => p.id === iid,
                            );
                            return (
                              <span
                                key={iid}
                                className="inline-flex items-center px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-300"
                              >
                                {tag ? (
                                  <span className="mr-1">{tag.emoji}</span>
                                ) : null}
                                {tag ? tag.label : iid}
                              </span>
                            );
                          })}
                          {u.interests.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-500">
                              +{u.interests.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate(`/profile/${u.uid}`)}
                    className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 mt-1 active:scale-[0.98] border border-slate-700"
                  >
                    View Full Profile <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Bottom Spacer for safe area */}
              <div className="h-6" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
