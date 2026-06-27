import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Lock, User, AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid login credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_30%,rgba(212,166,90,0.05)_0%,transparent_60%)] pointer-events-none z-0" />
      
      {/* Decorative luxury elements */}
      <div className="absolute top-8 left-8 text-xs tracking-[0.2em] text-[#8B7355] font-serif uppercase select-none">
        Glory Simon Interiors
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="glass-strong rounded-3xl p-8 md:p-10 border border-[#D4A65A]/20 bg-[#0A0A0A]/85 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Subtle gold line on top card border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A65A]/40 to-transparent" />
          
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-black text-lg mb-4 select-none"
                 style={{ background: 'linear-gradient(135deg, #D4A65A 0%, #E6C27A 100%)', boxShadow: '0 0 25px rgba(212,166,90,0.35)' }}>
              GS
            </div>
            <h2 className="text-3xl font-serif font-light text-[#F5F1EA] tracking-wide mb-1">
              Admin Login
            </h2>
            <p className="text-xs text-[#CBBEAB]/70 tracking-wider uppercase font-light font-sans">
              Glory Simon Interiors CRM
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message Section */}
            {(errorMsg || authError) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-sans"
              >
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg || authError?.message}</span>
              </motion.div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#CBBEAB] uppercase tracking-wider font-sans">
                Username or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8B7355]">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10.5 pr-3 py-3 bg-[#0A0A0A] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A65A] text-sm"
                  placeholder="admin123"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#CBBEAB] uppercase tracking-wider font-sans">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#8B7355]">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10.5 pr-11 py-3 bg-[#0A0A0A] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4A65A] text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8B7355] hover:text-[#D4A65A] transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password placeholders removed since only single admin account login */}
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="premium"
              isLoading={isLoading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-widest uppercase cursor-pointer"
            >
              Sign In
            </Button>
          </form>
        </div>
      </motion.div>
      
      {/* Footer copyright */}
      <div className="mt-8 text-[10px] text-[#CBBEAB]/40 tracking-widest uppercase font-light font-sans z-10 select-none">
        &copy; {new Date().getFullYear()} Glory Simon Interiors. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;
