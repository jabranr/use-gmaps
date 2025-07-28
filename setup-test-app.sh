#!/usr/bin/env bash

# build and package the use-gmaps library
npm run build
npm pack

# create a fresh vite app
rm -rf test-app
npm create vite@latest test-app -- --template=react-ts

# move the packaged version of use-gmaps to the test-app directory
mv jabraf-use-gmaps*.tgz test-app/
cd test-app

# install packaged version of use-gmaps
npm i ./jabraf-use-gmaps*.tgz

# remove packaged version of use-gmaps
rm ./jabraf-use-gmaps*.tgz

# setup app.tsx with @jabraf/use-gmaps
echo "
import useGoogleMaps from '../../src/index';

export default function App() {
  const { mapRef } = useGoogleMaps({ apiKey: '' });
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