const fs = require('fs');
const vm = require('vm');

const LESSONS = {
  1: {
    id: 1,
    title: 'Chủ nghĩa Xã hội Khoa học - Bài 1: Nhập môn & Sứ mệnh GCCN',
    headerTitle: 'Bài 1: Nhập môn CNXH-KH & Sứ mệnh của GCCN',
    subTitle: 'Khoa học về quy luật chính trị - xã hội & sứ mệnh lịch sử của giai cấp công nhân',
    prev: null,
    next: { file: 'bai2.html', label: 'Bài 2: CNXH & Thời kỳ quá độ →' }
  },
  2: {
    id: 2,
    title: 'Chủ nghĩa Xã hội Khoa học - Bài 2: CNXH & Thời kỳ quá độ lên CNXH',
    headerTitle: 'Bài 2: CNXH & Thời kỳ quá độ lên CNXH',
    subTitle: 'Đặc trưng bản chất của CNXH & con đường quá độ bỏ qua TBCN ở Việt Nam',
    prev: { file: 'bai1.html', label: '← Bài 1: Nhập môn & Sứ mệnh GCCN' },
    next: { file: 'bai3.html', label: 'Bài 3: Dân chủ XHCN & Nhà nước →' }
  },
  3: {
    id: 3,
    title: 'Chủ nghĩa Xã hội Khoa học - Bài 3: Dân chủ XHCN & Nhà nước XHCN',
    headerTitle: 'Bài 3: Dân chủ XHCN & Nhà nước XHCN',
    subTitle: 'Bản chất nền dân chủ, Nhà nước XHCN & xây dựng Nhà nước pháp quyền XHCN',
    prev: { file: 'bai2.html', label: '← Bài 2: CNXH & Thời kỳ quá độ' },
    next: { file: 'bai4.html', label: 'Bài 4: Cơ cấu XH-Giai cấp & Liên minh →' }
  },
  4: {
    id: 4,
    title: 'Chủ nghĩa Xã hội Khoa học - Bài 4: Cơ cấu xã hội - giai cấp & Liên minh giai cấp',
    headerTitle: 'Bài 4: Cơ cấu xã hội - giai cấp & Liên minh',
    subTitle: 'Biến đổi cơ cấu xã hội - giai cấp & liên minh công - nông - trí thức tại Việt Nam',
    prev: { file: 'bai3.html', label: '← Bài 3: Dân chủ XHCN & Nhà nước' },
    next: { file: 'bai5.html', label: 'Bài 5: Dân tộc & Tôn giáo →' }
  },
  5: {
    id: 5,
    title: 'Chủ nghĩa Xã hội Khoa học - Bài 5: Vấn đề Dân tộc và Tôn giáo trong thời kỳ quá độ',
    headerTitle: 'Bài 5: Vấn đề Dân tộc và Tôn giáo',
    subTitle: 'Cương lĩnh dân tộc Lênin, bản chất tôn giáo & chính sách đại đoàn kết dân tộc',
    prev: { file: 'bai4.html', label: '← Bài 4: Cơ cấu XH-Giai cấp & Liên minh' },
    next: { file: 'bai6.html', label: 'Bài 6: Xây dựng gia đình →' }
  },
  6: {
    id: 6,
    title: 'Chủ nghĩa Xã hội Khoa học - Bài 6: Xây dựng gia đình trong thời kỳ quá độ lên CNXH',
    headerTitle: 'Bài 6: Xây dựng gia đình trong thời kỳ quá độ',
    subTitle: 'Vị trí, chức năng của gia đình & phương hướng xây dựng gia đình Việt Nam hiện nay',
    prev: { file: 'bai5.html', label: '← Bài 5: Dân tộc & Tôn giáo' },
    next: null
  }
};

