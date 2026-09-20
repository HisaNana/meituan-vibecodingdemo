import { PEOPLE, SKILLS, SLOT_LABELS } from "./data.mjs";
import { rankMatches } from "./matching.mjs";
import { EXCHANGE_STAGES, accountGate, advanceExchange, createExchange, validateRegistration } from "./workflow.mjs";
import { clearProofBlobs, getProofBlob, loadState, resetState, saveProofBlob, saveState } from "./store.mjs";
import { customSelect } from "./ui.mjs";
import { filterHallMatches, recommendUnselectedSkills } from "./discovery.mjs";
import { sortMatchResults } from "./match-sort.mjs";
import { HOMEWORK_STAGES, advanceHomework, createSharedNote } from "./learning.mjs";
import { shouldCommitSearch } from "./search.mjs";
import { compactSlotLabel } from "./schedule.mjs";

const app = document.querySelector("#app");
const modal = document.querySelector("#modal");
const toast = document.querySelector("#toast");
let state = loadState();
let searchTerm = "";
let pendingPartnerId = null;
let wizardDraft = null;
let wizardStep = 1;
let mediaStream = null;
let hallFilters = { evening: false, online: false, local: false, skill: "" };
let matchSort = "overall";
let searchCompositionActive = false;
let pendingSearchTerm = "";

const NAV = [
  ["square", "⌂", "技能广场"], ["matches", "✦", "配对雷达"], ["journey", "⇄", "交换旅程"],
  ["mail", "▣", "搭子信箱"], ["classroom", "◉", "共学空间"], ["social", "♧", "同学圈"], ["profile", "⌁", "成长档案"]
];
const SCORE_LABELS = { learning:"学习命中", reciprocity:"双向互补", availability:"时间重合", level:"水平适配", preference:"方式地点", proof:"能力证明", reliability:"履约表现" };
const SCORE_MAX = { learning:35, reciprocity:25, availability:15, level:10, preference:5, proof:5, reliability:5 };

