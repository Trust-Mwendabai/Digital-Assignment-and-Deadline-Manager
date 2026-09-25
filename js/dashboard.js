/**
 * DeadlineDesk – Dashboard page
 */

(function () {
  'use strict';

  const DD = DeadlineDesk;
  DD.initBase();

  const stats = DD.getStats();

  function renderStats() {
    const el = DD.$('#dashboardStats');
    el.innerHTML = `
      <article class="stat-card stat-card--primary reveal">
        <div class="stat-card__icon"><i data-lucide="clipboard-list"></i></div>
        <div class="stat-card__value">${stats.total}</div>
        <div class="stat-card__label">Total Assignments</div>
      </article>
      <article class="stat-card stat-card--success reveal">
        <div class="stat-card__icon"><i data-lucide="check-circle"></i></div>
        <div class="stat-card__value">${stats.completed}</div>
        <div class="stat-card__label">Completed</div>
      </article>
      <article class="stat-card stat-card--warning reveal">
        <div class="stat-card__icon"><i data-lucide="hourglass"></i></div>
        <div class="stat-card__value">${stats.pending}</div>
        <div class="stat-card__label">Pending</div>
      </article>
      <article class="stat-card stat-card--danger reveal">
        <div class="stat-card__icon"><i data-lucide="siren"></i></div>
        <div class="stat-card__value">${stats.overdue}</div>
        <div class="stat-card__label">Overdue</div>
      </article>
    `;
    DD.refreshIcons();
  }

  function renderSubjectProgress() {
    const el = DD.$('#subjectProgress');
    const subjectsWithTasks = SUBJECTS.filter((s) => stats.bySubject[s.id].total > 0);

    if (subjectsWithTasks.length === 0) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">No assignments yet. Add some to track progress.</p>';
      return;
    }

    el.innerHTML = subjectsWithTasks.map((s) => {
      const data = stats.bySubject[s.id];
      const fillClass = data.percent === 100 ? 'progress-bar__fill--success' :
        data.percent < 50 ? 'progress-bar__fill--warning' : 'progress-bar__fill';
      return `
        <div class="progress-item">
          <div class="progress-item__header">
            <span class="progress-item__label"><i data-lucide="${s.icon}"></i> ${s.name} <small style="color:var(--text-muted);font-weight:500;">(${data.completed}/${data.total})</small></span>
            <span class="progress-item__percent">${data.percent}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar__fill ${fillClass}" style="width:${data.percent}%"></div>
          </div>
        </div>
      `;
    }).join('');
    DD.refreshIcons();
  }

  function renderCompletionRing() {
    const el = DD.$('#completionRing');
    const percent = stats.completionRate;
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (percent / 100) * circumference;

    el.innerHTML = `
      <div class="completion-ring">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="60" fill="none" stroke="var(--bg-subtle)" stroke-width="12"/>
          <circle cx="80" cy="80" r="60" fill="none" stroke="url(#ringGradient)" stroke-width="12"
            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
            style="transition:stroke-dashoffset 1s ease"/>
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#6366f1"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="completion-ring__text">
          <span class="completion-ring__percent">${percent}%</span>
          <span class="completion-ring__label">Complete</span>
        </div>
      </div>
    `;
  }

  function renderUpcoming() {
    const el = DD.$('#upcomingList');
    const upcoming = DD.getUpcoming(8);

    if (upcoming.length === 0) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:1rem 0;">No upcoming deadlines. You\'re all caught up!</p>';
      return;
    }

    el.innerHTML = upcoming.map((a) => {
      const subject = getSubjectById(a.subject);
      return `
      <div class="upcoming-item">
        <div class="upcoming-item__info">
          <div class="upcoming-item__title">${a.title}</div>
          <div class="upcoming-item__date">${DD.formatDateTime(a.deadline)} · <i data-lucide="${subject.icon}"></i> ${subject.name}</div>
        </div>
        ${DD.renderCountdown(a)}
      </div>
    `;
    }).join('');

    DD.initCountdowns();
    DD.refreshIcons();
  }

  function renderAlerts() {
    const el = DD.$('#alertsList');
    const alerts = DD.getAlerts();

    if (alerts.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:1.5rem 0;color:var(--text-muted);">
          <div style="font-size:2rem;margin-bottom:0.5rem;"><i data-lucide="party-popper"></i></div>
          <p style="font-size:0.9rem;font-weight:600;">No urgent alerts</p>
          <p style="font-size:0.82rem;">All deadlines are under control.</p>
        </div>
      `;
      DD.refreshIcons();
      return;
    }

    el.innerHTML = alerts.map((a) => {
      const level = DD.getRiskLevel(a);
      const info = DD.getRiskInfo(a);
      const icons = { overdue: 'circle-alert', critical: 'zap', high: 'alert-triangle' };
      return `
        <div class="alert-card alert-card--${level} reveal">
          <span class="alert-card__icon"><i data-lucide="${icons[level] || 'alert-triangle'}"></i></span>
          <div class="alert-card__content">
            <div class="alert-card__title">${a.title}</div>
            <div class="alert-card__meta">
              ${DD.formatRelativeDeadline(a.deadline)} · ${getSubjectById(a.subject).name}
              · ${info.label}
            </div>
          </div>
        </div>
      `;
    }).join('');
    DD.refreshIcons();
  }

  renderStats();
  renderSubjectProgress();
  renderCompletionRing();
  renderUpcoming();
  renderAlerts();
  DD.initScrollAnimations();
})();
