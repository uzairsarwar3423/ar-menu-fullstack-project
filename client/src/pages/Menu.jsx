import React from 'react';
import Header from '../components/Header';
import MenuGrid from '../components/MenuGrid';
import { menuItems } from '../data/menuData';

function Menu() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Our Menu
          </h2>
          <p className="text-gray-600">
            Select any item to view in Augmented Reality
          </p>
        </div>
      </div>

      {/* Menu Grid */}
      <MenuGrid items={menuItems} />

      {/* Footer */}
      <footer className="bg-dark text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 AR Menu Portfolio | Built with React & Three.js
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Menu;