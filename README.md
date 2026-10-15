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
