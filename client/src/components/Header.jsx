import React from 'react';
import { restaurantInfo } from '../data/menuData';

function Header() {
  return (
    <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Name */}
          <div className="flex items-center space-x-4">
            <span className="text-5xl">{restaurantInfo.logo}</span>
            <div>
              <h1 className="text-3xl font-bold">
                {restaurantInfo.name}
              </h1>
              <p className="text-lg font-urdu opacity-90">
                {restaurantInfo.nameUrdu}
              </p>
              <p className="text-sm opacity-75">
                {restaurantInfo.tagline}
              </p>
            </div>
          </div>
          
          {/* AR Badge */}
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-sm font-semibold">✨ AR Enabled</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;