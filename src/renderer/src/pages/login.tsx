"use client";

import { useState, useEffect, useRef, type FC, type FormEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@renderer/hooks/use-auth";
// All components are now using native HTML elements
import { Mail, LogIn, Phone, MessageSquare, Lock, X, AlertCircle } from "lucide-react";

type LoginMethod = "account" | "phone";

// Toast notification component
const Toast: FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000) // Auto close after 4 seconds

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/50 rounded-xl p-4 shadow-xl max-w-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-white text-sm font-medium leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Page Component
export default function LoginPage(): JSX.Element {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("account");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { login, sendSmsCode } = useAuth();
  const navigate = useNavigate();
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Account validation removed - accept any non-empty string
  
     const showError = (message: string): void => {
    setError(message)
    setShowToast(true)
  }

     const validatePhone = (phoneToValidate: string): boolean => {
    return /^1[3-9]\d{9}$/.test(phoneToValidate);
  };

  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      showError("请输入正确的手机号码");
      return;
    }

    setLoading(true);
    setError("");

    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      const result = await sendSmsCode(phone);
      
      if (result.success) {
        setCodeSent(true);
        setCountdown(60);
        
        // Start countdown
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        showError(result.message || "发送验证码失败");
      }
    } catch (error) {
      showError("发送验证码失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountLogin = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!account.trim() || !password.trim()) {
      showError("请输入账号和密码");
      setLoading(false);
      return;
    }

    try {
      const success = await login(account, password);
      if (success) {
        navigate("/proxies");
      } else {
        showError("登录失败，请检查账号和密码");
      }
    } catch (error) {
      showError("登录失败，请重试");
    }
    setLoading(false);
  };

  const handlePhoneLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!phone.trim() || !verificationCode.trim()) {
      showError("请输入手机号和验证码");
      setLoading(false);
      return;
    }

    if (!validatePhone(phone)) {
      showError("请输入正确的手机号码");
      setLoading(false);
      return;
    }

    try {
      // Simulate phone login - accept any 6-digit code
      if (verificationCode.length === 6) {
        const success = await login(phone, verificationCode);
        if (success) {
          navigate("/proxies");
        } else {
          showError("验证码错误，请重试");
        }
      } else {
        showError("请输入6位验证码");
      }
    } catch (error) {
      showError("登录失败，请重试");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100/80 via-purple-50/60 to-pink-100/80 dark:from-gray-900 dark:via-blue-950/80 dark:to-purple-950/80 p-4 relative overflow-hidden">
      {/* Draggable area for window */}
      <div className="fixed top-0 left-0 right-0 h-8 z-50" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}></div>
      {/* Glassmorphism background decorative elements */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-bl from-purple-400/25 to-pink-400/25 rounded-full blur-3xl animate-gentle-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/6 right-1/6 w-64 h-64 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-glow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/6 left-1/5 w-72 h-72 bg-gradient-to-tl from-indigo-400/15 to-purple-400/15 rounded-full blur-3xl animate-gentle-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-full blur-2xl animate-glow" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Enhanced grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* Elegant floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/5 left-1/5 w-2 h-2 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-2/5 left-3/5 w-1.5 h-1.5 bg-secondary/35 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/5 left-4/5 w-1 h-1 bg-purple-400/40 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-4/5 left-1/5 w-1.5 h-1.5 bg-blue-400/35 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/6 left-2/3 w-2 h-2 bg-emerald-400/30 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 right-1/5 w-1 h-1 bg-yellow-400/40 rounded-full animate-float" style={{ animationDelay: '5s' }}></div>
      </div>
      
      <div className="relative z-10">
        <div className="w-full max-w-lg relative">
          {/* Glassmorphism card with fixed height */}
          <div className="backdrop-blur-2xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/30 relative overflow-hidden min-h-[460px]">
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent rounded-3xl"></div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col">
              {/* Header - Fixed height */}
              <div className="text-center py-6 px-8 flex-shrink-0">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-br from-white/30 to-white/10 dark:from-white/20 dark:to-white/5 backdrop-blur-xl border border-white/30 dark:border-white/20 flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                    <LogIn className="h-10 w-10 text-primary dark:text-white drop-shadow-lg" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-3 drop-shadow-lg">
                  欢迎登录
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm opacity-80">
                  请选择您的登录方式
                </p>
              </div>
              
              {/* Form Area - Flexible height */}
                             <div className="px-8 pb-2 flex-1 flex flex-col">
                <div className="w-full flex-1">
                  {/* Tab buttons */}
                  <div className="flex bg-white/15 dark:bg-white/8 backdrop-blur-xl rounded-xl p-1 mb-4 border border-white/20 dark:border-white/15 shadow-sm w-[300px]">
                    <button
                      type="button"
                      className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-all duration-200 ${
                        loginMethod === "account"
                          ? "bg-white/60 dark:bg-white/20 text-gray-800 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10"
                      }`}
                      onClick={() => {
                        setLoginMethod('account')
                        setError('')
                        setShowToast(false)
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span>账号登录</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-all duration-200 ${
                        loginMethod === "phone"
                          ? "bg-white/60 dark:bg-white/20 text-gray-800 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10"
                      }`}
                      onClick={() => {
                        setLoginMethod('phone')
                        setError('')
                        setShowToast(false)
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span>手机登录</span>
                      </div>
                    </button>
                  </div>
              
                                     {/* Form container with fixed height */}
                   <div className="min-h-[240px] flex flex-col">
                    {loginMethod === "account" && (
                      <div className="animate-in slide-in-from-left-4 duration-300 flex-1">
                        <form onSubmit={handleAccountLogin} className="space-y-4 h-full flex flex-col">
                          {/* Enhanced input containers */}
                          <div className="space-y-3 flex-1">
                            {/* Account input */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 ml-0.5">
                                账号
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Mail className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </div>
                                <input
                                  type="text"
                                  placeholder="请输入账号"
                                  value={account}
                                  onChange={(e) => {
                                    setAccount(e.target.value)
                                    setError('')
                                    setShowToast(false)
                                  }}
                                  className="w-[300px] pl-10 pr-3 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-800/80 text-sm"
                                  required
                                />
                              </div>
                            </div>
                            
                            {/* Password input */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 ml-0.5">
                                登录密码
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Lock className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </div>
                                <input
                                  type="password"
                                  placeholder="请输入密码"
                                  value={password}
                                  onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError('')
                                    setShowToast(false)
                                  }}
                                  className="w-[300px] pl-10 pr-3 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-800/80 text-sm"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {/* Login button */}
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-[300px] py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium text-sm rounded-xl transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed"
                          >
                            {loading ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>登录中...</span>
                              </div>
                            ) : (
                              '立即登录'
                            )}
                          </button>
                        </form>
                      </div>
                    )}
              
                    {loginMethod === "phone" && (
                      <div className="animate-in slide-in-from-right-4 duration-300 flex-1">
                        <form onSubmit={handlePhoneLogin} className="space-y-4 h-full flex flex-col">
                          {/* Enhanced input containers */}
                          <div className="space-y-3 flex-1">
                            {/* Phone input */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 ml-0.5">
                                手机号码
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Phone className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </div>
                                <input
                                  type="tel"
                                  placeholder="请输入手机号码"
                                  value={phone}
                                  onChange={(e) => {
                                    setPhone(e.target.value)
                                    setError('')
                                    setShowToast(false)
                                  }}
                                  className="w-[300px] pl-10 pr-3 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-800/80 text-sm"
                                  required
                                />
                              </div>
                            </div>
                            
                            {/* Verification code input with send button */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 ml-0.5">
                                验证码
                              </label>
                              <div className="flex gap-2 w-[300px]">
                                <div className="relative flex-1">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="请输入验证码"
                                    value={verificationCode}
                                    onChange={(e) => {
                                      setVerificationCode(e.target.value)
                                      setError('')
                                      setShowToast(false)
                                    }}
                                    className="w-full pl-10 pr-3 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-800/80 text-sm"
                                    required
                                  />
                                </div>
                                
                                {/* Send code button */}
                                <button
                                  type="button"
                                  onClick={handleSendCode}
                                  disabled={countdown > 0 || !phone || loading}
                                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white disabled:text-gray-300 font-medium text-xs rounded-xl transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed w-[80px]"
                                >
                                  {loading && !codeSent ? (
                                    <div className="flex items-center justify-center">
                                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                  ) : countdown > 0 ? (
                                    `${countdown}s`
                                  ) : (
                                    '发送'
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Login button */}
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-[300px] py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium text-sm rounded-xl transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed"
                          >
                            {loading ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>登录中...</span>
                              </div>
                            ) : (
                              '立即登录'
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast notification */}
      {showToast && error && (
        <Toast 
          message={error} 
          onClose={() => {
            setShowToast(false)
            setError('')
          }} 
        />
      )}
      
      {/* Custom CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) translateX(0px) scale(1);
              opacity: 0.5;
            }
            25% { 
              transform: translateY(-25px) translateX(10px) scale(1.2);
              opacity: 0.8;
            }
            50% { 
              transform: translateY(-50px) translateX(-5px) scale(0.8);
              opacity: 0.6;
            }
            75% { 
              transform: translateY(-25px) translateX(-10px) scale(1.1);
              opacity: 0.9;
            }
          }
          
          @keyframes glow {
            0%, 100% { 
              filter: blur(25px) brightness(1);
              transform: scale(1);
            }
            50% { 
              filter: blur(35px) brightness(1.3);
              transform: scale(1.05);
            }
          }
          
          @keyframes gentlePulse {
            0%, 100% { 
              transform: scale(1);
              opacity: 0.6;
            }
            50% { 
              transform: scale(1.1);
              opacity: 0.8;
            }
          }
          
          @keyframes slideInFromLeft {
            0% { 
              opacity: 0;
              transform: translateX(-20px);
            }
            100% { 
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideInFromRight {
            0% { 
              opacity: 0;
              transform: translateX(20px);
            }
            100% { 
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .animate-float {
            animation: float 8s ease-in-out infinite;
          }
          
          .animate-glow {
            animation: glow 6s ease-in-out infinite;
          }
          
          .animate-gentle-pulse {
            animation: gentlePulse 4s ease-in-out infinite;
          }
          
          .animate-in {
            animation-duration: 300ms;
            animation-timing-function: ease-out;
            animation-fill-mode: both;
          }
          
          .slide-in-from-left-4 {
            animation-name: slideInFromLeft;
          }
          
          .slide-in-from-right-4 {
            animation-name: slideInFromRight;
          }
        `
      }} />
    </div>
  );
} 