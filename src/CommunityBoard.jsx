import React from 'react';
import {albumPhotos,dishPhotos,pronunciations,recipes,stories} from './catalog.js';
import {publicAudio,publicImage} from './publicImage.js';
import {Link} from './components.jsx';
import CommunityPhotos from './CommunityPhotos.jsx';
import SharedDishPhotos from './SharedDishPhotos.jsx';

export default function CommunityBoard(){
  const family=recipes.filter(recipe=>recipe.community);
  const voices=[...stories,...pronunciations].filter(item=>item.name);
  const photographs=[...albumPhotos,...dishPhotos].filter(item=>publicImage(item.image,'recipes'));
  return <div className="community-board">
    <section>
      <h2>Photographs</h2>
      <p>Pictures the curator has approved. Each one stays with the name the sender asked us to use.</p>
      {photographs.length?<CommunityPhotos heading={false}/>:<p>No photograph has been approved yet.</p>}
    </section>
    <section>
      <h2>Recipes</h2>
      <p>Family recipes, with any photograph sent alongside them.</p>
      {family.length?family.map(recipe=><article className="community-recipe" key={recipe.id}>{recipe.image&&publicImage(recipe.image,'recipes')&&<img src={publicImage(recipe.image,'recipes')} alt=""/>}<h3>{recipe.name}</h3><p>{recipe.credit}</p>{recipe.description&&<p>{recipe.description}</p>}<SharedDishPhotos photos={dishPhotos.filter(photo=>photo.wordIds?.includes(recipe.id))}/></article>):<p>No family recipe has been approved yet.</p>}
    </section>
    <section>
      <h2>Voices and memories</h2>
      <p>Recordings and written memories the curator has approved.</p>
      {voices.length?<div className="word-pronunciations">{voices.map(item=>{const src=publicAudio(item.image);return <figure key={item.id}>{src&&<audio controls src={src} preload="none"><track kind="captions"/></audio>}<figcaption>{item.name} · shared by {item.credit}{item.description?` · ${item.description}`:''}{item.wordIds?.[0]&&<> · <Link to={'/words/'+item.wordIds[0]}>Hear it on the word</Link></>}</figcaption></figure>})}</div>:<p>No voice or memory has been approved yet.</p>}
    </section>
  </div>;
}
