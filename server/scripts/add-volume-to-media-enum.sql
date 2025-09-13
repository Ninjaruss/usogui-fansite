-- Add 'volume' to the media_ownertype_enum if it doesn't already exist
DO $$
BEGIN
    -- Check if the enum value 'volume' already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumtypid = (
            SELECT oid 
            FROM pg_type 
            WHERE typname = 'media_ownertype_enum'
        ) 
        AND enumlabel = 'volume'
    ) THEN
        -- Add the new enum value
        ALTER TYPE media_ownertype_enum ADD VALUE 'volume';
        RAISE NOTICE 'Added "volume" to media_ownertype_enum';
    ELSE
        RAISE NOTICE '"volume" already exists in media_ownertype_enum';
    END IF;
END $$;