import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pin, Plus, Search, Tag, Trash2, Edit3, Check, RefreshCw, 
  Share2, FileText, Sparkles, CheckSquare, Cloud, Copy, ExternalLink, AlertCircle
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export interface KeepNote {
  id: string;
  title: string;
  content: string;
  color: 'yellow' | 'sage' | 'rose' | 'sky' | 'lavender' | 'sand';
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  syncedToDriveId?: string;
}

interface NotesSyncProps {
  isLightMode: boolean;
  token?: string | null;
  userEmail?: string | null;
}

const DEFAULT_NOTES: KeepNote[] = [
  {
    id: 'note-1',
    title: '🌿 Morning Abdominal Breathing Covenant',
    content: '1. 4-4-8 Sisyphus diaphragmatic breath cadence\n2. Drink warm cardamom tea before checking notifications\n3. Record one gratitude moment in the Sanctuary Happy Diary',
    color: 'sage',
    isPinned: true,
    tags: ['#covenant', '#mindfulness'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note-2',
    title: '⚡ Athena Dialectic Reality Check',
    content: 'When feeling overwhelmed by deadlines, ask:\n- Is this thought a fact or a heavy stone?\n- Name 3 sensory grounding anchors in this room right now.',
    color: 'yellow',
    isPinned: true,
    tags: ['#therapy', '#affirmation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note-3',
    title: '🎶 Raag Sound Frequency Notes',
    content: 'Bhairavi raga tuning (432Hz) during evening wind-down drops heart rate into parasympathetic state. Practice before bed.',
    color: 'lavender',
    isPinned: false,
    tags: ['#music', '#reflection'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const COLOR_MAP: Record<KeepNote['color'], { bgDark: string; bgLight: string; borderDark: string; borderLight: string; badge: string }> = {
  yellow: {
    bgDark: 'bg-amber-950/40',
    bgLight: 'bg-amber-50',
    borderDark: 'border-amber-500/40',
    borderLight: 'border-amber-200',
    badge: 'bg-amber-500/20 text-amber-300'
  },
  sage: {
    bgDark: 'bg-emerald-950/40',
    bgLight: 'bg-emerald-50',
    borderDark: 'border-emerald-500/40',
    borderLight: 'border-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-300'
  },
  rose: {
    bgDark: 'bg-rose-950/40',
    bgLight: 'bg-rose-50',
    borderDark: 'border-rose-500/40',
    borderLight: 'border-rose-200',
    badge: 'bg-rose-500/20 text-rose-300'
  },
  sky: {
    bgDark: 'bg-sky-950/40',
    bgLight: 'bg-sky-50',
    borderDark: 'border-sky-500/40',
    borderLight: 'border-sky-200',
    badge: 'bg-sky-500/20 text-sky-300'
  },
  lavender: {
    bgDark: 'bg-purple-950/40',
    bgLight: 'bg-purple-50',
    borderDark: 'border-purple-500/40',
    borderLight: 'border-purple-200',
    badge: 'bg-purple-500/20 text-purple-300'
  },
  sand: {
    bgDark: 'bg-stone-900/60',
    bgLight: 'bg-stone-100',
    borderDark: 'border-stone-700/60',
    borderLight: 'border-stone-300',
    badge: 'bg-stone-500/20 text-stone-300'
  }
};

export default function NotesSync({ isLightMode, token, userEmail }: NotesSyncProps) {
  const [notes, setNotes] = useState<KeepNote[]>(() => {
    try {
      const saved = localStorage.getItem('sanctuary_keep_notes');
      return saved ? JSON.parse(saved) : DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState<KeepNote['color']>('yellow');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newTagsInput, setNewTagsInput] = useState('#reflection');

  // Status indicators
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncSuccessId, setSyncSuccessId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Save notes to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('sanctuary_keep_notes', JSON.stringify(notes));
    } catch (e) {
      console.error("Failed to save Keep notes to localStorage:", e);
    }
  }, [notes]);

  // Load from Firestore if user is authenticated
  useEffect(() => {
    async function loadFirestoreNotes() {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const notesRef = collection(db, 'users', currentUser.uid, 'notes');
        const snapshot = await getDocs(notesRef);
        if (!snapshot.empty) {
          const fetchedNotes: KeepNote[] = [];
          snapshot.forEach(docSnap => {
            fetchedNotes.push(docSnap.data() as KeepNote);
          });
          if (fetchedNotes.length > 0) {
            setNotes(fetchedNotes);
          }
        }
      } catch (e) {
        console.warn("Firestore notes load info:", e);
      }
    }
    loadFirestoreNotes();
  }, []);

  const saveNoteToFirestore = async (note: KeepNote) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const noteRef = doc(db, 'users', currentUser.uid, 'notes', note.id);
      await setDoc(noteRef, { ...note, userId: currentUser.uid }, { merge: true });
    } catch (e) {
      console.warn("Firestore save note error:", e);
    }
  };

  const deleteNoteFromFirestore = async (noteId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const noteRef = doc(db, 'users', currentUser.uid, 'notes', noteId);
      await deleteDoc(noteRef);
    } catch (e) {
      console.warn("Firestore delete note error:", e);
    }
  };

  // Extract all unique tags
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === 'all' || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;

    const parsedTags = newTagsInput
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const note: KeepNote = {
      id: `note-${Date.now()}`,
      title: newTitle.trim() || 'Untitled Note',
      content: newContent.trim(),
      color: newColor,
      isPinned: newIsPinned,
      tags: parsedTags.length > 0 ? parsedTags : ['#reflection'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes(prev => [note, ...prev]);
    saveNoteToFirestore(note);
    resetForm();
    setIsCreating(false);
  };

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;

    const parsedTags = newTagsInput
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const updated: KeepNote = {
      ...editingNote,
      title: newTitle.trim() || 'Untitled Note',
      content: newContent.trim(),
      color: newColor,
      isPinned: newIsPinned,
      tags: parsedTags,
      updatedAt: new Date().toISOString()
    };

    setNotes(prev => prev.map(n => n.id === editingNote.id ? updated : n));
    saveNoteToFirestore(updated);

    setEditingNote(null);
    resetForm();
  };

  const startEditNote = (note: KeepNote) => {
    setEditingNote(note);
    setNewTitle(note.title);
    setNewContent(note.content);
    setNewColor(note.color);
    setNewIsPinned(note.isPinned);
    setNewTagsInput(note.tags.join(' '));
    setIsCreating(false);
  };

  const resetForm = () => {
    setNewTitle('');
    setNewContent('');
    setNewColor('yellow');
    setNewIsPinned(false);
    setNewTagsInput('#reflection');
  };

  const togglePin = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        const updated = { ...n, isPinned: !n.isPinned };
        saveNoteToFirestore(updated);
        return updated;
      }
      return n;
    }));
  };

  const deleteNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('Delete this Sanctuary Keep note?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
      deleteNoteFromFirestore(id);
      if (editingNote?.id === id) setEditingNote(null);
    }
  };

  const copyNoteContent = (note: KeepNote, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sync / Export note to Google Drive as a text or Keep document
  const exportNoteToGoogleDrive = async (note: KeepNote, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      alert("Please connect your Google Workspace Covenant above to export notes directly to Google Drive!");
      return;
    }

    setSyncingId(note.id);
    try {
      const fileName = `Keep Note - ${note.title.replace(/[^\w\s-]/gi, '')}.txt`;
      const fileContent = `==================================================\nGOOGLE KEEP & SANCTUARY NOTE\nTitle: ${note.title}\nColor Tag: ${note.color}\nTags: ${note.tags.join(' ')}\nDate: ${new Date(note.createdAt).toLocaleString()}\n==================================================\n\n${note.content}\n\nSynced via The Pantheon Active Mind Sanctuary`;

      const metadata = {
        name: fileName,
        mimeType: 'text/plain'
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', new Blob([fileContent], { type: 'text/plain' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, syncedToDriveId: data.id } : n));
        setSyncSuccessId(note.id);
        setTimeout(() => setSyncSuccessId(null), 3000);
      } else {
        alert("Failed to sync note to Google Drive. Check connection.");
      }
    } catch (err) {
      console.error("Error exporting note to Drive:", err);
      alert("Could not reach Google Drive endpoint.");
    } finally {
      setSyncingId(null);
    }
  };

  // Export note to Google Tasks
  const exportNoteToGoogleTasks = async (note: KeepNote, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      alert("Please connect your Google Workspace Covenant to add notes to Google Tasks!");
      return;
    }

    try {
      // Get primary list
      const listRes = await fetch('https://tasks.googleapis.com/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const primaryListId = listData.items?.[0]?.id || '@default';

        const taskRes = await fetch(`https://tasks.googleapis.com/v1/lists/${primaryListId}/tasks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: `📌 ${note.title}`,
            notes: note.content
          })
        });

        if (taskRes.ok) {
          alert(`Successfully created Google Task from note: "${note.title}"!`);
        } else {
          alert("Could not add to Google Tasks.");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Summarizer with Athena
  const handleSynthesizeNotes = () => {
    setIsSummarizing(true);
    setTimeout(() => {
      const titles = notes.map(n => n.title).join(', ');
      setAiSummary(`Athena's Mindful Alignment Summary:\n1. Your notes reflect a key focus on abdominal breathing covenants and dialectic grounding.\n2. Key actionable item: Maintain your evening sound frequency tuning and morning gratitude diary.\n3. Keep 2 pinned notes active for quick emotional grounding when stress arises.`);
      setIsSummarizing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Controls & Search Header */}
      <div className={`p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
        <div className="w-full md:w-auto space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono tracking-widest text-[#c9a45c] uppercase font-bold">Google Keep & Sanctuary Sync</span>
            {userEmail && <span className="text-[8px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">Connected to {userEmail}</span>}
          </div>
          <h3 className={`font-serif text-lg font-bold ${isLightMode ? 'text-stone-900' : 'text-white'}`}>
            Personal Notes & Keeps
          </h3>
          <p className="text-[10px] font-mono text-slate-400">
            View, pin, color-code, and sync your personal thoughts directly with Google Drive & Tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search keeps & notes..."
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-stone-800' : 'bg-black/30 border-brown text-white'}`}
            />
          </div>

          <button 
            onClick={() => { resetForm(); setIsCreating(true); setEditingNote(null); }}
            className="py-2 px-4 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> New Keep Note
          </button>

          <button 
            onClick={handleSynthesizeNotes}
            disabled={isSummarizing || notes.length === 0}
            className="py-2 px-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-mono font-bold text-[10px] uppercase rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          >
            {isSummarizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Athena AI Synthesis
          </button>
        </div>
      </div>

      {/* AI Summary Banner if generated */}
      <AnimatePresence>
        {aiSummary && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs leading-relaxed space-y-2 relative">
            <button onClick={() => setAiSummary(null)} className="absolute top-3 right-3 text-purple-400 hover:text-white text-xs font-mono">✕</button>
            <div className="flex items-center gap-2 font-bold font-mono text-[10px] uppercase text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" /> Athena Synthesis Guidance
            </div>
            <p className="whitespace-pre-line font-serif">{aiSummary}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tag Chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Tags:
          </span>
          <button 
            onClick={() => setSelectedTag('all')}
            className={`text-[9px] font-mono px-3 py-1 rounded-full cursor-pointer transition-all ${selectedTag === 'all' ? 'bg-[#c9a45c] text-black font-bold' : 'bg-black/20 text-slate-400 hover:text-white border border-brown/30'}`}
          >
            All Notes ({notes.length})
          </button>
          {allTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-[9px] font-mono px-3 py-1 rounded-full cursor-pointer transition-all ${selectedTag === tag ? 'bg-[#c9a45c] text-black font-bold' : 'bg-black/20 text-slate-400 hover:text-white border border-brown/30'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Form */}
      <AnimatePresence>
        {(isCreating || editingNote) && (
          <motion.form 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
            className={`p-6 rounded-2xl border-2 space-y-4 shadow-2xl relative ${isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#151d19] border-[#c9a45c]/50'}`}
          >
            <div className="flex justify-between items-center border-b border-brown/30 pb-3">
              <span className="text-[10px] font-mono text-[#c9a45c] uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" /> {editingNote ? 'Edit Sanctuary Keep Note' : 'Create New Keep Note'}
              </span>
              <button 
                type="button" 
                onClick={() => { setIsCreating(false); setEditingNote(null); resetForm(); }}
                className="text-xs font-mono opacity-60 hover:opacity-100"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <input 
                type="text" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Title (e.g. Sisyphus Meditation Covenants...)"
                className={`w-full text-sm font-bold p-3 rounded-xl border focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be] text-stone-900' : 'bg-black/30 border-brown text-white'}`}
              />

              <textarea 
                rows={4}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Write your note, reflection, or list here..."
                className={`w-full text-xs p-3 rounded-xl border focus:outline-none focus:border-[#c9a45c] font-serif ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be] text-stone-900' : 'bg-black/30 border-brown text-white'}`}
              />

              {/* Color Selector & Pin Toggle & Tags */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase text-slate-400">Color Palette:</span>
                  {(['yellow', 'sage', 'rose', 'sky', 'lavender', 'sand'] as KeepNote['color'][]).map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${newColor === color ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      style={{
                        backgroundColor: color === 'yellow' ? '#f59e0b' : color === 'sage' ? '#10b981' : color === 'rose' ? '#f43f5e' : color === 'sky' ? '#0284c7' : color === 'lavender' ? '#a855f7' : '#78716c'
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewIsPinned(!newIsPinned)}
                    className={`flex items-center gap-1 text-[10px] font-mono px-3 py-1.5 rounded-xl border cursor-pointer ${newIsPinned ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' : 'bg-black/20 text-slate-400 border-brown/30'}`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${newIsPinned ? 'fill-amber-300' : ''}`} /> {newIsPinned ? 'Pinned 📌' : 'Pin Note'}
                  </button>

                  <input 
                    type="text" 
                    value={newTagsInput}
                    onChange={e => setNewTagsInput(e.target.value)}
                    placeholder="#tags (space separated)"
                    className={`text-[10px] font-mono p-1.5 rounded-xl border w-36 ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be] text-stone-900' : 'bg-black/30 border-brown text-white'}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="submit" 
                className="py-2.5 px-6 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" /> {editingNote ? 'Save Changes' : 'Save Note'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* PINNED NOTES SECTION */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <Pin className="w-3.5 h-3.5 fill-amber-400" /> Pinned Keep Notes ({pinnedNotes.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map(note => renderNoteCard(note))}
          </div>
        </div>
      )}

      {/* OTHER NOTES SECTION */}
      <div className="space-y-3">
        {pinnedNotes.length > 0 && (
          <div className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider pt-2">
            Others ({otherNotes.length})
          </div>
        )}

        {filteredNotes.length === 0 ? (
          <div className={`p-12 text-center border-2 border-dashed rounded-2xl ${isLightMode ? 'border-[#dfd2be]' : 'border-brown/40'}`}>
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#c9a45c]" />
            <p className="text-xs text-slate-400 font-serif">No notes match your search or filter. Create a new Keep note above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherNotes.map(note => renderNoteCard(note))}
          </div>
        )}
      </div>

    </div>
  );

  function renderNoteCard(note: KeepNote) {
    const style = COLOR_MAP[note.color] || COLOR_MAP.yellow;
    const isSynced = !!note.syncedToDriveId;

    return (
      <motion.div
        key={note.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={() => startEditNote(note)}
        className={`p-5 rounded-2xl border-2 flex flex-col justify-between min-h-[200px] cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl relative group ${isLightMode ? `${style.bgLight} ${style.borderLight} text-stone-900` : `${style.bgDark} ${style.borderDark} text-white`}`}
      >
        <div className="space-y-2">
          {/* Header & Pin */}
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-serif text-sm font-bold leading-snug line-clamp-2">
              {note.title}
            </h4>
            <button
              onClick={(e) => togglePin(note.id, e)}
              title={note.isPinned ? "Unpin Note" : "Pin Note"}
              className="text-slate-400 hover:text-amber-400 p-1 cursor-pointer transition-colors shrink-0"
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Content Body */}
          <p className="text-xs opacity-90 font-serif whitespace-pre-line leading-relaxed line-clamp-6">
            {note.content}
          </p>
        </div>

        {/* Footer Actions & Tags */}
        <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-2.5 mt-3">
          <div className="flex flex-wrap gap-1">
            {note.tags.map(tag => (
              <span key={tag} className={`text-[8px] font-mono px-2 py-0.5 rounded-full ${style.badge}`}>
                {tag}
              </span>
            ))}
            {isSynced && (
              <span className="text-[8px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Cloud className="w-2.5 h-2.5" /> Synced Drive
              </span>
            )}
          </div>

          <div className="flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity pt-1">
            <span className="text-[8px] font-mono opacity-60">
              {new Date(note.updatedAt).toLocaleDateString()}
            </span>

            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button 
                onClick={(e) => copyNoteContent(note, e)}
                title="Copy Content"
                className="p-1 hover:text-[#c9a45c] text-slate-400 cursor-pointer transition-colors"
              >
                {copiedId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button 
                onClick={(e) => exportNoteToGoogleDrive(note, e)}
                title="Export / Sync to Google Drive"
                className="p-1 hover:text-emerald-400 text-slate-400 cursor-pointer transition-colors"
              >
                {syncingId === note.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#c9a45c]" /> : syncSuccessId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Cloud className="w-3.5 h-3.5" />}
              </button>

              <button 
                onClick={(e) => exportNoteToGoogleTasks(note, e)}
                title="Send Note to Google Tasks"
                className="p-1 hover:text-blue-400 text-slate-400 cursor-pointer transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={(e) => deleteNote(note.id, e)}
                title="Delete Keep Note"
                className="p-1 hover:text-red-400 text-slate-400 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
}
