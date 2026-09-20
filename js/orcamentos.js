/* MobiLine - orcamentos.js */
(function () {
  const session = MobiLayout.initPage({ page: 'orcamentos', title: 'Orçamentos', crumb: 'MobiLine / Orçamentos' });
  if (!session) return;

  let searchTerm = '';
  let statusFilter = '';
  let editingId = null;
  let itemRows = [];

  const body = document.getElementById('orcamentosBody');
  const countLabel = document.getElementById('countLabel');

  function calcTotal(itens, desconto) {
    const bruto = itens.reduce((s, it) => s + (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0), 0);
    return Math.max(0, bruto - (Number(desconto) || 0));
  }

  function render() {
    let orcamentos = MobiDB.getAll('orcamentos');
    if (statusFilter) orcamentos = orcamentos.filter(o => o.status === statusFilter);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      orcamentos = orcamentos.filter(o => {
        const cliente = MobiDB.findById('clientes', o.clienteId);
        return (o.projetoNome || '').toLowerCase().includes(t) || (cliente && cliente.nome.toLowerCase().includes(t));
      });
    }
    orcamentos = [...orcamentos].sort((a, b) => (b.validade || '').localeCompare(a.validade || ''));
    countLabel.textContent = `${orcamentos.length} orçamento${orcamentos.length !== 1 ? 's' : ''}`;

    body.innerHTML = orcamentos.map(o => {
      const cliente = MobiDB.findById('clientes', o.clienteId);
      const total = calcTotal(o.itens || [], o.desconto);
      return `
        <tr>
          <td class="cell-primary">${cliente ? MobiUtils.escapeHtml(cliente.nome) : '—'}</td>
          <td>${MobiUtils.escapeHtml(o.projetoNome)}</td>
          <td>${MobiUtils.formatCurrency(total)}</td>
          <td class="cell-muted">${MobiUtils.formatDate(o.validade)}</td>
          <td><span class="badge-pill ${MobiUtils.statusBadgeClass(o.status)}">${o.status}</span></td>
          <td style="text-align:right;">
            <div class="action-menu-wrap">
              <button class="action-dots" data-act-toggle="${o.id}"><i class="bi bi-three-dots-vertical"></i></button>
              <div class="action-dropdown" data-act-menu="${o.id}">
                <button data-edit="${o.id}"><i class="bi bi-pencil"></i> Editar</button>
                ${o.status !== 'Aprovado' ? `<button data-approve="${o.id}"><i class="bi bi-check2-circle"></i> Marcar aprovado</button>` : ''}
                <button class="danger" data-del="${o.id}"><i class="bi bi-trash"></i> Excluir</button>
              </div>
            </div>
          </td>
        </tr>`;
    }).join('') || `<tr><td colspan="6"><div class="empty-state"><i class="bi bi-file-earmark-text"></i><strong>Nenhum orçamento encontrado</strong>Ajuste os filtros ou crie um novo orçamento.</div></td></tr>`;

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
    document.querySelectorAll('[data-approve]').forEach(btn => btn.addEventListener('click', () => {
      MobiDB.update('orcamentos', btn.dataset.approve, { status: 'Aprovado' });
      MobiUtils.toast('Orçamento marcado como aprovado.', 'success');
      render();
    }));
  }
  document.addEventListener('click', () => document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open')));

  document.getElementById('searchInput').addEventListener('input', MobiUtils.debounce((e) => { searchTerm = e.target.value; render(); }, 200));
  document.getElementById('statusFilter').addEventListener('change', (e) => { statusFilter = e.target.value; render(); });

  /* ---------- Itens dinâmicos ---------- */
  function renderItemRows() {
    const list = document.getElementById('itensList');
    list.innerHTML = itemRows.map((it, idx) => `
      <div class="item-row">
        <input type="text" placeholder="Nome do item" value="${MobiUtils.escapeHtml(it.nome)}" data-item-field="nome" data-idx="${idx}">
        <input type="number" min="1" placeholder="Qtd" value="${it.quantidade}" data-item-field="quantidade" data-idx="${idx}">
        <input type="number" min="0" step="0.01" placeholder="Valor unitário" value="${it.valorUnitario}" data-item-field="valorUnitario" data-idx="${idx}">
        <button type="button" class="remove-item" data-remove-idx="${idx}"><i class="bi bi-x-circle"></i></button>
      </div>
    `).join('');
    list.querySelectorAll('[data-item-field]').forEach(input => {
      input.addEventListener('input', () => {
        const idx = Number(input.dataset.idx);
        const field = input.dataset.itemField;
        itemRows[idx][field] = field === 'nome' ? input.value : Number(input.value);
        updateTotalDisplay();
      });
    });
    list.querySelectorAll('[data-remove-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        itemRows.splice(Number(btn.dataset.removeIdx), 1);
        renderItemRows();
        updateTotalDisplay();
      });
    });
  }

  function updateTotalDisplay() {
    const desconto = parseFloat(document.getElementById('fDesconto').value) || 0;
    document.getElementById('fValorTotalDisplay').value = MobiUtils.formatCurrency(calcTotal(itemRows, desconto));
  }

  document.getElementById('btnAddItem').addEventListener('click', () => {
    itemRows.push({ nome: '', quantidade: 1, valorUnitario: 0 });
    renderItemRows();
    updateTotalDisplay();
  });
  document.getElementById('fDesconto').addEventListener('input', updateTotalDisplay);

  /* ---------- Modal ---------- */
  const modal = document.getElementById('modalOrcamento');
  const form = document.getElementById('formOrcamento');

  function populateClienteSelect() {
    const select = document.getElementById('fCliente');
    const clientes = MobiDB.getAll('clientes').sort((a, b) => a.nome.localeCompare(b.nome));
    select.innerHTML = clientes.map(c => `<option value="${c.id}">${MobiUtils.escapeHtml(c.nome)}</option>`).join('');
  }

  function openModal() { populateClienteSelect(); modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); form.reset(); editingId = null; itemRows = []; renderItemRows(); }
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('btnNovoOrcamento').addEventListener('click', () => {
    editingId = null;
    document.getElementById('modalOrcamentoTitle').textContent = 'Novo orçamento';
    form.reset();
    itemRows = [{ nome: '', quantidade: 1, valorUnitario: 0 }];
    openModal();
    renderItemRows();
    updateTotalDisplay();
  });

  function openEdit(id) {
    const o = MobiDB.findById('orcamentos', id);
    if (!o) return;
    editingId = id;
    document.getElementById('modalOrcamentoTitle').textContent = 'Editar orçamento';
    openModal();
    document.getElementById('fCliente').value = o.clienteId;
    document.getElementById('fProjetoNome').value = o.projetoNome;
    document.getElementById('fDescricao').value = o.descricao || '';
    document.getElementById('fDesconto').value = o.desconto || 0;
    document.getElementById('fValidade').value = o.validade;
    document.getElementById('fStatus').value = o.status;
    itemRows = (o.itens || []).map(it => ({ ...it }));
    renderItemRows();
    updateTotalDisplay();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      clienteId: document.getElementById('fCliente').value,
      projetoNome: document.getElementById('fProjetoNome').value.trim(),
      descricao: document.getElementById('fDescricao').value.trim(),
      itens: itemRows.filter(it => it.nome.trim() !== ''),
      desconto: parseFloat(document.getElementById('fDesconto').value) || 0,
      validade: document.getElementById('fValidade').value,
      status: document.getElementById('fStatus').value,
    };
    if (editingId) {
      MobiDB.update('orcamentos', editingId, payload);
      MobiUtils.toast('Orçamento atualizado com sucesso.', 'success');
    } else {
      MobiDB.insert('orcamentos', { id: MobiUtils.uid('orc'), ...payload });
      MobiUtils.toast('Orçamento criado com sucesso.', 'success');
    }
    closeModal();
    render();
  });

  function handleDelete(id) {
    if (MobiUtils.confirmAction('Excluir este orçamento?')) {
      MobiDB.remove('orcamentos', id);
      MobiUtils.toast('Orçamento excluído.', 'danger');
      render();
    }
  }

  render();
})();
