"use client";

import { useState, type FC, type FormEvent } from "react";
import { Lock, LogIn } from "lucide-react";
import { useAuth } from "@renderer/hooks/use-auth";
import { apiService } from "@renderer/services/api";

type LoginType = 'email' | 'phone';

const LoginForm: FC = () => {
  const [loginType, setLoginType] = useState<LoginType>('email');
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const { login } = useAuth();

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value);
    if (error) setError("");
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 11 digits for Chinese phone numbers
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    
    // Format as xxx xxxx xxxx for Chinese numbers
    if (value.length > 7) {
      value = `${value.slice(0, 3)} ${value.slice(3, 7)} ${value.slice(7)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)} ${value.slice(3)}`;
    }
    
    setPhone(value);
    if (error) setError("");
  };

  const handleVerificationCodeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 4) {
      value = value.slice(0, 4); // Limit to 4 digits
    }
    setVerificationCode(value);
    if (error) setError("");
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);
    if (error) setError("");
  };

  const validateEmail = (emailToValidate: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate);
  };

  const validatePhone = (phoneToValidate: string): boolean => {
    // Remove all non-digits for validation
    const digitsOnly = phoneToValidate.replace(/\D/g, '');
    // Check if it's a valid Chinese phone number (11 digits starting with 1)
    return digitsOnly.length === 11 && digitsOnly.startsWith('1');
  };

  const sendVerificationCode = async (): Promise<void> => {
    if (!validatePhone(phone)) {
      setError("请输入正确的手机号");
      return;
    }

    setIsSendingCode(true);
    setError(""); // 清除之前的错误
    
    try {
      // 获取纯数字的手机号
      const phoneNumber = phone.replace(/\D/g, '');
      
      console.log('📱 Calling sendSmsCode API with phoneNumber:', phoneNumber);
      const result = await apiService.sendSmsCode(phoneNumber);
      console.log('📱 sendSmsCode API response:', result);
      
      if (!result.success) {
        console.log('📱 SMS send failed:', result.message);
        setError(result.message || "发送验证码失败，请重试");
        return;
      }
      
      console.log('📱 Verification code sent successfully:', result.data);
      
      // 开始60秒倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Send verification code failed:', error);
      setError(error instanceof Error ? error.message : "发送验证码失败，请重试");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    if (loginType === 'email') {
      // 邮箱登录逻辑
      if (!email.trim() || !password.trim()) {
        setError("请输入邮箱和密码");
        setIsLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        setError("请输入正确的邮箱地址");
        setIsLoading(false);
        return;
      }

      try {
        const success = await login(password);
        if (!success) {
          setError("邮箱或密码错误，请重试");
        }
      } catch (error) {
        console.error("Login error:", error);
        setError("登录失败，请重试");
      } finally {
        setIsLoading(false);
      }
    } else {
      // 手机号验证码登录逻辑
      if (!phone.trim() || !verificationCode.trim()) {
        setError("请输入手机号和验证码");
        setIsLoading(false);
        return;
      }

      if (!validatePhone(phone)) {
        setError("请输入正确的手机号");
        setIsLoading(false);
        return;
      }

      if (verificationCode.length !== 4) {
        setError("请输入4位验证码");
        setIsLoading(false);
        return;
      }

      try {
        // 获取纯数字的手机号
        const phoneNumber = phone.replace(/\D/g, '');
        
        console.log('🔐 Calling loginWithSms API with:', { phoneNumber, verificationCode });
        const result = await apiService.loginWithSms(phoneNumber, verificationCode);
        console.log('🔐 loginWithSms API response:', result);
        
        if (result.success) {
          console.log('🔐 SMS login successful, user data:', result.data);
          
          // 保存token到sessionStorage
          if (result.data?.data?.token) {
            sessionStorage.setItem('mihomo-party-token', result.data.data.token);
            console.log('🔐 Token saved to sessionStorage:', result.data.data.token);
            
            // 获取完整用户信息
            try {
              console.log('🔐 Fetching user profile...');
              const profileResult = await apiService.getUserProfile();
              console.log('🔐 User profile fetched:', profileResult);
              
              if (profileResult.success && profileResult.data) {
                sessionStorage.setItem('mihomo-party-user', JSON.stringify(profileResult.data));
                console.log('🔐 Complete user profile saved to sessionStorage');
              }
            } catch (profileError) {
              console.error('🔐 Failed to fetch user profile:', profileError);
              // 即使获取用户信息失败，也不影响登录
            }
          }
          
          const success = await login("dummy-password"); // 手机号登录不需要密码
          if (!success) {
            setError("登录失败，请重试");
          }
        } else {
          console.log('🔐 SMS login failed:', result.message);
          setError(result.message || "验证码错误，请重试");
        }
      } catch (error) {
        console.error("Login error:", error);
        setError("登录失败，请重试");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center">
            <LogIn className="w-3 h-3 text-white dark:text-black" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Mihomo Party</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          Welcome Back!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Please enter log in details below
        </p>
      </div>

      {/* Login Type Tabs - Modern Tab Style */}
      <div className="mb-6">
        <div className="flex relative">
          {/* Tab背景滑块 */}
          <div 
            className={`absolute top-0 bottom-0 w-1/2 bg-primary/10 rounded-lg transition-transform duration-300 ease-out ${
              loginType === 'phone' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          
          <button
            type="button"
            onClick={() => {
              setLoginType('email');
              setError('');
            }}
            className={`flex-1 relative z-10 py-2 px-4 text-center text-sm font-medium transition-all duration-300 rounded-lg ${
              loginType === 'email'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Email
            {loginType === 'email' && (
              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setLoginType('phone');
              setError('');
            }}
            className={`flex-1 relative z-10 py-2 px-4 text-center text-sm font-medium transition-all duration-300 rounded-lg ${
              loginType === 'phone'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Phone
            {loginType === 'phone' && (
              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Account Input */}
        <div className="relative">
          {loginType === 'email' ? (
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={handleEmailChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 ease-out focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                +86
              </div>
              <input
                type="tel"
                placeholder="手机号"
                value={phone}
                onChange={handlePhoneChange}
                required
                disabled={isLoading}
                className="w-full pl-14 pr-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 ease-out focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}
        </div>

        {/* Password or Verification Code Input */}
        {loginType === 'email' ? (
          <div className="relative">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={handlePasswordChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 ease-out focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 pointer-events-none"
            >
              <Lock className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="4位验证码"
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              required
              disabled={isLoading}
              maxLength={4}
              className="w-full px-4 py-3 pr-24 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 ease-out focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={sendVerificationCode}
              disabled={isSendingCode || countdown > 0 || !validatePhone(phone)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm text-primary hover:text-primary/80 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {countdown > 0 ? `${countdown}s` : isSendingCode ? '发送中...' : '获取验证码'}
            </button>
          </div>
        )}

        {/* Forgot Password - Only for email login */}
        {loginType === 'email' && (
          <div className="text-right">
            <button
              type="button"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              忘记密码？
            </button>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isLoading ? "登录中..." : "登录"}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">还没有账号？ </span>
        <button className="text-sm text-gray-900 dark:text-white font-semibold hover:underline">
          立即注册
        </button>
      </div>
    </div>
  );
};

export default function LoginPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-gray-900 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
      
      {/* Right Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                             linear-gradient(45deg, transparent 30%, rgba(120, 119, 198, 0.1) 50%, transparent 70%)`
          }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center text-white px-12">
          <div className="mb-8">
            {/* 3D Illustration Placeholder */}
            <div className="w-80 h-80 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-3xl transform rotate-6 opacity-80"></div>
              <div className="absolute inset-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-2xl">
                  <LogIn className="w-16 h-16 text-white" />
                </div>
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl transform rotate-12 opacity-80"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-80"></div>
              <div className="absolute top-1/2 -right-8 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 transform rotate-45 opacity-80"></div>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4">
            Manage your Network Anywhere
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-md mx-auto leading-relaxed">
            You can manage your proxy connections on the go with Mihomo Party on the web
          </p>
          
          {/* Pagination Dots */}
          <div className="flex justify-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            <div className="w-3 h-3 rounded-full bg-white/40"></div>
            <div className="w-3 h-3 rounded-full bg-white/40"></div>
          </div>
        </div>
        
        {/* Additional Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-xl"></div>
        <div className="absolute top-1/3 left-10 w-6 h-6 bg-yellow-400/60 transform rotate-45"></div>
        <div className="absolute bottom-1/3 right-16 w-4 h-4 bg-green-400/60 rounded-full"></div>
      </div>
    </div>
  );
} 