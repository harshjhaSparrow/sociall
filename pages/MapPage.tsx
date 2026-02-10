import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { api } from '../services/api';
import { UserProfile, POPULAR_INTERESTS } from '../types';
import { Loader2, X, MapPin, ChevronRight, Users, User, Instagram } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '@/components/LocationGaurd';
import { calculateDistance } from '@/components/util/location';

// Helper to get raw meters for sorting
const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const MapPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const { location: myLocation } = useUserLocation();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListOpen, setIsListOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<(UserProfile & { distDisplay: string }) | null>(null);

  // 1. Fetch Users with Locations
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.profile.getAllWithLocation();
        setUsers(data);
      } catch (e) {
        console.error("Failed to load map users", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // 2. Process Users (Filter self, Calculate Distance, Sort)
  const nearbyUsers = useMemo(() => {
    if (!myLocation) return [];
    
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
      .sort((a, b) => a.distMeters - b.distMeters);
  }, [users, myLocation, currentUser]);


  console.log("nearbyUsers",nearbyUsers)

  // 3. Initialize Map
  useEffect(() => {
    if (!mapContainer.current || !myLocation || mapInstance.current) return;

    // Create Map
    const map = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false
    }).setView([myLocation.lat, myLocation.lng], 14);

    mapInstance.current = map;

    // CartoDB Voyager Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Add Current User Marker
    const myIcon = L.divIcon({
      className: 'bg-transparent',
      html: `<div class="relative w-6 h-6">
               <div class="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>
               <div class="absolute inset-0 bg-primary-600 rounded-full border-2 border-white shadow-lg"></div>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([myLocation.lat, myLocation.lng], { icon: myIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup("<b>You are here</b>");
    
    // Add click handler to map to clear selection
    map.on('click', () => {
        setSelectedUser(null);
    });

    setTimeout(() => { map.invalidateSize(); }, 200);

    return () => {
        map.remove();
        mapInstance.current = null;
    };
  }, [myLocation]);

  // 4. Update Markers when users change
  useEffect(() => {
    if (!mapInstance.current || nearbyUsers.length === 0) return;
    
    const map = mapInstance.current;
    const markers: L.Marker[] = [];

    nearbyUsers.forEach(u => {
       if (u.lastLocation) {
         // Avatar Marker
         const icon = L.divIcon({
           className: 'bg-transparent',
           html: `
             <div class="w-12 h-12 relative group transition-transform duration-300 hover:scale-110 hover:z-[9999] cursor-pointer">
                <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white filter drop-shadow-sm"></div>
                <div class="absolute bottom-1.5 left-0 right-0 top-0 rounded-full bg-white p-0.5 shadow-md overflow-hidden border border-white">
                    ${u.photoURL 
                      ? `<img src="${u.photoURL}" class="w-full h-full object-cover rounded-full" />`
                      : `<div class="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-[10px]">${u.displayName.charAt(0)}</div>`
                    }
                </div>
             </div>
           `,
           iconSize: [48, 48],
           iconAnchor: [24, 48],
           popupAnchor: [0, -48]
         });

         const marker = L.marker([u.lastLocation.lat, u.lastLocation.lng], { icon })
           .addTo(map);
           
          // On click, set selected user and center map
          marker.on('click', (e) => {
             L.DomEvent.stopPropagation(e); // Prevent map click event
             setSelectedUser(u);
             setIsListOpen(false); // Close list drawer if open
             map.flyTo([u.lastLocation!.lat, u.lastLocation!.lng], 16, {
                 animate: true,
                 duration: 1.0
             });
          });

          markers.push(marker);
       }
    });

    return () => {
      markers.forEach(m => map.removeLayer(m));
    };
  }, [nearbyUsers]);


  if (loading) {
     return (
        <div className="flex items-center justify-center h-full min-h-screen bg-slate-100">
           <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
     );
  }

  return (
    <div className="h-[calc(100vh-80px)] w-full relative bg-slate-200">
        <div ref={mapContainer} className="w-full h-full z-0" style={{ isolation: 'isolate' }} />
        
        {/* SELECTED USER CARD OVERLAY */}
        {selectedUser && (
            <div className="absolute bottom-6 left-4 right-4 z-[1002] bg-white rounded-2xl p-4 shadow-2xl shadow-slate-900/10 border border-slate-100 animate-slide-up">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-50 overflow-hidden shrink-0 shadow-sm relative">
                        {selectedUser.photoURL ? (
                            <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                               <User className="w-8 h-8" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg truncate">{selectedUser.displayName}</h3>
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-0.5">
                            <div className="bg-primary-50 p-1 rounded-full text-primary-500">
                                 <MapPin className="w-3 h-3" />
                            </div>
                            <span className="font-medium">{selectedUser.distDisplay} away</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate(`/profile/${selectedUser.uid}`)}
                        className="h-12 w-12 bg-primary-500 hover:bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
                
                {selectedUser.bio && (
                    <div className="mt-3 pt-3 border-t border-slate-50 text-slate-500 text-sm truncate">
                        "{selectedUser.bio}"
                    </div>
                )}

                <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedUser(null); }}
                    className="absolute -top-3 -right-3 bg-white text-slate-400 p-1.5 rounded-full shadow-md border border-slate-50 hover:text-slate-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}

        {/* BOTTOM LEFT TRIGGER (Users Nearby) - Hidden if card is open */}
        {!isListOpen && !selectedUser && nearbyUsers.length > 0 && (
          <button 
            onClick={() => setIsListOpen(true)}
            className="absolute bottom-6 left-4 z-[1001] bg-white rounded-2xl shadow-xl shadow-slate-900/10 p-2 pr-4 flex items-center gap-3 transition-transform active:scale-95 border border-slate-100"
          >
            {/* Stacked Avatars */}
            <div className="flex -space-x-3 items-center">
              {nearbyUsers.slice(0, 3).map((u, i) => (
                <div key={u.uid} className={`w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative z-[${3-i}]`}>
                   {u.photoURL ? (
                     <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                       {u.displayName[0]}
                     </div>
                   )}
                </div>
              ))}
              {nearbyUsers.length > 3 && (
                 <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500 relative z-0">
                    +{nearbyUsers.length - 3}
                 </div>
              )}
            </div>
            
            <div className="text-left">
              <p className="font-bold text-slate-900 text-sm">{nearbyUsers.length} Nearby</p>
              <p className="text-[10px] text-primary-500 font-medium">Tap to view list</p>
            </div>
          </button>
        )}

        {/* BOTTOM DRAWER (User List) */}
        {isListOpen && (
          <div className="fixed inset-0 z-[2050] flex flex-col justify-end animate-fade-in">
             {/* Backdrop */}
             <div 
               className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
               onClick={() => setIsListOpen(false)}
             />
             
             {/* Drawer Content */}
             <div className="bg-slate-50 rounded-t-3xl shadow-2xl relative z-10 max-h-[85vh] flex flex-col animate-slide-up">
                {/* Handle / Header */}
                <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 rounded-t-3xl">
                   <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary-50 rounded-full text-primary-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">People Nearby</h2>
                        <p className="text-xs text-slate-500">Sorted by distance</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setIsListOpen(false)}
                     className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-3 no-scrollbar h-full">
                  {nearbyUsers.map(u => (
                    <div
                      key={u.uid}
                      className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 relative overflow-hidden"
                    >
                      <div className="flex gap-4">
                          {/* Avatar Side */}
                          <div className="shrink-0 flex flex-col items-center gap-2">
                              <div 
                                className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden border border-slate-100 shadow-sm cursor-pointer"
                                onClick={() => navigate(`/profile/${u.uid}`)}
                              >
                                  {u.photoURL ? (
                                      <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-lg">
                                          {u.displayName[0]}
                                      </div>
                                  )}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  <MapPin className="w-3 h-3 fill-current" />
                                  {u.distDisplay}
                              </div>
                          </div>

                          {/* Info Side */}
                          <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <h3 
                                        className="font-bold text-slate-900 text-lg leading-tight cursor-pointer hover:text-primary-600 transition-colors"
                                        onClick={() => navigate(`/profile/${u.uid}`)}
                                      >
                                          {u.displayName}
                                      </h3>
                                      {/* {u.lastLocation?.name ? (
                                          <p className="text-xs text-slate-400 mt-0.5">{u.lastLocation.name}</p>
                                      ) : (
                                          <p className="text-xs text-slate-400 mt-0.5 italic">Unknown location</p>
                                      )} */}
                                  </div>
                                  {u.instagramHandle && (
                                      <a 
                                        href={`https://instagram.com/${u.instagramHandle}`} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-pink-500 hover:text-pink-600 p-1.5 bg-pink-50 rounded-lg transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                          <Instagram className="w-4 h-4" />
                                      </a>
                                  )}
                              </div>
                              
                              {/* Bio */}
                              {/* <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                                  {u.bio || "No bio available."}
                              </p> */}

                              {/* Interests Chips */}
                              {u.interests && u.interests.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3">
                                      {u.interests.slice(0, 3).map(iid => {
                                          const tag = POPULAR_INTERESTS.find(p => p.id === iid);
                                          return (
                                              <span key={iid} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-medium text-slate-600">
                                                  {tag ? <span className="mr-1">{tag.emoji}</span> : null}
                                                  {tag ? tag.label : iid}
                                              </span>
                                          )
                                      })}
                                      {u.interests.length > 3 && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-medium text-slate-400">
                                              +{u.interests.length - 3}
                                          </span>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Action Button */}
                      {/* <button 
                          onClick={() => navigate(`/profile/${u.uid}`)}
                          className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 mt-1 active:scale-[0.98]"
                      >
                          View Full Profile <ChevronRight className="w-3 h-3" />
                      </button> */}
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