import React from 'react';
import {albumPhotos,dishPhotos} from './catalog.js';
import {Icon,Link} from './components.jsx';
import {publicImage} from './publicImage.js';

export default function CommunityPhotos({heading=true}){
  const photos=[...albumPhotos,...dishPhotos].map(photo=>({...photo,src:publicImage(photo.image,'recipes')})).filter(photo=>photo.src);
  return <section className="community-photos">{heading&&<div className="community-photo-heading"><div><h1>The community’s own album.</h1><p>Family photographs, with their stories, after the curator approves them.</p></div><Link to="/contribute?type=photograph" className="button">Add a photograph <Icon name="plus"/></Link></div>}{photos.length?<div className="community-photo-grid">{photos.map(photo=><figure key={photo.id}><img src={photo.src} alt={photo.name} loading="lazy"/><figcaption><h3>{photo.name}</h3>{photo.description&&<p>{photo.description}</p>}<p>Shared by {photo.credit}</p></figcaption></figure>)}</div>:<p className="community-photo-empty">The first family photographs are still being collected. Choose a picture from your phone, or take a photo of a print. Each submission is reviewed before it joins this album.</p>}</section>;
}
