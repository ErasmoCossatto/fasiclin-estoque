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
            const response = await fetch(`${this.apiManager.baseURL}/movimentacoes`, {
                method: 'GET',
                headers: this.apiManager.headers
            });

            if (response.ok) {
                console.log('[CONECTIVIDADE] ✅ Backend conectado com sucesso!');
                console.log('[CONECTIVIDADE] Status:', response.status, response.statusText);
            } else {
                console.error('[CONECTIVIDADE] ❌ Backend retornou erro:', response.status, response.statusText);
                this.showNotification(`⚠️ Backend retornou erro: ${response.status}. Verifique se o servidor está rodando.`, 'error', 6000);
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

        if (quantityInput && produtoSelect && almoxOrigemSelect) {
            [quantityInput, produtoSelect, almoxOrigemSelect].forEach(element => {
                element.addEventListener('change', () => this.validateQuantityInRealTime());
                element.addEventListener('input', () => this.validateQuantityInRealTime());
            });
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
     * @description Carrega movimentações, produtos, almoxarifados e estoque em paralelo.
     *              Após o carregamento, renderiza automaticamente as movimentações na tabela.
     * @throws {Error} Se houver falha ao carregar qualquer recurso
     */
    async loadData() {
        this.setLoading(true);

        try {
            console.log('[MovimentacaoManager] 🔄 Carregando todos os dados...');

            // Carrega dados em paralelo
            const promises = [
                this.loadMovimentacoes(),
                this.loadProdutos(),
                this.loadAlmoxarifados(),
                this.loadEstoquePorAlmoxarifado()
            ];

            await Promise.all(promises);

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

            // Buscar todos os almoxarifados com seus saldos
            const almoxarifados = await this.apiManager.listarAlmoxarifados();

            // Para cada almoxarifado, buscar o saldo
            const estoquePromises = almoxarifados.map(async (almox) => {
                const saldo = await this.apiManager.consultarSaldoAlmoxarifado(almox.id);
                return saldo.map(item => ({
                    ...item,
                    almoxarifado: almox
                }));
            });

            const resultados = await Promise.all(estoquePromises);
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
     * @async
     * @param {Event} event - Evento de submissão do formulário
     * @returns {Promise<void>}
     * @description Valida formulário, envia dados ao backend via POST/PUT,
     *              recarrega dados e atualiza a interface após sucesso.
     * @throws {Error} Se houver falha na validação ou no salvamento
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
            if (this.currentEditId) {
                console.log('[SAVE] Atualizando movimentação:', this.currentEditId);
                response = await this.apiManager.request(`/movimentacoes/${this.currentEditId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                console.log('[SAVE] Criando nova movimentação');
                response = await this.apiManager.request('/movimentacoes/entre-setores', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }

            if (response.success || response.id) {
                // Sucesso!
                this.showNotification(
                    this.currentEditId ? '✅ Movimentação atualizada!' : '✅ Movimentação criada!',
                    'success'
                );

                // Fechar modal
                this.hideModal();

                // Aguardar backend processar
                await new Promise(resolve => setTimeout(resolve, 500));

                // Recarregar dados
                await Promise.all([
                    this.loadMovimentacoes(),
                    this.loadEstoquePorSetorTempoReal()
                ]);

                // Renderizar
                this.renderMovimentacoes();

                console.log('[SAVE] ✅ Salvamento concluído');
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
     * Obtém dados do formulário formatados para transferência entre almoxarifados
     * @returns {Object} Objeto com dados formatados no padrão MovimentacaoEntreSetoresDTO
     * @description Coleta valores dos campos do formulário e formata para envio ao backend.
     *              Captura data/hora local do sistema para evitar problemas de UTC.
     * @property {number} produtoId - ID do produto
     * @property {number} setorOrigemId - ID do almoxarifado de origem
     * @property {number} setorDestinoId - ID do almoxarifado de destino
     * @property {number} quantidade - Quantidade a transferir
     * @property {string} tipoMovimentacao - Tipo da movimentação (ENTRADA/TRANSFERENCIA)
     * @property {string} dataMovimentacao - Data no formato YYYY-MM-DD
     * @property {string} horaMovimentacao - Hora no formato HH:mm:ss
     */
    getFormData() {
        const produtoId = parseInt(document.getElementById('produtoSelect').value);
        const setorOrigemId = parseInt(document.getElementById('setor-origem-select').value);
        const setorDestinoId = parseInt(document.getElementById('setor-destino-select').value);
        const quantidade = parseInt(document.getElementById('amount').value) || 0;
        const tipoMovimentacao = document.getElementById('type').value;

        // Capturar data e hora local do PC (sem problemas de UTC)
        const agora = new Date();
        const dataLocal = this.formatLocalDateForBackend(agora);
        const horaLocal = this.formatLocalTimeForBackend(agora);

        console.log('[MovimentacaoManager] Coletando dados do formulário para transferência entre setores:', {
            produtoId,
            setorOrigemId,
            setorDestinoId,
            quantidade,
            tipoMovimentacao,
            dataMovimentacao: dataLocal,
            horaMovimentacao: horaLocal,
            usuario: 'null (aguardando implementação de variável global)'
        });

        // Formato esperado pelo MovimentacaoEntreSetoresDTO
        // NOTA: dataMovimentacao e horaMovimentacao são INFORMATIVAS apenas
        // O backend SEMPRE usa LocalDate.now() e LocalTime.now() para garantir consistência
        return {
            idProduto: produtoId,
            idSetorOrigem: setorOrigemId,
            idSetorDestino: setorDestinoId,
            quantidade: quantidade,
            tipoMovimentacao: tipoMovimentacao,
            idUsuario: null, // Temporariamente null até implementar variável global
            dataMovimentacao: dataLocal, // Informativo - backend usa data do servidor
            horaMovimentacao: horaLocal  // Informativo - backend usa hora do servidor
        };
    }

    /**
     * Valida formulário para transferência entre setores
     */
    async validateForm(data) {
        console.log('[VALIDAÇÃO] Iniciando validação do formulário...');
        console.log('[VALIDAÇÃO] Dados recebidos:', data);

        const errors = [];

        if (!data.idProduto) {
            console.log('[VALIDAÇÃO] ❌ Produto não selecionado');
            errors.push('Selecione um produto');
        } else {
            console.log('[VALIDAÇÃO] ✅ Produto selecionado:', data.idProduto);
        }

        if (!data.idSetorOrigem) {
            console.log('[VALIDAÇÃO] ❌ Setor de origem não selecionado');
            errors.push('Selecione o setor de origem');
        } else {
            console.log('[VALIDAÇÃO] ✅ Setor de origem selecionado:', data.idSetorOrigem);
        }

        if (!data.idSetorDestino) {
            console.log('[VALIDAÇÃO] ❌ Setor de destino não selecionado');
            errors.push('Selecione o setor de destino');
        } else {
            console.log('[VALIDAÇÃO] ✅ Setor de destino selecionado:', data.idSetorDestino);
        }

        if (!data.tipoMovimentacao) {
            console.log('[VALIDAÇÃO] ❌ Tipo de movimentação não selecionado');
            errors.push('Selecione o tipo de movimentação');
        } else {
            console.log('[VALIDAÇÃO] ✅ Tipo de movimentação selecionado:', data.tipoMovimentacao);
        }

        if (!data.quantidade || data.quantidade <= 0) {
            console.log('[VALIDAÇÃO] ❌ Quantidade inválida:', data.quantidade);
            errors.push('Digite uma quantidade válida');
        } else {
            console.log('[VALIDAÇÃO] ✅ Quantidade válida:', data.quantidade);
        }

        // Validar se setor origem é diferente do destino
        if (data.idSetorOrigem === data.idSetorDestino) {
            console.log('[VALIDAÇÃO] ❌ Setores de origem e destino são iguais');
            errors.push('Setor de origem deve ser diferente do setor de destino');
        }

        if (errors.length > 0) {
            console.log('[VALIDAÇÃO] ❌ Validação falhou com', errors.length, 'erros:', errors);
            this.showNotification(errors.join('<br>'), 'error');
            return false;
        }

        // Validação avançada de estoque disponível
        if (data.idProduto && data.quantidade && data.idSetorOrigem) {
            console.log('[VALIDAÇÃO] Verificando estoque disponível...');
            const estoqueNoSetor = this.getEstoqueDisponivelNoSetor(data.idProduto, data.idSetorOrigem);

            console.log('[VALIDAÇÃO] Estoque disponível no setor:', estoqueNoSetor);

            if (estoqueNoSetor === null) {
                console.log('[VALIDAÇÃO] ❌ Produto não encontrado no setor de origem');
                this.showNotification(
                    `❌ Produto não encontrado no setor de origem!<br>` +
                    `Verifique se há estoque disponível no setor selecionado.`,
                    'error'
                );
                return false;
            }

            if (data.quantidade > estoqueNoSetor) {
                console.log('[VALIDAÇÃO] ❌ Quantidade solicitada maior que disponível');
                const nomeSetorOrigem = this.setores.find(s => s.id == data.idSetorOrigem)?.nome || 'Setor desconhecido';
                this.showNotification(
                    `❌ Quantidade insuficiente no setor de origem!<br>` +
                    `Setor: ${nomeSetorOrigem}<br>` +
                    `Disponível: ${estoqueNoSetor}<br>` +
                    `Solicitado: ${data.quantidade}`,
                    'error'
                );
                return false;
            }

            console.log('[VALIDAÇÃO] ✅ Estoque suficiente no setor de origem');
        }

        console.log('[VALIDAÇÃO] ✅ Formulário validado com sucesso!');
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

            // Usa o endpoint que lista todos os produtos
            const response = await fetch(`${this.apiManager.baseURL}/produto`, {
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

            // Monta o texto da opção
            let textoOpcao = produto.nome;
            if (produto.descricao) {
                textoOpcao += ` - ${produto.descricao}`;
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
        const setorOrigemSelect = document.getElementById('setor-origem-select');
        const saveBtn = document.getElementById('save-btn');

        if (!quantityInput || !produtoSelect || !setorOrigemSelect || !saveBtn) {
            return;
        }

        const quantidade = parseInt(quantityInput.value);
        const produtoId = parseInt(produtoSelect.value);
        const setorOrigemId = parseInt(setorOrigemSelect.value);

        // Limpar mensagens anteriores
        this.clearValidationMessage();

        if (quantidade && produtoId && setorOrigemId) {
            // FORÇAR ATUALIZAÇÃO EM TEMPO REAL antes da validação
            try {
                console.log('[VALIDAÇÃO] Atualizando dados para validação em tempo real...');
                await this.loadEstoquePorSetorTempoReal();
            } catch (error) {
                console.warn('[VALIDAÇÃO] Erro ao atualizar dados em tempo real, usando cache:', error);
            }

            const estoqueDisponivel = this.getEstoqueDisponivelNoSetor(produtoId, setorOrigemId);

            if (estoqueDisponivel === null) {
                this.showValidationMessage('⚠️ Produto não encontrado no setor selecionado', 'warning');
                saveBtn.disabled = true;
                return;
            }

            if (quantidade > estoqueDisponivel) {
                const nomeSetor = this.setores.find(s => s.id == setorOrigemId)?.nome || 'Setor desconhecido';
                this.showValidationMessage(
                    `❌ Quantidade insuficiente no ${nomeSetor}! Disponível: ${estoqueDisponivel}`,
                    'error'
                );
                saveBtn.disabled = true;
            } else {
                const nomeSetor = this.setores.find(s => s.id == setorOrigemId)?.nome || 'Setor desconhecido';
                this.showValidationMessage(
                    `✅ OK - ${nomeSetor} tem ${estoqueDisponivel} disponível (dados atualizados)`,
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
    getEstoqueDisponivelNoSetor(produtoId, setorId) {
        if (!this.estoquePorSetor || this.estoquePorSetor.length === 0) {
            console.warn('[ESTOQUE] Dados não carregados');
            return null;
        }

        // Buscar estoque específico
        const estoque = this.estoquePorSetor.find(e =>
            e.produto?.id == produtoId && e.setor?.id == setorId
        );

        if (estoque) {
            const qtd = estoque.quantidadeEstoque || 0;
            console.log(`[ESTOQUE] Produto ${produtoId} no Setor ${setorId}: ${qtd} unidades`);
            return qtd;
        }

        console.warn(`[ESTOQUE] Produto ${produtoId} não encontrado no Setor ${setorId}`);
        return 0; // Retorna 0 se não encontrar
    }

    /**
     * Obtém a quantidade disponível em estoque para um produto
     */
    getEstoqueDisponivel(estoqueId) {
        if (!this.estoquePorSetor || this.estoquePorSetor.length === 0) {
            console.warn('[MovimentacaoManager] Estoque por setor não carregado');
            return null;
        }

        const estoque = this.estoquePorSetor.find(e => e.id == estoqueId);
        if (estoque) {
            return estoque.quantidadeEstoque || 0;
        }

        // Se não encontrar no estoque por setor, tentar nos produtos
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
            await this.loadEstoquePorSetorTempoReal();
            const after = this._estoqueSnapshot;

            this.renderStockPanel();

            if (before !== after) {
                console.log('[ATUALIZAÇÃO] ✅ Estoque atualizado');
                this.showNotification('✅ Estoque atualizado', 'success', 1500);
            }

        } catch (error) {
            console.error('[ATUALIZAÇÃO] ❌ Erro:', error);
            // Fallback
            await this.loadEstoquePorSetor();
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
            await this.loadEstoquePorSetorTempoReal();
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
                this.loadEstoquePorSetorTempoReal()
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
                    const produtoNome = item.produto?.nome || 'Produto sem nome';
                    const qtd = item.quantidadeDisponivel || 0;
                    const cssClass = qtd === 0 ? 'low-stock' : qtd <= 10 ? 'low-stock' : qtd <= 50 ? 'medium-stock' : 'good-stock';

                    html += `
                        <div class="stock-item" data-produto-id="${item.produto?.id}" data-almox-id="${item.almoxarifado?.id}">
                            <div class="stock-item-header">
                                <span class="stock-item-name">${produtoNome}</span>
                                <span class="stock-item-quantity ${cssClass}">${qtd}</span>
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

                const produtoSelect = document.getElementById('produtoSelect');
                const almoxOrigemSelect = document.getElementById('almox-origem-select');

                if (produtoId && produtoSelect) {
                    produtoSelect.value = produtoId;
                }
                if (almoxId && almoxOrigemSelect) {
                    almoxOrigemSelect.value = almoxId;
                }

                el.classList.add('selected');
                setTimeout(() => el.classList.remove('selected'), 500);

                this.validateQuantityInRealTime();
            });
        });

        console.log('[RENDER_STOCK] ✅ Painel renderizado');
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

            console.log('[formatDate] Data recebida:', dateString, 'Tipo:', typeof dateString, 'É array:', Array.isArray(dateString));

            // Se é um array (formato LocalDate do Spring Boot) [ano, mês, dia]
            if (Array.isArray(dateString) && dateString.length >= 3) {
                // Spring Boot retorna: [ano, mês (1-12), dia]
                // JavaScript Date espera: (ano, mês (0-11), dia)
                const ano = dateString[0];
                const mes = dateString[1] - 1; // Converter de 1-12 para 0-11
                const dia = dateString[2];

                console.log('[formatDate] Criando data a partir de array:', { ano, mes: mes + 1, dia });
                date = new Date(ano, mes, dia);
            } else if (typeof dateString === 'string') {
                // Se é uma string no formato ISO (YYYY-MM-DD)
                console.log('[formatDate] Processando string de data:', dateString);
                // Usar parseISO corretamente para evitar problemas de timezone
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                    date = new Date(dateString);
                }
            } else {
                // Tentar conversão direta
                date = new Date(dateString);
            }

            // Verificar se a data é válida
            if (isNaN(date.getTime())) {
                console.warn('[formatDate] Data inválida após conversão:', dateString);
                const agora = new Date();
                return agora.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }

            const formatted = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            console.log('[formatDate] Data formatada:', formatted);
            return formatted;

        } catch (error) {
            console.error('[formatDate] Erro ao formatar data:', error, 'Data recebida:', dateString);
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
            console.warn('[formatTime] Hora não fornecida, usando hora atual');
            const agora = new Date();
            return agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        try {
            console.log('[formatTime] Hora recebida:', timeString, 'Tipo:', typeof timeString, 'É array:', Array.isArray(timeString));

            // Se já está no formato HH:mm:ss ou HH:mm, extrair apenas HH:mm
            if (typeof timeString === 'string' && timeString.includes(':')) {
                const parts = timeString.split(':');
                if (parts.length >= 2) {
                    const formatted = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                    console.log('[formatTime] Hora formatada de string:', formatted);
                    return formatted;
                }
            }

            // Se é um array [H, M, S] (formato LocalTime do Spring Boot)
            if (Array.isArray(timeString) && timeString.length >= 2) {
                const hours = timeString[0].toString().padStart(2, '0');
                const minutes = timeString[1].toString().padStart(2, '0');
                const formatted = `${hours}:${minutes}`;
                console.log('[formatTime] Hora formatada de array:', formatted);
                return formatted;
            }

            // Se é um objeto LocalTime do Jackson
            if (typeof timeString === 'object' && timeString !== null) {
                if (timeString.hour !== undefined && timeString.minute !== undefined) {
                    const hours = timeString.hour.toString().padStart(2, '0');
                    const minutes = timeString.minute.toString().padStart(2, '0');
                    const formatted = `${hours}:${minutes}`;
                    console.log('[formatTime] Hora formatada de objeto:', formatted);
                    return formatted;
                }
            }

            // Tentar criar uma data e extrair a hora
            const date = new Date(timeString);
            if (!isNaN(date.getTime())) {
                const formatted = date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                console.log('[formatTime] Hora formatada de Date:', formatted);
                return formatted;
            }

            console.warn('[formatTime] Não foi possível formatar hora:', timeString);
            return '--:--';
        } catch (error) {
            console.error('[formatTime] Erro ao formatar hora:', error);
            return '--:--';
        }
    }

    formatDateTime(dateString, timeString) {
        const formattedDate = this.formatDate(dateString);
        const formattedTime = this.formatTime(timeString);

        // O formatDate agora sempre retorna uma data válida (atual como fallback)
        // então não precisamos verificar se é 'N/A'
        return `${formattedDate} ${formattedTime}`;
    }

    /**
     * Formata data local para formato YYYY-MM-DD (evita problemas de UTC)
     */
    formatLocalDateForBackend(date = new Date()) {
        const ano = date.getFullYear();
        const mes = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() retorna 0-11
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