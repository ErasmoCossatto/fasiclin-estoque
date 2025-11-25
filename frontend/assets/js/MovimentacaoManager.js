/**
 * MovimentacaoManager - Gerenciador principal de movimentações de estoque
 * 
 * @class MovimentacaoManager
 * @description Gerencia todas as operações de movimentação de estoque entre almoxarifados,
 *              incluindo transferências, entradas, consultas e validações em tempo real.
 *              Integra-se com o backend Spring Boot através do ApiManager.
 * 
 * @author Sistema de Estoque FasiClin
 * @version 2.0.0
 * 
 * @property {ApiManager} apiManager - Instância do gerenciador de APIs
 * @property {Array} movimentacoes - Lista de movimentações carregadas
 * @property {Array} estoques - Lista de estoques disponíveis
 * @property {Array} usuarios - Lista de usuários do sistema
 * @property {Array} almoxarifados - Lista de almoxarifados cadastrados
 * @property {Array} estoquePorAlmoxarifado - Estoque agrupado por almoxarifado
 * @property {string} _estoqueSnapshot - Snapshot do estoque para detecção de mudanças
 * @property {number|null} currentEditId - ID da movimentação em edição
 * @property {boolean} isLoading - Indica se há operação de carregamento em andamento
 * @property {number} currentPage - Página atual da paginação
 * @property {number} itemsPerPage - Itens por página (padrão: 20)
 * @property {number} totalPages - Total de páginas disponíveis
 * 
 * @example
 * // Instanciado automaticamente ao carregar a página
 * const manager = new MovimentacaoManager();
 */
class MovimentacaoManager {
    /**
     * Construtor do MovimentacaoManager
     * @constructor
     * @description Inicializa todas as propriedades e inicia o carregamento de dados
     */
    constructor() {
        /** @type {ApiManager} Gerenciador de APIs REST */
        this.apiManager = window.apiManager;

        /** @type {Array<Object>} Lista de movimentações */
        this.movimentacoes = [];

        /** @type {Array<Object>} Lista de estoques */
        this.estoques = [];

        /** @type {Array<Object>} Lista de usuários */
        this.usuarios = [];

        /** @type {Array<Object>} Lista de almoxarifados */
        this.almoxarifados = [];

        /** @type {Array<Object>} Estoque agrupado por almoxarifado */
        this.estoquePorAlmoxarifado = [];

        /** @type {Array<Object>} Lista de lotes disponíveis */
        this.lotesDisponiveis = [];

        /** @type {string} Snapshot para detectar mudanças reais no estoque */
        this._estoqueSnapshot = '';

        /** @type {number|null} ID da movimentação atualmente em edição */
        this.currentEditId = null;

        /** @type {boolean} Flag de carregamento */
        this.isLoading = false;

        // Configuração de paginação
        /** @type {number} Página atual */
        this.currentPage = 1;

        /** @type {number} Número de itens por página */
        this.itemsPerPage = 20;

        /** @type {number} Total de páginas */
        this.totalPages = 0;

        this.init();
    }

    /**
     * Inicializa o gerenciador de movimentações
     * @async
     * @returns {Promise<void>}
     * @description Testa conectividade, vincula eventos e carrega dados iniciais
     */
    async init() {
        console.log('[MovimentacaoManager] Inicializando...');
        console.log('[MovimentacaoManager] Data/Hora atual:', new Date().toLocaleString('pt-BR'));

        // Testar conectividade com o backend
        await this.testBackendConnection();

        this.bindEvents();
        await this.loadData();
    }

    /**
     * Testa a conectividade com o backend Spring Boot
     * @async
     * @returns {Promise<void>}
     * @description Verifica se o servidor está respondendo corretamente,
     *              exibindo notificações em caso de erro de conexão
     * @throws {Error} Se houver falha na comunicação com o servidor
     */
    async testBackendConnection() {
        console.log('[CONECTIVIDADE] Testando conexão com o backend...');
        console.log('[CONECTIVIDADE] URL base:', this.apiManager.baseURL);

        try {
            // Endpoint corrigido para /movimentacao/historico ou /itens que sabemos que existe
            const response = await fetch(`${this.apiManager.baseURL}/movimentacao/historico`, {
                method: 'GET',
                headers: this.apiManager.headers
            });

            if (response.ok) {
                console.log('[CONECTIVIDADE] ✅ Backend conectado com sucesso!');
                console.log('[CONECTIVIDADE] Status:', response.status, response.statusText);
            } else {
                console.error('[CONECTIVIDADE] ❌ Backend retornou erro:', response.status, response.statusText);
                // Não mostrar notificação de erro se for apenas um teste de conexão que falhou em um endpoint específico mas o resto funciona
                // this.showNotification(`⚠️ Backend retornou erro: ${response.status}. Verifique se o servidor está rodando.`, 'error', 6000);
            }
        } catch (error) {
            console.error('[CONECTIVIDADE] ❌ Erro ao conectar com o backend:', error);
            this.showNotification(
                '❌ Não foi possível conectar ao backend. Verifique se o servidor está rodando em http://localhost:8080',
                'error',
                8000
            );
        }
    }

