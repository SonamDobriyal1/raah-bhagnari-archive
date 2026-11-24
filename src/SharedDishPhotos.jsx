import React from 'react';
import {publicImage} from './publicImage.js';

export default function SharedDishPhotos({photos}){
  const visible=(photos||[]).map(photo=>({...photo,src:publicImage(photo.image,'recipes')})).filter(photo=>photo.src);
  if(!visible.length)return null;
  return <section className="shared-dish-photos" aria-label="Images shared by people"><h3>Images shared by people</h3><p>Photographs families sent for this dish, after the curator approved them.</p><ul>{visible.map(photo=><li key={photo.id}><figure><img src={photo.src} alt={photo.name||'A dish photograph shared by a family'} loading="lazy"/><figcaption>{photo.credit&&photo.credit!=='A family'&&photo.credit!=='Anonymous'?photo.credit:'Shared by a family'}{photo.description?` · ${photo.description}`:''}</figcaption></figure></li>)}</ul></section>;
}
