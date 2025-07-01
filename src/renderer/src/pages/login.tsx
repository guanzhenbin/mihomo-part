"use client";

import { useState, useEffect, useRef, type FC, type FormEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@renderer/hooks/use-auth";
import { LogIn, X, AlertCircle, Shield, Zap, Globe, Users } from "lucide-react";

// Toast notification component
const Toast: FC<{ message: string; onClose: () => void }> = ({ message, onClose }): JSX.Element => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/50 rounded-2xl p-4 shadow-2xl max-w-sm">
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

// Feature showcase cards for the left side
const FeatureShowcase: FC = (): JSX.Element => {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      title: "高速网络加速",
      subtitle: "智能路由优化",
      description: "采用先进的网络加速技术，自动优化路由路径，显著降低网络延迟，提升连接稳定性。",
      icon: <Zap className="w-8 h-8 text-blue-400" />,
      gradient: "from-blue-500 to-purple-600",
      stats: { value: "99.9%", label: "可用性" }
    },
    {
      title: "全球节点覆盖", 
      subtitle: "遍布全球的服务器",
      description: "拥有分布在50+国家和地区的高速服务器节点，为用户提供就近接入服务。",
      icon: <Globe className="w-8 h-8 text-green-400" />,
      gradient: "from-green-500 to-teal-600",
      stats: { value: "50+", label: "国家地区" }
    },
    {
      title: "企业级安全",
      subtitle: "军用级加密保护",
      description: "采用AES-256加密算法，配合完善的安全审计机制，全方位保护用户数据安全。",
      icon: <Shield className="w-8 h-8 text-purple-400" />,
      gradient: "from-purple-500 to-pink-600",
      stats: { value: "256位", label: "加密强度" }
    },
    {
      title: "多设备管理",
      subtitle: "统一账户管理",
      description: "支持多设备同时在线，配置云端同步，一个账户管理所有设备的网络连接。",
      icon: <Users className="w-8 h-8 text-orange-400" />,
      gradient: "from-orange-500 to-red-600",
      stats: { value: "10台", label: "设备支持" }
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="h-full relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-bl from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center p-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            一键连加速器
          </h1>
          <p className="text-xl text-gray-600">
            企业级网络加速解决方案
          </p>
        </div>
        
        {/* Feature card */}
        <div className="enterprise-feature-card">
          <div className="flex items-center justify-between mb-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${features[currentFeature].gradient} flex items-center justify-center shadow-lg`}>
              {features[currentFeature].icon}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">{features[currentFeature].stats.value}</div>
              <div className="text-sm text-gray-500">{features[currentFeature].stats.label}</div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {features[currentFeature].title}
          </h3>
          <h4 className="text-lg font-medium text-gray-600 mb-4">
            {features[currentFeature].subtitle}
          </h4>
          <p className="text-gray-600 leading-relaxed">
            {features[currentFeature].description}
          </p>
        </div>
        
        {/* Feature indicators */}
        <div className="flex gap-3 mt-8">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFeature(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentFeature 
                  ? 'w-8 bg-blue-500' 
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Login Form Component
const LoginForm: FC = (): JSX.Element => {
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
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const showError = (message: string): void => {
    setError(message)
    setShowToast(true)
  }

  const validatePhone = (phoneToValidate: string): boolean => {
    return /^1[3-9]\d{9}$/.test(phoneToValidate);
  };

  const handleSendCode = async (): Promise<void> => {
    if (!validatePhone(phone)) {
      showError("请输入正确的手机号码");
      return;
    }
    setLoading(true);
    setError("");
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    try {
      const result = await sendSmsCode(phone);
      if (result.success) {
        setCodeSent(true);
        setCountdown(60);
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

  const handlePhoneLogin = async (e: FormEvent): Promise<void> => {
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
      if (verificationCode.length > 3) {
        const success = await login(phone, verificationCode);
        if (success) {
          navigate("/accelerator");
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
    <div className="h-full flex flex-col justify-center px-12 py-8 bg-white">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="enterprise-logo-container mb-8">
          <LogIn className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">欢迎回来</h2>
        <p className="text-gray-500">请登录您的账户以继续</p>
      </div>
      {/* Login Form Card */}
      <div className="enterprise-login-card">
        <form onSubmit={handlePhoneLogin} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label className="enterprise-label">手机号码</label>
              <input
                type="tel"
                placeholder="请输入手机号码"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setError('')
                  setShowToast(false)
                }}
                className="enterprise-input"
                required
              />
            </div>
            <div>
              <label className="enterprise-label">验证码</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="请输入验证码"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value)
                    setError('')
                    setShowToast(false)
                  }}
                  className="enterprise-input flex-1"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || !phone || loading}
                  className="enterprise-code-button"
                >
                  {loading && !codeSent ? (
                    <div className="flex items-center justify-center">
                      <div className="enterprise-spinner-small"></div>
                    </div>
                  ) : countdown > 0 ? (
                    `${countdown}s`
                  ) : (
                    '发送验证码'
                  )}
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="enterprise-login-button"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="enterprise-spinner"></div>
                <span>验证中...</span>
              </div>
            ) : (
              '登录'
            )}
          </button>
        </form>
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
    </div>
  );
};

// Main Page Component  
export default function LoginPage(): JSX.Element {
  return (
    <div className="enterprise-login-container">
      {/* Draggable area for window */}
      <div className="fixed top-0 left-0 right-0 h-8 z-50" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}></div>
      
      {/* Main layout */}
      <div className="enterprise-login-layout">
        {/* Left side - Feature showcase */}
        <div className="enterprise-showcase-container">
          <FeatureShowcase />
        </div>
        
        {/* Right side - Login Form */}
        <div className="enterprise-form-container">
          <LoginForm />
        </div>
      </div>
    </div>
  );
} 