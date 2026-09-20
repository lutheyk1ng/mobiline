/* MobiLine - utils.js
   Funções auxiliares compartilhadas por todas as páginas. */

const MobiUtils = (() => {

  function formatCurrency(value) {
    const n = Number(value) || 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = parseDate(dateStr);
    if (!d) return '—';
    return d.toLocaleDateString('pt-BR');
  }

  function formatDateTime(dateStr, timeStr) {
    return `${formatDate(dateStr)}${timeStr ? ' às ' + timeStr : ''}`;
  }

  // Aceita 'YYYY-MM-DD' e retorna Date local (evita bug de fuso horário)
  function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d);
  }

  function todayISO() {
    const d = new Date();
    return toISO(d);
  }

  function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function daysDiffFromToday(dateStr) {
    const target = parseDate(dateStr);
    if (!target) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffMs = target - today;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  // Retorna texto amigável tipo "Entrega em 8 dias" / "Atrasado há 3 dias" / "Entrega hoje"
  function deadlineLabel(dateStr) {
    const diff = daysDiffFromToday(dateStr);
    if (diff === null) return { text: 'Sem data', tone: 'muted' };
    if (diff === 0) return { text: 'Entrega hoje', tone: 'warning' };
    if (diff > 0) return { text: `Entrega em ${diff} dia${diff > 1 ? 's' : ''}`, tone: diff <= 3 ? 'warning' : 'muted' };
    const atraso = Math.abs(diff);
    return { text: `Atrasado há ${atraso} dia${atraso > 1 ? 's' : ''}`, tone: 'danger' };
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function nextSequence(list, field = 'codigo', start = 1000) {
    const max = list.reduce((acc, item) => {
      const n = parseInt(String(item[field] || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? acc : Math.max(acc, n);
    }, start);
    return max + 1;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function statusBadgeClass(status) {
    const map = {
      'Em produção': 'badge-info',
      'Em andamento': 'badge-info',
      'Reservado': 'badge-purple',
      'Agendado': 'badge-purple',
      'Concluído': 'badge-success',
      'Atrasado': 'badge-danger',
      'Pago': 'badge-success',
      'Pendente': 'badge-warning',
      'Expirado': 'badge-danger',
      'Vencido': 'badge-danger',
      'Rascunho': 'badge-muted',
      'Enviado': 'badge-info',
      'Aprovado': 'badge-success',
      'Recusado': 'badge-danger',
      'Disponível': 'badge-success',
      'Estoque baixo': 'badge-warning',
      'Sem estoque': 'badge-danger',
    };
    return map[status] || 'badge-muted';
  }

  function toast(message, type = 'success') {
    let holder = document.getElementById('toastHolder');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'toastHolder';
      holder.className = 'toast-holder';
      document.body.appendChild(holder);
    }
    const el = document.createElement('div');
    el.className = `mobi-toast mobi-toast-${type}`;
    const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
    el.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
    holder.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  function confirmAction(message) {
    return window.confirm(message);
  }

  return {
    formatCurrency, formatDate, formatDateTime, parseDate, todayISO, toISO,
    daysDiffFromToday, deadlineLabel, uid, nextSequence, escapeHtml, initials,
    debounce, statusBadgeClass, toast, confirmAction,
  };
})();
