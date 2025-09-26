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

        // Pesquisa
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
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
            console.log('[MovimentacaoManager] Carregando dados...');
            
            // Carrega dados em paralelo
            const promises = [
                this.loadMovimentacoes(),
                this.loadEstoques(),
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
            
            if (result.success && result.data) {
                // Se o resultado tem paginação, pega o content
                this.estoques = result.data.content || result.data;
                console.log(`[MovimentacaoManager] ✅ ${this.estoques.length} estoques carregados`);
            } else {
                console.warn('[MovimentacaoManager] Nenhum estoque encontrado');
                this.estoques = [];
            }
            
            this.populateEstoqueSelect();
        } catch (error) {
            console.error('[MovimentacaoManager] Erro ao carregar estoques:', error);
            this.estoques = [];
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
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um produto...</option>';
        
        this.estoques.forEach(estoque => {
            const option = document.createElement('option');
            option.value = estoque.id || estoque.estoqueId;
            option.textContent = `${estoque.produto?.nome || 'Produto sem nome'} - Qtd: ${estoque.quantidadeEstoque || 0}`;
            select.appendChild(option);
        });
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
        
        return `
            <tr data-id="${movimentacao.id}">
                <td>${movimentacao.id}</td>
                <td>${movimentacao.nomeProduto || 'N/A'}</td>
                <td>
                    <span class="type-badge ${tipoClass}">
                        ${tipoIcon} ${movimentacao.tipoMovimentacao}
                    </span>
                </td>
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
                <td colspan="7" class="empty-state">
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
        
        // Definir data padrão como hoje
        const dateInput = document.getElementById('date');
        if (dateInput && !movimentacao) {
            dateInput.value = new Date().toISOString().split('T')[0];
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
        if (!this.validateForm(formData)) return;

        try {
            this.setLoading(true);
            
            let response;
            if (this.currentEditId) {
                response = await this.apiManager.request(`/movimentacoes/${this.currentEditId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                response = await this.apiManager.request('/movimentacoes', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }

            if (response.success) {
                this.showNotification(
                    this.currentEditId ? '✅ Movimentação atualizada com sucesso!' : '✅ Movimentação criada com sucesso!',
                    'success'
                );
                this.hideModal();
                await this.loadMovimentacoes();
                this.renderMovimentacoes();
            } else {
                this.showNotification('❌ Erro ao salvar movimentação: ' + response.error, 'error');
            }
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            this.showNotification('❌ Erro ao salvar movimentação', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Obtém dados do formulário
     */
    getFormData() {
        return {
            estoqueId: parseInt(document.getElementById('estoque-select').value) || null,
            usuarioId: parseInt(document.getElementById('usuario-select').value) || null,
            setorOrigemId: parseInt(document.getElementById('setor-origem-select').value) || null,
            setorDestinoId: parseInt(document.getElementById('setor-destino-select').value) || null,
            tipoMovimentacao: document.getElementById('type').value,
            quantidade: parseInt(document.getElementById('amount').value) || 0,
            dataMovimentacao: document.getElementById('date').value
        };
    }

    /**
     * Valida formulário
     */
    validateForm(data) {
        const errors = [];

        if (!data.estoqueId) errors.push('Selecione um produto');
        if (!data.usuarioId) errors.push('Selecione um usuário');
        if (!data.setorOrigemId) errors.push('Selecione o setor de origem');
        if (!data.setorDestinoId) errors.push('Selecione o setor de destino');
        if (!data.tipoMovimentacao) errors.push('Selecione o tipo de movimentação');
        if (!data.quantidade || data.quantidade <= 0) errors.push('Digite uma quantidade válida');
        if (!data.dataMovimentacao) errors.push('Selecione a data da movimentação');

        if (errors.length > 0) {
            this.showNotification(errors.join('<br>'), 'error');
            return false;
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
     * Manipula pesquisa
     */
    handleSearch(query) {
        const filtered = this.movimentacoes.filter(mov => {
            const searchFields = [
                mov.produto?.nome,
                mov.tipo,
                mov.setorOrigemId?.nome,
                mov.setorDestinoId?.nome,
                mov.usuario?.nome,
                mov.observacoes
            ];
            
            return searchFields.some(field => 
                field && field.toLowerCase().includes(query.toLowerCase())
            );
        });

        // Temporariamente substituir dados para renderização
        const originalData = this.movimentacoes;
        this.movimentacoes = filtered;
        this.renderMovimentacoes();
        this.movimentacoes = originalData;
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
