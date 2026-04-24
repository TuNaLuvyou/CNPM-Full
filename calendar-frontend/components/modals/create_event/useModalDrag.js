import { useState, useRef, useEffect } from 'react';

export function useModalDrag({ isOpen }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startDragPos = useRef({ x: 0, y: 0 });
  const initialOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - startDragPos.current.x;
      const dy = e.clientY - startDragPos.current.y;
      setDragOffset({
        x: initialOffset.current.x + dx,
        y: initialOffset.current.y + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    startDragPos.current = { x: e.clientX, y: e.clientY };
    initialOffset.current = { ...dragOffset };
  };

  return { dragOffset, isDragging, handleHeaderMouseDown };
}
