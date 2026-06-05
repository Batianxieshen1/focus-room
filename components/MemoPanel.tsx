'use client'

import { useState, useEffect, useRef } from 'react'
import { t } from '@/lib/i18n'

interface Props {
  onClose: () => void
}

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

type Filter = 'all' | 'active' | 'done'

const STORAGE_KEY = 'focus-room-memo'

function loadTodos(): Todo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveTodos(todos: Todo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch {}
}

export default function MemoPanel({ onClose }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  // Load from localStorage on mount
  useEffect(() => {
    setTodos(loadTodos())
  }, [])

  // Persist on every change
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos(prev => [
      { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36), text, completed: false, createdAt: Date.now() },
      ...prev,
    ])
    setInput('')
  }

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const handleClearCompleted = () => {
    if (window.confirm(t('memo.confirmClear'))) {
      setTodos(prev => prev.filter(t => !t.completed))
    }
  }

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'done') return t.completed
    return true
  })

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* macOS Window */}
      <div
        className="relative w-full max-w-[480px] max-h-[70vh] glass-strong rounded-3xl flex flex-col overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar - dark style */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] select-none">
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70 hover:bg-[#ff5f57] transition-colors"
              aria-label="Close"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]/50" />
          </div>

          <span className="text-sm font-medium text-white/50 ml-1">{t('memo.title')}</span>

          <button
            onClick={onClose}
            className="ml-auto text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden p-5">
          {/* Heading */}
          <h2 className="text-xl font-bold text-white mb-4">{t('memo.heading')}</h2>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-3 bg-white/[0.06] rounded-full p-0.5 w-fit">
            {(['all', 'active', 'done'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-200 active:scale-95 ${
                  filter === f
                    ? 'bg-white/[0.15] text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-3 text-[11px] text-white/30">
            <span>{activeCount} {t('memo.activeCount')}</span>
            <span>{completedCount} {t('memo.completedCount')}</span>
          </div>

          {/* Input area */}
          <div className="flex gap-2 mb-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder={t('memo.newReminder')}
              className="flex-1 px-3.5 py-2 text-sm text-white bg-white/[0.06] border border-white/[0.08] rounded-xl outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10 transition-all placeholder:text-white/25"
            />
            <button
              onClick={addTodo}
              disabled={!input.trim()}
              className="px-3.5 py-2 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              +
            </button>
          </div>

          {/* Todo list */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1 custom-scrollbar">
            {filtered.length === 0 && (
              <div className="text-center text-white/25 text-sm py-10">
                {filter === 'done'
                  ? t('memo.emptyDone')
                  : filter === 'active'
                  ? t('memo.emptyActive')
                  : t('memo.emptyAll')}
              </div>
            )}

            {filtered.map(todo => (
              <div
                key={todo.id}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex-shrink-0 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all active:scale-95 ${
                    todo.completed
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-white/20 hover:border-blue-400/60'
                  }`}
                  aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {todo.completed && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                {/* Text */}
                <span
                  className={`flex-1 text-sm transition-all ${
                    todo.completed
                      ? 'text-white/30 line-through decoration-white/15'
                      : 'text-white/80'
                  }`}
                >
                  {todo.text}
                </span>

                {/* Delete button (visible on hover) */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all text-sm active:scale-95"
                  aria-label="Delete"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-3 mt-2 border-t border-white/[0.08]">
            <p className="text-[11px] text-white/25 italic text-center">
              {t('memo.writeHint')}
            </p>

            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="w-full mt-2 text-[11px] text-white/30 hover:text-red-400 transition-colors text-center active:scale-95"
              >
                {t('memo.clearCompleted')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
