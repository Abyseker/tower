import {FLOORS} from './data.js';
const tile=(type='floor',more={})=>({type,...more});
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
export function enemy(f,kind='goblin',elite=false){return {kind,hp:Math.round((36+f*20)*(elite?1.8:1)*(kind==='farbauti'?1.4:kind==='hati'?.8:1)),atk:14+f*7+(elite?10:0)+(kind==='hati'?3:kind==='farbauti'?6:0),def:3+f*2+(elite?3:0)+(kind==='farbauti'?3:0),xp:8+f*3+(elite?10:0),gold:6+f*3+(elite?12:0)}}
export function boss(f){const k=FLOORS[f];return {kind:k.boss,hp:100+f*95,atk:30+f*10,def:8+f*5,xp:55+f*12,gold:45+f*15,name:k.bossName}}
export function generate(f){
 if(f===-1)return nest();
 const big=f===10,cw=big?19:[13,13,15,14,17,15,14,16,17,16,19][f],ch=big?15:[11,11,11,12,11,13,12,11,12,13,15][f],w=cw*3+1,h=ch*3+1,random=rng(4711+f*997);let grid=Array.from({length:h},()=>Array.from({length:w},()=>tile('wall'))),rooms=[];
 for(let ry=0;ry<3;ry++)for(let rx=0;rx<3;rx++){
  const room={x:rx*cw+1,y:ry*ch+1,w:cw-1,h:ch-1,id:ry*3+rx};rooms.push(room);
  for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++)grid[y][x]=tile('floor',{zone:room.id});
  // Pillars leave a clear centre cross and a perimeter route.
  if(room.id!==0)for(let n=0;n<(big?12:5);n++){let x=room.x+2+Math.floor(random()*(room.w-4)),y=room.y+2+Math.floor(random()*(room.h-4));if(x!==room.x+Math.floor(room.w/2)&&y!==room.y+Math.floor(room.h/2))grid[y][x]=tile('wall',{pillar:true})}
 }
 // Every floor has a different weave of optional shortcuts and two keyed bottlenecks.
 for(let ry=0;ry<3;ry++)for(let rx=0;rx<2;rx++){let y=ry*ch+Math.floor(ch/2);grid[y][(rx+1)*cw]=tile((ry===1&&rx===1)?'gate':'floor',{zone:ry*3+rx})}
 for(let ry=0;ry<2;ry++)for(let rx=0;rx<3;rx++){let x=rx*cw+Math.floor(cw/2);grid[(ry+1)*ch][x]=tile(ry===1&&rx===2?'redgate':'floor',{zone:ry*3+rx})}
 const put=(x,y,type,more={})=>{grid[y][x]=tile(type,more)};
 const centre=id=>({x:rooms[id].x+Math.floor(rooms[id].w/2),y:rooms[id].y+Math.floor(rooms[id].h/2)});
 put(4,4,'camp');put(2,4,'down');put(7,3,'shop');put(4,2,'clock');put(8,6,'npc',{actor:f===1?'nicole':f===2?'billy':'amillion',role:'host'});put(3,7,'warp');
 const n1=centre(1),n2=centre(3);put(n1.x,n1.y,'npc',{actor:'anby',role:'tactic'});put(n2.x,n2.y,'npc',{actor:'lucia',role:'lore'});
 let used=new Set(['4,4','2,4','7,3','4,2','8,6','3,7',`${n1.x},${n1.y}`,`${n2.x},${n2.y}`]);
 for(let id=1;id<8;id++){
  const room=rooms[id],farm=([2,3,4,6,7].includes(id)&&((id+f)%4!==0));let count=farm?(big?12:4+(id+f)%5):2+(id*f)%3;
  for(let n=0;n<count;n++){let x,y,key;for(let t=0;t<100;t++){x=room.x+1+Math.floor(random()*(room.w-2));y=room.y+1+Math.floor(random()*(room.h-2));key=x+','+y;if(grid[y][x].type==='floor'&&!used.has(key))break}if(grid[y][x].type!=='floor'||used.has(key))continue;used.add(key);let kind=['goblin','hati',f>=3?'farbauti':'goblin'][Math.floor(random()*3)];put(x,y,'enemy',{enemy:enemy(f,kind),farm,spawn:enemy(f,kind),zone:id})}
  const p={x:room.x+1,y:room.y+1};put(p.x,p.y,id%2?'potion':'chest',{zone:id});
 }
 const keyroom=rooms[1];put(keyroom.x+2,keyroom.y+2,'key',{amount:3});put(rooms[6].x+2,rooms[6].y+2,'redkey');
 put(rooms[4].x+2,rooms[4].y+2,'rune',{text:`战术残页：${FLOORS[f].pattern}。先观察，再按顺序引导攻击；首领房还有未被显示的信号。`});
 const b=centre(8);put(b.x,b.y,'boss',{enemy:boss(f)});put(b.x,b.y+3,'stairs');put(b.x-3,b.y-2,'switch',{index:0});put(b.x+3,b.y-2,'switch',{index:1});
 put(b.x-4,b.y+2,'guard',{hidden:true,enemy:enemy(f,'goblin',true)});put(b.x+4,b.y+2,'guard',{hidden:true,enemy:enemy(f,'hati',true)});
 if(f===1){put(b.x,b.y-4,'sentinel',{enemy:{...enemy(1,'goblin',true),name:'逆序记录者'},mechanism:true});put(rooms[5].x+2,rooms[5].y+2,'relic',{hook:1})}
 if(f===2){put(rooms[2].x+3,rooms[2].y+3,'girl');put(rooms[2].x+5,rooms[2].y+3,'trap');put(rooms[5].x+2,rooms[5].y+2,'relic',{hook:2})}
 if(f===5)put(b.x,b.y-3,'reflector');
 if(f===10)put(b.x,b.y-3,'broadcast');
 if(f===3)put(rooms[5].x+2,rooms[5].y+2,'npc',{actor:'exploreboo',role:'elves'});
 if(f===4||f===5||f===9)put(rooms[5].x+2,rooms[5].y+2,'relic',{hook:f});
 if(f===8)put(rooms[4].x+1,rooms[4].y+1,'ambush');
 if(f===0){put(b.x,b.y,'boss',{enemy:boss(0)});put(b.x,b.y+3,'pet');put(9,2,'secret',{to:-1});put(4,2,'stairs',{to:1});put(2,4,'stairs',{to:1})}
 if(f===10){for(let i=0;i<6;i++)put(10+(i%3)*2,4+Math.floor(i/3)*3,'npc',{actor:['safety','butler','exploreboo','sharkboo','billy','lucia'][i],role:'town'+i})}
 return {id:f,w,h,grid,rooms,seen:[],defeated:false,scanned:false,guards:0,switches:[],puzzle:0,mistakes:0,cycle:0,bossAt:b,spawn:{x:4,y:5},secretCount:0};
}
function nest(){let w=19,h=15,grid=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>tile(x&&y&&x<w-1&&y<h-1?'floor':'wall')));grid[7][9]=tile('nest');grid[5][5]=tile('chest',{special:true});grid[5][13]=tile('chest',{special:true});grid[12][9]=tile('stairs',{to:0});return {id:-1,w,h,grid,rooms:[{id:0,x:1,y:1,w:17,h:13}],seen:[],defeated:true,spawn:{x:9,y:11},cycle:0}}
export function reachable(map,start=map.spawn){const todo=[start],seen=new Set();while(todo.length){const p=todo.shift(),k=p.x+','+p.y;if(seen.has(k)||map.grid[p.y]?.[p.x]?.type==='wall')continue;seen.add(k);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(map.grid[p.y+dy]?.[p.x+dx]&&map.grid[p.y+dy][p.x+dx].type!=='wall')todo.push({x:p.x+dx,y:p.y+dy})}return seen}
