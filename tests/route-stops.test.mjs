import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutStops,routeLabel,routePath,routeStops} from '../src/routeStops.js';

test('a family route keeps place names, years and the order of movement',()=>{
  const stops=routeStops('Bhag (Origins) → Karachi (1800s–1947) → Bombay (1947 onward)');
  assert.deepEqual(stops,[
    {name:'Bhag',year:'Origins'},
    {name:'Karachi',year:'1800s–1947'},
    {name:'Bombay',year:'1947 onward'}
  ]);
  assert.equal(routeLabel(stops),'Bhag (Origins) → Karachi (1800s–1947) → Bombay (1947 onward)');
  const points=layoutStops(stops);
  assert.equal(points.length,3);
  assert.ok(points[0].y<points[1].y&&points[1].y<points[2].y);
  assert.match(routePath(points),/^M\d+ \d+ Q/);
  assert.equal(routeStops('Karachi').length,1);
  assert.equal(routePath(layoutStops(routeStops('Karachi'))),'');
});
