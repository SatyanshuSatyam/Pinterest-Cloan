import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Get all pins with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    const offset = (page - 1) * limit;

    let query = supabase
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Add category filter
    if (category) {
      query = query.eq('category', category);
    }

    const { data: pins, error } = await query;

    if (error) {
      console.error('Get pins error:', error);
      return res.status(500).json({ message: 'Failed to fetch pins' });
    }

    // Transform data to include counts
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
    console.error('Get pins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single pin
router.get('/:id', async (req, res) => {
  try {
    const { data: pin, error } = await supabase
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
      .eq('id', req.params.id)
      .single();

    if (error || !pin) {
      return res.status(404).json({ message: 'Pin not found' });
    }

    const pinWithCounts = {
      ...pin,
      likes_count: pin.pin_likes.length,
      saves_count: pin.pin_saves.length,
      pin_likes: undefined,
      pin_saves: undefined
    };

    res.json(pinWithCounts);
  } catch (error) {
    console.error('Get pin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new pin
router.post('/', authenticateToken, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const { title, description, link, category } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ message: 'Title and image are required' });
    }

    const { data: pin, error } = await supabase
      .from('pins')
      .insert([{
        title,
        description: description || '',
        link: link || '',
        category: category || 'general',
        image_url: req.file.path,
        user_id: req.user.id
      }])
      .select(`
        *,
        users!pins_user_id_fkey (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Create pin error:', error);
      return res.status(500).json({ message: 'Failed to create pin' });
    }

    res.status(201).json({
      message: 'Pin created successfully',
      pin: {
        ...pin,
        likes_count: 0,
        saves_count: 0
      }
    });
  } catch (error) {
    console.error('Create pin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike pin
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const pinId = req.params.id;
    const userId = req.user.id;

    // Check if pin exists
    const { data: pin, error: pinError } = await supabase
      .from('pins')
      .select('id')
      .eq('id', pinId)
      .single();

    if (pinError || !pin) {
      return res.status(404).json({ message: 'Pin not found' });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('pin_likes')
      .select('id')
      .eq('pin_id', pinId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('pin_likes')
        .delete()
        .eq('pin_id', pinId)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ message: 'Failed to unlike pin' });
      }

      res.json({ message: 'Pin unliked', liked: false });
    } else {
      // Like
      const { error } = await supabase
        .from('pin_likes')
        .insert([{ pin_id: pinId, user_id: userId }]);

      if (error) {
        return res.status(500).json({ message: 'Failed to like pin' });
      }

      res.json({ message: 'Pin liked', liked: true });
    }
  } catch (error) {
    console.error('Like pin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/Unsave pin
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    const pinId = req.params.id;
    const userId = req.user.id;

    // Check if pin exists
    const { data: pin, error: pinError } = await supabase
      .from('pins')
      .select('id')
      .eq('id', pinId)
      .single();

    if (pinError || !pin) {
      return res.status(404).json({ message: 'Pin not found' });
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('pin_saves')
      .select('id')
      .eq('pin_id', pinId)
      .eq('user_id', userId)
      .single();

    if (existingSave) {
      // Unsave
      const { error } = await supabase
        .from('pin_saves')
        .delete()
        .eq('pin_id', pinId)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ message: 'Failed to unsave pin' });
      }

      res.json({ message: 'Pin unsaved', saved: false });
    } else {
      // Save
      const { error } = await supabase
        .from('pin_saves')
        .insert([{ pin_id: pinId, user_id: userId }]);

      if (error) {
        return res.status(500).json({ message: 'Failed to save pin' });
      }

      res.json({ message: 'Pin saved', saved: true });
    }
  } catch (error) {
    console.error('Save pin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete pin
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const pinId = req.params.id;
    const userId = req.user.id;

    // Check if pin exists and user owns it
    const { data: pin, error: pinError } = await supabase
      .from('pins')
      .select('id, user_id')
      .eq('id', pinId)
      .single();

    if (pinError || !pin) {
      return res.status(404).json({ message: 'Pin not found' });
    }

    if (pin.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this pin' });
    }

    // Delete pin (cascading deletes will handle likes and saves)
    const { error } = await supabase
      .from('pins')
      .delete()
      .eq('id', pinId);

    if (error) {
      return res.status(500).json({ message: 'Failed to delete pin' });
    }

    res.json({ message: 'Pin deleted successfully' });
  } catch (error) {
    console.error('Delete pin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;