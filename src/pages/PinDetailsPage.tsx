import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Bookmark, Share, ExternalLink, ArrowLeft, MoreHorizontal } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface Pin {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link?: string;
  category: string;
  likes_count: number;
  saves_count: number;
  created_at: string;
  users: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

const PinDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pin, setPin] = useState<Pin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);

  useEffect(() => {
    fetchPin();
  }, [id]);

  const fetchPin = async () => {
    try {
      const response = await axios.get(`/pins/${id}`);
      setPin(response.data);
      setLikesCount(response.data.likes_count);
      setSavesCount(response.data.saves_count);
    } catch (error) {
      console.error('Error fetching pin:', error);
      toast.error('Pin not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please log in to like pins');
      return;
    }

    try {
      const response = await axios.post(`/pins/${id}/like`);
      const newLikedState = response.data.liked;
      
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    } catch (error) {
      toast.error('Failed to like pin');
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please log in to save pins');
      return;
    }

    try {
      const response = await axios.post(`/pins/${id}/save`);
      const newSavedState = response.data.saved;
      
      setIsSaved(newSavedState);
      setSavesCount(prev => newSavedState ? prev + 1 : prev - 1);
      
      toast.success(newSavedState ? 'Pin saved!' : 'Pin unsaved');
    } catch (error) {
      toast.error('Failed to save pin');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pin?.title,
          text: pin?.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleExternalLink = () => {
    if (pin?.link) {
      window.open(pin.link.startsWith('http') ? pin.link : `https://${pin.link}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!pin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pin not found</h2>
          <Link to="/" className="text-red-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-16 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Share size={20} />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image Section */}
            <div className="relative">
              <img
                src={pin.image_url}
                alt={pin.title}
                className="w-full h-full object-cover"
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* Details Section */}
            <div className="p-6 lg:p-8 flex flex-col">
              {/* Actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      isLiked
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart 
                      size={20} 
                      className={isLiked ? 'fill-current' : ''} 
                    />
                    <span>{likesCount}</span>
                  </button>
                  
                  <button
                    onClick={handleSave}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      isSaved
                        ? 'bg-black text-white'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                </div>

                {pin.link && (
                  <button
                    onClick={handleExternalLink}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ExternalLink size={18} />
                    <span className="text-sm">Visit</span>
                  </button>
                )}
              </div>

              {/* Pin Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {pin.title}
                </h1>

                {pin.description && (
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {pin.description}
                  </p>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                  <span className="bg-gray-100 px-2 py-1 rounded-full">
                    {pin.category.charAt(0).toUpperCase() + pin.category.slice(1)}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(pin.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6 mb-8 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Heart size={16} />
                    <span>{likesCount} likes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bookmark size={16} />
                    <span>{savesCount} saves</span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="border-t border-gray-200 pt-6">
                <Link
                  to={`/user/${pin.users.id}`}
                  className="flex items-center space-x-3 hover:bg-gray-50 p-3 rounded-lg transition-colors"
                >
                  <img
                    src={pin.users.avatar_url}
                    alt={pin.users.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {pin.users.first_name} {pin.users.last_name}
                    </p>
                    <p className="text-gray-600 text-sm">@{pin.users.username}</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinDetailsPage;