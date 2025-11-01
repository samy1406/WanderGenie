// src/components/format-bold-text.tsx
import React from 'react';

type FormatBoldTextProps = {
  text: string;
};

export const FormatBoldText = ({ text }: FormatBoldTextProps) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </span>
  );
};
