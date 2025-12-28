import React from 'react';
import { Megaphone, Bell, Users, Eye, TrendingUp, Plus } from 'lucide-react';
import { Button } from '../ui';

const NoticeHero = ({ 
  user, 
  noticeCount = 0, 
  onCreateNotice,
  isPublic = false 
}) => {
  const stats = [
    {
      icon: Megaphone,
      label: 'Total Notices',
      value: noticeCount,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100 dark:bg-primary-900/20'
    },
    {
      icon: Bell,
      label: 'Active Notices',
      value: noticeCount,
      color: 'text-success-600',
      bgColor: 'bg-success-100 dark:bg-success-900/20'
    },
    {
      icon: Users,
      label: 'Visibility',
      value: isPublic ? 'Public' : 'All Users',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-secondary-900"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-bounce-soft"></div>
      <div className="absolute top-20 right-20 w-16 h-16 bg-white/5 rounded-full animate-pulse-soft"></div>
      <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-bounce-soft" style={{ animationDelay: '1s' }}></div>

      <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Mobile-First Hero Content */}
          <div className="text-center mb-8 sm:mb-12">
            {/* Icon - Mobile Optimized */}
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 sm:mb-6 animate-scale-in">
              <Megaphone className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>

            {/* Title - Mobile Optimized */}
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold font-display text-white mb-3 sm:mb-4 animate-fade-in px-4">
              {isPublic ? 'Public Notices' : 'Noticeboard'}
            </h1>

            {/* Subtitle - Mobile Optimized */}
            <p className="text-sm sm:text-xl lg:text-2xl text-primary-100 max-w-3xl mx-auto leading-relaxed animate-slide-up px-4">
              {isPublic 
                ? 'Stay informed with our latest public announcements and important updates.'
                : 'Stay updated with the latest announcements, events, and important information.'
              }
            </p>

            {/* CTA Button - Mobile Optimized */}
            {!isPublic && (user?.role === 'Teacher' || user?.role === 'Admin') && (
              <div className="mt-6 sm:mt-8 animate-slide-up px-4" style={{ animationDelay: '0.2s' }}>
                <Button
                  onClick={onCreateNotice}
                  size="lg"
                  className="bg-white text-primary-700 hover:bg-primary-50 hover:text-primary-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  <span className="hidden xs:inline">Create New Notice</span>
                  <span className="xs:hidden">Create Notice</span>
                </Button>
              </div>
            )}
          </div>

          {/* Stats - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8 sm:mb-16">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-lg mb-3 sm:mb-4`}>
                    <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </div>
                  <div className="text-primary-100 text-xs sm:text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-xl mb-3 sm:mb-4">
                <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Real-time Updates</h3>
              <p className="text-primary-100 text-xs sm:text-sm leading-relaxed px-2">
                Get instant notifications about important announcements and events.
              </p>
            </div>

            <div className="text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-xl mb-3 sm:mb-4">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Smart Organization</h3>
              <p className="text-primary-100 text-xs sm:text-sm leading-relaxed px-2">
                Easily find relevant notices with organized categories and smart search.
              </p>
            </div>

            <div className="text-center animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-xl mb-3 sm:mb-4">
                <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Document Access</h3>
              <p className="text-primary-100 text-xs sm:text-sm leading-relaxed px-2">
                Access and download important documents attached to notices with ease.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeHero;
