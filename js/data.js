/**
 * DeadlineDesk – Default subjects & sample data
 */

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', color: '#3b82f6', icon: 'ruler' },
  { id: 'cs', name: 'Computer Science', color: '#6366f1', icon: 'laptop' },
  { id: 'english', name: 'English', color: '#8b5cf6', icon: 'book-open' },
  { id: 'physics', name: 'Physics', color: '#0ea5e9', icon: 'atom' },
  { id: 'chemistry', name: 'Chemistry', color: '#14b8a6', icon: 'flask-conical' },
  { id: 'history', name: 'History', color: '#f59e0b', icon: 'landmark' },
  { id: 'biology', name: 'Biology', color: '#10b981', icon: 'dna' },
  { id: 'economics', name: 'Economics', color: '#64748b', icon: 'line-chart' }
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#64748b' },
  { id: 'medium', label: 'Medium', color: '#3b82f6' },
  { id: 'high', label: 'High', color: '#ef4444' }
];

const RISK_LEVELS = {
  overdue: { label: 'Overdue', color: '#991b1b', bg: 'rgba(153,27,27,0.12)' },
  critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
  high: { label: 'High Risk', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  medium: { label: 'Medium', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  low: { label: 'Low Risk', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  completed: { label: 'Completed', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' }
};

function getSampleAssignments() {
  const now = new Date();
  const addDays = (days, hours = 12) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hours, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'sample-1',
      title: 'Calculus Problem Set 4',
      subject: 'math',
      priority: 'high',
      deadline: addDays(1, 23),
      completed: false,
      description: 'Complete exercises 1–20 from Chapter 7.',
      createdAt: now.toISOString()
    },
    {
      id: 'sample-2',
      title: 'Web Development Project',
      subject: 'cs',
      priority: 'high',
      deadline: addDays(2, 17),
      completed: false,
      description: 'Build a responsive portfolio site using HTML, CSS, and JavaScript.',
      createdAt: now.toISOString()
    },
    {
      id: 'sample-3',
      title: 'Essay: Modern Literature',
      subject: 'english',
      priority: 'medium',
      deadline: addDays(5, 14),
      completed: false,
      description: '1500-word essay on post-war literary themes.',
      createdAt: now.toISOString()
    },
    {
      id: 'sample-4',
      title: 'Lab Report – Optics',
      subject: 'physics',
      priority: 'medium',
      deadline: addDays(8, 10),
      completed: false,
      description: 'Document experiment results and analysis.',
      createdAt: now.toISOString()
    },
    {
      id: 'sample-5',
      title: 'Organic Chemistry Quiz Prep',
      subject: 'chemistry',
      priority: 'low',
      deadline: addDays(12, 9),
      completed: false,
      description: 'Review chapters 4–6 for upcoming quiz.',
      createdAt: now.toISOString()
    },
    {
      id: 'sample-6',
      title: 'Research Paper Draft',
      subject: 'history',
      priority: 'medium',
      deadline: addDays(-1, 23),
      completed: false,
      description: 'First draft on the Industrial Revolution.',
      createdAt: now.toISOString()
    }
  ];
}

function getSubjectById(id) {
  return SUBJECTS.find((s) => s.id === id) || { id, name: id, color: '#6366f1', icon: 'clipboard-list' };
}

function getPriorityById(id) {
  return PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];
}
