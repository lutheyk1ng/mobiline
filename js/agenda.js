/* MobiLine - agenda.js */
(function () {
  const session = MobiLayout.initPage({ page: 'agenda', title: 'Agenda', crumb: 'MobiLine / Agenda' });
  if (!session) return;

  const hoje = new Date(2026, 8, 17);
  let viewDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  let selectedDate = MobiUtils.toISO(hoje);
  let editingId = null;

  const TIPO_COLORS = { 'Entrega': '#3768A3', 'Instalação': '#2F8A57', 'Medição': '#C0791E', 'Reunião': '#7A5CA8', 'Visita': '#C4443A' };
  const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  document.getElementById('calDow').innerHTML = DOW.map(d => `<div class="cal-dow">${d}</div>`).join('');

  function eventsByDate() {
    const eventos = MobiDB.getAll('eventos');
    const map = {};
    eventos.forEach(ev => { (map[ev.data] = map[ev.data] || []).push(ev); });
    return map;
  }

  function renderCalendar() {
    document.getElementById('calTitle').textContent = `${MESES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - startOffset);
    const map = eventsByDate();

    let html = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const iso = MobiUtils.toISO(d);
      const isOtherMonth = d.getMonth() !== viewDate.getMonth();
      const isToday = iso === MobiUtils.toISO(hoje);
      const dayEvents = map[iso] || [];
      html += `
        <div class="cal-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-day="${iso}">
          <div class="day-num">${d.getDate()}</div>
          <div class="day-dots">${dayEvents.slice(0, 5).map(ev => `<span style="background:${TIPO_COLORS[ev.tipo] || '#999'}"></span>`).join('')}</div>
        </div>`;
    }
    document.getElementById('calGrid').innerHTML = html;
    document.querySelectorAll('[data-day]').forEach(el => el.addEventListener('click', () => { selectedDate = el.dataset.day; renderList(); }));
  }

  function renderList() {
    const d = MobiUtils.parseDate(selectedDate);
    document.getElementById('agendaListTitle').textContent = d ? `Eventos — ${MobiUtils.formatDate(selectedDate)}` : 'Eventos do dia';
    const eventos = MobiDB.getAll('eventos').filter(ev => ev.data === selectedDate).sort((a, b) => a.horario.localeCompare(b.horario));

    document.getElementById('agendaList').innerHTML = eventos.map(ev => {
      const cliente = MobiDB.findById('clientes', ev.clienteId);
      const proj = MobiDB.findById('projetos', ev.projetoId);
      return `
        <div class="notif-item" style="padding:12px 20px;">
          <span class="dot-icon" style="background:${TIPO_COLORS[ev.tipo] || '#999'}"></span>
          <div style="flex:1;">
            <div class="notif-text" style="font-weight:600;">${MobiUtils.escapeHtml(ev.titulo)}</div>
            <div class="notif-time">${ev.horario} · ${MobiUtils.escapeHtml(ev.tipo)}${cliente ? ' · ' + MobiUtils.escapeHtml(cliente.nome) : ''}${proj ? ' · ' + MobiUtils.escapeHtml(proj.nome) : ''}</div>
            ${ev.observacao ? `<div class="notif-time" style="margin-top:3px;">${MobiUtils.escapeHtml(ev.observacao)}</div>` : ''}
          </div>
          <div class="action-menu-wrap">
            <button class="action-dots" data-act-toggle="${ev.id}"><i class="bi bi-three-dots-vertical"></i></button>
            <div class="action-dropdown" data-act-menu="${ev.id}">
              <button data-edit="${ev.id}"><i class="bi bi-pencil"></i> Editar</button>
              <button class="danger" data-del="${ev.id}"><i class="bi bi-trash"></i> Excluir</button>
            </div>
          </div>
        </div>`;
    }).join('') || `<div class="empty-state"><i class="bi bi-calendar-x"></i>Nenhum evento neste dia.</div>`;

    document.querySelectorAll('[data-act-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.actToggle;
        document.querySelectorAll('.action-dropdown').forEach(d2 => { if (d2.dataset.actMenu !== id) d2.classList.remove('open'); });
        document.querySelector(`[data-act-menu="${id}"]`).classList.toggle('open');
      });
    });
    document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEdit(btn.dataset.edit)));
    document.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => handleDelete(btn.dataset.del)));
  }
  document.addEventListener('click', () => document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open')));

  document.getElementById('calPrev').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() - 1); renderCalendar(); });
  document.getElementById('calNext').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() + 1); renderCalendar(); });
  document.getElementById('calToday').addEventListener('click', () => { viewDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1); selectedDate = MobiUtils.toISO(hoje); renderCalendar(); renderList(); });

  /* ---------- Modal ---------- */
  const modal = document.getElementById('modalEvento');
  const form = document.getElementById('formEvento');

  function populateSelects() {
    const clientes = MobiDB.getAll('clientes').sort((a, b) => a.nome.localeCompare(b.nome));
    const projetos = MobiDB.getAll('projetos');
    document.getElementById('fCliente').innerHTML = '<option value="">— Nenhum —</option>' + clientes.map(c => `<option value="${c.id}">${MobiUtils.escapeHtml(c.nome)}</option>`).join('');
    document.getElementById('fProjeto').innerHTML = '<option value="">— Nenhum —</option>' + projetos.map(p => `<option value="${p.id}">${MobiUtils.escapeHtml(p.nome)}</option>`).join('');
  }

  function openModal() { populateSelects(); modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); form.reset(); editingId = null; }
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('btnNovoEvento').addEventListener('click', () => {
    editingId = null;
    document.getElementById('modalEventoTitle').textContent = 'Novo evento';
    form.reset();
    openModal();
    document.getElementById('fData').value = selectedDate;
  });

  function openEdit(id) {
    const ev = MobiDB.findById('eventos', id);
    if (!ev) return;
    editingId = id;
    document.getElementById('modalEventoTitle').textContent = 'Editar evento';
    openModal();
    document.getElementById('fTitulo').value = ev.titulo || '';
    document.getElementById('fCliente').value = ev.clienteId || '';
    document.getElementById('fProjeto').value = ev.projetoId || '';
    document.getElementById('fData').value = ev.data || '';
    document.getElementById('fHorario').value = ev.horario || '';
    document.getElementById('fTipo').value = ev.tipo || 'Entrega';
    document.getElementById('fObservacao').value = ev.observacao || '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      titulo: document.getElementById('fTitulo').value.trim(),
      clienteId: document.getElementById('fCliente').value || null,
      projetoId: document.getElementById('fProjeto').value || null,
      data: document.getElementById('fData').value,
      horario: document.getElementById('fHorario').value,
      tipo: document.getElementById('fTipo').value,
      observacao: document.getElementById('fObservacao').value.trim(),
    };
    if (editingId) {
      MobiDB.update('eventos', editingId, payload);
      MobiUtils.toast('Evento atualizado com sucesso.', 'success');
    } else {
      MobiDB.insert('eventos', { id: MobiUtils.uid('evt'), ...payload });
      MobiUtils.toast('Evento cadastrado com sucesso.', 'success');
    }
    selectedDate = payload.data;
    closeModal();
    renderCalendar();
    renderList();
  });

  function handleDelete(id) {
    if (MobiUtils.confirmAction('Excluir este evento?')) {
      MobiDB.remove('eventos', id);
      MobiUtils.toast('Evento excluído.', 'danger');
      renderCalendar();
      renderList();
    }
  }

  renderCalendar();
  renderList();
})();
