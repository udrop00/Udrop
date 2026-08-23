export type AppUser={id:string;name:string;email:string;role:"customer"|"admin";status:"Active"|"Suspended"};
const KEY="dz_tab_session";
export function saveSession(role:"customer"|"admin",user:AppUser,token:string){if(typeof window!=="undefined")sessionStorage.setItem(KEY,JSON.stringify({role,user,token}));}
export function clearSession(){if(typeof window!=="undefined")sessionStorage.removeItem(KEY);}
export function getSession(){if(typeof window==="undefined")return null;try{const raw=sessionStorage.getItem(KEY);return raw?JSON.parse(raw):null}catch{return null;}}
export async function apiFetch(input:RequestInfo|URL,init:RequestInit={}){const s=getSession();const headers=new Headers(init.headers||{});if(s?.token)headers.set("Authorization",`Bearer ${s.token}`);return fetch(input,{...init,headers});}
export async function apiMe(){const r=await apiFetch("/api/auth/me",{cache:"no-store"});if(!r.ok)throw new Error("Not authenticated");return r.json();}
