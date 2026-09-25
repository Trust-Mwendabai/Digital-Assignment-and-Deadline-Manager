/**
 * DeadlineDesk – Home page
 */

(function () {
  'use strict';

  DeadlineDesk.initBase();

  const stats = DeadlineDesk.getStats();

  function animateCounter(el, target, suffix = '') {
    if (!el) return;
    const duration = 1200;
    const start = performance.now();
    const from = 0;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  animateCounter(document.getElementById('statTotal'), stats.total);
  animateCounter(document.getElementById('statPending'), stats.pending);
  animateCounter(document.getElementById('statRate'), stats.completionRate, '%');

  const grid = document.getElementById('homeStatsGrid');
  if (grid) {
    grid.innerHTML = `
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
      <article class="stat-card stat-card--danger reveal">
        <div class="stat-card__icon"><i data-lucide="zap"></i></div>
        <div class="stat-card__value">${stats.critical}</div>
        <div class="stat-card__label">Critical (&lt;24h)</div>
      </article>
      <article class="stat-card stat-card--warning reveal">
        <div class="stat-card__icon"><i data-lucide="trending-up"></i></div>
        <div class="stat-card__value">${stats.completionRate}%</div>
        <div class="stat-card__label">Completion Rate</div>
      </article>
    `;

    DeadlineDesk.initScrollAnimations();
    DeadlineDesk.refreshIcons();
  }
})();
