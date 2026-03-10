import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WebAR from '../components/WebAR';
import { menuItems } from '../data/menuData';

function ARView() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  useEffect(() => {
    const foundItem = menuItems.find(i => i.id === parseInt(itemId));
    if (foundItem) {
      setItem(foundItem);
    } else {
      navigate('/menu');
    }
  }, [itemId, navigate]);

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  // Show WebAR camera view directly
  return (
    <WebAR 
      item={item} 
      onClose={() => navigate('/menu')} 
    />
  );
}

export default ARView;

