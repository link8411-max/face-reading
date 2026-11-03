// 열전 등록부. 열전이 있는 인물만 여기에 넣는다(없는 인물은 페이지를 만들지 않는다).
import type { PersonEntry } from './types'
import { person as bianshi } from './bianshi'
import { person as bujianying } from './bujianying'
import { person as caimao } from './caimao'
import { person as caiwenji } from './caiwenji'
import { person as caocao } from './caocao'
import { person as caojie } from './caojie'
import { person as caopi } from './caopi'
import { person as caoren } from './caoren'
import { person as caoshuang } from './caoshuang'
import { person as cenhun } from './cenhun'
import { person as chengong } from './chengong'
import { person as chengpu } from './chengpu'
import { person as chengyu } from './chengyu'
import { person as chunyuqiong } from './chunyuqiong'
import { person as daqiao } from './daqiao'
import { person as dengai } from './dengai'
import { person as dianwei } from './dianwei'
import { person as diaochan } from './diaochan'
import { person as dongbai } from './dongbai'
import { person as dongzhuo } from './dongzhuo'
import { person as duangui } from './duangui'
import { person as fanshi } from './fanshi'
import { person as fazheng } from './fazheng'
import { person as fengji } from './fengji'
import { person as fuhuanghou } from './fuhuanghou'
import { person as fushiren } from './fushiren'
import { person as ganfuren } from './ganfuren'
import { person as ganning } from './ganning'
import { person as gaoshun } from './gaoshun'
import { person as gongsunzan } from './gongsunzan'
import { person as guanping } from './guanping'
import { person as guanxing } from './guanxing'
import { person as guanyinping } from './guanyinping'
import { person as guanyu } from './guanyu'
import { person as guohuanghou } from './guohuanghou'
import { person as guojia } from './guojia'
import { person as guosi } from './guosi'
import { person as guotu } from './guotu'
import { person as hetaihou } from './hetaihou'
import { person as huanggai } from './huanggai'
import { person as huanghao } from './huanghao'
import { person as huangyueying } from './huangyueying'
import { person as huangzhong } from './huangzhong'
import { person as huatuo } from './huatuo'
import { person as huaxin } from './huaxin'
import { person as huaxiong } from './huaxiong'
import { person as jiachong } from './jiachong'
import { person as jiangwei } from './jiangwei'
import { person as jianshuo } from './jianshuo'
import { person as jiaxu } from './jiaxu'
import { person as lijue } from './lijue'
import { person as liru } from './liru'
import { person as lisu } from './lisu'
import { person as liubei } from './liubei'
import { person as liubiao } from './liubiao'
import { person as liushan } from './liushan'
import { person as liyan } from './liyan'
import { person as lusu } from './lusu'
import { person as luxun } from './luxun'
import { person as lvbu } from './lvbu'
import { person as lvmeng } from './lvmeng'
import { person as machao } from './machao'
import { person as madai } from './madai'
import { person as masu } from './masu'
import { person as mayunlu } from './mayunlu'
import { person as mengda } from './mengda'
import { person as menghuo } from './menghuo'
import { person as mifang } from './mifang'
import { person as mifuren } from './mifuren'
import { person as panfuren } from './panfuren'
import { person as pangde } from './pangde'
import { person as pangtong } from './pangtong'
import { person as simayi } from './simayi'
import { person as simazhao } from './simazhao'
import { person as sunce } from './sunce'
import { person as sunchen } from './sunchen'
import { person as sunhao } from './sunhao'
import { person as sunjian } from './sunjian'
import { person as sunluban } from './sunluban'
import { person as sunquan } from './sunquan'
import { person as sunshangxiang } from './sunshangxiang'
import { person as taishici } from './taishici'
import { person as wanglang } from './wanglang'
import { person as wangping } from './wangping'
import { person as wangyi } from './wangyi'
import { person as wangyuanji } from './wangyuanji'
import { person as weiyan } from './weiyan'
import { person as wenchou } from './wenchou'
import { person as wuguotai } from './wuguotai'
import { person as xiahoushi } from './xiahoushi'
import { person as xiahouyuan } from './xiahouyuan'
import { person as xiaohoudun } from './xiaohoudun'
import { person as xiaoqiao } from './xiaoqiao'
import { person as xinxianying } from './xinxianying'
import { person as xuchu } from './xuchu'
import { person as xuhuang } from './xuhuang'
import { person as xunyou } from './xunyou'
import { person as xunyu } from './xunyu'
import { person as xushi } from './xushi'
import { person as xuyou } from './xuyou'
import { person as yangsong } from './yangsong'
import { person as yangyi } from './yangyi'
import { person as yanliang } from './yanliang'
import { person as yuanshao } from './yuanshao'
import { person as yuanshu } from './yuanshu'
import { person as yujin } from './yujin'
import { person as zhangbao } from './zhangbao'
import { person as zhangchunhua } from './zhangchunhua'
import { person as zhangfei } from './zhangfei'
import { person as zhanghe } from './zhanghe'
import { person as zhangjiao } from './zhangjiao'
import { person as zhangliao } from './zhangliao'
import { person as zhangrang } from './zhangrang'
import { person as zhangsong } from './zhangsong'
import { person as zhangxingcai } from './zhangxingcai'
import { person as zhangyun } from './zhangyun'
import { person as zhangzhao } from './zhangzhao'
import { person as zhaoyun } from './zhaoyun'
import { person as zhaozhong } from './zhaozhong'
import { person as zhenji } from './zhenji'
import { person as zhonghui } from './zhonghui'
import { person as zhoutai } from './zhoutai'
import { person as zhouyu } from './zhouyu'
import { person as zhugejin } from './zhugejin'
import { person as zhugeliang } from './zhugeliang'
import { person as zhurong } from './zhurong'
import { person as zoushi } from './zoushi'

