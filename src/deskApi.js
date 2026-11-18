import {apiUrl} from './apiUrl.js';

const TOKEN='raah_admin_token';

export function deskPath(path){
  return import.meta.env?.VITE_ARCHIVE_API_URL?apiUrl(path):path;
}

export function authHeaders(){
  try{
    const token=sessionStorage.getItem(TOKEN);
    return token?{Authorization:`Bearer ${token}`}:{};
  }catch{return {}}
}

export function rememberSession(data){
  if(!data?.token)return;
  try{sessionStorage.setItem(TOKEN,data.token)}catch{/* A private window can refuse storage; the cookie still covers same-origin use. */}
}

export function forgetSession(){
  try{sessionStorage.removeItem(TOKEN)}catch{}
}
