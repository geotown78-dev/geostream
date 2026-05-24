import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { FileText, Edit, Save, X, Loader2, Check } from 'lucide-react';

export default function Terms() {
  const { user } = useAuth();
  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/terms');
      const data = await res.json();
      if (data && data.content) {
        setContent(data.content);
        setEditedContent(data.content);
      }
    } catch (err) {
      console.error('Error fetching terms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });
      const data = await res.json();
      if (res.ok) {
        setContent(data.content || editedContent);
        setIsEditing(false);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Error saving terms:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">იტვირთება წესები და პირობები...</p>
      </div>
    );
  }

  // Format the helper paragraphs with margins for readability when rendering
  const renderFormattedContent = (txt: string) => {
    return txt.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-4" />;
      
      // If line is header (doesn't start with digits like 1.1 but starts with digits like 1. or contains header text)
      const isMainHeader = /^\d+\.\s+/.test(trimmed) && !/^\d+\.\d+/.test(trimmed);
      const isSubHeader = /^\d+\.\d+\.\s+/.test(trimmed);

      if (isMainHeader) {
        return (
          <h2 key={idx} className="text-lg font-black text-brand-primary mt-6 mb-3 uppercase tracking-wider flex items-center gap-2">
            {trimmed}
          </h2>
        );
      } else if (isSubHeader) {
        return (
          <h3 key={idx} className="text-sm font-bold text-white mt-4 mb-2 pl-2 border-l border-brand-primary/40">
            {trimmed}
          </h3>
        );
      } else {
        return (
          <p key={idx} className="text-zinc-300 text-sm leading-relaxed mb-3 pl-4 font-medium">
            {trimmed}
          </p>
        );
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300" id="terms-page-container">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <FileText size={18} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white">
              წესები და პირობები
            </h1>
          </div>
          <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] mt-2">
            მომხმარებელთა უფლებები, პასუხისმგებლობის შეზღუდვა და წესები
          </p>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditedContent(content);
                    setIsEditing(false);
                    setSaveStatus('idle');
                  }}
                  id="cancel-edit-terms-btn"
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 hover:border-white/20 hover:text-white text-zinc-400 rounded-xl transition-all text-xs font-black uppercase tracking-wider"
                >
                  <X size={14} />
                  გაუქმება
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  id="save-terms-btn"
                  className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white hover:bg-opacity-90 rounded-xl transition-all text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-primary/25 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  შენახვა
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                id="edit-terms-btn"
                className="flex items-center gap-2 px-5 py-2 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/20 rounded-xl transition-all text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                <Edit size={14} />
                ტექსტის რედაქტირება (ADMIN)
              </button>
            )}
          </div>
        )}
      </div>

      {saveStatus === 'success' && (
        <div id="terms-success-alert" className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <Check size={14} />
          ცვლილებები წარმატებით შეინახა!
        </div>
      )}

      {saveStatus === 'error' && (
        <div id="terms-error-alert" className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <X size={14} />
          შეცდომა ცვლილებების შენახვისას. სცადეთ თავიდან.
        </div>
      )}

      {/* Main card */}
      <div className="bg-zinc-950 border border-white/5 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e10_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e10_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="relative z-10">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  მხარდაჭერილია ჩვეულებრივი ტექსტის ფორმატირება
                </span>
                <span className="text-[10px] font-bold text-zinc-600 font-mono">
                  {editedContent.length} სიმბოლო
                </span>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                id="terms-content-editor"
                className="w-full min-h-[550px] bg-zinc-900/50 border border-white/10 rounded-xl p-4 sm:p-6 text-zinc-300 font-sans text-sm leading-relaxed outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all select-all font-medium resize-y"
                placeholder="შეიყვანეთ წესები და პირობები..."
              />
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-zinc-300">
              {renderFormattedContent(content)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
