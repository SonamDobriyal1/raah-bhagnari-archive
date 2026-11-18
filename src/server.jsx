import React from 'react';
import {renderToString} from 'react-dom/server';
import {App} from './main.jsx';
export {applyPublished} from './catalog.js';
export function render(path) {
  globalThis.window={location:{pathname:path,search:'',hash:''}};
  try{return renderToString(<App/>)}finally{delete globalThis.window}
}
