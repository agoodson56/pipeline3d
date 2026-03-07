import { useState, useMemo } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarView({ activities }) {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevDays = new Date(year, month, 0).getDate();
        const days = [];

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevDays - i, current: false, date: '' });
        }
        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ day: i, current: true, date: dateStr });
        }
        // Next month padding
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, current: false, date: '' });
        }
        return days;
    }, [month, year]);

    const getEventsForDate = (dateStr) => {
        if (!dateStr) return [];
        return activities.filter(a => a.dueDate === dateStr);
    };

    const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const typeColors = { call: '#10b981', email: '#3b82f6', meeting: '#8b5cf6', task: '#f59e0b' };

    return (
        <div>
            <div className="calendar-header">
                <h3>{MONTHS[month]} {year}</h3>
                <div className="calendar-nav">
                    <button className="btn btn-ghost btn-sm" onClick={prev}>← Prev</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}>Today</button>
                    <button className="btn btn-ghost btn-sm" onClick={next}>Next →</button>
                </div>
            </div>

            <div className="calendar-grid">
                {DAYS.map(d => <div className="calendar-day-header" key={d}>{d}</div>)}
                {calendarDays.map((d, i) => {
                    const events = getEventsForDate(d.date);
                    return (
                        <div key={i} className={`calendar-day ${!d.current ? 'other-month' : ''} ${d.date === todayStr ? 'today' : ''}`}>
                            <div className="calendar-day-num">{d.day}</div>
                            {events.slice(0, 3).map((ev, j) => (
                                <div key={j} className="calendar-event"
                                    style={{ background: (typeColors[ev.type] || '#6366f1') + '22', color: typeColors[ev.type] || '#6366f1' }}>
                                    {ev.title}
                                </div>
                            ))}
                            {events.length > 3 && (
                                <div style={{ fontSize: 10, color: '#64748b', paddingLeft: 4 }}>+{events.length - 3} more</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
