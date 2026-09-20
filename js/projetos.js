/* MobiLine - projetos.js */
(function () {
  const session = MobiLayout.initPage({ page: 'projetos', title: 'Projetos', crumb: 'MobiLine / Projetos' });
  if (!session) return;

  let searchTerm = '';
  let statusFilter = '';
  let editingId = null;

  const body = document.getElementById('projetosBody');
  const countLabel = document.getElementById('countLabel');

  function populateClienteSelect() {
    const select = document.getElementById('fCliente');
    const clientes = MobiDB.getAll('clientes').sort((a, b) => a.nome.localeCompare(b.nome));
    select.innerHTML = clientes.map(c => `<option value="${c.id}">${MobiUtils.escapeHtml(c.nome)}</option>`).join('');
  }

  function render() {
    let projetos = MobiDB.getAll('projetos');

    if (statusFilter) projetos = projetos.filter(p => p.status === statusFilter);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      projetos = projetos.filter(p => {
        const cliente = MobiDB.findById('clientes', p.clienteId);
        return p.nome.toLowerCase().includes(t) || (cliente && cliente.nome.toLowerCase().includes(t));
      });
    }
    projetos = [...projetos].sort((a, b) => (a.dataEntrega || '').localeCompare(b.dataEntrega || ''));

    countLabel.textContent = `${projetos.length} projeto${projetos.length !== 1 ? 's' : ''}`;

    body.innerHTML = projetos.map(p => {
      const cliente = MobiDB.findById('clientes', p.clienteId);
      const deadline = MobiUtils.deadlineLabel(p.dataEntrega);
      const toneColor = deadline.tone === 'danger' ? 'var(--danger)' : deadline.tone === 'warning' ? 'var(--warning)' : 'var(--text-muted)';
      return `
        <tr>
          <td><div class="row-with-thumb"><div class="row-thumb"><i class="bi bi-box-seam"></i></div><span class="cell-primary">${MobiUtils.escapeHtml(p.nome)}</span></div></td>
          <td>${cliente ? MobiUtils.escapeHtml(cliente.nome) : '<span class="cell-muted">—</span>'}</td>
          <td class="cell-muted">${MobiUtils.escapeHtml(p.responsavel) || '—'}</td>
          <td><span class="badge-pill ${MobiUtils.statusBadgeClass(p.status)}">${p.status}</span></td>
          <td><span style="font-size:12.5px; font-weight:600; color:${toneColor}">${p.status === 'Concluído' ? 'Entregue' : deadline.text}</span></td>
          <td class="cell-primary">${MobiUtils.formatCurrency(p.valorTotal)}</td>
          <td style="text-align:right;">
            <div class="action-menu-wrap">
              <button class="action-dots" data-act-toggle="${p.id}"><i class="bi bi-three-dots-vertical"></i></button>
              <div class="action-dropdown" data-act-menu="${p.id}">
                <button data-edit="${p.id}"><i class="bi bi-pencil"></i> Editar</button>
                <button data-status="${p.id}"><i class="bi bi-arrow-repeat"></i> Alterar status</button>
                <button data-date="${p.id}"><i class="bi bi-calendar3"></i> Alterar entrega</button>
                <button class="danger" data-del="${p.id}"><i class="bi bi-trash"></i> Excluir</button>
              </div>
            </div>
          </td>
        </tr>`;
    }).join('') || `<tr><td colspan="7"><div class="empty-state"><i class="bi bi-kanban"></i><strong>Nenhum projeto encontrado</strong>Ajuste os filtros ou cadastre um novo projeto.</div></td></tr>`;

    bindRowEvents();
  }

  function bindRowEvents() {
    document.querySelectorAll('[data-act-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.actToggle;
        document.querySelectorAll('.action-dropdown').forEach(d => { if (d.dataset.actMenu !== id) d.classList.remove('open'); });
        document.querySelector(`[data-act-menu="${id}"]`).classList.toggle('open');
      });
    });
    document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEdit(btn.dataset.edit)));
    document.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => handleDelete(btn.dataset.del)));
    document.querySelectorAll('[data-status]').forEach(btn => btn.addEventListener('click', () => quickChangeStatus(btn.dataset.status)));
    document.querySelectorAll('[data-date]').forEach(btn => btn.addEventListener('click', () => quickChangeDate(btn.dataset.date)));
  }

  document.addEventListener('click', () => document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open')));

  document.getElementById('searchInput').addEventListener('input', MobiUtils.debounce((e) => { searchTerm = e.target.value; render(); }, 200));
  document.getElementById('statusFilter').addEventListener('change', (e) => { statusFilter = e.target.value; render(); });

  function quickChangeStatus(id) {
    const p = MobiDB.findById('projetos', id);
    if (!p) return;
    const options = ['Em andamento', 'Reservado', 'Concluído', 'Atrasado'];
    const next = options[(options.indexOf(p.status) + 1) % options.length];
    MobiDB.update('projetos', id, { status: next });
    MobiUtils.toast(`Status de "${p.nome}" atualizado para ${next}.`, 'success');
    render();
  }

  function quickChangeDate(id) {
    const p = MobiDB.findById('projetos', id);
    if (!p) return;
    const nova = window.prompt(`Nova data de entrega para "${p.nome}" (AAAA-MM-DD):`, p.dataEntrega);
    if (!nova) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nova)) { MobiUtils.toast('Data inválida. Use o formato AAAA-MM-DD.', 'danger'); return; }
    MobiDB.update('projetos', id, { dataEntrega: nova });
    MobiUtils.toast('Data de entrega atualizada. Prazo recalculado.', 'success');
    render();
  }

  /* ---------- Modal ---------- */
  const modal = document.getElementById('modalProjeto');
  const form = document.getElementById('formProjeto');

  function openModal() { populateClienteSelect(); modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); form.reset(); editingId = null; }
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('btnNovoProjeto').addEventListener('click', () => {
    editingId = null;
    document.getElementById('modalProjetoTitle').textContent = 'Novo projeto';
    form.reset();
    openModal();
    document.getElementById('fDataCriacao').value = MobiUtils.todayISO();
  });

  function openEdit(id) {
    const p = MobiDB.findById('projetos', id);
    if (!p) return;
    editingId = id;
    document.getElementById('modalProjetoTitle').textContent = 'Editar projeto';
    openModal();
    document.getElementById('fNome').value = p.nome || '';
    document.getElementById('fCliente').value = p.clienteId || '';
    document.getElementById('fDataCriacao').value = p.dataCriacao || '';
    document.getElementById('fDataEntrega').value = p.dataEntrega || '';
    document.getElementById('fValor').value = p.valorTotal || '';
    document.getElementById('fStatus').value = p.status || 'Em andamento';
    document.getElementById('fResponsavel').value = p.responsavel || '';
    document.getElementById('fObservacoes').value = p.observacoes || '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      nome: document.getElementById('fNome').value.trim(),
      clienteId: document.getElementById('fCliente').value,
      dataCriacao: document.getElementById('fDataCriacao').value || MobiUtils.todayISO(),
      dataEntrega: document.getElementById('fDataEntrega').value,
      valorTotal: parseFloat(document.getElementById('fValor').value) || 0,
      status: document.getElementById('fStatus').value,
      responsavel: document.getElementById('fResponsavel').value.trim(),
      observacoes: document.getElementById('fObservacoes').value.trim(),
    };
    if (editingId) {
      MobiDB.update('projetos', editingId, payload);
      MobiUtils.toast('Projeto atualizado com sucesso.', 'success');
    } else {
      MobiDB.insert('projetos', { id: MobiUtils.uid('proj'), ...payload });
      MobiUtils.toast('Projeto cadastrado com sucesso.', 'success');
    }
    closeModal();
    render();
  });

  function handleDelete(id) {
    const p = MobiDB.findById('projetos', id);
    if (!p) return;
    if (MobiUtils.confirmAction(`Excluir o projeto "${p.nome}"? Esta ação não pode ser desfeita.`)) {
      MobiDB.remove('projetos', id);
      MobiUtils.toast('Projeto excluído.', 'danger');
      render();
    }
  }

  render();
})();
