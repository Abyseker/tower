import test from 'node:test';
import assert from 'node:assert/strict';
import {damage,fresh,foes} from './game.js';
test('damage counts only surviving enemy turns; skills reduce loss',()=>{const p=fresh();assert.equal(damage(p,foes.s),8);assert.equal(damage(p,foes.s,true),4);assert.equal(damage({...p,atk:4},foes.s),Infinity);assert.equal(damage({...p,atk:100},foes.s),0)});
test('new games have independent maps and archives',()=>{const a=fresh(),b=fresh();a.maps[0][1][1]='h';a.entries.push('x');assert.equal(b.maps[0][1][1],'N');assert.equal(b.entries.length,0)});
test('three floors, encounters, forge, diplomacy, local save and spoiler-free ending',async()=>{
 const handlers={},app={innerHTML:''},storage=new Map();
 globalThis.document={querySelector:()=>app,addEventListener:(event,fn)=>handlers[event]=fn};
 globalThis.localStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null};
 await import('./main.js');
 const click=data=>handlers.click({target:{closest:()=>({dataset:data})}});
 const action=a=>click({action:a});
 const step=(x,y)=>{click({x:String(x),y:String(y)});if(app.innerHTML.includes('ENCOUNTER / 战斗预演'))action('fight')};
 assert.match(app.innerHTML,/追击彷徨猎手/);action('begin');assert.match(app.innerHTML,/退出键……不见了/);action('close');
 action('save');step(1,6);action('load');assert.match(app.innerHTML,/本地记录读取成功/);
 const route=[[1,6],[1,5],[1,4],[1,3],[1,2],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7]];
 for(let f=0;f<3;f++){
  for(const [x,y] of route){step(x,y);if(app.innerHTML.includes('role="dialog"')){if(f===1&&app.innerHTML.includes('<h2>比利布 / 绝不掉级的锻造铺</h2>'))action('forge');if(f===2&&app.innerHTML.includes('<h2>夜色披风 / 森林的分歧</h2>'))action('peace');else action('close')}}
  action('skill');step(4,7);step(5,7);step(6,7);step(7,7);
  assert.match(app.innerHTML,f===2?/第三层通关 · 梦尚未醒/:f===0?/踏鸣原野/:/摇曳迷雾/);action('close');
 }
 assert.doesNotMatch(app.innerHTML,/夜魔的游戏/);action('journal');assert.match(app.innerHTML,/消失的退出键/);action('close');action('save');action('restart');action('load');assert.match(app.innerHTML,/前三层已完成/);
});
