/**
 * MovimentacaoManager - Gerenciador de movimentações integrado com Spring Boot
 */
class MovimentacaoManager {
    constructor() {
        this.apiManager = window.apiManager;
        this.movimentacoes = [];
        this.estoques = [];
        this.usuarios = [];
        this.setores = [];
        this.estoquePorSetor = [];
        this.currentEditId = null;
        this.isLoading = false;
        
        // Paginação
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalPages = 0;
        
        this.init();
    }

    /**
     * Inicializa o gerenciador
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
     * Testa a conectividade com o backend
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
     * Vincula eventos aos elementos
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
        const setorOrigemSelect = document.getElementById('setor-origem-select');
        
        if (quantityInput && produtoSelect && setorOrigemSelect) {
            [quantityInput, produtoSelect, setorOrigemSelect].forEach(element => {
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

        console.log('[MovimentacaoManager] Eventos vinculados');
    }

    /**
     * Carrega todos os dados necessários
     */
    async loadData() {
        this.setLoading(true);
        
        try {
            console.log('[MovimentacaoManager] 🔄 Carregando todos os dados...');
            
            // Carrega dados em paralelo
            const promises = [
                this.loadMovimentacoes(),
                this.loadProdutos(), // Carrega estoques (que contêm produtos)
                // this.loadUsuarios(), // Removido - usuário será definido automaticamente
                this.loadSetores(),
                this.loadEstoquePorSetor() // Nova função para carregar estoque por setor
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
     * Carrega setores do servidor
     */
    async loadSetores() {
        try {
            console.log('[SETORES] 🔄 Iniciando carregamento de setores...');
            console.log('[SETORES] Chamando endpoint:', `${this.apiManager.baseURL}/setores`);
            
            const setores = await this.apiManager.listarSetores();
            
            console.log('[SETORES] Resposta da API:', setores);
            
            this.setores = setores || [];
            console.log(`[SETORES] ✅ ${this.setores.length} setores carregados:`, this.setores);
            
            if (this.setores.length === 0) {
                console.warn('[SETORES] ⚠️ Nenhum setor encontrado! Verifique se há dados no banco.');
                this.showNotification('⚠️ Nenhum setor encontrado no sistema', 'warning', 4000);
            }
            
            this.populateSetorSelects();
        } catch (error) {
            console.error('[SETORES] ❌ Erro ao carregar setores:', error);
            this.setores = [];
            this.showNotification('❌ Erro ao carregar setores: ' + error.message, 'error');
        }
    }

    /**
     * Carrega estoque agrupado por setor
     */
    async loadEstoquePorSetor() {
        try {
            console.log('[ESTOQUE_SETOR] 🔄 Iniciando carregamento de estoque por setor...');
            console.log('[ESTOQUE_SETOR] Endpoint primário:', `${this.apiManager.baseURL}/estoque/por-setor`);
            
            let response = null;
            
            // Tentar primeiro o endpoint específico
            try {
                response = await this.apiManager.request('/estoque/por-setor');
                console.log('[ESTOQUE_SETOR] ✅ Endpoint /estoque/por-setor funcionou');
            } catch (error) {
                console.warn('[ESTOQUE_SETOR] ⚠️ Endpoint /estoque/por-setor não disponível, tentando /estoque');
                // Fallback para endpoint tradicional
                response = await this.apiManager.request('/estoque');
            }
            
            console.log('[ESTOQUE_SETOR] ========== RESPOSTA COMPLETA DA API ==========');
            console.log('[ESTOQUE_SETOR] Response success:', response.success);
            console.log('[ESTOQUE_SETOR] Response data type:', typeof response.data);
            console.log('[ESTOQUE_SETOR] Response data is array:', Array.isArray(response.data));
            console.log('[ESTOQUE_SETOR] Response data:', response.data);
            console.log('[ESTOQUE_SETOR] ===============================================');
            
            if (response.success && response.data) {
                // Garantir que os dados sejam um array
                let dados = response.data;
                
                // Se os dados tiverem estrutura paginada (content), usar o content
                if (dados.content && Array.isArray(dados.content)) {
                    console.log('[ESTOQUE_SETOR] Estrutura paginada detectada, usando content');
                    dados = dados.content;
                } else if (dados.data && Array.isArray(dados.data)) {
                    console.log('[ESTOQUE_SETOR] Estrutura com data interno detectada');
                    dados = dados.data;
                }
                
                this.estoquePorSetor = Array.isArray(dados) ? dados : [dados];
                console.log(`[ESTOQUE_SETOR] ✅ ${this.estoquePorSetor.length} registros de estoque por setor carregados`);
                
                // Log COMPLETO de TODOS os itens para debug
                if (this.estoquePorSetor.length > 0) {
                    console.log('[ESTOQUE_SETOR] ========== TODOS OS ITENS CARREGADOS ==========');
                    this.estoquePorSetor.forEach((item, index) => {
                        console.log(`[ESTOQUE_SETOR] Item ${index + 1}:`, {
                            id: item.id,
                            produto: item.produto?.nome || item.nomeProduto || 'N/A',
                            setor: item.setor?.nome || item.nomeSetor || 'N/A',
                            quantidade: item.quantidadeEstoque || item.quantidade || 0
                        });
                    });
                    console.log('[ESTOQUE_SETOR] ================================================');
                } else {
                    console.warn('[ESTOQUE_SETOR] ⚠️ Array está vazio! Nenhum item encontrado no estoque por setor!');
                    this.showNotification('⚠️ Nenhum produto em estoque encontrado. Verifique se há dados cadastrados.', 'warning', 4000);
                }
            } else {
                console.warn('[ESTOQUE_SETOR] ⚠️ Resposta sem sucesso ou sem dados:', response);
                this.estoquePorSetor = [];
                this.showNotification('⚠️ Não foi possível carregar o estoque. Verifique a conexão com o servidor.', 'warning', 4000);
            }
            
        } catch (error) {
            console.error('[ESTOQUE_SETOR] ❌ Erro ao carregar estoque por setor:', error);
            console.error('[ESTOQUE_SETOR] Stack trace:', error.stack);
            this.estoquePorSetor = [];
            this.showNotification('❌ Erro ao carregar estoque: ' + error.message, 'error', 5000);
        }
    }

    /**
     * Carrega estoque em TEMPO REAL (sem cache) - usado após movimentações
     */
    async loadEstoquePorSetorTempoReal() {
        try {
            console.log('[TEMPO REAL] 🔄 Carregando estoque atualizado sem cache...');
            
            // Usar o novo endpoint que força consulta direta ao banco
            const response = await this.apiManager.request('/estoque/tempo-real');
            
            console.log('[TEMPO REAL] ========== RESPOSTA COMPLETA DA API ==========');
            console.log('[TEMPO REAL] Response success:', response.success);
            console.log('[TEMPO REAL] Response data:', response.data);
            console.log('[TEMPO REAL] ===============================================');
            
            if (response.success && response.data) {
                this.estoquePorSetor = Array.isArray(response.data) ? response.data : [response.data];
                console.log(`[TEMPO REAL] ✅ ${this.estoquePorSetor.length} registros atualizados carregados`);
                
                // Log detalhado de TODOS os dados recebidos
                console.log('[TEMPO REAL] ========== TODOS OS ITENS ATUALIZADOS ==========');
                this.estoquePorSetor.forEach((item, index) => {
                    console.log(`[TEMPO REAL] Item ${index + 1}:`, {
                        id: item.id,
                        produto: item.produto?.nome,
                        setor: item.setor?.nome,
                        quantidade: item.quantidadeEstoque
                    });
                });
                console.log('[TEMPO REAL] ================================================');
                
            } else {
                console.warn('[TEMPO REAL] ⚠️ Nenhum estoque encontrado na resposta');
                this.estoquePorSetor = [];
            }
            
        } catch (error) {
            console.error('[TEMPO REAL] ❌ Erro ao carregar estoque em tempo real:', error);
            console.error('[TEMPO REAL] Stack trace:', error.stack);
            this.estoquePorSetor = [];
            throw error;
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
     * Popula selects de setores
     */
    populateSetorSelects() {
        const selectOrigem = document.getElementById('setor-origem-select');
        const selectDestino = document.getElementById('setor-destino-select');
        
        const options = '<option value="">Selecione um setor...</option>' + 
                       this.setores.map(setor => 
                           `<option value="${setor.id}">${setor.nome}</option>`
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
     * Cria card mobile
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
     * Renderiza estado vazio
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
     * Atualiza informações de paginação
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
     * Exibe modal de nova/edição movimentação
     */
    async showModal(movimentacao = null) {
        const modal = document.getElementById('movement-modal');
        const form = document.getElementById('movement-form');
        const title = document.getElementById('modal-title');
        
        if (!modal || !form) {
            console.error('[MovimentacaoManager] Modal ou formulário não encontrado');
            return;
        }

        console.log('[MovimentacaoManager] Abrindo modal...');
        
        this.currentEditId = movimentacao?.id || null;
        
        // Configurar título
        if (title) {
            title.textContent = movimentacao ? '✏️ Editar Movimentação' : '✨ Nova Movimentação';
        }
        
        // Limpar formulário
        form.reset();
        
        // Definir data como hoje (automática)
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date();
            const todayStr = this.formatLocalDateForBackend(today);
            
            // Sempre definir como hoje (campo hidden)
            dateInput.value = todayStr;
            console.log('[MovimentacaoManager] Data automática definida como:', todayStr);
        }
        
        // Preencher dados se for edição
        if (movimentacao) {
            this.fillForm(movimentacao);
        }

        // Mostrar modal
        modal.classList.remove('hidden');
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Mostrar loading no painel de estoque
        const stockContainer = document.getElementById('stock-by-sector');
        if (stockContainer) {
            stockContainer.innerHTML = '<div class="loading-stocks">⏳ Carregando estoque disponível...</div>';
        }
        
        // Carregar dados atualizados do estoque antes de renderizar
        console.log('[MODAL] 🔄 Recarregando estoque antes de abrir modal...');
        await this.loadEstoquePorSetor();
        
        // Renderizar painel de estoque com dados atualizados
        this.renderStockPanel();
        
        // Foco no primeiro campo
        const firstInput = form.querySelector('input[type="number"], select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        console.log('[MovimentacaoManager] Modal exibido');
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
     * Manipula salvamento
     */
    async handleSave(event) {
        event.preventDefault();
        
        if (this.isLoading) return;

        const formData = this.getFormData();
        console.log('[MovimentacaoManager] Dados coletados do formulário:', formData);
        console.log('[MovimentacaoManager] Data de movimentação a ser enviada:', formData.dataMovimentacao);
        
        // Await na validação assíncrona
        const isValid = await this.validateForm(formData);
        if (!isValid) return;

        try {
            this.setLoading(true);
            console.log('[MovimentacaoManager] Enviando dados para API de transferência entre setores:', JSON.stringify(formData, null, 2));
            
            let response;
            if (this.currentEditId) {
                console.log('[MovimentacaoManager] Atualizando movimentação ID:', this.currentEditId);
                // Para edição, usar endpoint tradicional
                response = await this.apiManager.request(`/movimentacoes/${this.currentEditId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                console.log('[MovimentacaoManager] Criando nova transferência entre setores');
                // Para nova movimentação, usar endpoint de transferência entre setores
                response = await this.apiManager.request('/movimentacoes/entre-setores', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }

            console.log('[MovimentacaoManager] Resposta da API:', response);

            if (response.success) {
                // Mostrar feedback visual no painel de estoque
                const stockContainer = document.getElementById('stock-by-sector');
                if (stockContainer) {
                    stockContainer.innerHTML = '<div class="loading-stocks">✅ Movimentação salva! Atualizando estoque...</div>';
                }
                
                // Aguardar processamento do backend
                console.log('[MovimentacaoManager] Aguardando processamento do backend...');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // ATUALIZAÇÃO EM TEMPO REAL: Recarregar estoque ANTES de fechar o modal
                console.log('[MovimentacaoManager] 🔄 Recarregando estoque em tempo real...');
                try {
                    await this.loadEstoquePorSetorTempoReal(); // Carregar dados atualizados
                    this.renderStockPanel(); // Renderizar painel com novos valores
                    
                    console.log('[MovimentacaoManager] ✅ Painel de estoque atualizado com sucesso');
                    
                    // Mostrar feedback visual temporário
                    if (stockContainer) {
                        const successMsg = document.createElement('div');
                        successMsg.className = 'stock-update-success';
                        successMsg.innerHTML = '✅ Estoque atualizado!';
                        successMsg.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #4caf50; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; z-index: 1000; animation: fadeInOut 2s ease-in-out;';
                        stockContainer.style.position = 'relative';
                        stockContainer.appendChild(successMsg);
                        
                        // Remover após 2 segundos
                        setTimeout(() => successMsg.remove(), 2000);
                    }
                    
                } catch (error) {
                    console.error('[MovimentacaoManager] ❌ Erro ao atualizar painel de estoque:', error);
                    
                    // Fallback: tentar o método tradicional
                    console.log('[MovimentacaoManager] 🔄 Tentando atualização com método tradicional...');
                    await this.loadEstoquePorSetor();
                    this.renderStockPanel();
                }
                
                // Aguardar mais um pouco para o usuário ver a atualização
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Notificação e fechar modal
                this.showNotification(
                    this.currentEditId ? '✅ Movimentação atualizada com sucesso!' : '✅ Movimentação criada com sucesso!',
                    'success'
                );
                this.hideModal();
                
                // Recarregar lista de movimentações
                console.log('[MovimentacaoManager] 🔄 Recarregando lista de movimentações...');
                await this.loadMovimentacoes();
                
                // Forçar renderização de todos os componentes
                console.log('[MovimentacaoManager] 🎨 Atualizando interface...');
                this.renderMovimentacoes();
                this.renderStockPanel();
                
                // Mostrar notificação de atualização do painel
                this.showNotification('📊 Dados atualizados em tempo real!', 'info', 2000);
            } else {
                console.error('[MovimentacaoManager] Erro na resposta da API:', response);
                this.showNotification('❌ Erro ao salvar movimentação: ' + (response.error || 'Erro desconhecido'), 'error');
            }
            
        } catch (error) {
            console.error('[MovimentacaoManager] Erro ao salvar:', error);
            this.showNotification('❌ Erro ao salvar movimentação: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Obtém dados do formulário formatados para transferência entre setores
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
            
            // Usa o novo endpoint que lista todos os produtos ordenados por IDPRODUTO
            const response = await fetch(`${this.apiManager.baseURL}/produtos/todos-para-movimentacao`, {
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
        
        // FILTRAR: Mostrar apenas produtos que podem ser movimentados (têm almoxarifado)
        const produtosMovimentaveis = produtos.filter(produto => produto.podeMovimentar);
        
        console.log(`[PRODUTOS] Filtrados ${produtosMovimentaveis.length} produtos movimentáveis de ${produtos.length} total`);
        
        if (produtosMovimentaveis.length === 0) {
            select.innerHTML += '<option value="" disabled>Nenhum produto movimentável encontrado</option>';
            return;
        }
        
        // Adiciona apenas os produtos que podem ser movimentados
        produtosMovimentaveis.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;
            option.dataset.produto = JSON.stringify(produto);
            
            // Monta o texto da opção mostrando IDPRODUTO
            let textoOpcao = `${produto.idProduto} - ${produto.nome}`;
            if (produto.stqMax) {
                textoOpcao += ` (Max: ${produto.stqMax})`;
            }
            
            // Mostrar almoxarifado associado
            if (produto.almoxarifado && produto.almoxarifado !== 'Sem almoxarifado') {
                textoOpcao += ` [${produto.almoxarifado}]`;
            }
            
            option.textContent = textoOpcao;
            select.appendChild(option);
            
            console.log(`[PRODUTOS] Adicionado: ${produto.nome} (ID: ${produto.id}) - Almoxarifado: ${produto.almoxarifado}`);
        });
        
        console.log(`[PRODUTOS] ✅ Select populado com ${produtosMovimentaveis.length} produtos movimentáveis`);
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
    getEstoqueDisponivelNoSetor(produtoId, setorId) {
        if (!this.estoquePorSetor || this.estoquePorSetor.length === 0) {
            console.warn('[MovimentacaoManager] Estoque por setor não carregado');
            return null;
        }

        // Buscar estoque específico para o produto no setor
        const estoqueNoSetor = this.estoquePorSetor.find(e => {
            const produtoDoEstoque = e.produto?.id == produtoId;
            const setorDoEstoque = e.setor?.id == setorId;
            return produtoDoEstoque && setorDoEstoque;
        });

        if (estoqueNoSetor) {
            console.log(`[MovimentacaoManager] Estoque encontrado - Produto: ${produtoId}, Setor: ${setorId}, Quantidade: ${estoqueNoSetor.quantidadeEstoque}`);
            return estoqueNoSetor.quantidadeEstoque || 0;
        }

        console.warn(`[MovimentacaoManager] Estoque não encontrado para Produto: ${produtoId} no Setor: ${setorId}`);
        return 0; // Retorna 0 se não encontrar estoque no setor
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
     * Atualiza o painel de estoque após uma movimentação (método original)
     */
    async atualizarPainelEstoque() {
        await this.loadEstoquePorSetor();
        this.renderStockPanel();
    }

    /**
     * Atualiza o painel de estoque em tempo real após uma movimentação
     * Recarrega os dados e atualiza a exibição na barra lateral
     */
    async atualizarPainelEstoqueEmTempoReal() {
        try {
            console.log('[ATUALIZAÇÃO] Atualizando painel de estoque em tempo real...');
            
            // Usar o método de tempo real para garantir dados frescos
            await this.loadEstoquePorSetorTempoReal();
            
            // Re-renderizar o painel
            this.renderStockPanel();
            
            console.log('[ATUALIZAÇÃO] ✅ Painel de estoque atualizado com sucesso');
            
            // Mostrar notificação discreta sobre a atualização
            this.showNotification('📊 Quantidades atualizadas em tempo real', 'info', 2000);
            
        } catch (error) {
            console.error('[ATUALIZAÇÃO] ❌ Erro ao atualizar painel:', error);
            this.showNotification('⚠️ Erro ao atualizar quantidades - usando dados em cache', 'warning', 3000);
            
            // Fallback: tentar com método tradicional
            try {
                await this.loadEstoquePorSetor();
                this.renderStockPanel();
            } catch (fallbackError) {
                console.error('[ATUALIZAÇÃO] ❌ Erro no fallback:', fallbackError);
            }
        }
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
     * Renderiza o painel de estoque por setor
     */
    renderStockPanel() {
        const stockContainer = document.getElementById('stock-by-sector');
        if (!stockContainer) return;

        console.log('=== RENDERIZANDO PAINEL ===');
        console.log('Total de itens:', this.estoquePorSetor?.length);

        if (!this.estoquePorSetor || this.estoquePorSetor.length === 0) {
            stockContainer.innerHTML = '<div class="loading-stocks"><p>Nenhum produto encontrado</p></div>';
            return;
        }

        // Agrupar por setor - SIMPLES
        const porSetor = {};
        this.estoquePorSetor.forEach(item => {
            const setor = item.setor?.nome || 'Sem Setor';
            if (!porSetor[setor]) porSetor[setor] = [];
            
            // Só adicionar se não for marcador de setor vazio
            if (item.id !== null) {
                porSetor[setor].push(item);
            }
        });

        console.log('Setores agrupados:', Object.keys(porSetor));

        // Renderizar HTML - TODOS os setores, mesmo vazios
        let html = '';
        
        // Garantir que TODOS os setores apareçam (mesmo vazios)
        const setoresUnicos = new Set();
        this.estoquePorSetor.forEach(item => {
            if (item.setor?.nome) {
                setoresUnicos.add(item.setor.nome);
            }
        });
        
        const setoresOrdenados = Array.from(setoresUnicos).sort();
        
        setoresOrdenados.forEach(setor => {
            const produtos = porSetor[setor] || [];
            const totalQtd = produtos.reduce((sum, p) => sum + (p.quantidadeEstoque || 0), 0);
            
            html += `
                <div class="stock-group">
                    <h5 class="stock-group-title">
                        🏢 ${setor} 
                        <span class="stock-group-summary">(${produtos.length} produtos, ${totalQtd} unidades)</span>
                    </h5>
                    <div class="stock-group-content">
            `;
            
            if (produtos.length === 0) {
                html += `
                    <div class="stock-item" style="opacity: 0.6; font-style: italic;">
                        <div class="stock-item-header">
                            <span class="stock-item-name">Nenhum produto neste setor</span>
                            <span class="stock-item-quantity low-stock">0</span>
                        </div>
                    </div>
                `;
            } else {
                produtos.forEach(item => {
                    const prod = item.produto || {};
                    const qtd = item.quantidadeEstoque || 0;
                    const cssClass = qtd <= 10 ? 'low-stock' : qtd <= 50 ? 'medium-stock' : 'good-stock';
                    
                    html += `
                        <div class="stock-item">
                            <div class="stock-item-header">
                                <span class="stock-item-name">${prod.nome || 'Sem nome'}</span>
                                <span class="stock-item-quantity ${cssClass}">${qtd}</span>
                            </div>
                            <div class="stock-item-sector">${setor}</div>
                            ${prod.descricao ? `<div class="stock-item-description">${prod.descricao}</div>` : ''}
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
        console.log('✅ Painel renderizado com TODOS os setores!');
    }

    /**
     * Renderiza um grupo de setor com seus produtos
     */
    renderSetorGroup(setorNome, produtos) {
        const totalProdutos = produtos.length;
        const totalQuantidade = produtos.reduce((acc, produto) => acc + (produto.quantidadeEstoque || 0), 0);
        
        let produtosHtml = '';
        if (produtos.length > 0) {
            produtosHtml = produtos.map(estoque => this.createStockItem(estoque)).join('');
        } else {
            produtosHtml = '<div class="stock-item-empty">Nenhum produto neste setor</div>';
        }
        
        return `
            <div class="stock-group">
                <h5 class="stock-group-title">
                    🏢 ${setorNome} 
                    <span class="stock-group-summary">(${totalProdutos} produtos, ${totalQuantidade} unidades)</span>
                </h5>
                <div class="stock-group-content">
                    ${produtosHtml}
                </div>
            </div>
        `;
    }

    /**
     * Agrupa estoque por setor evitando duplicatas
     */
    groupStockBySetor(estoques) {
        console.log('[GROUP_STOCK] 📊 Iniciando agrupamento de estoque por setor...');
        console.log('[GROUP_STOCK] Total de itens a agrupar:', estoques.length);
        
        const grouped = {};
        const produtosJaAdicionados = new Set(); // Evita duplicatas por produto
        
        estoques.forEach((estoque, index) => {
            console.log(`[GROUP_STOCK] Processando item ${index + 1}:`, estoque);
            
            if (!estoque.produto || !estoque.produto.id) {
                console.warn(`[GROUP_STOCK] ⚠️ Item ${index + 1} ignorado: sem produto válido`);
                return; // Pula estoques sem produto válido
            }
            
            // Chave única para evitar duplicatas: setor + produto
            const produtoId = estoque.produto.id;
            const produtoNome = estoque.produto.nome || 'Produto sem nome';
            let setor = 'Sem Setor';
            
            // Usar o nome do setor do objeto setor (novo formato)
            if (estoque.setor && estoque.setor.nome) {
                setor = estoque.setor.nome;
                console.log(`[GROUP_STOCK] ✅ Setor encontrado no objeto setor: ${setor}`);
            } else if (estoque.produto && estoque.produto.almoxarifado && estoque.produto.almoxarifado.nome) {
                setor = estoque.produto.almoxarifado.nome;
                console.log(`[GROUP_STOCK] ✅ Setor encontrado no almoxarifado do produto: ${setor}`);
            } else if (estoque.produto && estoque.produto.idAlmoxarifado) {
                setor = `Almoxarifado ${estoque.produto.idAlmoxarifado}`;
                console.log(`[GROUP_STOCK] ⚠️ Setor inferido do ID do almoxarifado: ${setor}`);
            } else {
                console.warn(`[GROUP_STOCK] ⚠️ Setor não identificado para produto ${produtoNome}`);
            }
            
            // Chave única para produto no setor
            const chaveUnica = `${setor}-${produtoId}`;
            
            // Se já foi adicionado, pula
            if (produtosJaAdicionados.has(chaveUnica)) {
                console.log(`[GROUP_STOCK] ⚠️ Duplicata detectada: ${produtoNome} no setor ${setor}, pulando...`);
                return;
            }
            
            if (!grouped[setor]) {
                grouped[setor] = [];
                console.log(`[GROUP_STOCK] 🆕 Novo setor criado: ${setor}`);
            }
            
            grouped[setor].push(estoque);
            produtosJaAdicionados.add(chaveUnica);
            console.log(`[GROUP_STOCK] ✅ Adicionado: ${produtoNome} no setor ${setor} (Qtd: ${estoque.quantidadeEstoque || 0})`);
        });
        
        console.log('[GROUP_STOCK] Agrupamento inicial concluído:', grouped);
        
        // Filtrar setores vazios ou inválidos
        const setoresValidos = {};
        Object.keys(grouped).forEach(setorNome => {
            if (setorNome !== 'Sem Setor' && grouped[setorNome].length > 0) {
                setoresValidos[setorNome] = grouped[setorNome];
                console.log(`[GROUP_STOCK] ✅ Setor válido: ${setorNome} com ${grouped[setorNome].length} produtos`);
            } else if (setorNome === 'Sem Setor') {
                console.warn(`[GROUP_STOCK] ⚠️ Setor "Sem Setor" ignorado com ${grouped[setorNome].length} produtos`);
            }
        });
        
        // Garantir que os setores apareçam numa ordem lógica (apenas os que realmente existem)
        const sortedGrouped = {};
        const ordemPreferida = ['Compras', 'Estoque'];
        
        console.log('[GROUP_STOCK] Aplicando ordem preferida:', ordemPreferida);
        
        // Primeiro adiciona os setores na ordem preferida se existirem
        ordemPreferida.forEach(setorNome => {
            if (setoresValidos[setorNome]) {
                sortedGrouped[setorNome] = setoresValidos[setorNome];
                console.log(`[GROUP_STOCK] ✅ Setor ordenado (preferido): ${setorNome}`);
            }
        });
        
        // Depois adiciona os outros setores não incluídos na ordem preferida
        Object.keys(setoresValidos).forEach(setorNome => {
            if (!ordemPreferida.includes(setorNome)) {
                sortedGrouped[setorNome] = setoresValidos[setorNome];
                console.log(`[GROUP_STOCK] ✅ Setor ordenado (outros): ${setorNome}`);
            }
        });
        
        console.log(`[GROUP_STOCK] ✅ Agrupamento concluído: ${Object.keys(sortedGrouped).length} setores válidos`);
        console.log('[GROUP_STOCK] Resultado final:', sortedGrouped);
        return sortedGrouped;
    }

    /**
     * Cria item de estoque para o painel
     */
     
    createStockItem(estoque) {
        const produto = estoque.produto || {};
        const quantidade = estoque.quantidadeEstoque || 0;
        const quantityClass = quantidade <= 10 ? 'low-stock' : quantidade <= 50 ? 'medium-stock' : 'good-stock';
        
        // Buscar nome do setor/almoxarifado
        let almoxarifado = 'Sem Setor';
        if (estoque.setor && estoque.setor.nome) {
            almoxarifado = estoque.setor.nome;
        } else if (produto.almoxarifado && produto.almoxarifado.nome) {
            almoxarifado = produto.almoxarifado.nome;
        } else if (produto.idAlmoxarifado) {
            almoxarifado = `Setor ${produto.idAlmoxarifado}`;
        }
        
        return `
            <div class="stock-item" data-produto-id="${produto.id}" data-estoque-id="${estoque.id}">
                <div class="stock-item-header">
                    <span class="stock-item-name">${produto.nome || 'Produto sem nome'}</span>
                    <span class="stock-item-quantity ${quantityClass}">${quantidade}</span>
                </div>
                <div class="stock-item-sector">${almoxarifado}</div>
                ${produto.descricao ? `<div class="stock-item-description">${produto.descricao}</div>` : ''}
            </div>
        `;
    }
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
                
                console.log('[formatDate] Criando data a partir de array:', {ano, mes: mes + 1, dia});
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
