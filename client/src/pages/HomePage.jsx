import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SmartHeader from '../components/SmartHeader';
import FeaturedNotices from '../components/public/FeaturedNotices';
import { Button, Card } from '../components/ui';

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const academicFeatures = [
    {
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
        </div>
      ),
      title: "Academic Management",
      description: "Comprehensive academic record management, grade tracking, and performance analytics for students and faculty.",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      ),
      title: "Assignment Portal",
      description: "Digital assignment submission, automated grading, and feedback system for streamlined academic workflow.",
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="relative bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
      ),
      title: "Online Assessments",
      description: "Secure online testing platform with real-time monitoring, automated evaluation, and detailed analytics.",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      ),
      title: "Attendance Tracking",
      description: "Digital attendance management with real-time tracking, analytics, and automated reporting for administrators.",
      gradient: "from-orange-500 to-orange-600"
    },
    {
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="relative bg-gradient-to-r from-teal-500 to-teal-600 p-3 rounded-xl">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
      ),
      title: "Digital Library",
      description: "Extensive collection of academic resources, e-books, research papers, and study materials accessible 24/7.",
      gradient: "from-teal-500 to-teal-600"
    },
    {
      icon: (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-pink-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="relative bg-gradient-to-r from-pink-500 to-pink-600 p-3 rounded-xl">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </div>
      ),
      title: "Communication Hub",
      description: "Centralized communication platform for announcements, notifications, and institutional updates.",
      gradient: "from-pink-500 to-pink-600"
    }
  ];

  const quickAccess = [
    {
      title: "Student Portal",
      description: "Access assignments, grades, attendance, and academic resources",
      icon: "🎓",
      link: "/login",
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "from-blue-600 to-blue-700"
    },
    {
      title: "Faculty Portal",
      description: "Manage courses, assignments, grades, and student interactions",
      icon: "👨‍🏫",
      link: "/login",
      gradient: "from-emerald-500 to-emerald-600",
      hoverGradient: "from-emerald-600 to-emerald-700"
    },
    {
      title: "Academic Resources",
      description: "Browse study materials, previous papers, and digital library",
      icon: "📚",
      link: "/public-pyqs",
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "from-purple-600 to-purple-700"
    },
    {
      title: "Institutional Notices",
      description: "Stay updated with official announcements and important notices",
      icon: "📢",
      link: "/noticeboard",
      gradient: "from-orange-500 to-orange-600",
      hoverGradient: "from-orange-600 to-orange-700"
    }
  ];

  const stats = [
    { label: "Active Students", value: "2,500+", icon: "👥" },
    { label: "Faculty Members", value: "150+", icon: "👨‍🏫" },
    { label: "Courses Offered", value: "45+", icon: "📚" },
    { label: "Academic Resources", value: "5,000+", icon: "📖" }
  ];

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <SmartHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse-soft"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
          <div className="relative max-w-7xl mx-auto container-padding py-20 sm:py-24 lg:py-32">
            <div className="text-center text-white">
              {/* Floating Icon */}
              <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Main Heading */}
              <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display mb-6 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
                  College Learning
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-200 via-pink-200 to-white bg-clip-text text-transparent">
                  Management System
                </span>
              </h1>

              {/* Subtitle */}
              <p className={`text-lg sm:text-xl md:text-2xl text-blue-100 mb-10 max-w-4xl mx-auto leading-relaxed transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                Empowering academic excellence through integrated digital learning solutions. 
                <br className="hidden sm:block" />
                Streamlined education management for students, faculty, and administrators.
              </p>

              {/* CTA Buttons */}
              <div className={`flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold px-8 py-4 text-lg" 
                  asChild
                >
                  <Link to="/login" className="flex items-center gap-2">
                    <span>Access Portal</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 text-lg hover:border-white/50 transition-all duration-300"
                  asChild
                >
                  <Link to="/noticeboard" className="flex items-center gap-2">
                    <span>View Announcements</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-secondary-800 dark:via-secondary-800 dark:to-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary-900 dark:text-white mb-4">
              Our Academic Community
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Building excellence through collaborative learning and innovation across our vibrant educational ecosystem
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group text-center animate-fade-in transform hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative">
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Card Content */}
                  <div className="relative bg-white/80 dark:bg-secondary-800/80 backdrop-blur-sm rounded-2xl p-6 border border-secondary-200/50 dark:border-secondary-700/50 shadow-soft hover:shadow-medium transition-all duration-300">
                    <div className="text-4xl mb-3">{stat.icon}</div>
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm md:text-base text-secondary-600 dark:text-secondary-400 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="section-padding bg-gradient-to-br from-secondary-50 via-blue-50/20 to-purple-50/20 dark:from-secondary-900 dark:via-secondary-900 dark:to-secondary-800">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary-900 dark:text-white mb-4">
              Quick Access Portals
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Choose your role to access personalized academic tools and resources tailored to your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickAccess.map((portal, index) => (
              <div 
                key={index} 
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link to={portal.link} className="block">
                  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-secondary-800 shadow-soft hover:shadow-large transition-all duration-500 transform hover:-translate-y-2 border border-secondary-200/50 dark:border-secondary-700/50">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${portal.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                    
                    {/* Content */}
                    <div className="relative p-8 text-center">
                      {/* Icon Container */}
                      <div className="relative mb-6">
                        <div className={`absolute inset-0 bg-gradient-to-r ${portal.gradient} rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
                        <div className={`relative w-20 h-20 bg-gradient-to-br ${portal.gradient} rounded-2xl flex items-center justify-center text-white text-3xl mx-auto shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300`}>
                          {portal.icon}
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                        {portal.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed mb-4">
                        {portal.description}
                      </p>
                      
                      {/* Arrow Icon */}
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900 transition-colors duration-300">
                          <svg className="w-4 h-4 text-secondary-600 dark:text-secondary-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transform group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notices Section */}
      <section className="section-padding bg-white dark:bg-secondary-800">
        <div className="max-w-7xl mx-auto container-padding">
          <FeaturedNotices />
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-gradient-to-br from-secondary-50 via-blue-50/20 to-purple-50/20 dark:from-secondary-900 dark:via-secondary-900 dark:to-secondary-800">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary-900 dark:text-white mb-4">
              Comprehensive Academic Solutions
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Our integrated platform provides all the tools needed for modern educational excellence, 
              from classroom management to academic analytics and beyond.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {academicFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-full bg-white dark:bg-secondary-800 rounded-2xl shadow-soft hover:shadow-large transition-all duration-500 transform hover:-translate-y-2 border border-secondary-200/50 dark:border-secondary-700/50 overflow-hidden">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  {/* Content */}
                  <div className="relative p-8 text-center h-full flex flex-col">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className="relative inline-flex">
                        {feature.icon}
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed flex-grow text-sm">
                      {feature.description}
                    </p>
                    
                    {/* Bottom Accent */}
                    <div className={`mt-6 h-1 bg-gradient-to-r ${feature.gradient} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-white/10 to-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/10 to-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-700 to-blue-800 section-padding">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10"></div>
          <div className="relative max-w-4xl mx-auto container-padding text-center">
            {/* Icon */}
            <div className="mb-8">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-white mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                Ready to Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-200 via-pink-200 to-white bg-clip-text text-transparent">
                Academic Experience?
              </span>
            </h2>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join our digital learning ecosystem and experience the future of education management. 
              Start your journey towards academic excellence today.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold px-8 py-4 text-lg" 
                asChild
              >
                <Link to="/login" className="flex items-center gap-2">
                  <span>Login to Portal</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 text-lg hover:border-white/50 transition-all duration-300"
                asChild
              >
                <Link to="/public-pyqs" className="flex items-center gap-2">
                  <span>Explore Resources</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 dark:bg-black text-white">
        <div className="max-w-7xl mx-auto container-padding py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Academic Portal</h3>
              <p className="text-secondary-300 leading-relaxed">
                Empowering education through innovative technology solutions and comprehensive learning management.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-secondary-300">
                <li><Link to="/login" className="hover:text-white transition-colors">Student Login</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Faculty Login</Link></li>
                <li><Link to="/noticeboard" className="hover:text-white transition-colors">Announcements</Link></li>
                <li><Link to="/public-pyqs" className="hover:text-white transition-colors">Academic Resources</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-secondary-300">
                <li>Technical Support</li>
                <li>Academic Help Desk</li>
                <li>System Status</li>
                <li>User Guidelines</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-700 pt-8">
            <div className="text-center">
              <p className="text-secondary-400 text-sm">
                &copy; {new Date().getFullYear()} College Learning Management System. All rights reserved. | Designed for Academic Excellence
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
