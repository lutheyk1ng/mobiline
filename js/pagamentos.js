/* MobiLine - pagamentos.js */
(function () {
  const session = MobiLayout.initPage({ page: 'pagamentos', title: 'Pagamentos', crumb: 'MobiLine / Pagamentos' });
  if (!session) return;

  let searchTerm = '';
  let situacaoFilter = '';
  let editingId = null;

  const body = document.getElementById('pagamentosBody');
  const countLabel = document.getElementById('countLabel');

  function recalcSituacoes() {
    // Recalcula "Expirado" automaticamente para pendências com vencimento passado
    const pagamentos = MobiDB.getAll('pagamentos');
    let changed = false;
    pagamentos.forEach(pg => {
      const restante = pg.valorTotal - pg.valorPago;
      if (restante <= 0 && pg.situacao !== 'Pago') { pg.situacao = 'Pago'; changed = true; }
      else if (restante > 0) {
        const diff = MobiUtils.daysDiffFromToday(pg.vencimento);
        const novaSituacao = diff !== null && diff < 0 ? 'Expirado' : 'Pendente';
        if (pg.situacao !== novaSituacao) { pg.situacao = novaSituacao; changed = true; }
      }
    });
    if (changed) MobiDB.setAll('pagamentos', pagamentos);
  }

  function populateProjetoSelect() {
    const select = document.getElementById('fProjeto');
    const projetos = MobiDB.getAll('projetos');
    select.innerHTML = projetos.map(p => {
      const cliente = MobiDB.findById('clientes', p.clienteId);
      return `<option value="${p.id}">${MobiUtils.escapeHtml(p.nome)}${cliente ? ' — ' + MobiUtils.escapeHtml(cliente.nome) : ''}</option>`;
    }).join('');
  }

  function renderAlerts() {
    const pagamentos = MobiDB.getAll('pagamentos');
    const vencidos = pagamentos.filter(pg => pg.situacao === 'Expirado');
    const holder = document.getElementById('alertHolder');
    holder.innerHTML = vencidos.length ? `
      <div class="alert-banner alert-danger">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <div><strong>${vencidos.length} pagamento${vencidos.length > 1 ? 's' : ''} vencido${vencidos.length > 1 ? 's' : ''}.</strong> Entre em contato com o(s) cliente(s) para regularizar a situação.</div>
      </div>` : '';
  }

  function render() {
    recalcSituacoes();
    renderAlerts();
    let pagamentos = MobiDB.getAll('pagamentos');

    if (situacaoFilter) pagamentos = pagamentos.filter(pg => pg.situacao === situacaoFilter);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      pagamentos = pagamentos.filter(pg => {
        const proj = MobiDB.findById('projetos', pg.projetoId);
        const cliente = MobiDB.findById('clientes', pg.clienteId);
        return (proj && proj.nome.toLowerCase().includes(t)) || (cliente && cliente.nome.toLowerCase().includes(t));
      });
    }
    pagamentos = [...pagamentos].sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));

    countLabel.textContent = `${pagamentos.length} pagamento${pagamentos.length !== 1 ? 's' : ''}`;

    body.innerHTML = pagamentos.map(pg => {
      const proj = MobiDB.findById('projetos', pg.projetoId);
      const cliente = MobiDB.findById('clientes', pg.clienteId);
      const restante = pg.valorTotal - pg.valorPago;
      return `
        <tr>
          <td class="cell-primary">${proj ? MobiUtils.escapeHtml(proj.nome) : '—'}</td>
          <td>${cliente ? MobiUtils.escapeHtml(cliente.nome) : '—'}</td>
          <td>${MobiUtils.formatCurrency(pg.valorTotal)}</td>
          <td>${MobiUtils.formatCurrency(pg.valorPago)}</td>
          <td class="${restante > 0 ? 'cell-primary' : 'cell-muted'}">${MobiUtils.formatCurrency(restante)}</td>
          <td class="cell-muted">${MobiUtils.formatDate(pg.vencimento)}</td>
          <td><span class="badge-pill ${MobiUtils.statusBadgeClass(pg.situacao)}">${pg.situacao}</span></td>
          <td style="text-align:right;">
            <div class="action-menu-wrap">
              <button class="action-dots" data-act-toggle="${pg.id}"><i class="bi bi-three-dots-vertical"></i></button>
              <div class="action-dropdown" data-act-menu="${pg.id}">
                ${restante > 0 ? `<button data-pay="${pg.id}"><i class="bi bi-cash"></i> Registrar pagamento</button>` : ''}
                <button data-edit="${pg.id}"><i class="bi bi-pencil"></i> Editar</button>
                <button class="danger" data-del="${pg.id}"><i class="bi bi-trash"></i> Excluir</button>
              </div>
            </div>
          </td>
        </tr>`;
    }).join('') || `<tr><td colspan="8"><div class="empty-state"><i class="bi bi-credit-card"></i><strong>Nenhum pagamento encontrado</strong>Ajuste os filtros ou registre um novo pagamento.</div></td></tr>`;

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
    document.querySelectorAll('[data-pay]').forEach(btn => btn.addEventListener('click', () => registrarPagamento(btn.dataset.pay)));
  }
  document.addEventListener('click', () => document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open')));

  document.getElementById('searchInput').addEventListener('input', MobiUtils.debounce((e) => { searchTerm = e.target.value; render(); }, 200));
  document.getElementById('situacaoFilter').addEventListener('change', (e) => { situacaoFilter = e.target.value; render(); });

  function registrarPagamento(id) {
    const pg = MobiDB.findById('pagamentos', id);
    if (!pg) return;
    const restante = pg.valorTotal - pg.valorPago;
    const valorStr = window.prompt(`Valor recebido agora (restante: ${MobiUtils.formatCurrency(restante)}):`, restante.toFixed(2));
    if (valorStr === null) return;
    const valor = parseFloat(valorStr.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) { MobiUtils.toast('Informe um valor válido.', 'danger'); return; }
    const novoPago = Math.min(pg.valorTotal, pg.valorPago + valor);
    MobiDB.update('pagamentos', id, { valorPago: novoPago, situacao: novoPago >= pg.valorTotal ? 'Pago' : pg.situacao });
    MobiUtils.toast('Pagamento registrado. Valor restante atualizado.', 'success');
    render();
  }

  /* ---------- Modal ---------- */
  const modal = document.getElementById('modalPagamento');
  const form = document.getElementById('formPagamento');

  function openModal() { populateProjetoSelect(); modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); form.reset(); editingId = null; }
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('btnNovoPagamento').addEventListener('click', () => {
    editingId = null;
    document.getElementById('modalPagamentoTitle').textContent = 'Novo pagamento';
    form.reset();
    openModal();
  });

  function openEdit(id) {
    const pg = MobiDB.findById('pagamentos', id);
    if (!pg) return;
    editingId = id;
    document.getElementById('modalPagamentoTitle').textContent = 'Editar pagamento';
    openModal();
    document.getElementById('fProjeto').value = pg.projetoId;
    document.getElementById('fValorTotal').value = pg.valorTotal;
    document.getElementById('fValorPago').value = pg.valorPago;
    document.getElementById('fForma').value = pg.formaPagamento;
    document.getElementById('fParcelas').value = pg.parcelas;
    document.getElementById('fVencimento').value = pg.vencimento;
    document.getElementById('fSituacao').value = pg.situacao;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const projetoId = document.getElementById('fProjeto').value;
    const projeto = MobiDB.findById('projetos', projetoId);
    const payload = {
      projetoId,
      clienteId: projeto ? projeto.clienteId : null,
      valorTotal: parseFloat(document.getElementById('fValorTotal').value) || 0,
      valorPago: parseFloat(document.getElementById('fValorPago').value) || 0,
      formaPagamento: document.getElementById('fForma').value,
      parcelas: parseInt(document.getElementById('fParcelas').value, 10) || 1,
      vencimento: document.getElementById('fVencimento').value,
      situacao: document.getElementById('fSituacao').value,
    };
    if (editingId) {
      MobiDB.update('pagamentos', editingId, payload);
      MobiUtils.toast('Pagamento atualizado com sucesso.', 'success');
    } else {
      MobiDB.insert('pagamentos', { id: MobiUtils.uid('pag'), ...payload });
      MobiUtils.toast('Pagamento cadastrado com sucesso.', 'success');
    }
    closeModal();
    render();
  });

  function handleDelete(id) {
    if (MobiUtils.confirmAction('Excluir este pagamento? Esta ação não pode ser desfeita.')) {
      MobiDB.remove('pagamentos', id);
      MobiUtils.toast('Pagamento excluído.', 'danger');
      render();
    }
  }

  render();
})();
