import React,{useId} from 'react';
import {layoutStops,routePath,routeStops} from './routeStops.js';

export default function RouteMap({place='',stops,title='A family route'}){
  const patternId='route-grid-'+useId().replace(/:/g,'');
  const points=layoutStops(stops||routeStops(place));
  const path=routePath(points);
  const names=points.map(point=>point.name).join(', ')||'No places named yet';
  return <div className="map-wrap">
    <svg viewBox="0 0 450 470" role="img" aria-label={`Schematic route: ${names}`}>
      <title>{title}</title>
      <desc>A north-up sketch. Place names follow the order a family remembered. The dotted line is not a measured road or sea crossing.</desc>
      <defs><pattern id={patternId} width="45" height="47" patternUnits="userSpaceOnUse"><path d="M45 0H0V47" fill="none" stroke="#8e7e62" strokeWidth=".5" opacity=".22"/></pattern></defs>
      <rect width="450" height="470" fill="#e8ddc5"/>
      <rect width="450" height="470" fill={`url(#${patternId})`}/>
      <path d="M0 271 43 262 86 253 110 231 128 227 142 235 157 242 175 241 190 267 213 262 232 281 256 287 271 311 286 339 291 369 305 399 307 431 320 470H450V0H0Z" fill="#eee7d6" stroke="#a89b80" strokeWidth="1"/>
      <path d="M224 0c-20 30-22 48-14 73s-1 49-18 71-5 44-21 60-26 25-29 31" fill="none" stroke="#80969c" strokeWidth="2"/>
      <text x="236" y="118" transform="rotate(75 236 118)" className="map-water">Indus</text>
      <text x="28" y="424" className="map-water">Arabian Sea</text>
      {path&&<path d={path} fill="none" stroke="#7c2430" strokeWidth="3.5" strokeDasharray="6 6" strokeLinecap="round"/>}
      {points.map((point,index)=><g key={`${point.name}-${index}`}><circle cx={point.x} cy={point.y} r="11" fill="#7c2430" fillOpacity=".17"/><circle cx={point.x} cy={point.y} r="4" fill="#7c2430"/><text x={point.x+16} y={point.y+2} className="map-place">{point.name.slice(0,18)}</text>{point.year&&<text x={point.x+16} y={point.y+28} className="map-date">{point.year.slice(0,16)}</text>}</g>)}
      {!points.length&&<text x="118" y="230" className="map-date">Add places to draw the route</text>}
      <path d="M403 67V28m-6 9 6-9 6 9" fill="none" stroke="#7c2430"/>
      <text x="398" y="19" className="map-date">N</text>
      <text x="20" y="452" className="map-date">Schematic route · not a scale map</text>
    </svg>
    <span className="map-note">North up. The dotted line follows the order of places, not a measured road or sea crossing.</span>
  </div>;
}
