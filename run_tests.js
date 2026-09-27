const fs = require('fs');
const vm = require('vm');

let allPassed = true;

// 1. Verify index.html links
const indexHtml = fs.readFileSync('index.html', 'utf8');
const linkMatches = indexHtml.match(/href="([^"]+)"/g) || [];
const links = linkMatches.map(m => m.replace('href="', '').replace('"', ''));
console.log('Index.html links found:', links.length);
links.forEach(l => {
  if (!l.startsWith('http') && !l.startsWith('#')) {
    if (!fs.existsSync(l)) {
      console.error('FAIL: Link does not exist: ' + l);
      allPassed = false;
    } else {
      console.log('OK: Link exists -> ' + l);
    }
  }
});

// 2. Verify all 6 lesson HTML files
const expectedCounts = { 1: 41, 2: 40, 3: 40, 4: 45, 5: 42, 6: 27 };

for (let i = 1; i <= 6; i++) {
  const file = 'bai' + i + '.html';
  console.log('--- Testing ' + file + ' ---');
  if (!fs.existsSync(file)) {
    console.error('FAIL: File missing: ' + file);
    allPassed = false;
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    console.error('FAIL: No script tag in ' + file);
    allPassed = false;
    continue;
  }
  const scriptCode = scriptMatch[1];
  
  // Syntax check
  try {
    new vm.Script(scriptCode);
    console.log('OK: ' + file + ' script syntax valid');
  } catch (err) {
    console.error('FAIL: ' + file + ' script syntax error: ' + err.message);
    allPassed = false;
    continue;
  }

  // Extract BANK
  const bankMatch = scriptCode.match(/const BANK = (\[[\s\S]*?\]);(?:\s*\n\s*(?:let|const|var|function))/);
  if (!bankMatch) {
    console.error('FAIL: BANK not matched in ' + file);
    allPassed = false;
    continue;
  }

  let bank;
  try {
    bank = JSON.parse(bankMatch[1]);
    console.log('OK: ' + file + ' BANK is valid JSON with ' + bank.length + ' questions');
  } catch (err) {
    console.error('FAIL: ' + file + ' BANK is not valid JSON: ' + err.message);
    allPassed = false;
    continue;
  }

  if (bank.length !== expectedCounts[i]) {
    console.error('FAIL: Question count mismatch for ' + file + ': expected ' + expectedCounts[i] + ', got ' + bank.length);
    allPassed = false;
  }

  const docElements = {};
  const mockElement = (id = '') => ({
    id: id,
    textContent: '',
    innerHTML: '',
    style: {},
    append: () => {},
    appendChild: () => {},
    addEventListener: () => {},
    setAttribute: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    dataset: {},
    closest: () => mockElement(),
    querySelector: () => mockElement(),
    querySelectorAll: () => []
  });

  const lessonStore = {};
  const sandbox = {
    console: console,
    window: {
      scrollTo: () => {},
      addEventListener: () => {}
    },
    document: {
      createElement: (tag) => mockElement(tag),
      getElementById: (id) => {
        if (!docElements[id]) docElements[id] = mockElement(id);
        return docElements[id];
      },
      querySelector: () => mockElement(),
      querySelectorAll: () => [],
      addEventListener: () => {},
      body: mockElement()
    },
    localStorage: {
      getItem: (k) => lessonStore[k] || null,
      setItem: (k, v) => { lessonStore[k] = String(v); },
      removeItem: (k) => { delete lessonStore[k]; }
    },
    navigator: {}
  };
  vm.createContext(sandbox);

  try {
    vm.runInContext(scriptCode, sandbox);
    console.log('OK: ' + file + ' initialized in sandbox without runtime error');
  } catch (err) {
    console.error('FAIL: ' + file + ' runtime error during initialization: ' + err.message);
    allPassed = false;
    continue;
  }

  // Test updateSavedScoreBadge
  if (typeof sandbox.updateSavedScoreBadge === 'function') {
    const metaPrevScoreEl = sandbox.document.getElementById('metaPrevScore');
    lessonStore['cnxh_score_bai_' + i] = JSON.stringify({ score: 35, total: expectedCounts[i], pct: 85 });
    sandbox.updateSavedScoreBadge();
    if (metaPrevScoreEl && metaPrevScoreEl.textContent.includes('✓ Đã làm: 35/' + expectedCounts[i])) {
      console.log('OK: ' + file + ' updateSavedScoreBadge correctly formats saved score');
    } else {
      console.error('FAIL: ' + file + ' updateSavedScoreBadge format mismatch: ' + (metaPrevScoreEl ? metaPrevScoreEl.textContent : 'null'));
      allPassed = false;
    }
  }

  // Test each question type in isCorrect
  bank.forEach((q) => {
    let dummyCorrectAnswer = null;
    if (q.type === 'single') {
      dummyCorrectAnswer = [q.answer[0]];
    } else if (q.type === 'multi') {
      dummyCorrectAnswer = [...q.answer];
    } else if (q.type === 'tfset') {
      dummyCorrectAnswer = q.statements.map(s => s.answer);
    } else if (q.type === 'drag_pairs') {
      dummyCorrectAnswer = { ...q.pairs };
    } else if (q.type === 'drag_groups') {
      dummyCorrectAnswer = {};
      Object.entries(q.groups).forEach(([g, arr]) => {
        dummyCorrectAnswer[g] = [...arr];
      });
    }

    const res = sandbox.isCorrect(q, dummyCorrectAnswer);
    if (!res) {
      console.error('FAIL in ' + file + ' Q' + q.id + ' (' + q.type + '): correct answer failed isCorrect() evaluation!');
      allPassed = false;
    }

    // Test wrong answer
    let dummyWrongAnswer = null;
    if (q.type === 'single') {
      dummyWrongAnswer = ['WRONG_VALUE'];
    } else if (q.type === 'multi') {
      dummyWrongAnswer = ['WRONG_VALUE'];
    } else if (q.type === 'tfset') {
      dummyWrongAnswer = q.statements.map(s => !s.answer);
    } else if (q.type === 'drag_pairs') {
      dummyWrongAnswer = {};
      Object.keys(q.pairs).forEach(k => dummyWrongAnswer[k] = 'WRONG');
    } else if (q.type === 'drag_groups') {
      dummyWrongAnswer = {};
      Object.keys(q.groups).forEach(g => dummyWrongAnswer[g] = ['WRONG_ITEM']);
    }

    const wrongRes = sandbox.isCorrect(q, dummyWrongAnswer);
    if (wrongRes) {
      console.error('FAIL in ' + file + ' Q' + q.id + ' (' + q.type + '): wrong answer passed isCorrect() evaluation!');
      allPassed = false;
    }
  });
}

// 3. Verify index.html State Synchronization
console.log('--- Testing index.html State Synchronization ---');
try {
  const indexScriptMatch = indexHtml.match(/<script>([\s\S]*?)<\/script>/);
  if (indexScriptMatch) {
    const elements = {};
    const getEl = (id) => {
      if (!elements[id]) {
        elements[id] = {
          id: id,
          textContent: '',
          innerHTML: '',
          href: '',
          style: {},
          className: '',
          classList: {
            add: function(c) { this.classes[c] = true; },
            remove: function(c) { delete this.classes[c]; },
            contains: function(c) { return !!this.classes[c]; },
            classes: {}
          },
          listeners: {},
          addEventListener: function(evt, handler) { this.listeners[evt] = handler; },
          querySelectorAll: () => [],
          querySelector: () => null
        };
      }
      return elements[id];
    };

    const store = {};
    const indexSandbox = {
      console: console,
      window: { addEventListener: () => {}, scrollY: 0 },
      document: {
        getElementById: getEl,
        querySelectorAll: () => [],
        querySelector: () => null,
        documentElement: { scrollTop: 0 }
      },
      localStorage: {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; }
      },
      confirm: () => true,
      alert: () => {}
    };
    vm.createContext(indexSandbox);
    vm.runInContext(indexScriptMatch[1], indexSandbox);

    // Initial state check
    indexSandbox.syncStudyProgress();
    if (getEl('ready_tag_1').textContent !== '✓ SẴN SÀNG') {
      console.error('FAIL: Initial ready tag mismatch');
      allPassed = false;
    } else {
      console.log('OK: Initial state is SẴN SÀNG');
    }

    // Complete Bai 1 check
    store['cnxh_score_bai_1'] = JSON.stringify({ score: 38, total: 41, pct: 93 });
    indexSandbox.syncStudyProgress();
    if (getEl('ready_tag_1').textContent !== '↻ LÀM LẠI' || !getEl('done_tag_1').textContent.includes('38/41')) {
      console.error('FAIL: Completed lesson state mismatch');
      allPassed = false;
    } else {
      console.log('OK: Completed lesson state changes to LÀM LẠI and shows exact score 38/41 (93%)');
    }

    // Complete all 6 lessons check
    const totals = { 1: 41, 2: 40, 3: 40, 4: 45, 5: 42, 6: 27 };
    for (let i = 1; i <= 6; i++) {
      store['cnxh_score_bai_' + i] = JSON.stringify({ score: totals[i], total: totals[i], pct: 100 });
    }
    indexSandbox.syncStudyProgress();
    if (getEl('kpiLessonsDone').textContent !== '6 / 6' || getEl('kpiQuestionsDone').textContent !== '235 / 235') {
      console.error('FAIL: All lessons completed KPI mismatch');
      allPassed = false;
    } else {
      console.log('OK: All 6 lessons completed correctly updates KPIs (6/6 lessons, 235/235 questions, 100% accuracy)');
    }

    // Hero & Mid CTA text check
    if (!getEl('heroStartBtn').innerHTML.includes('ÔN TẬP LẠI BÀI 1') || !getEl('journeyMidCtaBtn').innerHTML.includes('ÔN TẬP LẠI BÀI 1')) {
      console.error('FAIL: CTA button text mismatch on all completed');
      allPassed = false;
    } else {
      console.log('OK: Hero CTA & Journey Mid CTA synchronized to ÔN TẬP LẠI BÀI 1');
    }

    // Test Reset History Button Listener
    const clickListeners = getEl('resetHistoryBtn').listeners || {};
    if (clickListeners['click']) {
      clickListeners['click']();
      if (getEl('ready_tag_1').textContent !== '✓ SẴN SÀNG' || getEl('kpiLessonsDone').textContent !== '0 / 6') {
        console.error('FAIL: Reset history failed to restore initial state');
        allPassed = false;
      } else {
        console.log('OK: Reset history clears all localStorage scores and restores initial UI state');
      }
    }
  }
} catch (err) {
  console.error('FAIL in index state test:', err.message);
  allPassed = false;
}

console.log('====================================');
console.log(allPassed ? '>>> ALL TESTS PASSED SUCCESSFULLY! <<<' : '>>> SOME TESTS FAILED! <<<');
console.log('====================================');
process.exit(allPassed ? 0 : 1);
