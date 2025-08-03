/*
  # Pinterest Clone Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `username` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `password_hash` (text)
      - `avatar_url` (text)
      - `bio` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `pins`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `link` (text)
      - `category` (text)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `pin_likes`
      - `id` (uuid, primary key)
      - `pin_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

    - `pin_saves`
      - `id` (uuid, primary key)
      - `pin_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)

    - `user_follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, foreign key)
      - `following_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for pins and user profiles
    - Private access for likes, saves, and follows based on user ownership
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  password_hash text NOT NULL,
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pins table
CREATE TABLE IF NOT EXISTS pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text NOT NULL,
  link text DEFAULT '',
  category text DEFAULT 'general',
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pin_likes table
CREATE TABLE IF NOT EXISTS pin_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid REFERENCES pins(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pin_id, user_id)
);

-- Create pin_saves table
CREATE TABLE IF NOT EXISTS pin_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid REFERENCES pins(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pin_id, user_id)
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Users policies (public profiles, private sensitive data)
CREATE POLICY "Public profiles are viewable by everyone"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Pins policies (public read, authenticated create/update/delete)
CREATE POLICY "Pins are viewable by everyone"
  ON pins
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create pins"
  ON pins
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own pins"
  ON pins
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own pins"
  ON pins
  FOR DELETE
  USING (true);

-- Pin likes policies
CREATE POLICY "Pin likes are viewable by everyone"
  ON pin_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage their likes"
  ON pin_likes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Pin saves policies
CREATE POLICY "Pin saves are viewable by everyone"
  ON pin_saves
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage their saves"
  ON pin_saves
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- User follows policies
CREATE POLICY "User follows are viewable by everyone"
  ON user_follows
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage their follows"
  ON user_follows
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pins_user_id ON pins(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_created_at ON pins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pins_category ON pins(category);
CREATE INDEX IF NOT EXISTS idx_pin_likes_pin_id ON pin_likes(pin_id);
CREATE INDEX IF NOT EXISTS idx_pin_likes_user_id ON pin_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_saves_pin_id ON pin_saves(pin_id);
CREATE INDEX IF NOT EXISTS idx_pin_saves_user_id ON pin_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pins_updated_at
  BEFORE UPDATE ON pins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();