// 의존성 없는 로컬 실행 서버. 파일은 dist 안에서만 제공합니다.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.md':'text/plain','.zip':'application/zip'};
http.createServer((req,res)=>{let name;try{name=decodeURIComponent(req.url.split('?')[0]);}catch{res.writeHead(400).end();return;}const target=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':(mime[path.extname(target)]||'application/octet-stream')+'; charset=utf-8','X-Content-Type-Options':'nosniff'}).end(data);});}).listen(8080,'127.0.0.1',()=>console.log('재고온: http://localhost:8080'));
