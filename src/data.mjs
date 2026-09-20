export const SKILLS = [
  "Python 自动化", "前端开发", "数据分析", "Excel 数据分析", "手机摄影", "人像摄影",
  "旅行摄影", "视频剪辑", "短视频运营", "英语口语", "日语入门", "吉他弹唱",
  "尤克里里", "咖啡拉花", "健身入门", "平面设计", "PPT 设计"
];

export const SLOT_LABELS = {
  "mon-pm": "周一晚上", "tue-pm": "周二晚上", "wed-pm": "周三晚上", "thu-pm": "周四晚上",
  "fri-pm": "周五晚上", "sat-am": "周六上午", "sat-pm": "周六下午", "sat-night": "周六晚上",
  "sun-am": "周日上午", "sun-pm": "周日下午", "sun-night": "周日晚上"
};

export const DEMO_PROFILE = {
  id: "me",
  nickname: "林一",
  email: "",
  city: "上海",
  mode: "线上",
  duration: 45,
  onboarded: false,
  teaches: [{ skill: "手机摄影", level: 3 }],
  learns: [{ skill: "Python 自动化", priority: 3, targetLevel: 2 }],
  availability: ["tue-pm", "sat-am", "sat-pm"],
  proofs: [],
  reliability: null
};

export const PEOPLE = [
  {
    id: "chenye", name: "陈野", role: "后端工程师", city: "上海", mode: "线上", avatar: "陈", color: "blue", image: "assets/avatars/chenye.png",
    bio: "把重复工作交给脚本，也想把旅行认真拍下来。", reliability: 97,
    teaches: [{ skill: "Python 自动化", level: 3 }, { skill: "数据分析", level: 2 }],
    learns: [{ skill: "手机摄影", priority: 3, targetLevel: 2 }, { skill: "视频剪辑", priority: 1, targetLevel: 1 }],
    availability: ["tue-pm", "sat-am", "sat-pm"], proofs: [{ type: "video", name: "自动化项目演示" }]
  },
  {
    id: "songran", name: "宋然", role: "自由摄影师", city: "杭州", mode: "线上", avatar: "宋", color: "orange", image: "assets/avatars/songran.png",
    bio: "擅长用手机和自然光拍出有情绪的人像。", reliability: 94,
    teaches: [{ skill: "人像摄影", level: 3 }, { skill: "手机摄影", level: 3 }],
    learns: [{ skill: "英语口语", priority: 3, targetLevel: 2 }],
    availability: ["wed-pm", "sat-pm", "sun-am"], proofs: [{ type: "image", name: "人像作品集" }, { type: "image", name: "摄影奖项" }]
  },
  {
    id: "mia", name: "Mia", role: "留学顾问", city: "上海", mode: "均可", avatar: "M", color: "pink", image: "assets/avatars/mia.png",
    bio: "用真实场景陪你练表达，最近想完整弹唱三首歌。", reliability: 92,
    teaches: [{ skill: "英语口语", level: 3 }], learns: [{ skill: "吉他弹唱", priority: 3, targetLevel: 2 }],
    availability: ["thu-pm", "sat-am", "sun-night"], proofs: [{ type: "pdf", name: "语言能力证书" }]
  },
  {
    id: "zhouyuan", name: "周予安", role: "独立音乐人", city: "南京", mode: "线上", avatar: "周", color: "green", image: "assets/avatars/zhouyuan.png",
    bio: "从喜欢的歌开始学和弦，不用先背枯燥乐理。", reliability: 89,
    teaches: [{ skill: "吉他弹唱", level: 3 }, { skill: "尤克里里", level: 2 }],
    learns: [{ skill: "视频剪辑", priority: 3, targetLevel: 2 }], availability: ["fri-pm", "sat-night", "sun-pm"],
    proofs: [{ type: "video", name: "Live House 演出片段" }]
  },
  {
    id: "xuyi", name: "许一", role: "产品设计师", city: "北京", mode: "线上", avatar: "许", color: "violet", image: "assets/avatars/xuyi.png",
    bio: "可以陪你从空白搭出第一个网页作品。", reliability: 95,
    teaches: [{ skill: "前端开发", level: 2 }, { skill: "PPT 设计", level: 3 }],
    learns: [{ skill: "Excel 数据分析", priority: 3, targetLevel: 2 }], availability: ["tue-pm", "thu-pm", "sun-am"],
    proofs: [{ type: "image", name: "个人作品集" }]
  },
  {
    id: "aluo", name: "阿洛", role: "短视频编导", city: "广州", mode: "线上", avatar: "洛", color: "yellow", image: "assets/avatars/aluo.png",
    bio: "用一条真实素材，带你走完剪辑到发布。", reliability: 86,
    teaches: [{ skill: "视频剪辑", level: 3 }, { skill: "短视频运营", level: 2 }],
    learns: [{ skill: "Python 自动化", priority: 2, targetLevel: 1 }], availability: ["wed-pm", "sat-pm", "sun-pm"],
    proofs: [{ type: "video", name: "账号案例复盘" }]
  }
];

export function createInitialState() {
  return {
    version: 2,
    session: null,
    profile: structuredClone(DEMO_PROFILE),
    skillHours: 6.5,
    exchanges: [],
    selectedConversation: null,
    sessions: [
      { id: "session-demo-1", partnerId: "chenye", title: "Python 自动化 · 第 1 次", slot: "tue-pm", time: "20:00", duration: 45, status: "即将开始" },
      { id: "session-demo-2", partnerId: "songran", title: "人像构图 · 试学", slot: "sat-am", time: "10:00", duration: 20, status: "待确认" }
    ],
    notes: [{ id: "note-1", title: "自动化脚本的三个步骤", body: "读取数据 → 处理规则 → 输出结果。先让最小流程跑通。", updatedAt: "今天 09:40" }],
    assignments: [{ id: "assignment-1", title: "整理 20 张旅行照片", criteria: "选出 5 张并写下构图取舍", course: "手机摄影交换课", due: "周日前", status: "待完成", done: false }],
    posts: [
      { id: "post-1", author: "Mia", avatar: "M", color: "pink", type: "作业", content: "第一次用三个真实场景练习英语自我介绍，终于不再只会背模板。", likes: 18, liked: false, comments: 4, time: "12 分钟前" },
      { id: "post-2", author: "周予安", avatar: "周", color: "green", type: "笔记", content: "吉他和弦转换：我最容易卡住的两个地方，以及今天有效的慢练方法。", likes: 23, liked: false, comments: 6, time: "1 小时前" },
      { id: "post-3", author: "宋然", avatar: "宋", color: "orange", type: "阶段成果", content: "连续三周和搭子完成互换课。学习不是每天打卡，而是每次见面都有一点新进展。", likes: 41, liked: false, comments: 9, time: "昨天" }
    ]
  };
}

