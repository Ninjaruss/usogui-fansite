-- Populate gamble_participants table with character-gamble relationships
-- This connects characters to the gambles they participate in

-- Clear existing data first
DELETE FROM gamble_participants;

-- Add Baku Madarame (id: 1) to multiple gambles
INSERT INTO gamble_participants ("gambleId", "characterId") VALUES
(1, 1), -- Baku in Protoporos
(2, 1), -- Baku in Poker Tournament
(3, 1), -- Baku in Russian Roulette Variant
(4, 1); -- Baku in Card Matching Game

-- Add other characters to some gambles (assuming they exist)
-- Character 8 (Fukurou Tsukiyo) in Poker Tournament and Card Matching Game
INSERT INTO gamble_participants ("gambleId", "characterId") VALUES
(2, 8), -- Fukurou in Poker Tournament
(4, 8); -- Fukurou in Card Matching Game

-- Character 5 in Russian Roulette Variant
INSERT INTO gamble_participants ("gambleId", "characterId") VALUES
(3, 5); -- Character 5 in Russian Roulette Variant