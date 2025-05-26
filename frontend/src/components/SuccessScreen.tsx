import React from "react";

interface SuccessScreenProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onButtonClick: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ 
  title, 
  subtitle, 
  buttonText, 
  onButtonClick 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F5F8] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow text-center">
        {/* Иконка успеха */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
            <path 
              d="M8 16l6 6 10-10" 
              stroke="#10B981" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
          {title}
        </h2>
        
        <p className="text-gray-600 mb-8">
          {subtitle}
        </p>
        
        <button
          onClick={onButtonClick}
          className="w-full bg-[#5B7FC7] hover:bg-[#4070C4] text-white rounded-full py-3 text-base font-semibold transition"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}; 