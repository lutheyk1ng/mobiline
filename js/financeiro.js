/* MobiLine - financeiro.js */
(function () {
  const session = MobiLayout.initPage({ page: 'financeiro', title: 'Financeiro', crumb: 'MobiLine / Financeiro' });
  if (!session) return;

  const hoje = new Date(2026, 8, 17);
  let chartInstance = null;
  let currentRange = { start: startOfMonth(hoje), end: hoje };

  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function startOfWeek(d) { const day = d.getDay(); const diff = d.getDate() - day; return new Date(d.getFullYear(), d.getMonth(), diff); }
  function startOfYear(d) { return new Date(d.getFullYear(), 0, 1); }

  function inRange(dateStr, start, end) {
    const d = MobiUtils.parseDate(dateStr);
    if (!d) return false;
    return d >= start && d <= end;
  }

  function renderMetrics() {
    const pagamentos = MobiDB.getAll('pagamentos');
    const despesas = MobiDB.getAll('despesas');

    const receitaPeriodo = pagamentos.reduce((s, pg) => inRange(pg.vencimento, currentRange.start, currentRange.end) ? s + pg.valorPago : s, 0);
    const despesaPeriodo = despesas.reduce((s, d) => inRange(d.data, currentRange.start, currentRange.end) ? s + d.valor : s, 0);
    const saldoPeriodo = receitaPeriodo - despesaPeriodo;

    const receitaAnual = pagamentos.reduce((s, pg) => { const d = MobiUtils.parseDate(pg.vencimento); return d && d.getFullYear() === hoje.getFullYear() ? s + pg.valorPago : s; }, 0);
    const totalRecebido = pagamentos.reduce((s, pg) => s + pg.valorPago, 0);
    const totalPendente = pagamentos.filter(pg => pg.situacao === 'Pendente').reduce((s, pg) => s + (pg.valorTotal - pg.valorPago), 0);
    const totalVencido = pagamentos.filter(pg => pg.situacao === 'Expirado').reduce((s, pg) => s + (pg.valorTotal - pg.valorPago), 0);

    const metrics = [
      { icon: 'bi-cash-coin', tone: 'green', value: MobiUtils.formatCurrency(receitaPeriodo), label: 'Receita no período', sub: 'Recebido' },
      { icon: 'bi-graph-up-arrow', tone: 'gold', value: MobiUtils.formatCurrency(receitaAnual), label: 'Receita anual', sub: hoje.getFullYear() },
      { icon: 'bi-wallet2', tone: 'blue', value: MobiUtils.formatCurrency(totalRecebido), label: 'Total recebido', sub: 'Histórico completo' },
      { icon: 'bi-hourglass-split', tone: 'orange', value: MobiUtils.formatCurrency(totalPendente), label: 'Total pendente', sub: 'A receber' },
      { icon: 'bi-x-octagon-fill', tone: 'red', value: MobiUtils.formatCurrency(totalVencido), label: 'Total vencido', sub: 'Requer cobrança' },
      { icon: 'bi-receipt', tone: 'purple', value: MobiUtils.formatCurrency(despesaPeriodo), label: 'Despesas no período', sub: 'Custos operacionais' },
      { icon: 'bi-piggy-bank-fill', tone: saldoPeriodo >= 0 ? 'green' : 'red', value: MobiUtils.formatCurrency(saldoPeriodo), label: 'Saldo do período', sub: saldoPeriodo >= 0 ? 'Positivo' : 'Negativo' },
    ];

    document.getElementById('metricsGrid').innerHTML = metrics.map(m => `
      <div class="metric-card">
        <div class="metric-icon icon-tone-${m.tone}"><i class="bi ${m.icon}"></i></div>
        <div class="metric-value">${m.value}</div>
        <div class="metric-label">${m.label}</div>
        <div class="metric-sub">${m.sub}</div>
      </div>`).join('');
  }

  function renderChart() {
    const historico = MobiDB.getAll('historicoFinanceiro');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(document.getElementById('chartFinanceiro'), {
      type: 'bar',
      data: {
        labels: historico.map(h => h.mes),
        datasets: [
          { label: 'Receitas', data: historico.map(h => h.receitas), backgroundColor: '#6B4226', borderRadius: 6, barThickness: 18 },
          { label: 'Despesas', data: historico.map(h => h.despesas), backgroundColor: '#E4B979', borderRadius: 6, barThickness: 18 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${MobiUtils.formatCurrency(ctx.parsed.y)}` } } },
        scales: { y: { ticks: { callback: (v) => 'R$ ' + (v / 1000) + 'mil' }, grid: { color: '#EFEAE1' } }, x: { grid: { display: false } } },
      },
    });
  }

  function renderDespesas() {
    const despesas = [...MobiDB.getAll('despesas')].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    document.getElementById('despesasBody').innerHTML = despesas.map(d => `
      <tr>
        <td class="cell-primary">${MobiUtils.escapeHtml(d.descricao)}</td>
        <td><span class="badge-pill badge-muted">${MobiUtils.escapeHtml(d.categoria)}</span></td>
        <td>${MobiUtils.formatCurrency(d.valor)}</td>
        <td class="cell-muted">${MobiUtils.formatDate(d.data)}</td>
      </tr>`).join('') || `<tr><td colspan="4"><div class="empty-state">Nenhuma despesa registrada.</div></td></tr>`;
  }

  function setActiveRangeButton(key) {
    document.querySelectorAll('[data-range]').forEach(btn => {
      btn.classList.toggle('btn-primary', btn.dataset.range === key);
      btn.classList.toggle('btn-outline', btn.dataset.range !== key);
    });
  }

  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.range;
      setActiveRangeButton(key);
      if (key === 'hoje') currentRange = { start: hoje, end: hoje };
      if (key === 'semana') currentRange = { start: startOfWeek(hoje), end: hoje };
      if (key === 'mes') currentRange = { start: startOfMonth(hoje), end: hoje };
      if (key === 'ano') currentRange = { start: startOfYear(hoje), end: hoje };
      renderMetrics();
    });
  });

  document.getElementById('btnRangePersonalizado').addEventListener('click', () => {
    const ini = document.getElementById('rangeInicio').value;
    const fim = document.getElementById('rangeFim').value;
    if (!ini || !fim) { MobiUtils.toast('Selecione as duas datas do período.', 'danger'); return; }
    setActiveRangeButton('personalizado');
    currentRange = { start: MobiUtils.parseDate(ini), end: MobiUtils.parseDate(fim) };
    renderMetrics();
    MobiUtils.toast('Período personalizado aplicado.', 'success');
  });

  renderMetrics();
  renderChart();
  renderDespesas();
})();
