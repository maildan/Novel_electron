'use client';

import React from 'react';

/**
 * 섹션 그리드 컴포넌트
 * 다양한 기능별 섹션들을 그리드로 표시
 */

export interface SectionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface SectionGridProps {
  sections: SectionItem[];
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

export function SectionGrid({ sections, onSectionClick, className = '' }: SectionGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionClick?.(section.id)}
          className="
            bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm 
            border border-gray-200 dark:border-gray-700
            hover:shadow-md hover:scale-105 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            text-left group
          "
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className={`p-3 rounded-lg ${section.color} text-white group-hover:scale-110 transition-transform duration-200`}>
              {section.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {section.label}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {section.description}
          </p>
        </button>
      ))}
    </div>
  );
}
