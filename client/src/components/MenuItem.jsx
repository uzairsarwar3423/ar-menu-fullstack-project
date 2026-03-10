import React from 'react';

function MenuItem({ item, onClick }) {
  return (
    <div 
      className="card cursor-pointer group"
      onClick={() => onClick(item)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=Food+Image';
          }}
        />
        
        {/* Category Badge */}
        <div className="absolute top-2 right-2 bg-secondary text-white px-3 py-1 rounded-full text-xs font-semibold">
          {item.category}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-xl font-bold text-gray-800 mb-1">
          {item.name}
        </h3>
        
        {/* Urdu Name */}
        <p className="text-md font-urdu text-gray-600 mb-2">
          {item.nameUrdu}
        </p>
        
        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>
        
        {/* Price and Button */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-2xl font-bold text-primary">
            PKR {item.price}
          </span>
          
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all">
            View in AR 📱
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuItem;