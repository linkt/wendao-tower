'use strict';
// ================= 数据 =================
const VERSION='v0.3.2';
const ACT=1, GUIYI_ENABLED=ACT>1; // 五行归一：第一幕关闭（含界面提示）
const ELK={metal:'jin',wood:'mu',water:'shui',fire:'huo',earth:'tu'};
const ELN={metal:'金',wood:'木',water:'水',fire:'火',earth:'土'};
const GEN={wood:'fire',fire:'earth',earth:'metal',metal:'water',water:'wood'}; // 相生
const ART={yujian:'🗡',jinzhong:'🔔',huichun:'🌿',xinghuo:'🔥',hanbing:'❄',sanmei:'☀',jifeng:'💨',houtu:'⛰',liushui:'🌊',tengfu:'🌱',jianqi:'🛡',kumu:'🍃',lingquan:'💧',fenxin:'❤‍🔥',jianyi:'✨',wanjian:'⚔',budong:'🗻'};
const STARTER=[
 {id:'yujian',name:'御剑术',element:'metal',cost:1,type:'attack',rarity:'starter',actions:[{op:'damage',value:6}],onShengBonus:[{op:'damage',value:3}],upgrade:{actions:[{op:'damage',value:9}]}},
 {id:'jinzhong',name:'金钟罩',element:'earth',cost:1,type:'skill',rarity:'starter',actions:[{op:'block',value:5}],onShengBonus:[{op:'block',value:3}],upgrade:{actions:[{op:'block',value:8}]}},
 {id:'huichun',name:'回春诀',element:'wood',cost:1,type:'skill',rarity:'starter',actions:[{op:'heal',value:3},{op:'draw',value:1}],onShengBonus:[{op:'draw',value:1}],upgrade:{actions:[{op:'heal',value:4},{op:'draw',value:2}]}},
 {id:'xinghuo',name:'星火诀',element:'fire',cost:1,type:'attack',rarity:'starter',actions:[{op:'damage',value:5}],onShengBonus:[{op:'applyStatus',status:'burn',value:1}],upgrade:{actions:[{op:'damage',value:7},{op:'applyStatus',status:'burn',value:1}]}},
 {id:'hanbing',name:'寒冰诀',element:'water',cost:1,type:'attack',rarity:'starter',actions:[{op:'damage',value:4},{op:'applyStatus',status:'freeze',value:1}],onShengBonus:[{op:'damage',value:2}],upgrade:{actions:[{op:'damage',value:6},{op:'applyStatus',status:'freeze',value:1}]}},
];
const CARDS={};[...STARTER,...CARDPOOL].forEach(c=>CARDS[c.id]=c);
const STATUS={burn:['灼烧','burn','回合开始时受到等同层数的伤害，然后减 1 层'],freeze:['冻结','freeze','下一次攻击伤害减半'],vulnerable:['易伤','vulnerable','受到的伤害 +50%，每回合减 1 层'],
 swordIntent:['剑意','swordIntent','每段攻击伤害 +1/层'],strength:['力量','strength','每段攻击伤害 +1/层'],swordIntentAura:['剑意凝神','swordIntent','每打出一张金属性牌，获得等量剑意']};
const RELICS={qingfeng:['青锋剑','每场战斗打出的第一张金属性牌伤害 +3'],hulu:['赤金葫芦','每场战斗开始时，获得 1 瓶随机丹药的效果'],zhong:['镇魂铜钟','每回合第一次受到伤害时减 3 点'],
 yupei:['五行玉佩','触发相生时有 25% 几率抽 1 张牌'],jing:['照心镜','心魔的护体真气减半'],fubi:['灵符笔','每场战斗第 1 回合多抽 2 张牌']};
const POTIONS={huiyuan:['回元丹','回复 15 点生命',35],ningshen:['凝神丹','获得 2 点灵力',40],jingang:['金刚丹','获得 12 点护体真气',35],qingmu:['青木丹','抽 3 张牌',40],ziyan:['紫烟散','对所有敌人施加 2 层易伤',45],xuelian:['雪莲丹','死亡时自动复活，恢复 30% 生命（被动）',80]};
let DAOXIN={};let BAL={restHealPct:.3,duoFloorFrom:4,duoEnemyScale:.8}; // config/balance.json 覆盖
 // 由 config/daoxin.json 加载：[名称, 效果, 取舍说明]
const A=(d,n=1,x={})=>Object.assign({t:'atk',d,n},x);
const ENEMIES={
 shanxiao:{name:'山魈',hp:26,img:'shanxiao',moves:[A(8),{t:'buff',name:'捶胸',str:2},A(8),{t:'def',b:6}]},
 wolf:{name:'野狼',hp:14,img:'wolf',moves:[A(7)]},
 spider:{name:'毒蛛精',hp:24,img:'spider',moves:[A(4,1,{burn:3}),A(9)]},
 bandit:{name:'散修劫匪',hp:32,img:'bandit',moves:[{t:'def',b:8},A(13),A(5,2)]},
 python:{name:'赤鳞蟒',hp:58,img:'python',elite:1,moves:[A(14),{t:'def',b:10,str:1},A(7,2)]},
 ghost:{name:'阴魂',hp:46,img:'ghost',elite:1,moves:[A(8,1,{vuln:1}),A(16)]},
 xinmo:{name:'心魔',hp:85,img:'xinmo',boss:1,moves:[A(8,2),{t:'def',b:15,si:2,once:1,warn:1},A(20,1,{name:'心魔蓄力'}),{t:'debuff',vuln:2}]},
};
const SOLO=[['shanxiao'],['wolf','wolf'],['spider'],['bandit']];
const DUO=[['shanxiao','wolf'],['spider','bandit'],['shanxiao','spider'],['wolf','bandit']];
const NODE={combat:['⚔','战斗'],elite:['👹','精英'],event:['❓','奇遇'],shop:['🏮','坊市'],rest:['🔥','洞府打坐'],boss:['','心魔']};
// ================= 工具 =================
const R=n=>Math.floor(Math.random()*n), pick=a=>a[R(a.length)], ri=(a,b)=>a+R(b-a+1);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=R(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const $=s=>document.querySelector(s);
const app=()=>$('#app');
let G=null,B=null,uid=1;
function def(c){const d=CARDS[c.id];if(!c.up)return d;const u=Object.assign({},d,d.upgrade);return u;}
function mkCard(id,up=false){return {id,up,uid:uid++};}
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;app().appendChild(e);setTimeout(()=>e.remove(),1800);}
// ================= 卡面 =================
function actText(a){
 switch(a.op){
  case 'damage':return a.times==='swordIntent'?`造成 <em>${a.value}</em> 点伤害，次数等于剑意层数`:`造成 <em>${a.value}</em> 点伤害`+(a.times>1?` ×${a.times}`:'');
  case 'block':return `获得 <em>${a.value}</em> 点护体真气`;
  case 'heal':return `回复 <em>${a.value}</em> 点生命`;
  case 'draw':return `抽 ${a.value} 张牌`;
  case 'gainEnergy':return `获得 ${a.value} 点灵力`;
  case 'selfDamage':return `自身失去 ${a.value} 点生命`;
  case 'applyStatus':if(a.status==='swordIntentAura')return '之后每打出一张金属性牌，获得 1 层剑意';
   return (a.target==='self'?'获得':'施加')+` ${a.value} 层${STATUS[a.status][0]}`;
 }return a.op;}
function cardHTML(c,extra=''){const d=def(c);const rar={starter:'起始',common:'普通',uncommon:'罕见',rare:'稀有'}[d.rarity];
 const ty={attack:'攻击',skill:'技能',power:'能力'}[d.type];
 const fr=`img/frames/frame_${ELK[d.element]}_${d.rarity==='starter'?'common':d.rarity}${c.up?'_plus':''}.png`;
 return `<div class="card ${d.rarity} ${c.up?'up':''} ${extra}" data-uid="${c.uid}" style="background-image:url(${fr})"><div class="cost">${d.cost}</div>
 <div class="ct">${d.name}${c.up?'+':''}</div><div class="art a${d.element}">${ART[d.id]||'✦'}<img class="cart" src="img/cards/${d.id}.png" alt="" onerror="this.remove()"></div>
 <div class="desc">${d.actions.map(actText).join('<br>')}${d.onShengBonus&&d.onShengBonus.length?`<div class="sh">相生：${d.onShengBonus.map(actText).join('，')}</div>`:''}${d.exhaust?'<div class="ex">消耗</div>':''}</div>
 <div class="tag">${ty} · ${rar}</div></div>`;}
