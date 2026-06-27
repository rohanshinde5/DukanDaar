import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import {
  BookOpen, Plus, Pin, PinOff, Trash2, X, Save,
  Search, Clock, ChevronDown, Palette
} from 'lucide-react';

// ── Color palette config ──────────────────────────────────────────────────
const COLORS = {
  default: { bg: 'bg-white',       border: 'border-gray-200',   dot: 'bg-gray-400',   label: 'Default'  },
  yellow:  { bg: 'bg-amber-50',    border: 'border-amber-200',  dot: 'bg-amber-400',  label: 'Yellow'   },
  green:   { bg: 'bg-emerald-50',  border: 'border-emerald-200',dot: 'bg-emerald-400',label: 'Green'    },
  blue:    { bg: 'bg-blue-50',     border: 'border-blue-200',   dot: 'bg-blue-400',   label: 'Blue'     },
  red:     { bg: 'bg-rose-50',     border: 'border-rose-200',   dot: 'bg-rose-400',   label: 'Red'      },
  purple:  { bg: 'bg-violet-50',   border: 'border-violet-200', dot: 'bg-violet-400', label: 'Purple'   },
};

// ── Time formatter ────────────────────────────────────────────────────────
const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// ── Small colour picker ───────────────────────────────────────────────────
const ColorPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-brand-muted hover:bg-gray-50 transition-colors"
      >
        <Palette size={12} />
        <span className={`w-2.5 h-2.5 rounded-full ${COLORS[value]?.dot}`} />
        {COLORS[value]?.label}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1.5">
          {Object.entries(COLORS).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              title={cfg.label}
              onClick={() => { onChange(key); setOpen(false); }}
              className={`w-6 h-6 rounded-full ${cfg.dot} border-2 transition-transform hover:scale-110 ${value === key ? 'border-gray-700 scale-110' : 'border-transparent'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Entry Card ────────────────────────────────────────────────────────────
const EntryCard = ({ entry, onEdit, onPin, onDelete }) => {
  const cfg = COLORS[entry.color] || COLORS.default;
  const preview = entry.content.slice(0, 160) + (entry.content.length > 160 ? '…' : '');

  return (
    <div
      onClick={() => onEdit(entry)}
      className={`group relative rounded-2xl border ${cfg.bg} ${cfg.border} p-4 cursor-pointer
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
    >
      {/* Pin badge */}
      {entry.is_pinned && (
        <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white rounded-full p-0.5">
          <Pin size={10} />
        </span>
      )}

      {/* Action buttons — visible on hover */}
      <div
        className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => onPin(entry)}
          title={entry.is_pinned ? 'Unpin' : 'Pin to top'}
          className="p-1.5 bg-white/80 hover:bg-white rounded-lg text-brand-muted hover:text-amber-500 transition-colors shadow-sm"
        >
          {entry.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
        </button>
        <button
          onClick={() => onDelete(entry._id)}
          title="Delete"
          className="p-1.5 bg-white/80 hover:bg-white rounded-lg text-brand-muted hover:text-rose-500 transition-colors shadow-sm"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {entry.title && (
        <h3 className="font-bold text-brand-text text-sm mb-1 pr-16 line-clamp-1">{entry.title}</h3>
      )}
      <p className="text-xs text-brand-muted leading-relaxed whitespace-pre-wrap line-clamp-4">{preview}</p>
      <div className="flex items-center gap-1 mt-3 text-[10px] text-brand-muted">
        <Clock size={9} />
        <span>{fmtDate(entry.updated_at)}</span>
      </div>
    </div>
  );
};

