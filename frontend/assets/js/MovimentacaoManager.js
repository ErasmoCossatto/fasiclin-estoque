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
        
        this.init();
    }

    /**
     * Inicializa o gerenciador
     */
    async init() {
        console.log('[MovimentacaoManager] Inicializando...');
        console.log('[MovimentacaoManager] Data/Hora atual:', new Date().toLocaleString('pt-BR'));
        this.bindEvents();
        await this.loadData();
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
            
            // Mesmo com erro, tentar renderizar com dados mockados
            console.log('[MovimentacaoManager] 🔄 Tentando renderizar com dados de fallback...');
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
                
                // Tentar com dados mockados para teste
                console.log('[MovimentacaoManager] Testando com dados mockados...');
                this.movimentacoes = this.getMockedMovimentacoes();
                
                // Ordenar dados mockados também
                this.movimentacoes.sort((a, b) => {
                    const dateA = new Date(a.dataMovimentacao || '1970-01-01');
                    const dateB = new Date(b.dataMovimentacao || '1970-01-01');
                    
                    if (dateB.getTime() !== dateA.getTime()) {
                        return dateB.getTime() - dateA.getTime();
                    }
                    
                    return (b.id || 0) - (a.id || 0);
                });
                
                console.log(`[MovimentacaoManager] Usando ${this.movimentacoes.length} movimentações mockadas para teste (ordenadas)`);
                
                // Renderizar mesmo com dados mockados
                this.renderMovimentacoes();
            }
        } catch (error) {
            console.error('[MovimentacaoManager] ❌ Erro ao carregar movimentações:', error);
            this.movimentacoes = [];
            
            // Usar dados mockados como fallback
            console.log('[MovimentacaoManager] Usando dados mockados como fallback devido ao erro');
            this.movimentacoes = this.getMockedMovimentacoes();
            
            // Ordenar dados mockados de fallback também
            this.movimentacoes.sort((a, b) => {
                const dateA = new Date(a.dataMovimentacao || '1970-01-01');
                const dateB = new Date(b.dataMovimentacao || '1970-01-01');
                
                if (dateB.getTime() !== dateA.getTime()) {
                    return dateB.getTime() - dateA.getTime();
                }
                
                return (b.id || 0) - (a.id || 0);
            });
            
            // Renderizar mesmo com dados mockados de fallback
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
            console.log('[MovimentacaoManager] Carregando setores...');
            const setores = await this.apiManager.listarSetores();
            
            this.setores = setores || [];
            console.log(`[MovimentacaoManager] ✅ ${this.setores.length} setores carregados`);
            
            this.populateSetorSelects();
        } catch (error) {
            console.error('[MovimentacaoManager] Erro ao carregar setores:', error);
            this.setores = [];
        }
    }

    /**
     * Carrega estoque agrupado por setor
     */
    async loadEstoquePorSetor() {
        try {
            console.log('[MovimentacaoManager] Carregando estoque por setor...');
            
            // Usar o endpoint que retorna estoque por setor
            const response = await this.apiManager.request('/estoque/por-setor');
            
            if (response.success && response.data) {
                this.estoquePorSetor = Array.isArray(response.data) ? response.data : [response.data];
                console.log(`[MovimentacaoManager] ✅ ${this.estoquePorSetor.length} registros de estoque por setor carregados`);
                
                // Se não há dados suficientes, usar dados mockados expandidos
                if (this.estoquePorSetor.length < 5) {
                    console.warn('[MovimentacaoManager] Poucos dados retornados, complementando com dados mockados');
                    this.estoquePorSetor = this.getMockedEstoquePorSetorExpandido();
                }
            } else {
                console.warn('[MovimentacaoManager] Nenhum estoque por setor encontrado, usando dados mockados');
                this.estoquePorSetor = this.getMockedEstoquePorSetorExpandido();
            }
            
        } catch (error) {
            console.error('[MovimentacaoManager] Erro ao carregar estoque por setor:', error);
            this.estoquePorSetor = this.getMockedEstoquePorSetorExpandido();
        }
    }

    /**
     * Retorna dados mockados expandidos de estoque por setor
     * Inclui mais produtos distribuídos pelos setores Compras, Teste e Estoque
     */
    getMockedEstoquePorSetorExpandido() {
        return [
            // SETOR COMPRAS - Produtos diversos com quantidades variadas
            { id: 101, produto: { id: 1, nome: 'Dipirona 500mg', descricao: 'Medicamento analgésico e antitérmico' }, quantidadeEstoque: 150, setor: { id: 1, nome: 'Compras' } },
            { id: 102, produto: { id: 2, nome: 'Paracetamol 750mg', descricao: 'Medicamento antipirético' }, quantidadeEstoque: 200, setor: { id: 1, nome: 'Compras' } },
            { id: 103, produto: { id: 3, nome: 'Ibuprofeno 600mg', descricao: 'Anti-inflamatório' }, quantidadeEstoque: 80, setor: { id: 1, nome: 'Compras' } },
            { id: 104, produto: { id: 4, nome: 'Seringas Descartáveis', descricao: 'Seringas para injeção' }, quantidadeEstoque: 500, setor: { id: 1, nome: 'Compras' } },
            { id: 105, produto: { id: 5, nome: 'Luvas de Procedimento', descricao: 'Luvas descartáveis' }, quantidadeEstoque: 300, setor: { id: 1, nome: 'Compras' } },
            { id: 106, produto: { id: 6, nome: 'Álcool 70%', descricao: 'Desinfetante' }, quantidadeEstoque: 120, setor: { id: 1, nome: 'Compras' } },
            
            // SETOR TESTE - Produtos para teste com quantidades menores
            { id: 201, produto: { id: 1, nome: 'Dipirona 500mg', descricao: 'Medicamento analgésico e antitérmico' }, quantidadeEstoque: 25, setor: { id: 2, nome: 'Teste' } },
            { id: 202, produto: { id: 2, nome: 'Paracetamol 750mg', descricao: 'Medicamento antipirético' }, quantidadeEstoque: 30, setor: { id: 2, nome: 'Teste' } },
            { id: 203, produto: { id: 7, nome: 'Gaze Estéril', descricao: 'Gaze para curativos' }, quantidadeEstoque: 40, setor: { id: 2, nome: 'Teste' } },
            { id: 204, produto: { id: 8, nome: 'Esparadrapo', descricao: 'Fita adesiva médica' }, quantidadeEstoque: 60, setor: { id: 2, nome: 'Teste' } },
            { id: 205, produto: { id: 9, nome: 'Termômetro Digital', descricao: 'Medição de temperatura' }, quantidadeEstoque: 15, setor: { id: 2, nome: 'Teste' } },
            
            // SETOR ESTOQUE - Estoque principal com maiores quantidades
            { id: 301, produto: { id: 1, nome: 'Dipirona 500mg', descricao: 'Medicamento analgésico e antitérmico' }, quantidadeEstoque: 800, setor: { id: 3, nome: 'Estoque' } },
            { id: 302, produto: { id: 2, nome: 'Paracetamol 750mg', descricao: 'Medicamento antipirético' }, quantidadeEstoque: 650, setor: { id: 3, nome: 'Estoque' } },
            { id: 303, produto: { id: 3, nome: 'Ibuprofeno 600mg', descricao: 'Anti-inflamatório' }, quantidadeEstoque: 400, setor: { id: 3, nome: 'Estoque' } },
            { id: 304, produto: { id: 4, nome: 'Seringas Descartáveis', descricao: 'Seringas para injeção' }, quantidadeEstoque: 1200, setor: { id: 3, nome: 'Estoque' } },
            { id: 305, produto: { id: 5, nome: 'Luvas de Procedimento', descricao: 'Luvas descartáveis' }, quantidadeEstoque: 800, setor: { id: 3, nome: 'Estoque' } },
            { id: 306, produto: { id: 6, nome: 'Álcool 70%', descricao: 'Desinfetante' }, quantidadeEstoque: 250, setor: { id: 3, nome: 'Estoque' } },
            { id: 307, produto: { id: 7, nome: 'Gaze Estéril', descricao: 'Gaze para curativos' }, quantidadeEstoque: 300, setor: { id: 3, nome: 'Estoque' } },
            { id: 308, produto: { id: 8, nome: 'Esparadrapo', descricao: 'Fita adesiva médica' }, quantidadeEstoque: 180, setor: { id: 3, nome: 'Estoque' } },
            { id: 309, produto: { id: 9, nome: 'Termômetro Digital', descricao: 'Medição de temperatura' }, quantidadeEstoque: 45, setor: { id: 3, nome: 'Estoque' } },
            { id: 310, produto: { id: 10, nome: 'Material Cirúrgico', descricao: 'Instrumentos cirúrgicos' }, quantidadeEstoque: 75, setor: { id: 3, nome: 'Estoque' } },
            { id: 311, produto: { id: 11, nome: 'Equipamentos Médicos', descricao: 'Equipamentos diversos' }, quantidadeEstoque: 35, setor: { id: 3, nome: 'Estoque' } }
        ];
    }

    /**
     * Retorna dados mockados de estoque por setor - apenas produtos COM almoxarifado
     */
    getMockedEstoquePorSetorComAlmoxarifado() {
        return [
            // Setor Compras - produtos COM almoxarifado
            { id: 1, produto: { id: 1, nome: 'Dipirona 500mg', descricao: 'Medicamento analgésico' }, quantidadeEstoque: 500, setor: { id: 1, nome: 'Compras' } },
            { id: 2, produto: { id: 2, nome: 'Paracetamol 750mg', descricao: 'Medicamento antipirético' }, quantidadeEstoque: 300, setor: { id: 1, nome: 'Compras' } },
            { id: 3, produto: { id: 3, nome: 'Material Cirúrgico', descricao: 'Instrumentos cirúrgicos' }, quantidadeEstoque: 50, setor: { id: 1, nome: 'Compras' } },
            { id: 4, produto: { id: 4, nome: 'Seringas Descartáveis', descricao: 'Seringas para injeção' }, quantidadeEstoque: 200, setor: { id: 1, nome: 'Compras' } },
            
            // Setor Teste - produtos COM almoxarifado
            { id: 5, produto: { id: 5, nome: 'Ibuprofeno 600mg', descricao: 'Anti-inflamatório' }, quantidadeEstoque: 80, setor: { id: 2, nome: 'Teste' } },
            { id: 6, produto: { id: 6, nome: 'Luvas de Procedimento', descricao: 'Luvas descartáveis' }, quantidadeEstoque: 120, setor: { id: 2, nome: 'Teste' } },
            { id: 7, produto: { id: 7, nome: 'Gaze Estéril', descricao: 'Gaze para curativos' }, quantidadeEstoque: 60, setor: { id: 2, nome: 'Teste' } },
            { id: 8, produto: { id: 8, nome: 'Álcool 70%', descricao: 'Desinfetante' }, quantidadeEstoque: 40, setor: { id: 2, nome: 'Teste' } },
            
            // Setor Estoque - produtos COM almoxarifado
            { id: 9, produto: { id: 1, nome: 'Dipirona 500mg', descricao: 'Medicamento analgésico' }, quantidadeEstoque: 1000, setor: { id: 3, nome: 'Estoque' } },
            { id: 10, produto: { id: 2, nome: 'Paracetamol 750mg', descricao: 'Medicamento antipirético' }, quantidadeEstoque: 800, setor: { id: 3, nome: 'Estoque' } },
            { id: 11, produto: { id: 9, nome: 'Equipamentos Médicos', descricao: 'Equipamentos diversos' }, quantidadeEstoque: 25, setor: { id: 3, nome: 'Estoque' } },
            { id: 12, produto: { id: 10, nome: 'Material de Limpeza', descricao: 'Produtos de limpeza hospitalar' }, quantidadeEstoque: 150, setor: { id: 3, nome: 'Estoque' } }
        ];
    }

    /**
     * Retorna dados mockados de estoque por setor (método antigo - manter para compatibilidade)
     */
    getMockedEstoquePorSetor() {
        return this.getMockedEstoquePorSetorComAlmoxarifado();
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
     * Renderiza tabela/cards de movimentações
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

        console.log(`[MovimentacaoManager] 📊 RENDERIZANDO ${this.movimentacoes.length} MOVIMENTAÇÕES...`);

        // Renderizar tabela desktop
        if (tableBody) {
            console.log('[MovimentacaoManager] 🖥️ Renderizando tabela desktop...');
            const tableHTML = this.movimentacoes.map((mov, index) => {
                console.log(`  📋 Processando movimentação ${index + 1} (ID: ${mov.id}):`, mov);
                return this.createTableRow(mov);
            }).join('');
            
            tableBody.innerHTML = tableHTML;
            console.log('[MovimentacaoManager] ✅ Tabela desktop renderizada com sucesso');
            console.log('[MovimentacaoManager] HTML da tabela:', tableBody.innerHTML.substring(0, 200) + '...');
        }

        // Renderizar cards mobile
        if (mobileCards) {
            console.log('[MovimentacaoManager] 📱 Renderizando cards mobile...');
            const cardsHTML = this.movimentacoes.map(mov => this.createCard(mov)).join('');
            mobileCards.innerHTML = cardsHTML;
            console.log('[MovimentacaoManager] ✅ Cards mobile renderizados com sucesso');
        }

        this.updatePaginationInfo();
        console.log(`[MovimentacaoManager] 🎉 RENDERIZAÇÃO CONCLUÍDA COM SUCESSO: ${this.movimentacoes.length} movimentações exibidas`);
        
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
        
        const startElement = document.getElementById('start-item');
        const endElement = document.getElementById('end-item');
        const totalElement = document.getElementById('total-items');
        
        if (startElement) startElement.textContent = total > 0 ? '1' : '0';
        if (endElement) endElement.textContent = total.toString();
        if (totalElement) totalElement.textContent = total.toString();
    }

    /**
     * Exibe modal de nova/edição movimentação
     */
    showModal(movimentacao = null) {
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
            const todayStr = today.toISOString().split('T')[0];
            
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
        
        // Renderizar painel de estoque
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
                dateInput.value = date.toISOString().split('T')[0];
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
            console.log('[MovimentacaoManager] Enviando dados para API:', JSON.stringify(formData, null, 2));
            
            let response;
            if (this.currentEditId) {
                console.log('[MovimentacaoManager] Atualizando movimentação ID:', this.currentEditId);
                response = await this.apiManager.request(`/movimentacoes/${this.currentEditId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                console.log('[MovimentacaoManager] Criando nova movimentação');
                response = await this.apiManager.request('/movimentacoes', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }

            console.log('[MovimentacaoManager] Resposta da API:', response);

            if (response.success) {
                this.showNotification(
                    this.currentEditId ? '✅ Movimentação atualizada com sucesso!' : '✅ Movimentação criada com sucesso!',
                    'success'
                );
                this.hideModal();
                
                // Aguardar um pequeno delay para permitir que o backend processe completamente
                console.log('[MovimentacaoManager] Aguardando processamento do backend...');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Recarregar todos os dados para manter consistência
                console.log('[MovimentacaoManager] Recarregando dados após movimentação...');
                await this.loadMovimentacoes(); // Este método agora já força a renderização
                await this.loadEstoquePorSetor(); // Recarregar estoque para atualizar quantidades
                this.renderStockPanel(); // Atualizar painel lateral
                
                // Garantir renderização final
                console.log('[MovimentacaoManager] 🔄 Garantindo renderização final...');
                this.renderMovimentacoes();
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
     * Obtém dados do formulário
     */
    getFormData() {
        const estoqueId = parseInt(document.getElementById('produtoSelect').value);
        // TODO: Usar variável global do usuário quando implementada
        // Por enquanto, não enviamos usuário (será null no backend temporariamente)
        const setorOrigemId = parseInt(document.getElementById('setor-origem-select').value);
        const setorDestinoId = parseInt(document.getElementById('setor-destino-select').value);
        
        // Garantir que sempre usa a data e hora atuais (formato brasileiro)
        const agora = new Date();
        const dataAtual = agora.toISOString().split('T')[0]; // YYYY-MM-DD para o backend
        
        console.log('[MovimentacaoManager] Coletando dados do formulário:', {
            estoqueId,
            usuario: 'null (aguardando implementação de variável global)',
            setorOrigemId,
            setorDestinoId,
            dataMovimentacao: dataAtual,
            dataAtualFormatada: agora.toLocaleDateString('pt-BR'),
            horaAtual: agora.toLocaleTimeString('pt-BR')
        });
        
        return {
            // O backend espera objetos, não apenas IDs - usando estoque corretamente
            estoque: estoqueId ? { id: estoqueId } : null,
            usuario: null, // Será null até implementar variável global de usuário
            setorOrigem: setorOrigemId ? { id: setorOrigemId } : null,
            setorDestino: setorDestinoId ? { id: setorDestinoId } : null,
            tipoMovimentacao: document.getElementById('type').value,
            quantidade: parseInt(document.getElementById('amount').value) || 0,
            dataMovimentacao: dataAtual // Sempre usar data atual
        };
    }

    /**
     * Valida formulário com validação de estoque
     */
    async validateForm(data) {
        const errors = [];

        if (!data.estoque || !data.estoque.id) errors.push('Selecione um produto');
        // Usuario será null até implementar variável global - não validar por enquanto
        if (!data.setorOrigem || !data.setorOrigem.id) errors.push('Selecione o setor de origem');
        if (!data.setorDestino || !data.setorDestino.id) errors.push('Selecione o setor de destino');
        if (!data.tipoMovimentacao) errors.push('Selecione o tipo de movimentação');
        if (!data.quantidade || data.quantidade <= 0) errors.push('Digite uma quantidade válida');

        // Validar se setor origem é diferente do destino
        if (data.setorOrigem && data.setorDestino && data.setorOrigem.id === data.setorDestino.id) {
            errors.push('Setor de origem deve ser diferente do setor de destino');
        }

        // Data é automática (hoje), não precisa validar

        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return false;
        }

        // Validação avançada de estoque disponível
        if (data.estoque && data.estoque.id && data.quantidade && data.setorOrigem && data.setorOrigem.id) {
            const estoqueNoSetor = this.getEstoqueDisponivelNoSetor(data.estoque.id, data.setorOrigem.id);
            
            if (estoqueNoSetor === null) {
                this.showNotification(
                    `❌ Produto não encontrado no setor de origem!<br>` +
                    `Verifique se há estoque disponível no setor selecionado.`, 
                    'error'
                );
                return false;
            }
            
            if (data.quantidade > estoqueNoSetor) {
                const nomeSetorOrigem = this.setores.find(s => s.id == data.setorOrigem.id)?.nome || 'Setor desconhecido';
                this.showNotification(
                    `❌ Quantidade insuficiente no setor de origem!<br>` +
                    `Setor: ${nomeSetorOrigem}<br>` +
                    `Disponível: ${estoqueNoSetor}<br>` +
                    `Solicitado: ${data.quantidade}`, 
                    'error'
                );
                return false;
            }
        }

        console.log('[MovimentacaoManager] ✅ Formulário validado com sucesso (sem usuário - aguardando variável global):', data);
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
     * Dados mockados para fallback
     */
    getMockedMovimentacoes() {
        const agora = new Date();
        const hoje = agora.toISOString().split('T')[0];
        const horaAtual = agora.toTimeString().split(' ')[0];
        
        return [
            {
                id: 1,
                tipoMovimentacao: 'ENTRADA',
                quantidade: 100,
                dataMovimentacao: hoje,
                horaMovimentacao: horaAtual,
                estoque: { 
                    id: 1,
                    produto: { id: 1, nome: 'Dipirona 500mg', descricao: 'Medicamento analgésico' }
                },
                setorOrigem: { id: 1, nome: 'Compras' },
                setorDestino: { id: 3, nome: 'Estoque' },
                usuario: { id: 1, nome: 'Admin Sistema', login: 'admin' }
            },
            {
                id: 2,
                tipoMovimentacao: 'SAIDA',
                quantidade: 25,
                dataMovimentacao: hoje,
                horaMovimentacao: new Date(agora.getTime() - 60000).toTimeString().split(' ')[0], // 1 minuto atrás
                estoque: { 
                    id: 2,
                    produto: { id: 2, nome: 'Paracetamol 750mg', descricao: 'Medicamento antipirético' }
                },
                setorOrigem: { id: 3, nome: 'Estoque' },
                setorDestino: { id: 2, nome: 'Teste' },
                usuario: { id: 1, nome: 'Admin Sistema', login: 'admin' }
            },
            {
                id: 3,
                tipoMovimentacao: 'ENTRADA',
                quantidade: 50,
                dataMovimentacao: hoje,
                horaMovimentacao: new Date(agora.getTime() - 120000).toTimeString().split(' ')[0], // 2 minutos atrás
                estoque: { 
                    id: 3,
                    produto: { id: 3, nome: 'Ibuprofeno 600mg', descricao: 'Anti-inflamatório' }
                },
                setorOrigem: { id: 1, nome: 'Compras' },
                setorDestino: { id: 2, nome: 'Teste' },
                usuario: { id: 1, nome: 'Admin Sistema', login: 'admin' }
            }
        ];
    }

    getMockedProdutos() {
        return [
            { id: 1, nome: 'Dipirona 500mg' },
            { id: 2, nome: 'Paracetamol 750mg' },
            { id: 3, nome: 'Ibuprofeno 600mg' }
        ];
    }

    getMockedUsuarios() {
        return [
            { id: 1, nome: 'Admin Sistema' },
            { id: 2, nome: 'João Silva' },
            { id: 3, nome: 'Maria Santos' }
        ];
    }

    getMockedSetores() {
        return [
            { id: 1, nome: 'Compras' },
            { id: 2, nome: 'Teste' },
            { id: 3, nome: 'Estoque' }
        ];
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
                console.warn('[PRODUTOS] Nenhum produto encontrado, usando dados mockados');
                this.produtos = this.getMockedProdutos();
                this.populateProdutoSelect(this.produtos);
            }
        } catch (error) {
            console.error('[PRODUTOS] ❌ Erro ao carregar produtos:', error);
            this.showNotification('Erro ao carregar produtos: ' + error.message, 'error');
            
            // Usa dados mockados como fallback
            this.produtos = this.getMockedProdutos();
            this.populateProdutoSelect(this.produtos);
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
        
        // Adiciona os produtos
        produtos.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;
            option.dataset.produto = JSON.stringify(produto);
            
            // Monta o texto da opção mostrando IDPRODUTO
            let textoOpcao = `${produto.idProduto} - ${produto.nome}`;
            if (produto.stqMax) {
                textoOpcao += ` (Max: ${produto.stqMax})`;
            }
            
            // Indica se não pode ser movimentado
            if (!produto.podeMovimentar) {
                textoOpcao += ' - ⚠️ Sem almoxarifado';
                option.style.color = '#ff6b6b';
                option.style.fontStyle = 'italic';
            }
            
            option.textContent = textoOpcao;
            select.appendChild(option);
        });

        console.log(`[PRODUTOS] Select populado com ${produtos.length} produtos`);
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
     * Retorna produtos mockados para fallback
     */
    getMockedProdutos() {
        return [
            {
                id: 1,
                idProduto: 1,
                nome: 'Esparadrapo',
                descricao: 'Esparadrapo tecido branco 10cm x 4,5m',
                stqMax: 1000,
                stqMin: 200,
                podeMovimentar: true,
                almoxarifado: 'Almoxarifado Central',
                idAlmoxarifado: 1
            },
            {
                id: 2,
                idProduto: 2,
                nome: 'Termômetro Digital',
                descricao: 'Termômetro digital com medição rápida e precisa da temperatura',
                stqMax: 50,
                stqMin: 5,
                podeMovimentar: true,
                almoxarifado: 'Almoxarifado Central',
                idAlmoxarifado: 1
            },
            {
                id: 5,
                idProduto: 5,
                nome: 'Esparadrapo',
                descricao: 'Esparadrapo resistente à água, indicado para curativos.',
                stqMax: 100,
                stqMin: 10,
                podeMovimentar: true,
                almoxarifado: 'Almoxarifado Central',
                idAlmoxarifado: 1
            },
            {
                id: 6,
                idProduto: 6,
                nome: 'Vacina Antitetânica',
                descricao: 'Vacina indicada para prevenção do tétano',
                stqMax: 50,
                stqMin: 10,
                podeMovimentar: true,
                almoxarifado: 'Almoxarifado Central',
                idAlmoxarifado: 1
            },
            {
                id: 8,
                idProduto: 8,
                nome: 'Vacina',
                descricao: 'Vacina',
                stqMax: 22,
                stqMin: 5,
                podeMovimentar: true,
                almoxarifado: 'Almoxarifado Central',
                idAlmoxarifado: 1
            },
            {
                id: 9,
                idProduto: 9,
                nome: 'Soro',
                descricao: 'Soro',
                stqMax: 150,
                stqMin: 30,
                podeMovimentar: true,
                almoxarifado: 'Almoxarifado Central',
                idAlmoxarifado: 1
            },
            {
                id: 10,
                idProduto: 10,
                nome: 'Luva',
                descricao: 'Luva',
                stqMax: 250,
                stqMin: 50,
                podeMovimentar: true,
                almoxarifado: 'Almoxarifado Central',
                idAlmoxarifado: 1
            },
            {
                id: 11,
                idProduto: 11,
                nome: 'Luvas de Procedimento Não Estéreis',
                descricao: 'Luvas descartáveis de látex não estéreis, ideais para procedimentos médicos básicos',
                stqMax: 500,
                stqMin: 50,
                podeMovimentar: false,
                almoxarifado: 'Sem almoxarifado',
                idAlmoxarifado: null
            }
        ];
    }

    /**
     * Validação em tempo real da quantidade
     */
    validateQuantityInRealTime() {
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
                    `✅ OK - ${nomeSetor} tem ${estoqueDisponivel} disponível`, 
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
            
            // Recarregar dados do estoque por setor
            await this.loadEstoquePorSetor();
            
            // Re-renderizar o painel
            this.renderStockPanel();
            
            console.log('[ATUALIZAÇÃO] ✅ Painel de estoque atualizado com sucesso');
            
            // Mostrar notificação discreta sobre a atualização
            this.showNotification('📊 Quantidades atualizadas na barra lateral', 'info', 2000);
            
        } catch (error) {
            console.error('[ATUALIZAÇÃO] ❌ Erro ao atualizar painel:', error);
            this.showNotification('⚠️ Erro ao atualizar quantidades', 'warning', 3000);
        }
    }

    /**
     * Renderiza o painel de estoque por setor
     */
    renderStockPanel() {
        const stockContainer = document.getElementById('stock-by-sector');
        if (!stockContainer) {
            console.warn('[MovimentacaoManager] Container de estoque não encontrado');
            return;
        }

        console.log('[ESTOQUE] Renderizando painel. Dados:', this.estoquePorSetor);

        if (!this.estoquePorSetor || this.estoquePorSetor.length === 0) {
            stockContainer.innerHTML = '<div class="loading-stocks">Nenhum estoque encontrado</div>';
            return;
        }

        // Agrupar estoque por setor
        const stockBySetor = this.groupStockBySetor(this.estoquePorSetor);
        console.log('[ESTOQUE] Agrupado por setor:', stockBySetor);
        
        let html = '';
        
        // Garantir que os setores principais apareçam mesmo se vazios
        const setoresPrincipais = ['Compras', 'Teste', 'Estoque'];
        const setoresEncontrados = new Set(Object.keys(stockBySetor));
        
        // Primeiro, adicionar setores principais na ordem preferida
        setoresPrincipais.forEach(setorNome => {
            const produtos = stockBySetor[setorNome] || [];
            html += this.renderSetorGroup(setorNome, produtos);
            setoresEncontrados.delete(setorNome);
        });
        
        // Depois, adicionar outros setores que não estão na lista principal
        setoresEncontrados.forEach(setorNome => {
            const produtos = stockBySetor[setorNome] || [];
            html += this.renderSetorGroup(setorNome, produtos);
        });

        stockContainer.innerHTML = html || '<div class="loading-stocks">Nenhum produto encontrado</div>';
        console.log('[ESTOQUE] HTML renderizado:', html.length > 0 ? 'OK' : 'VAZIO');
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
     * Agrupa estoque por setor
     */
    groupStockBySetor(estoques) {
        const grouped = {};
        
        estoques.forEach(estoque => {
            let setor = 'Sem Setor';
            
            // Usar o nome do setor do objeto setor (novo formato)
            if (estoque.setor && estoque.setor.nome) {
                setor = estoque.setor.nome;
            } else if (estoque.produto && estoque.produto.almoxarifado && estoque.produto.almoxarifado.nome) {
                setor = estoque.produto.almoxarifado.nome;
            } else if (estoque.produto && estoque.produto.idAlmoxarifado) {
                setor = `Almoxarifado ${estoque.produto.idAlmoxarifado}`;
            }
            
            if (!grouped[setor]) {
                grouped[setor] = [];
            }
            
            grouped[setor].push(estoque);
        });
        
        // Garantir que os setores apareçam numa ordem lógica (apenas os que realmente existem)
        const sortedGrouped = {};
        const ordemPreferida = ['Compras', 'Teste', 'Estoque'];
        
        // Primeiro adiciona os setores na ordem preferida se existirem
        ordemPreferida.forEach(setorNome => {
            if (grouped[setorNome]) {
                sortedGrouped[setorNome] = grouped[setorNome];
            }
        });
        
        // Depois adiciona os outros setores não incluídos na ordem preferida
        Object.keys(grouped).forEach(setorNome => {
            if (!ordemPreferida.includes(setorNome)) {
                sortedGrouped[setorNome] = grouped[setorNome];
            }
        });
        
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
            // Se não há data, usar data atual
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
                date = new Date(dateString[0], dateString[1] - 1, dateString[2]); // mês é 0-indexado
            } else {
                // Tentar como string de data
                date = new Date(dateString);
            }
            
            // Verificar se a data é válida
            if (isNaN(date.getTime())) {
                console.warn('[MovimentacaoManager] Data inválida recebida:', dateString);
                // Retornar data atual como fallback
                const agora = new Date();
                return agora.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
            
            // Formatar para o padrão brasileiro DD/MM/YYYY
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('[MovimentacaoManager] Erro ao formatar data:', error, 'Data recebida:', dateString);
            // Retornar data atual como fallback em caso de erro
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
            // Se não há hora, usar hora atual
            const agora = new Date();
            return agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        try {
            // Se já está no formato HH:mm:ss, extrair apenas HH:mm
            if (typeof timeString === 'string' && timeString.includes(':')) {
                const parts = timeString.split(':');
                if (parts.length >= 2) {
                    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                }
            }
            
            // Se é um array [H, M, S], formatar
            if (Array.isArray(timeString) && timeString.length >= 2) {
                const hours = timeString[0].toString().padStart(2, '0');
                const minutes = timeString[1].toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            
            // Se é um objeto LocalTime do Jackson
            if (typeof timeString === 'object' && timeString !== null) {
                if (timeString.hour !== undefined && timeString.minute !== undefined) {
                    const hours = timeString.hour.toString().padStart(2, '0');
                    const minutes = timeString.minute.toString().padStart(2, '0');
                    return `${hours}:${minutes}`;
                }
            }
            
            // Tentar criar uma data e extrair a hora
            const date = new Date(timeString);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            return '--:--';
        } catch (error) {
            console.error('[MovimentacaoManager] Erro ao formatar hora:', error);
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
