import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';
import { cn } from '../../lib/utils';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
  className?: string;
  width?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  children,
  className,
  width = 250,
  collapsible = true,
  defaultCollapsed = false,
  onToggle
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Auto-collapse on mobile/tablet
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
      setIsCollapsed(true);
    } else if (isTablet) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(defaultCollapsed);
    }
  }, [isMobile, isTablet, defaultCollapsed]);

  const toggleSidebar = () => {
    if (isMobile) {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      onToggle?.(newIsOpen);
    } else {
      const newIsCollapsed = !isCollapsed;
      setIsCollapsed(newIsCollapsed);
      onToggle?.(!newIsCollapsed);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
      onToggle?.(false);
    }
  };

  const sidebarWidth = isCollapsed && !isMobile ? 60 : width;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50',
          'flex flex-col',
          isMobile
            ? `left-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `left-0 ${isCollapsed ? 'w-16' : `w-[${width}px]`}`,
          '[dir="rtl"] &': {
            'right-0 left-auto border-r-0 border-l': true,
            [isMobile ? 'translate-x-full' : '']: !isOpen && isMobile,
            [isMobile ? 'translate-x-0' : '']: isOpen && isMobile,
          },
          className
        )}
        style={{ width: isMobile ? width : sidebarWidth }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed || isMobile ? (
            <h2 className="text-lg font-semibold text-gray-900">
              لوحة التحكم
            </h2>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">م</span>
            </div>
          )}
          
          {/* Toggle Button */}
          {collapsible && (
            <button
              onClick={toggleSidebar}
              className={cn(
                'p-2 rounded-lg hover:bg-gray-100 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              aria-label={isMobile ? 'إغلاق القائمة' : isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
            >
              {isMobile ? (
                <X className="w-5 h-5" />
              ) : isCollapsed ? (
                <ChevronRight className="w-5 h-5 [dir='rtl'] &:rotate-180" />
              ) : (
                <ChevronLeft className="w-5 h-5 [dir='rtl'] &:rotate-180" />
              )}
            </button>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className={cn(
            'fixed top-4 left-4 z-30 p-3 bg-white rounded-lg shadow-lg',
            'border border-gray-200 hover:bg-gray-50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            '[dir="rtl"] &': 'right-4 left-auto'
          )}
          aria-label="فتح القائمة"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  badge?: string | number;
  collapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  active = false,
  onClick,
  className,
  badge,
  collapsed = false
}) => {
  const { isMobile } = useResponsive();
  const showLabel = !collapsed || isMobile;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-right transition-colors',
        'hover:bg-gray-100 focus:outline-none focus:bg-gray-100',
        active && 'bg-blue-50 text-blue-600 border-r-2 border-blue-600',
        '[dir="rtl"] &': active && 'border-r-0 border-l-2',
        !showLabel && 'justify-center px-2',
        className
      )}
      title={!showLabel ? label : undefined}
    >
      {icon && (
        <span className={cn('flex-shrink-0', active && 'text-blue-600')}>
          {icon}
        </span>
      )}
      
      {showLabel && (
        <>
          <span className="flex-1 text-sm font-medium">{label}</span>
          {badge && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
              {badge}
            </span>
          )}
        </>
      )}
      
      {!showLabel && badge && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {typeof badge === 'number' && badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
};

interface SidebarGroupProps {
  title?: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  title,
  children,
  collapsed = false
}) => {
  const { isMobile } = useResponsive();
  const showTitle = title && (!collapsed || isMobile);

  return (
    <div className="py-2">
      {showTitle && (
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};