-- Database Schema for Ultimate Chess Platform (PostgreSQL)

-- Users & Profiles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    is_premium BOOLEAN DEFAULT FALSE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Elo Ratings across different modes and variants
CREATE TABLE user_ratings (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating_type VARCHAR(20) NOT NULL, -- 'bullet', 'blitz', 'rapid', 'classical', 'puzzle', 'bot', 'chess960', 'threecheck', 'kingofthehill'
    rating INTEGER DEFAULT 1200 NOT NULL,
    peak_rating INTEGER DEFAULT 1200 NOT NULL,
    games_played INTEGER DEFAULT 0 NOT NULL,
    provisional BOOLEAN DEFAULT TRUE NOT NULL,
    PRIMARY KEY (user_id, rating_type)
);

-- Games Log
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    white_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating_type VARCHAR(20) NOT NULL,
    variant VARCHAR(20) DEFAULT 'normal' NOT NULL, -- 'normal', 'chess960', 'kingofthehill', 'threecheck'
    pgn TEXT,
    fen VARCHAR(100) NOT NULL, -- Final board state FEN
    outcome VARCHAR(10) NOT NULL, -- 'white', 'black', 'draw'
    termination_reason VARCHAR(50), -- 'mate', 'resign', 'timeout', 'stalemate', 'insufficient_material'
    white_elo_before INTEGER,
    white_elo_after INTEGER,
    black_elo_before INTEGER,
    black_elo_after INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rating History (for tracking graphs)
CREATE TABLE rating_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating_type VARCHAR(20) NOT NULL,
    rating INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_games_players ON games(white_player_id, black_player_id);
CREATE INDEX idx_rating_history_user ON rating_history(user_id, recorded_at);
