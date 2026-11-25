#!/usr/bin/env bash
set -euo pipefail

# pinned so the test app does not change underneath the tests
CREATE_VITE_VERSION=9.3.4

# build and package the use-gmaps library
npm run build
npm pack

# create a fresh vite app
rm -rf test-app
npx --yes "create-vite@${CREATE_VITE_VERSION}" test-app --template react-ts --no-interactive

# move the packaged version of use-gmaps to the test-app directory
mv jabraf-use-gmaps*.tgz test-app/
cd test-app

# install packaged version of use-gmaps
npm i ./jabraf-use-gmaps*.tgz

# remove packaged version of use-gmaps
rm ./jabraf-use-gmaps*.tgz

# setup app.tsx with @jabraf/use-gmaps
echo "
import useGoogleMaps from '@jabraf/use-gmaps';

export default function App() {
  const { mapRef } = useGoogleMaps({ apiKey: import.meta.env.VITE_GMAPS_API_KEY ?? '' });
  return <div data-testid='jabraf-test-map-container' ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}

" > src/App.tsx

npm install

echo "**************************************";
echo " ";
echo "🥳 Test project setup!";
echo " ";
echo "Use \"npm start\" to start the project";
echo " ";
echo "**************************************";