function esc(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]);
}
function persist() { saveState(state); }
function person(id) { return PEOPLE.find((item) => item.id === id); }
function currentRoute() { return (location.hash.replace(/^#\//, "").split("/")[0] || "square"); }
function showToast(message) { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2300); }
function slotLabel(slot) { return SLOT_LABELS[slot] || slot || "时间待协商"; }
function avatarMarkup(item, size = "") {
  const matchedPerson=PEOPLE.find((candidate)=>candidate.id===item.id||candidate.name===item.name||candidate.name===item.author);
  const image=item.image||matchedPerson?.image;
  return `<span class="avatar ${item.color || matchedPerson?.color || ""} ${size}">${image?`<img src="${image}" alt="${esc(item.name||item.author||"学习伙伴")}的卡通头像">`:esc(item.avatar || item.name?.slice(0,1) || "我")}</span>`;
}
function closeModal() { if (modal.open) modal.close(); modal.innerHTML = ""; }
function openModal(content) { modal.innerHTML = content; if (!modal.open) modal.showModal(); }
function requireAccount(callback) {
  const gate = accountGate(state.session, state.profile.onboarded);
  if (gate === "ready") return callback();
  if (gate === "onboard") return startOnboarding();
  openRegistration(callback);
}

function getRanked() {
  return rankMatches(state.profile, PEOPLE).filter(({ partner }) => {
    const haystack = `${partner.name} ${partner.role} ${partner.teaches.map((x)=>x.skill)} ${partner.learns.map((x)=>x.skill)}`.toLowerCase();
    return !searchTerm || haystack.includes(searchTerm.toLowerCase());
  });
}

function pageHead(kicker, title) {
  return `<header class="page-head"><div><p>${kicker}</p><h1>${title}</h1></div><div class="page-tools"><input class="search" data-search placeholder="搜索技能或伙伴" value="${esc(searchTerm)}"><a class="icon-button profile-shortcut" href="#/profile" title="成长档案">我</a></div></header>`;
}

function frame(content) {
  const route = currentRoute();
  const name = state.session ? state.profile.nickname : "体验访客";
  app.innerHTML = `<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">S</span><div><strong>SkillSwap</strong><span>交换技能，一起成长</span></div></div><button class="create-button" data-create>＋　发起交换</button><nav class="nav-list">${NAV.map(([path,icon,label])=>`<a class="nav-link ${route===path?"active":""}" href="#/${path}"><span class="nav-icon">${icon}</span>${label}</a>`).join("")}</nav><div class="side-profile">${avatarMarkup({avatar:name.slice(0,1),color:"green"})}<div><strong>${esc(name)}</strong><span>${state.skillHours} 技能时数 · ${state.session?"体验账号":"未登录"}</span></div></div></aside><main class="main">${content}</main></div>`;
}

function matchCard(result) {
  const p = result.partner;
  return `<article class="panel match-card"><div class="match-top"><div class="person-row">${avatarMarkup(p)}<div class="person-copy"><strong>${p.name}</strong><span>${p.city} · ${p.role}</span></div></div><span class="score">${result.score}%</span></div><span class="type-badge">${result.type}</span><div class="skill-pair"><span>TA 能教<strong>${esc(result.skillPair.partnerTeaches)}</strong></span><b>⇄</b><span>TA 想学<strong>${esc(result.skillPair.partnerLearns)}</strong></span></div><div class="reason-list">${result.reasons.map((x)=>`<span class="reason">${x}</span>`).join("")}</div><div class="card-actions"><button class="ghost" data-score="${p.id}">分数详情</button><button class="primary" data-apply="${p.id}">发起交换</button></div></article>`;
}

function scheduleList() {
  return state.sessions.slice(0,3).map((item)=>{ const p=person(item.partnerId)||{name:"学习搭子"}; return `<div class="schedule-item"><div class="date-box"><span>${esc(compactSlotLabel(slotLabel(item.slot)))}</span><strong>${esc(item.time)}</strong></div><div><strong>${esc(item.title)}</strong><span>${p.name} · ${item.duration} 分钟</span></div></div>`; }).join("");
}
function miniPosts() { return state.posts.slice(0,2).map((post)=>`<div class="feed-mini">${avatarMarkup(post)}<div><strong>${esc(post.author)} · ${post.type}</strong><p>${esc(post.content)}</p><span class="feed-meta">♡ ${post.likes}　💬 ${post.comments}　· ${post.time}</span></div></div>`).join(""); }

function discoveryCard(item,index){return `<button class="skill-discovery tone-${index%4}" data-discover-skill="${esc(item.skill)}"><span class="discovery-copy"><small>新技能推荐</small><strong>${esc(item.skill)}</strong><em>${item.mentors} 位搭子能教 · ${item.eveningMentors} 位今晚有空</em></span></button>`;}

function squareView() {
  const allRanked=getRanked(); const ranked=filterHallMatches(allRanked,hallFilters,state.profile); const top=allRanked[0];
  const discoveries=recommendUnselectedSkills(state.profile,PEOPLE); const noFilters=!hallFilters.evening&&!hallFilters.online&&!hallFilters.local&&!hallFilters.skill;
  const offeredSkills=[...new Set(PEOPLE.flatMap((item)=>item.teaches.map(({skill})=>skill)))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
  const filters=`<div class="hall-filters"><div class="chips"><button class="chip ${noFilters?"active":""}" data-clear-hall>推荐</button><button class="chip ${hallFilters.evening?"active":""}" data-hall-filter="evening">今晚有空</button><button class="chip ${hallFilters.online?"active":""}" data-hall-filter="online">线上</button><button class="chip ${hallFilters.local?"active":""}" data-hall-filter="local">同城</button></div><div class="filter-tools">${customSelect({value:hallFilters.skill,options:[{value:"",label:"按技能筛选"},...offeredSkills.map(skill=>({value:skill,label:skill}))],label:"按技能筛选",data:{"hall-skill":"true"},className:"skill-filter"})}<button class="filter-reset" data-clear-hall ${noFilters?"disabled":""}>清空筛选</button></div></div>`;
  const results=ranked.length?`<div class="match-grid">${ranked.slice(0,6).map(matchCard).join("")}</div>`:`<div class="panel filter-empty"><span>没有同时满足这些条件的伙伴</span><p>减少一个筛选条件，或者换一项技能看看。</p><button class="ghost" data-clear-hall>清除筛选</button></div>`;
  frame(`${pageHead("星期日 · 发现新的可能", "技能广场")}<section class="hero"><div><h2>你想学的，<br>刚好有人会。</h2><p>逛逛大厅里的真实技能，找到今晚就能聊起来的学习伙伴。</p><button class="primary" data-radar>开启配对雷达 →</button></div>${top?`<div class="hero-match"><strong>今日最佳组合 · ${top.score}%</strong><div class="swap-route"><span>你学 ${esc(top.skillPair.learn)}</span><b class="route-arrow">⇄</b><span>你教 ${esc(top.skillPair.teach)}</span></div></div>`:""}</section><section class="discovery-section"><div class="section-head"><div><p class="eyebrow">跳出当前画像</p><h2>探索新技能</h2></div><span class="section-note">根据大厅里正在分享的技能推荐</span></div><div class="discovery-grid">${discoveries.map(discoveryCard).join("")}</div></section><div class="content-grid"><section><div class="section-head"><div><p class="eyebrow">技能大厅</p><h2>正在找搭子的伙伴</h2></div><span class="result-count">找到 ${ranked.length} 位</span></div>${filters}${results}</section><aside class="side-stack"><section class="panel side-panel"><div class="section-head"><h3>本周共学</h3><a class="text-link" href="#/classroom">课程表</a></div>${scheduleList()}</section><section class="panel side-panel"><div class="section-head"><h3>同学新动态</h3><a class="text-link" href="#/social">进入同学圈</a></div>${miniPosts()}</section></aside></div>`);
}

function resultCard(result) {
  const p=result.partner;
  return `<article class="panel result-card"><div class="result-score"><span class="score-ring" style="--score:${result.score}"><strong>${result.score}</strong></span><div class="person-row">${avatarMarkup(p)}<div class="person-copy"><strong>${p.name}</strong><span>${p.role} · ${result.type}</span></div></div></div><div><div class="skill-pair"><span>你学<strong>${esc(result.skillPair.learn)}</strong></span><b>⇄</b><span>你教<strong>${esc(result.skillPair.teach)}</strong></span></div><div class="reason-list" style="margin-top:10px">${result.reasons.map((x)=>`<span class="reason">${x}</span>`).join("")}</div></div><button class="primary" data-score="${p.id}">查看完整计算</button></article>`;
}
function matchesView() {
  const candidates=getRanked(); const ranked=sortMatchResults(candidates,matchSort); const avg=Math.round(candidates.reduce((s,x)=>s+x.score,0)/candidates.length||0); const direct=candidates.filter(x=>x.type==="直接互换").length;
  const modes=[['overall','综合排序'],['availability','时间最合适'],['reciprocity','技能互补最高'],['hours','技能时数交换']];
  const results=ranked.length?ranked.map(resultCard).join(""):`<div class="panel filter-empty"><span>当前没有技能时数交换候选</span><p>完善更多想学技能后，雷达会自动重新计算。</p><button class="ghost" data-match-sort="overall">返回综合排序</button></div>`;
  frame(`${pageHead("每一分都有理由", "配对雷达")}<section class="metrics"><div class="panel metric"><span>候选搭子</span><strong>${candidates.length}</strong><small>基于你的技能画像</small></div><div class="panel metric"><span>平均匹配</span><strong>${avg}%</strong><small>综合七项因素</small></div><div class="panel metric"><span>直接互换</span><strong>${direct}</strong><small>双方需求互补</small></div></section><div class="chips radar-sorts">${modes.map(([value,label])=>`<button class="chip ${matchSort===value?'active':''}" data-match-sort="${value}" aria-pressed="${matchSort===value}">${label}</button>`).join("")}</div><section class="full-list">${results}</section>`);
}

function journeyView() {
  const cards=state.exchanges.length?state.exchanges.map((item)=>{const p=person(item.partnerId);const idx=EXCHANGE_STAGES.indexOf(item.status);return `<article class="panel journey-card"><div class="match-top"><div class="person-row">${avatarMarkup(p)}<div class="person-copy"><strong>与 ${p.name} 的技能交换</strong><span>${esc(item.skillPair.teach||"技能时数")} ⇄ ${esc(item.skillPair.learn||"")} · ${slotLabel(item.slot)}</span></div></div><span class="score">${item.status}</span></div><div class="journey-progress">${EXCHANGE_STAGES.map((stage,i)=>`<span class="step ${i<=idx?"done":""}">${stage}</span>`).join("")}</div><div class="card-actions"><button class="ghost" data-chat="${item.id}">进入聊天</button>${item.status!=="已完成"?`<button class="primary" data-advance="${item.id}">${item.status==="待回应"?"体验对方回应":"推进下一步"}</button>`:"<button class='ghost' data-note>写复盘</button>"}</div></article>`;}).join(""):`<div class="panel empty"><span class="empty-icon">⇄</span><h3>还没有交换旅程</h3><p>从配对雷达选择一位搭子，技能交换才不只是一次聊天，而是一段有进度的学习关系。</p><a class="primary" href="#/matches">去找技能搭子</a></div>`;
  frame(`${pageHead("从申请到共同完成", "交换旅程")}<section class="full-list">${cards}</section>`);
}

function mailView() {
  const exchanges=state.exchanges; if(!exchanges.length){frame(`${pageHead("和搭子把目标说清楚", "搭子信箱")}<div class="panel empty"><span class="empty-icon">▣</span><h3>建立交换后，就能开始聊天</h3><p>时间卡、作业卡和课堂邀请会和普通消息一起保存在这里。</p><a class="primary" href="#/matches">查看配对</a></div>`);return;}
  const selected=exchanges.find(x=>x.id===state.selectedConversation)||exchanges[0]; state.selectedConversation=selected.id; const p=person(selected.partnerId);
  frame(`${pageHead("目标、时间和作业都在一个地方", "搭子信箱")}<section class="panel message-layout"><aside class="conversation-list">${exchanges.map((item)=>{const x=person(item.partnerId);const last=item.messages.at(-1);return `<button class="conversation ${item.id===selected.id?"active":""}" data-conversation="${item.id}">${avatarMarkup(x)}<span class="conversation-copy"><strong>${x.name}</strong><span>${esc(last?.text||"开始聊聊")}</span></span></button>`;}).join("")}</aside><div class="chat"><header class="chat-head"><div class="person-row">${avatarMarkup(p)}<div class="person-copy"><strong>${p.name}</strong><span>${selected.status} · 通常很快回复</span></div></div><a class="text-link" href="#/journey">查看旅程</a></header><div class="messages">${selected.messages.map((message)=>`<div class="message ${message.sender==="me"?"me":message.sender==="system"?"system":""}">${esc(message.text)}</div>`).join("")}</div><div class="quick-actions"><button class="chip" data-quick="time">分享空闲时间</button><button class="chip" data-quick="assignment">发送作业卡</button><button class="chip" data-quick="classroom">发送课堂邀请</button></div><form class="chat-form" data-chat-form><input name="message" required autocomplete="off" placeholder="和 ${p.name} 说点什么…"><button class="primary">发送</button></form></div></section>`);
}

function homeworkStatus(item){return HOMEWORK_STAGES.includes(item.status)?item.status:(item.done?"已完成":"待确认");}
function homeworkCard(item,partner){
  const status=homeworkStatus(item); const action={"待确认":["accept","确认领取"],"已领取":["complete","标记已完成"]}[status]; const stageIndex=HOMEWORK_STAGES.indexOf(status);
  return `<article class="homework-card"><div class="homework-person">${avatarMarkup(partner)}<div><span>${esc(item.partnerName||partner.name)} 布置给你</span><strong>${esc(item.title)}</strong></div><b class="homework-status">${status}</b></div><p class="homework-criteria">完成标准：${esc(item.criteria||"按课堂约定完成练习")}</p><div class="homework-meta"><span>◷ ${esc(item.due||"下次课前")}</span><span>⌁ ${esc(item.course||"共学课程")}</span></div><div class="homework-path">${HOMEWORK_STAGES.map((stage,index)=>`<span class="${index<=stageIndex?'done':''}"><i>${index<stageIndex?'✓':index+1}</i>${stage}</span>`).join("")}</div>${action?`<button class="${status==='待确认'?'primary':'secondary'} wide" data-homework-action="${action[0]}" data-homework-id="${item.id}">${action[1]}</button>`:`<div class="homework-finished">✓ 已完成，等待下次课一起复盘</div>`}</article>`;
}

function classroomView() {
  const session=state.sessions[0]; const p=person(session?.partnerId)||PEOPLE[0]; const recentNote=state.notes[0];
  frame(`${pageHead("从一起上课，到一起完成", "共学空间")}<div class="classroom-wrap"><div class="classroom-layout"><section class="classroom"><div class="video-stage"><div class="remote-video">${avatarMarkup({...p,avatar:p.avatar},"")}<span class="video-label">${p.name} · 示例远端画面</span></div><div class="local-video"><video id="localMedia" autoplay muted playsinline></video><span class="video-label">我</span></div></div><div class="media-controls"><button class="media-button" data-media="camera">◉ 开启摄像头</button><button class="media-button" data-media="mic">♬ 麦克风</button><button class="media-button" data-media="screen">▣ 共享屏幕</button><button class="media-button stop" data-media="stop">结束媒体</button></div></section><aside class="lesson-side"><section class="panel lesson-card"><div class="section-head"><h3>${esc(session?.title||"技能交换课堂")}</h3><span class="mini-badge">${session?.duration||45} 分钟</span></div><ol class="lesson-outline"><li>确认本节课目标</li><li>搭子演示与跟练</li><li>独立完成一个小任务</li><li>确认搭子布置的作业</li></ol><div class="lesson-note-count"><span>已记录</span><strong>${state.notes.length}</strong><span>条笔记</span></div></section>${recentNote?`<section class="panel recent-note"><span>最近记录 · ${esc(recentNote.shareStatus||"仅自己可见")}</span><strong>${esc(recentNote.title)}</strong><p>${esc(recentNote.takeaway||recentNote.body)}</p></section>`:""}</aside></div><div class="after-class-grid"><section class="panel homework-workbench"><div class="workbench-head"><span class="workbench-icon homework-icon">✓</span><div><p class="eyebrow">下次课前完成</p><h2>搭子发来的课后任务</h2><p>${p.name} 已经把练习目标整理好了，确认后会加入你的学习计划。</p></div></div><div class="homework-list">${state.assignments.map(item=>homeworkCard(item,p)).join("")}</div></section><section class="panel learning-workbench"><div class="workbench-head"><span class="workbench-icon note-icon">✎</span><div><p class="eyebrow">课后回顾</p><h2>把笔记发给 ${p.name}</h2><p>整理本节收获和问题，让搭子提前了解你的学习进度。</p></div></div><form class="note-form" data-note-form data-session-id="${session?.id||''}" data-partner-id="${p.id}"><label class="field">笔记标题<input name="title" required placeholder="例如：Python 列表处理的三个关键点"></label><label class="field">这节课我学会了<textarea name="takeaway" rows="3" required placeholder="用自己的话记录方法和原理…"></textarea></label><div class="note-pair"><label class="field">还想问搭子<textarea name="question" rows="2" placeholder="下次课想继续问什么？"></textarea></label><label class="field">下次课前我会<textarea name="nextStep" rows="2" required placeholder="准备完成的最小行动…"></textarea></label></div><button class="primary wide">提交给 ${p.name} 查看</button><small class="form-hint">提交后也会记录到你的成长档案</small></form></section></div></div>`);
}

function socialView() {
  frame(`${pageHead("不用每天打卡，也能看见成长", "同学圈")}<div class="feed-layout"><section><form class="panel composer" data-post-form><div class="person-row">${avatarMarkup({avatar:(state.profile.nickname||"我")[0],color:"green"})}<div class="person-copy"><strong>分享一次真实进展</strong><span>作业、知识笔记或阶段成果</span></div></div><textarea name="content" required placeholder="今天学会了什么？哪里还卡住？"></textarea><div class="composer-actions">${customSelect({name:"type",value:"阶段成果",options:["阶段成果","作业","笔记"],label:"动态类型",className:"compact"})}<button class="primary">发布动态</button></div></form><div class="post-list">${state.posts.map((post)=>`<article class="panel post-card"><div class="person-row">${avatarMarkup(post)}<div class="person-copy"><strong>${esc(post.author)}</strong><span>${post.type} · ${post.time}</span></div></div><p>${esc(post.content)}</p><div class="post-actions"><button class="${post.liked?"liked":""}" data-like="${post.id}">♡ ${post.likes}</button><button data-comment="${post.id}">💬 ${post.comments}</button><button>↗ 分享</button></div></article>`).join("")}</div></section><aside class="side-stack"><section class="panel progress-card"><div class="section-head"><h3>本周成长</h3><span>58%</span></div><div class="progress-line"><span></span></div><p>完成 1 次共学、1 份作业和 2 条笔记。</p></section><section class="panel side-panel"><div class="section-head"><h3>待完成作业</h3></div>${state.assignments.map((a)=>`<div class="schedule-item"><span class="date-box">${a.done?"✓":"待办"}</span><div><strong>${esc(a.title)}</strong><span>${a.course} · ${a.due}</span></div></div>`).join("")}</section></aside></div>`);
}

function profileView() {
  const p=state.profile; const proofMarkup=p.proofs.length?p.proofs.map((proof)=>`<div class="proof-card" data-proof-preview="${proof.id}"><span>▧<br>${esc(proof.name)}</span></div>`).join(""):`<div class="proof-card"><span>还没有证明材料<br>完善后可提高可信度</span></div>`;
  frame(`${pageHead("技能、时间和学习成果都属于你", "成长档案")}<div class="profile-grid"><section class="panel profile-main profile-hero">${avatarMarkup({avatar:(p.nickname||"我")[0],color:"green"})}<h2>${esc(p.nickname||"体验访客")}</h2><p>${esc(p.city)} · ${esc(p.mode)} · ${p.duration} 分钟/次</p><div class="stat-row"><div class="stat"><strong>${state.skillHours}</strong><span>技能时数</span></div><div class="stat"><strong>${state.sessions.length}</strong><span>共学课程</span></div><div class="stat"><strong>${state.notes.length}</strong><span>知识笔记</span></div></div><button class="primary wide" data-edit-profile>${state.session?"重新设置技能画像":"创建体验账号"}</button><button class="danger wide" style="margin-top:9px" data-reset>重置体验数据</button></section><div class="profile-stack"><section class="panel profile-block"><div class="section-head"><h3>我的技能画像</h3><button class="text-link" data-edit-profile>编辑</button></div><div class="skill-columns"><div class="skill-column"><h4>我想学</h4><div class="tag-list">${p.learns.map(x=>`<span class="tag">${esc(x.skill)} · 优先级 ${x.priority}</span>`).join("")}</div></div><div class="skill-column"><h4>我能教</h4><div class="tag-list">${p.teaches.map(x=>`<span class="tag">${esc(x.skill)} · Lv.${x.level}</span>`).join("")}</div></div></div></section><section class="panel profile-block"><div class="section-head"><h3>能力证明</h3><span>${p.proofs.length}/3</span></div><div class="proof-grid">${proofMarkup}</div></section><section class="panel profile-block"><div class="section-head"><h3>知识笔记</h3><a class="text-link" href="#/classroom">新增笔记</a></div>${state.notes.map(note=>`<div class="schedule-item"><span class="date-box">笔记</span><div><strong>${esc(note.title)}</strong><span>${esc(note.body)} · ${note.updatedAt}</span></div></div>`).join("")}</section></div></div>`); attachProofPreviews();
}

function render() {
  const route=currentRoute();
  ({square:squareView,matches:matchesView,journey:journeyView,mail:mailView,classroom:classroomView,social:socialView,profile:profileView}[route]||squareView)();
}

function openRegistration(after) {
  pendingPartnerId=typeof after==="string"?after:null;
  openModal(`<form class="modal-body" data-register><div class="modal-head"><div><p>30 秒体验账号</p><h2>先认识一下，再开始交换</h2></div><button type="button" class="close" data-close>×</button></div><div class="modal-note">账号仅保存在当前浏览器，不发送验证码，也不会上传个人信息。</div><div class="form-grid" style="margin-top:16px"><label class="field">昵称<input name="nickname" required placeholder="大家怎么称呼你"></label><label class="field">邮箱<input name="email" type="email" required placeholder="you@example.com"></label><label class="field">密码<input name="password" type="password" minlength="6" required placeholder="至少 6 位"></label><div data-register-errors></div><button class="primary wide">创建账号并完善技能画像</button></div></form>`);
}

function startOnboarding() { wizardDraft=structuredClone(state.profile); wizardStep=1; renderWizard(); }
function selectedRows(kind) {
  const items=wizardDraft[kind]; const isLearn=kind==="learns";
  return items.map((item,index)=>`<div class="selected-row"><strong>${esc(item.skill)}</strong>${customSelect({value:isLearn?item.targetLevel:item.level,options:isLearn?[{value:1,label:"目标：入门"},{value:2,label:"目标：熟练"},{value:3,label:"目标：进阶"}]:[{value:1,label:"水平：入门"},{value:2,label:"水平：熟练"},{value:3,label:"水平：专业"}],label:isLearn?"目标水平":"教学水平",data:{"level-kind":kind,"level-index":index},className:"drop-up"})}<button type="button" class="icon-button remove-button" data-remove-skill="${kind}" data-index="${index}" aria-label="移除 ${esc(item.skill)}">×</button></div>`).join("");
}
function skillPicker(kind) { const chosen=new Set(wizardDraft[kind].map(x=>x.skill));return `<div class="skill-selector">${SKILLS.map(skill=>`<button type="button" class="skill-option ${chosen.has(skill)?"selected":""}" data-skill-kind="${kind}" data-skill="${skill}">${skill}</button>`).join("")}</div><div class="selected-skills">${selectedRows(kind)}</div>`; }
function renderWizard() {
  const body=wizardStep===1?`<p class="wizard-intro">选择 1–5 项想学的内容，并设置每项目标水平。</p>${skillPicker("learns")}`:wizardStep===2?`<p class="wizard-intro">选择 1–5 项能教的技能，能力证明会参与可信度评分。</p>${skillPicker("teaches")}<label class="upload-zone">＋ 上传证书、奖项、作品或短视频（最多3项，单项20MB）<input id="proofInput" type="file" multiple accept="image/*,video/*,.pdf"></label><div class="file-list">${wizardDraft.proofs.map((proof,index)=>`<div class="file-item"><span>${esc(proof.name)}</span><button type="button" class="text-link" data-remove-proof="${index}">删除</button></div>`).join("")}</div>`:`<p class="wizard-intro">选择你通常能上课的时间。匹配时会计算真实重叠时段。</p><div class="schedule-grid">${Object.entries(SLOT_LABELS).map(([id,label])=>`<button type="button" class="schedule-option ${wizardDraft.availability.includes(id)?"selected":""}" data-slot="${id}">${label}</button>`).join("")}</div><div class="form-grid two wizard-preferences"><label class="field">上课方式${customSelect({value:wizardDraft.mode,options:["线上","线下","均可"],label:"上课方式",data:{pref:"mode"}})}</label><label class="field">所在城市<input data-pref="city" value="${esc(wizardDraft.city)}"></label><label class="field">单次时长${customSelect({value:wizardDraft.duration,options:[{value:20,label:"20 分钟试学"},{value:45,label:"45 分钟"},{value:60,label:"60 分钟"},{value:90,label:"90 分钟"}],label:"单次时长",data:{pref:"duration"}})}</label></div>`;
  openModal(`<div class="modal-body"><div class="modal-head"><div><p>技能画像 · ${wizardStep}/3</p><h2>${["你最想学什么？","哪些技能可以分享？","什么时候方便共学？"][wizardStep-1]}</h2></div><button type="button" class="close" data-close>×</button></div><div class="wizard-progress">${[1,2,3].map(i=>`<span class="${i<=wizardStep?"active":""}"></span>`).join("")}</div>${body}<div class="modal-actions">${wizardStep>1?`<button class="ghost" data-wizard-back>上一步</button>`:""}<button class="primary" data-wizard-next>${wizardStep===3?"完成并查看匹配":"下一步"}</button></div></div>`);
}

function openScore(partnerId) {
  const result=getRanked().find(x=>x.partner.id===partnerId)||rankMatches(state.profile,[person(partnerId)])[0]; const p=result.partner;
  openModal(`<div class="modal-body"><div class="modal-head"><div><p>匹配解释</p><h2>你和 ${p.name} 为什么是 ${result.score}%？</h2></div><button class="close" data-close>×</button></div><div class="skill-pair"><span>你想学<strong>${result.skillPair.learn}</strong></span><b>⇄</b><span>你能教<strong>${result.skillPair.teach}</strong></span></div><div class="score-detail" style="margin-top:18px">${Object.entries(result.breakdown).map(([key,value])=>`<div class="detail-row"><span>${SCORE_LABELS[key]}</span><div class="bar-track"><div class="bar-fill" style="width:${value/SCORE_MAX[key]*100}%"></div></div><strong>${value}/${SCORE_MAX[key]}</strong></div>`).join("")}</div>${result.sharedSlots.length?`<div class="modal-note" style="margin-top:17px">共同时间：${result.sharedSlots.map(slotLabel).join("、")}</div>`:`<div class="modal-note" style="margin-top:17px">暂时没有共同时间，可先聊天协调临时时段。</div>`}<div class="modal-actions"><button class="ghost" data-close>先看看</button><button class="primary" data-apply="${p.id}">发起交换</button></div></div>`);
}
function openApplication(partnerId) {
  const result=rankMatches(state.profile,[person(partnerId)])[0]; const slots=result.sharedSlots.length?result.sharedSlots:state.profile.availability;
  openModal(`<form class="modal-body" data-application data-partner="${partnerId}"><div class="modal-head"><div><p>${result.type}</p><h2>向 ${result.partner.name} 发起交换</h2></div><button type="button" class="close" data-close>×</button></div><div class="skill-pair"><span>我想学<strong>${result.skillPair.learn}</strong></span><b>⇄</b><span>我能教<strong>${result.skillPair.teach}</strong></span></div><div class="form-grid two application-prefs"><label class="field">课程类型${customSelect({name:"lessonType",value:"20分钟试学",options:["20分钟试学","正式课程"],label:"课程类型"})}</label><label class="field">建议时间${customSelect({name:"slot",value:slots[0],options:slots.map(slot=>({value:slot,label:slotLabel(slot)})),label:"建议时间"})}</label></div><label class="field application-message">想对TA说<textarea name="message" rows="3">你好！我们的技能和时间都很合适，想先一起完成一次小目标。</textarea></label><div class="modal-note application-note">体验模式：示例伙伴会自动回应，方便完整体验交换流程。</div><div class="modal-actions"><button type="button" class="ghost" data-close>取消</button><button class="primary">发送申请</button></div></form>`);
}

async function attachProofPreviews() {
  for (const element of document.querySelectorAll("[data-proof-preview]")) {
    try { const blob=await getProofBlob(element.dataset.proofPreview); if(!blob)continue; const url=URL.createObjectURL(blob); element.innerHTML=blob.type.startsWith("image/")?`<img src="${url}" alt="能力证明">`:blob.type.startsWith("video/")?`<video src="${url}" muted controls></video>`:`<span>PDF<br>${esc(state.profile.proofs.find(x=>x.id===element.dataset.proofPreview)?.name)}</span>`; } catch {}
  }
}

async function handleMedia(action, button) {
  try {
    const video=document.querySelector("#localMedia");
    if(action==="camera") { if(!mediaStream) mediaStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true}); video.srcObject=mediaStream; button.classList.add("active"); showToast("摄像头和麦克风已开启"); }
    if(action==="mic") { if(!mediaStream) mediaStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false}); const track=mediaStream.getAudioTracks()[0]; if(track){track.enabled=!track.enabled;button.classList.toggle("active",track.enabled);showToast(track.enabled?"麦克风已开启":"麦克风已静音");} }
    if(action==="screen") { const screen=await navigator.mediaDevices.getDisplayMedia({video:true}); if(mediaStream) mediaStream.getTracks().forEach(x=>x.stop()); mediaStream=screen; video.srcObject=screen; button.classList.add("active"); showToast("正在共享屏幕"); }
    if(action==="stop") { mediaStream?.getTracks().forEach(x=>x.stop()); mediaStream=null; if(video)video.srcObject=null; document.querySelectorAll(".media-button").forEach(x=>x.classList.remove("active")); showToast("媒体设备已关闭"); }
  } catch { showToast("未获得设备权限，仍可继续使用课堂笔记"); }
}

