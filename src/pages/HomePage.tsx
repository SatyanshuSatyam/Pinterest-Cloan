import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';
import MasonryGrid from '../components/MasonryGrid';
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

const HomePage: React.FC = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const fetchPins = async (pageNum: number, reset: boolean = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await axios.get(`/pins?${params.toString()}`);
      const newPins = response.data.pins;

      if (reset) {
        setPins(newPins);
      } else {
        setPins(prev => [...prev, ...newPins]);
      }

      setHasMore(response.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching pins:', error);
      toast.error('Failed to load pins');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and search changes
  useEffect(() => {
    setLoading(true);
    setPins([]);
    setPage(1);
    fetchPins(1, true);
  }, [searchQuery]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPins(page + 1);
    }
  };

  const handlePinUpdate = (pinId: string, updates: Partial<Pin>) => {
    setPins(prev => prev.map(pin => 
      pin.id === pinId ? { ...pin, ...updates } : pin
    ));
  };

  if (loading && pins.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading beautiful pins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      {searchQuery && (
        <div className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Search results for "{searchQuery}"
            </h1>
            <p className="text-gray-600 mt-1">
              {pins.length} {pins.length === 1 ? 'pin' : 'pins'} found
            </p>
          </div>
        </div>
      )}

      {/* Pins Grid with Infinite Scroll */}
      <InfiniteScroll
        dataLength={pins.length}
        next={loadMore}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        }
        endMessage={
          pins.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>You've seen all the pins!</p>
            </div>
          )
        }
      >
        <MasonryGrid pins={pins} onPinUpdate={handlePinUpdate} />
      </InfiniteScroll>

      {/* Empty state for no search results */}
      {!loading && pins.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium mb-2">No pins found</h3>
          <p className="text-sm">Try searching for something else</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;