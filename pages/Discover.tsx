import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, SearchX, User as UserIcon, Heart, X } from 'lucide-react';
import { api } from '../services/api';
import { useUserLocation } from '../components/LocationGuard';
import { calculateDistance } from '../util/location';
import { POPULAR_INTERESTS, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';

/* ──────────────────────────────────────────────────────────────────────────
   Swipeable card — pure pointer-events, no library required
   ────────────────────────────────────────────────────────────────────────── */
interface SwipeableCardProps {
    profile: UserProfile;
    distText: string;
    onSwipe: (dir: 'left' | 'right') => void;
    onNavigate: () => void;
    isTop: boolean;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ profile, distText, onSwipe, onNavigate, isTop }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const currentX = useRef(0);
    const isDragging = useRef(false);
    const [transform, setTransform] = useState({ x: 0, rot: 0, opacity: 1 });

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        if (!isTop) return;
        isDragging.current = true;
        startX.current = e.clientX;
        cardRef.current?.setPointerCapture(e.pointerId);
    }, [isTop]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - startX.current;
        currentX.current = dx;
        const rot = dx / 20;
        setTransform({ x: dx, rot, opacity: 1 });
    }, []);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        const dx = currentX.current;
        currentX.current = 0;

        try {
            cardRef.current?.releasePointerCapture(e.pointerId);
        } catch(err) {}

        if (Math.abs(dx) > 100) {
            const dir = dx > 0 ? 'right' : 'left';
            const flyX = dir === 'right' ? 600 : -600;
            setTransform({ x: flyX, rot: flyX / 20, opacity: 0 });
            setTimeout(() => onSwipe(dir), 300);
        } else {
            setTransform({ x: 0, rot: 0, opacity: 1 });
        }
    }, [onSwipe]);

    const swipeColor = transform.x > 40 ? 'rgba(34,197,94,0.15)' : transform.x < -40 ? 'rgba(239,68,68,0.15)' : 'transparent';

    return (
        <div
            ref={cardRef}
            className="absolute inset-0 touch-none select-none"
            style={{
                transform: `translateX(${transform.x}px) rotate(${transform.rot}deg)`,
                opacity: transform.opacity,
                transition: isDragging.current ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
                cursor: isTop ? 'grab' : 'default',
                pointerEvents: isTop ? 'auto' : 'none',
                zIndex: isTop ? 10 : 5,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
        >
            <div className="w-full h-full bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col" style={{ backgroundColor: swipeColor !== 'transparent' ? undefined : undefined }}>
                {/* Swipe Hint Overlays */}
                {transform.x > 40 && (
                    <div className="absolute top-6 left-6 z-20 border-4 border-green-500 text-green-500 font-black text-2xl px-4 py-2 rounded-xl rotate-[-20deg]">LIKE 💚</div>
                )}
                {transform.x < -40 && (
                    <div className="absolute top-6 right-6 z-20 border-4 border-red-500 text-red-500 font-black text-2xl px-4 py-2 rounded-xl rotate-[20deg]">PASS ✕</div>
                )}

                {/* Photo */}
                <div className="h-3/5 bg-slate-800 relative" onClick={onNavigate}>
                    {profile.photoURL ? (
                        <img src={profile.photoURL} alt={profile.displayName} draggable={false} className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center pointer-events-none">
                            <UserIcon className="w-20 h-20 text-slate-600" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 pointer-events-none" />
                </div>

                {/* Info */}
                <div className="p-6 flex-1 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-white mb-2">{profile.displayName}</h2>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {profile.jobRole && (
                            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                                <Briefcase className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-200">{profile.jobRole}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-primary-500/10 px-2.5 py-1 rounded-lg border border-primary-500/20">
                            <MapPin className="w-4 h-4 text-primary-400" />
                            <span className="text-sm font-bold text-primary-300">{distText}</span>
                        </div>
                    </div>
                    {profile.bio && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed">{profile.bio}</p>
                    )}
                    {profile.interests && profile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-auto">
                            {profile.interests.slice(0, 3).map(id => {
                                const tag = POPULAR_INTERESTS.find(i => i.id === id);
                                return (
                                    <span key={id} className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
                                        {tag ? `${tag.emoji} ${tag.label}` : id}
                                    </span>
                                );
                            })}
                            {profile.interests.length > 3 && (
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
                                    +{profile.interests.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────────────────
   Main Discover Page
   ────────────────────────────────────────────────────────────────────────── */
export default function Discover() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { location: myLocation } = useUserLocation();

    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [topIndex, setTopIndex] = useState(0);

    useEffect(() => {
        const fetchDiscover = async () => {
            if (!user) return;
            try {
                const [allUsers, myProf] = await Promise.all([
                    api.profile.getAllWithLocation(user.uid),
                    api.profile.get(user.uid)
                ]);

                const maxDistanceMeters = (myProf?.discoveryRadius || 10) * 1000;

                // Exclude yourself, friends, people you've already sent a request to, and people who sent you one
                const excluded = new Set<string>([
                    user.uid,
                    ...(myProf?.friends || []),
                    ...(myProf?.outgoingRequests || []),
                    ...(myProf?.incomingRequests || []),
                    ...(myProf?.blockedUsers || []),
                ]);

                const filtered = allUsers.filter((u: any) => {
                    if (excluded.has(u.uid)) return false;
                    if (u.isDiscoverable === false) return false;
                    if (!u.lastLocation || !myLocation) return false;
                    const R = 6371e3;
                    const rad = Math.PI / 180;
                    const { lat: lat1, lng: lng1 } = myLocation;
                    const { lat: lat2, lng: lng2 } = u.lastLocation;
                    const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lng2 - lng1) * rad / 2) ** 2;
                    const distMeters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return distMeters <= maxDistanceMeters;
                });

                setProfiles(filtered);
                setTopIndex(0);
            } catch (e) {
                console.error("Failed to load discover profiles", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDiscover();
    }, [user, myLocation]);

    const handleSwipe = useCallback((index: number, dir: 'left' | 'right') => {
        if (dir === 'right' && user) {
            // Do not await to avoid blocking the UI swipe update
            api.friends.sendRequest(user.uid, profiles[index].uid).catch(e => {
                console.error("Failed to send request", e);
            });
        }
        setTopIndex(i => i + 1);
    }, [profiles, user]);

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const visibleProfiles = profiles.slice(topIndex, topIndex + 3);

    if (visibleProfiles.length === 0) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center min-h-[60vh] text-center px-6">
                <SearchX className="w-16 h-16 text-slate-700 mb-4" />
                <h2 className="text-xl font-bold text-slate-200 mb-2">No one nearby.</h2>
                <p className="text-slate-400 text-sm">Try expanding your discovery radius in Settings.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-24">
            <div className="px-6 pt-6 mb-4">
                <h1 className="text-3xl font-bold text-white mb-0.5 tracking-tight">Discover</h1>
                <p className="text-slate-400 text-xs font-medium">Swipe Right to Add Friend · Left to Pass</p>
            </div>

            {/* Card Stack */}
            <div className="relative mx-auto w-full max-w-sm px-4" style={{ height: '72vh' }}>
                {/* Render up to 3 cards, bottom → top */}
                {[...visibleProfiles].reverse().map((profile, reverseIdx) => {
                    const stackIdx = visibleProfiles.length - 1 - reverseIdx;
                    const isTop = stackIdx === 0;
                    const scale = 1 - stackIdx * 0.04;
                    const translateY = stackIdx * 10;
                    const distText = myLocation && profile.lastLocation
                        ? calculateDistance(myLocation.lat, myLocation.lng, profile.lastLocation.lat, profile.lastLocation.lng)
                        : "Nearby";

                    return (
                        <div
                            key={profile.uid}
                            className="absolute inset-0"
                            style={{
                                transform: `scale(${scale}) translateY(${translateY}px)`,
                                zIndex: isTop ? 10 : 10 - stackIdx,
                                transition: 'transform 0.3s ease',
                            }}
                        >
                            <SwipeableCard
                                profile={profile}
                                distText={distText}
                                isTop={isTop}
                                onSwipe={(dir) => handleSwipe(topIndex + stackIdx, dir)}
                                onNavigate={() => navigate(`/profile/${profile.uid}`)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-8 mt-4 pt-2">
                <button
                    onClick={() => handleSwipe(topIndex, 'left')}
                    className="w-16 h-16 rounded-full bg-slate-900 border-2 border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/10 active:scale-95 transition-all shadow-xl"
                >
                    <X className="w-7 h-7" />
                </button>
                <button
                    onClick={() => handleSwipe(topIndex, 'right')}
                    className="w-16 h-16 rounded-full bg-slate-900 border-2 border-green-500/50 flex items-center justify-center text-green-400 hover:bg-green-500/10 active:scale-95 transition-all shadow-xl"
                >
                    <Heart className="w-7 h-7" />
                </button>
            </div>

            <p className="text-center text-xs text-slate-600 mt-3">
                {profiles.length - topIndex} profile{profiles.length - topIndex !== 1 ? 's' : ''} remaining
            </p>
        </div>
    );
}
