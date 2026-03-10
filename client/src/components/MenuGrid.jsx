import React, { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuItem from './MenuItem';

// Memoized MenuItem component wrapper
const MenuItemMemo = memo(MenuItem);

function MenuGrid({ items }) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Memoized categories calculation
  const categories = useMemo(() => 
    ['All', ...new Set(items.map(item => item.category))], 
    [items]
  );

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.nameUrdu.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleItemClick = (item) => {
    navigate(`/ar/${item.id}`);
  };

  // Memoized category button click handler
  const handleCategoryClick = useMemo(() => 
    (category) => () => setSelectedCategory(category), 
    []
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search menu items... (e.g., Biryani)"
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={handleCategoryClick(category)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Items Count */}
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Showing <span className="font-bold text-primary">{filteredItems.length}</span> items
        </p>
      </div>

      {/* Menu Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <MenuItemMemo 
              key={item.id} 
              item={item}
              onClick={handleItemClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items found</p>
        </div>
      )}
    </div>
  );
}

export default MenuGrid;

