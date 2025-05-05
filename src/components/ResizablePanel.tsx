import React, { useCallback, useEffect, useState } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange: (width: number) => void;
  side: 'left' | 'right';
}

export function ResizablePanel({
  children,
  width,
  minWidth = 200,
  maxWidth = 600,
  onWidthChange,
  side
}: ResizablePanelProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setStartX(e.pageX);
    setStartWidth(width);
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const delta = e.pageX - startX;
    const newWidth = side === 'left' ? 
      Math.min(Math.max(startWidth + delta, minWidth), maxWidth) :
      Math.min(Math.max(startWidth - delta, minWidth), maxWidth);

    onWidthChange(newWidth);
  }, [isResizing, startX, startWidth, minWidth, maxWidth, onWidthChange, side]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="relative" style={{ width: `${width}px` }}>
      {children}
      <div
        className={`absolute top-0 ${side === 'left' ? '-right-1' : '-left-1'} h-full w-2 cursor-col-resize group`}
        onMouseDown={handleMouseDown}
      >
        <div className="h-full w-1 bg-transparent group-hover:bg-blue-500 transition-colors" />
      </div>
    </div>
  );
} 