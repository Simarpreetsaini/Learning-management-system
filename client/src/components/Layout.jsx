import React from 'react';
import UnifiedHeader from './UnifiedHeader';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col">
      <UnifiedHeader />
      
      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto container-padding py-6 sm:py-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700 mt-auto">
        <div className="max-w-7xl mx-auto container-padding py-4">
          <div className="text-center">
            <p className="text-secondary-500 dark:text-secondary-400 text-sm">
              &copy; {new Date().getFullYear()} BRS-LMS Portal. All rights reserved. | Made with ❤️ for education
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