function closeSelectMenus(except = null) {
  document.querySelectorAll(".select-shell.open").forEach((shell) => {
    if (shell === except) return;
    shell.classList.remove("open");
    shell.querySelector(".select-trigger")?.setAttribute("aria-expanded", "false");
    const menu = shell.querySelector(".select-menu");
    if (menu) menu.hidden = true;
  });
}

function toggleSelect(shell) {
  const willOpen = !shell.classList.contains("open");
  closeSelectMenus(shell);
  shell.classList.toggle("open", willOpen);
  shell.querySelector(".select-trigger")?.setAttribute("aria-expanded", String(willOpen));
  const menu = shell.querySelector(".select-menu");
  if (menu) menu.hidden = !willOpen;
  if (willOpen) shell.querySelector(".select-option.selected")?.focus();
}

function chooseSelectOption(shell, option) {
  const value = option.dataset.selectValue;
  const label = option.querySelector("span")?.textContent || value;
  const input = shell.querySelector("[data-select-input]");
  if (input) input.value = value;
  shell.querySelector(".select-trigger span").textContent = label;
  shell.querySelectorAll(".select-option").forEach((item) => {
    const selected = item === option;
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-selected", String(selected));
  });
  if (shell.dataset.levelKind) {
    const item = wizardDraft[shell.dataset.levelKind][Number(shell.dataset.levelIndex)];
    if (shell.dataset.levelKind === "learns") item.targetLevel = Number(value);
    else item.level = Number(value);
  }
  if (shell.dataset.pref) wizardDraft[shell.dataset.pref] = shell.dataset.pref === "duration" ? Number(value) : value;
  if (shell.dataset.hallSkill !== undefined) {
    hallFilters.skill=value;
    closeSelectMenus();
    render();
    return;
  }
  closeSelectMenus();
  shell.querySelector(".select-trigger")?.focus();
}

