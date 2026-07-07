import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Check, CalendarClock } from 'lucide-react'
import apiClient from '../../api/axiosClient.js'
import Modal from '../ui/Modal.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Same palette as Badge.jsx - kept as plain dot colors here since a full pill badge
// doesn't fit inside a calendar cell.
const DOT_COLOR = {
  PENDING: 'bg-parchment-faint',
  IN_PROGRESS: 'bg-brass',
  FILED: 'bg-ledger-teal',
  OVERDUE: 'bg-ledger-red'
}

// Parses a "YYYY-MM-DD" LocalDate string into plain integers, never through the JS Date
// constructor - `new Date('2026-07-11')` is parsed as UTC midnight, which can render as
// the previous day in any timezone behind UTC. Calendar dates aren't instants, so they
// should never touch timezone conversion at all.
function parseDateParts(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return { year, month, day }
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function firstWeekday(year, month) {
  return new Date(year, month - 1, 1).getDay()
}

export default function FilingsCalendar() {
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 })
  const [filings, setFilings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiClient.get('/filings/calendar', { params: { month: cursor.month, year: cursor.year } })
      .then(({ data }) => { if (mounted) setFilings(data) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [cursor.month, cursor.year])

  const filingsByDay = useMemo(() => {
    const map = {}
    for (const f of filings) {
      const { day } = parseDateParts(f.dueDate)
      if (!map[day]) map[day] = []
      map[day].push(f)
    }
    return map
  }, [filings])

  async function markFiled(filingId) {
    await apiClient.patch(`/filings/${filingId}/mark-filed`)
    const { data } = await apiClient.get('/filings/calendar', { params: { month: cursor.month, year: cursor.year } })
    setFilings(data)
  }

  function goToMonth(offset) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month - 1 + offset, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
  }

  function goToToday() {
    setCursor({ year: today.getFullYear(), month: today.getMonth() + 1 })
  }

  const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth() + 1
  const totalDays = daysInMonth(cursor.year, cursor.month)
  const leadingBlanks = firstWeekday(cursor.year, cursor.month)
  const monthLabel = new Date(cursor.year, cursor.month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1)
  const daysWithFilingsSorted = dayNumbers.filter((d) => filingsByDay[d]?.length > 0)

  return (
    <div className="card p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-parchment">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="rounded-md border border-ink-border px-3 py-1.5 font-sans text-xs text-parchment-muted hover:border-brass/50 hover:text-brass">
            Today
          </button>
          <button onClick={() => goToMonth(-1)} aria-label="Previous month" className="rounded-md p-1.5 text-parchment-faint hover:bg-ink-raised hover:text-parchment">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => goToMonth(1)} aria-label="Next month" className="rounded-md p-1.5 text-parchment-faint hover:bg-ink-raised hover:text-parchment">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-lg bg-ink-raised/50" />
      ) : (
        <>
          {/* Month grid - desktop/tablet */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-ink-border">
              {WEEKDAYS.map((w) => (
                <div key={w} className="bg-ink-surface px-2 py-2 text-center font-mono text-[11px] uppercase tracking-wider text-parchment-faint">
                  {w}
                </div>
              ))}

              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[92px] bg-ink-surface/40" />
              ))}

              {dayNumbers.map((day) => {
                const dayFilings = filingsByDay[day] || []
                const isToday = isCurrentMonth && day === today.getDate()
                const overflow = dayFilings.length > 3
                const visible = overflow ? dayFilings.slice(0, 2) : dayFilings

                return (
                  <button
                    key={day}
                    onClick={() => dayFilings.length > 0 && setSelectedDay(day)}
                    className={`min-h-[92px] bg-ink-surface p-2 text-left transition-colors ${
                      dayFilings.length > 0 ? 'hover:bg-ink-raised/60 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs ${
                        isToday ? 'bg-brass text-ink font-semibold' : 'text-parchment-muted'
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {visible.map((f) => (
                        <span key={f.filingId} className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[f.status] || DOT_COLOR.PENDING}`} />
                      ))}
                      {overflow && (
                        <span className="font-mono text-[10px] text-parchment-faint">+{dayFilings.length - 2} more</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Agenda list - mobile fallback, a 7-column grid doesn't have room to breathe below md */}
          <div className="md:hidden">
            {daysWithFilingsSorted.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing due this month"
                body="Filings due in this month will show up here."
              />
            ) : (
              <ul className="divide-y divide-ink-border">
                {daysWithFilingsSorted.map((day) => {
                  const dayFilings = filingsByDay[day]
                  const isToday = isCurrentMonth && day === today.getDate()
                  return (
                    <li key={day}>
                      <button onClick={() => setSelectedDay(day)} className="flex w-full items-center justify-between py-3 text-left">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm ${
                            isToday ? 'bg-brass text-ink font-semibold' : 'bg-ink-raised text-parchment-muted'
                          }`}>
                            {day}
                          </span>
                          <span className="font-sans text-sm text-parchment-muted">
                            {dayFilings.length} filing{dayFilings.length > 1 ? 's' : ''} due
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {dayFilings.slice(0, 3).map((f) => (
                            <span key={f.filingId} className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[f.status] || DOT_COLOR.PENDING}`} />
                          ))}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}

      <Modal
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? new Date(cursor.year, cursor.month - 1, selectedDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
      >
        <ul className="divide-y divide-ink-border">
          {(selectedDay ? filingsByDay[selectedDay] || [] : []).map((f) => (
            <li key={f.filingId} className="flex items-center justify-between py-3.5">
              <div>
                <p className="font-sans text-sm font-medium text-parchment">{f.clientName}</p>
                <p className="font-mono text-xs text-parchment-faint">{f.filingType} &middot; {f.periodLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${DOT_COLOR[f.status] || DOT_COLOR.PENDING}`} />
                <span className="font-mono text-xs text-parchment-muted">{f.status.replace('_', ' ')}</span>
                {f.status !== 'FILED' && (
                  <button
                    onClick={() => markFiled(f.filingId)}
                    className="ml-2 flex items-center gap-1.5 rounded-md border border-ink-border px-2.5 py-1 font-sans text-xs text-parchment-muted hover:border-ledger-teal/50 hover:text-ledger-teal"
                  >
                    <Check size={12} /> Mark filed
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}
