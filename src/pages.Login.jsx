import React from "react";
import { Link } from "react-router-dom";
import { Mail, Key, ArrowRight, Lock } from "lucide-react";
import { checkPassword, sendCode, verifyCode, saveUser, saveSession } from "./lib.session.js";

export default function LoginPage({ onLogin }){
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState(1); // 1: email, 2: password, 3: code
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleEmailSubmit(e){
    e?.preventDefault();
    if (!email.trim()) {
      setErr("Please enter your email address");
      return;
    }
    setErr("");
    setStep(2);
  }

  async function handlePasswordSubmit(e){
    e?.preventDefault();
    if (!password.trim()) {
      setErr("Please enter your password");
      return;
    }
    try{
      setErr("");
      setLoading(true);
      await checkPassword(email.trim(), password.trim());
      // Password is correct, now send code
      await sendCode(email.trim());
      setStep(3);
    }catch(e){ 
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Invalid password. Please try again.");
      setErr(errorMessage); 
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e){
    e?.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setErr("Please enter the 6-digit code");
      return;
    }
    
    try{
      setErr("");
      setLoading(true);
      await verifyCode(email.trim(), code.trim(), password.trim());
      await saveUser(email.trim());
      await saveSession(email.trim());
      onLogin && onLogin(email.trim());
    }catch(e){ 
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Invalid code. Please try again.");
      setErr(errorMessage); 
    } finally {
      setLoading(false);
    }
  }

  function handleResend(){
    setCode("");
    setErr("");
    handlePasswordSubmit();
  }

  function handleBack(){
    if (step === 3) {
      setStep(2);
      setCode("");
    } else if (step === 2) {
      setStep(1);
      setPassword("");
    }
    setErr("");
  }

  return (
    <main className="max-w-md mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input 
                type="email"
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="you@example.com" 
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                disabled={loading}
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
            >
              {loading ? "Loading..." : "Continue"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            <div className="text-center">
              <Link to="/signup" className="text-sm text-gray-400 hover:text-gray-300">
                Don't have an account? Create one
              </Link>
            </div>
          </form>
        ) : step === 2 ? (
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-4">
                Enter your password for <span className="text-white font-medium">{email}</span>
              </p>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input 
                type="password"
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
            >
              {loading ? "Verifying..." : "Continue"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            <button 
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50 mb-4"
            >
              ← Back
            </button>
            <div className="text-center">
              <Link to="/signup" className="text-sm text-gray-400 hover:text-gray-300">
                Don't have an account? Create one
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-4">
                We sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>
              </p>
              
              {/* Verification Code field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Verification Code
                </label>
                <input 
                  type="text"
                  value={code} 
                  onChange={e=>setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000" 
                  maxLength={6}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center text-2xl tracking-widest font-mono"
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">Enter the 6-digit code from your email</p>
              </div>
              
            </div>
            <button 
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button 
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="w-full text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50 mb-3"
            >
              Didn't receive code? Resend
            </button>
            <button 
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50"
            >
              ← Back
            </button>
          </form>
        )}
        {err && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {err}
          </div>
        )}
      </div>
    </main>
  );
}
