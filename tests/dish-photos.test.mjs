import test from 'node:test';
import assert from 'node:assert/strict';
import {dishPhotoLinks,photosForDish,photosUnderRecipe} from '../src/dishPhotos.js';

test('a shared dish photo stays under the recipe it was sent from',()=>{
  const recipes=[{id:'RAAH-RC-0002',wordId:'RAAH-0004',name:'Aloo Tuk'}];
  assert.deepEqual(dishPhotoLinks({record:'RAAH-RC-0002',title:'Dish photo: Something else'},recipes),['RAAH-RC-0002','RAAH-0004']);
  assert.deepEqual(dishPhotoLinks({title:'Dish photo: Aloo Tuk'},recipes),['RAAH-RC-0002','RAAH-0004']);
  const photos=[
    {id:'1',image:'/uploads/recipes/a.jpg',wordIds:['RAAH-RC-0002','RAAH-0004']},
    {id:'2',image:'/uploads/recipes/b.jpg',wordIds:['RAAH-0004']}
  ];
  assert.deepEqual(photosUnderRecipe(photos,'RAAH-RC-0002').map(photo=>photo.id),['1']);
  assert.deepEqual(photosForDish(photos,'RAAH-0004').map(photo=>photo.id),['2']);
});
