/* MobiLine - relatorios.js */
(function () {
  const session = MobiLayout.initPage({ page: 'relatorios', title: 'Relatórios', crumb: 'MobiLine / Relatórios' });
  if (!session) return;

  let activeTab = 'clientes';
  let currentHeaders = [];
  let currentRows = [];

  const REPORTS = {
    clientes: {
      title: 'Relatório de clientes',
      headers: ['Nome', 'Telefone', 'E-mail', 'Cadastro', 'Projetos'],
      rows: () => MobiDB.getAll('clientes').map(c => [
        c.nome, c.telefone, c.email, MobiUtils.formatDate(c.dataCadastro),
        MobiDB.getAll('projetos').filter(p => p.clienteId === c.id).length,
      ]),
    },
    projetos: {
      title: 'Relatório de projetos',
      headers: ['Projeto', 'Cliente', 'Status', 'Entrega', 'Valor'],
      rows: () => MobiDB.getAll('projetos').map(p => [
        p.nome, (MobiDB.findById('clientes', p.clienteId) || {}).nome || '—', p.status,
        MobiUtils.formatDate(p.dataEntrega), MobiUtils.formatCurrency(p.valorTotal),
      ]),
    },
    financeiro: {
      title: 'Relatório financeiro (histórico mensal)',
      headers: ['Mês', 'Receitas', 'Despesas', 'Saldo'],
      rows: () => MobiDB.getAll('historicoFinanceiro').map(h => [
        h.mes, MobiUtils.formatCurrency(h.receitas), MobiUtils.formatCurrency(h.despesas), MobiUtils.formatCurrency(h.receitas - h.despesas),
      ]),
    },
    pagamentos: {
      title: 'Relatório de pagamentos',
      headers: ['Projeto', 'Cliente', 'Total', 'Pago', 'Restante', 'Situação'],
      rows: () => MobiDB.getAll('pagamentos').map(pg => [
        (MobiDB.findById('projetos', pg.projetoId) || {}).nome || '—',
        (MobiDB.findById('clientes', pg.clienteId) || {}).nome || '—',
        MobiUtils.formatCurrency(pg.valorTotal), MobiUtils.formatCurrency(pg.valorPago),
        MobiUtils.formatCurrency(pg.valorTotal - pg.valorPago), pg.situacao,
      ]),
    },
    estoque: {
      title: 'Relatório de estoque',
      headers: ['Produto', 'Categoria', 'Quantidade', 'Estoque mínimo', 'Status'],
      rows: () => MobiDB.getAll('produtos').map(p => {
        const status = p.quantidade <= 0 ? 'Sem estoque' : p.quantidade <= p.estoqueMinimo ? 'Estoque baixo' : 'Disponível';
        return [p.nome, p.categoria, `${p.quantidade} ${p.unidade || ''}`, p.estoqueMinimo, status];
      }),
    },
  };

  function renderReport() {
    const report = REPORTS[activeTab];
    document.getElementById('reportTitle').textContent = report.title;
    currentHeaders = report.headers;
    currentRows = report.rows();

    document.querySelector('#reportTable thead').innerHTML = `<tr>${currentHeaders.map(h => `<th>${h}</th>`).join('')}</tr>`;
    document.querySelector('#reportTable tbody').innerHTML = currentRows.map(row => `<tr>${row.map(cell => `<td>${MobiUtils.escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
      || `<tr><td colspan="${currentHeaders.length}"><div class="empty-state">Nenhum dado disponível para este relatório.</div></td></tr>`;
  }

  document.querySelectorAll('.report-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.report-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      renderReport();
    });
  });

  document.getElementById('btnImprimir').addEventListener('click', () => window.print());

  document.getElementById('btnExportar').addEventListener('click', () => {
    const lines = [currentHeaders.join(';'), ...currentRows.map(r => r.map(c => String(c).replace(/;/g, ',')).join(';'))];
    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobiline_relatorio_${activeTab}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    MobiUtils.toast('Relatório exportado em CSV.', 'success');
  });

  renderReport();
})();
