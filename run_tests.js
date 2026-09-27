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

  // Test sandbox execution
  const mockElement = () => ({
    append: () => {},
    appendChild: () => {},
    addEventListener: () => {},
    setAttribute: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    dataset: {},
    style: {},
    closest: () => mockElement(),
    querySelector: () => mockElement(),
    querySelectorAll: () => []
  });

  const sandbox = {
    console: console,
    window: {
      scrollTo: () => {},
      addEventListener: () => {}
    },
    document: {
      createElement: () => mockElement(),
      getElementById: () => mockElement(),
      querySelector: () => mockElement(),
      querySelectorAll: () => [],
      addEventListener: () => {},
      body: mockElement()
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
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

console.log('====================================');
console.log(allPassed ? '>>> ALL TESTS PASSED SUCCESSFULLY! <<<' : '>>> SOME TESTS FAILED! <<<');
console.log('====================================');
process.exit(allPassed ? 0 : 1);