const ENTRIES: PersonEntry[] = [
  bianshi,
  bujianying,
  caimao,
  caiwenji,
  caocao,
  caojie,
  caopi,
  caoren,
  caoshuang,
  cenhun,
  chengong,
  chengpu,
  chengyu,
  chunyuqiong,
  daqiao,
  dengai,
  dianwei,
  diaochan,
  dongbai,
  dongzhuo,
  duangui,
  fanshi,
  fazheng,
  fengji,
  fuhuanghou,
  fushiren,
  ganfuren,
  ganning,
  gaoshun,
  gongsunzan,
  guanping,
  guanxing,
  guanyinping,
  guanyu,
  guohuanghou,
  guojia,
  guosi,
  guotu,
  hetaihou,
  huanggai,
  huanghao,
  huangyueying,
  huangzhong,
  huatuo,
  huaxin,
  huaxiong,
  jiachong,
  jiangwei,
  jianshuo,
  jiaxu,
  lijue,
  liru,
  lisu,
  liubei,
  liubiao,
  liushan,
  liyan,
  lusu,
  luxun,
  lvbu,
  lvmeng,
  machao,
  madai,
  masu,
  mayunlu,
  mengda,
  menghuo,
  mifang,
  mifuren,
  panfuren,
  pangde,
  pangtong,
  simayi,
  simazhao,
  sunce,
  sunchen,
  sunhao,
  sunjian,
  sunluban,
  sunquan,
  sunshangxiang,
  taishici,
  wanglang,
  wangping,
  wangyi,
  wangyuanji,
  weiyan,
  wenchou,
  wuguotai,
  xiahoushi,
  xiahouyuan,
  xiaohoudun,
  xiaoqiao,
  xinxianying,
  xuchu,
  xuhuang,
  xunyou,
  xunyu,
  xushi,
  xuyou,
  yangsong,
  yangyi,
  yanliang,
  yuanshao,
  yuanshu,
  yujin,
  zhangbao,
  zhangchunhua,
  zhangfei,
  zhanghe,
  zhangjiao,
  zhangliao,
  zhangrang,
  zhangsong,
  zhangxingcai,
  zhangyun,
  zhangzhao,
  zhaoyun,
  zhaozhong,
  zhenji,
  zhonghui,
  zhoutai,
  zhouyu,
  zhugejin,
  zhugeliang,
  zhurong,
  zoushi,
]

export const PEOPLE: Record<string, PersonEntry> = Object.fromEntries(ENTRIES.map((e) => [e.id, e]))

export const PEOPLE_IDS: string[] = ENTRIES.map((e) => e.id)

export function getPerson(id: string): PersonEntry | undefined {
  return Object.hasOwn(PEOPLE, id) ? PEOPLE[id] : undefined
}
