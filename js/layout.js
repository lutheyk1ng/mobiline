/* MobiLine - layout.js
   Monta o "shell" da aplicação (sidebar + topbar) em todas as páginas internas,
   cuida da guarda de autenticação e das notificações dinâmicas. */

const MobiLayout = (() => {

  const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill', href: 'dashboard.html' },
    { key: 'clientes', label: 'Clientes', icon: 'bi-people-fill', href: 'clientes.html' },
    { key: 'projetos', label: 'Projetos', icon: 'bi-kanban-fill', href: 'projetos.html' },
    { key: 'agenda', label: 'Agenda', icon: 'bi-calendar3', href: 'agenda.html' },
    { key: 'orcamentos', label: 'Orçamentos', icon: 'bi-file-earmark-text-fill', href: 'orcamentos.html' },
    { key: 'pagamentos', label: 'Pagamentos', icon: 'bi-credit-card-fill', href: 'pagamentos.html' },
    { key: 'financeiro', label: 'Financeiro', icon: 'bi-graph-up-arrow', href: 'financeiro.html' },
    { key: 'estoque', label: 'Estoque', icon: 'bi-box-seam-fill', href: 'estoque.html' },
    { key: 'fornecedores', label: 'Fornecedores', icon: 'bi-truck', href: 'fornecedores.html' },
    { key: 'relatorios', label: 'Relatórios', icon: 'bi-bar-chart-line-fill', href: 'relatorios.html' },
    { key: 'configuracoes', label: 'Configurações', icon: 'bi-gear-fill', href: 'configuracoes.html' },
  ];

  const SESSION_KEY = 'mobiline_session';

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }

  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function requireAuth() {
    const session = getSession();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    return session;
  }

  function computeNotifications() {
    const projetos = MobiDB.getAll('projetos');
    const pagamentos = MobiDB.getAll('pagamentos');
    const clientes = MobiDB.getAll('clientes');
    const notifications = [];

    projetos.forEach(p => {
      if (p.status === 'Atrasado') {
        const diff = Math.abs(MobiUtils.daysDiffFromToday(p.dataEntrega) || 0);
        notifications.push({ tone: 'danger', icon: '🔴', text: `Projeto "${p.nome}" está atrasado há ${diff} dia(s)`, time: p.dataEntrega });
      }
    });
    pagamentos.forEach(pg => {
      if (pg.situacao === 'Expirado') {
        const proj = MobiDB.findById('projetos', pg.projetoId);
        notifications.push({ tone: 'warning', icon: '🟠', text: `Pagamento vencido${proj ? ' - ' + proj.nome : ''}`, time: pg.vencimento });
      }
    });
    projetos.forEach(p => {
      const diff = MobiUtils.daysDiffFromToday(p.dataEntrega);
      if (diff !== null && diff >= 0 && diff <= 5 && p.status !== 'Concluído') {
        notifications.push({ tone: 'gold', icon: '🟡', text: `Entrega próxima: "${p.nome}" em ${diff} dia(s)`, time: p.dataEntrega });
      }
    });
    [...clientes].sort((a, b) => (b.dataCadastro || '').localeCompare(a.dataCadastro || '')).slice(0, 2).forEach(c => {
      notifications.push({ tone: 'success', icon: '🟢', text: `Novo cliente cadastrado: ${c.nome}`, time: c.dataCadastro });
    });

    notifications.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    return notifications.slice(0, 8);
  }

  function renderSidebar(activeKey) {
    const mount = document.getElementById('sidebarMount');
    if (!mount) return;
    const session = getSession() || { nome: 'Usuário', papel: 'Administrador' };

    const navHtml = NAV_ITEMS.map(item => {
      if (item.key === 'financeiro' || item.key === 'relatorios' || item.key === 'configuracoes') {
        if (item.key === 'financeiro' && session.papel === 'Funcionário') return '';
        if (item.key === 'relatorios' && session.papel === 'Funcionário') return '';
        if (item.key === 'configuracoes' && session.papel === 'Funcionário') return '';
      }
      return `
        <a class="sidebar-link ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
          <i class="bi ${item.icon}"></i><span>${item.label}</span>
        </a>`;
    }).join('');

    mount.innerHTML = `
      <div class="sidebar-brand">
        <img src="assets/logo-icon.png" alt="MobiLine">
        <div>
          <div class="brand-name">MobiLine</div>
          <div class="brand-tagline">ORGANIZE · PLANEJE · CRESÇA</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">Menu principal</div>
        ${navHtml}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar">${MobiUtils.initials(session.nome)}</div>
          <div class="user-meta">
            <div class="user-name">${MobiUtils.escapeHtml(session.nome)}</div>
            <div class="user-role">${MobiUtils.escapeHtml(session.papel)}</div>
          </div>
        </div>
        <button class="sidebar-logout" id="btnLogout"><i class="bi bi-box-arrow-right"></i> Sair</button>
      </div>
    `;

    document.getElementById('btnLogout').addEventListener('click', () => {
      if (MobiUtils.confirmAction('Deseja realmente sair do MobiLine?')) {
        clearSession();
        window.location.href = 'index.html';
      }
    });
  }

  function renderTopbar({ title, crumb }) {
    const mount = document.getElementById('topbarMount');
    if (!mount) return;
    const session = getSession() || { nome: 'Usuário', papel: 'Administrador' };
    const notifications = computeNotifications();

    mount.innerHTML = `
      <div class="topbar-left">
        <button class="menu-toggle" id="btnMenuToggle"><i class="bi bi-list"></i></button>
        <div>
          <div class="topbar-title">${title}</div>
          ${crumb ? `<div class="topbar-crumb">${crumb}</div>` : ''}
        </div>
      </div>
      <div class="topbar-right">
        <div class="period-select">
          <i class="bi bi-calendar-week"></i>
          <select id="periodSelect">
            <option value="hoje">Hoje</option>
            <option value="semana">Esta semana</option>
            <option value="mes" selected>Este mês</option>
            <option value="ano">Este ano</option>
          </select>
        </div>
        <div class="dropdown-wrap">
          <button class="icon-btn" id="btnNotif"><i class="bi bi-bell-fill"></i>${notifications.length ? '<span class="dot"></span>' : ''}</button>
          <div class="dropdown-panel" id="notifPanel">
            <div class="dropdown-header"><span>Notificações</span><a href="#" id="clearNotif">Marcar tudo</a></div>
            <div class="dropdown-list">
              ${notifications.length ? notifications.map(n => `
                <div class="notif-item">
                  <span>${n.icon}</span>
                  <div>
                    <div class="notif-text">${MobiUtils.escapeHtml(n.text)}</div>
                    <div class="notif-time">${MobiUtils.formatDate(n.time)}</div>
                  </div>
                </div>`).join('') : '<div class="notif-item"><span>✅</span><div class="notif-text">Nenhuma notificação por aqui.</div></div>'}
            </div>
          </div>
        </div>
        <div class="dropdown-wrap">
          <div class="profile-chip" id="btnProfile">
            <div class="avatar">${MobiUtils.initials(session.nome)}</div>
            <div class="name-block">
              <div class="name">${MobiUtils.escapeHtml(session.nome)}</div>
              <div class="role">${MobiUtils.escapeHtml(session.papel)}</div>
            </div>
            <i class="bi bi-chevron-down"></i>
          </div>
          <div class="dropdown-panel" id="profilePanel" style="width:220px;">
            <div class="profile-menu-item" onclick="window.location.href='configuracoes.html'"><i class="bi bi-person-fill"></i> Meu perfil</div>
            <div class="profile-menu-item" onclick="window.location.href='configuracoes.html'"><i class="bi bi-gear-fill"></i> Configurações</div>
            <div class="profile-menu-item" id="profileLogout"><i class="bi bi-box-arrow-right"></i> Sair</div>
          </div>
        </div>
      </div>
    `;

    // Interações
    const notifBtn = document.getElementById('btnNotif');
    const notifPanel = document.getElementById('notifPanel');
    const profileBtn = document.getElementById('btnProfile');
    const profilePanel = document.getElementById('profilePanel');

    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profilePanel.classList.remove('open');
      notifPanel.classList.toggle('open');
    });
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.classList.remove('open');
      profilePanel.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      notifPanel.classList.remove('open');
      profilePanel.classList.remove('open');
    });
    document.getElementById('clearNotif').addEventListener('click', (e) => {
      e.preventDefault();
      notifBtn.querySelector('.dot')?.remove();
      notifPanel.querySelector('.dropdown-list').innerHTML = '<div class="notif-item"><span>✅</span><div class="notif-text">Tudo em dia por aqui.</div></div>';
      MobiUtils.toast('Notificações marcadas como lidas.', 'success');
    });
    document.getElementById('profileLogout').addEventListener('click', () => {
      if (MobiUtils.confirmAction('Deseja realmente sair do MobiLine?')) {
        clearSession();
        window.location.href = 'index.html';
      }
    });

    // Menu mobile
    const menuToggle = document.getElementById('btnMenuToggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => toggleMobileSidebar(true));
    }
  }

  function toggleMobileSidebar(open) {
    const sidebar = document.querySelector('.sidebar');
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', () => toggleMobileSidebar(false));
    }
    if (open) {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    } else {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
  }

  function initPage({ page, title, crumb }) {
    const session = requireAuth();
    if (!session) return null;
    renderSidebar(page);
    renderTopbar({ title, crumb });
    return session;
  }

  return { NAV_ITEMS, getSession, setSession, clearSession, requireAuth, initPage, computeNotifications };
})();
