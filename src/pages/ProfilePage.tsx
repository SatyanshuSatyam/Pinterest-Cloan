import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Settings, UserPlus, UserMinus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import MasonryGrid from '../components/MasonryGrid';

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  bio?: string;
  pins_count: number;
  followers_count: number;
  following_count: number;
}

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

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [savedPins, setSavedPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    if (id) {
      fetchUserProfile();
      fetchUserPins();
      if (isOwnProfile) {
        fetchSavedPins();
      }
    }
  }, [id, isOwnProfile]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/users/${id}`);
      setProfileUser(response.data);
      setFollowersCount(response.data.followers_count);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('User not found');
    }
  };

  const fetchUserPins = async () => {
    try {
      const response = await axios.get(`/users/${id}/pins`);
      setPins(response.data.pins);
    } catch (error) {
      console.error('Error fetching user pins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPins = async () => {
    if (!isOwnProfile) return;
    
    try {
      const response = await axios.get(`/users/${id}/saved`);
      setSavedPins(response.data.pins);
    } catch (error) {
      console.error('Error fetching saved pins:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Please log in to follow users');
      return;
    }

    try {
      const response = await axios.post(`/users/${id}/follow`);
      const newFollowingState = response.data.following;
      
      setIsFollowing(newFollowingState);
      setFollowersCount(prev => newFollowingState ? prev + 1 : prev - 1);
      
      toast.success(newFollowingState ? 'Following user!' : 'Unfollowed user');
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
        </div>
      </div>
    );
  }

  const displayPins = activeTab === 'created' ? pins : savedPins;

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Header */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Avatar */}
            <img
              src={profileUser.avatar_url}
              alt={profileUser.username}
              className="w-32 h-32 rounded-full object-cover mx-auto mb-6 shadow-lg"
            />

            {/* Name and Username */}
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {profileUser.first_name} {profileUser.last_name}
            </h1>
            <p className="text-gray-600 text-lg mb-4">@{profileUser.username}</p>

            {/* Bio */}
            {profileUser.bio && (
              <p className="text-gray-700 text-center max-w-2xl mx-auto mb-6">
                {profileUser.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{profileUser.pins_count}</p>
                <p className="text-gray-600">Pins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{followersCount}</p>
                <p className="text-gray-600">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{profileUser.following_count}</p>
                <p className="text-gray-600">Following</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              {isOwnProfile ? (
                <button className="flex items-center space-x-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  <Settings size={18} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-full font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
                  <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('created')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'created'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Created ({pins.length})
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'saved'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Saved ({savedPins.length})
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Pins Grid */}
      <div className="py-8">
        {displayPins.length > 0 ? (
          <MasonryGrid pins={displayPins} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📌</span>
            </div>
            <h3 className="text-lg font-medium mb-2">
              {activeTab === 'created' ? 'No pins created yet' : 'No pins saved yet'}
            </h3>
            <p className="text-sm">
              {isOwnProfile && activeTab === 'created' 
                ? 'Create your first pin to get started!'
                : activeTab === 'created'
                ? 'This user hasn\'t created any pins yet'
                : 'Save pins you love to see them here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;