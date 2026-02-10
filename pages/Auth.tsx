import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Mail, Lock, Heart, ArrowRight, ArrowLeft } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-primary-50 to-white -z-10" />
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute top-[20%] left-[-10%] w-48 h-48 bg-violet-100 rounded-full blur-3xl opacity-50 -z-10" />

      <div className="flex-1 flex flex-col px-6 pt-12 pb-6 max-w-md mx-auto w-full">
        {/* Header Section */}
        <div className="flex-1 flex flex-col justify-center items-center text-center animate-fade-in">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 group-hover:opacity-30 transition-opacity rounded-full"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/20 transform -rotate-3 transition-transform duration-300 hover:rotate-0 hover:scale-105">
              <Heart className="w-10 h-10 fill-current animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Socially
          </h1>
          <p className="text-slate-500 text-lg max-w-[280px]">
            {isLogin 
              ? 'Welcome back! Your community is waiting.' 
              : 'Create a profile and start connecting instantly.'}
          </p>
        </div>

        {/* Form Section */}
        <div className="w-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
              <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center animate-slide-up">
                {error}
              </div>
            )}

            <div className="pt-4">
              <Button type="submit" fullWidth isLoading={loading} className="shadow-xl shadow-primary-500/20">
                {isLogin ? 'Sign In' : 'Create Account'}
                {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          </form>

          {/* Toggle View */}
          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                // Clear inputs for better UX
                setEmail('');
                setPassword('');
              }}
              className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors py-2 px-4 rounded-xl hover:bg-slate-50"
            >
              {isLogin ? (
                <>New to Socially? <span className="text-primary-600 ml-1">Sign Up</span></>
              ) : (
                <>Have an account? <span className="text-primary-600 ml-1">Log In</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;