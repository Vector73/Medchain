import React, { useEffect, useState, useRef } from "react";
import { Menu, LogOut, User, Settings, Stethoscope } from "lucide-react";
import { useCookies } from "react-cookie";
import { useStateContext } from "../contexts/ContextProvider";

const Navbar = () => {
  const { activeMenu, setActiveMenu, setScreenSize, screenSize } = useStateContext();
  const [cookies, , removeCookie] = useCookies();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const userName = cookies.name || "User";
  const userType = cookies.userType ? cookies.userType.toUpperCase() : "USER";

  // Handle logout
  const logout = () => {
    ["temporary", "name", "mail", "index", "password", "patients", "doctors", "insurance", "type", "allergies"]
      .forEach(removeCookie);

    window.location.href = "/";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <nav className="w-full flex sticky top-0 z-10 flex-row-reverse items-center justify-between p-2 bg-white dark:bg-[#33373E] shadow-sm">
      {/* User Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:block text-sm font-medium dark:text-gray-300">
            {userName}
          </span>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#42464D] border dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="py-2">
              {/* User Type Display */}
              <div className="w-full flex items-center px-4 py-2 dark:hover:bg-gray-700 transition-colors">
                {cookies.userType === "doctor" ? (
                  <Stethoscope className="mr-3 w-4 h-4 text-blue-500" />
                ) : (
                  <User className="mr-3 w-4 h-4 text-green-500" />
                )}
                <span className="font-medium">{userType}</span>
              </div>

              {/* Divider */}
              <div className="border-t dark:border-gray-700 my-2"></div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="w-full flex items-center px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="mr-3 w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
