/**
 * DeadlineDesk – Assignments page (CRUD, filter, sort, search)
 */

(function () {
  'use strict';

  const DD = DeadlineDesk;
  DD.initBase();

  const listEl = DD.$('#assignmentsList');
  const modal = DD.$('#assignmentModal');
  const form = DD.$('#assignmentForm');
  const searchInput = DD.$('#searchInput');
  const filterSubject = DD.$('#filterSubject');
  const filterPriority = DD.$('#filterPriority');
  const filterStatus = DD.$('#filterStatus');
  const sortBy = DD.$('#sortBy');

  let editingId = null;

  function populateFilters() {
    SUBJECTS.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      filterSubject.appendChild(opt);
    });

    const subjectSelect = DD.$('#assignmentSubject');
    const prioritySelect = DD.$('#assignmentPriority');
    SUBJECTS.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      subjectSelect.appendChild(opt);
    });
    PRIORITIES.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      prioritySelect.appendChild(opt);
    });
  }

  function toLocalDatetime(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function getFilteredAssignments() {
    let items = DD.getAssignments();
    const query = searchInput.value.trim().toLowerCase();
    const subject = filterSubject.value;
    const priority = filterPriority.value;
    const status = filterStatus.value;
    const sort = sortBy.value;

    if (query) {
      items = items.filter((a) =>
        a.title.toLowerCase().includes(query) ||
        (a.description || '').toLowerCase().includes(query) ||
        getSubjectById(a.subject).name.toLowerCase().includes(query)
      );
    }
    if (subject !== 'all') items = items.filter((a) => a.subject === subject);
    if (priority !== 'all') items = items.filter((a) => a.priority === priority);
    if (status === 'pending') items = items.filter((a) => !a.completed);
    if (status === 'completed') items = items.filter((a) => a.completed);
    if (status === 'overdue') items = items.filter((a) => !a.completed && DD.getRiskLevel(a) === 'overdue');

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    items.sort((a, b) => {
      switch (sort) {
        case 'deadline-desc': return DD.parseDate(b.deadline) - DD.parseDate(a.deadline);
        case 'priority': return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'title': return a.title.localeCompare(b.title);
        case 'created': return DD.parseDate(b.createdAt) - DD.parseDate(a.createdAt);
        default: return DD.parseDate(a.deadline) - DD.parseDate(b.deadline);
      }
    });

    return items;
  }

  function renderAssignmentCard(a) {
    const risk = DD.getRiskLevel(a);
    const completedClass = a.completed ? 'completed' : '';
    const riskClass = a.completed ? 'completed' : risk;

    return `
      <article class="assignment-card assignment-card--${riskClass} ${completedClass} reveal" data-id="${a.id}">
        <div class="assignment-card__header">
          <div style="display:flex;align-items:flex-start;gap:0.75rem;flex:1;">
            <div class="checkbox-wrap">
              <button class="checkbox-custom ${a.completed ? 'checked' : ''}" data-action="toggle" aria-label="Toggle complete">
                ${a.completed ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
              </button>
            </div>
            <div>
              <h3 class="assignment-card__title">${escapeHtml(a.title)}</h3>
              <div class="assignment-card__meta">
                ${DD.renderSubjectTag(a.subject)}
                ${DD.renderPriorityTag(a.priority)}
                ${DD.renderRiskBadge(a)}
              </div>
            </div>
          </div>
        </div>
        ${a.description ? `<p class="assignment-card__desc">${escapeHtml(a.description)}</p>` : ''}
        <div class="assignment-card__footer">
          <div class="assignment-card__deadline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${DD.formatDateTime(a.deadline)}
            <span style="color:var(--text-muted)">· ${DD.formatRelativeDeadline(a.deadline)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            ${DD.renderCountdown(a)}
            <div class="assignment-card__actions">
              <button class="btn btn--ghost btn--sm" data-action="edit">Edit</button>
              <button class="btn btn--danger btn--sm" data-action="delete">Delete</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderRiskBanner() {
    const el = DD.$('#riskBanner');
    if (!el) return;
    const alerts = DD.getAlerts().filter((a) => {
      const level = DD.getRiskLevel(a);
      return level === 'overdue' || level === 'critical' || level === 'high';
    });
    if (!alerts.length) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.className = 'risk-banner reveal';
    el.innerHTML = `
      <div>
        <strong>Deadline risk:</strong>
        ${alerts.length} assignment${alerts.length > 1 ? 's' : ''} need attention (overdue or due soon).
      </div>
      <a href="dashboard.html" class="btn btn--sm btn--primary">View alerts</a>
    `;
  }

  function renderList() {
    renderRiskBanner();
    const items = getFilteredAssignments();

    if (items.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state reveal">
          <div class="empty-state__icon"><i data-lucide="inbox"></i></div>
          <h3>No assignments found</h3>
          <p>Try adjusting your filters or add a new assignment.</p>
          <button class="btn btn--primary" style="margin-top:1rem;" id="emptyAddBtn">+ Add Assignment</button>
        </div>
      `;
      DD.$('#emptyAddBtn')?.addEventListener('click', () => openModal());
      DD.refreshIcons();
      return;
    }

    listEl.innerHTML = items.map(renderAssignmentCard).join('');
    DD.initCountdowns();
    DD.initScrollAnimations();
    DD.refreshIcons();
  }

  function openModal(assignment = null) {
    console.log('openModal called', { assignment });
    editingId = assignment ? assignment.id : null;

    const modalTitle = DD.$('#modalTitle');
    const formSubmitBtn = DD.$('#formSubmitBtn');
    const assignmentId = DD.$('#assignmentId');
    const assignmentTitle = DD.$('#assignmentTitle');
    const assignmentSubject = DD.$('#assignmentSubject');
    const assignmentPriority = DD.$('#assignmentPriority');
    const assignmentDeadline = DD.$('#assignmentDeadline');
    const assignmentDescription = DD.$('#assignmentDescription');

    console.log('Form elements found:', {
      modalTitle: !!modalTitle,
      formSubmitBtn: !!formSubmitBtn,
      assignmentTitle: !!assignmentTitle,
      assignmentSubject: !!assignmentSubject,
      assignmentPriority: !!assignmentPriority,
      assignmentDeadline: !!assignmentDeadline,
      assignmentDescription: !!assignmentDescription,
      modal: !!modal
    });

    if (modalTitle) modalTitle.textContent = assignment ? 'Edit Assignment' : 'Add Assignment';
    if (formSubmitBtn) formSubmitBtn.textContent = assignment ? 'Update Assignment' : 'Save Assignment';
    if (assignmentId) assignmentId.value = assignment ? assignment.id : '';
    if (assignmentTitle) assignmentTitle.value = assignment ? assignment.title : '';
    if (assignmentSubject) assignmentSubject.value = assignment ? assignment.subject : SUBJECTS[0].id;
    if (assignmentPriority) assignmentPriority.value = assignment ? assignment.priority : 'medium';

    if (assignmentDeadline) {
      if (assignment) {
        assignmentDeadline.value = toLocalDatetime(assignment.deadline);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 0, 0);
        assignmentDeadline.value = toLocalDatetime(tomorrow.toISOString());
      }
    }

    if (assignmentDescription) assignmentDescription.value = assignment ? (assignment.description || '') : '';

    if (modal) {
      console.log('Adding open class to modal');
      modal.classList.add('open');
    } else {
      console.error('Modal element not found!');
    }

    if (assignmentTitle) {
      assignmentTitle.focus();
      console.log('Focus set to title input');
    }
  }

  function closeModal() {
    modal.classList.remove('open');
    form.reset();
    editingId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const data = {
      title: DD.$('#assignmentTitle').value,
      subject: DD.$('#assignmentSubject').value,
      priority: DD.$('#assignmentPriority').value,
      deadline: new Date(DD.$('#assignmentDeadline').value).toISOString(),
      description: DD.$('#assignmentDescription').value
    };

    if (editingId) {
      DD.updateAssignment(editingId, data);
      DD.showToast('Assignment updated successfully!', 'success');
    } else {
      DD.addAssignment(data);
      DD.showToast('Assignment added successfully!', 'success');
    }

    closeModal();
    renderList();
  }

  function handleListClick(e) {
    const card = e.target.closest('.assignment-card');
    if (!card) return;
    const id = card.dataset.id;
    const action = e.target.closest('[data-action]')?.dataset.action;

    if (action === 'toggle') {
      DD.toggleComplete(id);
      renderList();
      const a = DD.getAssignmentById(id);
      DD.showToast(a.completed ? 'Marked as complete!' : 'Marked as pending.', 'success');
    } else if (action === 'edit') {
      openModal(DD.getAssignmentById(id));
    } else if (action === 'delete') {
      if (confirm('Delete this assignment? This cannot be undone.')) {
        DD.deleteAssignment(id);
        DD.showToast('Assignment deleted.', 'warning');
        renderList();
      }
    }
  }

  populateFilters();
  renderList();

  form.addEventListener('submit', handleFormSubmit);
  listEl.addEventListener('click', handleListClick);
  searchInput.addEventListener('input', renderList);
  filterSubject.addEventListener('change', renderList);
  filterPriority.addEventListener('change', renderList);
  filterStatus.addEventListener('change', renderList);
  sortBy.addEventListener('change', renderList);

  const btn1 = DD.$('#addAssignmentBtn');
  const btn2 = DD.$('#addAssignmentBtn2');
  const closeBtn = DD.$('#modalClose');
  const cancelBtn = DD.$('#formCancelBtn');

  if (btn1) btn1.addEventListener('click', () => {
    console.log('Button 1 clicked, opening modal');
    openModal();
  });
  if (btn2) btn2.addEventListener('click', () => {
    console.log('Button 2 clicked, opening modal');
    openModal();
  });
  if (closeBtn) closeBtn.addEventListener('click', () => {
    console.log('Close button clicked');
    closeModal();
  });
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    console.log('Cancel button clicked');
    closeModal();
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('Modal overlay clicked');
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      console.log('Escape key pressed, closing modal');
      closeModal();
    }
  });
})();
