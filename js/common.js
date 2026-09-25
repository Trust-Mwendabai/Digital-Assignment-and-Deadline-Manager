/**
 * DeadlineDesk – Shared utilities & UI components
 */

const DeadlineDesk = (function () {
  'use strict';

  const STORAGE_KEY = 'deadlineDesk_data';

  const defaultState = {
    theme: 'light',
    assignments: [],
    initialized: false
  };

  let state = loadState();
  let toastTimer;
  let countdownInterval;

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed };
      }
      return { ...defaultState };
    } catch {
      return { ...defaultState };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getState() { return state; }

  function setState(updates) {
    state = { ...state, ...updates };
    saveState();
  }

  function resetState() {
    state = { ...defaultState, assignments: getSampleAssignments(), initialized: true };
    saveState();
  }

  function ensureInitialized() {
    if (!state.initialized) {
      state.assignments = getSampleAssignments();
      state.initialized = true;
      saveState();
    }
  }

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

  /* ─── Date Utilities ─── */

  function parseDate(iso) {
    return new Date(iso);
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function isSameDay(a, b) {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
  }

  function formatDate(iso, options = {}) {
    const d = parseDate(iso);
    const defaults = { month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString(undefined, { ...defaults, ...options });
  }

  function formatDateTime(iso) {
    const d = parseDate(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  }

  function getTimeRemaining(iso) {
    return parseDate(iso).getTime() - Date.now();
  }

  function formatCountdown(ms) {
    if (ms <= 0) return 'Overdue';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (day > 0) return `${day}d ${hr % 24}h`;
    if (hr > 0) return `${hr}h ${min % 60}m`;
    if (min > 0) return `${min}m ${sec % 60}s`;
    return `${sec}s`;
  }

  function formatRelativeDeadline(iso) {
    const ms = getTimeRemaining(iso);
    if (ms <= 0) {
      const overdue = Math.abs(ms);
      const days = Math.floor(overdue / 86400000);
      if (days > 0) return `${days} day${days !== 1 ? 's' : ''} overdue`;
      const hrs = Math.floor(overdue / 3600000);
      if (hrs > 0) return `${hrs} hour${hrs !== 1 ? 's' : ''} overdue`;
      return 'Overdue';
    }
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
    const hrs = Math.floor(ms / 3600000);
    if (hrs > 0) return `${hrs} hour${hrs !== 1 ? 's' : ''} left`;
    const mins = Math.floor(ms / 60000);
    return `${mins} minute${mins !== 1 ? 's' : ''} left`;
  }

  /* ─── Risk Level ─── */

  function getRiskLevel(assignment) {
    if (assignment.completed) return 'completed';
    const ms = getTimeRemaining(assignment.deadline);
    if (ms <= 0) return 'overdue';
    const hours = ms / 3600000;
    if (hours < 24) return 'critical';
    if (hours < 72) return 'high';
    if (hours < 168) return 'medium';
    return 'low';
  }

  function getRiskInfo(assignment) {
    const level = getRiskLevel(assignment);
    return RISK_LEVELS[level];
  }

  /* ─── Assignment CRUD ─── */

  function getAssignments() {
    ensureInitialized();
    return [...state.assignments];
  }

  function getAssignmentById(id) {
    return state.assignments.find((a) => a.id === id);
  }

  function addAssignment(data) {
    ensureInitialized();
    const assignment = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: data.title.trim(),
      subject: data.subject,
      priority: data.priority,
      deadline: data.deadline,
      completed: false,
      description: (data.description || '').trim(),
      createdAt: new Date().toISOString()
    };
    state.assignments.push(assignment);
    saveState();
    return assignment;
  }

  function updateAssignment(id, updates) {
    const idx = state.assignments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    state.assignments[idx] = { ...state.assignments[idx], ...updates };
    saveState();
    return state.assignments[idx];
  }

  function deleteAssignment(id) {
    const idx = state.assignments.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    state.assignments.splice(idx, 1);
    saveState();
    return true;
  }

  function toggleComplete(id) {
    const a = getAssignmentById(id);
    if (!a) return null;
    return updateAssignment(id, { completed: !a.completed });
  }

  /* ─── Statistics ─── */

  function getStats() {
    const all = getAssignments();
    const total = all.length;
    const completed = all.filter((a) => a.completed).length;
    const pending = total - completed;
    const overdue = all.filter((a) => !a.completed && getRiskLevel(a) === 'overdue').length;
    const critical = all.filter((a) => !a.completed && getRiskLevel(a) === 'critical').length;
    const high = all.filter((a) => !a.completed && getRiskLevel(a) === 'high').length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    const bySubject = {};
    SUBJECTS.forEach((s) => {
      const subjectAssignments = all.filter((a) => a.subject === s.id);
      const subjectCompleted = subjectAssignments.filter((a) => a.completed).length;
      bySubject[s.id] = {
        total: subjectAssignments.length,
        completed: subjectCompleted,
        percent: subjectAssignments.length
          ? Math.round((subjectCompleted / subjectAssignments.length) * 100)
          : 0
      };
    });

    return { total, completed, pending, overdue, critical, high, completionRate, bySubject };
  }

  function getUpcoming(limit = 5) {
    return getAssignments()
      .filter((a) => !a.completed)
      .sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline))
      .slice(0, limit);
  }

  function getAlerts() {
    return getAssignments()
      .filter((a) => {
        if (a.completed) return false;
        const level = getRiskLevel(a);
        return level === 'overdue' || level === 'critical' || level === 'high';
      })
      .sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline));
  }

  function getAssignmentsByDate(year, month) {
    return getAssignments().filter((a) => {
      const d = parseDate(a.deadline);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  /* ─── UI Helpers ─── */

  function refreshIcons() {
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  function showToast(message, type = 'default') {
    let toast = $('#toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.className = `toast toast--${type}`;
    toast.hidden = false;
    refreshIcons();
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.hidden = true; }, 300);
    }, 3200);
  }

  function showNotificationAlert(message, type = 'warning') {
    showToast(message, type);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    saveState();
  }

  function initTheme() {
    applyTheme(state.theme);
    const toggle = $('#themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        applyTheme(state.theme === 'light' ? 'dark' : 'light');
      });
    }
  }

  function initNavigation() {
    const navToggle = $('#navToggle');
    const navMenu = $('#navMenu');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        navToggle.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen);
      });

      $$('.nav__link', navMenu).forEach((link) => {
        link.addEventListener('click', () => {
          navMenu.classList.remove('open');
          navToggle.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    const currentPage = document.body.dataset.page;
    if (currentPage) {
      $$(`.nav__link[data-page="${currentPage}"]`).forEach((link) => {
        link.classList.add('active');
      });
    }
  }

  function initScrollAnimations() {
    const animated = $$('.reveal, .feature-card, .assignment-card, .stat-card, .alert-card, .calendar-day');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    animated.forEach((el) => observer.observe(el));
  }

  function renderRiskBadge(assignment) {
    const info = getRiskInfo(assignment);
    const level = getRiskLevel(assignment);
    return `<span class="risk-badge risk-badge--${level}" style="--risk-color:${info.color};--risk-bg:${info.bg}">${info.label}</span>`;
  }

  function renderCountdown(assignment, className = 'countdown') {
    if (assignment.completed) {
      return `<span class="${className} ${className}--done">Completed</span>`;
    }
    const level = getRiskLevel(assignment);
    return `<span class="${className} ${className}--${level}" data-deadline="${assignment.deadline}">${formatCountdown(getTimeRemaining(assignment.deadline))}</span>`;
  }

  function renderSubjectTag(subjectId) {
    const subject = getSubjectById(subjectId);
    return `<span class="subject-tag" style="--subject-color:${subject.color}"><i data-lucide="${subject.icon}"></i> ${subject.name}</span>`;
  }

  function renderPriorityTag(priorityId) {
    const priority = getPriorityById(priorityId);
    return `<span class="priority-tag priority-tag--${priorityId}" style="--priority-color:${priority.color}">${priority.label}</span>`;
  }

  function initCountdowns() {
    clearInterval(countdownInterval);
    const update = () => {
      $$('[data-deadline]').forEach((el) => {
        const ms = getTimeRemaining(el.dataset.deadline);
        el.textContent = formatCountdown(ms);
        const level = ms <= 0 ? 'overdue' : ms < 86400000 ? 'critical' : ms < 259200000 ? 'high' : ms < 604800000 ? 'medium' : 'low';
        el.className = el.className.replace(/countdown--\w+/g, '').trim();
        el.classList.add(`countdown--${level}`);
      });
    };
    update();
    countdownInterval = setInterval(update, 1000);
  }

  function checkDeadlineAlerts() {
    const alerts = getAlerts();
    if (alerts.length === 0) return;
    const critical = alerts.filter((a) => getRiskLevel(a) === 'critical' || getRiskLevel(a) === 'overdue');
    if (critical.length > 0 && !sessionStorage.getItem('dd_alert_shown')) {
      sessionStorage.setItem('dd_alert_shown', '1');
      showNotificationAlert(
        `<i data-lucide="alert-triangle"></i> ${critical.length} assignment${critical.length > 1 ? 's' : ''} need immediate attention!`,
        'danger'
      );
    }
  }

  function initBackToTop() {
    if ($('#backToTop')) return;
    const btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.textContent = '↑';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 450);
    }, { passive: true });
  }

  function initBase() {
    ensureInitialized();
    initTheme();
    initNavigation();
    initScrollAnimations();
    initCountdowns();
    checkDeadlineAlerts();
    initBackToTop();
    refreshIcons();
  }

  return {
    getState,
    setState,
    resetState,
    saveState,
    $,
    $$,
    parseDate,
    formatDate,
    formatDateTime,
    getTimeRemaining,
    formatCountdown,
    formatRelativeDeadline,
    getRiskLevel,
    getRiskInfo,
    getAssignments,
    getAssignmentById,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    toggleComplete,
    getStats,
    getUpcoming,
    getAlerts,
    getAssignmentsByDate,
    showToast,
    showNotificationAlert,
    refreshIcons,
    applyTheme,
    renderRiskBadge,
    renderCountdown,
    renderSubjectTag,
    renderPriorityTag,
    initCountdowns,
    initBase,
    isSameDay,
    startOfDay
  };
})();
