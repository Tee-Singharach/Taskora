'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/components/providers/AppProvider'
import { fmtDateTime, fmtRelative } from '@/lib/utils'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import type { AuditCategory } from '@/lib/types'

const CAT_INFO: Record<AuditCategory, { label: string; color: string }> = {
  workflow: { label: 'Workflow',  color: 'sky' },
  user:     { label: 'ผู้ใช้',    color: 'violet' },
  security: { label: 'Security', color: 'rose' },
  system:   { label: 'ระบบ',     color: 'slate' },
}

export default function AuditLogPage() {
  const { store, currentUser } = useApp()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<AuditCategory | 'all'>('all')

  const sorted = useMemo(
    () => [...store.auditLog].sort((a, b) => b.time.localeCompare(a.time)),
    [store.auditLog]
  )

  const filtered = useMemo(() => {
    return sorted.filter(entry => {
      const matchSearch = !search ||
        entry.action.toLowerCase().includes(search.toLowerCase()) ||
        entry.detail.toLowerCase().includes(search.toLowerCase()) ||
        entry.target.toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === 'all' || entry.cat === catFilter
      return matchSearch && matchCat
    })
  }, [sorted, search, catFilter])

  const catCounts = useMemo(() => (['all','workflow','user','security','system'] as const).reduce((acc, c) => {
    acc[c] = c === 'all' ? store.auditLog.length : store.auditLog.filter(e => e.cat === c).length
    return acc
  }, {} as Record<string, number>), [store.auditLog])

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-4 lg:p-7 max-w-[1400px] mx-auto">
        <div className="text-center py-20">
          <div className="text-[16px] font-semibold text-gray-500">เฉพาะผู้ดูแลระบบ</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-7 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
            <Icon name="shield" size={20} className="text-white"/>
          </div>
          <h1 className="text-[24px] font-bold tracking-tighter m-0 text-gray-900">Audit Log</h1>
        </div>
        <p className="text-[13px] text-gray-500 mt-1">ประวัติการทำงานและการเข้าใช้ระบบ</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 md:max-w-xs">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา action, target..."
            className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${
              catFilter === 'all'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
            onClick={() => setCatFilter('all')}
          >
            ทั้งหมด ({catCounts.all})
          </button>
          {(['workflow','user','security','system'] as AuditCategory[]).map(c => (
            <button
              key={c}
              className={`px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                catFilter === c
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
              onClick={() => setCatFilter(c)}
            >
              {CAT_INFO[c].label} ({catCounts[c]})
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-[14px]">ไม่พบรายการ</div>
        ) : (
          <div className="flex flex-col">
            {filtered.map(entry => {
              const actor = store.users.find(u => u.id === entry.actor)
              return (
                <div key={entry.id} className="grid grid-cols-[180px_200px_1fr] gap-6 px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 items-start">
                  {/* Time */}
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[13px] font-medium text-gray-900">{fmtDateTime(entry.time)}</div>
                    <div className="text-[11px] text-gray-400">{fmtRelative(entry.time)}</div>
                  </div>

                  {/* Actor */}
                  <div className="flex items-center gap-3">
                    <Avatar name={actor?.name ?? entry.actor} size="sm"/>
                    <div className="min-w-0 truncate">
                      <div className="text-[13px] font-medium text-gray-900 truncate">{actor?.name ?? entry.actor}</div>
                      <div className="text-[11px] text-gray-400 truncate">{actor?.email ?? entry.actor}</div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] border ${CAT_INFO[entry.cat]?.color === 'sky' ? 'bg-sky-50 text-sky-700 border-sky-200' : CAT_INFO[entry.cat]?.color === 'violet' ? 'bg-violet-50 text-violet-700 border-violet-200' : CAT_INFO[entry.cat]?.color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {CAT_INFO[entry.cat]?.label ?? entry.cat}
                      </span>
                      <span className="text-[13px] font-medium text-gray-900">{entry.action}</span>
                    </div>
                    {entry.target && (
                      <div className="text-[12px] text-gray-500 mt-1 font-mono">{entry.target}</div>
                    )}
                    {entry.detail && (
                      <div className="text-[12px] text-gray-500 mt-0.5">{entry.detail}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
