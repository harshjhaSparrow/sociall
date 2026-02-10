import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          className={`
            w-full rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-base text-slate-900 
            placeholder-slate-400 outline-none transition-all duration-200
            focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10
            group-hover:border-slate-200
            disabled:bg-slate-50 disabled:text-slate-500
            ${icon ? 'pl-12' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary-500">
            {icon}
          </div>
        )}
      </div>
      {error && <p className="text-sm font-medium text-red-500 ml-1 animate-slide-up">{error}</p>}
    </div>
  );
};

export default Input;