document.addEventListener("click", (event) => {
  const target=event.target.closest("button,a"); if(!target){closeSelectMenus();return;}
  if(target.matches(".select-trigger")){toggleSelect(target.closest(".select-shell"));return;}
  if(target.matches(".select-option")){chooseSelectOption(target.closest(".select-shell"),target);return;}
  if(!target.closest(".select-shell"))closeSelectMenus();
  if(target.dataset.clearHall!==undefined){hallFilters={evening:false,online:false,local:false,skill:""};render();return;}
  if(target.dataset.hallFilter){const key=target.dataset.hallFilter;hallFilters[key]=!hallFilters[key];render();return;}
  if(target.dataset.discoverSkill){hallFilters.skill=target.dataset.discoverSkill;render();document.querySelector(".content-grid")?.scrollIntoView({behavior:"smooth"});return;}
  if(target.dataset.matchSort){matchSort=target.dataset.matchSort;render();return;}
  if(target.dataset.close!==undefined){closeModal();return;}
  if(target.dataset.create!==undefined||target.dataset.editProfile!==undefined){requireAccount(()=>{startOnboarding();});return;}
  if(target.dataset.radar!==undefined){location.hash="#/matches";return;}
  if(target.dataset.score){openScore(target.dataset.score);return;}
  if(target.dataset.apply){const id=target.dataset.apply;closeModal();requireAccount(()=>openApplication(id));return;}
  if(target.dataset.skillKind){const kind=target.dataset.skillKind;const skill=target.dataset.skill;const idx=wizardDraft[kind].findIndex(x=>x.skill===skill);if(idx>=0)wizardDraft[kind].splice(idx,1);else if(wizardDraft[kind].length<5)wizardDraft[kind].push(kind==="learns"?{skill,priority:2,targetLevel:2}:{skill,level:2});else showToast("每类最多选择 5 项技能");renderWizard();return;}
  if(target.dataset.removeSkill){wizardDraft[target.dataset.removeSkill].splice(Number(target.dataset.index),1);renderWizard();return;}
  if(target.dataset.removeProof!==undefined){wizardDraft.proofs.splice(Number(target.dataset.removeProof),1);renderWizard();return;}
  if(target.dataset.slot){const id=target.dataset.slot;const index=wizardDraft.availability.indexOf(id);index>=0?wizardDraft.availability.splice(index,1):wizardDraft.availability.push(id);renderWizard();return;}
  if(target.dataset.wizardBack!==undefined){wizardStep--;renderWizard();return;}
  if(target.dataset.wizardNext!==undefined){if(wizardStep===1&&!wizardDraft.learns.length){showToast("请至少选择一项想学技能");return;}if(wizardStep===2&&!wizardDraft.teaches.length){showToast("请至少选择一项能教技能");return;}if(wizardStep===3&&!wizardDraft.availability.length){showToast("请至少选择一个空闲时间");return;}if(wizardStep<3){wizardStep++;renderWizard();}else{state.profile={...wizardDraft,onboarded:true};persist();closeModal();showToast("技能画像已更新，配对雷达完成重算");location.hash="#/matches";if(pendingPartnerId){const id=pendingPartnerId;pendingPartnerId=null;setTimeout(()=>openApplication(id),250);}}return;}
  if(target.dataset.advance){const idx=state.exchanges.findIndex(x=>x.id===target.dataset.advance);state.exchanges[idx]=advanceExchange(state.exchanges[idx]);const item=state.exchanges[idx];if(item.status==="已配对")item.messages.push({id:`m-${Date.now()}`,sender:"partner",text:"很开心匹配成功！我们先确认一下共同目标和上课时间吧。"});if(item.status==="已排课"&&!state.sessions.some(x=>x.exchangeId===item.id))state.sessions.unshift({id:`session-${Date.now()}`,exchangeId:item.id,partnerId:item.partnerId,title:`${item.skillPair.learn} · 第 1 次`,slot:item.slot,time:"20:00",duration:45,status:"已排课"});persist();render();showToast(`已进入「${item.status}」`);return;}
  if(target.dataset.chat){state.selectedConversation=target.dataset.chat;persist();location.hash="#/mail";return;}
  if(target.dataset.conversation){state.selectedConversation=target.dataset.conversation;persist();render();return;}
  if(target.dataset.quick){const item=state.exchanges.find(x=>x.id===state.selectedConversation)||state.exchanges[0];const text={time:`我目前方便的时间：${state.profile.availability.map(slotLabel).join("、")}`,assignment:"作业卡：完成一个最小作品，下次课一起复盘。",classroom:"课堂邀请已发送：进入「共学空间」即可开始。"}[target.dataset.quick];item.messages.push({id:`m-${Date.now()}`,sender:"me",text});persist();render();return;}
  if(target.dataset.media){handleMedia(target.dataset.media,target);return;}
  if(target.dataset.homeworkAction){const index=state.assignments.findIndex(item=>item.id===target.dataset.homeworkId);if(index<0)return;state.assignments[index]=advanceHomework({...state.assignments[index],status:homeworkStatus(state.assignments[index])});persist();render();showToast(target.dataset.homeworkAction==="accept"?"已领取作业，记得在下次课前完成":"作业已完成，下次课和搭子一起复盘");return;}
  if(target.dataset.like){const post=state.posts.find(x=>x.id===target.dataset.like);post.liked=!post.liked;post.likes+=post.liked?1:-1;persist();render();return;}
  if(target.dataset.comment){showToast("评论入口已打开，体验版保留轻量互动");return;}
  if(target.dataset.note!==undefined){location.hash="#/classroom";return;}
  if(target.dataset.reset!==undefined){if(confirm("确定清空当前浏览器中的体验数据吗？")){state=resetState();clearProofBlobs().catch(()=>{});render();showToast("已恢复初始体验数据");}return;}
});

