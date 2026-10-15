# 问道塔 · 第一幕可玩原型
运行：cd /workspace/wendao/game && python3 -m http.server 8765，打开 http://localhost:8765/ （也可直接双击 index.html）
文件：index.html / style.css / game.js（全部逻辑）/ data.js（由 ../cardpool.json 生成）/ img/（从 art/ 裁切）
改了 cardpool.json 后重新生成 data.js：
  python3 -c "import json;d=json.load(open('../cardpool.json'));open('data.js','w').write('const CARDPOOL='+json.dumps(d,ensure_ascii=False)+';\n')"
截图/调试入口：index.html#test=map|battle|boss|elite|reward|shop|rest|event|victory|defeat|auto（auto 会自动点完一整局）

## v0.2 更新（2026-10-15）
规则（按设计师拍板）：
- 相生每回合开始清零（保持）。五行归一第一幕关闭（GUIYI_ENABLED=false），无相关界面提示。
- 心魔幻境：删卡后立即扣 5 血（最低留 1）。
- 价格：卡牌固定 45/70/120；法宝 130–160；普通丹药 35–45；雪莲丹 80；删卡 50，每删一次 +25（每家坊市限一次）。
- 奖励卡稀有度：普通战 60/30/10，精英战 45/40/15。
- 冻结：只让敌人下一次攻击减半，意图数字直接显示减半值（带❄标记）；攻击后冻结清空。Boss 蓄力预警不再误算冻结。
美术（P0 接入，素材复制到 img/）：
- 统一比例切图 640×640（img/*.png），剑修出牌攻击时切 jianxiu_attack，受伤时切 jianxiu_hit，随后回 idle。
- 状态/意图图标改用 img/icons/64/*.png；卡面改用五行×稀有度×升级卡框 img/frames/；五行盘改为分层图 img/wuxing/（当前五行亮，下一相生闪烁）。
修复：地图顶部心魔节点被遮挡（顶部留白、第 11 层后自动滚到顶）；心魔立绘位置偏高（统一画布脚底对齐）。
新增调试入口：#test=mapboss | frozen | huanjing。截图全部重拍于 shots/。

### v0.2 补充（同日）
- 修复：战斗/坊市/事件等界面顶栏“第 0 层”——测试入口也按地图位置设定层数（正常流程 enterNode 本就同步）；地图滚动在接近顶部时贴顶，心魔节点不再被视口切半。
- 地图生成：加权随机 + 校验重抽（mapOK），保证每条路径 ≥1 精英、≥2 奇遇/坊市；精英只出现在第 7、9 层；横向连线概率 35%→50%（平均约 19 个分叉节点）。500 次生成全部达标。
- 精英奖励页标题“妖王伏诛”，法宝行金色描边。
- 相生卡：保留“相生 ✦”标签和五行盘“下一相生”提示，卡牌外发光减弱。
- 删除未使用的旧图 img/jianxiu.png。
- 卡图：img/cards/<id>.png 自动铺满卡框插画窗（320×241），缺图时回退 emoji（onerror），新卡图按 id 放入即可，无需改代码。

## v0.3（已完成，2026-10-15 22:30）
备份：/workspace/wendao/game_v02_backup/
- 数据：道心 DAOXIN 移到 config/daoxin.json（name/desc/tradeoff，保留设计师取舍文案，突破页小字显示），启动时 fetch 加载。注意：从此需用 http 服务打开，双击 index.html（file://）无法加载配置。
- 丹药栏上限 3：满了时奖励页给出“替换哪一瓶 / 丢弃新丹药”；任意时刻右键丹药可丢弃（带确认）。
- 相生教学：首次触发弹出一次性提示（如“木生火：上一张是木属性，这张火属性卡获得加成”），localStorage 键 wd_shengTip 记住；每次相生五行盘对应箭头闪烁。卡牌发光不加强。
- 意图：敌人头顶显示原始伤害（含力量/剑意/冻结减半，不计玩家易伤）；玩家血条下显示“预计受到 X 点伤害”（全部攻击意图合计，计入易伤、冻结、镇魂铜钟，减当前护体，最小 0）。心魔蓄力预警改为更大、更红。
- 敌人护体真气改用 enemyBlock 图标，数字白字黑描边居中；玩家护体不变。
- 加入 favicon（favicon/）。
- 新测试入口：#test=potionfull | shengtip | predict | breakthrough
- 试玩清单 playtest_v02.md 开发项：
  #2 画面按窗口等比缩放居中（不再 683×426 留黑）；升级/删卡选牌弹窗卡牌缩到 0.82，20 张三行完整显示；地图隐藏滚动条（仍可滚轮）。
  #3 手牌按张数自动收紧间距，相生牌置于上层（标签不被挡），悬停置顶。
  #4 战斗灵石自动入账（奖励页显示“已入账”）；丹药满时替换/丢弃（见上）。
  #7 死亡敌人完全隐藏；日志字号 12→14，过滤“造成 0 点伤害”。
  #9 奇遇/洞府选项改按钮样式（金边、悬停高亮）；地图节点下方常显名称；图例上移不被裁。
- 测试入口另加 #test=bighand | upgrade
- 洞府打坐背景（借用 event.jpg，含大字）压暗+加模糊，避免干扰；result.jpg 新图下突破/陨落页文字清晰，亮度未调。
- v0.3 补：新卡图 wanjian/budong/jianyi；洞府打坐改用 img/rest.jpg 背景+剑修立绘坐蒲团；地图改为“生成+就地修补”保证路径约束（此前约多数局走保底固定布局）。
- v0.3.1：数值移入 config/balance.json（restHealPct 0.25、duoFloorFrom 4、duoEnemyScale 0.9），game.js 启动加载。
- QA #15 蓄力回合显示“下回合预计受到 X 点伤害”；#18 原生 title 改为即时自定义悬浮提示（手牌显示完整卡面文字）；#19 丹药丢弃确认改为暗底+居中对话框；#20 陨落页去掉左侧细线，突破页显示剩余生命。测试入口 #test=charge|discard|tooltip。
