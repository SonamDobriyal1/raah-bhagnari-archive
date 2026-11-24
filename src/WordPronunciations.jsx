import React from 'react';
import {pronunciations} from './catalog.js';
import {publicAudio} from './publicImage.js';

export default function WordPronunciations({wordId}){
  const heard=pronunciations.filter(item=>item.wordIds?.includes(wordId)&&publicAudio(item.image));
  if(!heard.length)return null;
  return <div className="word-pronunciations">{heard.map(item=><figure key={item.id}><audio controls src={publicAudio(item.image)} preload="none"><track kind="captions"/></audio><figcaption>Spoken by {item.credit}{item.description?`. ${item.description}`:''}</figcaption></figure>)}</div>;
}
