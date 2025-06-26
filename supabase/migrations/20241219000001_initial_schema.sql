-- MANGAKA AI - Initial Database Schema
-- Created: 2024-12-19
-- Description: Core tables for manga creation platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE image_type AS ENUM ('character', 'background', 'scene');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro');

-- User Credits Table
-- Tracks user credits for AI image generation
CREATE TABLE user_credits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_remaining INTEGER NOT NULL DEFAULT 5,
    credits_total INTEGER NOT NULL DEFAULT 5,
    last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_tier subscription_tier DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Images Table
-- Stores all AI-generated images with metadata
CREATE TABLE generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_prompt TEXT NOT NULL,
    optimized_prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_type image_type NOT NULL,
    credits_used INTEGER DEFAULT 1,
    generation_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Manga Projects Table
-- User's manga projects and pages
CREATE TABLE manga_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    pages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX idx_generated_images_type ON generated_images(image_type);
CREATE INDEX idx_manga_projects_user_id ON manga_projects(user_id);
CREATE INDEX idx_manga_projects_updated_at ON manga_projects(updated_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga_projects ENABLE ROW LEVEL SECURITY;

-- User Credits Policies
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON user_credits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON user_credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Generated Images Policies
CREATE POLICY "Users can view own images" ON generated_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON generated_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON generated_images
    FOR DELETE USING (auth.uid() = user_id);

-- Manga Projects Policies
CREATE POLICY "Users can view own projects" ON manga_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON manga_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON manga_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON manga_projects
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create user credits on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id, credits_remaining, credits_total, subscription_tier)
    VALUES (NEW.id, 5, 5, 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user credits on new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manga_projects_updated_at
    BEFORE UPDATE ON manga_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
