-- Migration: add video_url to products table
-- Run this in Supabase SQL Editor

ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';
