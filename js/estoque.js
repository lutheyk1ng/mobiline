/* MobiLine - estoque.js */
(function () {
  const session = MobiLayout.initPage({ page: 'estoque', title: 'Estoque', crumb: 'MobiLine / Estoque' });
  if (!session) return;

  let searchTerm = '';
  let statusFilter = '';
  let editingId = null;

  const body = document.getElementById('estoqueBody');
  const countLabel = document.getElementById('countLabel');

  function computeStatus(p) {
    if (Number(p.quantidade) <= 0) return 'Sem estoque';
    if (Number(p.quantidade) <= Number(p.estoqueMinimo)) return 'Estoque baixo';
    return 'Disponível';
  }

  function populateFornecedorSelect() {
    const select = document.getElementById('fFornecedor');
    const fornecedores = MobiDB.getAll('fornecedores').sort((a, b) => a.nome.localeCompare(b.nome));
    select.innerHTML = '<option value="">— Nenhum —</option>' + fornecedores.map(f => `<option value="${f.id}">${MobiUtils.escapeHtml(f.empresa || f.nome)}</option>`).join('');
  }

  function renderAlerts() {
    const produtos = MobiDB.getAll('produtos');
    const baixos = produtos.filter(p => computeStatus(p) !== 'Disponível');
    document.getElementById('alertHolder').innerHTML = baixos.length ? `
      <div class="alert-banner alert-warning">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <div><strong>${baixos.length} produto${baixos.length > 1 ? 's' : ''} abaixo do estoque mínimo.</strong> Considere fazer um novo pedido aos fornecedores.</div>
      </div>` : '';
  }

  function render() {
    renderAlerts();
    let produtos = MobiDB.getAll('produtos');
    if (statusFilter) produtos = produtos.filter(p => computeStatus(p) === statusFilter);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      produtos = produtos.filter(p => p.nome.toLowerCase().includes(t) || (p.categoria || '').toLowerCase().includes(t));
    }
    produtos = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));
    countLabel.textContent = `${produtos.length} produto${produtos.length !== 1 ? 's' : ''}`;

    body.innerHTML = produtos.map(p => {
      const status = computeStatus(p);
      const fornecedor = MobiDB.findById('fornecedores', p.fornecedorId);
      return `
        <tr>
          <td class="cell-primary">${MobiUtils.escapeHtml(p.nome)}</td>
          <td><span class="badge-pill badge-muted">${MobiUtils.escapeHtml(p.categoria) || '—'}</span></td>
          <td>${p.quantidade} ${MobiUtils.escapeHtml(p.unidade) || ''}</td>
          <td class="cell-muted">${p.estoqueMinimo} ${MobiUtils.escapeHtml(p.unidade) || ''}</td>
          <td class="cell-muted">${fornecedor ? MobiUtils.escapeHtml(fornecedor.empresa || fornecedor.nome) : '—'}</td>
          <td><span class="badge-pill ${MobiUtils.statusBadgeClass(status)}">${status}</span></td>
          <td style="text-align:right;">
            <div class="action-menu-wrap">
              <button class="action-dots" data-act-toggle="${p.id}"><i class="bi bi-three-dots-vertical"></i></button>
              <div class="action-dropdown" data-act-menu="${p.id}">
                <button data-edit="${p.id}"><i class="bi bi-pencil"></i> Editar</button>
                <button data-restock="${p.id}"><i class="bi bi-box-arrow-in-down"></i> Repor estoque</button>
                <button class="danger" data-del="${p.id}"><i class="bi bi-trash"></i> Excluir</button>
              </div>
            </div>
          </td>
        </tr>`;
    }).join('') || `<tr><td colspan="7"><div class="empty-state"><i class="bi bi-box-seam"></i><strong>Nenhum produto encontrado</strong>Ajuste os filtros ou cadastre um novo produto.</div></td></tr>`;

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
    document.querySelectorAll('[data-restock]').forEach(btn => btn.addEventListener('click', () => restock(btn.dataset.restock)));
  }
  document.addEventListener('click', () => document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open')));

  document.getElementById('searchInput').addEventListener('input', MobiUtils.debounce((e) => { searchTerm = e.target.value; render(); }, 200));
  document.getElementById('statusFilter').addEventListener('change', (e) => { statusFilter = e.target.value; render(); });

  function restock(id) {
    const p = MobiDB.findById('produtos', id);
    if (!p) return;
    const qtdStr = window.prompt(`Quantidade a adicionar ao estoque de "${p.nome}":`, '10');
    if (qtdStr === null) return;
    const qtd = parseInt(qtdStr, 10);
    if (isNaN(qtd) || qtd <= 0) { MobiUtils.toast('Informe uma quantidade válida.', 'danger'); return; }
    MobiDB.update('produtos', id, { quantidade: Number(p.quantidade) + qtd });
    MobiUtils.toast('Estoque atualizado.', 'success');
    render();
  }

  /* ---------- Modal ---------- */
  const modal = document.getElementById('modalProduto');
  const form = document.getElementById('formProduto');

  function openModal() { populateFornecedorSelect(); modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); form.reset(); editingId = null; }
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('btnNovoProduto').addEventListener('click', () => {
    editingId = null;
    document.getElementById('modalProdutoTitle').textContent = 'Novo produto';
    form.reset();
    openModal();
  });

  function openEdit(id) {
    const p = MobiDB.findById('produtos', id);
    if (!p) return;
    editingId = id;
    document.getElementById('modalProdutoTitle').textContent = 'Editar produto';
    openModal();
    document.getElementById('fNome').value = p.nome || '';
    document.getElementById('fCategoria').value = p.categoria || '';
    document.getElementById('fFornecedor').value = p.fornecedorId || '';
    document.getElementById('fQuantidade').value = p.quantidade;
    document.getElementById('fUnidade').value = p.unidade || '';
    document.getElementById('fEstoqueMinimo').value = p.estoqueMinimo || 0;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      nome: document.getElementById('fNome').value.trim(),
      categoria: document.getElementById('fCategoria').value.trim(),
      fornecedorId: document.getElementById('fFornecedor').value || null,
      quantidade: parseInt(document.getElementById('fQuantidade').value, 10) || 0,
      unidade: document.getElementById('fUnidade').value.trim(),
      estoqueMinimo: parseInt(document.getElementById('fEstoqueMinimo').value, 10) || 0,
    };
    if (editingId) {
      MobiDB.update('produtos', editingId, payload);
      MobiUtils.toast('Produto atualizado com sucesso.', 'success');
    } else {
      MobiDB.insert('produtos', { id: MobiUtils.uid('prod'), ...payload });
      MobiUtils.toast('Produto cadastrado com sucesso.', 'success');
    }
    closeModal();
    render();
  });

  function handleDelete(id) {
    if (MobiUtils.confirmAction('Excluir este produto do estoque?')) {
      MobiDB.remove('produtos', id);
      MobiUtils.toast('Produto excluído.', 'danger');
      render();
    }
  }

  render();
})();
