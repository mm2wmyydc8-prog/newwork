import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REGIONS} from '../docs/collection.js';
import {REGION_SYMBOLS,regionImagePath,sceneryArt} from '../docs/region-art.js';
test('all seven region icons and every scenery decoration use bundled SVG artwork',()=>{
 for(const symbol of REGION_SYMBOLS){
  const svg=readFileSync(new URL('../docs/'+regionImagePath(symbol),import.meta.url),'utf8');
  assert.match(svg,/<svg/);assert.doesNotMatch(svg,/<text|<script|<image|(?:href|src)=/i);
 }
 for(const region of Object.values(REGIONS)){
  assert.ok(regionImagePath(region.icon));
  const html=sceneryArt(region.scenery);
  assert.equal((html.match(/<img /g)??[]).length,5);
  assert.equal(html.replace(/<[^>]+>/g,''),'');
 }
 assert.throws(()=>regionImagePath('<script>'));
});
