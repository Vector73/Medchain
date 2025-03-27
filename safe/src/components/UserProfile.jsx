import React from 'react';
import { useCookies } from 'react-cookie';
import { LogOut } from 'lucide-react';

const UserProfile = () => {
  const [, , removeCookie] = useCookies();

  function logout() {
    // Remove all relevant cookies
    ['temporary', 'name', 'mail', 'index', 'password', 
     'patients', 'doctors', 'insurance', 'type', 'allergies']
    .forEach(cookie => removeCookie(cookie));

    // Redirect to login page
    window.location.href = "/";
  }

  return (
    <div className="absolute right-4 top-16 w-72 bg-white dark:bg-[#42464D] shadow-lg rounded-lg p-4">
      <button 
        onClick={logout} 
        className="w-full flex items-center justify-center space-x-2 
                   bg-red-500 hover:bg-red-600 text-white 
                   py-2 px-4 rounded-md transition-colors duration-300 
                   focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  );
};

export default UserProfile;