// ── Entry Editor Modal ────────────────────────────────────────────────────
const EditorModal = ({ entry, onClose, onSave }) => {
  const [title, setTitle]     = useState(entry?.title   || '');
  const [content, setContent] = useState(entry?.content || '');
  const [color, setColor]     = useState(entry?.color   || 'default');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
  }, [content]);

  // Focus textarea on open
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleSave = async () => {
    if (!content.trim()) { setError('Content cannot be empty.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ title, content, color, _id: entry?._id });
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  // Ctrl+S / Cmd+S shortcut
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const cfg = COLORS[color] || COLORS.default;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 animate-fade-in" onKeyDown={handleKeyDown}>
      <div className={`${cfg.bg} rounded-2xl border ${cfg.border} shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-brand-muted" />
            <span className="text-sm font-bold text-brand-text">
              {entry?._id ? 'Edit Note' : 'New Note'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ColorPicker value={color} onChange={setColor} />
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={16} className="text-brand-muted" />
            </button>
          </div>
        </div>

        {/* Title input */}
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={`mx-5 mt-4 px-0 py-1 text-lg font-bold text-brand-text placeholder-gray-300 bg-transparent border-none outline-none`}
        />

        {/* Content textarea */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          <textarea
            ref={textareaRef}
            placeholder="Write anything — a note, reminder, business idea, customer detail…"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full min-h-[220px] bg-transparent border-none outline-none resize-none text-sm text-brand-text placeholder-gray-300 leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          {error ? (
            <p className="text-xs text-rose-500 font-medium">{error}</p>
          ) : (
            <p className="text-[11px] text-brand-muted">Ctrl + S to save</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-text text-brand-surface text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Diary Page ───────────────────────────────────────────────────────
const Diary = () => {
  const [entries, setEntries]       = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [editTarget, setEditTarget] = useState(null);  // null = closed, {} = new, entry = editing
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await api.get('/diary');
      setEntries(res.data);
    } catch (e) {
      console.error('Diary fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSave = async ({ _id, title, content, color }) => {
    if (_id) {
      const res = await api.put(`/diary/${_id}`, { title, content, color });
      setEntries(prev => prev.map(e => e._id === _id ? res.data : e)
        .sort((a, b) => b.is_pinned - a.is_pinned || new Date(b.updated_at) - new Date(a.updated_at)));
    } else {
      const res = await api.post('/diary', { title, content, color });
      setEntries(prev => [res.data, ...prev]);
    }
  };

  const handlePin = async (entry) => {
    const res = await api.put(`/diary/${entry._id}`, { is_pinned: !entry.is_pinned });
    setEntries(prev => prev.map(e => e._id === entry._id ? res.data : e)
      .sort((a, b) => b.is_pinned - a.is_pinned || new Date(b.updated_at) - new Date(a.updated_at)));
  };

  const handleDelete = async (id) => {
    await api.delete(`/diary/${id}`);
    setEntries(prev => prev.filter(e => e._id !== id));
    setDeleteConfirm(null);
  };

  const openNew  = () => { setEditTarget({});    setIsEditorOpen(true); };
  const openEdit = (e) => { setEditTarget(e);    setIsEditorOpen(true); };
  const closeEditor = () => { setIsEditorOpen(false); setEditTarget(null); };

  // Filter by search
  const filtered = entries.filter(e =>
    search === '' ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinned   = filtered.filter(e => e.is_pinned);
  const unpinned = filtered.filter(e => !e.is_pinned);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            <BookOpen size={24} className="text-brand-muted" /> Business Diary
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {entries.length} note{entries.length !== 1 ? 's' : ''} · Synced to database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Search notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:border-indigo-300 transition-colors"
            />
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-brand-text text-brand-surface font-semibold px-4 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
          >
            <Plus size={16} /> New Note
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
            <BookOpen size={28} className="text-gray-300" />
          </div>
          <h3 className="font-bold text-brand-text">No notes yet</h3>
          <p className="text-sm text-brand-muted max-w-xs">
            Use the diary to jot down business reminders, customer notes, ideas, or anything important.
          </p>
          <button
            onClick={openNew}
            className="flex items-center gap-2 mt-2 bg-brand-text text-brand-surface font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
          >
            <Plus size={16} /> Write your first note
          </button>
        </div>
      )}

      {/* No search results */}
      {!loading && entries.length > 0 && filtered.length === 0 && (
        <div className="py-16 text-center text-brand-muted text-sm">
          No notes match &ldquo;{search}&rdquo;.
        </div>
      )}

      {/* Pinned section */}
      {!loading && pinned.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1.5">
            <Pin size={10} /> Pinned
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map(e => (
              <EntryCard key={e._id} entry={e} onEdit={openEdit} onPin={handlePin} onDelete={(id) => setDeleteConfirm(id)} />
            ))}
          </div>
        </div>
      )}

      {/* All notes */}
      {!loading && unpinned.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Others</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinned.map(e => (
              <EntryCard key={e._id} entry={e} onEdit={openEdit} onPin={handlePin} onDelete={(id) => setDeleteConfirm(id)} />
            ))}
          </div>
        </div>
      )}

      {/* Editor modal */}
      {isEditorOpen && (
        <EditorModal
          entry={editTarget}
          onClose={closeEditor}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <Trash2 size={18} className="text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-brand-text text-sm">Delete this note?</h3>
                <p className="text-xs text-brand-muted mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-brand-muted hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diary;
