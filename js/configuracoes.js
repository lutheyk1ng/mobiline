/* MobiLine - configuracoes.js */
(function () {
  const session = MobiLayout.initPage({ page: 'configuracoes', title: 'Configurações', crumb: 'MobiLine / Configurações' });
  if (!session) return;

  const isAdmin = session.papel === 'Administrador';
  if (!isAdmin) document.getElementById('cardFuncionarios').style.display = 'none';

  document.getElementById('fNome').value = session.nome;
  document.getElementById('fEmail').value = session.email;
  document.getElementById('fPapel').value = session.papel;

  document.getElementById('formPerfil').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('fNome').value.trim();
    const email = document.getElementById('fEmail').value.trim();
    MobiDB.update('usuarios', session.id, { nome, email });
    MobiLayout.setSession({ ...session, nome, email });
    MobiUtils.toast('Perfil atualizado com sucesso.', 'success');
    setTimeout(() => window.location.reload(), 600);
  });

  function renderFuncionarios() {
    if (!isAdmin) return;
    const usuarios = MobiDB.getAll('usuarios');
    document.getElementById('funcionariosBody').innerHTML = usuarios.map(u => `
      <tr>
        <td class="cell-primary">${MobiUtils.escapeHtml(u.nome)}</td>
        <td class="cell-muted">${MobiUtils.escapeHtml(u.email)}</td>
        <td><span class="badge-pill ${u.papel === 'Administrador' ? 'badge-info' : 'badge-purple'}">${u.papel}</span></td>
        <td style="text-align:right;">${u.id !== session.id ? `<button class="btn btn-ghost btn-sm" data-del-user="${u.id}"><i class="bi bi-trash"></i></button>` : '<span class="cell-muted">Você</span>'}</td>
      </tr>`).join('');

    document.querySelectorAll('[data-del-user]').forEach(btn => btn.addEventListener('click', () => {
      if (MobiUtils.confirmAction('Remover o acesso deste usuário?')) {
        MobiDB.remove('usuarios', btn.dataset.delUser);
        MobiUtils.toast('Usuário removido.', 'danger');
        renderFuncionarios();
      }
    }));
  }

  if (isAdmin) {
    renderFuncionarios();
    const modal = document.getElementById('modalFuncionario');
    const form = document.getElementById('formFuncionario');
    document.getElementById('btnNovoFuncionario').addEventListener('click', () => modal.classList.add('open'));
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { modal.classList.remove('open'); form.reset(); }));
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('open'); form.reset(); } });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      MobiDB.insert('usuarios', {
        id: MobiUtils.uid('user'),
        nome: document.getElementById('nfNome').value.trim(),
        email: document.getElementById('nfEmail').value.trim(),
        senha: document.getElementById('nfSenha').value,
        papel: document.getElementById('nfPapel').value,
      });
      MobiUtils.toast('Usuário adicionado com sucesso.', 'success');
      modal.classList.remove('open');
      form.reset();
      renderFuncionarios();
    });
  }

  document.getElementById('btnResetDemo').addEventListener('click', () => {
    if (MobiUtils.confirmAction('Isso vai apagar todas as alterações e restaurar os dados de demonstração originais. Continuar?')) {
      MobiDB.resetDemo();
      MobiUtils.toast('Dados de demonstração restaurados.', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 700);
    }
  });
})();
