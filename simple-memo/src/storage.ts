import type {Note} from './model';
let database:Promise<IDBDatabase>;
function db(){return database??=new Promise((resolve,reject)=>{const r=indexedDB.open('my-memo-v1',1);r.onupgradeneeded=()=>{const s=r.result.createObjectStore('notes',{keyPath:['user_id','id']});s.createIndex('user','user_id');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function putNote(n:Note){const d=await db();return new Promise<void>((resolve,reject)=>{const t=d.transaction('notes','readwrite');t.objectStore('notes').put(n);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
export async function getNotes(user:string){const d=await db();return new Promise<Note[]>((resolve,reject)=>{const r=d.transaction('notes').objectStore('notes').index('user').getAll(user);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function removeNote(user:string,id:string){const d=await db();return new Promise<void>((resolve,reject)=>{const t=d.transaction('notes','readwrite');t.objectStore('notes').delete([user,id]);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}
export async function clearUser(user:string){const rows=await getNotes(user);for(const n of rows)await removeNote(user,n.id);}
