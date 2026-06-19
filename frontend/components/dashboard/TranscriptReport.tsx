'use client'

interface TranscriptReportProps {
  transcript: string | null
  sentimentScore: number | null
  themes: string[]
  keyQuotes: string[]
  confidence: number | null
}

function getConfidenceLabel(c: number | null): { text: string; color: string } {
  if (!c || c < 0.4) return { text: 'LOW CONFIDENCE', color: '#ef4444' }
  if (c < 0.7) return { text: 'MEDIUM', color: '#f59e0b' }
  return { text: 'HIGH', color: '#10b981' }
}

function getSentimentLabel(s: number | null): { text: string; color: string } {
  if (!s) return { text: 'Neutral', color: '#94a3b8' }
  if (s > 0.1) return { text: 'Positive', color: '#10b981' }
  if (s < -0.1) return { text: 'Negative', color: '#ef4444' }
  return { text: 'Neutral', color: '#94a3b8' }
}

const THEME_COLORS: Record<string, string> = {
  drought: '#ef4444', flooding: '#3b82f6', food_security: '#f59e0b', displacement: '#a855f7',
  health: '#ec4899', temperature: '#ef4444', deforestation: '#84cc16', biodiversity: '#14b8a6',
  energy: '#eab308', adaptation: '#06b6d4',
}

export function TranscriptReport({ transcript, sentimentScore, themes, keyQuotes, confidence }: TranscriptReportProps) {
  const conf = getConfidenceLabel(confidence)
  const sent = getSentimentLabel(sentimentScore)

  return (
    <div className="rounded-xl p-6 border space-y-5"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.08)' }}>
      
      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${conf.color}20`, color: conf.color }}>
          {conf.text}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${sent.color}20`, color: sent.color }}>
          Sentiment: {sent.text} ({sentimentScore?.toFixed(2) || '0.00'})
        </span>
      </div>

      {/* Themes */}
      {themes.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Climate Themes</h4>
          <div className="flex flex-wrap gap-1.5">
            {themes.map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded-md font-medium"
                style={{ background: `${THEME_COLORS[t] || '#64748b'}20`, color: THEME_COLORS[t] || '#94a3b8' }}>
                {t.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Quotes */}
      {keyQuotes.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Key Quotes</h4>
          <div className="space-y-2">
            {keyQuotes.map((q, i) => (
              <blockquote key={i} className="pl-3 text-sm italic" style={{ borderLeft: '2px solid #14b8a6', color: '#e2e8f0' }}>
                &ldquo;{q}&rdquo;
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Full Transcript</h4>
          <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{transcript}</p>
        </div>
      )}
    </div>
  )
}
