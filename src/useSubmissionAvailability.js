import {apiUrl} from './apiUrl.js';
import {useEffect,useState} from 'react';
export default function useSubmissionAvailability(endpoint){
 const[state,setState]=useState('checking');
 useEffect(()=>{let active=true;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);setState('checking');fetch(apiUrl(endpoint),{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();const data=await r.json();if(active)setState(data.enabled===true?'open':'unavailable')}).catch(()=>{if(active)setState('unavailable')}).finally(()=>clearTimeout(timer));return()=>{active=false;clearTimeout(timer);controller.abort()}},[endpoint]);
 return state;
}
