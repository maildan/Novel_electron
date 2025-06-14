'use client';

import React from 'react';

/**
 * 통계 카드 그리드 컴포넌트
 * 실시간 통계 데이터 표시
 */

export interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

interface StatsCardsProps {
  cards: StatCard[];
  className?: string;
}

export function StatsCards({ cards, className = '' }: StatsCardsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {cards.map((card, index) => (
        <div
          key={index}
          className="
            bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm 
            border border-gray-200 dark:border-gray-700 
            hover:shadow-md hover:scale-105 transition-all duration-200
          "
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {card.icon}
            </div>
            <span className={`text-sm font-medium ${
              card.trend === 'up' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {card.change}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {card.title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
