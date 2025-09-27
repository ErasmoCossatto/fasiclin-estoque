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
        this.currentEditId = null;
        this.isLoading = false;
        
        this.init();
    }

    /**
     * Inicializa o gerenciador
     */
    async init() {
        console.log('[MovimentacaoManager] Inicializando...');
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
            console.log('[MovimentacaoManager] Carregando dados...');
            
            // Carrega dados em paralelo
            const promises = [
                this.loadMovimentacoes(),
                this.loadProdutos(), // Carrega estoques (que contêm produtos)
                this.loadUsuarios(),
                this.loadSetores()
            ];
            
            await Promise.all(promises);
            
            this.renderMovimentacoes();
            console.log('[MovimentacaoManager] ✅ Todos os dados carregados com sucesso');
            
        } catch (error) {
            console.error('[MovimentacaoManager] ❌ Erro ao carregar dados:', error);
            this.showNotification('Erro ao carregar dados: ' + error.message, 'error');
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
            
            if (result.success && result.data) {
                this.movimentacoes = Array.isArray(result.data) ? result.data : [result.data];
                console.log(`[MovimentacaoManager] ✅ ${this.movimentacoes.length} movimentações carregadas`);
            } else {
                console.warn('[MovimentacaoManager] Nenhuma movimentação encontrada');
                this.movimentacoes = [];
            }
        } catch (error) {
            console.error('[MovimentacaoManager] Erro ao carregar movimentações:', error);
            this.movimentacoes = [];
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
     * Popula select de estoques
     */
    populateEstoqueSelect() {
        const select = document.getElementById('estoque-select');
        if (!select) {
            console.error('[MovimentacaoManager] Select de estoque não encontrado');
            return;
        }

        console.log('[MovimentacaoManager] Populando select de estoques com', this.estoques.length, 'itens');
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
        const tableBody = document.getElementById('movements-table-body');
        const mobileCards = document.getElementById('mobile-cards');
        
        if (!tableBody && !mobileCards) {
            console.error('[MovimentacaoManager] Elementos de renderização não encontrados');
            return;
        }

        if (this.movimentacoes.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Renderizar tabela desktop
        if (tableBody) {
            tableBody.innerHTML = this.movimentacoes.map(mov => this.createTableRow(mov)).join('');
        }

        // Renderizar cards mobile
        if (mobileCards) {
            mobileCards.innerHTML = this.movimentacoes.map(mov => this.createCard(mov)).join('');
        }

        this.updatePaginationInfo();
        console.log(`[MovimentacaoManager] ✅ ${this.movimentacoes.length} movimentações renderizadas`);
    }

    /**
     * Cria linha da tabela
     */
    createTableRow(movimentacao) {
        const tipoIcon = movimentacao.tipoMovimentacao === 'ENTRADA' ? '⬆️' : '⬇️';
        const tipoClass = movimentacao.tipoMovimentacao === 'ENTRADA' ? 'type-income' : 'type-expense';
        
        // Formatar origem e destino
        const origem = movimentacao.setorOrigem?.nome || 'N/A';
        const destino = movimentacao.setorDestino?.nome || 'N/A';
        const fluxo = `${origem} → ${destino}`;
        
        return `
            <tr data-id="${movimentacao.id}">
                <td>${movimentacao.id}</td>
                <td>${movimentacao.nomeProduto || 'N/A'}</td>
                <td>
                    <span class="type-badge ${tipoClass}">
                        ${tipoIcon} ${movimentacao.tipoMovimentacao}
                    </span>
                </td>
                <td class="flow-info">${fluxo}</td>
                <td>${movimentacao.quantidade}</td>
                <td>${this.formatDate(movimentacao.dataMovimentacao)}</td>
                <td>${movimentacao.usuario?.login || 'N/A'}</td>
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
                        <span class="mobile-card-label">Produto:</span>
                        <span class="mobile-card-value">${movimentacao.nomeProduto || 'N/A'}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">De → Para:</span>
                        <span class="mobile-card-value">${origem} → ${destino}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Quantidade:</span>
                        <span class="mobile-card-value">${movimentacao.quantidade}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Data:</span>
                        <span class="mobile-card-value">${this.formatDate(movimentacao.dataMovimentacao)}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Usuário:</span>
                        <span class="mobile-card-value">${movimentacao.usuario?.login || 'N/A'}</span>
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
        
        // Definir data padrão como hoje e data mínima (hoje)
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            // Definir data mínima como hoje (permite hoje e futuro)
            dateInput.setAttribute('min', todayStr);
            
            // Se não for edição, definir data padrão como hoje
            if (!movimentacao) {
                dateInput.value = todayStr;
            }
        }
        
        // Preencher dados se for edição
        if (movimentacao) {
            this.fillForm(movimentacao);
        }

        // Mostrar modal
        modal.classList.remove('hidden');
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
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
                await this.loadMovimentacoes();
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
        const usuarioId = parseInt(document.getElementById('usuario-select').value);
        const setorOrigemId = parseInt(document.getElementById('setor-origem-select').value);
        const setorDestinoId = parseInt(document.getElementById('setor-destino-select').value);
        
        console.log('[MovimentacaoManager] Coletando dados do formulário:', {
            estoqueId,
            usuarioId,
            setorOrigemId,
            setorDestinoId
        });
        
        return {
            // O backend espera objetos, não apenas IDs - usando estoque corretamente
            estoque: estoqueId ? { id: estoqueId } : null,
            usuario: usuarioId ? { id: usuarioId } : null,
            setorOrigem: setorOrigemId ? { id: setorOrigemId } : null,
            setorDestino: setorDestinoId ? { id: setorDestinoId } : null,
            tipoMovimentacao: document.getElementById('type').value,
            quantidade: parseInt(document.getElementById('amount').value) || 0,
            dataMovimentacao: document.getElementById('date').value
        };
    }

    /**
     * Valida formulário com validação de estoque
     */
    async validateForm(data) {
        const errors = [];

        if (!data.estoque || !data.estoque.id) errors.push('Selecione um produto');
        if (!data.usuario || !data.usuario.id) errors.push('Selecione um usuário');
        if (!data.setorOrigem || !data.setorOrigem.id) errors.push('Selecione o setor de origem');
        if (!data.setorDestino || !data.setorDestino.id) errors.push('Selecione o setor de destino');
        if (!data.tipoMovimentacao) errors.push('Selecione o tipo de movimentação');
        if (!data.quantidade || data.quantidade <= 0) errors.push('Digite uma quantidade válida');
        if (!data.dataMovimentacao) errors.push('Selecione a data da movimentação');

        // Validar se a data não é anterior à data atual
        if (data.dataMovimentacao) {
            const dataMovimentacao = new Date(data.dataMovimentacao);
            const dataAtual = new Date();
            
            // Zerar as horas para comparar apenas as datas
            dataMovimentacao.setHours(0, 0, 0, 0);
            dataAtual.setHours(0, 0, 0, 0);
            
            if (dataMovimentacao < dataAtual) {
                errors.push('A data da movimentação não pode ser anterior à data atual');
            }
        }

        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return false;
        }

        // Validação de produto para movimentação
        if (data.estoque && data.estoque.id && data.quantidade) {
            const produtoSelecionado = this.produtos?.find(p => p.id == data.estoque.id);
            
            if (produtoSelecionado) {
                const produtoValido = await this.validarEstoqueMaximo(produtoSelecionado, data.quantidade);
                if (!produtoValido) {
                    return false; // Validação de produto falhou
                }
            }
        }

        console.log('[MovimentacaoManager] ✅ Formulário validado com sucesso:', data);
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
        return [
            {
                id: 1,
                tipo: 'ENTRADA',
                quantidade: 100,
                dataMovimentacao: '2024-12-20',
                produto: { id: 1, nome: 'Dipirona 500mg' },
                setorOrigemId: { id: 1, nome: 'Almoxarifado Central' },
                setorDestinoId: { id: 2, nome: 'Farmácia' },
                usuario: { id: 1, nome: 'Admin Sistema' },
                observacoes: 'Entrada inicial de estoque'
            },
            {
                id: 2,
                tipo: 'SAIDA',
                quantidade: 25,
                dataMovimentacao: '2024-12-21',
                produto: { id: 2, nome: 'Paracetamol 750mg' },
                setorOrigemId: { id: 2, nome: 'Farmácia' },
                setorDestinoId: { id: 3, nome: 'UTI' },
                usuario: { id: 2, nome: 'João Silva' },
                observacoes: 'Transferência para UTI'
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
            { id: 1, nome: 'Almoxarifado Central' },
            { id: 2, nome: 'Farmácia' },
            { id: 3, nome: 'UTI' },
            { id: 4, nome: 'Enfermaria' }
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
     * Utilitários
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
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
