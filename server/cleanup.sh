#!/bin/bash

# List of directories and files to be deleted
DIRS_TO_DELETE=(
  "src/modules/gamble-translations"
  "src/modules/gambles/dtos"
)

FILES_TO_DELETE=(
  "src/migrations/1755910203000-AddStartEndChaptersToArc.ts"
  "src/migrations/1755910204000-AddDescriptionToTag.ts"
  "src/migrations/1755910205000-UpdateChapterReferences.ts"
  "src/migrations/1755910205000-UpdateChapterSpoilerStructure.ts"
  "src/migrations/1755910205000-UpdateGambleChapterReference.ts"
  "src/migrations/1755910305000-UpdateChapterSpoilerReferences.ts"
  "src/modules/volumes/README.md"
  "src/modules/volumes/dto/chapter-range-response.dto.ts"
  "src/modules/volumes/dto/paginated-volumes-response.dto.ts"
  "src/modules/volumes/dto/volume-detail-response.dto.ts"
  "src/modules/volumes/dto/volume-response-message.dto.ts"
  "test-api-routes.sh"
  "test-routes.sh"
)

# Delete directories
for dir in "${DIRS_TO_DELETE[@]}"; do
  if [ -d "$dir" ]; then
    echo "Removing directory: $dir"
    rm -rf "$dir"
  else
    echo "Directory not found: $dir"
  fi
done

# Delete files
for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    echo "Removing file: $file"
    rm "$file"
  else
    echo "File not found: $file"
  fi
done

echo "Cleanup complete!"
