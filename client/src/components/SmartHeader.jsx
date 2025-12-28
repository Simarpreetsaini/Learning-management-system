import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PublicHeader from './public/PublicHeader';
import UnifiedHeader from './UnifiedHeader';

/**
 * SmartHeader component that automatically chooses the appropriate header
 * based on user authentication status:
 * - Shows PublicHeader for signed-out users
 * - Shows UnifiedHeader for signed-in users
 */
const SmartHeader = () => {
  const { user } = useContext(AuthContext);

  // If user is authenticated, show the unified header
  // If user is not authenticated, show the public header
  return user ? <UnifiedHeader /> : <PublicHeader />;
};

export default SmartHeader;
