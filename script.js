/* -------------------------------------------------------------
 * SaranCalci JavaScript Logic
 * Implements state management, a safe mathematical expression
 * parser, keyboard mappings, local storage history/theme logs,
 * and elegant UI animation controls.
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const expressionDisplay = document.getElementById('expression');
  const resultDisplay = document.getElementById('result');
  const sciPanel = document.getElementById('sci-panel');
  const calculatorContainer = document.querySelector('.calculator-container');
  const calculatorCard = document.querySelector('.calculator');
  const historyDrawer = document.getElementById('history-drawer');
  const historyList = document.getElementById('history-list');
  const toast = document.getElementById('toast');
  
  // Controls
  const toggleSciBtn = document.getElementById('toggle-sci');
  const toggleHistoryBtn = document.getElementById('toggle-history');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const moonIcon = document.getElementById('moon-icon');
  const sunIcon = document.getElementById('sun-icon');
  const clearHistoryBtn = document.getElementById('clear-history');
  
  // All keypad buttons
  const buttons = document.querySelectorAll('.btn');

  // --- Calculator State ---
  let currentInput = '0';      // The active number/value being entered (displays on bottom line)
  let currentFormula = '';     // The growing math equation expression (displays on top line)
  let shouldResetInput = false; // Flag to replace currentInput on next digit (after '=' or constants)
  let history = JSON.parse(localStorage.getItem('saranCalciHistory')) || [];

  // --- Initialize App ---
  initTheme();
  renderHistory();

  // --- Theme Toggle Control ---
  function initTheme() {
    const savedTheme = localStorage.getItem('saranCalciTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('saranCalciTheme', newTheme);
    updateThemeIcons(newTheme);
    createRipple(themeToggleBtn);
  });

  function updateThemeIcons(theme) {
    if (theme === 'dark') {
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
    } else {
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
    }
  }

  // --- Scientific Panel Toggle ---
  toggleSciBtn.addEventListener('click', () => {
    sciPanel.classList.toggle('hidden');
    calculatorContainer.classList.toggle('sci-active');
    
    // Toggle active state styling on button
    toggleSciBtn.classList.toggle('active-control');
    createRipple(toggleSciBtn);
  });

  // --- History Drawer Toggle ---
  toggleHistoryBtn.addEventListener('click', () => {
    historyDrawer.classList.toggle('active');
    createRipple(toggleHistoryBtn);
  });

  // Close drawer if clicking outside the calculator or history panel
  document.addEventListener('click', (e) => {
    if (!historyDrawer.contains(e.target) && 
        !toggleHistoryBtn.contains(e.target) && 
        historyDrawer.classList.contains('active')) {
      historyDrawer.classList.remove('active');
    }
  });

  // --- Event Delegation / Button Routing ---
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      createRipple(button);
      const value = button.dataset.value;
      const action = button.dataset.action;

      if (value !== undefined) {
        handleValueInput(value);
      } else if (action !== undefined) {
        handleActionInput(action);
      }
    });
  });

  // --- Handle Digit / Dot / Operator inputs ---
  function handleValueInput(val) {
    // If it's an operator (+, -, *, /)
    if (['+', '-', '*', '/'].includes(val)) {
      handleOperator(val);
    } 
    // If it's a number or decimal point
    else {
      handleDigit(val);
    }
    updateDisplay();
  }

  function handleDigit(digit) {
    // If screen needs reset (e.g. after calculation or constant insertion)
    if (shouldResetInput) {
      currentInput = digit === '.' ? '0.' : digit;
      shouldResetInput = false;
      return;
    }

    // Decimal Point Check
    if (digit === '.') {
      if (currentInput.includes('.')) return; // Prevent multiple decimals
      currentInput += '.';
      return;
    }

    // Standard digit appending
    if (currentInput === '0') {
      currentInput = digit;
    } else {
      currentInput += digit;
    }
  }

  function handleOperator(op) {
    // Format operators for user display (× and ÷ instead of * and /)
    const displayOp = op === '*' ? '×' : op === '/' ? '÷' : op;

    // Check if we just calculated a result and want to chain operations
    if (currentFormula.includes('=')) {
      currentFormula = `${currentInput} ${displayOp} `;
      shouldResetInput = true;
      return;
    }

    // If formula is empty and we type an operator, set active input as starting point
    if (currentFormula === '') {
      currentFormula = `${currentInput} ${displayOp} `;
    } 
    // If user clicked multiple operators consecutively, swap the last one
    else if (shouldResetInput && currentFormula !== '') {
      currentFormula = currentFormula.slice(0, -3) + ` ${displayOp} `;
    } 
    // Standard operator append
    else {
      currentFormula += `${currentInput} ${displayOp} `;
    }
    
    shouldResetInput = true;
  }

  // --- Action Button Handlers ---
  function handleActionInput(action) {
    switch (action) {
      case 'clear':
        clearAll();
        break;
      case 'backspace':
        backspace();
        break;
      case 'percent':
        applyPercent();
        break;
      case 'negate':
        negateValue();
        break;
      case 'calculate':
        evaluateFormula();
        break;
      // Scientific Actions:
      case 'sin':
      case 'cos':
      case 'tan':
      case 'log':
      case 'ln':
      case 'sqrt':
      case 'factorial':
        applyScientificFunction(action);
        break;
      case 'power':
        handleOperator('^');
        break;
    }
    updateDisplay();
  }

  function clearAll() {
    currentInput = '0';
    currentFormula = '';
    shouldResetInput = false;
  }

  function backspace() {
    if (shouldResetInput) {
      currentFormula = ''; // Reset calculation state
      return;
    }
    
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
    } else {
      currentInput = '0';
    }
  }

  function applyPercent() {
    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    currentInput = (num / 100).toString();
    shouldResetInput = true;
  }

  function negateValue() {
    if (currentInput === '0') return;
    if (currentInput.startsWith('-')) {
      currentInput = currentInput.substring(1);
    } else {
      currentInput = '-' + currentInput;
    }
  }

  // --- Scientific Functions (evaluated instantly on active input) ---
  function applyScientificFunction(func) {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;

    let result;
    try {
      switch (func) {
        case 'sin':
          // Convert degrees to radians
          result = Math.sin(val * Math.PI / 180);
          result = parseFloat(result.toFixed(10)); // Round off floating point anomalies
          break;
        case 'cos':
          result = Math.cos(val * Math.PI / 180);
          result = parseFloat(result.toFixed(10));
          break;
        case 'tan':
          // tan(90) is undefined/infinity
          if (Math.abs(val % 180) === 90) {
            throw new Error("Invalid Input");
          }
          result = Math.tan(val * Math.PI / 180);
          result = parseFloat(result.toFixed(10));
          break;
        case 'log':
          if (val <= 0) throw new Error("Invalid Input");
          result = Math.log10(val);
          result = parseFloat(result.toFixed(10));
          break;
        case 'ln':
          if (val <= 0) throw new Error("Invalid Input");
          result = Math.log(val);
          result = parseFloat(result.toFixed(10));
          break;
        case 'sqrt':
          if (val < 0) throw new Error("Invalid Input");
          result = Math.sqrt(val);
          result = parseFloat(result.toFixed(10));
          break;
        case 'factorial':
          result = computeFactorial(val);
          if (isNaN(result)) throw new Error("Invalid Input");
          break;
      }
      currentInput = result.toString();
      shouldResetInput = true;
    } catch (err) {
      showError(err.message === "Invalid Input" ? "Invalid Input" : "Error");
    }
  }

  function computeFactorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity; // JS numbers max out here
    let res = 1;
    for (let i = 2; i <= n; i++) {
      res *= i;
    }
    return res;
  }

  // --- Custom Expression Evaluation (BODMAS / PEMDAS Compliant) ---
  function evaluateFormula() {
    // If formula is already evaluated or empty, do nothing
    if (currentFormula === '' || currentFormula.includes('=')) return;

    // Build the final expression string to evaluate
    let fullExpression = currentFormula + currentInput;

    try {
      const result = evaluateExpression(fullExpression);
      
      // Format display
      let formattedResult = formatOutput(result);
      
      // Update screens
      expressionDisplay.textContent = fullExpression + ' =';
      resultDisplay.textContent = formattedResult;
      
      // Save history log
      saveToHistory(fullExpression, formattedResult);
      
      // Reset state for future calculations
      currentInput = formattedResult;
      currentFormula = fullExpression + ' =';
      shouldResetInput = true;
    } catch (err) {
      showError(err.message);
    }
  }

  // Format result to prevent screen overflows and clean up decimal approximations
  function formatOutput(num) {
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Infinity';
    
    // Check if exponent representation is needed (very large/small numbers)
    const absNum = Math.abs(num);
    if (absNum > 1e12 || (absNum < 1e-6 && absNum > 0)) {
      return num.toExponential(6);
    }
    
    // Standard rounding of floating points to max 10 places, strip trailing zeros
    const rounded = parseFloat(num.toFixed(10));
    return rounded.toString();
  }

  // Pure JavaScript Shunting-Yard parser
  function evaluateExpression(exprStr) {
    // Sanitize display operators to math standard
    let safeStr = exprStr.replace(/×/g, '*').replace(/÷/g, '/');
    
    const tokens = [];
    let i = 0;
    
    while (i < safeStr.length) {
      let char = safeStr[i];
      
      if (char === ' ') {
        i++;
        continue;
      }
      
      // Operator check
      if (['+', '-', '*', '/', '^'].includes(char)) {
        // Distinguish minus operator vs negative number sign
        if (char === '-') {
          let isNegativeSign = false;
          if (tokens.length === 0) {
            isNegativeSign = true;
          } else {
            let lastToken = tokens[tokens.length - 1];
            if (['+', '-', '*', '/', '^'].includes(lastToken)) {
              isNegativeSign = true;
            }
          }
          
          if (isNegativeSign) {
            let numStr = '-';
            i++;
            // Read following digits
            while (i < safeStr.length && (/[0-9.]/.test(safeStr[i]))) {
              numStr += safeStr[i];
              i++;
            }
            if (numStr === '-') {
              tokens.push('-'); // Was operator after all
            } else {
              tokens.push(parseFloat(numStr));
            }
            continue;
          }
        }
        
        tokens.push(char);
        i++;
      } 
      // Constants values
      else if (safeStr.startsWith('pi', i)) {
        tokens.push(Math.PI);
        i += 2;
      } else if (char === 'e' && !(/[a-zA-Z]/.test(safeStr[i-1] || '')) && !(/[a-zA-Z]/.test(safeStr[i+1] || ''))) {
        // standalone 'e' (not parts of expressions like 'sin' or 'exp')
        tokens.push(Math.E);
        i++;
      }
      // Floating numbers
      else if (/[0-9.]/.test(char)) {
        let numStr = '';
        while (i < safeStr.length && (/[0-9.]/.test(char = safeStr[i]))) {
          numStr += char;
          i++;
        }
        tokens.push(parseFloat(numStr));
      } else {
        i++; // ignore unknown characters safely
      }
    }
    
    // Shunting-Yard configuration
    const outputQueue = [];
    const operatorStack = [];
    
    const precedence = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '^': 3
    };
    
    const associativity = {
      '+': 'L',
      '-': 'L',
      '*': 'L',
      '/': 'L',
      '^': 'R'
    };
    
    for (let token of tokens) {
      if (typeof token === 'number') {
        outputQueue.push(token);
      } else if (['+', '-', '*', '/', '^'].includes(token)) {
        let o1 = token;
        let o2 = operatorStack[operatorStack.length - 1];
        
        while (o2 && ['+', '-', '*', '/', '^'].includes(o2) && (
          (associativity[o1] === 'L' && precedence[o1] <= precedence[o2]) ||
          (associativity[o1] === 'R' && precedence[o1] < precedence[o2])
        )) {
          outputQueue.push(operatorStack.pop());
          o2 = operatorStack[operatorStack.length - 1];
        }
        operatorStack.push(o1);
      }
    }
    
    while (operatorStack.length > 0) {
      outputQueue.push(operatorStack.pop());
    }
    
    // Evaluate Reverse Polish Notation (RPN)
    const evalStack = [];
    for (let token of outputQueue) {
      if (typeof token === 'number') {
        evalStack.push(token);
      } else {
        let b = evalStack.pop();
        let a = evalStack.pop();
        
        if (a === undefined || b === undefined) {
          throw new Error("Syntax Error");
        }
        
        switch (token) {
          case '+': evalStack.push(a + b); break;
          case '-': evalStack.push(a - b); break;
          case '*': evalStack.push(a * b); break;
          case '/':
            if (b === 0) throw new Error("Divide by Zero");
            evalStack.push(a / b);
            break;
          case '^': evalStack.push(Math.pow(a, b)); break;
        }
      }
    }
    
    if (evalStack.length !== 1) {
      throw new Error("Syntax Error");
    }
    
    return evalStack[0];
  }

  // --- Display Updates ---
  function updateDisplay() {
    expressionDisplay.textContent = currentFormula;
    
    // Truncate display font sizes for extremely long inputs to prevent screen layout cracking
    if (currentInput.length > 16) {
      resultDisplay.style.fontSize = '1.6rem';
    } else if (currentInput.length > 10) {
      resultDisplay.style.fontSize = '2rem';
    } else {
      resultDisplay.style.fontSize = '2.5rem';
    }
    
    resultDisplay.textContent = currentInput;
  }

  // --- Error & Shake Feedback ---
  function showError(msg) {
    // Play card error shake animation
    calculatorCard.classList.add('shake');
    setTimeout(() => calculatorCard.classList.remove('shake'), 400);

    // Show Toast
    toast.textContent = msg;
    toast.classList.remove('hidden');
    
    // Automatically hide toast
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2500);

    clearAll();
  }

  // --- History Management ---
  function saveToHistory(expr, res) {
    // Add new equation to top of history
    history.unshift({ expression: expr, result: res });
    // Cap at 10 items
    if (history.length > 10) history.pop();
    
    localStorage.setItem('saranCalciHistory', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-history">No calculations yet</div>';
      return;
    }

    history.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      itemEl.innerHTML = `
        <span class="history-item-expr">${item.expression}</span>
        <span class="history-item-res">${item.result}</span>
      `;
      
      // Restores history item to calculator on click
      itemEl.addEventListener('click', () => {
        currentInput = item.result;
        currentFormula = item.expression;
        shouldResetInput = true;
        updateDisplay();
        historyDrawer.classList.remove('active'); // Close history drawer
      });
      
      historyList.appendChild(itemEl);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('saranCalciHistory');
    renderHistory();
    createRipple(clearHistoryBtn);
  });

  // --- Create Micro-Interaction Click Ripples ---
  function createRipple(element) {
    // Clean up older ripples
    const oldRipples = element.querySelectorAll('.ripple');
    oldRipples.forEach(r => r.remove());

    const circle = document.createElement('span');
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `50%`;
    circle.style.top = `50%`;
    circle.style.transform = 'translate(-50%, -50%) scale(0)';
    circle.classList.add('ripple');

    element.appendChild(circle);
  }

  // --- Keyboard Support ---
  window.addEventListener('keydown', (e) => {
    let key = e.key;
    let btn = null;

    // Match numbers
    if (/[0-9]/.test(key)) {
      btn = document.querySelector(`.btn-num[data-value="${key}"]`);
    } 
    // Decimal point
    else if (key === '.') {
      btn = document.querySelector(`.btn-num[data-value="."]`);
    } 
    // Operators
    else if (key === '+') {
      btn = document.querySelector(`.btn-operator[data-value="+"]`);
    } else if (key === '-') {
      btn = document.querySelector(`.btn-operator[data-value="-"]`);
    } else if (key === '*') {
      btn = document.querySelector(`.btn-operator[data-value="*"]`);
    } else if (key === '/') {
      e.preventDefault(); // Prevents default browser quick-search drawers
      btn = document.querySelector(`.btn-operator[data-value="/"]`);
    } else if (key === '^') {
      btn = document.querySelector(`.btn-sci[data-action="power"]`);
    } else if (key === '%') {
      btn = document.querySelector(`.btn-action[data-action="percent"]`);
    } 
    // Evaluation (Enter or Equals)
    else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      btn = document.getElementById('key-equals');
    } 
    // Editing Actions (Backspace, Clear)
    else if (key === 'Backspace') {
      btn = document.getElementById('key-backspace');
    } else if (key === 'Escape') {
      btn = document.getElementById('key-clear');
    }

    // Trigger visual feedback and execute action
    if (btn) {
      btn.classList.add('active-press');
      // Replicate the active state click
      btn.click();
      setTimeout(() => btn.classList.remove('active-press'), 120);
    }
  });
});
