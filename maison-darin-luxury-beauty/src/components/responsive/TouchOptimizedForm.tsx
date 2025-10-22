import React, { forwardRef } from 'react';
import { useResponsive, useTouch } from '../../hooks/useResponsive';
import { cn } from '../../lib/utils';

interface TouchOptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  touchOptimized?: boolean;
}

export const TouchOptimizedInput = forwardRef<HTMLInputElement, TouchOptimizedInputProps>(
  ({ label, error, hint, icon, touchOptimized = true, className, ...props }, ref) => {
    const { isMobile } = useResponsive();
    const isTouch = useTouch();
    
    const shouldOptimize = touchOptimized && (isMobile || isTouch);

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              'w-full border border-gray-300 rounded-md shadow-sm',
              'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'transition-colors duration-200',
              shouldOptimize && [
                'min-h-[44px]', // Touch-friendly height
                'text-base', // Prevents zoom on iOS
                'px-4 py-3' // Larger padding for touch
              ],
              !shouldOptimize && 'px-3 py-2 text-sm',
              icon && 'pr-10',
              error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
              className
            )}
            {...props}
          />
        </div>
        
        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

TouchOptimizedInput.displayName = 'TouchOptimizedInput';

interface TouchOptimizedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  touchOptimized?: boolean;
}

export const TouchOptimizedSelect = forwardRef<HTMLSelectElement, TouchOptimizedSelectProps>(
  ({ label, error, hint, options, touchOptimized = true, className, ...props }, ref) => {
    const { isMobile } = useResponsive();
    const isTouch = useTouch();
    
    const shouldOptimize = touchOptimized && (isMobile || isTouch);

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          className={cn(
            'w-full border border-gray-300 rounded-md shadow-sm',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'transition-colors duration-200 bg-white',
            shouldOptimize && [
              'min-h-[44px]', // Touch-friendly height
              'text-base', // Prevents zoom on iOS
              'px-4 py-3' // Larger padding for touch
            ],
            !shouldOptimize && 'px-3 py-2 text-sm',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

TouchOptimizedSelect.displayName = 'TouchOptimizedSelect';

interface TouchOptimizedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  touchOptimized?: boolean;
}

export const TouchOptimizedTextarea = forwardRef<HTMLTextAreaElement, TouchOptimizedTextareaProps>(
  ({ label, error, hint, touchOptimized = true, className, ...props }, ref) => {
    const { isMobile } = useResponsive();
    const isTouch = useTouch();
    
    const shouldOptimize = touchOptimized && (isMobile || isTouch);

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={cn(
            'w-full border border-gray-300 rounded-md shadow-sm',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'transition-colors duration-200 resize-vertical',
            shouldOptimize && [
              'min-h-[88px]', // Touch-friendly height (2x input height)
              'text-base', // Prevents zoom on iOS
              'px-4 py-3' // Larger padding for touch
            ],
            !shouldOptimize && 'px-3 py-2 text-sm min-h-[80px]',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        
        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

TouchOptimizedTextarea.displayName = 'TouchOptimizedTextarea';

interface TouchOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  touchOptimized?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const TouchOptimizedButton = forwardRef<HTMLButtonElement, TouchOptimizedButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    touchOptimized = true, 
    loading = false,
    icon,
    children,
    className,
    disabled,
    ...props 
  }, ref) => {
    const { isMobile } = useResponsive();
    const isTouch = useTouch();
    
    const shouldOptimize = touchOptimized && (isMobile || isTouch);

    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
        case 'secondary':
          return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500';
        case 'outline':
          return 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500';
        case 'ghost':
          return 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500';
        case 'danger':
          return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
        default:
          return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
      }
    };

    const getSizeClasses = () => {
      if (shouldOptimize) {
        switch (size) {
          case 'sm':
            return 'min-h-[40px] px-4 py-2 text-sm';
          case 'md':
            return 'min-h-[44px] px-6 py-3 text-base';
          case 'lg':
            return 'min-h-[48px] px-8 py-4 text-lg';
          default:
            return 'min-h-[44px] px-6 py-3 text-base';
        }
      } else {
        switch (size) {
          case 'sm':
            return 'px-3 py-1.5 text-sm';
          case 'md':
            return 'px-4 py-2 text-sm';
          case 'lg':
            return 'px-6 py-3 text-base';
          default:
            return 'px-4 py-2 text-sm';
        }
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          getVariantClasses(),
          getSizeClasses(),
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !loading && icon}
        {children}
      </button>
    );
  }
);

TouchOptimizedButton.displayName = 'TouchOptimizedButton';

interface TouchOptimizedCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  touchOptimized?: boolean;
}

export const TouchOptimizedCheckbox = forwardRef<HTMLInputElement, TouchOptimizedCheckboxProps>(
  ({ label, description, touchOptimized = true, className, ...props }, ref) => {
    const { isMobile } = useResponsive();
    const isTouch = useTouch();
    
    const shouldOptimize = touchOptimized && (isMobile || isTouch);

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'border border-gray-300 rounded text-blue-600',
            'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            shouldOptimize && 'w-5 h-5 mt-0.5',
            !shouldOptimize && 'w-4 h-4 mt-1',
            className
          )}
          {...props}
        />
        
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label className={cn(
                'block font-medium text-gray-900 cursor-pointer',
                shouldOptimize ? 'text-base' : 'text-sm'
              )}>
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

TouchOptimizedCheckbox.displayName = 'TouchOptimizedCheckbox';

interface TouchOptimizedFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  layout?: 'vertical' | 'horizontal' | 'responsive';
}

export const TouchOptimizedForm: React.FC<TouchOptimizedFormProps> = ({
  children,
  onSubmit,
  className,
  layout = 'responsive'
}) => {
  const { isMobile } = useResponsive();
  
  const getLayout = () => {
    if (layout === 'responsive') {
      return isMobile ? 'vertical' : 'horizontal';
    }
    return layout;
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'space-y-6',
        getLayout() === 'horizontal' && 'space-y-4',
        className
      )}
    >
      {children}
    </form>
  );
};