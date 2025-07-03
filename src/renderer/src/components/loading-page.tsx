import { LogIn } from "lucide-react";

export default function LoadingPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center">
              <LogIn className="w-6 h-6 text-white dark:text-black" />
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-primary border-r-primary/30 rounded-full animate-spin"></div>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Mihomo Party</span>
        </div>
        
        {/* Loading Animation */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="text-gray-600 dark:text-gray-300">
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">正在加载应用...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">请稍候</p>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-8 w-64 mx-auto">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/70 h-full rounded-full animate-pulse shadow-sm" style={{ width: '60%' }}></div>
          </div>
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            初始化中...
          </div>
        </div>
      </div>
    </div>
  );
}