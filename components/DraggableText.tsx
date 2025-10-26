import React, { useState } from 'react';
import { TextAnnotation } from '../types';

interface DraggableTextProps {
  annotation: TextAnnotation;
  onUpdate: (id: string, x: number, y: number) => void;
  onUpdateText: (id: string, text: string) => void;
  onClick: (id: string) => void;
  isSelected: boolean;
}

export const DraggableText: React.FC<DraggableTextProps> = ({ annotation, onUpdate, onUpdateText, onClick, isSelected }) => {
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
      onDoubleClick={() => {
        const newText = window.prompt("Enter new text:", annotation.text);
        if (newText) {
          onUpdateText(annotation.id, newText);
        }
      }}
      className="cursor-move"
      style={{
        userSelect: 'none',
        fontSize: annotation.fontSize,
        fontWeight: annotation.fontWeight,
        fontStyle: annotation.fontStyle,
        stroke: isSelected ? 'blue' : 'none',
        strokeWidth: isSelected ? 1 : 0,
      }}
      dominantBaseline="middle"
      textAnchor="middle"
    >
      {annotation.text}
    </text>
  );
};