// ================= 局 =================
function newRun(){uid=1;G={hp:70,maxHp:70,gold:99,deck:[],relics:['qingfeng'],potions:[],floor:0,pos:null,daoxin:null,energyMax:3,drawN:5,huanjing:0,removeCount:0};
 ['yujian','yujian','yujian','yujian','jinzhong','jinzhong','jinzhong','huichun','xinghuo','hanbing'].forEach(i=>G.deck.push(mkCard(i)));
 G.map=genMap();teleStart();showMap();}
function genMap(){
 for(let tries=0;tries<200;tries++){const fl=genMapOnce();if(repairMap(fl))return fl;}
 console.warn('genMap: fallback');return genMapOnce(true);}
function genMapOnce(force){const W={combat:.42,event:.24,elite:.14,shop:.08,rest:.12};const fl=[];
 for(let f=1;f<=12;f++){const row=[];for(let c=0;c<3;c++){let t;
  if(f<=3)t='combat';else if(f===6||f===12)t='rest';else{let r=Math.random(),acc=0;for(const k in W){acc+=W[k];if(r<acc){t=k;break;}}t=t||'combat';
   if(t==='elite'&&f!==7&&f!==9)t='combat'; if(t==='rest'&&(f===5||f===7||f===11))t='event';}
  if(force&&f===7)t='elite';if(force&&(f===5||f===10))t=c===1?'shop':'event';
  row.push({f,c,t,next:[]});}fl.push(row);}
 for(let f=0;f<11;f++)for(const n of fl[f]){n.next.push(n.c);if(n.c>0&&Math.random()<.5)n.next.push(n.c-1);if(n.c<2&&Math.random()<.5)n.next.push(n.c+1);}
 return fl;}
function repairMap(fl){for(let it=0;it<40;it++){if(mapOK(fl))return true;// 找一条不达标路径并就地修补
  const path=[];let n=pick(fl[0]);for(let f=1;f<=12;f++){path.push(n);if(f<12)n=fl[f][pick(n.next)];}
  const el=path.filter(x=>x.t==='elite').length,ev=path.filter(x=>x.t==='event'||x.t==='shop').length;
  if(!el){const c=path.filter(x=>x.f===7||x.f===9);pick(c).t='elite';}
  else if(ev<2){const c=path.filter(x=>x.f>=4&&x.f<=11&&x.f!==6&&x.t==='combat');if(c.length)pick(c).t=Math.random()<.75?'event':'shop';}}
 return mapOK(fl);}
function mapOK(fl){// 每条路径：精英≥1，奇遇/坊市≥2（自底向上取最小值）
 const m={};for(let f=12;f>=1;f--)for(const n of fl[f-1]){const e=n.t==='elite'?1:0,v=(n.t==='event'||n.t==='shop')?1:0;
  if(f===12){m[f+'-'+n.c]=[e,v];continue;}let me=99,mv=99;for(const c of n.next){const x=m[(f+1)+'-'+c];me=Math.min(me,x[0]);mv=Math.min(mv,x[1]);}m[f+'-'+n.c]=[e+me,v+mv];}
 return fl[0].every(n=>{const x=m['1-'+n.c];return x[0]>=1&&x[1]>=2;});}
function topBar(){return `<div class="top"><span>剑修 · 青岚</span><span>生命 <b>${G.hp}/${G.maxHp}</b></span><span>灵石 <b>${G.gold}</b></span><span>第 <b>${G.floor}</b> 层</span>
 <span>${G.relics.map(r=>`<i class="relic" style="background-image:url(img/${r}.jpg)" data-tip="${RELICS[r][0]}：${RELICS[r][1]}"></i>`).join('')}</span>
 <span>${[0,1,2].map(i=>{const p=G.potions[i];return p?`<i class="pot" onclick="usePotion(${i})" oncontextmenu="event.preventDefault();discardPotion(${i})" style="background-image:url(img/${p}.jpg)" data-tip="${POTIONS[p][0]}：${POTIONS[p][1]}${p!=='xuelian'?'\n（点击使用）':''}\n（右键丢弃）"></i>`:'<i class="pot empty"></i>';}).join('')}</span>
 ${G.daoxin?`<span>道心 <b>${DAOXIN[G.daoxin][0]}</b></span>`:''}<span class="sp"></span><span class="btn sm" onclick="viewDeck()">牌组 ${G.deck.length}</span></div>`;}
function viewDeck(pickCb,title){const m=document.createElement('div');m.className='modal';
 const list=pickCb?G.deck.filter(c=>title!=='选择一张卡升级'||!c.up):G.deck;
 m.innerHTML=`<h1 style="font-size:26px">${title||'牌组（'+G.deck.length+' 张）'}</h1><div class="grid">${list.map(c=>cardHTML(c)).join('')}</div><span class="btn" id="mclose">${pickCb?'取消':'关闭'}</span>`;
 app().appendChild(m);m.querySelector('#mclose').onclick=()=>m.remove();
 if(pickCb)m.querySelectorAll('.card').forEach(e=>e.onclick=()=>{const c=G.deck.find(x=>x.uid==e.dataset.uid);m.remove();pickCb(c);});}
function discardPotion(i){const p=G.potions[i];if(!p)return;const m=document.createElement('div');m.className='dimbg';m.innerHTML=`<div class="dialog"><img src="img/${p}.jpg"><h2>丢弃${POTIONS[p][0]}？</h2><div style="color:#bfae86;font-size:14px">${POTIONS[p][1]}<br>丢弃后无法找回。</div><div><span class="btn" id="dyes">丢弃</span><span class="btn" id="dno">取消</span></div></div>`;m.onclick=e=>{if(e.target===m)m.remove();};app().appendChild(m);m.querySelector('#dno').onclick=()=>m.remove();m.querySelector('#dyes').onclick=()=>{m.remove();G.potions.splice(i,1);toast(`已丢弃${POTIONS[p][0]}`);rerender();};}
function gainPotion(p){if(G.potions.length>=3){toast('丹药栏已满');return false;}G.potions.push(p);return true;}
function randPotion(){return pick(['huiyuan','ningshen','jingang','qingmu','ziyan']);}
function randRelic(){const pool=['hulu','zhong','yupei','fubi'].filter(r=>!G.relics.includes(r));return pool.length?pick(pool):null;}
const RARW={combat:[.60,.30,.10],elite:[.45,.40,.15]};
function randCard(rare,kind){const w=RARW[kind]||RARW.combat;const r=rare||(()=>{const x=Math.random();return x<w[0]?'common':x<w[0]+w[1]?'uncommon':'rare';})();return pick(CARDPOOL.filter(c=>c.rarity===r)).id;}
function cardChoices(kind){const s=new Set();while(s.size<3)s.add(randCard(null,kind));return [...s];}
function usePotion(i){const p=G.potions[i];if(!p||p==='xuelian')return;
 if(!B){if(p==='huiyuan'){G.hp=Math.min(G.maxHp,G.hp+15);G.potions.splice(i,1);teleUpd(r=>r.potionsUsed++);rerender();}else toast('只能在战斗中使用');return;}
 G.potions.splice(i,1);teleUpd(r=>r.potionsUsed++);potionEffect(p);renderBattle();}
function potionEffect(p){if(p==='huiyuan')G.hp=Math.min(G.maxHp,G.hp+15);if(p==='ningshen')B.energy+=2;if(p==='jingang')B.p.block+=12;if(p==='qingmu')draw(3);
 if(p==='ziyan')B.en.forEach(e=>{if(e.hp>0)addSt(e,'vulnerable',2);});log(`使用了${POTIONS[p][0]}`);}
let rerender=()=>{};
// ================= 主菜单 =================
function showMenu(){teleQuit();B=null;rerender=showMenu;app().innerHTML=`<div class="fullbg" style="background-image:url(img/mainmenu.jpg)"></div>
 <div style="position:absolute;left:0;right:0;bottom:90px;text-align:center"><span class="btn" style="font-size:24px;padding:14px 48px" onclick="newRun()">开始问道</span><br><span class="btn" style="font-size:15px;padding:6px 18px" onclick="showStats()">${stx('menuBtn')}</span><br>
 <span style="color:#bfae86;font-size:14px">第一幕 · 炼气期　|　剑修 · 70 生命 · 3 灵力　|　${VERSION}</span></div>`;}
// ================= 地图 =================
function reachable(){if(G.floor>=12)return [];if(!G.pos)return G.map[0];return G.map[G.pos.f-1][G.pos.c].next.map(c=>G.map[G.pos.f][c]);}
function showMap(){teleHp();B=null;rerender=showMap;const can=reachable();const H=13*68+150;const y=f=>H-60-(f-1)*68,x=c=>220+c*220;
 let lines='';G.map.forEach(row=>row.forEach(n=>{if(n.f<12)n.next.forEach(c=>lines+=`<line x1="${x(n.c)}" y1="${y(n.f)}" x2="${x(c)}" y2="${y(n.f+1)}" stroke="#8a7342" stroke-width="2" stroke-dasharray="6 5" opacity=".7"/>`);
  else lines+=`<line x1="${x(n.c)}" y1="${y(12)}" x2="440" y2="${y(13)}" stroke="#c33" stroke-width="2" stroke-dasharray="6 5" opacity=".6"/>`;}));
 let nodes='';G.map.forEach(row=>row.forEach(n=>{const cls=can.includes(n)?'can':(G.path||[]).includes(n.f+'-'+n.c)?'done':'';
  nodes+=`<div class="node ${cls} ${G.pos===n?'cur':''}" style="left:${x(n.c)}px;top:${y(n.f)}px" data-tt="${NODE[n.t][1]}" ${cls==='can'?`onclick="enterNode(${n.f},${n.c})"`:''}>${NODE[n.t][0]}<span class="nl">${NODE[n.t][1]}</span></div>`;}));
 nodes+=`<div class="node boss ${G.floor===12?'can':''}" style="left:440px;top:${y(13)}px" ${G.floor===12?'onclick="enterBoss()"':''}></div>`;
 app().innerHTML=topBar()+`<div class="mapwrap" id="mw"><div style="position:relative;height:${H}px"><svg width="880" height="${H}" style="position:absolute;left:0;top:0">${lines}</svg>${nodes}</div></div>
 <div class="legend panel">${['combat','elite','event','shop','rest'].map(k=>NODE[k][0]+' '+NODE[k][1]).join('<br>')}<br>👿 心魔（第 13 层）</div>
 <div class="panel" style="position:absolute;left:16px;top:70px;width:170px;font-size:14px;line-height:1.8">炼气期 · 第一幕<br>选择发光的节点前进。<br>第 6、12 层为洞府打坐，第 7、9 层可能遇到精英。</div>`;
 const mw=$('#mw');{let st=y(Math.min(G.floor+1,13))-(G.floor>=11?120:500);mw.scrollTop=st<220?0:st;}}
function enterNode(f,c){const n=G.map[f-1][c];G.pos=n;G.floor=f;(G.path=G.path||[]).push(f+'-'+c);TELE_LAST=null;teleFloor(f,n.t);
 ({combat:()=>startCombat(pick(f>=BAL.duoFloorFrom?DUO:SOLO),f>=BAL.duoFloorFrom?BAL.duoEnemyScale:1,'combat'),elite:()=>startCombat([pick(['python','ghost'])],1,'elite'),event:showEvent,shop:showShop,rest:showRest})[n.t]();}
function enterBoss(){G.floor=13;teleBoss();teleFloor(13,'boss');startCombat(['xinmo'],1,'boss');}
// ================= 战斗 =================
function addSt(u,k,v){u.st[k]=(u.st[k]||0)+v;}
function log(t){if(/造成 0 点伤害/.test(t))return;if(B){B.log.unshift(t);B.log.length=Math.min(B.log.length,8);}}
function startCombat(ids,scale,kind){
 TELE_LAST={kind,enemies:ids.slice()};
 B={kind,en:ids.map((id,i)=>{const d=ENEMIES[id];const hp=Math.round(d.hp*scale);return {id,i,name:d.name,hp,max:hp,block:0,st:{},mi:0,scale,moves:d.moves,img:d.img,siUsed:false};}),
  p:{block:0,st:{}},draw:shuffle(G.deck.map(c=>c)),hand:[],disc:[],exh:[],energy:0,lastEl:null,firstMetal:false,turn:0,log:[],target:0,over:false};
 if(G.relics.includes('hulu')){const p=randPotion();potionEffectPre(p);}
 if(G.daoxin==='jianxin')addSt(B.p,'swordIntent',2);
 startTurn();}
function potionEffectPre(p){B.pre=p;if(p==='huiyuan')G.hp=Math.min(G.maxHp,G.hp+15);if(p==='jingang')B.preBlock=12;if(p==='ziyan')B.en.forEach(e=>addSt(e,'vulnerable',2));if(p==='ningshen')B.preEnergy=2;if(p==='qingmu')B.preDraw=3;log(`赤金葫芦：获得${POTIONS[p][0]}的效果`);}
function draw(n){for(let i=0;i<n;i++){if(!B.draw.length){if(!B.disc.length)return;B.draw=shuffle(B.disc);B.disc=[];}if(B.hand.length>=10){B.disc.push(B.draw.pop());continue;}B.hand.push(B.draw.pop());}}
function startTurn(){B.turn++;B.p.block=0;B.zhong=false;B.lastEl=null;
 if(B.turn===1&&B.preBlock)B.p.block+=B.preBlock;
 if(B.p.st.burn){hurtPlayer(B.p.st.burn,true);B.p.st.burn--;log(`灼烧：受到伤害`);if(checkEnd())return;}
 B.energy=G.energyMax+(B.turn===1&&B.preEnergy?B.preEnergy:0);
 let n=G.drawN-(G.daoxin==='lingmai'?1:0);if(B.turn===1){if(G.relics.includes('fubi'))n+=2;if(B.preDraw)n+=B.preDraw;}
 draw(n);renderBattle();}
function living(){return B.en.filter(e=>e.hp>0);}
function intentOf(e){const m=e.moves[e.mi%e.moves.length];return m;}
function enemyAtk(e,m,later,raw){const base=Math.round(m.d*e.scale)+(e.st.strength||0)+(e.st.swordIntent||0);let v=base;if(B.p.st.vulnerable&&!raw)v=Math.floor(v*1.5);if(e.st.freeze&&!later)v=Math.floor(v/2);return v;}
function intentHTML(e){const m=intentOf(e);let ic,tx,warn=false;
 if(m.t==='atk'){ic='attack';tx=(m.name?m.name+' · ':'')+(e.st.freeze?'❄':'')+enemyAtk(e,m,false,true)+(m.n>1?'×'+m.n:'');if(m.burn)tx+=` +灼烧${m.burn}`;if(m.vuln)tx+=` +易伤${m.vuln}`;if(m.name)warn=true;}
 else if(m.t==='def'){ic='defend';tx='护体 '+bossBlock(e,m);if(m.str)tx+=` +力量${m.str}`;if(m.si&&!e.siUsed)tx+=` +剑意${m.si}`;}
 else if(m.t==='buff'){ic='strength';tx=`${m.name}：力量+${m.str}`;}
 else{ic='debuff';tx=`施加易伤 ${m.vuln}`;}
 let w='';if(m.warn){w=`<div class="intent warn">⚠ 下回合心魔蓄力 · ${enemyAtk(e,e.moves[(e.mi+1)%e.moves.length],true,true)} 伤害</div><br>`;}
 return w+`<div class="intent ${warn?'warn':''}"><img src="img/icons/64/${ic}.png">${tx}</div>`;}
function predictNext(){let tot=0;for(const e of living()){const m=e.moves[(e.mi+1)%e.moves.length];if(m.t!=='atk')continue;const v=enemyAtk(e,m,true);tot+=v*m.n;}return tot;}
function predictIncoming(){let tot=0,first=null;for(const e of living()){const m=intentOf(e);if(m.t!=='atk')continue;const v=enemyAtk(e,m);for(let h=0;h<m.n;h++){if(first===null)first=v;tot+=v;}}
 if(G.relics.includes('zhong')&&!B.zhong&&first)tot-=Math.min(3,first);return Math.max(0,tot-B.p.block);}
function bossBlock(e,m){let b=Math.round(m.b*e.scale);if(e.id==='xinmo'&&G.relics.includes('jing'))b=Math.floor(b/2);return b;}
function stHTML(u){return `<div class="stat">${Object.entries(u.st).filter(([k,v])=>v>0).map(([k,v])=>`<span data-tt="${STATUS[k][2]}"><img src="img/icons/64/${STATUS[k][1]}.png">${STATUS[k][0]} ${v}</span>`).join('')}</div>`;}
function isSheng(d){return B.lastEl&&GEN[B.lastEl]===d.element;}
const WPOS={wood:[128.5,41.5],fire:[212,100.5],earth:[180.5,200.5],metal:[75.5,200.5],water:[44,100.5]};
function shengTip(from,to){if(localStorage.getItem('wd_shengTip'))return;localStorage.setItem('wd_shengTip','1');B.tip=`<b>相生！${ELN[from]}生${ELN[to]}</b><br>上一张是${ELN[from]}属性，这张${ELN[to]}属性卡获得加成。<br><small>五行相生顺序：木→火→土→金→水→木（点击关闭）</small>`;drawTip();}
function drawTip(){if(!B||!B.tip||document.querySelector('.shengtip'))return;const e=document.createElement('div');e.className='shengtip';e.innerHTML=B.tip+'<span class="tipx">✕</span>';e.onclick=()=>{if(B)B.tip=null;e.remove();};app().appendChild(e);}
function wheelSVG(){const nxt=B.lastEl?GEN[B.lastEl]:null;
 let h=`<div class="wheel"><img src="img/wuxing/wuxing_base.png">`;
 if(B.flashArrow){const [a,b]=B.flashArrow.map(k=>WPOS[k]);h+=`<svg class="warrow" viewBox="0 0 256 256"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/></svg>`;}
 if(B.lastEl)h+=`<img class="cur" src="img/wuxing/wuxing_node_${ELK[B.lastEl]}_lit.png">`;
 if(nxt)h+=`<img class="nxt" src="img/wuxing/wuxing_node_${ELK[nxt]}_lit.png">`;
 return h+`<div class="wl">${nxt?'下一相生：'+ELN[nxt]:'五行相生'}</div></div>`;}
function renderBattle(){if(!B)return;rerender=renderBattle;const lv=living();if(!lv.includes(B.en[B.target]))B.target=lv.length?lv[0].i:0;
 const ex=[];
 const en=B.en.map((e,k)=>{const d=ENEMIES[e.id];const w=d.boss?340:300;const left=B.en.length===1?(d.boss?720:760):620+k*290;
  return `<div class="unit enemy ${e.hp<=0?'dead':''} ${B.target===k&&lv.length>1?'tgt':''} ${d.boss?'bossu':''}" style="left:${left}px;width:${w}px" onclick="setTarget(${k})" id="en${k}">${e.hp>0?intentHTML(e):''}
  <div class="fig" style="width:${w}px;height:${w}px;background-image:url(img/${e.img}.png)"></div>
  <div><b>${e.name}</b>${e.block?`<span class="eblk">${e.block}</span>`:''}</div><div class="hpb"><i style="width:${100*Math.max(0,e.hp)/e.max}%"></i></div><div>${Math.max(0,e.hp)} / ${e.max}</div>${stHTML(e)}</div>`;}).join('');
 const hand=B.hand.map((c,i)=>{const d=def(c);const ok=d.cost<=B.energy;return cardHTML(c,(isSheng(d)?'sheng ':'')+(ok?'':'nope')).replace('class="card','onclick="playCard('+i+')" class="card');}).join('');
 app().innerHTML=topBar()+`<div class="bg"></div><div class="log">${B.log.join('<br>')}</div>${wheelSVG()}
 <div class="unit" style="left:150px;width:300px" id="pl"><div class="fig" style="width:300px;height:300px;background-image:url(img/jianxiu_${B.pose||'idle'}.png)"></div>
 <div><b>青岚</b>${B.p.block?`<span class="blkv">🛡${B.p.block}</span>`:''}</div><div class="hpb"><i style="width:${100*G.hp/G.maxHp}%"></i></div><div>${G.hp} / ${G.maxHp}</div>${(()=>{const x=predictIncoming();const atk=living().some(e=>intentOf(e).t==='atk');if(!atk&&living().some(e=>intentOf(e).warn)){return `<div class="predict">下回合预计受到 ${predictNext()} 点伤害</div>`;}return `<div class="predict ${x?'':'safe'}">预计受到 ${x} 点伤害</div>`;})()}${stHTML(B.p)}</div>
 ${en}<div class="energy">${B.energy}<small>灵力 ${B.energy}/${G.energyMax}</small></div>
 <div class="pile" style="left:20px" onclick="">抽牌堆<br>${B.draw.length}</div><div class="pile" style="right:20px">弃牌堆 ${B.disc.length}<br>消耗 ${B.exh.length}</div>
 <span class="btn endbtn" onclick="endTurn()">结束回合</span><div class="hand" style="--hm:${Math.min(-6,Math.floor((930-150*B.hand.length)/(2*B.hand.length)))}px">${hand}</div>`;drawTip();}
function setPose(p,ms=450){if(!B)return;B.pose=p;clearTimeout(B.poseT);const el=document.querySelector('#pl .fig');if(el)el.style.backgroundImage=`url(img/jianxiu_${p}.png)`;B.poseT=setTimeout(()=>{if(!B)return;B.pose='idle';const f=document.querySelector('#pl .fig');if(f)f.style.backgroundImage='url(img/jianxiu_idle.png)';},ms);}
function setTarget(k){if(B.en[k].hp>0){B.target=k;renderBattle();}}
function floatAt(id,t,col){const el=document.getElementById(id);if(!el)return;const r=el.getBoundingClientRect(),a=app().getBoundingClientRect();const f=document.createElement('div');f.className='float';f.textContent=t;if(col)f.style.color=col;f.style.left=(r.left-a.left+r.width/2-20)+'px';f.style.top=(r.top-a.top+60)+'px';app().appendChild(f);setTimeout(()=>f.remove(),900);}
function hitEnemy(e,v){if(e.st.vulnerable)v=Math.floor(v*1.5);const ab=Math.min(e.block,v);e.block-=ab;e.hp-=v-ab;B.fx.push(['en'+e.i,'-'+(v-ab)]);}
function mergeActs(d,sheng){const acts=d.actions.map(a=>Object.assign({},a));if(sheng)for(const b of d.onShengBonus||[]){const t=acts.find(a=>a.op===b.op&&(b.op==='damage'||b.op==='block'||b.op==='draw'||b.op==='heal'));if(t)t.value+=b.value;else acts.push(Object.assign({},b));}return acts;}
function playCard(i){if(B.over)return;const c=B.hand[i],d=def(c);if(d.cost>B.energy){toast('灵力不足');return;}
 const sheng=isSheng(d);const prevEl=B.lastEl;B.flashArrow=sheng?[prevEl,d.element]:null;B.energy-=d.cost;B.hand.splice(i,1);B.fx=[];const hadAura=B.p.st.swordIntentAura||0;
 let tgt=B.en[B.target];if(!tgt||tgt.hp<=0)tgt=living()[0];
 let bonus=0;if(d.element==='metal'&&!B.firstMetal){B.firstMetal=true;if(G.relics.includes('qingfeng')&&d.actions.some(a=>a.op==='damage'))bonus=3;}
 if(sheng)teleUpd(r=>r.shengCount++);log(`打出 ${d.name}${c.up?'+':''}${sheng?'（相生！）':''}`);
 for(const a of mergeActs(d,sheng)){
  if(a.op==='damage'){const n=a.times==='swordIntent'?(B.p.st.swordIntent||0):(a.times||1);for(let h=0;h<n;h++){if(!tgt||tgt.hp<=0)tgt=living()[0];if(!tgt)break;hitEnemy(tgt,a.value+bonus+(B.p.st.swordIntent||0));}bonus=0;}
  else if(a.op==='block')B.p.block+=a.value;
  else if(a.op==='heal')G.hp=Math.min(G.maxHp,G.hp+a.value);
  else if(a.op==='draw')draw(a.value);
  else if(a.op==='gainEnergy')B.energy+=a.value;
  else if(a.op==='selfDamage'){G.hp-=a.value;B.fx.push(['pl','-'+a.value]);}
  else if(a.op==='applyStatus'){const self=a.target==='self'||a.status==='swordIntent'||a.status==='swordIntentAura';if(self)addSt(B.p,a.status,a.value);else if(tgt&&tgt.hp>0)addSt(tgt,a.status,a.value);}
 }
 if(d.element==='metal'&&hadAura)addSt(B.p,'swordIntent',hadAura);
 if(sheng&&G.relics.includes('yupei')&&Math.random()<.25){draw(1);log('五行玉佩：抽 1 张牌');}
 B.lastEl=d.element;
 if(d.type==='power');else if(d.exhaust)B.exh.push(c);else B.disc.push(c);
 const fx=B.fx;renderBattle();B.flashArrow=null;if(sheng)shengTip(prevEl,d.element);if(d.type==='attack')setPose('attack');fx.forEach(f=>floatAt(f[0],f[1]));checkEnd();}
function hurtPlayer(v,ignoreBlock){if(!B.zhong&&G.relics.includes('zhong')&&v>0){B.zhong=true;v=Math.max(0,v-3);}
 let ab=ignoreBlock?0:Math.min(B.p.block,v);B.p.block-=ab;G.hp-=v-ab;if(v-ab>0&&B)B.hitThisTurn=1;
 if(G.hp<=0&&G.potions.includes('xuelian')){G.potions.splice(G.potions.indexOf('xuelian'),1);G.hp=Math.floor(G.maxHp*.3);log('雪莲丹：起死回生！');}
 return v-ab;}
function endTurn(){if(B.over)return;B.disc.push(...B.hand);B.hand=[];
 for(const e of B.en){if(e.hp<=0)continue;e.block=0;
  if(e.st.burn){e.hp-=e.st.burn;log(`${e.name} 灼烧受到 ${e.st.burn} 点伤害`);e.st.burn--;if(e.hp<=0)continue;}
  const m=intentOf(e);
  if(m.t==='atk'){let tot=0;for(let h=0;h<m.n;h++)tot+=hurtPlayer(enemyAtk(e,m));if(e.st.freeze)e.st.freeze=0;log(`${e.name}${m.name?'【'+m.name+'】':''} 造成 ${tot} 点伤害`);if(m.burn)addSt(B.p,'burn',Math.round(m.burn*e.scale)||1);if(m.vuln)addSt(B.p,'vulnerable',m.vuln);}
  else if(m.t==='def'){e.block+=bossBlock(e,m);if(m.str)addSt(e,'strength',m.str);if(m.si&&!e.siUsed){addSt(e,'swordIntent',m.si);e.siUsed=true;}log(`${e.name} 获得护体真气`);}
  else if(m.t==='buff'){addSt(e,'strength',m.str);log(`${e.name}【${m.name}】力量 +${m.str}`);}
  else {addSt(B.p,'vulnerable',m.vuln);log(`${e.name} 施加 ${m.vuln} 层易伤`);}
  e.mi++;if(e.st.vulnerable)e.st.vulnerable--;
  if(G.hp<=0)break;}
 if(B.p.st.vulnerable)B.p.st.vulnerable--;
 if(checkEnd())return;const hit=B.hitThisTurn;B.hitThisTurn=0;startTurn();const p=$('#pl');if(p)p.classList.add('shake');if(hit)setPose('hit',600);}
function checkEnd(){if(B.over)return true;
 if(G.hp<=0){B.over=true;setTimeout(showDefeat,500);return true;}
 if(!living().length){B.over=true;setTimeout(()=>combatWon(B.kind),500);return true;}return false;}
// ================= 奖励 =================
function combatWon(kind){B=null;if(kind==='boss')return showVictory();
 const rw={gold:kind==='elite'?ri(25,35):ri(10,20),cards:cardChoices(kind),potion:Math.random()<.4?randPotion():null,relic:kind==='elite'?randRelic():null,elite:kind==='elite',taken:{}};
 rw.taken.gold=1;G.gold+=rw.gold;G.reward=rw;showReward();}
function showReward(){rerender=showReward;const rw=G.reward;let items='';
 items+=`<div class="item" style="cursor:default"><span style="font-size:30px">💎</span> 获得 ${rw.gold} 灵石 <small style="color:#9fe6a0">（已入账）</small></div>`;
 if(rw.potion&&!rw.taken.potion){if(rw.replacing)items+=`<div class="item relicrow" style="flex-direction:column;align-items:stretch;cursor:default"><div><img src="img/${rw.potion}.jpg" style="vertical-align:middle"> 丹药栏已满，用${POTIONS[rw.potion][0]}替换哪一瓶？</div><div class="row" style="gap:8px">${G.potions.map((p,i)=>`<span class="btn sm" onclick="replacePotion(${i})">替换 ${POTIONS[p][0]}</span>`).join('')}<span class="btn sm" onclick="dropNewPotion()">丢弃新丹药</span></div></div>`;
  else items+=`<div class="item" onclick="takeR('potion')"><img src="img/${rw.potion}.jpg">${POTIONS[rw.potion][0]}：${POTIONS[rw.potion][1]}${G.potions.length>=3?' <small style="color:#ffb070">（丹药栏已满）</small>':''}</div>`;}
 if(rw.relic&&!rw.taken.relic)items+=`<div class="item relicrow" onclick="takeR('relic')"><img src="img/${rw.relic}.jpg">法宝 · ${RELICS[rw.relic][0]}：${RELICS[rw.relic][1]}</div>`;
 const cards=rw.taken.card?'':`<div style="color:#e8c66a">选择一张卡加入牌组</div><div class="row">${rw.cards.map((id,i)=>cardHTML({id,uid:'r'+i}).replace('class="card',`onclick="takeCard(${i})" class="card`)).join('')}</div>`;
 app().innerHTML=topBar()+`<div class="center"><h1>${rw.elite?'妖王伏诛':'战斗胜利'}</h1><div style="display:flex;flex-direction:column;gap:8px">${items}</div>${cards}
 <div><span class="btn" onclick="showMap()">${rw.taken.card?'继续前进':'跳过选卡，继续前进'}</span></div></div>`;}
function takeR(k){const rw=G.reward;if(k==='gold')G.gold+=rw.gold;if(k==='potion'&&G.potions.length>=3){rw.replacing=1;showReward();return;}if(k==='potion')G.potions.push(rw.potion);if(k==='relic')G.relics.push(rw.relic);rw.taken[k]=1;showReward();}
function replacePotion(i){const rw=G.reward;G.potions[i]=rw.potion;rw.taken.potion=1;rw.replacing=0;showReward();}
function dropNewPotion(){const rw=G.reward;rw.taken.potion=1;rw.replacing=0;showReward();}
function takeCard(i){G.deck.push(mkCard(G.reward.cards[i]));G.reward.taken.card=1;showReward();}
// ================= 坊市 =================
function showShop(){const prices={common:45,uncommon:70,rare:120};
 const cards=[];const s=new Set();while(s.size<5)s.add(randCard());[...s].forEach(id=>cards.push({id,price:prices[CARDS[id].rarity]}));
 const rel=[];const pool=['hulu','zhong','yupei','fubi'].filter(r=>!G.relics.includes(r));shuffle(pool).slice(0,2).forEach(r=>rel.push({r,price:ri(130,160)}));
 const pots=[randPotion(),randPotion(),'xuelian'].map(p=>({p,price:POTIONS[p][2]}));
 G.shop={cards,rel,pots,removed:false};renderShop();}
function renderShop(){rerender=renderShop;const S=G.shop;
 app().innerHTML=topBar()+`<div class="center" style="justify-content:flex-start;padding-top:20px"><h1 style="font-size:30px">🏮 坊市</h1>
 <div class="row" style="gap:18px">${S.cards.map((c,i)=>`<div class="shopcell ${c.sold?'sold':''}" onclick="buy('cards',${i})">${cardHTML({id:c.id,uid:'s'+i})}<div class="price">💎 ${c.price}</div></div>`).join('')}</div>
 <div class="row" style="gap:14px;margin-top:10px">${S.rel.map((r,i)=>`<div class="item ${r.sold?'sold':''}" style="min-width:250px;${r.sold?'opacity:.25':''}" onclick="buy('rel',${i})"><img src="img/${r.r}.jpg"><div><b>${RELICS[r.r][0]}</b> 💎${r.price}<br><small>${RELICS[r.r][1]}</small></div></div>`).join('')}
 ${S.pots.map((p,i)=>`<div class="item" style="min-width:200px;${p.sold?'opacity:.25':''}" onclick="buy('pots',${i})"><img src="img/${p.p}.jpg"><div><b>${POTIONS[p.p][0]}</b> 💎${p.price}<br><small>${POTIONS[p.p][1]}</small></div></div>`).join('')}</div>
 <div><span class="btn ${S.removed||G.gold<removePrice()?'dis':''}" onclick="shopRemove()">删除一张卡 · 💎${removePrice()}</span><span class="btn" onclick="showMap()">离开坊市</span></div></div>`;}
function buy(k,i){const it=G.shop[k][i];if(it.sold)return;if(G.gold<it.price){toast('灵石不足');return;}
 if(k==='pots'&&!gainPotion(it.p))return;if(k==='cards')G.deck.push(mkCard(it.id));if(k==='rel')G.relics.push(it.r);G.gold-=it.price;it.sold=1;renderShop();}
function removePrice(){return 50+25*G.removeCount;}
function shopRemove(){const p=removePrice();if(G.shop.removed||G.gold<p)return;viewDeck(c=>{G.deck=G.deck.filter(x=>x!==c);G.gold-=p;G.removeCount++;G.shop.removed=true;renderShop();},'选择一张卡删除');}
// ================= 洞府打坐 =================
function showRest(){rerender=showRest;const h=Math.floor(G.maxHp*BAL.restHealPct);
 app().innerHTML=topBar()+`<div class="fullbg" style="background-image:url(img/rest.jpg);filter:brightness(.75)"></div><div style="position:absolute;left:319px;top:232px;width:300px;height:300px;background:url(img/jianxiu_idle.png) bottom center/contain no-repeat;filter:drop-shadow(0 0 12px rgba(160,255,200,.35))"></div><div class="center" style="left:640px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.45) 30%)"><h1>🔥 洞府打坐</h1>
 <div class="row"><div class="panel restbtn" style="width:280px;text-align:center;cursor:pointer" onclick="restHeal()"><div style="font-size:60px">🧘</div><h2>调息</h2>回复 ${h} 点生命（${Math.round(BAL.restHealPct*100)}%）</div>
 <div class="panel restbtn" style="width:280px;text-align:center;cursor:pointer" onclick="restUp()"><div style="font-size:60px">📜</div><h2>参悟</h2>升级一张卡</div></div></div>`;}
function restHeal(){teleUpd(r=>r.restChoices.push('heal'));G.hp=Math.min(G.maxHp,G.hp+Math.floor(G.maxHp*BAL.restHealPct));showMap();}
function restUp(){if(!G.deck.some(c=>!c.up)){toast('没有可升级的卡');return;}viewDeck(c=>{c.up=true;teleUpd(r=>r.restChoices.push('upgrade'));toast(def(c).name+' 已升级');showMap();},'选择一张卡升级');}
// ================= 奇遇 =================
let EVT={},SCR={}; // config/events.json、config/screens.json
const fmt=(t,v={})=>String(t).replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const EO=(k,i)=>EVT[k].options[i];
const EVENTS={ // 选项逻辑；文案在 config/events.json
 dongfu:[()=>{G.hp=Math.max(1,G.hp-8);const r=(G.floor>=10&&!G.relics.includes('jing'))?'jing':randRelic();if(r){G.relics.push(r);return fmt(EO('dongfu',0).result,{relic:RELICS[r][0],relicDesc:RELICS[r][1]});}G.gold+=50;return EO('dongfu',0).resultNone;},()=>EO('dongfu',1).result],
 lingquan:[()=>{G.hp=Math.min(G.maxHp,G.hp+20);return EO('lingquan',0).result;},()=>'UPGRADE'],
 sanxiu:[()=>{if(G.gold<30)return null;G.gold-=30;const id=randCard('rare');G.deck.push(mkCard(id));return fmt(EO('sanxiu',0).result,{card:CARDS[id].name});},()=>EO('sanxiu',1).result],
 huanjing:[()=>'REMOVE',()=>EO('huanjing',1).result],
 dushi:[()=>{if(G.gold<20)return null;G.gold-=20;if(Math.random()<.5){G.gold+=60;return EO('dushi',0).result;}return EO('dushi',0).resultLose;},()=>EO('dushi',1).result],
};
function showEvent(key){key=typeof key==='string'?key:pick(Object.keys(EVENTS));const ev=EVT[key];rerender=()=>showEvent(key);
 app().innerHTML=topBar()+`<div style="position:absolute;top:44px;left:0;width:620px;bottom:0;background:url(img/event.jpg) left bottom/auto 118% no-repeat"></div>
 <div style="position:absolute;top:44px;left:620px;right:0;bottom:0;padding:70px 60px;background:linear-gradient(90deg,rgba(14,19,26,.6),#0e131a 15%)">
 <h1 style="text-align:left">${ev.title}</h1><p style="font-size:18px;line-height:1.9;color:#d8ccb0" id="evtext">${ev.text}</p><div id="evopts">
 ${ev.options.map((o,i)=>`<div class="item evbtn" style="margin:12px 0" onclick="evPick('${key}',${i})">【${i+1}】${o.label}</div>`).join('')}</div></div>`;}
function evPick(key,i){const r=EVENTS[key][i]();
 if(r===null){toast(EO(key,i).fail||'灵石不足');return;}
 const done=t=>{rerender=showMap;$('#evtext').innerHTML=t;$('#evopts').innerHTML=`<span class="btn" onclick="showMap()">${EVT._common.continue}</span>`;};
 if(r==='UPGRADE'){viewDeck(c=>{c.up=true;showEvent(key);done(fmt(EO(key,1).result,{card:def(c).name}));},EVT[key].pickTitle);return;}
 if(r==='REMOVE'){viewDeck(c=>{G.deck=G.deck.filter(x=>x!==c);G.hp=Math.max(1,G.hp-5);showEvent(key);done(fmt(EO(key,0).result,{card:def(c).name}));},EVT[key].pickTitle);return;}
 done(r);const tb=$('.top');if(tb)tb.outerHTML=topBar();}
// ================= 结算 =================
function showVictory(){rerender=showVictory;teleEnd('win');app().innerHTML=`<div class="fullbg" style="background:url(img/result.jpg) left top/200% auto;filter:brightness(.3)"></div>
 <div class="center" style="top:0"><h1 style="font-size:52px">${SCR.breakthrough.title}</h1><div style="color:#bfae86">${fmt(SCR.breakthrough.sub,{hp:`<b style="color:#e8c66a">${G.hp}</b>`,maxHp:`<b style="color:#e8c66a">${G.maxHp}</b>`})}</div>
 <div class="row">${Object.entries(DAOXIN).map(([k,v])=>`<div class="panel" style="width:260px;text-align:center;cursor:pointer;border-color:#e8c66a;background:rgba(0,0,0,.75)" onclick="pickDao('${k}')"><h2 style="color:#e8c66a">${v[0]}</h2>${v[1]}<div style="color:#bfae86;font-size:13px;margin-top:8px">${v[2]}</div></div>`).join('')}</div></div>`;}
function pickDao(k){G.daoxin=k;if(TELE_CUR&&!TELE_OFF){const a=teleLoad(),r=a.find(x=>x.runId===TELE_CUR);if(r){r.daoxin=k;teleSave(a);}}TELE_CUR=null;if(k==='lingmai')G.energyMax++;if(k==='daoji'){G.maxHp+=15;G.hp=G.maxHp;}
 app().innerHTML=`<div class="fullbg" style="background:url(img/result.jpg) left top/200% auto;filter:brightness(.3)"></div><div class="center" style="top:0"><h1 style="font-size:46px">${SCR.clear.title}</h1>
 <div style="font-size:20px">${fmt(SCR.clear.stats,{daoxin:DAOXIN[k][0],deck:G.deck.length,relics:G.relics.length,gold:G.gold})}</div><div style="color:#bfae86">${SCR.clear.teaser}</div><span class="btn" onclick="showMenu()">${SCR.clear.btn}</span></div>`;}
function showDefeat(){teleEnd('dead');B=null;rerender=showDefeat;app().innerHTML=`<div class="fullbg" style="background:url(img/result.jpg) 100% 0/212% auto;filter:brightness(.35)"></div>
 <div class="center" style="top:0"><h1 style="font-size:52px;color:#c44">${SCR.defeat.title}</h1><div style="font-size:20px">${fmt(SCR.defeat.stats,{floor:G.floor,deck:G.deck.length,gold:G.gold})}</div>
 <div style="color:#bfae86">${SCR.defeat.sub}</div><span class="btn" onclick="newRun()">${SCR.defeat.btnRestart}</span><span class="btn" onclick="showMenu()">${SCR.defeat.btnMenu}</span></div>`;}
// ================= 试玩数据（本地记录，localStorage） =================
const TELE_KEY='wd_runs_v2',TELE_MAX=500;let TELE_OFF=false,TELE_LAST=null,TELE_CUR=null;
// v2（v0.3.2 起）：按设计口径 playtest_metrics.md 重新定义字段；旧 wd_runs_v1 字段不兼容，不再读取（保留在本地不删除）
const STX_DEF={menuBtn:'试玩数据',title:'试玩数据（本机）',runs:'局数',winRate:'通关率',bossHp:'进心魔时平均血量',reachBoss:'进入心魔',deaths:'每层陨落次数',none:'暂无记录',export:'导出 JSON',clear:'清空记录',back:'返回',confirmClear:'确定清空全部试玩记录？',floor:'层',recent:'最近对局'};
function stx(k){return (SCR&&SCR.stats&&SCR.stats[k])||STX_DEF[k];}
function teleLoad(){try{const a=JSON.parse(localStorage.getItem(TELE_KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function teleSave(a){try{localStorage.setItem(TELE_KEY,JSON.stringify(a.slice(-TELE_MAX)));}catch(e){}}
function teleUpd(fn){if(TELE_OFF||!TELE_CUR)return;const a=teleLoad();const r=a.find(x=>x.runId===TELE_CUR);if(!r||r.result)return;fn(r);teleSave(a);}
function teleStart(){if(TELE_OFF)return;teleQuit();const now=new Date();TELE_CUR=now.getTime().toString(36)+'-'+Math.floor(performance.now()%1e6).toString(36);
 const a=teleLoad();a.push({runId:TELE_CUR,version:VERSION,startedAt:now.toISOString(),endedAt:null,result:null,deathFloor:null,deathEnemy:null,hpPerFloor:[],hpEnterBoss:null,restChoices:[],potionsUsed:0,shengCount:0,deck:[],relics:[],daoxin:null,maxHp:G.maxHp,path:[]});teleSave(a);}
function teleSnap(r){r.deck=G.deck.map(c=>c.id+(c.up?'+':''));r.relics=G.relics.slice();r.daoxin=G.daoxin||null;r.maxHp=G.maxHp;}
function teleHp(){if(G&&G.floor>0)teleUpd(r=>{r.hpPerFloor[G.floor-1]=Math.max(0,G.hp);});}
function teleFloor(f,t){teleUpd(r=>{r.path.push(t);});}
function teleBoss(){teleUpd(r=>{r.hpEnterBoss=G.hp;});}
function teleEnd(res){teleUpd(r=>{r.result=res;r.endedAt=new Date().toISOString();if(G.floor>0)r.hpPerFloor[G.floor-1]=Math.max(0,G.hp);teleSnap(r);
 if(res==='dead'){r.deathFloor=G.floor;r.deathEnemy=TELE_LAST?TELE_LAST.enemies.join('+'):'event';}});if(res!=='win')TELE_CUR=null;}
function teleQuit(){if(TELE_CUR)teleEnd('quit');TELE_CUR=null;}
window.addEventListener('beforeunload',()=>{try{teleQuit();}catch(e){}});
function teleStats(){const a=teleLoad(),done=a.filter(r=>r.result==='win'||r.result==='dead'),w=done.filter(r=>r.result==='win').length,be=done.filter(r=>r.hpEnterBoss!=null);
 const deaths={};done.filter(r=>r.result==='dead').forEach(r=>{deaths[r.deathFloor]=(deaths[r.deathFloor]||0)+1;});const preBoss=done.filter(r=>r.result==='dead'&&r.deathFloor<13).length;
 const sc=done.reduce((s,r)=>s+r.shengCount,0);
 return {runs:a.length,finished:done.length,quits:a.filter(r=>r.result==='quit').length,wins:w,winRate:done.length?w/done.length:null,reachBoss:be.length,meanBossHp:be.length?be.reduce((s,r)=>s+r.hpEnterBoss,0)/be.length:null,preBossDeathRate:done.length?preBoss/done.length:null,shengPerRun:done.length?sc/done.length:null,deathsByFloor:deaths};}
function showStats(){B=null;rerender=showStats;const S=teleStats(),a=teleLoad();const pct=x=>x===null?'—':(x*100).toFixed(1)+'%';
 const mx=Math.max(1,...Object.values(S.deathsByFloor));
 const bars=Array.from({length:13},(_,i)=>i+1).map(f=>{const n=S.deathsByFloor[f]||0;return `<div style="display:flex;align-items:center;gap:8px;font-size:14px"><span style="width:52px;text-align:right">${f} ${stx('floor')}</span><span style="display:inline-block;height:12px;width:${n/mx*300}px;background:#c44"></span><span>${n}</span></div>`;}).join('');
 const recent=a.slice(-8).reverse().map(r=>`<div style="font-size:13px;color:#bfae86">${(d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'))(new Date(r.startedAt))}　${r.result==='win'?'通关':r.result==='dead'?'陨落于第 '+r.deathFloor+' 层（'+(r.deathEnemy==='event'?'事件':String(r.deathEnemy).split('+').map(e=>ENEMIES[e]?ENEMIES[e].name:e).join('、'))+'）':r.result==='quit'?'中途退出':'进行中'}${r.hpEnterBoss!=null?'　心魔前 '+r.hpEnterBoss:''}　相生 ${r.shengCount}　用药 ${r.potionsUsed}</div>`).join('');
 app().innerHTML=`<div class="fullbg" style="background-image:url(img/mainmenu.jpg);filter:brightness(.3)"></div><div class="center" style="top:0"><h1>${stx('title')}</h1>
 <div class="panel" id="statsbox" style="width:760px;background:rgba(0,0,0,.75);text-align:left">${a.length?`<div style="font-size:18px">${stx('runs')} <b>${S.runs}</b>（计入 ${S.finished}，中途退出 ${S.quits}）　|　${stx('winRate')} <b>${pct(S.winRate)}</b>　|　${stx('reachBoss')} <b>${S.reachBoss}</b>　|　${stx('bossHp')} <b>${S.meanBossHp===null?'—':S.meanBossHp.toFixed(1)}</b></div>
 <h3 style="margin:10px 0 4px">${stx('deaths')}</h3>${bars}<h3 style="margin:10px 0 4px">${stx('recent')}</h3>${recent}`:stx('none')}</div>
 <div><span class="btn" id="stexp" onclick="teleExport()">${stx('export')}</span><span class="btn" onclick="teleClear()">${stx('clear')}</span><span class="btn" onclick="showMenu()">${stx('back')}</span></div></div>`;}
function teleExport(){const data={exported:new Date().toISOString(),version:VERSION,summary:teleStats(),runs:teleLoad()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));
 const l=document.createElement('a');l.href=url;const d=new Date(),z=n=>String(n).padStart(2,'0');l.download=`stats_${VERSION}_${d.getFullYear()}${z(d.getMonth()+1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}.json`;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function teleClear(){if(!confirm(stx('confirmClear')))return;localStorage.removeItem(TELE_KEY);showStats();}
// ================= 启动（#test=xxx 用于截图） =================
function fitApp(){const a=app();if(!a)return;const k=Math.min(innerWidth/1280,innerHeight/800);a.style.transform=`scale(${k})`;a.style.left=((innerWidth-1280*k)/2)+'px';a.style.top=((innerHeight-800*k)/2)+'px';}
window.addEventListener('resize',fitApp);fitApp();
function ttInit(){const tt=document.createElement('div');tt.id='tt';document.body.appendChild(tt);
 const ttH=ev=>{const hv=document.querySelectorAll('.card:hover');const c=hv.length?hv[hv.length-1]:(ev.target.closest&&ev.target.closest('[data-tt]'));if(c===tt._c&&c)return;tt._c=c;if(!c){tt.style.display='none';return;}
  let h;if(c.classList.contains('card')){h=`<b>${c.querySelector('.ct').textContent}</b>　<span style="color:#9fd8ff">${c.querySelector('.cost').textContent} 灵力</span><div>${c.querySelector('.desc').innerHTML}</div><small>${c.querySelector('.tag').textContent}</small>`;}else h=c.dataset.tt;
  tt.innerHTML=h;tt.style.display='block';const r=c.getBoundingClientRect();let x=r.left+r.width/2-140,y=r.top-tt.offsetHeight-10;if(y<4)y=r.bottom+10;tt.style.left=Math.max(4,Math.min(innerWidth-284,x))+'px';tt.style.top=y+'px';};document.addEventListener('mouseover',ttH);document.addEventListener('mousemove',ttH);}
try{ttInit();}catch(e){}
window.onerror=(m,s,l)=>{console.error('JSERR '+m+' @'+l);};
async function loadConfig(){const r=await fetch('config/daoxin.json');const j=await r.json();DAOXIN={};for(const k in j)DAOXIN[k]=[j[k].name,j[k].desc,j[k].tradeoff];
 try{EVT=await (await fetch('config/events.json')).json();SCR=await (await fetch('config/screens.json')).json();}catch(e){console.error('JSERR copy config load failed: '+e);}
 try{Object.assign(BAL,await (await fetch('config/balance.json')).json());}catch(e){console.error('JSERR balance load failed: '+e);}}
(async function boot(){try{await loadConfig();}catch(err){console.error('JSERR config load failed: '+err);}const t=(location.hash.match(/test=(\w+)/)||[])[1];if(!t)return showMenu();if(t==='stats')return showStats();TELE_OFF=t!=='auto';
 newRun();G.relics.push('yupei','zhong');G.potions=['huiyuan','xuelian'];G.deck.push(mkCard('wanjian'),mkCard('jianyi',true));
 if(t==='map'){G.floor=5;G.pos=G.map[4][1];G.path=['1-1','2-1','3-0','4-1','5-1'];showMap();}
 else if(t==='battle'){G.floor=5;G.pos=G.map[4][1];startCombat(['spider','bandit'],.8,'combat');const y=B.hand.findIndex(c=>c.id==='jinzhong');if(y>=0)playCard(y);}
 else if(t==='boss'){G.floor=13;startCombat(['xinmo'],1,'boss');B.en[0].mi=1;B.lastEl='fire';renderBattle();}
 else if(t==='elite'){G.floor=7;G.pos=G.map[6][1];startCombat(['python'],1,'elite');}
 else if(t==='reward'){G.floor=7;combatWon('elite');}
 else if(t==='shop'){G.floor=8;showShop();}else if(t==='rest'){G.floor=6;G.hp=40;showRest();}
 else if(t==='event'){G.floor=4;showEvent('dongfu');}else if(t==='huanjing'){G.floor=5;showEvent('huanjing');}else if(t==='frozen'){G.floor=3;startCombat(['bandit'],1,'combat');B.en[0].mi=1;addSt(B.en[0],'freeze',1);renderBattle();}else if(t==='mapboss'){G.floor=12;G.pos=G.map[11][1];G.path=['1-1','2-1','3-1','4-1','5-1','6-1','7-1','8-1','9-1','10-1','11-1','12-1'];showMap();}else if(t==='victory'){showVictory();pickDao('jianxin');}else if(t==='defeat'){G.floor=9;showDefeat();}
 else if(t==='auto'){autoplay();}
 else if(t==='potionfull'){G.potions=['huiyuan','xuelian','jingang'];G.floor=7;G.pos=G.map[6][1];combatWon('elite');G.reward.potion='qingmu';takeR('potion');}
 else if(t==='shengtip'||t==='shengtip2'){localStorage.removeItem('wd_shengTip');G.floor=2;G.pos=G.map[1][1];startCombat(['wolf','wolf'],1,'combat');B.hand=[mkCard('huichun'),mkCard('xinghuo'),mkCard('yujian'),mkCard('jinzhong'),mkCard('hanbing')];B.lastEl='wood';const i=1;B.flashArrow=null;playCard(i);B.flashArrow=['wood','fire'];renderBattle();localStorage.removeItem('wd_shengTip');shengTip('wood','fire');if(location.hash.includes('shengtip2')){const j=B.hand.findIndex(c=>c.id==='jinzhong');playCard(j);}}
 else if(t==='predict'){G.floor=9;G.pos=G.map[8][1];startCombat(['shanxiao','bandit'],1,'combat');B.en[1].mi=1;addSt(B.p,'vulnerable',1);B.p.block=5;B.en[0].block=6;renderBattle();}
 else if(t==='breakthrough'){G.hp=38;showVictory();}
 else if(t==='charge'){G.floor=13;startCombat(['xinmo'],1,'boss');B.en[0].mi=1;renderBattle();}
 else if(t==='discard'){G.floor=3;showMap();discardPotion(0);}
 else if(t==='tooltip'){G.floor=4;G.pos=G.map[3][1];startCombat(['wolf','wolf'],1,'combat');draw(5);renderBattle();const c=document.querySelectorAll('.hand .card')[4];c.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));}
 else if(t==='bighand'){G.floor=4;G.pos=G.map[3][1];startCombat(['wolf','wolf'],1,'combat');B.en[0].hp=0;draw(4);B.lastEl='metal';renderBattle();}
 else if(t==='upgrade'){G.floor=6;for(let i=0;i<8;i++)G.deck.push(mkCard(randCard()));showRest();restUp();}
})();
// ================= 自动对局（冒烟测试：一路点到底） =================
function autoplay(){let steps=0;const go=()=>{if(++steps>3000){console.log('AUTO timeout');return;}
 if(B&&!B.over){const i=B.hand.findIndex(c=>def(c).cost<=B.energy);if(i>=0)playCard(i);else endTurn();return setTimeout(go,0);}
 if(rerender===showReward){const rw=G.reward;['gold','potion','relic'].forEach(k=>{if(rw[k]&&!rw.taken[k])takeR(k);});if(!rw.taken.card)takeCard(0);showMap();return setTimeout(go,0);}
 if(rerender===showMap){const c=reachable();if(c.length)enterNode(c[0].f,c[0].c);else if(G.floor===12)enterBoss();return setTimeout(go,10);}
 if(rerender===showRest){restHeal();return setTimeout(go,0);}if(rerender===renderShop){showMap();return setTimeout(go,0);}
 if(document.querySelector('#evopts .item')){showMap();return setTimeout(go,0);}
 if(rerender===showVictory||rerender===showDefeat){console.log('AUTO END '+(rerender===showVictory?'VICTORY':'DEFEAT')+' floor '+G.floor+' hp '+G.hp);document.title='DONE';return;}
 setTimeout(go,50);};setTimeout(go,100);}
