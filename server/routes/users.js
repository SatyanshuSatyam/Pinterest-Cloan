import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, avatar_url, bio, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's pins count
    const { count: pinsCount } = await supabase
      .from('pins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get user's followers count
    const { count: followersCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    // Get user's following count
    const { count: followingCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    res.json({
      ...user,
      pins_count: pinsCount || 0,
      followers_count: followersCount || 0,
      following_count: followingCount || 0
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's pins
router.get('/:id/pins', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: pins, error } = await supabase
      .from('pins')
      .select(`
        *,
        users!pins_user_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        ),
        pin_likes!left (
          user_id
        ),
        pin_saves!left (
          user_id
        )
      `)
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch user pins' });
    }

    const pinsWithCounts = pins.map(pin => ({
      ...pin,
      likes_count: pin.pin_likes.length,
      saves_count: pin.pin_saves.length,
      pin_likes: undefined,
      pin_saves: undefined
    }));

    res.json({
      pins: pinsWithCounts,
      page,
      hasMore: pins.length === limit
    });
  } catch (error) {
    console.error('Get user pins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's saved pins
router.get('/:id/saved', authenticateToken, async (req, res) => {
  try {
    // Only allow users to see their own saved pins
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: savedPins, error } = await supabase
      .from('pin_saves')
      .select(`
        pins!pin_saves_pin_id_fkey (
          *,
          users!pins_user_id_fkey (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          ),
          pin_likes!left (
            user_id
          ),
          pin_saves!left (
            user_id
          )
        )
      `)
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch saved pins' });
    }

    const pins = savedPins.map(save => ({
      ...save.pins,
      likes_count: save.pins.pin_likes.length,
      saves_count: save.pins.pin_saves.length,
      pin_likes: undefined,
      pin_saves: undefined
    }));

    res.json({
      pins,
      page,
      hasMore: savedPins.length === limit
    });
  } catch (error) {
    console.error('Get saved pins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow/Unfollow user
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) {
        return res.status(500).json({ message: 'Failed to unfollow user' });
      }

      res.json({ message: 'User unfollowed', following: false });
    } else {
      // Follow
      const { error } = await supabase
        .from('user_follows')
        .insert([{ follower_id: currentUserId, following_id: targetUserId }]);

      if (error) {
        return res.status(500).json({ message: 'Failed to follow user' });
      }

      res.json({ message: 'User followed', following: true });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;