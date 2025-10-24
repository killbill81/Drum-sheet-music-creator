import React, { useState } from 'react';
import { TextAnnotation } from '../types';

interface DraggableTextProps {
  annotation: TextAnnotation;
  onUpdate: (id: string, x: number, y: number) => void;
  onClick: (id: string) => void;
}

export const DraggableText: React.FC<DraggableTextProps> = ({ annotation, onUpdate, onClick }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const svg = e.currentTarget.ownerSVGElement;
      if (svg) {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        onUpdate(annotation.id, x, y);
      }
    }
  };

  return (
    <text
      x={annotation.x}
      y={annotation.y}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onClick={(e) => {
        e.stopPropagation();
        onClick(annotation.id);
      }}
      className="cursor-move"
      style={{ userSelect: 'none' }}
      dominantBaseline="middle"
      textAnchor="middle"
    >
      {annotation.text}
    </text>
  );
};