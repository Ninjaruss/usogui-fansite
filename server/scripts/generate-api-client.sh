#!/bin/bash

# Generate API client for frontend consumption
# Usage: ./scripts/generate-api-client.sh [output-directory]

OUTPUT_DIR=${1:-"./generated-api"}
SERVER_URL=${2:-"http://localhost:3001"}

echo "🚀 Generating TypeScript API client..."
echo "📍 Server URL: $SERVER_URL"
echo "📁 Output directory: $OUTPUT_DIR"

# Check if server is running
if ! curl -s "$SERVER_URL/api-docs-json" > /dev/null; then
    echo "❌ Server is not running at $SERVER_URL"
    echo "💡 Start the server with: yarn start:dev"
    exit 1
fi

# Generate the client
npx @openapitools/openapi-generator-cli generate \
    -i "$SERVER_URL/api-docs-json" \
    -g typescript-axios \
    -o "$OUTPUT_DIR" \
    --additional-properties=supportsES6=true,npmName=usogui-api-client,npmVersion=1.0.0

echo "✅ API client generated successfully!"
echo "📖 Import in your frontend:"
echo "   import { DefaultApi, Configuration } from '$OUTPUT_DIR';"
echo ""
echo "🔧 Example usage:"
echo "   const api = new DefaultApi(new Configuration({ basePath: '$SERVER_URL' }));"
echo "   const characters = await api.charactersControllerFindAll();"
