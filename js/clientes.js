/* MobiLine - clientes.js */
(function () {
  const session = MobiLayout.initPage({ page: 'clientes', title: 'Clientes', crumb: 'MobiLine / Clientes' });
  if (!session) return;

  let searchTerm = '';
  let orderBy = 'recentes';
  let editingId = null;

  const body = document.getElementById('clientesBody');
  const countLabel = document.getElementById('countLabel');

  function projetosDoCliente(clienteId) {
    return MobiDB.getAll('projetos').filter(p => p.clienteId === clienteId);
  }
  function pagamentosDoCliente(clienteId) {
    return MobiDB.getAll('pagamentos').filter(p => p.clienteId === clienteId);
  }

  function render() {
    let clientes = MobiDB.getAll('clientes');

    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      clientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(t) ||
        (c.email || '').toLowerCase().includes(t) ||
        (c.telefone || '').toLowerCase().includes(t)
      );
    }

    clientes = orderBy === 'nome'
      ? [...clientes].sort((a, b) => a.nome.localeCompare(b.nome))
      : [...clientes].sort((a, b) => (b.dataCadastro || '').localeCompare(a.dataCadastro || ''));

    countLabel.textContent = `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`;

    body.innerHTML = clientes.map(c => {
      const qtdProjetos = projetosDoCliente(c.id).length;
      return `
        <tr>
          <td>
            <div class="row-with-thumb">
              <div class="avatar-sm">${MobiUtils.initials(c.nome)}</div>
              <div>
                <div class="cell-primary">${MobiUtils.escapeHtml(c.nome)}</div>
                <div class="cell-muted">${MobiUtils.escapeHtml(c.email)}</div>
              </div>
            </div>
          </td>
          <td>${MobiUtils.escapeHtml(c.telefone)}</td>
          <td><span class="badge-pill badge-info">${qtdProjetos} projeto${qtdProjetos !== 1 ? 's' : ''}</span></td>
          <td class="cell-muted">${MobiUtils.formatDate(c.dataCadastro)}</td>
          <td style="text-align:right;">
            <div class="action-menu-wrap">
              <button class="action-dots" data-act-toggle="${c.id}"><i class="bi bi-three-dots-vertical"></i></button>
              <div class="action-dropdown" data-act-menu="${c.id}">
                <button data-view="${c.id}"><i class="bi bi-eye"></i> Visualizar</button>
                <button data-edit="${c.id}"><i class="bi bi-pencil"></i> Editar</button>
                <button class="danger" data-del="${c.id}"><i class="bi bi-trash"></i> Excluir</button>
              </div>
            </div>
          </td>
        </tr>`;
    }).join('') || `<tr><td colspan="5"><div class="empty-state"><i class="bi bi-people"></i><strong>Nenhum cliente encontrado</strong>Tente ajustar a pesquisa ou cadastre um novo cliente.</div></td></tr>`;

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
    document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => openView(btn.dataset.view)));
    document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEdit(btn.dataset.edit)));
    document.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => handleDelete(btn.dataset.del)));
  }

  document.addEventListener('click', () => document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open')));

  /* ---------- Pesquisa e ordenação ---------- */
  document.getElementById('searchInput').addEventListener('input', MobiUtils.debounce((e) => {
    searchTerm = e.target.value;
    render();
  }, 200));
  document.getElementById('orderSelect').addEventListener('change', (e) => { orderBy = e.target.value; render(); });

  /* ---------- Modal cadastro/edição ---------- */
  const modal = document.getElementById('modalCliente');
  const form = document.getElementById('formCliente');

  function openModal() { modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); form.reset(); editingId = null; }
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('btnNovoCliente').addEventListener('click', () => {
    editingId = null;
    document.getElementById('modalClienteTitle').textContent = 'Novo cliente';
    form.reset();
    document.getElementById('fDataCadastro').value = MobiUtils.todayISO();
    openModal();
  });

  function openEdit(id) {
    const c = MobiDB.findById('clientes', id);
    if (!c) return;
    editingId = id;
    document.getElementById('modalClienteTitle').textContent = 'Editar cliente';
    document.getElementById('fNome').value = c.nome || '';
    document.getElementById('fTelefone').value = c.telefone || '';
    document.getElementById('fEmail').value = c.email || '';
    document.getElementById('fEndereco').value = c.endereco || '';
    document.getElementById('fDocumento').value = c.documento || '';
    document.getElementById('fDataCadastro').value = c.dataCadastro || '';
    document.getElementById('fObservacoes').value = c.observacoes || '';
    openModal();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      nome: document.getElementById('fNome').value.trim(),
      telefone: document.getElementById('fTelefone').value.trim(),
      email: document.getElementById('fEmail').value.trim(),
      endereco: document.getElementById('fEndereco').value.trim(),
      documento: document.getElementById('fDocumento').value.trim(),
      dataCadastro: document.getElementById('fDataCadastro').value || MobiUtils.todayISO(),
      observacoes: document.getElementById('fObservacoes').value.trim(),
    };
    if (editingId) {
      MobiDB.update('clientes', editingId, payload);
      MobiUtils.toast('Cliente atualizado com sucesso.', 'success');
    } else {
      MobiDB.insert('clientes', { id: MobiUtils.uid('cli'), ...payload });
      MobiUtils.toast('Cliente cadastrado com sucesso.', 'success');
    }
    closeModal();
    render();
  });

  function handleDelete(id) {
    const c = MobiDB.findById('clientes', id);
    if (!c) return;
    if (MobiUtils.confirmAction(`Excluir o cliente "${c.nome}"? Esta ação não pode ser desfeita.`)) {
      MobiDB.remove('clientes', id);
      MobiUtils.toast('Cliente excluído.', 'danger');
      render();
    }
  }

  /* ---------- Modal de visualização ---------- */
  const viewModal = document.getElementById('modalVisualizar');
  viewModal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => viewModal.classList.remove('open')));
  viewModal.addEventListener('click', (e) => { if (e.target === viewModal) viewModal.classList.remove('open'); });

  function openView(id) {
    const c = MobiDB.findById('clientes', id);
    if (!c) return;
    document.getElementById('viewNome').textContent = c.nome;
    const projetos = projetosDoCliente(id);
    const pagamentos = pagamentosDoCliente(id);

    document.getElementById('viewBody').innerHTML = `
      <div class="two-col-grid" style="margin-bottom:18px;">
        <div class="form-field"><label>Telefone</label><div class="cell-primary">${MobiUtils.escapeHtml(c.telefone) || '—'}</div></div>
        <div class="form-field"><label>E-mail</label><div class="cell-primary">${MobiUtils.escapeHtml(c.email) || '—'}</div></div>
        <div class="form-field"><label>Endereço</label><div class="cell-primary">${MobiUtils.escapeHtml(c.endereco) || '—'}</div></div>
        <div class="form-field"><label>CPF/CNPJ</label><div class="cell-primary">${MobiUtils.escapeHtml(c.documento) || '—'}</div></div>
        <div class="form-field"><label>Data de cadastro</label><div class="cell-primary">${MobiUtils.formatDate(c.dataCadastro)}</div></div>
        <div class="form-field"><label>Observações</label><div class="cell-primary">${MobiUtils.escapeHtml(c.observacoes) || '—'}</div></div>
      </div>
      <h3 style="font-size:14px; margin-bottom:10px;">Histórico de projetos</h3>
      <div class="table-wrap" style="margin-bottom:18px;">
        <table class="mobi-table">
          <thead><tr><th>Projeto</th><th>Status</th><th>Entrega</th><th>Valor</th></tr></thead>
          <tbody>
            ${projetos.map(p => `<tr><td class="cell-primary">${MobiUtils.escapeHtml(p.nome)}</td><td><span class="badge-pill ${MobiUtils.statusBadgeClass(p.status)}">${p.status}</span></td><td class="cell-muted">${MobiUtils.formatDate(p.dataEntrega)}</td><td>${MobiUtils.formatCurrency(p.valorTotal)}</td></tr>`).join('') || `<tr><td colspan="4"><div class="empty-state">Nenhum projeto para este cliente.</div></td></tr>`}
          </tbody>
        </table>
      </div>
      <h3 style="font-size:14px; margin-bottom:10px;">Pagamentos</h3>
      <div class="table-wrap">
        <table class="mobi-table">
          <thead><tr><th>Situação</th><th>Total</th><th>Pago</th><th>Restante</th><th>Vencimento</th></tr></thead>
          <tbody>
            ${pagamentos.map(pg => `<tr><td><span class="badge-pill ${MobiUtils.statusBadgeClass(pg.situacao)}">${pg.situacao}</span></td><td>${MobiUtils.formatCurrency(pg.valorTotal)}</td><td>${MobiUtils.formatCurrency(pg.valorPago)}</td><td>${MobiUtils.formatCurrency(pg.valorTotal - pg.valorPago)}</td><td class="cell-muted">${MobiUtils.formatDate(pg.vencimento)}</td></tr>`).join('') || `<tr><td colspan="5"><div class="empty-state">Nenhum pagamento registrado.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    `;
    viewModal.classList.add('open');
  }

  render();
})();
