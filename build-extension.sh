#!/bin/bash

echo "🔨 Building Centri Chrome Extension..."

cd extension

# Compile TypeScript files
echo "Compiling TypeScript files..."

npx tsc background/rules.ts --outDir background --target ES2017 --module ES2020 --esModuleInterop --skipLibCheck
npx tsc background/tracker.ts --outDir background --target ES2017 --module ES2020 --esModuleInterop --skipLibCheck
npx tsc background/aggregator.ts --outDir background --target ES2017 --module ES2020 --esModuleInterop --skipLibCheck
npx tsc background/sync.ts --outDir background --target ES2017 --module ES2020 --esModuleInterop --skipLibCheck
npx tsc background/service_worker.ts --outDir background --target ES2017 --module ES2020 --esModuleInterop --skipLibCheck
npx tsc content/activity_listener.ts --outDir content --target ES2017 --module ES2020 --esModuleInterop --skipLibCheck
npx tsc ui/popup.ts --outDir ui --target ES2017 --module ES2020 --esModuleInterop --skipLibCheck

cd ..

echo "✅ Extension built successfully!"
echo ""
echo "📦 To load in Chrome:"
echo "   1. Open chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the 'extension' folder"
