import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Mail, Lock, Heart, ArrowRight, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      if (isLogin) {
        response = await api.auth.login(email, password);
      } else {
        response = await api.auth.signup(email, password);
      }
      login(response.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch(e) {
      return null;
    }
  };

  const handleCredentialResponse = async (response: any) => {
    if (response.credential) {
      const payload = decodeJwt(response.credential);
      if (payload) {
        try {
          // Send profile info to backend to create/login user
          const apiResponse = await api.auth.googleLogin(
            payload.email,
            payload.name,
            payload.picture
          );
          login(apiResponse.user);
        } catch (err) {
          setError("Google login failed.");
        }
      }
    }
  };

  useEffect(() => {
    // Initialize Google Sign-In
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "793742543220-aggmdtptgpbns7vrem2ftpelnv73g4e4.apps.googleusercontent.com",
          callback: handleCredentialResponse
        });
        
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { 
            theme: "outline", 
            size: "large", 
            width: "100%", // Will span the container
            text: "continue_with",
            shape: "pill",
            logo_alignment: "left"
          } 
        );
      }
    };

    // Check if script is loaded, if not wait a bit
    if (window.google) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogle();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-slate-900 to-slate-950 -z-10" />
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary-500/20 rounded-full blur-3xl opacity-50 -z-10 animate-pulse" />
      <div className="absolute top-[20%] left-[-10%] w-48 h-48 bg-purple-500/20 rounded-full blur-3xl opacity-50 -z-10" />

      <div className="flex-1 flex flex-col px-6 pt-12 pb-6 max-w-md mx-auto w-full justify-center">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center animate-fade-in mb-8">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/30 transform -rotate-3 transition-transform duration-300 hover:rotate-0 hover:scale-105 border border-primary-400/50">
              <Heart className="w-10 h-10 fill-current animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
            Socially
          </h1>
          <p className="text-slate-400 text-lg max-w-[280px]">
            {isLogin 
              ? 'Welcome back! Your community is waiting.' 
              : 'Create a profile and start connecting instantly.'}
          </p>
        </div>

        {/* Form Section */}
        <div className="w-full animate-slide-up bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Input 
                type="email" 
                placeholder="hello@example.com" 
                label="Email Address"
                icon={<Mail className="w-5 h-5" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input 
                type="password" 
                placeholder="••••••••" 
                label="Password"
                icon={<Lock className="w-5 h-5" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20 text-center animate-slide-up">
                {error}
              </div>
            )}

            <div className="pt-4 space-y-4">
              <Button type="submit" fullWidth isLoading={loading} className="shadow-xl shadow-primary-500/20">
                {isLogin ? 'Sign In' : 'Create Account'}
                {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
              
              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium">Or continue with</span>
                  <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Google Button Container */}
              <div id="googleBtn" className="w-full flex justify-center min-h-[48px]"></div>
            </div>
          </form>

          {/* Toggle View */}
          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setEmail('');
                setPassword('');
              }}
              className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-primary-400 transition-colors py-2 px-4 rounded-xl hover:bg-slate-800"
            >
              {isLogin ? (
                <>New to Socially? <span className="text-primary-400 ml-1">Sign Up</span></>
              ) : (
                <>Have an account? <span className="text-primary-400 ml-1">Log In</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;