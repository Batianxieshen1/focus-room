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

  const clearCompleted = () => {
    setTodos(prev => prev.filter(t => !t.completed))
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* macOS Window */}
      <div
        className="relative w-full max-w-[480px] max-h-[70vh] bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.3),0_8px_20px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar - macOS style */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-100/80 border-b border-gray-200/60 select-none">
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff4040] transition-colors"
              aria-label="Close"
            />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>

          <span className="text-sm font-medium text-gray-500 ml-1">{t('memo.title')}</span>

          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden p-5">
          {/* Heading */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('memo.heading')}</h2>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-3 bg-gray-100 rounded-full p-0.5 w-fit">
            {(['all', 'active', 'done'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                  filter === f
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-3 text-[11px] text-gray-400">
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
              className="flex-1 px-3.5 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
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
              <div className="text-center text-gray-300 text-sm py-10">
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
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex-shrink-0 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all ${
                    todo.completed
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 hover:border-blue-400'
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
                      ? 'text-gray-400 line-through decoration-gray-300'
                      : 'text-gray-800'
                  }`}
                >
                  {todo.text}
                </span>

                {/* Delete button (visible on hover) */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-sm"
                  aria-label="Delete"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-3 mt-2 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 italic text-center">
              {t('memo.writeHint')}
            </p>

            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="w-full mt-2 text-[11px] text-gray-400 hover:text-red-400 transition-colors text-center"
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
