/* MobiLine - data.js
   Camada de dados. Tudo é persistido em localStorage sob a chave MOBI_DB_KEY.
   A estrutura foi pensada para, no futuro, ser substituída por chamadas reais
   a uma API/backend (ver README.md -> seção "Integração com banco de dados").
*/

const MobiDB = (() => {
  const MOBI_DB_KEY = 'mobiline_db_v1';

  function seed() {
    const clientes = [
      { id: 'cli_1', nome: 'Juliana Martins', telefone: '(11) 98211-4432', email: 'juliana.martins@email.com', endereco: 'Rua das Acácias, 210 - São Paulo/SP', documento: '321.654.987-00', observacoes: 'Prefere contato por WhatsApp.', dataCadastro: '2026-03-02' },
      { id: 'cli_2', nome: 'Carlos Oliveira', telefone: '(11) 97744-2210', email: 'carlos.oliveira@email.com', endereco: 'Av. Paulista, 1500, apto 82 - São Paulo/SP', documento: '198.432.765-00', observacoes: '', dataCadastro: '2026-03-18' },
      { id: 'cli_3', nome: 'Ana Paula Silva', telefone: '(11) 99120-5567', email: 'anapaula.silva@email.com', endereco: 'Rua Girassol, 88 - Osasco/SP', documento: '456.123.789-00', observacoes: 'Segundo projeto com a MobiLine.', dataCadastro: '2026-04-05' },
      { id: 'cli_4', nome: 'Fernanda Costa', telefone: '(11) 98890-1123', email: 'fernanda.costa@email.com', endereco: 'Rua dos Ipês, 45 - São Paulo/SP', documento: '789.456.123-00', observacoes: '', dataCadastro: '2026-05-24' },
      { id: 'cli_5', nome: 'João Mendes', telefone: '(11) 97012-3345', email: 'joao.mendes@email.com', endereco: 'Alameda Santos, 320 - São Paulo/SP', documento: '12.345.678/0001-90', observacoes: 'Cliente pessoa jurídica (escritório).', dataCadastro: '2026-05-24' },
      { id: 'cli_6', nome: 'Larissa Souza', telefone: '(11) 96678-9021', email: 'larissa.souza@email.com', endereco: 'Rua Tucumã, 77 - Barueri/SP', documento: '654.789.321-00', observacoes: '', dataCadastro: '2026-05-23' },
      { id: 'cli_7', nome: 'Ricardo Pereira', telefone: '(11) 99887-6612', email: 'ricardo.pereira@email.com', endereco: 'Rua Bela Vista, 12 - São Paulo/SP', documento: '852.741.963-00', observacoes: 'Indicado pela cliente Fernanda Costa.', dataCadastro: '2026-05-22' },
    ];

    const projetos = [
      { id: 'proj_1', nome: 'Cozinha Planejada', clienteId: 'cli_1', dataCriacao: '2026-08-10', dataEntrega: '2026-09-27', valorTotal: 7850, responsavel: 'Equipe de Produção A', observacoes: 'Cozinha em L com ilha central.', status: 'Em andamento' },
      { id: 'proj_2', nome: 'Guarda-Roupa', clienteId: 'cli_2', dataCriacao: '2026-08-14', dataEntrega: '2026-09-30', valorTotal: 4600, responsavel: 'Equipe de Produção B', observacoes: '6 portas, com espelho central.', status: 'Em andamento' },
      { id: 'proj_3', nome: 'Sala de TV', clienteId: 'cli_3', dataCriacao: '2026-08-20', dataEntrega: '2026-09-28', valorTotal: 3200, responsavel: 'Equipe de Instalação', observacoes: 'Painel ripado com nichos.', status: 'Reservado' },
      { id: 'proj_4', nome: 'Closet', clienteId: 'cli_4', dataCriacao: '2026-07-02', dataEntrega: '2026-09-10', valorTotal: 5100, responsavel: 'Equipe de Produção A', observacoes: 'Closet em U com ilha.', status: 'Atrasado' },
      { id: 'proj_5', nome: 'Painel de TV', clienteId: 'cli_5', dataCriacao: '2026-08-28', dataEntrega: '2026-10-05', valorTotal: 2450, responsavel: 'Equipe de Instalação', observacoes: '', status: 'Em andamento' },
      { id: 'proj_6', nome: 'Home Office', clienteId: 'cli_6', dataCriacao: '2026-08-30', dataEntrega: '2026-10-12', valorTotal: 3890, responsavel: 'Equipe de Produção B', observacoes: 'Bancada com gaveteiro e estante.', status: 'Reservado' },
      { id: 'proj_7', nome: 'Cozinha Compacta', clienteId: 'cli_7', dataCriacao: '2026-06-15', dataEntrega: '2026-08-30', valorTotal: 6200, responsavel: 'Equipe de Produção A', observacoes: '', status: 'Atrasado' },
      { id: 'proj_8', nome: 'Escritório Planejado', clienteId: 'cli_1', dataCriacao: '2026-05-10', dataEntrega: '2026-06-20', valorTotal: 5400, responsavel: 'Equipe de Produção B', observacoes: 'Entregue e aprovado pela cliente.', status: 'Concluído' },
      { id: 'proj_9', nome: 'Rack Suspenso', clienteId: 'cli_3', dataCriacao: '2026-04-18', dataEntrega: '2026-05-30', valorTotal: 1980, responsavel: 'Equipe de Instalação', observacoes: '', status: 'Concluído' },
    ];

    const pagamentos = [
      { id: 'pag_1', projetoId: 'proj_1', clienteId: 'cli_1', valorTotal: 7850, valorPago: 3925, formaPagamento: 'Cartão de crédito', parcelas: 3, vencimento: '2026-09-25', situacao: 'Pendente' },
      { id: 'pag_2', projetoId: 'proj_2', clienteId: 'cli_2', valorTotal: 4600, valorPago: 4600, formaPagamento: 'PIX', parcelas: 1, vencimento: '2026-08-30', situacao: 'Pago' },
      { id: 'pag_3', projetoId: 'proj_3', clienteId: 'cli_3', valorTotal: 3200, valorPago: 1600, formaPagamento: 'Boleto', parcelas: 2, vencimento: '2026-09-20', situacao: 'Pendente' },
      { id: 'pag_4', projetoId: 'proj_4', clienteId: 'cli_4', valorTotal: 5100, valorPago: 1500, formaPagamento: 'Cartão de crédito', parcelas: 4, vencimento: '2026-09-05', situacao: 'Expirado' },
      { id: 'pag_5', projetoId: 'proj_5', clienteId: 'cli_5', valorTotal: 2450, valorPago: 0, formaPagamento: 'PIX', parcelas: 1, vencimento: '2026-09-22', situacao: 'Pendente' },
      { id: 'pag_6', projetoId: 'proj_6', clienteId: 'cli_6', valorTotal: 3890, valorPago: 1000, formaPagamento: 'Boleto', parcelas: 3, vencimento: '2026-09-12', situacao: 'Expirado' },
      { id: 'pag_7', projetoId: 'proj_7', clienteId: 'cli_7', valorTotal: 6200, valorPago: 2000, formaPagamento: 'Cartão de crédito', parcelas: 5, vencimento: '2026-09-08', situacao: 'Expirado' },
      { id: 'pag_8', projetoId: 'proj_8', clienteId: 'cli_1', valorTotal: 5400, valorPago: 5400, formaPagamento: 'PIX', parcelas: 1, vencimento: '2026-06-18', situacao: 'Pago' },
      { id: 'pag_9', projetoId: 'proj_9', clienteId: 'cli_3', valorTotal: 1980, valorPago: 1980, formaPagamento: 'Dinheiro', parcelas: 1, vencimento: '2026-05-28', situacao: 'Pago' },
    ];

    const eventos = [
      { id: 'evt_1', titulo: 'Entrega - Cozinha Planejada', clienteId: 'cli_1', projetoId: 'proj_1', data: '2026-09-27', horario: '09:00', tipo: 'Entrega', observacao: 'Levar equipe de montagem completa.' },
      { id: 'evt_2', titulo: 'Instalação - Sala de TV', clienteId: 'cli_3', projetoId: 'proj_3', data: '2026-09-28', horario: '14:00', tipo: 'Instalação', observacao: '' },
      { id: 'evt_3', titulo: 'Medição - Guarda-Roupa', clienteId: 'cli_2', projetoId: 'proj_2', data: '2026-09-19', horario: '10:00', tipo: 'Medição', observacao: 'Conferir vão da parede.' },
      { id: 'evt_4', titulo: 'Reunião - Novo orçamento', clienteId: 'cli_6', projetoId: 'proj_6', data: '2026-09-18', horario: '11:30', tipo: 'Reunião', observacao: 'Apresentar proposta do home office.' },
      { id: 'evt_5', titulo: 'Visita técnica', clienteId: 'cli_7', projetoId: 'proj_7', data: '2026-09-22', horario: '15:00', tipo: 'Visita', observacao: 'Avaliar ajuste da cozinha compacta.' },
      { id: 'evt_6', titulo: 'Entrega - Painel de TV', clienteId: 'cli_5', projetoId: 'proj_5', data: '2026-10-05', horario: '09:30', tipo: 'Entrega', observacao: '' },
    ];

    const orcamentos = [
      { id: 'orc_1', clienteId: 'cli_6', projetoNome: 'Home Office', descricao: 'Bancada, gaveteiro e estante para home office.', itens: [{ nome: 'Bancada MDF', quantidade: 1, valorUnitario: 1800 }, { nome: 'Gaveteiro', quantidade: 1, valorUnitario: 950 }, { nome: 'Estante suspensa', quantidade: 2, valorUnitario: 620 }], desconto: 100, validade: '2026-09-30', status: 'Aprovado' },
      { id: 'orc_2', clienteId: 'cli_7', projetoNome: 'Cozinha Compacta - Ajustes', descricao: 'Complemento de módulos superiores.', itens: [{ nome: 'Módulo superior', quantidade: 2, valorUnitario: 780 }], desconto: 0, validade: '2026-09-25', status: 'Enviado' },
      { id: 'orc_3', clienteId: 'cli_4', projetoNome: 'Sapateira', descricao: 'Sapateira planejada para hall de entrada.', itens: [{ nome: 'Sapateira 1,20m', quantidade: 1, valorUnitario: 1450 }], desconto: 50, validade: '2026-09-10', status: 'Expirado' },
      { id: 'orc_4', clienteId: 'cli_2', projetoNome: 'Escritório', descricao: 'Orçamento inicial em análise pelo cliente.', itens: [{ nome: 'Mesa planejada', quantidade: 1, valorUnitario: 2100 }, { nome: 'Estante', quantidade: 1, valorUnitario: 1300 }], desconto: 0, validade: '2026-10-02', status: 'Rascunho' },
      { id: 'orc_5', clienteId: 'cli_5', projetoNome: 'Recepção', descricao: 'Balcão de recepção para escritório.', itens: [{ nome: 'Balcão recepção', quantidade: 1, valorUnitario: 2600 }], desconto: 200, validade: '2026-08-15', status: 'Recusado' },
    ];

    const produtos = [
      { id: 'prod_1', nome: 'Chapa MDF Branco 18mm', categoria: 'Matéria-prima', quantidade: 42, unidade: 'un', estoqueMinimo: 15, fornecedorId: 'forn_1' },
      { id: 'prod_2', nome: 'Chapa MDF Carvalho 18mm', categoria: 'Matéria-prima', quantidade: 8, unidade: 'un', estoqueMinimo: 10, fornecedorId: 'forn_1' },
      { id: 'prod_3', nome: 'Dobradiça soft-close', categoria: 'Ferragem', quantidade: 210, unidade: 'un', estoqueMinimo: 100, fornecedorId: 'forn_2' },
      { id: 'prod_4', nome: 'Corrediça telescópica 45cm', categoria: 'Ferragem', quantidade: 0, unidade: 'par', estoqueMinimo: 20, fornecedorId: 'forn_2' },
      { id: 'prod_5', nome: 'Puxador Alumínio 15cm', categoria: 'Acabamento', quantidade: 65, unidade: 'un', estoqueMinimo: 30, fornecedorId: 'forn_3' },
      { id: 'prod_6', nome: 'Fita de borda Branco', categoria: 'Acabamento', quantidade: 12, unidade: 'rolo', estoqueMinimo: 5, fornecedorId: 'forn_1' },
      { id: 'prod_7', nome: 'Parafuso 4x40mm', categoria: 'Ferragem', quantidade: 1500, unidade: 'un', estoqueMinimo: 500, fornecedorId: 'forn_2' },
      { id: 'prod_8', nome: 'Vidro temperado 8mm', categoria: 'Vidraçaria', quantidade: 3, unidade: 'placa', estoqueMinimo: 4, fornecedorId: 'forn_4' },
    ];

    const fornecedores = [
      { id: 'forn_1', nome: 'Roberto Lima', empresa: 'Madeplac Chapas e Laminados', telefone: '(11) 3221-8890', email: 'contato@madeplac.com.br', endereco: 'Av. Industrial, 900 - Guarulhos/SP', documento: '12.456.789/0001-11', produtos: 'Chapas de MDF, fitas de borda', observacoes: 'Entrega em até 5 dias úteis.' },
      { id: 'forn_2', nome: 'Simone Ferraz', empresa: 'Ferrag Componentes', telefone: '(11) 3345-1120', email: 'vendas@ferrag.com.br', endereco: 'Rua dos Metais, 55 - São Paulo/SP', documento: '23.567.890/0001-22', produtos: 'Dobradiças, corrediças, parafusos', observacoes: '' },
      { id: 'forn_3', nome: 'Marcos Vidal', empresa: 'Vidal Acabamentos', telefone: '(11) 3789-4432', email: 'marcos@vidalacab.com.br', endereco: 'Rua Prata, 210 - Diadema/SP', documento: '34.678.901/0001-33', produtos: 'Puxadores, perfis de alumínio', observacoes: 'Pedido mínimo de R$ 500.' },
      { id: 'forn_4', nome: 'Patrícia Nunes', empresa: 'Nunes Vidraçaria', telefone: '(11) 3990-7765', email: 'patricia@nunesvidros.com.br', endereco: 'Av. do Vidro, 320 - São Bernardo/SP', documento: '45.789.012/0001-44', produtos: 'Vidros e espelhos', observacoes: '' },
    ];

    const usuarios = [
      { id: 'user_admin', nome: 'Admin MobiLine', email: 'admin@mobiline.com', senha: 'admin123', papel: 'Administrador' },
      { id: 'user_func', nome: 'Equipe MobiLine', email: 'equipe@mobiline.com', senha: 'equipe123', papel: 'Funcionário' },
    ];

    const despesas = [
      { id: 'desp_1', descricao: 'Compra de matéria-prima', categoria: 'Insumos', valor: 3200, data: '2026-09-03' },
      { id: 'desp_2', descricao: 'Folha de pagamento', categoria: 'Pessoal', valor: 9800, data: '2026-09-05' },
      { id: 'desp_3', descricao: 'Aluguel da oficina', categoria: 'Fixo', valor: 4200, data: '2026-09-05' },
      { id: 'desp_4', descricao: 'Combustível e entregas', categoria: 'Logística', valor: 950, data: '2026-09-10' },
      { id: 'desp_5', descricao: 'Manutenção de máquinas', categoria: 'Manutenção', valor: 1100, data: '2026-09-12' },
    ];

    // Histórico simplificado de receitas x despesas dos últimos 6 meses (para o gráfico financeiro)
    const historicoFinanceiro = [
      { mes: 'Abr', receitas: 18200, despesas: 11400 },
      { mes: 'Mai', receitas: 21500, despesas: 12800 },
      { mes: 'Jun', receitas: 19800, despesas: 13100 },
      { mes: 'Jul', receitas: 23400, despesas: 14200 },
      { mes: 'Ago', receitas: 26700, despesas: 15600 },
      { mes: 'Set', receitas: 24800, despesas: 19250 },
    ];

    return { clientes, projetos, pagamentos, eventos, orcamentos, produtos, fornecedores, usuarios, despesas, historicoFinanceiro, notificacoesLidas: [] };
  }

  function load() {
    const raw = localStorage.getItem(MOBI_DB_KEY);
    if (!raw) {
      const initial = seed();
      localStorage.setItem(MOBI_DB_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      const initial = seed();
      localStorage.setItem(MOBI_DB_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  function save(db) {
    localStorage.setItem(MOBI_DB_KEY, JSON.stringify(db));
  }

  function getAll(collection) {
    const db = load();
    return db[collection] || [];
  }

  function setAll(collection, list) {
    const db = load();
    db[collection] = list;
    save(db);
    return list;
  }

  function insert(collection, item) {
    const list = getAll(collection);
    list.unshift(item);
    setAll(collection, list);
    return item;
  }

  function update(collection, id, patch) {
    const list = getAll(collection);
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    setAll(collection, list);
    return list[idx];
  }

  function remove(collection, id) {
    const list = getAll(collection).filter(i => i.id !== id);
    setAll(collection, list);
  }

  function findById(collection, id) {
    return getAll(collection).find(i => i.id === id) || null;
  }

  function resetDemo() {
    localStorage.removeItem(MOBI_DB_KEY);
    return load();
  }

  return { load, save, getAll, setAll, insert, update, remove, findById, resetDemo, MOBI_DB_KEY };
})();
