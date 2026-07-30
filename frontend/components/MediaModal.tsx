import React, { useState } from 'react';
import { X, Play, FileText, ChevronUp, Lightbulb, ShieldAlert } from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mediaUrl: string;
  transcript: string;
  insights: string[];
  summary?: string;
  isAdmin?: boolean;
}

export default function MediaModal({ 
  isOpen, 
  onClose, 
  title, 
  mediaUrl, 
  transcript, 
  insights, 
  summary,
  isAdmin = false 
}: MediaModalProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  if (!isOpen) return null;

  const isAudio = mediaUrl.toLowerCase().endsWith('.mp3') || mediaUrl.toLowerCase().endsWith('.wav');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-800 line-clamp-1">{title}</h2>
            {isAdmin && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">Admin View</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Media Player - Admin Only */}
          {isAdmin ? (
            <div className="bg-black rounded-xl overflow-hidden shadow-inner flex justify-center items-center relative" style={{ minHeight: isAudio ? 'auto' : '400px' }}>
              {isAudio ? (
                <div className="w-full p-8 flex flex-col items-center gap-4 bg-slate-800 text-white">
                  <Play className="w-16 h-16 opacity-50" />
                  <audio controls src={mediaUrl} className="w-full max-w-md" />
                </div>
              ) : (
                <video controls src={mediaUrl} className="w-full h-auto max-h-[500px]" />
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Privacy Protection Mode</h4>
                <p className="text-xs text-slate-500 mt-0.5">Raw audio recordings and full transcripts are restricted to verified administrators to protect participant privacy. High-level summaries and key insights are shared below.</p>
              </div>
            </div>
          )}

          {/* Summary of What Was Said - Public & Admin */}
          {summary && (
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-medium text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                Overview of What Was Said
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Major Insights & Topics */}
          {insights && insights.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-900">Key Relevant Insights</h3>
              </div>
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                {insights.map((insight, idx) => (
                  <li key={idx} className="text-sm">{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcript Accordion - Admin Only */}
          {isAdmin && (
            <div className="border rounded-xl overflow-hidden">
              <button 
                onClick={() => setTranscriptOpen(!transcriptOpen)}
                className="w-full flex justify-between items-center px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2 text-slate-800 font-medium text-lg">
                  <FileText className="w-5 h-5 text-slate-500" />
                  Full Transcript
                </div>
                {transcriptOpen ? (
                  <ChevronUp className="w-5 h-5 text-slate-500" />
                ) : (
                  <PlusIcon />
                )}
              </button>
              
              {transcriptOpen && (
                <div className="p-5 border-t bg-white text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {transcript || "No transcript available for this media."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
