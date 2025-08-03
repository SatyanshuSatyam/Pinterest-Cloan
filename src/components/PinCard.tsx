import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bookmark, ExternalLink, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Pin {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link?: string;
  likes_count: number;
  saves_count: number;
  users: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

interface PinCardProps {
  pin: Pin;
  onPinUpdate?: (pinId: string, updates: Partial<Pin>) => void;
}

const PinCard: React.FC<PinCardProps> = ({ pin, onPinUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(pin.likes_count);
  const [savesCount, setSavesCount] = useState(pin.saves_count);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please log in to like pins');
      return;
    }

    try {
      const response = await axios.post(`/pins/${pin.id}/like`);
      const newLikedState = response.data.liked;
      
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
      
      if (onPinUpdate) {
        onPinUpdate(pin.id, { 
          likes_count: newLikedState ? likesCount + 1 : likesCount - 1 
        });
      }
    } catch (error) {
      toast.error('Failed to like pin');
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please log in to save pins');
      return;
    }

    try {
      const response = await axios.post(`/pins/${pin.id}/save`);
      const newSavedState = response.data.saved;
      
      setIsSaved(newSavedState);
      setSavesCount(prev => newSavedState ? prev + 1 : prev - 1);
      
      toast.success(newSavedState ? 'Pin saved!' : 'Pin unsaved');
      
      if (onPinUpdate) {
        onPinUpdate(pin.id, { 
          saves_count: newSavedState ? savesCount + 1 : savesCount - 1 
        });
      }
    } catch (error) {
      toast.error('Failed to save pin');
    }
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (pin.link) {
      window.open(pin.link.startsWith('http') ? pin.link : `https://${pin.link}`, '_blank');
    }
  };

  return (
    <div 
      className="relative group cursor-pointer break-inside-avoid mb-4"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <Link to={`/pin/${pin.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg bg-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          {/* Image */}
          <img
            src={pin.image_url}
            alt={pin.title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-auto object-cover transition-transform duration-200 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          
          {/* Loading placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Overlay with actions */}
          {showOverlay && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* Top actions */}
              <div className="flex justify-between items-start">
                <div className="flex space-x-2">
                  {pin.link && (
                    <button
                      onClick={handleExternalLink}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                      title="Visit link"
                    >
                      <ExternalLink size={16} className="text-gray-700" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={handleSave}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    isSaved
                      ? 'bg-black text-white'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>

              {/* Bottom actions */}
              <div className="flex justify-between items-end">
                <div className="flex space-x-2">
                  <button
                    onClick={handleLike}
                    className="flex items-center space-x-1 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                  >
                    <Heart 
                      size={16} 
                      className={isLiked ? 'text-red-500 fill-current' : 'text-gray-700'} 
                    />
                    <span className="text-xs text-gray-700">{likesCount}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all">
                    <Bookmark size={16} className="text-gray-700" />
                    <span className="text-xs text-gray-700">{savesCount}</span>
                  </button>
                </div>

                <button className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all">
                  <MoreHorizontal size={16} className="text-gray-700" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pin info */}
        <div className="pt-2 px-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1">
            {pin.title}
          </h3>
          
          {pin.description && (
            <p className="text-gray-600 text-xs line-clamp-2 mb-2">
              {pin.description}
            </p>
          )}

          {/* User info */}
          <Link 
            to={`/user/${pin.users.id}`}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={pin.users.avatar_url}
              alt={pin.users.username}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-xs text-gray-700 font-medium">
              {pin.users.first_name} {pin.users.last_name}
            </span>
          </Link>
        </div>
      </Link>
    </div>
  );
};

export default PinCard;