export function routeStops(place){
  return String(place||'')
    .split(/\s*(?:→|->|\n)\s*/)
    .map(part=>part.trim())
    .filter(Boolean)
    .slice(0,6)
    .map(part=>{
      const dated=part.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
      if(!dated)return {name:part,year:''};
      return {name:dated[1].trim(),year:dated[2].trim()};
    })
    .filter(stop=>stop.name);
}

export function routeLabel(stops){
  return (stops||[]).filter(stop=>stop?.name).slice(0,6).map(stop=>stop.year?`${stop.name} (${stop.year})`:stop.name).join(' → ');
}

export function layoutStops(stops){
  const points=(stops||[]).filter(stop=>stop?.name).slice(0,6);
  const count=points.length;
  return points.map((stop,index)=>{
    const t=count===1?0.45:index/(count-1);
    const x=150+Math.sin(t*Math.PI)*42+(t-0.35)*36;
    const y=72+t*292;
    return {name:stop.name,year:stop.year||'',x:Math.round(x),y:Math.round(y)};
  });
}

export function routePath(points){
  if(!points||points.length<2)return '';
  let path=`M${points[0].x} ${points[0].y}`;
  for(let index=1;index<points.length;index++){
    const previous=points[index-1];
    const next=points[index];
    const bend=index%2===0?26:-30;
    path+=` Q${Math.round((previous.x+next.x)/2+bend)} ${Math.round((previous.y+next.y)/2)} ${next.x} ${next.y}`;
  }
  return path;
}
