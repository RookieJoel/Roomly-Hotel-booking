import { useState, useRef, useEffect } from 'react';
import './../pages/Auth.css';

export default function RoleDropdown({ value, onChange }) {
  const options = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
  ];

  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  useEffect(() => {
    if (open) setHighlighted(options.findIndex(o => o.value === value));
  }, [open]);

  const toggle = () => setOpen(v => !v);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => (h === null ? 0 : Math.min(options.length - 1, h + 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => (h === null ? options.length - 1 : Math.max(0, h - 1)));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open && highlighted != null) {
        onChange(options[highlighted].value);
        setOpen(false);
      } else {
        setOpen(true);
      }
    }
  };

  return (
    <div className="role-dropdown" ref={ref}>
      <button
        type="button"
        className="role-dropdown__toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={handleKeyDown}
      >
        <span className="role-dropdown__label">{options.find(o => o.value === value)?.label || 'Select role'}</span>
        <svg className={`role-dropdown__chev ${open ? 'open' : ''}`} width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.25 7.5L10 12.25L14.75 7.5" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul className="role-dropdown__list" role="listbox" tabIndex={-1}>
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              className={`role-dropdown__item ${highlighted === idx ? 'highlighted' : ''} ${value === opt.value ? 'selected' : ''}`}
              onMouseEnter={() => setHighlighted(idx)}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