document.addEventListener("change", async (event) => {
  const target=event.target;
  if(target.matches("input[data-pref]")){wizardDraft[target.dataset.pref]=target.value;return;}
  if(target.id==="proofInput") { const files=[...target.files];for(const file of files){if(wizardDraft.proofs.length>=3){showToast("最多上传 3 项证明");break;}if(file.size>20*1024*1024){showToast(`${file.name} 超过 20MB`);continue;}const id=`proof-${Date.now()}-${Math.random().toString(16).slice(2)}`;await saveProofBlob(id,file);wizardDraft.proofs.push({id,name:file.name,type:file.type||"application/pdf",size:file.size});}renderWizard(); }
});

function commitSearch(value){searchTerm=value;render();const input=document.querySelector("[data-search]");if(input){input.focus();input.setSelectionRange(value.length,value.length);}}
function scheduleSearch(value,delay=180){pendingSearchTerm=value;clearTimeout(window.__skillSearchTimer);window.__skillSearchTimer=setTimeout(()=>commitSearch(pendingSearchTerm),delay);}
document.addEventListener("compositionstart",(event)=>{if(event.target.matches("[data-search]")){searchCompositionActive=true;clearTimeout(window.__skillSearchTimer);}});
document.addEventListener("compositionend",(event)=>{if(event.target.matches("[data-search]")){searchCompositionActive=false;if(shouldCommitSearch(event,searchCompositionActive))scheduleSearch(event.target.value,80);}});
document.addEventListener("input", (event) => { if(event.target.matches("[data-search]")){pendingSearchTerm=event.target.value;if(!shouldCommitSearch(event,searchCompositionActive))return;scheduleSearch(event.target.value);} });

