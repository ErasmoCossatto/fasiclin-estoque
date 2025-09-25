/**
 * MovimentacaoManager - Gerencia a interface de movimentações Apple-style
 */
class MovimentacaoManager {
    constructor() {
        this.apiManager = new ApiManager();
        this.movimentacoes = [];
        this.produtos = [];
        this.usuarios = [];
        this.setores = [];
        this.currentEditId = null;
        this.isLoading = false;
        
        this.init();
    }

    /**
     * Inicializa o gerenciador
     */
    init() {
        this.bindEvents();
        this.loadData();
    }

    /**
     * Vincula eventos aos elementos
     */
    bindEvents() {
        // Botão novo movimento
        const btnNovo = document.getElementById('btnNovo');
        if (btnNovo) {
            btnNovo.addEventListener('click', () => this.showModal());
        }

        // Botão salvar
        const btnSalvar = document.getElementById('btnSalvar');
        if (btnSalvar) {
            btnSalvar.addEventListener('click', (e) => this.handleSave(e));
        }

        // Botão cancelar
        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => this.hideModal());
        }

        // Pesquisa
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Fechar modal ao clicar no overlay
        const modal = document.getElementById('movimentacaoModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }

        // Detectar mudança de viewport para modo responsivo
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Carrega os dados iniciais
     */
    async loadData() {
        try {
            this.setLoading(true);
            
            // Carrega dados em paralelo usando o ApiManager corrigido
            const [movimentacoesResult, produtosResult, usuariosResult, setoresResult] = await Promise.allSettled([
                this.loadMovimentacoes(),
                this.loadProdutos(),
                this.loadUsuarios(),
                this.loadSetores()
            ]);

            // Log dos resultados
            console.log('Resultados do carregamento:', {
                movimentacoes: movimentacoesResult.status,
                produtos: produtosResult.status,
                usuarios: usuariosResult.status,
                setores: setoresResult.status
            });

            this.renderMovimentacoes();
            this.setLoading(false);
            
        } catch (error) {
            this.setLoading(false);
            this.showNotification('❌ Erro ao carregar dados iniciais', 'error');
            console.error('Erro ao carregar dados:', error);
        }
    }

    /**
     * Carrega movimentações usando ApiManager
     */
    async loadMovimentacoes() {
        try {
            console.log('[MOVIMENTACOES] Carregando movimentações...');
            const response = await this.apiManager.request('/movimentacoes');
            
            if (response.success && response.data) {
                this.movimentacoes = Array.isArray(response.data) ? response.data : [response.data];
                console.log(`[MOVIMENTACOES] ✅ ${this.movimentacoes.length} movimentações carregadas`);
            } else {
                throw new Error('Resposta inválida da API');
            }
            
            return this.movimentacoes;
        } catch (error) {
            console.warn('[MOVIMENTACOES] Falha ao carregar, usando dados mockados');
            this.movimentacoes = this.getMockedMovimentacoes();
            return this.movimentacoes;
        }
    }

    /**
     * Carrega produtos usando ApiManager
     */
    async loadProdutos() {
        try {
            console.log('[PRODUTOS] Carregando produtos...');
            const response = await this.apiManager.request('/produtos');
            
            if (response.success && response.data) {
                // Se veio como página, extrair o conteúdo
                let produtos = response.data.content || response.data;
                if (!Array.isArray(produtos)) produtos = [produtos];
                
                this.produtos = produtos;
                console.log(`[PRODUTOS] ✅ ${this.produtos.length} produtos carregados`);
                this.populateSelect('produtoId', this.produtos, 'id', 'nome');
                return this.produtos;
            } else {
                throw new Error('Resposta inválida da API');
            }
        } catch (error) {
            console.warn('[PRODUTOS] Falha ao carregar produtos:', error);
            this.produtos = this.getMockedProdutos();
            this.populateSelect('produtoId', this.produtos, 'id', 'nome');
            return this.produtos;
        }
    }

    /**
     * Carrega usuários usando ApiManager
     */
    async loadUsuarios() {
        try {
            console.log('[USUARIOS] Carregando usuários...');
            const response = await this.apiManager.request('/usuarios');
            
            if (response.success && response.data) {
                let usuarios = response.data.content || response.data;
                if (!Array.isArray(usuarios)) usuarios = [usuarios];
                
                this.usuarios = usuarios;
                console.log(`[USUARIOS] ✅ ${this.usuarios.length} usuários carregados`);
                this.populateSelect('usuarioId', this.usuarios, 'id', 'nome');
                return this.usuarios;
            } else {
                throw new Error('Resposta inválida da API');
            }
        } catch (error) {
            console.warn('[USUARIOS] Falha ao carregar usuários:', error);
            this.usuarios = this.getMockedUsuarios();
            this.populateSelect('usuarioId', this.usuarios, 'id', 'nome');
            return this.usuarios;
        }
    }

    /**
     * Carrega setores usando ApiManager
     */
    async loadSetores() {
        try {
            console.log('[SETORES] Carregando setores...');
            const response = await this.apiManager.request('/setores');
            
            if (response.success && response.data) {
                let setores = response.data.content || response.data;
                if (!Array.isArray(setores)) setores = [setores];
                
                this.setores = setores;
                console.log(`[SETORES] ✅ ${this.setores.length} setores carregados`);
                this.populateSelect('setorOrigemId', this.setores, 'id', 'nome');
                this.populateSelect('setorDestinoId', this.setores, 'id', 'nome');
                return this.setores;
            } else {
                throw new Error('Resposta inválida da API');
            }
        } catch (error) {
            console.warn('[SETORES] Falha ao carregar setores:', error);
            this.setores = this.getMockedSetores();
            this.populateSelect('setorOrigemId', this.setores, 'id', 'nome');
            this.populateSelect('setorDestinoId', this.setores, 'id', 'nome');
            return this.setores;
        }
    }

    /**
     * Popula um select com opções
     */
    populateSelect(selectId, data, valueField, textField) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '<option value="">Selecione...</option>';
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueField];
                option.textContent = item[textField];
                select.appendChild(option);
            });
        }
    }

    /**
     * Renderiza a tabela/cards de movimentações
     */
    renderMovimentacoes() {
        const container = document.getElementById('movimentacoesContainer');
        if (!container) return;

        if (this.movimentacoes.length === 0) {
            container.innerHTML = this.createEmptyState();
            return;
        }

        if (window.innerWidth <= 768) {
            this.renderCards(container);
        } else {
            this.renderTable(container);
        }
    }

    /**
     * Renderiza tabela desktop
     */
    renderTable(container) {
        const table = document.createElement('table');
        table.className = 'movimentacoes-table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Origem</th>
                    <th>Destino</th>
                    <th>Usuário</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${this.movimentacoes.map(mov => this.createTableRow(mov)).join('')}
            </tbody>
        `;

        container.innerHTML = '';
        container.appendChild(table);
    }

    /**
     * Renderiza cards mobile
     */
    renderCards(container) {
        const cards = this.movimentacoes.map(mov => this.createCard(mov)).join('');
        container.innerHTML = `<div class="cards-container">${cards}</div>`;
    }

    /**
     * Cria linha da tabela
     */
    createTableRow(movimentacao) {
        return `
            <tr data-id="${movimentacao.id}">
                <td>${this.formatDate(movimentacao.dataMovimentacao)}</td>
                <td>
                    <span class="tipo-badge tipo-${movimentacao.tipo?.toLowerCase()}">
                        ${this.getTipoIcon(movimentacao.tipo)} ${movimentacao.tipo}
                    </span>
                </td>
                <td>${movimentacao.produto?.nome || 'N/A'}</td>
                <td class="quantidade">${movimentacao.quantidade}</td>
                <td>${movimentacao.setorOrigemId?.nome || '-'}</td>
                <td>${movimentacao.setorDestinoId?.nome || '-'}</td>
                <td>${movimentacao.usuario?.nome || 'N/A'}</td>
                <td class="acoes">
                    <button class="btn-acao btn-edit" onclick="movimentacaoManager.editMovimentacao(${movimentacao.id})" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-acao btn-delete" onclick="movimentacaoManager.deleteMovimentacao(${movimentacao.id})" title="Excluir">
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
        return `
            <div class="movimentacao-card" data-id="${movimentacao.id}">
                <div class="card-header">
                    <span class="tipo-badge tipo-${movimentacao.tipo?.toLowerCase()}">
                        ${this.getTipoIcon(movimentacao.tipo)} ${movimentacao.tipo}
                    </span>
                    <div class="card-actions">
                        <button class="btn-acao btn-edit" onclick="movimentacaoManager.editMovimentacao(${movimentacao.id})">✏️</button>
                        <button class="btn-acao btn-delete" onclick="movimentacaoManager.deleteMovimentacao(${movimentacao.id})">🗑️</button>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${movimentacao.produto?.nome || 'Produto N/A'}</h3>
                    <div class="card-details">
                        <div class="detail">
                            <span class="label">📅 Data:</span>
                            <span class="value">${this.formatDate(movimentacao.dataMovimentacao)}</span>
                        </div>
                        <div class="detail">
                            <span class="label">📦 Quantidade:</span>
                            <span class="value">${movimentacao.quantidade}</span>
                        </div>
                        <div class="detail">
                            <span class="label">📍 Origem:</span>
                            <span class="value">${movimentacao.setorOrigemId?.nome || '-'}</span>
                        </div>
                        <div class="detail">
                            <span class="label">🎯 Destino:</span>
                            <span class="value">${movimentacao.setorDestinoId?.nome || '-'}</span>
                        </div>
                        <div class="detail">
                            <span class="label">👤 Usuário:</span>
                            <span class="value">${movimentacao.usuario?.nome || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Cria estado vazio
     */
    createEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>Nenhuma movimentação encontrada</h3>
                <p>Comece criando uma nova movimentação de estoque</p>
                <button class="btn btn-primary" onclick="movimentacaoManager.showModal()">
                    ➕ Nova Movimentação
                </button>
            </div>
        `;
    }

    /**
     * Exibe modal
     */
    showModal(movimentacao = null) {
        const modal = document.getElementById('movimentacaoModal');
        const form = document.getElementById('movimentacaoForm');
        
        if (!modal || !form) return;

        this.currentEditId = movimentacao?.id || null;
        
        // Limpar formulário
        form.reset();
        
        // Preencher dados se for edição
        if (movimentacao) {
            this.fillForm(movimentacao);
            document.getElementById('modalTitle').textContent = '✏️ Editar Movimentação';
        } else {
            document.getElementById('modalTitle').textContent = '➕ Nova Movimentação';
        }

        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Foco no primeiro campo
        const firstInput = form.querySelector('input, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    /**
     * Oculta modal
     */
    hideModal() {
        const modal = document.getElementById('movimentacaoModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
        this.currentEditId = null;
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
        const form = document.getElementById('movimentacaoForm');
        const formData = new FormData(form);
        
        return {
            tipo: formData.get('tipo'),
            produtoId: parseInt(formData.get('produtoId')) || null,
            quantidade: parseInt(formData.get('quantidade')) || 0,
            dataMovimentacao: formData.get('dataMovimentacao'),
            setorOrigemId: parseInt(formData.get('setorOrigemId')) || null,
            setorDestinoId: parseInt(formData.get('setorDestinoId')) || null,
            usuarioId: parseInt(formData.get('usuarioId')) || null,
            observacoes: formData.get('observacoes') || ''
        };
    }

    /**
     * Valida formulário
     */
    validateForm(data) {
        const errors = [];

        if (!data.tipo) errors.push('Tipo é obrigatório');
        if (!data.produtoId) errors.push('Produto é obrigatório');
        if (!data.quantidade || data.quantidade <= 0) errors.push('Quantidade deve ser maior que zero');
        if (!data.dataMovimentacao) errors.push('Data é obrigatória');

        if (errors.length > 0) {
            this.showNotification(`❌ ${errors.join(', ')}`, 'error');
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
});
