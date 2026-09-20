/* MobiLine - fornecedores.js */
(function () {
  const session = MobiLayout.initPage({ page: 'fornecedores', title: 'Fornecedores', crumb: 'MobiLine / Fornecedores' });
  if (!session) return;

  let searchTerm = '';
  let editingId = null;

  const body = document.getElementById('fornecedoresBody');
  const countLabel = document.getElementById('countLabel');

  function render() {
    let fornecedores = MobiDB.getAll('fornecedores');
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      fornecedores = fornecedores.filter(f => f.nome.toLowerCase().includes(t) || (f.empresa || '').toLowerCase().includes(t));
    }
    fornecedores = [...fornecedores].sort((a, b) => (a.empresa || a.nome).localeCompare(b.empresa || b.nome));
    countLabel.textContent = `${fornecedores.length} fornecedor${fornecedores.length !== 1 ? 'es' : ''}`;

    body.innerHTML = fornecedores.map(f => `
      <tr>
        <td>
          <div class="row-with-thumb">
            <div class="avatar-sm">${MobiUtils.initials(f.empresa || f.nome)}</div>
            <div>
              <div class="cell-primary">${MobiUtils.escapeHtml(f.empresa)}</div>
              <div class="cell-muted">${MobiUtils.escapeHtml(f.nome)}</div>
            </div>
          </div>
        </td>
        <td>${MobiUtils.escapeHtml(f.telefone) || '—'}</td>
        <td class="cell-muted">${MobiUtils.escapeHtml(f.email) || '—'}</td>
        <td class="cell-muted">${MobiUtils.escapeHtml(f.produtos) || '—'}</td>
        <td style="text-align:right;">
          <div class="action-menu-wrap">
            <button class="action-dots" data-act-toggle="${f.id}"><i class="bi bi-three-dots-vertical"></i></button>
            <div class="action-dropdown" data-act-menu="${f.id}">
              <button data-edit="${f.id}"><i class="bi bi-pencil"></i> Editar</button>
              <button class="danger" data-del="${f.id}"><i class="bi bi-trash"></i> Excluir</button>
            </div>
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="5"><div class="empty-state"><i class="bi bi-truck"></i><strong>Nenhum fornecedor encontrado</strong>Ajuste a pesquisa ou cadastre um novo fornecedor.</div></td></tr>`;

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
  }
  document.addEventListener('click', () => document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('open')));

  document.getElementById('searchInput').addEventListener('input', MobiUtils.debounce((e) => { searchTerm = e.target.value; render(); }, 200));

  const modal = document.getElementById('modalFornecedor');
  const form = document.getElementById('formFornecedor');

  function openModal() { modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); form.reset(); editingId = null; }
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('btnNovoFornecedor').addEventListener('click', () => {
    editingId = null;
    document.getElementById('modalFornecedorTitle').textContent = 'Novo fornecedor';
    form.reset();
    openModal();
  });

  function openEdit(id) {
    const f = MobiDB.findById('fornecedores', id);
    if (!f) return;
    editingId = id;
    document.getElementById('modalFornecedorTitle').textContent = 'Editar fornecedor';
    document.getElementById('fNome').value = f.nome || '';
    document.getElementById('fEmpresa').value = f.empresa || '';
    document.getElementById('fTelefone').value = f.telefone || '';
    document.getElementById('fEmail').value = f.email || '';
    document.getElementById('fEndereco').value = f.endereco || '';
    document.getElementById('fCnpj').value = f.documento || '';
    document.getElementById('fProdutos').value = f.produtos || '';
    document.getElementById('fObservacoes').value = f.observacoes || '';
    openModal();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      nome: document.getElementById('fNome').value.trim(),
      empresa: document.getElementById('fEmpresa').value.trim(),
      telefone: document.getElementById('fTelefone').value.trim(),
      email: document.getElementById('fEmail').value.trim(),
      endereco: document.getElementById('fEndereco').value.trim(),
      documento: document.getElementById('fCnpj').value.trim(),
      produtos: document.getElementById('fProdutos').value.trim(),
      observacoes: document.getElementById('fObservacoes').value.trim(),
    };
    if (editingId) {
      MobiDB.update('fornecedores', editingId, payload);
      MobiUtils.toast('Fornecedor atualizado com sucesso.', 'success');
    } else {
      MobiDB.insert('fornecedores', { id: MobiUtils.uid('forn'), ...payload });
      MobiUtils.toast('Fornecedor cadastrado com sucesso.', 'success');
    }
    closeModal();
    render();
  });

  function handleDelete(id) {
    if (MobiUtils.confirmAction('Excluir este fornecedor?')) {
      MobiDB.remove('fornecedores', id);
      MobiUtils.toast('Fornecedor excluído.', 'danger');
      render();
    }
  }

  render();
})();