    /**
     * Vincula eventos aos elementos do DOM
     * @returns {void}
     * @description Configura todos os event listeners para botões, formulários e modais.
     *              Inclui validação em tempo real, paginação e atualização de dados.
     */
    bindEvents() {
        // Botão nova movimentação
        const btnNovo = document.getElementById('add-movement-btn');
        if (btnNovo) {
            btnNovo.addEventListener('click', () => this.showModal());
        }

        // Fechar modal
        const btnFechar = document.getElementById('close-modal');
        if (btnFechar) {
            btnFechar.addEventListener('click', () => this.hideModal());
        }

        // Cancelar modal
        const btnCancelar = document.getElementById('cancel-btn');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => this.hideModal());
        }

        // Submeter formulário
        const form = document.getElementById('movement-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSave(e));
        }

        // Validação em tempo real da quantidade
        const quantityInput = document.getElementById('amount');
        const produtoSelect = document.getElementById('produtoSelect');
        const almoxOrigemSelect = document.getElementById('almox-origem-select');
        const loteSelect = document.getElementById('loteSelect');

        if (quantityInput && produtoSelect && almoxOrigemSelect) {
            [quantityInput, produtoSelect, almoxOrigemSelect].forEach(element => {
                element.addEventListener('change', () => this.validateQuantityInRealTime());
                element.addEventListener('input', () => this.validateQuantityInRealTime());
            });
        }

        // Listener para mudança de lote
        if (loteSelect) {
            loteSelect.addEventListener('change', () => this.handleLoteChange());
        }

        // Fechar modal ao clicar no overlay
        const modal = document.getElementById('movement-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }

        // Atualizar dados
        const btnAtualizar = document.querySelector('[onclick="loadMovements()"]');
        if (btnAtualizar) {
            btnAtualizar.onclick = () => this.loadMovimentacoes();
        }

        // Botões de paginação
        const btnPrevPage = document.getElementById('prev-page');
        const btnNextPage = document.getElementById('next-page');

        if (btnPrevPage) {
            btnPrevPage.addEventListener('click', () => this.previousPage());
        }

        if (btnNextPage) {
            btnNextPage.addEventListener('click', () => this.nextPage());
        }

        // Botão de atualizar estoque no painel
        const btnRefreshStock = document.getElementById('refresh-stock-btn');
        if (btnRefreshStock) {
            btnRefreshStock.addEventListener('click', async () => {
                await this.refreshStockPanelInteractive(btnRefreshStock);
            });
        }

        console.log('[MovimentacaoManager] Eventos vinculados');
    }

    /**
     * Carrega todos os dados necessários do backend
     * @async
     * @returns {Promise<void>}
     * @description Carrega dados de forma sequencial para evitar sobrecarga no banco de dados.
     * @throws {Error} Se houver falha ao carregar qualquer recurso
     */
    async loadData() {
        this.setLoading(true);

        try {
            console.log('[MovimentacaoManager] 🔄 Carregando todos os dados...');

            // 1. Carregar Almoxarifados primeiro (necessário para o estoque)
            await this.loadAlmoxarifados();

            // 2. Carregar Movimentações e Produtos (em paralelo, mas separado do estoque pesado)
            await Promise.all([
                this.loadMovimentacoes(),
                this.loadProdutos()
            ]);

            // 3. Carregar Estoque (pesado, faz várias requisições)
            await this.loadEstoquePorAlmoxarifado();

            // 4. Carregar Lotes disponíveis
            await this.loadLotesDisponiveis();

            // SEMPRE renderizar movimentações após carregamento
            console.log('[MovimentacaoManager] 📊 Renderizando movimentações após carregamento...');
            this.renderMovimentacoes();

            console.log('[MovimentacaoManager] ✅ Todos os dados carregados e renderizados com sucesso');

        } catch (error) {
            console.error('[MovimentacaoManager] ❌ Erro ao carregar dados:', error);
            this.showNotification('Erro ao carregar dados: ' + error.message, 'error');

            // Renderizar estado vazio em caso de erro
            console.log('[MovimentacaoManager] 🔄 Renderizando estado vazio devido ao erro...');
            this.renderMovimentacoes();
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Carrega movimentações do servidor
     * @async
     * @returns {Promise<void>}
     * @description Busca todas as movimentações, ordena por data (mais recentes primeiro),
     *              reseta paginação e renderiza automaticamente na tabela.
     * @throws {Error} Se houver falha na comunicação com o backend
     */
    async loadMovimentacoes() {
        try {
            console.log('[MovimentacaoManager] Carregando movimentações...');
            const result = await this.apiManager.listarMovimentacoes();

            console.log('[MovimentacaoManager] Resposta completa da API:', result);

            if (result.success && result.data) {
                // Garantir que seja sempre um array
                if (Array.isArray(result.data)) {
                    this.movimentacoes = result.data;
                } else {
                    this.movimentacoes = [result.data];
                }

                // Ordenar movimentações em ordem decrescente (mais recentes primeiro)
                this.movimentacoes.sort((a, b) => {
                    // Primeiro por data (mais recente primeiro)
                    const dateA = new Date(a.dataMovimentacao || '1970-01-01');
                    const dateB = new Date(b.dataMovimentacao || '1970-01-01');

                    if (dateB.getTime() !== dateA.getTime()) {
                        return dateB.getTime() - dateA.getTime();
                    }

                    // Se as datas forem iguais, ordenar por ID (maior ID primeiro = mais recente)
                    return (b.id || 0) - (a.id || 0);
                });

                // Resetar para primeira página ao carregar novos dados
                this.currentPage = 1;

                console.log(`[MovimentacaoManager] ✅ ${this.movimentacoes.length} movimentações carregadas e ordenadas (mais recentes primeiro):`);
                this.movimentacoes.forEach((mov, index) => {
                    console.log(`  ${index + 1}. ID: ${mov.id}, Tipo: ${mov.tipoMovimentacao}, Quantidade: ${mov.quantidade}, Data: ${mov.dataMovimentacao}`);
                });

                // Forçar renderização imediata após carregamento bem-sucedido
                console.log('[MovimentacaoManager] 🔄 Forçando renderização após carregamento de movimentações...');
                this.renderMovimentacoes();
            } else {
                console.warn('[MovimentacaoManager] ⚠️ Resposta inválida ou sem dados:', result);
                this.movimentacoes = [];
                this.currentPage = 1;

                // Renderizar estado vazio se não há dados
                console.log('[MovimentacaoManager] Renderizando estado vazio - nenhuma movimentação encontrada');
                this.renderMovimentacoes();
            }
        } catch (error) {
            console.error('[MovimentacaoManager] ❌ Erro ao carregar movimentações:', error);
            this.movimentacoes = [];
            this.currentPage = 1;

            // Renderizar estado vazio em caso de erro
            console.log('[MovimentacaoManager] Renderizando estado vazio devido ao erro');
            this.renderMovimentacoes();
        }
    }

    /**
     * Carrega estoques do servidor
     * @async
     * @returns {Promise<void>}
     * @description Busca todos os registros de estoque e popula os selects de produto no formulário.
     *              Em caso de erro, inicializa array vazio.
     * @throws {Error} Se houver falha na comunicação com o backend
     */
    async loadEstoques() {
        try {
            console.log('[MovimentacaoManager] Carregando estoques...');
            const result = await this.apiManager.listarEstoques();

            console.log('[MovimentacaoManager] Resultado da API estoques:', result);

            // Verificar se temos dados válidos - aceitar tanto result.data quanto result diretamente
            let dadosEstoques = null;

            if (result && result.data) {
                dadosEstoques = result.data;
            } else if (result && result.content) {
                // Se o result já é a estrutura paginada diretamente
                dadosEstoques = result;
            } else if (result) {
                dadosEstoques = result;
            }

            if (dadosEstoques) {
                // Se o resultado tem paginação, pega o content
                if (dadosEstoques.content && Array.isArray(dadosEstoques.content)) {
                    this.estoques = dadosEstoques.content;
                    console.log(`[MovimentacaoManager] ✅ ${this.estoques.length} estoques carregados da estrutura paginada:`, this.estoques);
                } else if (Array.isArray(dadosEstoques)) {
                    this.estoques = dadosEstoques;
                    console.log(`[MovimentacaoManager] ✅ ${this.estoques.length} estoques carregados do array:`, this.estoques);
                } else {
                    this.estoques = [dadosEstoques];
                    console.log('[MovimentacaoManager] ✅ 1 estoque carregado (item único):', this.estoques);
                }
            } else {
                console.warn('[MovimentacaoManager] Nenhum estoque encontrado ou estrutura inválida:', result);
                this.estoques = [];
            }

            // Sempre tentar popular o select, mesmo se vazio
            this.populateEstoqueSelect();
        } catch (error) {
            console.error('[MovimentacaoManager] Erro ao carregar estoques:', error);
            this.estoques = [];
            this.populateEstoqueSelect(); // Popula com mensagem de erro
        }
    }

    /**
     * Carrega usuários do servidor
     */
    async loadUsuarios() {
        try {
            console.log('[MovimentacaoManager] Carregando usuários...');
            const usuarios = await this.apiManager.listarUsuarios();

            this.usuarios = usuarios || [];
            console.log(`[MovimentacaoManager] ✅ ${this.usuarios.length} usuários carregados`);

            this.populateUsuarioSelect();
        } catch (error) {
            console.error('[MovimentacaoManager] Erro ao carregar usuários:', error);
            this.usuarios = [];
        }
    }

    /**
     * Carrega almoxarifados do servidor
     */
    async loadAlmoxarifados() {
        try {
            console.log('[ALMOXARIFADOS] 🔄 Iniciando carregamento...');
            console.log('[ALMOXARIFADOS] Chamando endpoint:', `${this.apiManager.baseURL}/almoxarifado`);

            const almoxarifados = await this.apiManager.listarAlmoxarifados();

            console.log('[ALMOXARIFADOS] Resposta da API:', almoxarifados);

            this.almoxarifados = almoxarifados || [];
            console.log(`[ALMOXARIFADOS] ✅ ${this.almoxarifados.length} almoxarifados carregados:`, this.almoxarifados);

            if (this.almoxarifados.length === 0) {
                console.warn('[ALMOXARIFADOS] ⚠️ Nenhum almoxarifado encontrado!');
                this.showNotification('⚠️ Nenhum almoxarifado encontrado no sistema', 'warning', 4000);
            }

            this.populateAlmoxarifadoSelects();
        } catch (error) {
            console.error('[ALMOXARIFADOS] ❌ Erro ao carregar:', error);
            this.almoxarifados = [];
            this.showNotification('❌ Erro ao carregar almoxarifados: ' + error.message, 'error');
        }
    }

    /**
     * Carrega estoque agrupado por almoxarifado
     */
    async loadEstoquePorAlmoxarifado() {
        try {
            console.log('[ESTOQUE_ALMOX] 🔄 Carregando estoque por almoxarifado...');

            // Usar lista de almoxarifados já carregada se disponível
            let almoxarifados = this.almoxarifados;
            if (!almoxarifados || almoxarifados.length === 0) {
                almoxarifados = await this.apiManager.listarAlmoxarifados();
            }

            // Buscar saldo de forma sequencial para não sobrecarregar o pool de conexões
            const resultados = [];
            for (const almox of almoxarifados) {
                try {
                    const saldo = await this.apiManager.consultarSaldoAlmoxarifado(almox.id);
                    const saldoFormatado = saldo.map(item => ({
                        ...item,
                        almoxarifado: almox
                    }));
                    resultados.push(saldoFormatado);
                } catch (err) {
                    console.error(`[ESTOQUE_ALMOX] Erro ao carregar saldo do almoxarifado ${almox.id}:`, err);
                }
            }

            this.estoquePorAlmoxarifado = resultados.flat();
            this._estoqueSnapshot = this.createEstoqueSnapshot(this.estoquePorAlmoxarifado);

            console.log(`[ESTOQUE_ALMOX] ✅ ${this.estoquePorAlmoxarifado.length} itens carregados`);

            // Log resumido por almoxarifado
            const resumo = {};
            this.estoquePorAlmoxarifado.forEach(item => {
                const almoxNome = item.almoxarifado?.descricao || 'Sem Almoxarifado';
                resumo[almoxNome] = (resumo[almoxNome] || 0) + 1;
            });

            console.log('[ESTOQUE_ALMOX] Resumo por almoxarifado:', resumo);

        } catch (error) {
            console.error('[ESTOQUE_ALMOX] ❌ Erro:', error.message);
            this.estoquePorAlmoxarifado = [];
            this.showNotification('❌ Erro ao carregar estoque: ' + error.message, 'error');
        }
    }

    /**
     * Carrega estoque em TEMPO REAL (sem cache)
     */
    async loadEstoquePorAlmoxarifadoTempoReal() {
        try {
            console.log('[TEMPO_REAL] 🔄 Carregando estoque atualizado...');

            // Recarregar completamente
            await this.loadEstoquePorAlmoxarifado();

            console.log(`[TEMPO_REAL] ✅ ${this.estoquePorAlmoxarifado.length} itens atualizados`);

        } catch (error) {
            console.error('[TEMPO_REAL] ❌ Erro:', error.message);
            this.showNotification('❌ Erro ao atualizar estoque', 'error');
        }
    }

    /**
     * Popula select de estoques
     */
    populateEstoqueSelect() {
        const select = document.getElementById('produtoSelect');
        if (!select) {
            console.error('[MovimentacaoManager] Select de produto não encontrado');
            return;
        }

        console.log('[MovimentacaoManager] Populando select de produtos com', this.estoques.length, 'itens');
        select.innerHTML = '<option value="">Selecione um produto...</option>';

        if (!this.estoques || this.estoques.length === 0) {
            console.warn('[MovimentacaoManager] Nenhum estoque disponível para popular');
            select.innerHTML += '<option value="" disabled>Nenhum produto encontrado</option>';
            return;
        }

        this.estoques.forEach((estoque, index) => {
            console.log(`[MovimentacaoManager] Processando estoque ${index + 1}:`, estoque);

            const option = document.createElement('option');
            // Usar o ID correto baseado na estrutura retornada da API
            option.value = estoque.id || estoque.estoqueId || estoque.idEstoque;

            // Melhorar a exibição do nome do produto
            let produtoNome = 'Produto sem nome';
            let quantidade = 0;

            if (estoque.produto && estoque.produto.nome) {
                produtoNome = estoque.produto.nome;
            } else if (estoque.nomeProduto) {
                produtoNome = estoque.nomeProduto;
            } else if (estoque.nome) {
                produtoNome = estoque.nome;
            }

            if (estoque.quantidadeEstoque !== undefined) {
                quantidade = estoque.quantidadeEstoque;
            } else if (estoque.quantidade !== undefined) {
                quantidade = estoque.quantidade;
            }

            option.textContent = `${produtoNome} - Qtd: ${quantidade}`;
            select.appendChild(option);

            console.log(`[MovimentacaoManager] Adicionado: ${produtoNome} (ID: ${option.value})`);
        });

        console.log(`[MovimentacaoManager] ✅ Select populado com ${this.estoques.length} produtos`);
    }

    /**
     * Popula select de usuários
     */
    populateUsuarioSelect() {
        const select = document.getElementById('usuario-select');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um usuário...</option>';

        this.usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.id;
            option.textContent = usuario.nome || usuario.login;
            select.appendChild(option);
        });
    }

    /**
     * Popula selects de almoxarifados
     */
    populateAlmoxarifadoSelects() {
        const selectOrigem = document.getElementById('almox-origem-select');
        const selectDestino = document.getElementById('almox-destino-select');

        const options = '<option value="">Selecione um almoxarifado...</option>' +
            this.almoxarifados.map(almox =>
                `<option value="${almox.id}">${almox.nome || almox.descricao || `Almoxarifado ${almox.id}`}</option>`
            ).join('');

        if (selectOrigem) selectOrigem.innerHTML = options;
        if (selectDestino) selectDestino.innerHTML = options;
    }

    /**
     * Renderiza tabela/cards de movimentações com paginação
     */
    renderMovimentacoes() {
        console.log('[MovimentacaoManager] 🎨 INICIANDO RENDERIZAÇÃO DE MOVIMENTAÇÕES...');
        console.log('[MovimentacaoManager] Dados das movimentações:', {
            existe: !!this.movimentacoes,
            ehArray: Array.isArray(this.movimentacoes),
            quantidade: this.movimentacoes?.length || 0,
            dados: this.movimentacoes
        });

        const tableBody = document.getElementById('movements-table-body');
        const mobileCards = document.getElementById('mobile-cards');

        console.log('[MovimentacaoManager] Elementos DOM encontrados:', {
            tableBody: !!tableBody,
            mobileCards: !!mobileCards
        });

        if (!tableBody && !mobileCards) {
            console.error('[MovimentacaoManager] ❌ ERRO CRÍTICO: Elementos de renderização não encontrados');
            console.error('[MovimentacaoManager] Verifique se os elementos DOM existem na página');
            return;
        }

        if (!this.movimentacoes || this.movimentacoes.length === 0) {
            console.warn('[MovimentacaoManager] ⚠️ Nenhuma movimentação para renderizar - exibindo estado vazio');
            this.renderEmptyState();
            return;
        }

        console.log(`[MovimentacaoManager] 📊 Total de movimentações: ${this.movimentacoes.length}`);

        // Calcular paginação
        this.totalPages = Math.ceil(this.movimentacoes.length / this.itemsPerPage);

        // Garantir que a página atual seja válida
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }

        // Calcular índices para a página atual
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.movimentacoes.length);

        // Obter movimentações da página atual
        const movimentacoesPaginadas = this.movimentacoes.slice(startIndex, endIndex);

        console.log(`[MovimentacaoManager] 📄 Página ${this.currentPage} de ${this.totalPages} (exibindo ${movimentacoesPaginadas.length} itens)`);

        // Renderizar tabela desktop
        if (tableBody) {
            console.log('[MovimentacaoManager] 🖥️ Renderizando tabela desktop...');
            const tableHTML = movimentacoesPaginadas.map((mov, index) => {
                console.log(`  📋 Processando movimentação ${startIndex + index + 1} (ID: ${mov.id}):`, mov);
                return this.createTableRow(mov);
            }).join('');

            tableBody.innerHTML = tableHTML;
            console.log('[MovimentacaoManager] ✅ Tabela desktop renderizada com sucesso');
        }

        // Renderizar cards mobile
        if (mobileCards) {
            console.log('[MovimentacaoManager] 📱 Renderizando cards mobile...');
            const cardsHTML = movimentacoesPaginadas.map(mov => this.createCard(mov)).join('');
            mobileCards.innerHTML = cardsHTML;
            console.log('[MovimentacaoManager] ✅ Cards mobile renderizados com sucesso');
        }

        this.updatePaginationInfo();
        console.log(`[MovimentacaoManager] 🎉 RENDERIZAÇÃO CONCLUÍDA: ${movimentacoesPaginadas.length} movimentações exibidas (página ${this.currentPage}/${this.totalPages})`);

        // Verificação final do DOM
        setTimeout(() => {
            const finalRows = document.querySelectorAll('#movements-table-body tr');
            console.log(`[MovimentacaoManager] 🔍 Verificação final: ${finalRows.length} linhas encontradas na tabela`);
        }, 100);
    }

    /**
     * Cria linha da tabela
     */
    createTableRow(movimentacao) {
        console.log('[MovimentacaoManager] Criando linha para movimentação:', movimentacao);
        console.log('[MovimentacaoManager] Data recebida:', movimentacao.dataMovimentacao, 'Hora recebida:', movimentacao.horaMovimentacao);

        const tipoIcon = movimentacao.tipoMovimentacao === 'ENTRADA' ? '⬆️' : '⬇️';
        const tipoClass = movimentacao.tipoMovimentacao === 'ENTRADA' ? 'type-income' : 'type-expense';

        // Formatar origem e destino com fallbacks
        const origem = movimentacao.setorOrigem?.nome ||
            movimentacao.setorOrigemId?.nome ||
            'Origem N/A';
        const destino = movimentacao.setorDestino?.nome ||
            movimentacao.setorDestinoId?.nome ||
            'Destino N/A';
        const fluxo = `${origem} → ${destino}`;

        // Nome do usuário com fallbacks
        const nomeUsuario = movimentacao.usuario?.nome ||
            movimentacao.usuario?.login ||
            movimentacao.nomeUsuario ||
            'Usuário N/A';

        // Produto com fallbacks
        const nomeProduto = movimentacao.estoque?.produto?.nome ||
            movimentacao.produto?.nome ||
            movimentacao.nomeProduto ||
            'Produto N/A';

        const dataHora = this.formatDateTime(movimentacao.dataMovimentacao, movimentacao.horaMovimentacao);
        console.log('[MovimentacaoManager] Data/hora formatada:', dataHora);

        const row = `
            <tr data-id="${movimentacao.id}">
                <td>${movimentacao.id}</td>
                <td>
                    <span class="type-badge ${tipoClass}">
                        ${tipoIcon} ${movimentacao.tipoMovimentacao}
                    </span>
                </td>
                <td class="flow-info">${fluxo}</td>
                <td><strong>${movimentacao.quantidade}</strong></td>
                <td>${dataHora}</td>
                <td>${nomeUsuario}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="movimentacaoManager.editMovimentacao(${movimentacao.id})" title="Editar">
                        ✏️
                    </button>
                    <button class="delete-btn" onclick="movimentacaoManager.deleteMovimentacao(${movimentacao.id})" title="Excluir">
                        🗑️
                    </button>
                </td>
            </tr>
        `;

        console.log('[MovimentacaoManager] Linha criada para movimentação ID:', movimentacao.id);
        return row;
    }

    /**
     * Cria card mobile para uma movimentação
     * @param {Object} movimentacao - Objeto da movimentação
     * @returns {string} HTML do card mobile
     * @description Gera HTML formatado para exibição mobile com botões de ação.
     *              Otimizado para telas pequenas com design responsivo.
     */
    createCard(movimentacao) {
        const tipoIcon = movimentacao.tipoMovimentacao === 'ENTRADA' ? '⬆️' : '⬇️';
        const tipoClass = movimentacao.tipoMovimentacao === 'ENTRADA' ? 'type-income' : 'type-expense';

        // Formatar origem e destino
        const origem = movimentacao.setorOrigem?.nome || 'N/A';
        const destino = movimentacao.setorDestino?.nome || 'N/A';

        return `
            <div class="mobile-card" data-id="${movimentacao.id}">
                <div class="mobile-card-header">
                    <div class="mobile-card-id">#${movimentacao.id}</div>
                    <span class="type-badge ${tipoClass}">
                        ${tipoIcon} ${movimentacao.tipoMovimentacao}
                    </span>
                </div>
                <div class="mobile-card-body">
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">De → Para:</span>
                        <span class="mobile-card-value">${origem} → ${destino}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Quantidade:</span>
                        <span class="mobile-card-value">${movimentacao.quantidade}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Data/Hora:</span>
                        <span class="mobile-card-value">${this.formatDateTime(movimentacao.dataMovimentacao, movimentacao.horaMovimentacao)}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Usuário:</span>
                        <span class="mobile-card-value">${movimentacao.usuario?.nome || movimentacao.usuario?.login || movimentacao.nomeUsuario || 'N/A'}</span>
                    </div>
                </div>
                <div class="mobile-card-actions">
                    <button class="edit-btn" onclick="movimentacaoManager.editMovimentacao(${movimentacao.id})">✏️ Editar</button>
                    <button class="delete-btn" onclick="movimentacaoManager.deleteMovimentacao(${movimentacao.id})">🗑️ Excluir</button>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza estado vazio quando não há movimentações
     * @returns {void}
     * @description Exibe mensagem amigável e botão para criar nova movimentação
     *              tanto na visão desktop (tabela) quanto mobile (cards).
     */
    renderEmptyState() {
        const emptyHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <h3>📦 Nenhuma movimentação encontrada</h3>
                    <p>Comece criando uma nova movimentação de estoque</p>
                    <button class="btn btn-primary" onclick="movimentacaoManager.showModal()">
                        ➕ Nova Movimentação
                    </button>
                </td>
            </tr>
        `;

        const tableBody = document.getElementById('movements-table-body');
        const mobileCards = document.getElementById('mobile-cards');

        if (tableBody) tableBody.innerHTML = emptyHTML;
        if (mobileCards) mobileCards.innerHTML = '<div class="empty-state"><h3>📦 Nenhuma movimentação encontrada</h3></div>';
    }

    /**
     * Atualiza informações de paginação na interface
     * @returns {void}
     * @description Calcula e atualiza os indicadores de página atual, itens exibidos,
     *              total de itens e estado dos botões de navegação (anterior/próximo).
     */
    updatePaginationInfo() {
        const total = this.movimentacoes.length;

        // Calcular índices da página atual
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, total);

        const startElement = document.getElementById('start-item');
        const endElement = document.getElementById('end-item');
        const totalElement = document.getElementById('total-items');
        const currentPageElement = document.getElementById('current-page');
        const totalPagesElement = document.getElementById('total-pages');

        if (startElement) startElement.textContent = total > 0 ? (startIndex + 1).toString() : '0';
        if (endElement) endElement.textContent = endIndex.toString();
        if (totalElement) totalElement.textContent = total.toString();
        if (currentPageElement) currentPageElement.textContent = this.currentPage.toString();
        if (totalPagesElement) totalPagesElement.textContent = this.totalPages.toString();

        // Atualizar estado dos botões de navegação
        const btnPrev = document.getElementById('prev-page');
        const btnNext = document.getElementById('next-page');

        if (btnPrev) {
            btnPrev.disabled = this.currentPage === 1;
            btnPrev.style.opacity = this.currentPage === 1 ? '0.5' : '1';
            btnPrev.style.cursor = this.currentPage === 1 ? 'not-allowed' : 'pointer';
        }

        if (btnNext) {
            btnNext.disabled = this.currentPage >= this.totalPages;
            btnNext.style.opacity = this.currentPage >= this.totalPages ? '0.5' : '1';
            btnNext.style.cursor = this.currentPage >= this.totalPages ? 'not-allowed' : 'pointer';
        }

        console.log(`[Paginação] Página ${this.currentPage}/${this.totalPages} - Exibindo itens ${startIndex + 1}-${endIndex} de ${total}`);
    }

    /**
     * Navega para a próxima página
     */
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderMovimentacoes();

            // Scroll suave para o topo da tabela
            const tableContainer = document.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    /**
     * Navega para a página anterior
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderMovimentacoes();

            // Scroll suave para o topo da tabela
            const tableContainer = document.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    /**
     * Exibe modal de nova/edição movimentação - VERSÃO SIMPLIFICADA
     */
    async showModal(movimentacao = null) {
        const modal = document.getElementById('movement-modal');
        const form = document.getElementById('movement-form');
        const title = document.getElementById('modal-title');

        if (!modal || !form) {
            console.error('[MODAL] Elementos não encontrados');
            return;
        }

        console.log('[MODAL] Abrindo...');

        this.currentEditId = movimentacao?.id || null;

        // Configurar título
        if (title) {
            title.textContent = movimentacao ? '✏️ Editar Movimentação' : '✨ Nova Movimentação';
        }

        // Limpar e resetar
        form.reset();

        // Data automática (hoje)
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.value = this.formatLocalDateForBackend(new Date());
        }

        // Preencher dados se edição
        if (movimentacao) {
            this.fillForm(movimentacao);
        }

        // Mostrar modal
        modal.classList.remove('hidden');
        modal.classList.add('show');
        document.body.classList.add('modal-open');

        // Carregar estoque atualizado
        const stockContainer = document.getElementById('stock-by-sector');
        if (stockContainer) {
            stockContainer.innerHTML = '<div class="loading-stocks">⏳ Carregando...</div>';
        }

        try {
            // Carregar lotes disponíveis para o select
            await this.loadLotesDisponiveis();

            await this.loadEstoquePorAlmoxarifadoTempoReal();
            this.renderStockPanel();
            console.log('[MODAL] ✅ Estoque carregado');
        } catch (error) {
            console.error('[MODAL] ❌ Erro ao carregar estoque:', error);
            await this.loadEstoquePorAlmoxarifado();
            this.renderStockPanel();
        }

        // Foco no primeiro campo
        const firstInput = form.querySelector('select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }

        // Atualizar visibilidade dos campos
        this.handleTypeChange();
    }

    /**
     * Gerencia a visibilidade dos campos baseado no tipo de movimentação
     */
    handleTypeChange() {
        const type = document.getElementById('type').value;
        const almoxOrigemGroup = document.getElementById('almox-origem-select').closest('.form-group');
        const almoxDestinoGroup = document.getElementById('almox-destino-select').closest('.form-group');

        if (!type) {
            almoxOrigemGroup.style.display = 'block';
            almoxDestinoGroup.style.display = 'block';
            return;
        }

        if (type === 'ENTRADA') {
            almoxOrigemGroup.style.display = 'none';
            almoxDestinoGroup.style.display = 'block';
            // Para entrada, o lote selecionado no painel (se houver) será o destino
        } else if (type === 'SAIDA') {
            almoxOrigemGroup.style.display = 'block';
            almoxDestinoGroup.style.display = 'none';
        } else if (type === 'TRANSFERENCIA') {
            almoxOrigemGroup.style.display = 'block';
            almoxDestinoGroup.style.display = 'block';
        }
    }

    /**
     * Oculta modal
     */
    hideModal() {
        const modal = document.getElementById('movement-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }

        // Limpar mensagens de validação
        this.clearValidationMessage();

        this.currentEditId = null;
        console.log('[MovimentacaoManager] Modal ocultado');
    }

    /**
     * Preenche formulário com dados
     */
    fillForm(movimentacao) {
        const fields = ['tipo', 'produtoId', 'quantidade', 'setorOrigemId', 'setorDestinoId', 'usuarioId', 'observacoes'];

        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && movimentacao[field] !== undefined) {
                element.value = movimentacao[field];
            }
        });

        // Data especial
        if (movimentacao.dataMovimentacao) {
            const dateInput = document.getElementById('dataMovimentacao');
            if (dateInput) {
                const date = new Date(movimentacao.dataMovimentacao);
                dateInput.value = this.formatLocalDateForBackend(date);
            }
        }
    }

    /**
     * Manipula o salvamento de uma movimentação (nova ou edição)
     */
    async handleSave(event) {
        event.preventDefault();

        if (this.isLoading) return;

        const formData = this.getFormData();
        console.log('[SAVE] Dados do formulário:', formData);

        // Validar
        const isValid = await this.validateForm(formData);
        if (!isValid) return;

        try {
            this.setLoading(true);

            let response;

            if (formData.tipoMovimentacao === 'ENTRADA') {
                console.log('[SAVE] Registrando ENTRADA');
                response = await this.apiManager.registrarEntrada({
                    produtoId: formData.idProduto,
                    almoxarifadoId: formData.idAlmoxDestino,
                    loteId: formData.idLote, // Usando lote selecionado como destino
                    quantidade: formData.quantidade,
                    responsavel: formData.responsavel,
                    observacao: formData.observacao
                });
            } else if (formData.tipoMovimentacao === 'SAIDA') {
                console.log('[SAVE] Registrando SAIDA');
                response = await this.apiManager.registrarSaida({
                    produtoId: formData.idProduto,
                    almoxarifadoOrigemId: formData.idAlmoxOrigem,
                    loteOrigemId: formData.idLote,
                    quantidade: formData.quantidade,
                    responsavel: formData.responsavel,
                    observacao: formData.observacao
                });
            } else if (formData.tipoMovimentacao === 'TRANSFERENCIA') {
                console.log('[SAVE] Registrando TRANSFERENCIA DE LOTE');
                response = await this.apiManager.transferirLote({
                    loteOrigemId: formData.idLote,
                    almoxarifadoOrigemId: formData.idAlmoxOrigem,
                    almoxarifadoDestinoId: formData.idAlmoxDestino,
                    quantidade: formData.quantidade,
                    responsavel: formData.responsavel,
                    observacao: formData.observacao
                });
            } else {
                throw new Error('Tipo de movimentação inválido');
            }

            if (response.success || response.id) {
                this.showNotification('✅ Movimentação realizada com sucesso!', 'success');
                this.hideModal();
                await new Promise(resolve => setTimeout(resolve, 500));
                await Promise.all([
                    this.loadMovimentacoes(),
                    this.loadEstoquePorAlmoxarifadoTempoReal()
                ]);
                this.renderMovimentacoes();
            } else {
                throw new Error(response.error || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('[SAVE] ❌ Erro:', error);
            this.showNotification('❌ Erro ao salvar: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Obtém dados do formulário
     */
    getFormData() {
        const produtoId = parseInt(document.getElementById('produtoSelect').value);
        const almoxOrigemId = parseInt(document.getElementById('almox-origem-select').value);
        const almoxDestinoId = parseInt(document.getElementById('almox-destino-select').value);
        const quantidade = parseInt(document.getElementById('amount').value) || 0;
        const tipoMovimentacao = document.getElementById('type').value;
        const loteId = parseInt(document.getElementById('lote-id').value);

        return {
            idProduto: produtoId,
            idAlmoxOrigem: almoxOrigemId,
            idAlmoxDestino: almoxDestinoId,
            quantidade: quantidade,
            tipoMovimentacao: tipoMovimentacao,
            idLote: loteId,
            responsavel: 'Sistema', // TODO: Implementar usuário logado
            observacao: null
        };
    }

    /**
     * Valida formulário
     */
    async validateForm(data) {
        const errors = [];

        if (!data.idProduto) errors.push('Selecione um produto');
        if (!data.tipoMovimentacao) errors.push('Selecione o tipo de movimentação');
        if (!data.quantidade || data.quantidade <= 0) errors.push('Digite uma quantidade válida');

        // Validação específica por tipo
        if (data.tipoMovimentacao === 'ENTRADA') {
            if (!data.idAlmoxDestino) errors.push('Selecione o almoxarifado de destino');
            if (!data.idLote) errors.push('Selecione um lote para entrada (clique no painel de estoque)');
        }
        else if (data.tipoMovimentacao === 'SAIDA') {
            if (!data.idAlmoxOrigem) errors.push('Selecione o almoxarifado de origem');
            if (!data.idLote) errors.push('Selecione um lote de origem (clique no painel de estoque)');
        }
        else if (data.tipoMovimentacao === 'TRANSFERENCIA') {
            if (!data.idAlmoxOrigem) errors.push('Selecione o almoxarifado de origem');
            if (!data.idAlmoxDestino) errors.push('Selecione o almoxarifado de destino');
            if (!data.idLote) errors.push('Selecione um lote de origem (clique no painel de estoque)');
            if (data.idAlmoxOrigem === data.idAlmoxDestino) errors.push('Origem e destino devem ser diferentes');
        }

        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return false;
        }

        // Validação de saldo para SAIDA e TRANSFERENCIA
        if (['SAIDA', 'TRANSFERENCIA'].includes(data.tipoMovimentacao)) {
            const estoqueDisponivel = this.getEstoqueDisponivelNoAlmoxarifado(data.idProduto, data.idAlmoxOrigem);
            if (estoqueDisponivel === null || data.quantidade > estoqueDisponivel) {
                this.showNotification(`Quantidade insuficiente no almoxarifado de origem. Disponível: ${estoqueDisponivel || 0}`, 'error');
                return false;
            }
        }

        return true;
    }

    /**
     * Edita movimentação
     */
    async editMovimentacao(id) {
        const movimentacao = this.movimentacoes.find(m => m.id === id);
        if (movimentacao) {
            this.showModal(movimentacao);
        }
    }

    /**
     * Exclui movimentação
     */
    async deleteMovimentacao(id) {
        if (!confirm('🗑️ Tem certeza que deseja excluir esta movimentação?')) return;

        try {
            this.setLoading(true);
            const response = await this.apiManager.request(`/movimentacoes/${id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showNotification('✅ Movimentação excluída com sucesso!', 'success');
                await this.loadMovimentacoes();
                this.renderMovimentacoes();
            } else {
                this.showNotification('❌ Erro ao excluir movimentação: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            this.showNotification('❌ Erro ao excluir movimentação', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Manipula redimensionamento
     */
    handleResize() {
        this.renderMovimentacoes();
    }

    /**
     * Define estado de carregamento
     */
    setLoading(loading) {
        this.isLoading = loading;
        const loadingElement = document.getElementById('loading');
        const btnSalvar = document.getElementById('btnSalvar');

        if (loadingElement) {
            loadingElement.style.display = loading ? 'flex' : 'none';
        }

        if (btnSalvar) {
            btnSalvar.disabled = loading;
            btnSalvar.textContent = loading ? '⏳ Salvando...' : '💾 Salvar';
        }
    }

    /**
     * Exibe notificação Apple-style
     */
    showNotification(message, type = 'info', duration = 4000) {
        // Remover notificações existentes
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animação de entrada
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remover
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * ===== MÉTODOS DE PRODUTOS =====
     */

    /**
     * Carrega os estoques (que contêm produtos) para o select com busca e validação
     */
    async loadProdutos() {
        try {
            console.log('[PRODUTOS] Iniciando carregamento de produtos...');

            // Usa o endpoint que lista todos os itens
            const response = await fetch(`${this.apiManager.baseURL}/itens`, {
                method: 'GET',
                headers: this.apiManager.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const produtos = await response.json();
            console.log('[PRODUTOS] Resposta da API:', produtos);

            if (Array.isArray(produtos) && produtos.length > 0) {
                this.produtos = produtos;
                this.populateProdutoSelect(produtos);
                console.log(`[PRODUTOS] ✅ ${produtos.length} produtos carregados com sucesso`);
            } else {
                console.warn('[PRODUTOS] Nenhum produto encontrado');
                this.produtos = [];
                this.populateProdutoSelect([]);
            }
        } catch (error) {
            console.error('[PRODUTOS] ❌ Erro ao carregar produtos:', error);
            this.showNotification('Erro ao carregar produtos: ' + error.message, 'error');

            // Define produtos como array vazio em caso de erro
            this.produtos = [];
            this.populateProdutoSelect([]);
        }
    }

    /**
     * Popula o select de produtos com validação de almoxarifado
     * @param {Array} produtos - Array de produtos
     */
    populateProdutoSelect(produtos) {
        const select = document.getElementById('produtoSelect');

        if (!select) {
            console.warn('[PRODUTOS] Select de produto não encontrado');
            return;
        }

        // Limpa as opções atuais
        select.innerHTML = '<option value="">Selecione um produto...</option>';

        if (!produtos || produtos.length === 0) {
            select.innerHTML += '<option value="" disabled>Nenhum produto encontrado</option>';
            console.warn('[PRODUTOS] ⚠️ Lista de produtos vazia');
            return;
        }

        // Adiciona todos os produtos
        produtos.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;
            option.dataset.produto = JSON.stringify(produto);

            // Monta o texto da opção: Nome - Quantidade (se disponível)
            // Se for apenas o cadastro do item, não tem quantidade.
            // Se for estoque, tem quantidade.
            // O usuário pediu "Nome Item e Quantidade".
            // Como aqui estamos listando ITENS (cadastro), vamos tentar mostrar o nomeItem.

            let textoOpcao = produto.nomeItem || produto.nome || 'Produto sem nome';

            // Se tiver quantidade (caso venha de uma lista de estoques misturada)
            if (produto.quantidade !== undefined) {
                textoOpcao += ` - Qtd: ${produto.quantidade}`;
            } else if (produto.quantidadeEstoque !== undefined) {
                textoOpcao += ` - Qtd: ${produto.quantidadeEstoque}`;
            }

            option.textContent = textoOpcao;
            select.appendChild(option);
        });

        console.log(`[PRODUTOS] ✅ Select populado com ${produtos.length} produtos`);
    }

    /**
     * Configura a busca de produtos por nome
     * @param {HTMLElement} searchInput - Input de busca
     * @param {Array} estoques - Lista completa de estoques
     */
    setupProdutoSearch(searchInput, estoques) {
        let timeoutId;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            const termo = e.target.value.toLowerCase().trim();

            timeoutId = setTimeout(() => {
                if (termo.length >= 2) {
                    this.filtrarProdutos(termo, estoques);
                } else if (termo.length === 0) {
                    this.populateProdutoSelect(estoques);
                }
            }, 300);
        });
    }

    /**
     * Filtra estoques por nome do produto
     * @param {string} termo - Termo de busca
     * @param {Array} estoquesCompletos - Lista completa de estoques
     */
    filtrarProdutos(termo, estoquesCompletos) {
        const estoquesFiltrados = estoquesCompletos.filter(estoque => {
            const produto = estoque.produto || {};
            return produto.nome?.toLowerCase().includes(termo) ||
                produto.descricao?.toLowerCase().includes(termo) ||
                String(produto.id || '').includes(termo) ||
                String(estoque.id).includes(termo);
        });

        this.populateProdutoSelect(estoquesFiltrados);

        console.log(`[ESTOQUES] Filtrados ${estoquesFiltrados.length} estoques para termo: "${termo}"`);
    }

    /**
     * Valida se a quantidade não excede o estoque disponível
     * @param {Object} estoque - Estoque selecionado
     * @param {number} quantidade - Quantidade solicitada
     * @returns {boolean} - True se válido
     */
    async validarEstoqueMaximo(produto, quantidade) {
        try {
            // Primeiro verifica se o produto pode ser movimentado (tem almoxarifado)
            if (!produto.podeMovimentar) {
                this.showNotification('Este produto não pode ser movimentado pois não possui almoxarifado associado (ID_ALMOX = NULL)', 'error');
                return false;
            }

            // Verifica estoque máximo do produto se disponível
            if (produto.stqMax && quantidade > produto.stqMax) {
                this.showNotification(`Quantidade (${quantidade}) excede o estoque máximo permitido para o produto (${produto.stqMax})`, 'error');
                return false;
            }

            return true;
        } catch (error) {
            console.warn('[VALIDAÇÃO] Erro ao validar estoque:', error);
            // Em caso de erro na validação, permite o prosseguimento mas avisa
            this.showNotification('Não foi possível validar o estoque. Prossiga com cautela.', 'warning');
            return true;
        }
    }

    /**
     * Validação em tempo real da quantidade
     */
    async validateQuantityInRealTime() {
        const quantityInput = document.getElementById('amount');
        const produtoSelect = document.getElementById('produtoSelect');
        const almoxOrigemSelect = document.getElementById('almox-origem-select');
        const saveBtn = document.getElementById('save-btn');
        const typeSelect = document.getElementById('type');

        if (!quantityInput || !produtoSelect || !almoxOrigemSelect || !saveBtn) {
            return;
        }

        const quantidade = parseInt(quantityInput.value);
        const produtoId = parseInt(produtoSelect.value);
        const almoxOrigemId = parseInt(almoxOrigemSelect.value);
        const tipoMovimentacao = typeSelect ? typeSelect.value : '';

        // Limpar mensagens anteriores
        this.clearValidationMessage();

        // Se for ENTRADA, não valida saldo de origem
        if (tipoMovimentacao === 'ENTRADA') {
            saveBtn.disabled = false;
            return;
        }

        if (quantidade && produtoId && almoxOrigemId) {
            // FORÇAR ATUALIZAÇÃO EM TEMPO REAL antes da validação
            try {
                // Apenas atualiza se não for muito frequente (debounce poderia ser melhor aqui)
                // await this.loadEstoquePorAlmoxarifadoTempoReal(); 
                // Comentado para evitar flood de requisições, usar dados em cache ou atualizar apenas no foco
            } catch (error) {
                console.warn('[VALIDAÇÃO] Erro ao atualizar dados em tempo real:', error);
            }

            const estoqueDisponivel = this.getEstoqueDisponivelNoAlmoxarifado(produtoId, almoxOrigemId);

            if (estoqueDisponivel === null) {
                this.showValidationMessage('⚠️ Produto não encontrado no almoxarifado selecionado', 'warning');
                // Não desabilita para permitir correção ou caso seja erro de carregamento
                return;
            }

            if (quantidade > estoqueDisponivel) {
                const nomeAlmox = this.almoxarifados.find(a => a.id == almoxOrigemId)?.nome || 'Almoxarifado desconhecido';
                this.showValidationMessage(
                    `❌ Quantidade insuficiente no ${nomeAlmox}! Disponível: ${estoqueDisponivel}`,
                    'error'
                );
                saveBtn.disabled = true;
            } else {
                const nomeAlmox = this.almoxarifados.find(a => a.id == almoxOrigemId)?.nome || 'Almoxarifado desconhecido';
                this.showValidationMessage(
                    `✅ OK - ${nomeAlmox} tem ${estoqueDisponivel} disponível`,
                    'success'
                );
                saveBtn.disabled = false;
            }
        } else {
            saveBtn.disabled = false;
        }
    }

    /**
     * Mostra mensagem de validação no formulário
     */
    showValidationMessage(message, type) {
        let validationDiv = document.getElementById('validation-message');
        if (!validationDiv) {
            validationDiv = document.createElement('div');
            validationDiv.id = 'validation-message';
            validationDiv.style.marginTop = 'var(--spacing-sm)';
            validationDiv.style.padding = 'var(--spacing-sm)';
            validationDiv.style.borderRadius = 'var(--border-radius-md)';
            validationDiv.style.fontSize = 'var(--font-size-sm)';
            validationDiv.style.fontWeight = 'var(--font-weight-medium)';

            const quantityInput = document.getElementById('amount');
            if (quantityInput && quantityInput.parentNode) {
                quantityInput.parentNode.appendChild(validationDiv);
            }
        }

        validationDiv.textContent = message;

        // Aplicar estilos baseados no tipo
        if (type === 'error') {
            validationDiv.style.background = 'var(--danger-100)';
            validationDiv.style.color = 'var(--danger-700)';
            validationDiv.style.border = '1px solid var(--danger-200)';
        } else if (type === 'warning') {
            validationDiv.style.background = 'var(--warning-100)';
            validationDiv.style.color = 'var(--warning-700)';
            validationDiv.style.border = '1px solid var(--warning-200)';
        } else if (type === 'success') {
            validationDiv.style.background = 'var(--success-100)';
            validationDiv.style.color = 'var(--success-700)';
            validationDiv.style.border = '1px solid var(--success-200)';
        }

        validationDiv.style.display = 'block';
    }

    /**
     * Remove mensagem de validação
     */
    clearValidationMessage() {
        const validationDiv = document.getElementById('validation-message');
        if (validationDiv) {
            validationDiv.style.display = 'none';
        }
    }
    /**
     * Obtém quantidade disponível de um produto em um setor específico
     */
    getEstoqueDisponivelNoAlmoxarifado(produtoId, almoxarifadoId) {
        if (!this.estoquePorAlmoxarifado || this.estoquePorAlmoxarifado.length === 0) {
            console.warn('[ESTOQUE] Dados não carregados');
            return null;
        }

        // Buscar estoque específico (suporta tanto estrutura antiga .produto quanto nova .item)
        const estoque = this.estoquePorAlmoxarifado.find(e =>
            (e.item?.id == produtoId || e.produto?.id == produtoId) &&
            e.almoxarifado?.id == almoxarifadoId
        );

        if (estoque) {
            // Se tiver quantidade (campo direto) ou quantidadeDisponivel (calculado)
            const qtd = estoque.quantidade !== undefined ? estoque.quantidade : (estoque.quantidadeDisponivel || 0);
            console.log(`[ESTOQUE] Produto ${produtoId} no Almoxarifado ${almoxarifadoId}: ${qtd} unidades`);
            return qtd;
        }

        console.warn(`[ESTOQUE] Produto ${produtoId} não encontrado no Almoxarifado ${almoxarifadoId}`);
        return 0; // Retorna 0 se não encontrar
    }

    /**
     * Obtém a quantidade disponível em estoque para um produto
     */
    getEstoqueDisponivel(estoqueId) {
        if (!this.estoquePorAlmoxarifado || this.estoquePorAlmoxarifado.length === 0) {
            console.warn('[MovimentacaoManager] Estoque por almoxarifado não carregado');
            return null;
        }

        const estoque = this.estoquePorAlmoxarifado.find(e => e.id == estoqueId);
        if (estoque) {
            return estoque.quantidadeDisponivel || 0;
        }

        // Se não encontrar no estoque por almoxarifado, tentar nos produtos
        if (this.produtos && this.produtos.length > 0) {
            const produto = this.produtos.find(p => p.id == estoqueId);
            if (produto && produto.stqMax !== undefined) {
                return produto.stqMax;
            }
        }

        console.warn(`[MovimentacaoManager] Estoque não encontrado para ID: ${estoqueId}`);
        return null;
    }

    /**
     * Atualiza o painel de estoque após movimentação - VERSÃO SIMPLIFICADA
     */
    async atualizarPainelEstoqueEmTempoReal() {
        try {
            console.log('[ATUALIZAÇÃO] Atualizando painel...');

            const before = this._estoqueSnapshot;
            await this.loadEstoquePorAlmoxarifadoTempoReal();
            const after = this._estoqueSnapshot;

            this.renderStockPanel();

            if (before !== after) {
                console.log('[ATUALIZAÇÃO] ✅ Estoque atualizado');
                this.showNotification('✅ Estoque atualizado', 'success', 1500);
            }

        } catch (error) {
            console.error('[ATUALIZAÇÃO] ❌ Erro:', error);
            // Fallback
            await this.loadEstoquePorAlmoxarifado();
            this.renderStockPanel();
        }
    }

    /**
     * Botão de atualização manual do painel
     */
    async refreshStockPanelInteractive(btn) {
        try {
            console.log('[REFRESH] Atualizando...');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '⏳ Carregando...';
            }

            const before = this._estoqueSnapshot;
            await this.loadEstoquePorAlmoxarifadoTempoReal();
            const after = this._estoqueSnapshot;

            this.renderStockPanel();

            if (before !== after) {
                this.showNotification('✅ Estoque atualizado', 'success', 1500);
            } else {
                this.showNotification('ℹ️ Sem alterações', 'info', 1500);
            }
        } catch (error) {
            console.error('[REFRESH] Erro:', error);
            this.showNotification('❌ Erro ao atualizar', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '🔄 Atualizar';
            }
        }
    }

    /**
     * Cria snapshot do estoque para detectar mudanças
     */
    createEstoqueSnapshot(lista) {
        if (!Array.isArray(lista)) return '';
        const compact = lista.map(e => ({
            s: e.setor?.id,
            p: e.produto?.id,
            q: e.quantidadeEstoque || 0
        }))
            .filter(e => e.s != null && e.p != null)
            .sort((a, b) => (a.s - b.s) || (a.p - b.p));
        return JSON.stringify(compact);
    }

    /**
     * Método público para atualização manual (pode ser chamado via console ou botão)
     */
    async atualizarDadosManual() {
        try {
            console.log('[MANUAL] Iniciando atualização manual dos dados...');
            this.setLoading(true);

            await Promise.all([
                this.loadMovimentacoes(),
                this.loadEstoquePorAlmoxarifadoTempoReal()
            ]);

            this.renderMovimentacoes();
            this.renderStockPanel();

            this.showNotification('🔄 Dados atualizados manualmente com sucesso!', 'success');
            console.log('[MANUAL] ✅ Atualização manual concluída');

        } catch (error) {
            console.error('[MANUAL] ❌ Erro na atualização manual:', error);
            this.showNotification('❌ Erro na atualização manual: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Renderiza o painel de estoque por setor - VERSÃO SIMPLIFICADA
     */
    renderStockPanel() {
        console.log('[RENDER_STOCK] 🎨 Renderizando painel...');

        const stockContainer = document.getElementById('stock-by-sector');
        if (!stockContainer) {
            console.warn('[RENDER_STOCK] Container não encontrado');
            return;
        }

        if (!this.estoquePorAlmoxarifado || this.estoquePorAlmoxarifado.length === 0) {
            stockContainer.innerHTML = '<div class="loading-stocks"><p>📦 Nenhum produto em estoque</p></div>';
            console.log('[RENDER_STOCK] Nenhum dado para exibir');
            return;
        }

        // Agrupar por almoxarifado
        const porAlmoxarifado = {};

        this.estoquePorAlmoxarifado.forEach(item => {
            const almoxNome = item.almoxarifado?.nome || item.almoxarifado?.descricao || 'Sem Almoxarifado';

            if (!porAlmoxarifado[almoxNome]) {
                porAlmoxarifado[almoxNome] = [];
            }

            porAlmoxarifado[almoxNome].push(item);
        });

        // Garantir que almoxarifados cadastrados apareçam
        if (this.almoxarifados && this.almoxarifados.length > 0) {
            this.almoxarifados.forEach(almox => {
                const nome = almox.nome || almox.descricao;
                if (!porAlmoxarifado[nome]) {
                    porAlmoxarifado[nome] = [];
                }
            });
        }

        // Ordenar almoxarifados
        const almoxarifadosOrdenados = Object.keys(porAlmoxarifado).sort();

        console.log('[RENDER_STOCK] Almoxarifados a renderizar:', almoxarifadosOrdenados);

        // Gerar HTML
        let html = '';

        almoxarifadosOrdenados.forEach(almoxNome => {
            const produtos = porAlmoxarifado[almoxNome];
            const totalQtd = produtos.reduce((sum, p) => sum + (p.quantidadeDisponivel || 0), 0);

            html += `
                <div class="stock-group">
                    <h5 class="stock-group-title">
                        🏢 ${almoxNome}
                        <span class="stock-group-summary">(${produtos.length} produto${produtos.length !== 1 ? 's' : ''}, ${totalQtd} und)</span>
                    </h5>
                    <div class="stock-group-content">
            `;

            if (produtos.length === 0) {
                html += `
                    <div class="stock-item" style="opacity: 0.6; font-style: italic;">
                        <div class="stock-item-header">
                            <span class="stock-item-name">📦 Nenhum produto</span>
                            <span class="stock-item-quantity low-stock">0</span>
                        </div>
                    </div>
                `;
            } else {
                produtos.forEach(item => {
                    // Suporte para estrutura nova (.item) e antiga (.produto)
                    const produtoNome = item.item?.nomeItem || item.produto?.nome || 'Produto sem nome';
                    const produtoId = item.item?.id || item.produto?.id;
                    const loteNome = item.lote?.nomeLote || 'Lote N/A';
                    // Quantidade pode vir como 'quantidade' (entidade) ou 'quantidadeDisponivel' (DTO)
                    const qtd = item.quantidade !== undefined ? item.quantidade : (item.quantidadeDisponivel || 0);

                    const cssClass = qtd === 0 ? 'low-stock' : qtd <= 10 ? 'low-stock' : qtd <= 50 ? 'medium-stock' : 'good-stock';

                    html += `
                        <div class="stock-item" data-produto-id="${produtoId}" data-almox-id="${item.almoxarifado?.id}" data-lote-id="${item.lote?.id}">
                            <div class="stock-item-header">
                                <span class="stock-item-name">${produtoNome}</span>
                                <span class="stock-item-quantity ${cssClass}">${qtd}</span>
                            </div>
                            <div class="stock-item-details" style="font-size: 0.8em; color: #666;">
                                📦 ${loteNome}
                            </div>
                            <div class="stock-item-sector">📍 ${almoxNome}</div>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>
            `;
        });

        stockContainer.innerHTML = html;

        // Adicionar listeners para seleção
        const items = stockContainer.querySelectorAll('.stock-item[data-produto-id][data-almox-id]');
        items.forEach(el => {
            el.addEventListener('click', () => {
                const produtoId = el.getAttribute('data-produto-id');
                const almoxId = el.getAttribute('data-almox-id');
                const loteId = el.getAttribute('data-lote-id');

                const produtoSelect = document.getElementById('produtoSelect');
                const almoxOrigemSelect = document.getElementById('almox-origem-select');
                const loteInput = document.getElementById('lote-id');

                if (produtoId && produtoSelect) {
                    produtoSelect.value = produtoId;
                }
                if (almoxId && almoxOrigemSelect) {
                    almoxOrigemSelect.value = almoxId;
                }
                if (loteId && loteInput) {
                    loteInput.value = loteId;
                }

                el.classList.add('selected');
                setTimeout(() => el.classList.remove('selected'), 500);

                this.validateQuantityInRealTime();
            });
        });

        console.log('[RENDER_STOCK] ✅ Painel renderizado');
    }

    /**
     * Carrega lotes disponíveis para seleção
     */
    async loadLotesDisponiveis() {
        try {
            console.log('[LOTES] Carregando lotes disponíveis...');
            // Usando o endpoint que criamos anteriormente
            const response = await this.apiManager.request('/movimentacao/lotes-disponiveis');

            if (response.success && response.data) {
                this.lotesDisponiveis = response.data;
                this.populateLoteSelect();
            } else {
                console.warn('[LOTES] Falha ao carregar lotes:', response);
                this.lotesDisponiveis = [];
                this.populateLoteSelect();
            }
        } catch (error) {
            console.error('[LOTES] Erro:', error);
            this.lotesDisponiveis = [];
            this.populateLoteSelect();
        }
    }

    /**
     * Popula o select de lotes
     */
    populateLoteSelect() {
        const select = document.getElementById('loteSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um lote...</option>';

        if (!this.lotesDisponiveis || this.lotesDisponiveis.length === 0) {
            select.innerHTML += '<option value="" disabled>Nenhum lote disponível</option>';
            return;
        }

        this.lotesDisponiveis.forEach(lote => {
            const option = document.createElement('option');
            option.value = lote.idLote;
            // Mostra: Nome Lote - Produto (Qtd)
            option.textContent = `${lote.nomeLote} - ${lote.nomeProduto} (Qtd: ${lote.quantidadeDisponivel})`;
            option.dataset.lote = JSON.stringify(lote);
            select.appendChild(option);
        });
    }

    /**
     * Manipula a mudança de seleção do lote
     */
    handleLoteChange() {
        const loteSelect = document.getElementById('loteSelect');
        const produtoSelect = document.getElementById('produtoSelect');
        const almoxOrigemSelect = document.getElementById('almox-origem-select');
        const loteIdInput = document.getElementById('lote-id');

        if (!loteSelect || !produtoSelect) return;

        const selectedOption = loteSelect.selectedOptions[0];
        if (!selectedOption || !selectedOption.value) {
            // Resetar campos se nenhum lote selecionado
            produtoSelect.value = '';
            if (almoxOrigemSelect) almoxOrigemSelect.value = '';
            if (loteIdInput) loteIdInput.value = '';
            return;
        }

        try {
            const loteData = JSON.parse(selectedOption.dataset.lote);
            console.log('[LOTE] Lote selecionado:', loteData);

            // 1. Setar ID do lote no campo hidden
            if (loteIdInput) loteIdInput.value = loteData.idLote;

            // 2. Setar Almoxarifado de Origem
            if (almoxOrigemSelect) {
                almoxOrigemSelect.value = loteData.idAlmoxarifado;
                // Disparar evento change para validações visuais se houver
                almoxOrigemSelect.dispatchEvent(new Event('change'));
            }

            // 3. Setar Produto
            // Verificar se a opção já existe, se não, criar temporariamente
            let productOption = produtoSelect.querySelector(`option[value="${loteData.idProduto}"]`);
            if (!productOption) {
                console.log('[LOTE] Produto não encontrado no select, adicionando temporariamente...');
                productOption = document.createElement('option');
                productOption.value = loteData.idProduto;
                productOption.textContent = loteData.nomeProduto;
                produtoSelect.appendChild(productOption);
            }

            produtoSelect.value = loteData.idProduto;

            // 4. Validar quantidade máxima permitida (que é a do lote)
            const quantityInput = document.getElementById('amount');
            if (quantityInput) {
                quantityInput.max = loteData.quantidadeDisponivel;
                quantityInput.placeholder = `Máx: ${loteData.quantidadeDisponivel}`;
            }

            // Validar em tempo real
            this.validateQuantityInRealTime();

        } catch (e) {
            console.error('[LOTE] Erro ao processar seleção de lote:', e);
        }
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateString) {
        if (!dateString) {
            console.warn('[formatDate] Data não fornecida, usando data atual');
            const agora = new Date();
            return agora.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        try {
            let date;

            // Se é um array (formato LocalDate do Spring Boot) [ano, mês, dia]
            if (Array.isArray(dateString) && dateString.length >= 3) {
                const ano = dateString[0];
                const mes = dateString[1] - 1; // Converter de 1-12 para 0-11
                const dia = dateString[2];
                date = new Date(ano, mes, dia);
            } else if (typeof dateString === 'string') {
                // Se é uma string no formato ISO (YYYY-MM-DD)
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                    date = new Date(dateString);
                }
            } else {
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) {
                const agora = new Date();
                return agora.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }

            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

        } catch (error) {
            console.error('[formatDate] Erro ao formatar data:', error);
            const agora = new Date();
            return agora.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    }

    formatTime(timeString) {
        if (!timeString) {
            const agora = new Date();
            return agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        try {
            // Se já está no formato HH:mm:ss ou HH:mm
            if (typeof timeString === 'string' && timeString.includes(':')) {
                const parts = timeString.split(':');
                if (parts.length >= 2) {
                    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                }
            }

            // Se é um array [H, M, S]
            if (Array.isArray(timeString) && timeString.length >= 2) {
                const hours = timeString[0].toString().padStart(2, '0');
                const minutes = timeString[1].toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }

            // Se é um objeto LocalTime
            if (typeof timeString === 'object' && timeString !== null) {
                if (timeString.hour !== undefined && timeString.minute !== undefined) {
                    const hours = timeString.hour.toString().padStart(2, '0');
                    const minutes = timeString.minute.toString().padStart(2, '0');
                    return `${hours}:${minutes}`;
                }
            }

            const date = new Date(timeString);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            return '--:--';
        } catch (error) {
            return '--:--';
        }
    }

    formatDateTime(dateString, timeString) {
        const formattedDate = this.formatDate(dateString);
        const formattedTime = this.formatTime(timeString);
        return `${formattedDate} ${formattedTime}`;
    }

    /**
     * Formata data local para formato YYYY-MM-DD (evita problemas de UTC)
     */
    formatLocalDateForBackend(date = new Date()) {
        const ano = date.getFullYear();
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    /**
     * Formata hora local para formato HH:mm:ss (evita problemas de UTC)
     */
    formatLocalTimeForBackend(date = new Date()) {
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        const segundos = String(date.getSeconds()).padStart(2, '0');
        return `${horas}:${minutos}:${segundos}`;
    }

    getTipoIcon(tipo) {
        const icons = {
            'ENTRADA': '📥',
            'SAIDA': '📤',
            'TRANSFERENCIA': '🔄',
            'AJUSTE': '⚖️'
        };
        return icons[tipo] || '📦';
    }
}

// Inicializar quando o DOM estiver pronto
let movimentacaoManager;
document.addEventListener('DOMContentLoaded', () => {
    movimentacaoManager = new MovimentacaoManager();
    window.movimentacaoManager = movimentacaoManager; // Tornar global para debug
});