document.addEventListener("submit", (event) => {
  if(event.target.matches("[data-register]")){event.preventDefault();const data=Object.fromEntries(new FormData(event.target));const result=validateRegistration(data);if(!result.valid){event.target.querySelector("[data-register-errors]").innerHTML=Object.values(result.errors).map(x=>`<div class="error">${x}</div>`).join("");return;}state.session={email:data.email,createdAt:new Date().toISOString()};state.profile.nickname=data.nickname;state.profile.email=data.email;persist();startOnboarding();return;}
  if(event.target.matches("[data-application]")){event.preventDefault();const data=Object.fromEntries(new FormData(event.target));const result=rankMatches(state.profile,[person(event.target.dataset.partner)])[0];const exchange=createExchange({partnerId:event.target.dataset.partner,skillPair:{learn:result.skillPair.learn,teach:result.skillPair.teach},slot:data.slot,lessonType:data.lessonType});exchange.messages.push({id:`m-${Date.now()}`,sender:"me",text:data.message});state.exchanges.unshift(exchange);state.selectedConversation=exchange.id;persist();closeModal();showToast("交换申请已发送，示例伙伴将自动回应");location.hash="#/journey";setTimeout(()=>{const item=state.exchanges.find(x=>x.id===exchange.id);if(item&&item.status==="待回应"){state.exchanges[state.exchanges.indexOf(item)]=advanceExchange(item);item.messages.push({id:`m-${Date.now()}`,sender:"partner",text:"收到！这个组合很适合我，先从一次试学开始吧。"});persist();render();showToast("对方已接受，交换配对成功");}},1200);return;}
  if(event.target.matches("[data-chat-form]")){event.preventDefault();const input=event.target.elements.message;const item=state.exchanges.find(x=>x.id===state.selectedConversation)||state.exchanges[0];item.messages.push({id:`m-${Date.now()}`,sender:"me",text:input.value.trim()});persist();render();setTimeout(()=>{item.messages.push({id:`m-${Date.now()}`,sender:"partner",text:"好呀，我们把目标拆成一个这周能完成的小任务吧。"});persist();render();},650);return;}
  if(event.target.matches("[data-note-form]")){event.preventDefault();const data=Object.fromEntries(new FormData(event.target));const note=createSharedNote({...data,sessionId:event.target.dataset.sessionId||null,partnerId:event.target.dataset.partnerId||null});state.notes.unshift(note);const exchange=state.exchanges.find(item=>item.partnerId===note.partnerId);if(exchange)exchange.messages.push({id:`m-${Date.now()}`,sender:"me",text:`课后笔记「${note.title}」已发给你：${note.takeaway}`});persist();render();showToast("笔记已发给搭子，并记录到成长档案");return;}
  if(event.target.matches("[data-post-form]")){event.preventDefault();const data=Object.fromEntries(new FormData(event.target));state.posts.unshift({id:`post-${Date.now()}`,author:state.profile.nickname||"我",avatar:(state.profile.nickname||"我")[0],color:"green",type:data.type,content:data.content,likes:0,liked:false,comments:0,time:"刚刚"});persist();render();showToast("学习动态已发布");return;}
});

modal.addEventListener("click", (event) => { if(event.target===modal)closeModal(); });
document.addEventListener("keydown", (event) => {
  const shell=event.target.closest?.(".select-shell");
  if(!shell)return;
  const options=[...shell.querySelectorAll(".select-option")];
  if(event.key==="Escape"){event.preventDefault();closeSelectMenus();shell.querySelector(".select-trigger")?.focus();return;}
  if(event.target.matches(".select-trigger")&&(event.key==="Enter"||event.key===" ")){event.preventDefault();toggleSelect(shell);return;}
  if(event.target.matches(".select-option")){
    const index=options.indexOf(event.target);
    if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();options[(index+(event.key==="ArrowDown"?1:-1)+options.length)%options.length]?.focus();}
    if(event.key==="Enter"||event.key===" "){event.preventDefault();chooseSelectOption(shell,event.target);}
  }
});
window.addEventListener("hashchange", ()=>{clearTimeout(window.__skillSearchTimer);searchTerm="";pendingSearchTerm="";searchCompositionActive=false;render();});
if(!location.hash)location.hash="#/square";else render();
