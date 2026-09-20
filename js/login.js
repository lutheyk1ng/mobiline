/* MobiLine - login.js */
(function () {
  // Se já está logado, vai direto para o dashboard
  if (MobiLayout.getSession()) {
    window.location.href = 'dashboard.html';
    return;
  }

  MobiDB.load(); // garante que a base seed exista

  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const togglePass = document.getElementById('togglePass');
  const senhaInput = document.getElementById('loginSenha');

  togglePass.addEventListener('click', () => {
    const isPass = senhaInput.type === 'password';
    senhaInput.type = isPass ? 'text' : 'password';
    togglePass.innerHTML = isPass ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
  });

  document.getElementById('forgotLink').addEventListener('click', (e) => {
    e.preventDefault();
    MobiUtils.toast('Um link de redefinição seria enviado ao seu e-mail (demonstração).', 'info');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const senha = senhaInput.value;

    const usuarios = MobiDB.getAll('usuarios');
    const found = usuarios.find(u => u.email.toLowerCase() === email && u.senha === senha);

    if (!found) {
      errorBox.classList.add('show');
      return;
    }
    errorBox.classList.remove('show');
    MobiLayout.setSession({ id: found.id, nome: found.nome, email: found.email, papel: found.papel });
    window.location.href = 'dashboard.html';
  });
})();
