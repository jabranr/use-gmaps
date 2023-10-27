#!/usr/bin/env bash


npx create-react-app test-app --template=typescript

# mkdir -p test-app/src test-app/public

npm pack
mv use-gmaps*.tgz test-app/

cd test-app

# remove unused files
rm src/App.css src/App.test.tsx src/logo.svg

# install packaged version of use-gmaps
npm i ./use-gmaps*.tgz
rm ./use-gmaps*.tgz

# setup app.tsx with use-gmaps
echo "
import useGoogleMaps from 'use-gmaps';

export default function App() {
  const { mapRef } = useGoogleMaps({ apiKey: 'ABC-XYZ' });
  return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}

" > src/App.tsx

echo "**************************************";
echo " ";
echo "🥳 Test project setup!";
echo " ";
echo "Use \"npm start\" to start the project";
echo " ";
echo "**************************************";