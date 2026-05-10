import { useState } from 'react'
import { X, BookOpen, Zap, Keyboard } from 'lucide-react'
import { GLOSSARY, QUICK_START, SHORTCUTS } from '../../data/terminology'

const TABS = [
  { id: 'glossary',    label: 'Glossary',     icon: BookOpen },
  { id: 'quickstart',  label: 'Quick Start',  icon: Zap },
  { id: 'shortcuts',   label: 'Shortcuts',    icon: Keyboard },
]

// ── Swatch for connection-type color preview ────────────────────────────────
function ColorSwatch({ color, dashed }) {
  if (!color) return null
  return (
    <span
      style={{
        display: 'inline-block',
        width: 28,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: dashed ? 0.6 : 1,
        flexShrink: 0,
        border: dashed ? `2px dashed ${color}` : 'none',
        background: dashed ? 'none' : color,
        verticalAlign: 'middle',
        marginRight: 6,
      }}
    />
  )
}

// ── Dot for element-type color ──────────────────────────────────────────────
function ColorDot({ color }) {
  if (!color) return null
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        marginRight: 6,
        verticalAlign: 'middle',
      }}
    />
  )
}

// ── Glossary Tab ────────────────────────────────────────────────────────────
function GlossaryTab() {
  return (
    <div className="space-y-6">
      {GLOSSARY.map((section) => (
        <div key={section.id}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 pb-1 border-b border-gray-100">
            {section.category}
          </h3>
          <dl className="space-y-2">
            {section.terms.map((term) => (
              <div key={term.en} className="flex gap-3 items-start">
                <dt
                  className="text-sm font-medium text-gray-800 shrink-0 flex items-center"
                  style={{ minWidth: 136 }}
                >
                  {section.id === 'element-types' && <ColorDot color={term.color} />}
                  {section.id === 'connection-types' && (
                    <ColorSwatch color={term.color} dashed={term.dashed} />
                  )}
                  {term.en}
                </dt>
                <dd className="text-sm text-gray-500 leading-snug">{term.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}

// ── Quick Start Tab ─────────────────────────────────────────────────────────
function QuickStartTab() {
  return (
    <div className="space-y-4">
      {QUICK_START.map((item) => (
        <div key={item.step} className="flex gap-4 items-start">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
            style={{ backgroundColor: '#CC0000' }}
          >
            {item.step}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-0.5">{item.title}</p>
            <p className="text-sm text-gray-500 leading-snug">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Shortcuts Tab ───────────────────────────────────────────────────────────
function ShortcutsTab() {
  return (
    <div className="space-y-1">
      {SHORTCUTS.map((s, i) => (
        <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
          <span className="text-sm text-gray-600">{s.action}</span>
          <div className="flex items-center gap-1 shrink-0">
            {s.keys.map((k, ki) => (
              <span key={ki} className="inline-flex items-center gap-1">
                <kbd
                  className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-700"
                  style={{ lineHeight: 1.4 }}
                >
                  {k}
                </kbd>
                {ki < s.keys.length - 1 && <span className="text-gray-300 text-xs">+</span>}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main HelpModal ──────────────────────────────────────────────────────────
export default function HelpModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('glossary')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl flex flex-col"
        style={{ width: 620, maxHeight: '82vh', minHeight: 400 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 rounded-t-lg flex-shrink-0"
          style={{ backgroundColor: '#CC0000' }}
        >
          <span className="text-white font-semibold text-sm tracking-wide">Help &amp; Reference</span>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-5 flex-shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors',
                  active
                    ? 'border-[#CC0000] text-[#CC0000] font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'glossary'   && <GlossaryTab />}
          {activeTab === 'quickstart' && <QuickStartTab />}
          {activeTab === 'shortcuts'  && <ShortcutsTab />}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-gray-100 text-xs text-gray-400 flex-shrink-0 rounded-b-lg">
          BioLab Workflow · Terminology v1.0
        </div>
      </div>
    </div>
  )
}
