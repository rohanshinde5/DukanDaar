import { useState, useEffect, useCallback } from 'react';
import { Calculator as CalcIcon, X, Delete, Minus, Plus, Divide, X as Multiply } from 'lucide-react';

// ── Button config ─────────────────────────────────────────────────────────
const BUTTONS = [
  // row 1
  { label: 'AC',  type: 'clear',    span: 2 },
  { label: '⌫',   type: 'backspace'         },
  { label: '÷',   type: 'op', val: '/'      },
  // row 2
  { label: '7',   type: 'num'               },
  { label: '8',   type: 'num'               },
  { label: '9',   type: 'num'               },
  { label: '×',   type: 'op', val: '*'      },
  // row 3
  { label: '4',   type: 'num'               },
  { label: '5',   type: 'num'               },
  { label: '6',   type: 'num'               },
  { label: '−',   type: 'op', val: '-'      },
  // row 4
  { label: '1',   type: 'num'               },
  { label: '2',   type: 'num'               },
  { label: '3',   type: 'num'               },
  { label: '+',   type: 'op', val: '+'      },
  // row 5
  { label: '00',  type: 'num'               },
  { label: '0',   type: 'num'               },
  { label: '.',   type: 'decimal'           },
  { label: '=',   type: 'equals', span: 1   },
];

// ── Evaluate safely ───────────────────────────────────────────────────────
const safeEval = (expr) => {
  try {
    // Replace ÷ × − with JS operators (already done before push)
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr})`)();
    if (!isFinite(result)) return 'Error';
    // Limit decimals to 10 places to avoid float noise
    return parseFloat(result.toFixed(10)).toString();
  } catch {
    return 'Error';
  }
};

// ── Calculator Widget ─────────────────────────────────────────────────────
const CalculatorWidget = () => {
  const [open, setOpen]       = useState(false);
  const [display, setDisplay] = useState('0');   // what user sees
  const [expr, setExpr]       = useState('');    // internal expression string
  const [prevExpr, setPrevExpr] = useState('');  // shown in small line above
  const [fresh, setFresh]     = useState(true);  // start fresh after =

  // ── Keyboard support ────
  const handleKey = useCallback((e) => {
    if (!open) return;
    const key = e.key;
    if (key >= '0' && key <= '9') handleNum(key);
    else if (key === '.') handleDecimal();
    else if (['+', '-', '*', '/'].includes(key)) handleOp(key);
    else if (key === 'Enter' || key === '=') handleEquals();
    else if (key === 'Backspace') handleBack();
    else if (key === 'Escape') setOpen(false);
    else if (key === 'Delete') handleClear();
  }, [open, expr, display, fresh]); // eslint-disable-line

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleNum = (n) => {
    if (fresh) { setExpr(n); setDisplay(n); setFresh(false); return; }
    const next = display === '0' ? n : display + n;
    const nextExpr = expr + n;
    setDisplay(next === '0' ? n : next);
    setExpr(nextExpr);
  };

  const handleDecimal = () => {
    if (fresh) { setExpr('0.'); setDisplay('0.'); setFresh(false); return; }
    // Prevent double dots in the current number segment
    const segments = expr.split(/[+\-*/]/);
    const last = segments[segments.length - 1];
    if (last.includes('.')) return;
    setDisplay(display + '.');
    setExpr(expr + '.');
  };

  const handleOp = (op) => {
    setFresh(false);
    // Replace trailing operator if exists
    const trimmed = expr.replace(/[+\-*/]$/, '');
    setExpr(trimmed + op);
    setDisplay(op === '*' ? '×' : op === '/' ? '÷' : op);
  };

  const handleClear = () => {
    setDisplay('0'); setExpr(''); setPrevExpr(''); setFresh(true);
  };

  const handleBack = () => {
    if (fresh || expr.length <= 1) { setDisplay('0'); setExpr(''); setFresh(true); return; }
    const next = expr.slice(0, -1);
    setExpr(next);
    setDisplay(next.slice(-1) || '0');
  };

  const handleEquals = () => {
    if (!expr) return;
    const result = safeEval(expr);
    setPrevExpr(expr + ' =');
    setDisplay(result);
    setExpr(result === 'Error' ? '' : result);
    setFresh(true);
  };

  const handleButton = (btn) => {
    if      (btn.type === 'num')       handleNum(btn.label);
    else if (btn.type === 'op')        handleOp(btn.val);
    else if (btn.type === 'decimal')   handleDecimal();
    else if (btn.type === 'equals')    handleEquals();
    else if (btn.type === 'clear')     handleClear();
    else if (btn.type === 'backspace') handleBack();
  };

  const btnClass = (btn) => {
    const base = 'flex items-center justify-center rounded-xl font-semibold text-sm select-none cursor-pointer transition-all active:scale-95 min-h-[48px]';
    if (btn.type === 'equals')    return `${base} bg-brand-text text-brand-surface hover:opacity-90`;
    if (btn.type === 'op')        return `${base} bg-indigo-50 text-indigo-600 hover:bg-indigo-100`;
    if (btn.type === 'clear')     return `${base} bg-rose-50 text-rose-500 hover:bg-rose-100`;
    if (btn.type === 'backspace') return `${base} bg-amber-50 text-amber-500 hover:bg-amber-100`;
    return `${base} bg-gray-50 text-brand-text hover:bg-gray-100`;
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        id="calculator-toggle"
        onClick={() => setOpen(v => !v)}
        title="Calculator (press Esc to close)"
        className={`fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40
          w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center
          transition-all duration-300 hover:scale-110 active:scale-95
          ${open ? 'bg-rose-500 text-white rotate-45' : 'bg-brand-text text-brand-surface'}`}
      >
        {open ? <X size={22} /> : <CalcIcon size={22} />}
      </button>

      {/* Calculator panel */}
      {open && (
        <div
          id="calculator-panel"
          className="fixed bottom-44 right-5 md:bottom-28 md:right-8 z-40
            bg-brand-surface rounded-3xl border border-gray-200 shadow-2xl
            w-72 overflow-hidden animate-fade-in"
        >
          {/* Display */}
          <div className="bg-gray-900 px-5 pt-5 pb-4 space-y-1 rounded-t-3xl">
            <p className="text-gray-400 text-xs h-4 text-right font-mono truncate">
              {prevExpr}
            </p>
            <p className="text-white text-4xl font-black text-right font-mono tracking-tight truncate leading-none">
              {display.length > 12 ? parseFloat(display).toExponential(4) : display}
            </p>
          </div>

          {/* Buttons grid */}
          <div className="p-3 grid grid-cols-4 gap-2">
            {BUTTONS.map((btn, i) => (
              <button
                key={i}
                onClick={() => handleButton(btn)}
                className={`${btnClass(btn)} ${btn.span === 2 ? 'col-span-2' : ''}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <p className="text-center text-[9px] text-brand-muted pb-3 px-3">
            Keyboard supported · Esc to close
          </p>
        </div>
      )}
    </>
  );
};

export default CalculatorWidget;
