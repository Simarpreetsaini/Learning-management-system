import React from 'react';
import { Card } from '../ui';

const NoticeSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded-full w-20"></div>
                  <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded-full w-16"></div>
                </div>
                
                {/* Title */}
                <div className="space-y-2">
                  <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
                  <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24"></div>
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20"></div>
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-16"></div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-12"></div>
                <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-14"></div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-full"></div>
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-5/6"></div>
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-4/6"></div>
            </div>

            {/* Tags */}
            <div className="flex gap-2">
              <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded-full w-16"></div>
              <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded-full w-20"></div>
              <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded-full w-14"></div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <div className="flex gap-4">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20"></div>
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24"></div>
              </div>
              <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-24"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const NoticeGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-3">
              {/* Badges */}
              <div className="flex items-center gap-2">
                <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded-full w-16"></div>
                <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded-full w-12"></div>
              </div>
              
              {/* Title */}
              <div className="space-y-2">
                <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-full"></div>
                <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-3">
                <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-20"></div>
                <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-16"></div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-full"></div>
              <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-5/6"></div>
              <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-4/6"></div>
            </div>

            {/* Tags */}
            <div className="flex gap-1">
              <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded-full w-12"></div>
              <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded-full w-16"></div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-secondary-200 dark:border-secondary-700">
              <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-16"></div>
              <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-16"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const NoticeFiltersSkeleton = () => {
  return (
    <Card className="mb-6 animate-pulse">
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex gap-3">
          <div className="flex-1 h-12 bg-secondary-200 dark:bg-secondary-700 rounded-lg"></div>
          <div className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded-lg w-20"></div>
          <div className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded-lg w-20"></div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2">
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded-full w-24"></div>
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded-full w-20"></div>
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded-full w-16"></div>
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded-full w-18"></div>
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded-full w-22"></div>
        </div>
      </div>
    </Card>
  );
};

const NoticeHeroSkeleton = () => {
  return (
    <div className="relative overflow-hidden bg-secondary-200 dark:bg-secondary-800 animate-pulse">
      <div className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-300 dark:bg-secondary-700 rounded-2xl mb-6"></div>

            {/* Title */}
            <div className="space-y-4 mb-4">
              <div className="h-12 bg-secondary-300 dark:bg-secondary-700 rounded w-96 mx-auto"></div>
              <div className="h-12 bg-secondary-300 dark:bg-secondary-700 rounded w-80 mx-auto"></div>
            </div>

            {/* Subtitle */}
            <div className="space-y-2 max-w-3xl mx-auto">
              <div className="h-6 bg-secondary-300 dark:bg-secondary-700 rounded w-full"></div>
              <div className="h-6 bg-secondary-300 dark:bg-secondary-700 rounded w-3/4 mx-auto"></div>
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <div className="h-12 bg-secondary-300 dark:bg-secondary-700 rounded-lg w-48 mx-auto"></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-secondary-300 dark:bg-secondary-700 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-secondary-400 dark:bg-secondary-600 rounded-lg mb-4 mx-auto"></div>
                <div className="h-8 bg-secondary-400 dark:bg-secondary-600 rounded mb-2"></div>
                <div className="h-4 bg-secondary-400 dark:bg-secondary-600 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

NoticeSkeleton.Grid = NoticeGridSkeleton;
NoticeSkeleton.Filters = NoticeFiltersSkeleton;
NoticeSkeleton.Hero = NoticeHeroSkeleton;

export default NoticeSkeleton;
