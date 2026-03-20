
// ===========================
// Translation Dictionaries (Why am I doing this to myself?)
// ===========================
const translations = {
  en: {
    start: "Start",
    end: "End",
    step: "Step",
    range: "Range",            // for button
    tooltipDefault: "Hover over a special button to see instructions...",
    derivative: "Derivative",
    integral: "Integral",
    root: "Root",
    plot: "Graph",             // unified 
    screenDefault: "0",
    instructions: {
      default: "Hover over a special button to see instructions...",
      range: "Range: generates a table of values (set start, end, step before using).",
      derivative: "Derivative: computes symbolic derivative (expression must include variable x, y, or z).",
      integral: "Integral: calculates definite integral (requires start and end values).",
      root: "Root: scans for approximate roots (function should cross y=0 in given range).",
      plot: "Plot: generates graph of function and derivative (only appears after pressing Plot)."
    }
  },
  es: {
    start: "Inicio",
    end: "Fin",
    step: "Paso",   // “Paso” was the only logical translation, it´s just the increment
    range: "Rango",            // for button
    tooltipDefault: "Pasa el cursor sobre un botón especial para ver instrucciones...",
    derivative: "Derivada",
    integral: "Integral",
    root: "Raíz",
    plot: "Gráfica",
    screenDefault: "0",
    instructions: {
      default: "Pasa el cursor sobre un botón especial para ver instrucciones...",
      range: "Rango: genera una tabla de valores (establece inicio, fin y paso antes de usar).",
      derivative: "Derivada: calcula la derivada simbólica (la expresión debe incluir la variable x, y o z).",
      integral: "Integral: calcula la integral definida (requiere valores de inicio y fin).",
      root: "Raíz: busca raíces aproximadas (la función debe cruzar y=0 en el rango dado).",
      plot: "Gráfica: genera la gráfica de la función y su derivada (solo aparece después de presionar Graficar)."
    }
  }
};

// ===========================
// SOLVER MESSAGES
// ===========================
const solverMessages = {
  en: {
    rootFound: "Root found:",
    noRoot: "No root found.",
    derivative: "Derivative at point:",
    integral: "Integral over range:"
  },
  es: {
    rootFound: "Raíz encontrada:",
    noRoot: "No se encontró raíz.",
    derivative: "Derivada en el punto:",
    integral: "Integral en el rango:"
  }
};

// ===========================
// Path for API calls and solver comms <--- THIS, THIS MESSED ME UP FOR AN HOUR
// ===========================
const BASE_PATH = "/SPP/CALC";
let currentLang = "en";
// ===========================
// Language State (defaulting English)
// ===========================
function setLanguage(lang) {
  currentLang = lang;

  // Tooltip default
  document.getElementById("tooltip").textContent = translations[lang].tooltipDefault;

  // Extra control buttons
  document.getElementById("rangeBtn").textContent      = translations[lang].range;
  document.getElementById("derivativeBtn").textContent = translations[lang].derivative;
  document.getElementById("integralBtn").textContent   = translations[lang].integral;
  document.getElementById("rootBtn").textContent       = translations[lang].root;
  document.getElementById("plotBtn").textContent       = translations[lang].plot;

  // Start/End/Step labels
  document.querySelector("label[for='startValue']").textContent = translations[lang].start;
  document.querySelector("label[for='endValue']").textContent   = translations[lang].end;
  document.querySelector("label[for='stepValue']").textContent  = translations[lang].step;

  // Display default
  document.getElementById("screen").textContent = translations[lang].screenDefault;

  // Reset tooltip immediately
  document.getElementById("tooltip").textContent = translations[lang].instructions.default;
}

// ===========================
// HOVER INSTRUCTIONS (dynamic cuz i hate myself)
// ===========================
document.getElementById("rangeBtn").addEventListener("mouseenter", () => {
  document.getElementById("tooltip").textContent = translations[currentLang].instructions.range;
});
document.getElementById("derivativeBtn").addEventListener("mouseenter", () => {
  document.getElementById("tooltip").textContent = translations[currentLang].instructions.derivative;
});
document.getElementById("integralBtn").addEventListener("mouseenter", () => {
  document.getElementById("tooltip").textContent = translations[currentLang].instructions.integral;
});
document.getElementById("rootBtn").addEventListener("mouseenter", () => {
  document.getElementById("tooltip").textContent = translations[currentLang].instructions.root;
});
document.getElementById("plotBtn").addEventListener("mouseenter", () => {
  document.getElementById("tooltip").textContent = translations[currentLang].instructions.plot;
});

// Reset text when mouse leaves
document.querySelectorAll(".ExtraControls button").forEach(btn => {
  btn.addEventListener("mouseleave", () => {
    document.getElementById("tooltip").textContent = translations[currentLang].instructions.default;
  });
});
// ===========================
// Button Logic (UGHHHH)
// ===========================
const display = document.querySelector(".Layout");
let expression = "";

