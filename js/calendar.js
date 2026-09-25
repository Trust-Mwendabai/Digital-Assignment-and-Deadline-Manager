/**
 * DeadlineDesk – Calendar page
 */

(function () {
  'use strict';

  const DD = DeadlineDesk;
  DD.initBase();

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();

  const titleEl = DD.$('#calendarTitle');
  const weekdaysEl = DD.$('#calendarWeekdays');
  const gridEl = DD.$('#calendarGrid');

  function renderWeekdays() {
    weekdaysEl.innerHTML = WEEKDAYS.map((d) =>
      `<div class="calendar-weekday">${d}</div>`
    ).join('');
  }

  function renderCalendar() {
    titleEl.textContent = `${MONTHS[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const today = new Date();

    const monthAssignments = DD.getAssignmentsByDate(currentYear, currentMonth);
    const prevMonthLast = new Date(currentYear, currentMonth, 0).getDate();

    let html = '';

    for (let i = startPad - 1; i >= 0; i--) {
      const day = prevMonthLast - i;
      html += `<div class="calendar-day calendar-day--other reveal"><span class="calendar-day__num">${day}</span></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = DD.isSameDay(date, today);
      const dayAssignments = monthAssignments.filter((a) =>
        DD.isSameDay(DD.parseDate(a.deadline), date)
      );

      const eventsHtml = dayAssignments.map((a) => {
        const level = a.completed ? 'completed' : DD.getRiskLevel(a);
        const subject = getSubjectById(a.subject);
        return `<div class="calendar-event calendar-event--${level}" title="${a.title} — ${DD.formatDateTime(a.deadline)}"><i data-lucide="${subject.icon}"></i> ${a.title}</div>`;
      }).join('');

      html += `
        <div class="calendar-day ${isToday ? 'calendar-day--today' : ''} reveal">
          <span class="calendar-day__num">${day}</span>
          <div class="calendar-day__events">${eventsHtml}</div>
        </div>
      `;
    }

    const totalCells = startPad + totalDays;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="calendar-day calendar-day--other reveal"><span class="calendar-day__num">${i}</span></div>`;
    }

    gridEl.innerHTML = html;
    DD.initScrollAnimations();
    DD.refreshIcons();
  }

  renderWeekdays();
  renderCalendar();

  DD.$('#prevMonth').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });

  DD.$('#nextMonth').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });

  DD.$('#todayBtn').addEventListener('click', () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    renderCalendar();
  });
})();
