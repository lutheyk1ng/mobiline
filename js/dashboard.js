/* MobiLine - dashboard.js */
(function () {
  const session = MobiLayout.initPage({ page: 'dashboard', title: 'Painel', crumb: '' });
  if (!session) return;

  const clientes = MobiDB.getAll('clientes');
  const projetos = MobiDB.getAll('projetos');
  const pagamentos = MobiDB.getAll('pagamentos');
  const eventos = MobiDB.getAll('eventos');
  const historico = MobiDB.getAll('historicoFinanceiro');

  const hoje = new Date(2026, 8, 17); // referência fixa dentro do conjunto de dados de demonstração
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  /* ---------- Métricas ---------- */
  const totalClientes = clientes.length;
  const emAndamento = projetos.filter(p => p.status === 'Em andamento').length;
  const atrasados = projetos.filter(p => p.status === 'Atrasado').length;
  const agendados = projetos.filter(p => p.status === 'Reservado').length;

  const pagamentosPendentes = pagamentos.filter(pg => pg.situacao === 'Pendente');
  const totalPendente = pagamentosPendentes.reduce((s, pg) => s + (pg.valorTotal - pg.valorPago), 0);
  const pagamentosExpirados = pagamentos.filter(pg => pg.situacao === 'Expirado');

  const receitaMensal = pagamentos.reduce((s, pg) => {
    const d = MobiUtils.parseDate(pg.vencimento);
    if (d && d.getMonth() === mesAtual && d.getFullYear() === anoAtual) return s + pg.valorPago;
    return s;
  }, 0);
  const receitaAnual = pagamentos.reduce((s, pg) => {
    const d = MobiUtils.parseDate(pg.vencimento);
    if (d && d.getFullYear() === anoAtual) return s + pg.valorPago;
    return s;
  }, 0);

  const proximasEntregas = projetos.filter(p => {
    const diff = MobiUtils.daysDiffFromToday(p.dataEntrega);
    return p.status !== 'Concluído' && diff !== null && diff >= 0 && diff <= 7;
  });

  const metrics = [
    { icon: 'bi-people-fill', tone: 'blue', value: totalClientes, label: 'Clientes', sub: 'Total cadastrados' },
    { icon: 'bi-kanban-fill', tone: 'brown', value: emAndamento, label: 'Projetos em andamento', sub: 'Em produção agora' },
    { icon: 'bi-exclamation-triangle-fill', tone: 'red', value: atrasados, label: 'Projetos atrasados', sub: atrasados ? 'Requer atenção' : 'Tudo em dia' },
    { icon: 'bi-calendar-check-fill', tone: 'purple', value: agendados, label: 'Projetos agendados', sub: 'Reservados' },
    { icon: 'bi-hourglass-split', tone: 'orange', value: MobiUtils.formatCurrency(totalPendente), label: 'Pagamentos pendentes', sub: `${pagamentosPendentes.length} em aberto` },
    { icon: 'bi-x-octagon-fill', tone: 'red', value: pagamentosExpirados.length, label: 'Pagamentos expirados', sub: 'Vencidos' },
    { icon: 'bi-cash-coin', tone: 'green', value: MobiUtils.formatCurrency(receitaMensal), label: 'Receita mensal', sub: 'Recebido no mês' },
    { icon: 'bi-graph-up-arrow', tone: 'gold', value: MobiUtils.formatCurrency(receitaAnual), label: 'Receita anual', sub: 'Acumulado no ano' },
    { icon: 'bi-truck', tone: 'blue', value: proximasEntregas.length, label: 'Próximas entregas', sub: 'Nos próximos 7 dias' },
  ];

  document.getElementById('metricsGrid').innerHTML = metrics.map(m => `
    <div class="metric-card">
      <div class="metric-icon icon-tone-${m.tone}"><i class="bi ${m.icon}"></i></div>
      <div class="metric-value">${m.value}</div>
      <div class="metric-label">${m.label}</div>
      <div class="metric-sub">${m.sub}</div>
    </div>
  `).join('');

  /* ---------- Gráfico Receitas x Despesas (área) ---------- */
  new Chart(document.getElementById('chartFinanceiro'), {
    type: 'line',
    data: {
      labels: historico.map(h => h.mes),
      datasets: [
        {
          label: 'Receitas',
          data: historico.map(h => h.receitas),
          borderColor: '#6B4226',
          backgroundColor: 'rgba(107,66,38,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#6B4226',
        },
        {
          label: 'Despesas',
          data: historico.map(h => h.despesas),
          borderColor: '#BC7E3E',
          backgroundColor: 'rgba(188,126,62,0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#BC7E3E',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 12 } } },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${MobiUtils.formatCurrency(ctx.parsed.y)}` },
        },
      },
      scales: {
        y: { ticks: { callback: (v) => 'R$ ' + (v / 1000) + 'mil', font: { size: 11 } }, grid: { color: '#EFEAE1' } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });

  /* ---------- Gráfico de projetos (donut) ---------- */
  const statusOrder = ['Em andamento', 'Reservado', 'Concluído', 'Atrasado'];
  const statusColors = { 'Em andamento': '#3768A3', 'Reservado': '#7A5CA8', 'Concluído': '#2F8A57', 'Atrasado': '#C4443A' };
  const statusCounts = statusOrder.map(s => projetos.filter(p => p.status === s).length);

  new Chart(document.getElementById('chartProjetos'), {
    type: 'doughnut',
    data: {
      labels: statusOrder,
      datasets: [{ data: statusCounts, backgroundColor: statusOrder.map(s => statusColors[s]), borderWidth: 0, hoverOffset: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} projeto(s)` } } },
    },
  });
  document.getElementById('legendProjetos').innerHTML = statusOrder.map((s, i) => `
    <div class="legend-row">
      <span class="legend-label"><span class="legend-dot" style="background:${statusColors[s]}"></span>${s}</span>
      <span class="legend-value">${statusCounts[i]}</span>
    </div>`).join('');

  /* ---------- Gráfico de pagamentos (donut) ---------- */
  const pagOrder = ['Pago', 'Pendente', 'Expirado'];
  const pagColors = { 'Pago': '#2F8A57', 'Pendente': '#C0791E', 'Expirado': '#C4443A' };
  const pagValues = pagOrder.map(s => pagamentos.filter(pg => pg.situacao === s).reduce((sum, pg) => sum + pg.valorTotal, 0));

  new Chart(document.getElementById('chartPagamentos'), {
    type: 'doughnut',
    data: {
      labels: pagOrder,
      datasets: [{ data: pagValues, backgroundColor: pagOrder.map(s => pagColors[s]), borderWidth: 0, hoverOffset: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${MobiUtils.formatCurrency(ctx.parsed)}` } } },
    },
  });
  document.getElementById('legendPagamentos').innerHTML = pagOrder.map((s, i) => `
    <div class="legend-row">
      <span class="legend-label"><span class="legend-dot" style="background:${pagColors[s]}"></span>${s}</span>
      <span class="legend-value">${MobiUtils.formatCurrency(pagValues[i])}</span>
    </div>`).join('');

  /* ---------- Tabela de projetos em andamento ---------- */
  const projetosAtivos = projetos
    .filter(p => p.status !== 'Concluído')
    .sort((a, b) => (a.dataEntrega || '').localeCompare(b.dataEntrega || ''))
    .slice(0, 6);

  document.querySelector('#tableProjetos tbody').innerHTML = projetosAtivos.map(p => {
    const cliente = MobiDB.findById('clientes', p.clienteId);
    const deadline = MobiUtils.deadlineLabel(p.dataEntrega);
    return `
      <tr>
        <td><div class="row-with-thumb"><div class="row-thumb"><i class="bi bi-box-seam"></i></div><span class="cell-primary">${MobiUtils.escapeHtml(p.nome)}</span></div></td>
        <td>${cliente ? MobiUtils.escapeHtml(cliente.nome) : '—'}</td>
        <td><span class="badge-pill ${MobiUtils.statusBadgeClass(p.status)}">${p.status}</span></td>
        <td><span class="cell-muted" style="color:${deadline.tone === 'danger' ? 'var(--danger)' : deadline.tone === 'warning' ? 'var(--warning)' : 'var(--text-muted)'}">${deadline.text}</span></td>
        <td class="cell-primary">${MobiUtils.formatCurrency(p.valorTotal)}</td>
        <td style="text-align:right;"><a href="projetos.html" class="btn btn-ghost btn-sm"><i class="bi bi-arrow-up-right"></i></a></td>
      </tr>`;
  }).join('') || `<tr><td colspan="6"><div class="empty-state"><i class="bi bi-inboxes"></i>Nenhum projeto ativo no momento.</div></td></tr>`;

  /* ---------- Próximos agendamentos ---------- */
  const proximos = eventos
    .filter(e => MobiUtils.daysDiffFromToday(e.data) >= -1)
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
    .slice(0, 4);

  document.getElementById('listAgendamentos').innerHTML = proximos.map(ev => {
    const cliente = MobiDB.findById('clientes', ev.clienteId);
    return `
      <div class="notif-item" style="padding:14px 22px;">
        <div class="row-thumb" style="background:var(--info-bg); color:var(--info);"><i class="bi bi-calendar-event"></i></div>
        <div style="flex:1;">
          <div class="notif-text" style="font-weight:600;">${MobiUtils.escapeHtml(ev.titulo)}</div>
          <div class="notif-time">${cliente ? MobiUtils.escapeHtml(cliente.nome) + ' · ' : ''}${MobiUtils.formatDate(ev.data)} ${ev.horario}</div>
        </div>
      </div>`;
  }).join('') || `<div class="empty-state"><i class="bi bi-calendar-x"></i>Nenhum agendamento próximo.</div>`;

  /* ---------- Últimos clientes cadastrados ---------- */
  const ultimosClientes = [...clientes].sort((a, b) => (b.dataCadastro || '').localeCompare(a.dataCadastro || '')).slice(0, 4);
  document.getElementById('listClientes').innerHTML = ultimosClientes.map(c => `
    <div class="notif-item" style="padding:14px 22px;">
      <div class="avatar-sm">${MobiUtils.initials(c.nome)}</div>
      <div style="flex:1;">
        <div class="notif-text" style="font-weight:600;">${MobiUtils.escapeHtml(c.nome)}</div>
        <div class="notif-time">${MobiUtils.escapeHtml(c.email)}</div>
      </div>
      <div class="notif-time">${MobiUtils.formatDate(c.dataCadastro)}</div>
    </div>
  `).join('') || `<div class="empty-state"><i class="bi bi-person-x"></i>Nenhum cliente cadastrado.</div>`;
})();