// Handle number/operator buttons
document.querySelectorAll(".Button-Cctr, .ButtonDouble-Cctr, .ButtonTriple-Cctr")
  .forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-value");
      if (!val) return;

      if (["sin", "cos", "tan"].includes(val)) {
        expression += val + "(";
      } else if (val === "pi") {
        expression += "pi";
      } else {
        expression += val;
      }

      display.textContent = expression;
      console.log("DEBUG current expression:", expression);
    });
  });

// ===========================
// Solver communication
// ===========================
function sendToSolver(action, payload) {
  console.log("DEBUG sendToSolver:", action, payload);

  fetch(`${BASE_PATH}/solve/${action}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    console.log("DEBUG response data:", data);

    switch (action) {
      case "evaluate":
        document.querySelector(".Layout").textContent = data.result ?? "Error";
        break;

      case "table":
        // Floating window
          if (data.table) {
    openRangeWindow(data.table);
  } else {
    openRangeWindow("<p>Error: no table returned</p>");
  }
  break;

      case "derivative":
        showSolverMessage("derivative", data.result);
        break;

      case "integral":
        showSolverMessage("integral", data.result);
        break;

      case "root":
        showSolverMessage(data.rootFound ? "rootFound" : "noRoot", data.value);
        break;

      case "plot":
        if (data.image) {
          // Floating window instead of inline <img>
          openGraphWindow(data.image);
        } else {
          console.warn("No image returned from solver");
        }
        break;
    }
  })
  .catch(err => {
    console.error("DEBUG fetch error:", err);
    document.querySelector(".Layout").textContent = "Error"; // <-- Fallback (THIS IS NECCESARY)
  });
}
// ===========================
// Special Solver Utilities (JS is the work of a demon i swear)
// ===========================

// Normalization (THIS MESSED MY CALCULATOR UP TWICE)
function normalizeExpression(expr) {
  // Replace ^ with Python-style exponent ** (DO NOT REMOVE, FOR CHAR MODIFICATIONS TURN TO APP.PY)
  return expr.replace(/\^/g, "**");
}
// NEW detector (USELESS JUNK UGHHH)
function detectVariable(expr) {
  if (expr.includes("y")) return "y";
  if (expr.includes("z")) return "z";
  return "x"; // default
}
// ===========================
// Floating windows (ITS BEAUTIFUL)
// ===========================

// Range window: pastel yipeee
function openRangeWindow(tableHTML) {
  const html = `
    <html>
      <head>
        <title>Range Table</title>
        <style>
          body {
            font-family: 'Gill Sans', Calibri, 'Trebuchet MS', sans-serif;
            padding: 10px;
            background: linear-gradient(135deg, #a7c7e7, #cba6f7, #f7a6c7);
            color: #232323;
          }
          h2 {
            color: #004d4d;
            margin-bottom: 10px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            background: rgba(255,255,255,0.85);
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          th, td {
            border: 1px solid #004d4d;
            padding: 6px;
            text-align: center;
          }
          th {
            background: #a0e7e5;
            color: #004d4d;
          }
        </style>
      </head>
      <body>
        <h2>Range Table</h2>
        ${tableHTML}
      </body>
    </html>
  `;
  const win = window.open("", "RangeWindow", "width=600,height=500");
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// Graph window: pastel :333
function openGraphWindow(imageData) {
  const html = `
    <html>
      <head>
        <title>Graph</title>
        <style>
          body {
            font-family: 'Gill Sans', Calibri, 'Trebuchet MS', sans-serif;
            text-align: center;
            padding: 10px;
            background: linear-gradient(135deg, #a7c7e7, #cba6f7, #f7a6c7);
            color: #232323;
          }
          h2 {
            color: #004d4d;
            margin-bottom: 10px;
          }
          img {
            max-width: 100%;
            height: auto;
            margin-top: 10px;
            border: 2px solid #004d4d;
            border-radius: 10px;
            background: rgba(255,255,255,0.85);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
        </style>
      </head>
      <body>
        <h2>Graph</h2>
        <img src="data:image/png;base64,${imageData}" alt="Function Graph">
      </body>
    </html>
  `;
  const win = window.open("", "GraphWindow", "width=600,height=500");
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ===========================
// Show solver messages (derivative, integral, root)
// ===========================
function showSolverMessage(type, value = null) {
  const msg = solverMessages[currentLang][type];
  const output = value !== null ? `${msg} ${value}` : msg;
  document.querySelector("#solverMessage").innerHTML = `<p>${output}</p>`;
}

// ===========================
// Equals Button Logic
// ===========================
document.getElementById("equalsBtn").addEventListener("click", () => {
  const payload = {
    expression,
    x: parseFloat(document.getElementById("xValue").value),
    y: parseFloat(document.getElementById("yValue").value),
    z: parseFloat(document.getElementById("zValue").value),
    var: "x"
  };
  console.log("DEBUG equals payload:", payload);
  sendToSolver("evaluate", payload);
});

// ===========================
// Clear & Backspace Buttons (THEY WERE MISSING, I FIXED THEM)
// ===========================

// Clear button 
document.getElementById("clearBtn").addEventListener("click", () => {
  expression = "";
  display.textContent = translations[currentLang].screenDefault; // reset to "0" in current language
  console.log("DEBUG clear pressed, expression reset");
});

// Backspace button 
document.getElementById("backspaceBtn").addEventListener("click", () => {
  expression = expression.slice(0, -1); // chop off last char
  display.textContent = expression || translations[currentLang].screenDefault; // show "0" if empty
  console.log("DEBUG backspace pressed, new expression:", expression);
});

// ===========================
// Language Selector Buttons (AGAIN WITH THE FIXES)
// ===========================

// English button
document.getElementById("lang-en").addEventListener("click", () => {
  setLanguage("en");
  console.log("DEBUG language switched to English");
});

// Spanish button
document.getElementById("lang-es").addEventListener("click", () => {
  setLanguage("es");
  console.log("DEBUG language switched to Spanish");
});

// ===========================
// Special Solver Buttons (I HATE JAVASCRIPT I HATE ITTT)
// ===========================

// Range button
document.getElementById("rangeBtn").addEventListener("click", () => {
  const exprRaw = document.getElementById("screen").textContent.trim();
  const expr = normalizeExpression(exprRaw);
  const chosenVar = detectVariable(exprRaw);

  const payload = {
    expression: expr,
    x: parseFloat(document.getElementById("xValue").value),
    y: parseFloat(document.getElementById("yValue").value),
    z: parseFloat(document.getElementById("zValue").value),
    start: parseFloat(document.getElementById("startValue").value),
    end: parseFloat(document.getElementById("endValue").value),
    step: parseFloat(document.getElementById("stepValue").value),
    var: chosenVar
  };

  console.log("DEBUG range payload:", payload);

  sendToSolver("table", payload).then(data => {
    console.log("DEBUG range response:", data);
    if (data && data.table) {
      openRangeWindow(data.table);
    } else {
      openRangeWindow("<p>Error: no table returned</p>");
    }
  }).catch(err => {
    console.error("DEBUG range error:", err);
    openRangeWindow("<p>Error: request failed</p>");
  });
});

// Derivative button
document.getElementById("derivativeBtn").addEventListener("click", () => {
  const exprRaw = document.getElementById("screen").textContent.trim();
  const expr = normalizeExpression(exprRaw);
  const chosenVar = detectVariable(exprRaw);

  const payload = {
    expression: expr,
    x: parseFloat(document.getElementById("xValue").value),
    y: parseFloat(document.getElementById("yValue").value),
    z: parseFloat(document.getElementById("zValue").value),
    var: chosenVar
  };
  console.log("DEBUG derivative payload:", payload);
  sendToSolver("derivative", payload);
});

// Integral button
document.getElementById("integralBtn").addEventListener("click", () => {
  const exprRaw = document.getElementById("screen").textContent.trim();
  const expr = normalizeExpression(exprRaw);
  const chosenVar = detectVariable(exprRaw);

  const payload = {
    expression: expr,
    x: parseFloat(document.getElementById("xValue").value),
    y: parseFloat(document.getElementById("yValue").value),
    z: parseFloat(document.getElementById("zValue").value),
    start: parseFloat(document.getElementById("startValue").value),
    end: parseFloat(document.getElementById("endValue").value),
    var: chosenVar
  };
  console.log("DEBUG integral payload:", payload);
  sendToSolver("integral", payload);
});

// Root button
document.getElementById("rootBtn").addEventListener("click", () => {
  const exprRaw = document.getElementById("screen").textContent.trim();
  const expr = normalizeExpression(exprRaw);
  const chosenVar = detectVariable(exprRaw);

  const payload = {
    expression: expr,
    x: parseFloat(document.getElementById("xValue").value),
    y: parseFloat(document.getElementById("yValue").value),
    z: parseFloat(document.getElementById("zValue").value),
    start: parseFloat(document.getElementById("startValue").value),
    end: parseFloat(document.getElementById("endValue").value),
    var: chosenVar
  };
  console.log("DEBUG root payload:", payload);
  sendToSolver("root", payload);
});

// Graph button
document.getElementById("plotBtn").addEventListener("click", () => {
  const exprRaw = document.getElementById("screen").textContent.trim();
  const expr = normalizeExpression(exprRaw);
  const chosenVar = detectVariable(exprRaw);

  const payload = {
    expression: expr,
    x: parseFloat(document.getElementById("xValue").value),
    y: parseFloat(document.getElementById("yValue").value),
    z: parseFloat(document.getElementById("zValue").value),
    start: parseFloat(document.getElementById("startValue").value),
    end: parseFloat(document.getElementById("endValue").value),
    step: parseFloat(document.getElementById("stepValue").value),
    var: chosenVar
  };
  console.log("DEBUG plot payload:", payload);
  sendToSolver("plot", payload);
});
