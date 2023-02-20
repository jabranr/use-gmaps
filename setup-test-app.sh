#!/usr/bin/env bash



mkdir -p test-app/src test-app/public

npm pack
mv use-gmaps*.tgz test-app/

cd test-app

echo "
<!DOCTYPE html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <meta
      name=\"viewport\"
      content=\"width=device-width, initial-scale=1, shrink-to-fit=no\"
    />
    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge,chrome=1\" />
  </head>
  <body>
    <div id=\"root\"></div>
  </body>
</html>

" > public/index.html


echo "
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './app';

const root = createRoot(document.querySelector('#root'));
root.render(<App />);

" > src/index.js

echo "
import React from 'react';
import useGoogleMaps from 'use-gmaps';

export default function App() {
  const { mapRef } = useGoogleMaps({ apiKey: 'ABC-XYZ' });

  return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}

" > src/app.js

npm init -y
npm i -D react react-dom react-scripts
npm i ./use-gmaps*.tgz
rm ./use-gmaps*.tgz

echo "**************************************";
echo " ";
echo "🥳 Test project setup!";
echo " ";
echo "Use \"npm start\" to start the project";
echo " ";
echo "**************************************";