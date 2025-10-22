import React, { useState } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { cn } from '../../lib/utils';

interface ResponsiveLayoutProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sidebarWidth?: number;
  headerHeight?: number;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  sidebar,
  header,
  children,
  className,
  sidebarWidth = 250,
  headerHeight = 64
}) => {
  const { isMobile, isTablet, breakpoint } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = (isOpen: boolean) => {
    setSidebarOpen(isOpen);
  };

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Sidebar */}
      {sidebar && (
        <div
          className={cn(
            'fixed top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40',
            isMobile
              ? `left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : 'left-0',
            '[dir="rtl"] &': {
              'right-0 left-auto border-r-0 border-l': true,
              [isMobile ? 'translate-x-full' : '']: !sidebarOpen && isMobile,
            }
          )}
          style={{ width: sidebarWidth }}
        >
          {React.cloneElement(sidebar as React.ReactElement, {
            onToggle: handleSidebarToggle
          })}
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebar && !isMobile && `ml-[${sidebarWidth}px]`,
          '[dir="rtl"] &': sidebar && !isMobile && `mr-[${sidebarWidth}px] ml-0`
        )}
      >
        {/* Header */}
        {header && (
          <header
            className="sticky top-0 bg-white border-b border-gray-200 z-20"
            style={{ height: headerHeight }}
          >
            {header}
          </header>
        )}

        {/* Page Content */}
        <main
          className={cn(
            'p-4',
            header && `min-h-[calc(100vh-${headerHeight}px)]`,
            !header && 'min-h-screen'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 4,
  className
}) => {
  const { breakpoint } = useResponsive();
  
  const getColumns = () => {
    switch (breakpoint) {
      case 'xs':
        return columns.xs || 1;
      case 'sm':
        return columns.sm || 2;
      case 'md':
        return columns.md || 3;
      case 'lg':
        return columns.lg || 4;
      case 'xl':
      case 'xxl':
        return columns.xl || 4;
      default:
        return 2;
    }
  };

  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {children}
    </div>
  );
};

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'full',
  padding = true,
  className
}) => {
  const { breakpoint } = useResponsive();

  const getMaxWidth = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case 'full':
      default:
        return 'max-w-full';
    }
  };

  const getPadding = () => {
    if (!padding) return '';
    
    switch (breakpoint) {
      case 'xs':
        return 'px-2';
      case 'sm':
        return 'px-4';
      case 'md':
      case 'lg':
        return 'px-6';
      case 'xl':
      case 'xxl':
        return 'px-8';
      default:
        return 'px-4';
    }
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        getMaxWidth(),
        getPadding(),
        className
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  title,
  subtitle,
  actions,
  className,
  padding = true
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        isMobile ? 'rounded-md' : 'rounded-lg',
        className
      )}
    >
      {(title || subtitle || actions) && (
        <div
          className={cn(
            'flex items-center justify-between border-b border-gray-200',
            padding && (isMobile ? 'p-4' : 'p-6')
          )}
        >
          <div>
            {title && (
              <h3 className={cn(
                'font-semibold text-gray-900',
                isMobile ? 'text-lg' : 'text-xl'
              )}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className={cn(padding && (isMobile ? 'p-4' : 'p-6'))}>
        {children}
      </div>
    </div>
  );
};

interface ResponsiveTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  className?: string;
  mobileCard?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  data,
  renderRow,
  className,
  mobileCard = true
}) => {
  const { isMobile } = useResponsive();

  if (isMobile && mobileCard) {
    return (
      <div className={cn('space-y-4', className)}>
        {data.map((item, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            {renderRow(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={index}>
              {renderRow(item, index)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface ResponsiveButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  className?: string;
  gap?: number;
}

export const ResponsiveButtonGroup: React.FC<ResponsiveButtonGroupProps> = ({
  children,
  orientation = 'responsive',
  className,
  gap = 2
}) => {
  const { isMobile } = useResponsive();

  const getOrientation = () => {
    if (orientation === 'responsive') {
      return isMobile ? 'vertical' : 'horizontal';
    }
    return orientation;
  };

  const isVertical = getOrientation() === 'vertical';

  return (
    <div
      className={cn(
        'flex',
        isVertical ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
      style={{ gap: `${gap * 0.25}rem` }}
    >
      {children}
    </div>
  );
};