function getClientScript(lessonId, bankJson) {
  return [
    'window.LESSON_ID = ' + lessonId + ';',
    '',
    'const clone = (x) => JSON.parse(JSON.stringify(x));',
    'const shuffle = (arr) => {',
    '  const a = [...arr];',
    '  for (let i = a.length - 1; i > 0; i--) {',
    '    const j = Math.floor(Math.random() * (i + 1));',
    '    [a[i], a[j]] = [a[j], a[i]];',
    '  }',
    '  return a;',
    '};',
    'const el = (tag, attrs = {}, html = "") => {',
    '  const e = document.createElement(tag);',
    '  Object.entries(attrs).forEach(([k, v]) => {',
    '    if (k === "class") e.className = v;',
    '    else if (k === "dataset") Object.assign(e.dataset, v);',
    '    else e.setAttribute(k, v);',
    '  });',
    '  if (html) e.innerHTML = html;',
    '  return e;',
    '};',
    'const safeId = (str) =>',
    '  "id_" +',
    '  str',
    '    .normalize("NFD")',
    '    .replace(/[\\u0300-\\u036f]/g, "")',
    '    .replace(/[^a-zA-Z0-9]/g, "_");',
    '',
    'const BANK = ' + bankJson + ';',
    '',
    'let WORK = [];',
    'let keyVisible = false;',
    'let selectedPill = null;',
    '',
    'function triggerHaptic(duration = 10) {',
    '  if (typeof navigator !== "undefined" && navigator.vibrate) {',
    '    try { navigator.vibrate(duration); } catch (e) {}',
    '  }',
    '}',
    '',
    'function reset(shuffleAll = true) {',
    '  WORK = clone(BANK);',
    '  if (shuffleAll) WORK = shuffle(WORK);',
    '  WORK.forEach((q) => {',
    '    if (q.options) q.options = shuffle(q.options);',
    '    if (q.type === "drag_pairs") {',
    '      const entries = Object.entries(q.pairs);',
    '      q.__prompts = shuffle(entries.map(([k]) => k));',
    '      q.__options = shuffle(entries.map(([_, v]) => v));',
    '      q.__extras = q.extras ? shuffle(q.extras) : [];',
    '    }',
    '    if (q.type === "drag_groups") {',
    '      q.__items = shuffle(q.items);',
    '      q.__groupNames = Object.keys(q.groups);',
    '    }',
    '  });',
    '  keyVisible = false;',
    '  selectedPill = null;',
    '  const btnToggle = document.getElementById("btnToggleKey");',
    '  if (btnToggle) btnToggle.classList.remove("active");',
    '  const meta = document.getElementById("meta");',
    '  if (meta) delete meta.dataset.showScore;',
    '  render();',
    '  window.scrollTo({ top: 0, behavior: "smooth" });',
    '}',
    '',
    'function render() {',
    '  const list = document.getElementById("list");',
    '  list.innerHTML = "";',
    '  document.getElementById("meta").textContent = "0/" + WORK.length + " câu";',
    '',
    '  WORK.forEach((q, qi) => {',
    '    const card = el("div", { class: "card", id: "q_" + qi });',
    '    const head = el("div", { class: "qhead" });',
    '    head.append(el("div", { class: "qidx" }, String(qi + 1)));',
    '    const title = el("div", { class: "qtitle" }, q.title);',
    '    if (q.type === "single")',
    '      title.append(el("div", { class: "hint" }, "(Chọn 1 đáp án đúng)"));',
    '    if (q.type === "multi")',
    '      title.append(el("div", { class: "hint" }, "(Chọn nhiều đáp án đúng)"));',
    '    if (q.type === "tfset")',
    '      title.append(el("div", { class: "hint" }, "(Đúng / Sai theo từng phát biểu)"));',
    '    if (q.type && q.type.includes("drag"))',
    '      title.append(el("div", { class: "hint" }, "(Kéo thả hoặc chạm vào thẻ từ rồi chạm vào ô tương ứng)"));',
    '    head.append(title);',
    '    card.append(head);',
    '',
    '    const body = el("div", { class: "answers" });',
    '',
    '    if (q.type === "single" || q.type === "multi") {',
    '      q.options.forEach((opt) => {',
    '        const id = "q" + qi + "_" + safeId(opt);',
    '        const lab = el("label");',
    '        const ipt = el("input", {',
    '          type: q.type === "single" ? "radio" : "checkbox",',
    '          name: "q" + qi,',
    '          value: opt,',
    '          id,',
    '        });',
    '        lab.append(ipt, el("span", {}, opt));',
    '        body.append(lab);',
    '      });',
    '    }',
    '',
    '    if (q.type === "tfset") {',
    '      q.statements.forEach((st, si) => {',
    '        const row = el("div", { class: "tf-item" });',
    '        row.append(el("div", { class: "tf-text" }, st.text));',
    '        const ch = el("div", { class: "tf-row" });',
    '        ["Đúng", "Sai"].forEach((v) => {',
    '          const lab = el("label");',
    '          const ipt = el("input", {',
    '            type: "radio",',
    '            name: "q" + qi + "_s" + si,',
    '            value: v,',
    '          });',
    '          lab.append(ipt, el("span", {}, v));',
    '          ch.append(lab);',
    '        });',
    '        row.append(ch);',
    '        body.append(row);',
    '      });',
    '    }',
    '',
    '    if (q.type === "drag_pairs") {',
    '      const wrap = el("div", { class: "dragwrap" });',
    '      const zones = el("div", { class: "dragzone" });',
    '      q.__prompts.forEach((promptText) => {',
    '        const z = el("div", { class: "zone", dataset: { prompt: promptText } });',
    '        z.append(el("h4", {}, promptText), el("div", { class: "droparea" }));',
    '        zones.append(z);',
    '      });',
    '      wrap.append(zones);',
    '      const pool = el("div", { class: "pool" });',
    '      [...q.__options, ...(q.__extras || [])].forEach((optText) => {',
    '        pool.append(',
    '          el(',
    '            "div",',
    '            { class: "pill", draggable: true, dataset: { txt: optText } },',
    '            optText,',
    '          ),',
    '        );',
    '      });',
    '      wrap.append(pool);',
    '      body.append(wrap);',
    '    }',
    '',
    '    if (q.type === "drag_groups") {',
    '      const wrap = el("div", { class: "dragwrap" });',
    '      const zones = el("div", { class: "dragzone" });',
    '      q.__groupNames.forEach((g) => {',
    '        const z = el("div", { class: "zone", dataset: { gname: g } });',
    '        z.append(el("h4", {}, g), el("div", { class: "droparea" }));',
    '        zones.append(z);',
    '      });',
    '      wrap.append(zones);',
    '      const pool = el("div", { class: "pool" });',
    '      q.__items.forEach((item) => {',
    '        pool.append(',
    '          el(',
    '            "div",',
    '            { class: "pill", draggable: true, dataset: { txt: item } },',
    '            item,',
    '          ),',
    '        );',
    '      });',
    '      wrap.append(pool);',
    '      body.append(wrap);',
    '    }',
    '',
    '    const res = el("div", { class: "result", id: "res_" + qi });',
    '    const hint = el("div", { class: "result-hint", id: "hint_" + qi });',
    '    card.append(body, res, hint);',
    '    list.append(card);',
    '  });',
    '',
    '  enableDragDrop();',
    '  updateProgress();',
    '}',
    '',
    'function bindPill(p) {',
    '  p.addEventListener("dragstart", (e) => {',
    '    const card = p.closest(".card");',
    '    const cardId = card ? card.id : "";',
    '    e.dataTransfer.setData(',
    '      "text/plain",',
    '      JSON.stringify({ cardId, txt: p.dataset.txt })',
    '    );',
    '  });',
    '',
    '  p.addEventListener("click", (e) => {',
    '    e.stopPropagation();',
    '    triggerHaptic(10);',
    '    const card = p.closest(".card");',
    '    if (!card) return;',
    '',
    '    if (selectedPill === p) {',
    '      p.classList.remove("selected");',
    '      selectedPill = null;',
    '    } else {',
    '      if (selectedPill) selectedPill.classList.remove("selected");',
    '      selectedPill = p;',
    '      p.classList.add("selected");',
    '    }',
    '  });',
    '}',
    '',
    'function placePillInArea(pill, area, card) {',
    '  if (!pill || !area || !card) return;',
    '',
    '  if (area.classList.contains("droparea")) {',
    '    const isPairZone = area.closest(".zone")?.dataset?.prompt !== undefined;',
    '    if (isPairZone) {',
    '      const existing = area.querySelector(".pill");',
    '      if (existing && existing !== pill) {',
    '        const pool = card.querySelector(".pool");',
    '        if (pool) pool.append(existing);',
    '      }',
    '    }',
    '  }',
    '',
    '  pill.classList.remove("selected");',
    '  pill.classList.add("placed");',
    '  setTimeout(() => pill.classList.remove("placed"), 300);',
    '  area.append(pill);',
    '  selectedPill = null;',
    '  updateProgress();',
    '  triggerHaptic(14);',
    '}',
    '',
    'function enableDragDrop() {',
    '  selectedPill = null;',
    '  document.querySelectorAll(".pill").forEach(bindPill);',
    '',
    '  document.querySelectorAll(".droparea, .pool").forEach((area) => {',
    '    const card = area.closest(".card");',
    '',
    '    area.addEventListener("dragover", (e) => {',
    '      e.preventDefault();',
    '      area.closest(".zone")?.classList.add("dragover");',
    '    });',
    '',
    '    area.addEventListener("dragleave", (e) => {',
    '      area.closest(".zone")?.classList.remove("dragover");',
    '    });',
    '',
    '    area.addEventListener("drop", (e) => {',
    '      e.preventDefault();',
    '      area.closest(".zone")?.classList.remove("dragover");',
    '      let data;',
    '      try {',
    '        data = JSON.parse(e.dataTransfer.getData("text/plain"));',
    '      } catch (err) {',
    '        return;',
    '      }',
    '      if (!data || !data.cardId || data.cardId !== card?.id) return;',
    '',
    '      const pills = Array.from(card.querySelectorAll(".pill"));',
    '      const targetPill = pills.find(',
    '        (p) => p.dataset.txt === data.txt && (selectedPill === p || !area.contains(p))',
    '      );',
    '      if (targetPill) {',
    '        placePillInArea(targetPill, area, card);',
    '      }',
    '    });',
    '',
    '    area.addEventListener("click", (e) => {',
    '      if (!selectedPill) return;',
    '      if (card && card.contains(selectedPill)) {',
    '        placePillInArea(selectedPill, area, card);',
    '      }',
    '    });',
    '  });',
    '',
    '  document.addEventListener("click", (e) => {',
    '    if (selectedPill && !e.target.closest(".pill")) {',
    '      selectedPill.classList.remove("selected");',
    '      selectedPill = null;',
    '    }',
    '  });',
    '}',
    '',
    'function getUserAnswer(q, qi) {',
    '  if (q.type === "single" || q.type === "multi") {',
    '    return Array.from(',
    '      document.querySelectorAll("#q_" + qi + " input:checked"),',
    '    ).map((x) => x.value);',
    '  }',
    '  if (q.type === "tfset") {',
    '    return q.statements.map((st, si) => {',
    '      const inp = document.querySelector(',
    '        \'input[name="q\' + qi + \'_s\' + si + \'"]:checked\',',
    '      );',
    '      return inp ? inp.value === "Đúng" : null;',
    '    });',
    '  }',
    '  if (q.type === "drag_pairs") {',
    '    const ans = {};',
    '    document.querySelectorAll("#q_" + qi + " .zone").forEach((z) => {',
    '      const prompt = z.dataset.prompt;',
    '      const pill = z.querySelector(".pill");',
    '      if (pill) ans[prompt] = pill.dataset.txt;',
    '    });',
    '    return ans;',
    '  }',
    '  if (q.type === "drag_groups") {',
    '    const ans = {};',
    '    document.querySelectorAll("#q_" + qi + " .zone").forEach((z) => {',
    '      const gname = z.dataset.gname;',
    '      ans[gname] = Array.from(z.querySelectorAll(".pill")).map(',
    '        (p) => p.dataset.txt,',
    '      );',
    '    });',
    '    return ans;',
    '  }',
    '  return null;',
    '}',
    '',
    'function isCorrect(q, ans) {',
    '  if (!ans) return false;',
    '  if (q.type === "single" || q.type === "multi") {',
    '    return (',
    '      ans.length === q.answer.length &&',
    '      ans.every((a) => q.answer.includes(a))',
    '    );',
    '  }',
    '  if (q.type === "tfset") {',
    '    return ans.every((a, i) => a === q.statements[i].answer);',
    '  }',
    '  if (q.type === "drag_pairs") {',
    '    return Object.entries(q.pairs).every(',
    '      ([prompt, expected]) => ans[prompt] === expected',
    '    );',
    '  }',
    '  if (q.type === "drag_groups") {',
    '    return Object.entries(q.groups).every(',
    '      ([g, arr]) =>',
    '        ans[g] &&',
    '        arr.every((item) => ans[g].includes(item)) &&',
    '        ans[g].length === arr.length',
    '    );',
    '  }',
    '  return false;',
    '}',
    '',
    'function updateProgress() {',
    '  if (!WORK.length) return;',
    '  let answered = 0;',
    '  WORK.forEach((q, qi) => {',
    '    const user = getUserAnswer(q, qi);',
    '    let has = false;',
    '    if (q.type === "single" || q.type === "multi") {',
    '      has = user && user.length > 0;',
    '    } else if (q.type === "tfset") {',
    '      has = user && user.some((x) => x !== null);',
    '    } else if (q.type === "drag_pairs" || q.type === "drag_groups") {',
    '      has = user && Object.keys(user).length > 0;',
    '    }',
    '    if (has) answered++;',
    '  });',
    '  const pct = Math.round((answered / WORK.length) * 100);',
    '  const fill = document.getElementById("progressFill");',
    '  if (fill) fill.style.width = pct + "%";',
    '  const meta = document.getElementById("meta");',
    '  if (meta && !meta.dataset.showScore) {',
    '    meta.textContent = answered + "/" + WORK.length + " câu";',
    '  }',
    '}',
    '',
    'function showKey(q, qi) {',
    '  const hint = document.getElementById("hint_" + qi);',
    '  if (!hint) return;',
    '  hint.innerHTML = "";',
    '  if (q.type === "single" || q.type === "multi") {',
    '    hint.innerHTML = \'<div class="hint-box"><strong>Đáp án:</strong> <b>\' + q.answer.join(", ") + \'</b></div>\';',
    '  } else if (q.type === "tfset") {',
    '    hint.innerHTML = \'<div class="hint-box"><strong>Đáp án:</strong> <b>\' + q.statements',
    '      .map((s, idx) => "Phát biểu " + (idx + 1) + ": " + (s.answer ? "Đúng" : "Sai"))',
    '      .join(" · ") + "</b></div>";',
    '  } else if (q.type === "drag_pairs") {',
    '    hint.innerHTML = \'<div class="hint-box"><strong>Đáp án đúng:</strong><br>\' + Object.entries(q.pairs)',
    '      .map(([prompt, ans]) => "• <em>" + prompt + "</em> → <strong>" + ans + "</strong>")',
    '      .join("<br>") + "</div>";',
    '  } else if (q.type === "drag_groups") {',
    '    hint.innerHTML = \'<div class="hint-box"><strong>Đáp án đúng:</strong><br>\' + Object.entries(q.groups)',
    '      .map(([group, items]) => "• <strong>" + group + ":</strong> " + items.join("; "))',
    '      .join("<br>") + "</div>";',
    '  }',
    '}',
    '',
    'function checkAll() {',
    '  let correct = 0;',
    '  WORK.forEach((q, qi) => {',
    '    const card = document.getElementById("q_" + qi);',
    '    const res = document.getElementById("res_" + qi);',
    '    const user = getUserAnswer(q, qi);',
    '    if (card) card.classList.remove("card-correct", "card-wrong");',
    '    if (isCorrect(q, user)) {',
    '      correct++;',
    '      if (res) {',
    '        res.textContent = "✔ Đúng";',
    '        res.className = "result r-good";',
    '      }',
    '      if (card) card.classList.add("card-correct");',
    '    } else {',
    '      if (res) {',
    '        res.textContent = "✘ Sai";',
    '        res.className = "result r-bad";',
    '      }',
    '      if (card) card.classList.add("card-wrong");',
    '    }',
    '  });',
    '',
    '  const total = WORK.length;',
    '  const pct = Math.round((correct / total) * 100);',
    '  const meta = document.getElementById("meta");',
    '  if (meta) {',
    '    meta.textContent = correct + "/" + total + " đúng (" + pct + "%)";',
    '    meta.dataset.showScore = "1";',
    '  }',
    '',
    '  try {',
    '    const lessonId = window.LESSON_ID || 1;',
    '    localStorage.setItem(',
    '      "cnxh_score_bai_" + lessonId,',
    '      JSON.stringify({ score: correct, total, pct, time: Date.now() })',
    '    );',
    '  } catch (e) {}',
    '',
    '  triggerHaptic(25);',
    '  showScoreModal(correct, total, pct);',
    '}',
    '',
    'function showScoreModal(correct, total, pct) {',
    '  let modalBackdrop = document.getElementById("scoreModal");',
    '  if (!modalBackdrop) {',
    '    modalBackdrop = el("div", { class: "score-modal-backdrop", id: "scoreModal" });',
    '    document.body.append(modalBackdrop);',
    '  }',
    '',
    '  let gradeMsg = "Cần cố gắng thêm! Hãy xem lại các đáp án sai và luyện tập lại nhé.";',
    '  let gradeBadge = "🌱";',
    '  if (pct >= 90) {',
    '    gradeMsg = "Xuất sắc! Bạn đã nắm rất vững kiến thức và sẵn sàng thi đạt điểm cao.";',
    '    gradeBadge = "🏆";',
    '  } else if (pct >= 75) {',
    '    gradeMsg = "Rất tốt! Bạn đã nắm chắc hầu hết các nội dung trọng tâm.";',
    '    gradeBadge = "⭐";',
    '  } else if (pct >= 50) {',
    '    gradeMsg = "Đạt yêu cầu! Hãy ôn luyện lại một số phần để tự tin hơn khi làm bài.";',
    '    gradeBadge = "📈";',
    '  }',
    '',
    '  modalBackdrop.innerHTML =',
    '    \'<div class="score-modal">\' +',
    '    \'<div class="score-badge">\' + gradeBadge + \'</div>\' +',
    '    \'<h2 class="score-title">Kết Quả Bài Làm</h2>\' +',
    '    \'<div class="score-number">\' + correct + \' / \' + total + \'</div>\' +',
    '    \'<div class="score-pct">\' + pct + \'% chính xác</div>\' +',
    '    \'<p class="score-msg">\' + gradeMsg + \'</p>\' +',
    '    \'<div class="score-actions">\' +',
    '    \'<button id="modalBtnKey" class="btn-primary">👁 Xem đáp án chi tiết</button>\' +',
    '    \'<button id="modalBtnRetry" class="btn-secondary">↻ Làm lại bài</button>\' +',
    '    \'<button id="modalBtnClose" class="btn-ghost">Đóng cửa sổ</button>\' +',
    '    \'</div>\' +',
    '    \'</div>\';',
    '',
    '  modalBackdrop.classList.add("visible");',
    '',
    '  document.getElementById("modalBtnKey").addEventListener("click", () => {',
    '    modalBackdrop.classList.remove("visible");',
    '    if (!keyVisible) {',
    '      document.getElementById("btnToggleKey").click();',
    '    }',
    '  });',
    '',
    '  document.getElementById("modalBtnRetry").addEventListener("click", () => {',
    '    modalBackdrop.classList.remove("visible");',
    '    reset(true);',
    '  });',
    '',
    '  document.getElementById("modalBtnClose").addEventListener("click", () => {',
    '    modalBackdrop.classList.remove("visible");',
    '  });',
    '',
    '  modalBackdrop.addEventListener("click", (e) => {',
    '    if (e.target === modalBackdrop) modalBackdrop.classList.remove("visible");',
    '  });',
    '}',
    '',
    'document.getElementById("btnCheck").addEventListener("click", () => {',
    '  triggerHaptic(12);',
    '  checkAll();',
    '});',
    '',
    'document.getElementById("btnReset").addEventListener("click", () => {',
    '  triggerHaptic(12);',
    '  reset(true);',
    '});',
    '',
    'document.getElementById("btnToggleKey").addEventListener("click", () => {',
    '  triggerHaptic(12);',
    '  keyVisible = !keyVisible;',
    '  const btn = document.getElementById("btnToggleKey");',
    '  if (btn) btn.classList.toggle("active", keyVisible);',
    '  WORK.forEach((q, qi) => {',
    '    const hint = document.getElementById("hint_" + qi);',
    '    if (hint) {',
    '      if (keyVisible) showKey(q, qi);',
    '      else hint.innerHTML = "";',
    '    }',
    '  });',
    '});',
    '',
    'document.getElementById("list").addEventListener("change", (e) => {',
    '  if (e.target.matches("input[type=radio], input[type=checkbox]")) {',
    '    const label = e.target.closest("label");',
    '    if (label) {',
    '      if (e.target.type === "radio") {',
    '        const name = e.target.name;',
    '        document.querySelectorAll(\'input[name="\' + name + \'"]\').forEach((r) => {',
    '          r.closest("label")?.classList.remove("checked");',
    '        });',
    '        label.classList.add("checked");',
    '      } else {',
    '        label.classList.toggle("checked", e.target.checked);',
    '      }',
    '    }',
    '    updateProgress();',
    '    triggerHaptic(8);',
    '  }',
    '});',
    '',
    'const headerEl = document.getElementById("header");',
    'const btnScrollTop = document.getElementById("btnScrollTop");',
    '',
    'window.addEventListener(',
    '  "scroll",',
    '  () => {',
    '    const y = window.scrollY || document.documentElement.scrollTop;',
    '    if (headerEl) {',
    '      if (y > 10) headerEl.classList.add("scrolled");',
    '      else headerEl.classList.remove("scrolled");',
    '    }',
    '    if (btnScrollTop) {',
    '      if (y > 320) btnScrollTop.classList.add("visible");',
    '      else btnScrollTop.classList.remove("visible");',
    '    }',
    '  },',
    '  { passive: true }',
    ');',
    '',
    'if (btnScrollTop) {',
    '  btnScrollTop.addEventListener("click", () => {',
    '    triggerHaptic(15);',
    '    window.scrollTo({ top: 0, behavior: "smooth" });',
    '  });',
    '}',
    '',
    '// Initial render in natural sequence',
    'reset(false);'
  ].join('\n');
}

