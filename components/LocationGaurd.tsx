import React, { useState, useEffect, createContext, useContext } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import Button from './ui/Button';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Location } from '../types';

interface LocationContextType {
  location: Location | null;
}

export const LocationContext = createContext<LocationContextType>({ location: null });
export const useUserLocation = () => useContext(LocationContext);

interface LocationGuardProps {
  children: React.ReactNode;
}

const LocationGuard: React.FC<LocationGuardProps> = ({ children }) => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  // Helper to fetch/update location
  const updateLocation = async () => {
    if (!navigator.geolocation) return;

    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(loc);
          setHasPermission(true);
          setLoading(false);

          // Update backend if user is logged in
          if (user) {
            try {
              // We'll reverse geocode lazily or just send coords.
              // For now, let's just send coords to profile.
              await api.profile.createOrUpdate(user.uid, {
                 lastLocation: loc
              });
            } catch (e) {
              console.error("Failed to sync location to profile", e);
            }
          }
          resolve();
        },
        (error) => {
          console.error("Location error:", error);
          setLoading(false);
          // If already has permission from previous check, we might want to be lenient?
          // But strict mode says we need it.
          reject(error);
        }
      );
    });
  };

  useEffect(() => {
    // Check permission status
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        updateLocation();
      } else {
        setLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Re-run if user changes to ensure we sync location to new user

  const requestLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
    updateLocation().catch(() => {
       alert("Location access is required to use Socially. Please enable it in your browser settings.");
       setLoading(false);
    });
  };

  if (loading) {
     return (
        <div className="h-screen w-screen flex items-center justify-center bg-white">
           <div className="animate-pulse flex flex-col items-center">
              <MapPin className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-slate-400 font-medium">Checking permissions...</p>
           </div>
        </div>
     );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center justify-center text-center">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-8 animate-fade-in">
          <MapPin className="w-12 h-12 text-primary-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Enable Location</h1>
        <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">
          To connect with people nearby and get the full Socially experience, we need access to your location.
        </p>
        
        <Button onClick={requestLocation} fullWidth className="shadow-xl shadow-primary-500/20">
          Allow Location Access
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <p className="mt-6 text-xs text-slate-400">
          We prioritize your privacy and only use this to show relevant content.
        </p>
      </div>
    );
  }

  return (
    <LocationContext.Provider value={{ location: currentLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationGuard;