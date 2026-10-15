'use strict';
// ================= 数据 =================
const VERSION='v0.2';
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
const DAOXIN={jianxin:['剑心通明','每场战斗开始时获得 2 层剑意'],lingmai:['灵脉初开','灵力上限 +1，但每回合少抽 1 张牌'],daoji:['道基稳固','生命上限 +15，并回满生命']};
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
 <div class="ct">${d.name}${c.up?'+':''}</div><div class="art a${d.element}">${ART[d.id]||'✦'}</div>
 <div class="desc">${d.actions.map(actText).join('<br>')}${d.onShengBonus&&d.onShengBonus.length?`<div class="sh">相生：${d.onShengBonus.map(actText).join('，')}</div>`:''}${d.exhaust?'<div class="ex">消耗</div>':''}</div>
 <div class="tag">${ty} · ${rar}</div></div>`;}
// ================= 局 =================
function newRun(){uid=1;G={hp:70,maxHp:70,gold:99,deck:[],relics:['qingfeng'],potions:[],floor:0,pos:null,daoxin:null,energyMax:3,drawN:5,huanjing:0,removeCount:0};
 ['yujian','yujian','yujian','yujian','jinzhong','jinzhong','jinzhong','huichun','xinghuo','hanbing'].forEach(i=>G.deck.push(mkCard(i)));
 G.map=genMap();showMap();}
function genMap(){
 for(let tries=0;tries<500;tries++){const fl=genMapOnce();if(mapOK(fl))return fl;}
 console.warn('genMap: fallback');return genMapOnce(true);}
function genMapOnce(force){const W={combat:.42,event:.24,elite:.14,shop:.08,rest:.12};const fl=[];
 for(let f=1;f<=12;f++){const row=[];for(let c=0;c<3;c++){let t;
  if(f<=3)t='combat';else if(f===6||f===12)t='rest';else{let r=Math.random(),acc=0;for(const k in W){acc+=W[k];if(r<acc){t=k;break;}}t=t||'combat';
   if(t==='elite'&&f!==7&&f!==9)t='combat'; if(t==='rest'&&(f===5||f===7||f===11))t='event';}
  if(force&&f===7)t='elite';if(force&&(f===5||f===10))t=c===1?'shop':'event';
  row.push({f,c,t,next:[]});}fl.push(row);}
 for(let f=0;f<11;f++)for(const n of fl[f]){n.next.push(n.c);if(n.c>0&&Math.random()<.5)n.next.push(n.c-1);if(n.c<2&&Math.random()<.5)n.next.push(n.c+1);}
 return fl;}
function mapOK(fl){// 每条路径：精英≥1，奇遇/坊市≥2（自底向上取最小值）
 const m={};for(let f=12;f>=1;f--)for(const n of fl[f-1]){const e=n.t==='elite'?1:0,v=(n.t==='event'||n.t==='shop')?1:0;
  if(f===12){m[f+'-'+n.c]=[e,v];continue;}let me=99,mv=99;for(const c of n.next){const x=m[(f+1)+'-'+c];me=Math.min(me,x[0]);mv=Math.min(mv,x[1]);}m[f+'-'+n.c]=[e+me,v+mv];}
 return fl[0].every(n=>{const x=m['1-'+n.c];return x[0]>=1&&x[1]>=2;});}
function topBar(){return `<div class="top"><span>剑修 · 青岚</span><span>生命 <b>${G.hp}/${G.maxHp}</b></span><span>灵石 <b>${G.gold}</b></span><span>第 <b>${G.floor}</b> 层</span>
 <span>${G.relics.map(r=>`<i class="relic" style="background-image:url(img/${r}.jpg)" data-tip="${RELICS[r][0]}：${RELICS[r][1]}"></i>`).join('')}</span>
 <span>${[0,1,2].map(i=>{const p=G.potions[i];return p?`<i class="pot" onclick="usePotion(${i})" style="background-image:url(img/${p}.jpg)" data-tip="${POTIONS[p][0]}：${POTIONS[p][1]}${p!=='xuelian'?'\n（点击使用）':''}"></i>`:'<i class="pot empty"></i>';}).join('')}</span>
 ${G.daoxin?`<span>道心 <b>${DAOXIN[G.daoxin][0]}</b></span>`:''}<span class="sp"></span><span class="btn sm" onclick="viewDeck()">牌组 ${G.deck.length}</span></div>`;}
function viewDeck(pickCb,title){const m=document.createElement('div');m.className='modal';
 const list=pickCb?G.deck.filter(c=>title!=='选择一张卡升级'||!c.up):G.deck;
 m.innerHTML=`<h1 style="font-size:26px">${title||'牌组（'+G.deck.length+' 张）'}</h1><div class="grid">${list.map(c=>cardHTML(c)).join('')}</div><span class="btn" id="mclose">${pickCb?'取消':'关闭'}</span>`;
 app().appendChild(m);m.querySelector('#mclose').onclick=()=>m.remove();
 if(pickCb)m.querySelectorAll('.card').forEach(e=>e.onclick=()=>{const c=G.deck.find(x=>x.uid==e.dataset.uid);m.remove();pickCb(c);});}
function gainPotion(p){if(G.potions.length>=3){toast('丹药栏已满');return false;}G.potions.push(p);return true;}
function randPotion(){return pick(['huiyuan','ningshen','jingang','qingmu','ziyan']);}
function randRelic(){const pool=['hulu','zhong','yupei','fubi'].filter(r=>!G.relics.includes(r));return pool.length?pick(pool):null;}
const RARW={combat:[.60,.30,.10],elite:[.45,.40,.15]};
function randCard(rare,kind){const w=RARW[kind]||RARW.combat;const r=rare||(()=>{const x=Math.random();return x<w[0]?'common':x<w[0]+w[1]?'uncommon':'rare';})();return pick(CARDPOOL.filter(c=>c.rarity===r)).id;}
function cardChoices(kind){const s=new Set();while(s.size<3)s.add(randCard(null,kind));return [...s];}
function usePotion(i){const p=G.potions[i];if(!p||p==='xuelian')return;
 if(!B){if(p==='huiyuan'){G.hp=Math.min(G.maxHp,G.hp+15);G.potions.splice(i,1);rerender();}else toast('只能在战斗中使用');return;}
 G.potions.splice(i,1);potionEffect(p);renderBattle();}
function potionEffect(p){if(p==='huiyuan')G.hp=Math.min(G.maxHp,G.hp+15);if(p==='ningshen')B.energy+=2;if(p==='jingang')B.p.block+=12;if(p==='qingmu')draw(3);
 if(p==='ziyan')B.en.forEach(e=>{if(e.hp>0)addSt(e,'vulnerable',2);});log(`使用了${POTIONS[p][0]}`);}
let rerender=()=>{};
// ================= 主菜单 =================
function showMenu(){B=null;rerender=showMenu;app().innerHTML=`<div class="fullbg" style="background-image:url(img/mainmenu.jpg)"></div>
 <div style="position:absolute;left:0;right:0;bottom:90px;text-align:center"><span class="btn" style="font-size:24px;padding:14px 48px" onclick="newRun()">开始问道</span><br>
 <span style="color:#bfae86;font-size:14px">第一幕 · 炼气期　|　剑修 · 70 生命 · 3 灵力　|　${VERSION}</span></div>`;}
// ================= 地图 =================
function reachable(){if(G.floor>=12)return [];if(!G.pos)return G.map[0];return G.map[G.pos.f-1][G.pos.c].next.map(c=>G.map[G.pos.f][c]);}
function showMap(){B=null;rerender=showMap;const can=reachable();const H=13*68+150;const y=f=>H-60-(f-1)*68,x=c=>220+c*220;
 let lines='';G.map.forEach(row=>row.forEach(n=>{if(n.f<12)n.next.forEach(c=>lines+=`<line x1="${x(n.c)}" y1="${y(n.f)}" x2="${x(c)}" y2="${y(n.f+1)}" stroke="#8a7342" stroke-width="2" stroke-dasharray="6 5" opacity=".7"/>`);
  else lines+=`<line x1="${x(n.c)}" y1="${y(12)}" x2="440" y2="${y(13)}" stroke="#c33" stroke-width="2" stroke-dasharray="6 5" opacity=".6"/>`;}));
 let nodes='';G.map.forEach(row=>row.forEach(n=>{const cls=can.includes(n)?'can':(G.path||[]).includes(n.f+'-'+n.c)?'done':'';
  nodes+=`<div class="node ${cls} ${G.pos===n?'cur':''}" style="left:${x(n.c)}px;top:${y(n.f)}px" title="${NODE[n.t][1]}" ${cls==='can'?`onclick="enterNode(${n.f},${n.c})"`:''}>${NODE[n.t][0]}</div>`;}));
 nodes+=`<div class="node boss ${G.floor===12?'can':''}" style="left:440px;top:${y(13)}px" ${G.floor===12?'onclick="enterBoss()"':''}></div>`;
 app().innerHTML=topBar()+`<div class="mapwrap" id="mw"><div style="position:relative;height:${H}px"><svg width="880" height="${H}" style="position:absolute;left:0;top:0">${lines}</svg>${nodes}</div></div>
 <div class="legend panel">${['combat','elite','event','shop','rest'].map(k=>NODE[k][0]+' '+NODE[k][1]).join('<br>')}<br>👿 心魔（第 13 层）</div>
 <div class="panel" style="position:absolute;left:16px;top:70px;width:170px;font-size:14px;line-height:1.8">炼气期 · 第一幕<br>选择发光的节点前进。<br>第 6、12 层为洞府打坐，第 7、9 层可能遇到精英。</div>`;
 const mw=$('#mw');{let st=y(Math.min(G.floor+1,13))-(G.floor>=11?120:500);mw.scrollTop=st<220?0:st;}}
function enterNode(f,c){const n=G.map[f-1][c];G.pos=n;G.floor=f;(G.path=G.path||[]).push(f+'-'+c);
 ({combat:()=>startCombat(pick(f>=4?DUO:SOLO),f>=4?.8:1,'combat'),elite:()=>startCombat([pick(['python','ghost'])],1,'elite'),event:showEvent,shop:showShop,rest:showRest})[n.t]();}
function enterBoss(){G.floor=13;startCombat(['xinmo'],1,'boss');}
// ================= 战斗 =================
function addSt(u,k,v){u.st[k]=(u.st[k]||0)+v;}
function log(t){if(B){B.log.unshift(t);B.log.length=Math.min(B.log.length,8);}}
function startCombat(ids,scale,kind){
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
function enemyAtk(e,m,later){const base=Math.round(m.d*e.scale)+(e.st.strength||0)+(e.st.swordIntent||0);let v=base;if(B.p.st.vulnerable)v=Math.floor(v*1.5);if(e.st.freeze&&!later)v=Math.floor(v/2);return v;}
function intentHTML(e){const m=intentOf(e);let ic,tx,warn=false;
 if(m.t==='atk'){ic='attack';tx=(m.name?m.name+' · ':'')+(e.st.freeze?'❄':'')+enemyAtk(e,m)+(m.n>1?'×'+m.n:'');if(m.burn)tx+=` +灼烧${m.burn}`;if(m.vuln)tx+=` +易伤${m.vuln}`;if(m.name)warn=true;}
 else if(m.t==='def'){ic='defend';tx='护体 '+bossBlock(e,m);if(m.str)tx+=` +力量${m.str}`;if(m.si&&!e.siUsed)tx+=` +剑意${m.si}`;}
 else if(m.t==='buff'){ic='strength';tx=`${m.name}：力量+${m.str}`;}
 else{ic='debuff';tx=`施加易伤 ${m.vuln}`;}
 let w='';if(m.warn){w=`<div class="intent warn">⚠ 下回合心魔蓄力 · ${enemyAtk(e,e.moves[(e.mi+1)%e.moves.length],true)} 伤害</div><br>`;}
 return w+`<div class="intent ${warn?'warn':''}"><img src="img/icons/64/${ic}.png">${tx}</div>`;}
function bossBlock(e,m){let b=Math.round(m.b*e.scale);if(e.id==='xinmo'&&G.relics.includes('jing'))b=Math.floor(b/2);return b;}
function stHTML(u){return `<div class="stat">${Object.entries(u.st).filter(([k,v])=>v>0).map(([k,v])=>`<span title="${STATUS[k][2]}"><img src="img/icons/64/${STATUS[k][1]}.png">${STATUS[k][0]} ${v}</span>`).join('')}</div>`;}
function isSheng(d){return B.lastEl&&GEN[B.lastEl]===d.element;}
function wheelSVG(){const nxt=B.lastEl?GEN[B.lastEl]:null;
 let h=`<div class="wheel"><img src="img/wuxing/wuxing_base.png">`;
 if(B.lastEl)h+=`<img class="cur" src="img/wuxing/wuxing_node_${ELK[B.lastEl]}_lit.png">`;
 if(nxt)h+=`<img class="nxt" src="img/wuxing/wuxing_node_${ELK[nxt]}_lit.png">`;
 return h+`<div class="wl">${nxt?'下一相生：'+ELN[nxt]:'五行相生'}</div></div>`;}
function renderBattle(){if(!B)return;rerender=renderBattle;const lv=living();if(!lv.includes(B.en[B.target]))B.target=lv.length?lv[0].i:0;
 const ex=[];
 const en=B.en.map((e,k)=>{const d=ENEMIES[e.id];const w=d.boss?340:300;const left=B.en.length===1?(d.boss?720:760):620+k*290;
  return `<div class="unit enemy ${e.hp<=0?'dead':''} ${B.target===k&&lv.length>1?'tgt':''} ${d.boss?'bossu':''}" style="left:${left}px;width:${w}px" onclick="setTarget(${k})" id="en${k}">${e.hp>0?intentHTML(e):''}
  <div class="fig" style="width:${w}px;height:${w}px;background-image:url(img/${e.img}.png)"></div>
  <div><b>${e.name}</b>${e.block?`<span class="blkv">🛡${e.block}</span>`:''}</div><div class="hpb"><i style="width:${100*Math.max(0,e.hp)/e.max}%"></i></div><div>${Math.max(0,e.hp)} / ${e.max}</div>${stHTML(e)}</div>`;}).join('');
 const hand=B.hand.map((c,i)=>{const d=def(c);const ok=d.cost<=B.energy;return cardHTML(c,(isSheng(d)?'sheng ':'')+(ok?'':'nope')).replace('class="card','onclick="playCard('+i+')" class="card');}).join('');
 app().innerHTML=topBar()+`<div class="bg"></div><div class="log">${B.log.join('<br>')}</div>${wheelSVG()}
 <div class="unit" style="left:150px;width:300px" id="pl"><div class="fig" style="width:300px;height:300px;background-image:url(img/jianxiu_${B.pose||'idle'}.png)"></div>
 <div><b>青岚</b>${B.p.block?`<span class="blkv">🛡${B.p.block}</span>`:''}</div><div class="hpb"><i style="width:${100*G.hp/G.maxHp}%"></i></div><div>${G.hp} / ${G.maxHp}</div>${stHTML(B.p)}</div>
 ${en}<div class="energy">${B.energy}<small>灵力 ${B.energy}/${G.energyMax}</small></div>
 <div class="pile" style="left:20px" onclick="">抽牌堆<br>${B.draw.length}</div><div class="pile" style="right:20px">弃牌堆 ${B.disc.length}<br>消耗 ${B.exh.length}</div>
 <span class="btn endbtn" onclick="endTurn()">结束回合</span><div class="hand">${hand}</div>`;}
function setPose(p,ms=450){if(!B)return;B.pose=p;clearTimeout(B.poseT);const el=document.querySelector('#pl .fig');if(el)el.style.backgroundImage=`url(img/jianxiu_${p}.png)`;B.poseT=setTimeout(()=>{if(!B)return;B.pose='idle';const f=document.querySelector('#pl .fig');if(f)f.style.backgroundImage='url(img/jianxiu_idle.png)';},ms);}
function setTarget(k){if(B.en[k].hp>0){B.target=k;renderBattle();}}
function floatAt(id,t,col){const el=document.getElementById(id);if(!el)return;const r=el.getBoundingClientRect(),a=app().getBoundingClientRect();const f=document.createElement('div');f.className='float';f.textContent=t;if(col)f.style.color=col;f.style.left=(r.left-a.left+r.width/2-20)+'px';f.style.top=(r.top-a.top+60)+'px';app().appendChild(f);setTimeout(()=>f.remove(),900);}
function hitEnemy(e,v){if(e.st.vulnerable)v=Math.floor(v*1.5);const ab=Math.min(e.block,v);e.block-=ab;e.hp-=v-ab;B.fx.push(['en'+e.i,'-'+(v-ab)]);}
function mergeActs(d,sheng){const acts=d.actions.map(a=>Object.assign({},a));if(sheng)for(const b of d.onShengBonus||[]){const t=acts.find(a=>a.op===b.op&&(b.op==='damage'||b.op==='block'||b.op==='draw'||b.op==='heal'));if(t)t.value+=b.value;else acts.push(Object.assign({},b));}return acts;}
function playCard(i){if(B.over)return;const c=B.hand[i],d=def(c);if(d.cost>B.energy){toast('灵力不足');return;}
 const sheng=isSheng(d);B.energy-=d.cost;B.hand.splice(i,1);B.fx=[];const hadAura=B.p.st.swordIntentAura||0;
 let tgt=B.en[B.target];if(!tgt||tgt.hp<=0)tgt=living()[0];
 let bonus=0;if(d.element==='metal'&&!B.firstMetal){B.firstMetal=true;if(G.relics.includes('qingfeng')&&d.actions.some(a=>a.op==='damage'))bonus=3;}
 log(`打出 ${d.name}${c.up?'+':''}${sheng?'（相生！）':''}`);
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
 const fx=B.fx;renderBattle();if(d.type==='attack')setPose('attack');fx.forEach(f=>floatAt(f[0],f[1]));checkEnd();}
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
 G.reward=rw;showReward();}
function showReward(){rerender=showReward;const rw=G.reward;let items='';
 if(!rw.taken.gold)items+=`<div class="item" onclick="takeR('gold')"><span style="font-size:30px">💎</span> ${rw.gold} 灵石</div>`;
 if(rw.potion&&!rw.taken.potion)items+=`<div class="item" onclick="takeR('potion')"><img src="img/${rw.potion}.jpg">${POTIONS[rw.potion][0]}：${POTIONS[rw.potion][1]}</div>`;
 if(rw.relic&&!rw.taken.relic)items+=`<div class="item relicrow" onclick="takeR('relic')"><img src="img/${rw.relic}.jpg">法宝 · ${RELICS[rw.relic][0]}：${RELICS[rw.relic][1]}</div>`;
 const cards=rw.taken.card?'':`<div style="color:#e8c66a">选择一张卡加入牌组</div><div class="row">${rw.cards.map((id,i)=>cardHTML({id,uid:'r'+i}).replace('class="card',`onclick="takeCard(${i})" class="card`)).join('')}</div>`;
 app().innerHTML=topBar()+`<div class="center"><h1>${rw.elite?'妖王伏诛':'战斗胜利'}</h1><div style="display:flex;flex-direction:column;gap:8px">${items}</div>${cards}
 <div><span class="btn" onclick="showMap()">${rw.taken.card?'继续前进':'跳过选卡，继续前进'}</span></div></div>`;}
function takeR(k){const rw=G.reward;if(k==='gold')G.gold+=rw.gold;if(k==='potion'&&!gainPotion(rw.potion))return;if(k==='relic')G.relics.push(rw.relic);rw.taken[k]=1;showReward();}
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
function showRest(){rerender=showRest;const h=Math.floor(G.maxHp*.3);
 app().innerHTML=topBar()+`<div class="fullbg" style="background-image:url(img/event.jpg);filter:brightness(.3) blur(3px)"></div><div class="center"><h1>🔥 洞府打坐</h1>
 <div class="row"><div class="panel" style="width:280px;text-align:center;cursor:pointer" onclick="restHeal()"><div style="font-size:60px">🧘</div><h2>调息</h2>回复 ${h} 点生命（30%）</div>
 <div class="panel" style="width:280px;text-align:center;cursor:pointer" onclick="restUp()"><div style="font-size:60px">📜</div><h2>参悟</h2>升级一张卡</div></div></div>`;}
function restHeal(){G.hp=Math.min(G.maxHp,G.hp+Math.floor(G.maxHp*.3));showMap();}
function restUp(){if(!G.deck.some(c=>!c.up)){toast('没有可升级的卡');return;}viewDeck(c=>{c.up=true;toast(def(c).name+' 已升级');showMap();},'选择一张卡升级');}
// ================= 奇遇 =================
const EVENTS={
 dongfu:{name:'古修洞府',text:'山壁间露出一座古修士的洞府，禁制残存，强闯必受反噬，但洞中隐约有宝光流转。',opts:[['失去 8 点生命，取得一件法宝',()=>{G.hp=Math.max(1,G.hp-8);const r=(G.floor>=10&&!G.relics.includes('jing'))?'jing':randRelic();if(r){G.relics.push(r);return `你取得了「${RELICS[r][0]}」：${RELICS[r][1]}`;}G.gold+=50;return '法宝已尽，只得 50 灵石。';}],['离开',()=>'你没有冒险，转身离去。']]},
 lingquan:{name:'灵泉',text:'林间一汪灵泉，灵气氤氲，可饮之疗伤，亦可借灵气参悟功法。',opts:[['回复 20 点生命',()=>{G.hp=Math.min(G.maxHp,G.hp+20);return '泉水入腹，伤势大为好转。';}],['升级一张卡',()=>'UPGRADE']]},
 sanxiu:{name:'落难散修',text:'一位散修被妖兽所伤，倒在路旁向你求救：“道友若肯相助，必有厚报。”',opts:[['花 30 灵石救他，获得一张稀有卡',()=>{if(G.gold<30)return null;G.gold-=30;const id=randCard('rare');G.deck.push(mkCard(id));return `散修赠你功法「${CARDS[id].name}」。`;}],['无视他',()=>'你径直走过。']]},
 huanjing:{name:'心魔幻境',text:'眼前景物扭曲，你陷入一片幻境，过往执念化作锁链缠身。斩断执念，便要付出代价。',opts:[['删除一张卡，立即受到 5 点伤害',()=>'REMOVE'],['静心离开',()=>'你收敛心神，走出幻境。']]},
 dushi:{name:'坊市赌石',text:'路边小摊摆着一堆原石：“二十灵石一块，开出灵玉翻三倍！”',opts:[['花 20 灵石赌一把（50% 得 60 灵石）',()=>{if(G.gold<20)return null;G.gold-=20;if(Math.random()<.5){G.gold+=60;return '切开一看，灵光四溢！获得 60 灵石。';}return '一块废石，灵石打了水漂。';}],['离开',()=>'你摇摇头离开了。']]},
};
function showEvent(key){key=typeof key==='string'?key:pick(Object.keys(EVENTS));const ev=EVENTS[key];rerender=()=>showEvent(key);
 app().innerHTML=topBar()+`<div style="position:absolute;top:44px;left:0;width:620px;bottom:0;background:url(img/event.jpg) left bottom/auto 118% no-repeat"></div>
 <div style="position:absolute;top:44px;left:620px;right:0;bottom:0;padding:70px 60px;background:linear-gradient(90deg,rgba(14,19,26,.6),#0e131a 15%)">
 <h1 style="text-align:left">${ev.name}</h1><p style="font-size:18px;line-height:1.9;color:#d8ccb0" id="evtext">${ev.text}</p><div id="evopts">
 ${ev.opts.map((o,i)=>`<div class="item" style="margin:12px 0" onclick="evPick('${key}',${i})">【${i+1}】${o[0]}</div>`).join('')}</div></div>`;}
function evPick(key,i){const r=EVENTS[key].opts[i][1]();
 if(r===null){toast('灵石不足');return;}
 const done=t=>{rerender=showMap;$('#evtext').innerHTML=t;$('#evopts').innerHTML='<span class="btn" onclick="showMap()">继续前进</span>';};
 if(r==='UPGRADE'){viewDeck(c=>{c.up=true;showEvent(key);done(`借灵泉之力，「${def(c).name}」已升级。`);},'选择一张卡升级');return;}
 if(r==='REMOVE'){viewDeck(c=>{G.deck=G.deck.filter(x=>x!==c);G.hp=Math.max(1,G.hp-5);showEvent(key);done(`你斩断执念，「${def(c).name}」从牌组中移除。心魔反噬，你受到 5 点伤害。`);},'选择一张卡删除');return;}
 done(r);const tb=$('.top');if(tb)tb.outerHTML=topBar();}
// ================= 结算 =================
function showVictory(){rerender=showVictory;app().innerHTML=`<div class="fullbg" style="background:url(img/result.jpg) left top/200% auto;filter:brightness(.3)"></div>
 <div class="center" style="top:0"><h1 style="font-size:52px">突 破</h1><div style="color:#bfae86">心魔已斩，炼气圆满，踏入筑基。选择一颗道心：</div>
 <div class="row">${Object.entries(DAOXIN).map(([k,v])=>`<div class="panel" style="width:260px;text-align:center;cursor:pointer;border-color:#e8c66a;background:rgba(0,0,0,.75)" onclick="pickDao('${k}')"><h2 style="color:#e8c66a">${v[0]}</h2>${v[1]}</div>`).join('')}</div></div>`;}
function pickDao(k){G.daoxin=k;if(k==='lingmai')G.energyMax++;if(k==='daoji'){G.maxHp+=15;G.hp=G.maxHp;}
 app().innerHTML=`<div class="fullbg" style="background:url(img/result.jpg) left top/200% auto;filter:brightness(.3)"></div><div class="center" style="top:0"><h1 style="font-size:46px">炼气期 · 通关</h1>
 <div style="font-size:20px">道心：${DAOXIN[k][0]}　|　牌组 ${G.deck.length} 张　|　法宝 ${G.relics.length} 件　|　灵石 ${G.gold}</div><div style="color:#bfae86">筑基期（第二幕）尚在开辟中……</div><span class="btn" onclick="showMenu()">返回主菜单</span></div>`;}
function showDefeat(){B=null;rerender=showDefeat;app().innerHTML=`<div class="fullbg" style="background:url(img/result.jpg) right top/200% auto;filter:brightness(.35)"></div>
 <div class="center" style="top:0"><h1 style="font-size:52px;color:#c44">陨 落</h1><div style="font-size:20px">道途止于第 ${G.floor} 层　|　牌组 ${G.deck.length} 张　|　灵石 ${G.gold}</div>
 <div style="color:#bfae86">胜败乃修行常事，重入轮回再问道。</div><span class="btn" onclick="newRun()">重新开始</span><span class="btn" onclick="showMenu()">主菜单</span></div>`;}
// ================= 启动（#test=xxx 用于截图） =================
window.onerror=(m,s,l)=>{console.error('JSERR '+m+' @'+l);};
(function boot(){const t=(location.hash.match(/test=(\w+)/)||[])[1];if(!t)return showMenu();
 newRun();G.relics.push('yupei','zhong');G.potions=['huiyuan','xuelian'];G.deck.push(mkCard('wanjian'),mkCard('jianyi',true));
 if(t==='map'){G.floor=5;G.pos=G.map[4][1];G.path=['1-1','2-1','3-0','4-1','5-1'];showMap();}
 else if(t==='battle'){G.floor=5;G.pos=G.map[4][1];startCombat(['spider','bandit'],.8,'combat');const y=B.hand.findIndex(c=>c.id==='jinzhong');if(y>=0)playCard(y);}
 else if(t==='boss'){G.floor=13;startCombat(['xinmo'],1,'boss');B.en[0].mi=1;B.lastEl='fire';renderBattle();}
 else if(t==='elite'){G.floor=7;G.pos=G.map[6][1];startCombat(['python'],1,'elite');}
 else if(t==='reward'){G.floor=7;combatWon('elite');}
 else if(t==='shop'){G.floor=8;showShop();}else if(t==='rest'){G.floor=6;G.hp=40;showRest();}
 else if(t==='event'){G.floor=4;showEvent('dongfu');}else if(t==='huanjing'){G.floor=5;showEvent('huanjing');}else if(t==='frozen'){G.floor=3;startCombat(['bandit'],1,'combat');B.en[0].mi=1;addSt(B.en[0],'freeze',1);renderBattle();}else if(t==='mapboss'){G.floor=12;G.pos=G.map[11][1];G.path=['1-1','2-1','3-1','4-1','5-1','6-1','7-1','8-1','9-1','10-1','11-1','12-1'];showMap();}else if(t==='victory'){showVictory();}else if(t==='defeat'){G.floor=9;showDefeat();}
 else if(t==='auto'){autoplay();}
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