function generateHtml(lessonId, bank) {
  const meta = LESSONS[lessonId];
  const bankJson = JSON.stringify(bank, null, 2);

  let navHtml = '<nav class="lesson-nav">\n';
  if (meta.prev) {
    navHtml += '        <a href="' + meta.prev.file + '" class="nav-btn">' + meta.prev.label + '</a>\n';
  } else {
    navHtml += '        <a href="index.html" class="nav-btn">🏠 Về danh sách bài</a>\n';
  }
  navHtml += '        <a href="index.html" class="nav-home-btn">📚 Mục lục 6 bài</a>\n';
  if (meta.next) {
    navHtml += '        <a href="' + meta.next.file + '" class="nav-btn nav-primary">' + meta.next.label + '</a>\n';
  } else {
    navHtml += '        <a href="index.html" class="nav-btn nav-primary">🎉 Hoàn thành ôn tập →</a>\n';
  }
  navHtml += '      </nav>';

  const script = getClientScript(lessonId, bankJson);

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${meta.title}</title>
    <style>
      :root {
        --bg1: #f0f4f8;
        --bg2: #d9e2ec;
        --card: #ffffff;
        --ink: #1f2937;
        --muted: #64748b;
        --accent: #2563eb;
        --accent-hover: #1d4ed8;
        --good: #16a34a;
        --bad: #dc2626;
        --border: #e2e8f0;
      }
      * {
        box-sizing: border-box;
      }
      html {
        scroll-behavior: smooth;
        -webkit-text-size-adjust: 100%;
      }
      body {
        margin: 0;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--ink);
        background: linear-gradient(135deg, var(--bg1), var(--bg2));
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        transition: background 0.3s ease;
        -webkit-font-smoothing: antialiased;
      }
      header {
        position: sticky;
        top: 0;
        z-index: 20;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(0, 0, 0, 0.07);
        transition: box-shadow 0.25s ease;
      }
      header.scrolled {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      }
      .progress-line {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 3.5px;
        background: rgba(0, 0, 0, 0.04);
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #3b82f6, #10b981);
        transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .wrap {
        max-width: 900px;
        margin: 0 auto;
        padding: 16px 20px;
        width: 100%;
      }
      .brand-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .brand-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .header-titles {
        display: flex;
        flex-direction: column;
      }
      .header-titles h1 {
        margin: 0;
        font-size: clamp(16px, 2.4vw, 22px);
        font-weight: 800;
        color: var(--ink);
        letter-spacing: -0.01em;
        line-height: 1.25;
      }
      .header-titles .sub {
        font-size: 12px;
        color: var(--muted);
        font-weight: 500;
        margin-top: 2px;
      }
      .btn-home {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        text-decoration: none;
        color: #475569;
        font-weight: 600;
        font-size: 13px;
        background: #ffffff;
        padding: 6px 12px;
        border-radius: 10px;
        border: 1px solid #cbd5e1;
        transition: all 0.15s ease;
        white-space: nowrap;
        -webkit-tap-highlight-color: transparent;
      }
      .btn-home:hover {
        background: #f1f5f9;
        color: var(--accent);
        border-color: #94a3b8;
      }
      .btn-home:active {
        transform: scale(0.96);
      }
      .toolbar {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      button {
        border: none;
        padding: 9px 16px;
        border-radius: 11px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13.5px;
        background: var(--accent);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s, opacity 0.15s, background 0.15s;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
      }
      button:hover {
        background: var(--accent-hover);
      }
      button:active {
        transform: scale(0.96);
      }
      button.secondary {
        background: #334155;
      }
      button.secondary:hover {
        background: #1e293b;
      }
      button.ghost {
        background: #ffffff;
        color: #334155;
        border: 1px solid #cbd5e1;
      }
      button.ghost:hover {
        background: #f8fafc;
        border-color: #94a3b8;
      }
      button.ghost.active {
        background: #eff6ff;
        color: #2563eb;
        border-color: #93c5fd;
      }
      .meta {
        font-weight: 600;
        color: #475569;
        font-size: 13px;
        background: #ffffff;
        padding: 5px 14px;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        white-space: nowrap;
        flex-shrink: 0;
      }
      .cards {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 20px 0 30px;
      }
      .card {
        background: var(--card);
        border-radius: 18px;
        padding: 22px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
        border: 1px solid rgba(226, 232, 240, 0.9);
        transition: border-color 0.25s, box-shadow 0.25s;
      }
      .card.card-correct {
        border-color: #86efac;
        box-shadow: 0 4px 20px rgba(22, 163, 74, 0.1);
      }
      .card.card-wrong {
        border-color: #fca5a5;
        box-shadow: 0 4px 20px rgba(220, 38, 38, 0.1);
      }
      .qhead {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      .qidx {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 14px;
        color: #fff;
        background: #334155;
        flex-shrink: 0;
      }
      .qtitle {
        font-weight: 700;
        font-size: 16px;
        line-height: 1.5;
      }
      .hint {
        font-size: 13px;
        color: var(--muted);
        margin-top: 4px;
        font-weight: normal;
      }
      .answers {
        margin-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .answers label {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 11px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        cursor: pointer;
        background: #ffffff;
        transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
      }
      .answers label:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
      .answers label:active {
        transform: scale(0.99);
      }
      .answers label:has(input:checked),
      .answers label.checked {
        background: #f0f7ff;
        border-color: #3b82f6;
        color: #1e40af;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
        font-weight: 500;
      }
      .answers input {
        width: 18px;
        height: 18px;
        accent-color: #2563eb;
        flex-shrink: 0;
        cursor: pointer;
      }
      .tf-item {
        padding: 12px 14px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #fff;
        margin-bottom: 8px;
      }
      .tf-text {
        font-size: 14.5px;
        line-height: 1.5;
        color: var(--ink);
        font-weight: 500;
        margin-bottom: 6px;
      }
      .tf-row {
        margin-top: 8px;
        display: flex;
        gap: 10px;
      }
      .tf-row label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        padding: 7px 14px;
        border-radius: 9px;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
      }
      .tf-row label:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }
      .tf-row label:active {
        transform: scale(0.98);
      }
      .tf-row label:has(input:checked),
      .tf-row label.checked {
        background: #f0f7ff;
        border-color: #3b82f6;
        color: #1e40af;
        font-weight: 600;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
      }
      .tf-row input {
        accent-color: #2563eb;
      }

      /* Drag and Drop Elements */
      .dragwrap {
        display: grid;
        gap: 14px;
      }
      .dragzone {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 12px;
      }
      .zone {
        min-height: 70px;
        border: 2px dashed #94a3b8;
        border-radius: 14px;
        padding: 12px 14px;
        background: #f8fafc;
        transition: border-color 0.2s, background 0.2s;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .zone h4 {
        margin: 0 0 10px;
        font-size: 14px;
        line-height: 1.5;
        color: var(--ink);
        font-weight: 600;
      }
      .zone.dragover {
        border-color: var(--accent);
        background: #eff6ff;
      }
      .droparea {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 42px;
        border-radius: 8px;
        padding: 4px;
        background: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(226, 232, 240, 0.7);
        align-items: center;
      }
      .pool {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 48px;
        background: #ffffff;
        border: 1.5px solid #cbd5e1;
        border-radius: 14px;
        padding: 12px;
        align-items: center;
      }
      .pill {
        background: #eef2ff;
        border: 1px solid #93c5fd;
        color: #1e3a8a;
        border-radius: 999px;
        padding: 7px 14px;
        display: inline-flex;
        gap: 6px;
        align-items: center;
        font-weight: 600;
        font-size: 13.5px;
        user-select: none;
        -webkit-user-select: none;
        cursor: grab;
        margin: 3px;
        transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s, background 0.18s;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .pill:active {
        cursor: grabbing;
        transform: scale(0.96);
      }
      .pill.selected {
        outline: 2.5px solid var(--accent);
        outline-offset: 1px;
        background: #dbeafe !important;
        color: #1d4ed8 !important;
        transform: scale(1.03);
        box-shadow: 0 2px 10px rgba(37, 99, 235, 0.25);
      }
      .pill.placed {
        animation: popPlaced 0.25s ease;
      }
      @keyframes popPlaced {
        0% { transform: scale(0.9); }
        50% { transform: scale(1.06); }
        100% { transform: scale(1); }
      }

      /* Result Badges and Hint Containers */
      .result {
        margin-top: 14px;
        font-weight: 700;
        font-size: 14.5px;
        animation: fadeIn 0.3s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .r-good {
        color: var(--good);
      }
      .r-bad {
        color: var(--bad);
      }
      .result-hint {
        margin-top: 8px;
      }
      .hint-box {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #3b82f6;
        border-radius: 10px;
        padding: 12px 14px;
        font-size: 13.5px;
        color: #1e293b;
        line-height: 1.6;
        animation: fadeIn 0.25s ease;
      }
      .hint-box strong {
        color: #0f172a;
      }
      .hint-box em {
        font-style: normal;
        color: #334155;
      }

      /* Lesson Navigation Footer */
      .lesson-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 24px;
        margin-bottom: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--border);
        flex-wrap: wrap;
      }
      .lesson-nav a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        background: #ffffff;
        border: 1px solid var(--border);
        border-radius: 12px;
        color: var(--ink);
        text-decoration: none;
        font-weight: 600;
        font-size: 13.5px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
        transition: all 0.2s ease;
      }
      .lesson-nav a:hover {
        background: #f8fafc;
        border-color: #94a3b8;
        color: var(--accent);
      }
      .lesson-nav a.nav-primary {
        background: var(--accent);
        color: #ffffff;
        border-color: var(--accent);
      }
      .lesson-nav a.nav-primary:hover {
        background: var(--accent-hover);
      }

      /* Score Modal Dialog */
      .score-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 16px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, visibility 0.2s ease;
      }
      .score-modal-backdrop.visible {
        opacity: 1;
        visibility: visible;
      }
      .score-modal {
        background: #ffffff;
        border-radius: 20px;
        max-width: 440px;
        width: 100%;
        padding: 26px 22px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
        text-align: center;
        transform: translateY(12px) scale(0.97);
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid #e2e8f0;
      }
      .score-modal-backdrop.visible .score-modal {
        transform: translateY(0) scale(1);
      }
      .score-badge {
        font-size: 42px;
        line-height: 1;
        margin-bottom: 10px;
      }
      .score-title {
        margin: 0 0 6px;
        font-size: 20px;
        font-weight: 800;
        color: var(--ink);
      }
      .score-number {
        font-size: 36px;
        font-weight: 800;
        color: var(--accent);
        line-height: 1.2;
        margin-top: 6px;
      }
      .score-pct {
        font-size: 14px;
        font-weight: 600;
        color: var(--muted);
        margin-bottom: 12px;
      }
      .score-msg {
        margin: 0 0 20px;
        font-size: 14px;
        color: #475569;
        line-height: 1.5;
        padding: 0 8px;
      }
      .score-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .score-actions button {
        width: 100%;
        padding: 11px 16px;
        font-size: 14px;
        border-radius: 12px;
      }
      .score-actions .btn-primary {
        background: var(--accent);
        color: #ffffff;
      }
      .score-actions .btn-secondary {
        background: #f1f5f9;
        color: #334155;
        border: 1px solid #cbd5e1;
      }
      .score-actions .btn-ghost {
        background: transparent;
        color: var(--muted);
        border: none;
        padding: 8px;
        font-size: 13px;
      }

      /* Floating Back-To-Top Button */
      .btn-scroll-top {
        position: fixed;
        bottom: 24px;
        right: 20px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #1e293b;
        color: #ffffff;
        font-size: 20px;
        font-weight: 700;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
        border: none;
        cursor: pointer;
        display: grid;
        place-items: center;
        opacity: 0;
        visibility: hidden;
        transform: translateY(12px);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 99;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .btn-scroll-top.visible {
        opacity: 0.92;
        visibility: visible;
        transform: translateY(0);
      }
      .btn-scroll-top:hover {
        opacity: 1;
        background: #0f172a;
        transform: translateY(-2px);
      }
      .btn-scroll-top:active {
        transform: scale(0.92);
      }

      /* Responsive rules */
      @media (max-width: 768px) {
        .wrap {
          padding: 10px 14px;
        }
        .brand-row {
          margin-bottom: 8px;
        }
        .header-titles h1 {
          font-size: 16px;
          line-height: 1.35;
        }
        .meta {
          font-size: 12px;
          padding: 4px 10px;
        }
        .toolbar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        button {
          padding: 8px 6px;
          font-size: 12.5px;
          border-radius: 10px;
          min-height: 38px;
          white-space: nowrap;
        }
        button span {
          display: none;
        }
        .cards {
          padding: 12px 0 30px;
          gap: 12px;
        }
        .card {
          padding: 16px 14px;
          border-radius: 14px;
        }
        .qhead {
          gap: 10px;
        }
        .qidx {
          width: 28px;
          height: 28px;
          font-size: 13px;
          border-radius: 8px;
        }
        .qtitle {
          font-size: 15px;
          line-height: 1.45;
        }
        .dragzone {
          grid-template-columns: 1fr;
        }
        .lesson-nav {
          flex-direction: column;
        }
        .lesson-nav a {
          width: 100%;
          justify-content: center;
        }
      }
    </style>
  </head>
  <body>
    <header id="header">
      <div class="progress-line"><div id="progressFill" class="progress-fill"></div></div>
      <div class="wrap">
        <div class="brand-row">
          <div class="brand-title-wrap">
            <a href="index.html" class="btn-home" title="Quay về trang chủ">← Trang chủ</a>
            <div class="header-titles">
              <h1>${meta.headerTitle}</h1>
              <span class="sub">${meta.subTitle}</span>
            </div>
          </div>
          <div class="meta" id="meta">0/0 câu</div>
        </div>
        <div class="toolbar">
          <button id="btnCheck"><span>✓</span> Xem kết quả</button>
          <button class="secondary" id="btnReset"><span>↻</span> Làm lại</button>
          <button class="ghost" id="btnToggleKey"><span>👁</span> Đáp án</button>
        </div>
      </div>
    </header>

    <main class="wrap">
      <div id="list" class="cards"></div>
      ${navHtml}
    </main>

    <button id="btnScrollTop" class="btn-scroll-top" title="Lên đầu trang" aria-label="Lên đầu trang">↑</button>

    <script>
${script}
    </script>
  </body>
</html>
`;
}

// Generate all 6 files
for (let i = 1; i <= 6; i++) {
  const content = fs.readFileSync('bai' + i + '.html', 'utf8');
  const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
  const scriptContent = scriptMatch[1];
  const bankMatch = scriptContent.match(/const BANK = (\[[\s\S]*?\]);(?:\s*\n\s*(?:const|function|let|var|window|render))/);
  const sandbox = {};
  vm.runInNewContext('BANK = ' + bankMatch[1], sandbox);
  const bank = sandbox.BANK;

  const newHtml = generateHtml(i, bank);
  fs.writeFileSync('bai' + i + '.html', newHtml, 'utf8');
  console.log('Successfully updated bai' + i + '.html (' + bank.length + ' questions)');
}
