const matches = [
  {
    name: "陈野",
    avatar: "陈",
    category: "编程",
    teaches: "Python 自动化",
    learns: "手机摄影",
    score: 96,
    city: "线上 / 上海",
    time: "工作日晚上",
    tags: ["适合零基础", "项目制", "可试学"],
    note: "想用摄影记录旅行，能带你做一个真实可运行的小脚本。"
  },
  {
    name: "宋然",
    avatar: "宋",
    category: "创作",
    teaches: "人像摄影",
    learns: "英语口语",
    score: 91,
    city: "线上 / 杭州",
    time: "周末下午",
    tags: ["作品点评", "审美训练", "打卡"],
    note: "擅长用手机拍出干净人像，希望找人练面试英语。"
  },
  {
    name: "Mia",
    avatar: "M",
    category: "语言",
    teaches: "英语口语",
    learns: "吉他弹唱",
    score: 88,
    city: "线上",
    time: "时间灵活",
    tags: ["陪练", "纠音", "轻松聊天"],
    note: "可以用真实场景陪练表达，想学三首能完整弹唱的歌。"
  },
  {
    name: "周骁",
    avatar: "周",
    category: "生活",
    teaches: "咖啡拉花",
    learns: "短视频剪辑",
    score: 84,
    city: "线下 / 广州",
    time: "周末上午",
    tags: ["线下友好", "器材齐全", "技能认证"],
    note: "咖啡店主理人，想把店铺日常剪成稳定更新内容。"
  },
  {
    name: "许一",
    avatar: "许",
    category: "编程",
    teaches: "前端页面搭建",
    learns: "Excel 数据分析",
    score: 82,
    city: "线上 / 北京",
    time: "工作日晚上",
    tags: ["代码陪跑", "简历项目", "可复盘"],
    note: "能带你做作品集页面，希望提升表格分析效率。"
  },
  {
    name: "阿洛",
    avatar: "洛",
    category: "创作",
    teaches: "视频剪辑",
    learns: "Python",
    score: 79,
    city: "线上",
    time: "周末下午",
    tags: ["软件入门", "作业反馈", "节奏稳定"],
    note: "熟悉短视频账号剪辑流程，想学习批量处理素材。"
  }
];

const matchList = document.querySelector("#matchList");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#skillSearch");
const filterButtons = document.querySelectorAll("[data-filter]");
const dialog = document.querySelector("#postDialog");
const openPost = document.querySelector("#openPost");
const postForm = document.querySelector("#postForm");
const toast = document.querySelector("#toast");

let activeFilter = "全部";

function renderMatches() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = matches.filter((match) => {
    const haystack = `${match.name} ${match.category} ${match.teaches} ${match.learns} ${match.tags.join(" ")}`.toLowerCase();
    const categoryMatched = activeFilter === "全部" || match.category === activeFilter;
    return categoryMatched && (!keyword || haystack.includes(keyword));
  });

  resultCount.textContent = `${filtered.length} 个匹配`;
  matchList.innerHTML = filtered
    .map(
      (match) => `
        <article class="match-card">
          <div class="match-head">
            <div class="person">
              <div class="avatar">${match.avatar}</div>
              <div>
                <strong>${match.name}</strong>
                <p>${match.city} · ${match.time}</p>
              </div>
            </div>
            <span class="score">${match.score}% 匹配</span>
          </div>
          <div class="skill-row">
            <div class="skill-box">
              <span>TA 能教</span>
              <strong>${match.teaches}</strong>
            </div>
            <div class="skill-box">
              <span>TA 想学</span>
              <strong>${match.learns}</strong>
            </div>
          </div>
          <p>${match.note}</p>
          <div class="tag-list">
            ${match.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
          <div class="card-actions">
            <button class="secondary-action" type="button" data-name="${match.name}">查看交换卡</button>
            <button class="primary-action" type="button" data-connect="${match.name}">发起试学</button>
          </div>
        </article>
      `
    )
    .join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderMatches();
  });
});

searchInput.addEventListener("input", renderMatches);

openPost.addEventListener("click", () => {
  dialog.showModal();
});

postForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(postForm);
  const teach = formData.get("teach");
  const learn = formData.get("learn");

  matches.unshift({
    name: "我的交换卡",
    avatar: "我",
    category: "全部",
    teaches: teach,
    learns: learn,
    score: 99,
    city: formData.get("mode"),
    time: formData.get("time"),
    tags: ["新发布", "等待匹配", "目标清晰"],
    note: formData.get("goal") || "希望找到互相督促、稳定交换的学习伙伴。"
  });

  postForm.reset();
  dialog.close();
  activeFilter = "全部";
  filterButtons.forEach((item) => item.classList.toggle("active", item.dataset.filter === "全部"));
  renderMatches();
  showToast("已生成你的交换卡，并排到推荐列表第一位");
});

document.addEventListener("click", (event) => {
  const connectName = event.target.dataset.connect;
  const cardName = event.target.dataset.name;

  if (connectName) {
    showToast(`已向 ${connectName} 发起 20 分钟试学邀请`);
  }

  if (cardName) {
    showToast(`${cardName} 的技能证明、时间表和评价已展开预览`);
  }
});

renderMatches();
