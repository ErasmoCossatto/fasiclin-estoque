/**
 * ApiManager - Gerenciador de APIs para o sistema de estoque
 * Centraliza todas as operações HTTP com o backend Spring Boot
 */
class ApiManager {
    constructor() {
        // Configuração base da API
        this.baseURL = 'http://localhost:8080/api';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Método genérico para fazer requisições HTTP
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções da requisição (method, body, etc.)
     * @returns {Promise} - Promise com a resposta da API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.headers,
            ...options
        };

        try {
            console.log(`[API] ${config.method || 'GET'} ${url}`);
            if (config.body) {
                console.log('[API] Request body:', config.body);
            }
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            // Verifica se a resposta tem conteúdo
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return response;
        } catch (error) {
            console.error(`[API Error] ${config.method || 'GET'} ${url}:`, error);
            throw error;
        }
    }

    // ===== ENDPOINTS DE MOVIMENTAÇÃO =====

    /**
     * Lista todas as movimentações
     * @returns {Promise<Array>} - Lista de movimentações
     */
    async listarMovimentacoes() {
        return this.request('/movimentacoes');
    }

    /**
     * Busca movimentação por ID
     * @param {number} id - ID da movimentação
     * @returns {Promise<Object>} - Movimentação encontrada
     */
    async buscarMovimentacaoPorId(id) {
        return this.request(`/movimentacoes/${id}`);
    }

    /**
     * Cria uma nova movimentação
     * @param {Object} movimentacao - Dados da movimentação
     * @returns {Promise<Object>} - Movimentação criada
     */
    async criarMovimentacao(movimentacao) {
        return this.request('/movimentacoes', {
            method: 'POST',
            body: JSON.stringify(movimentacao)
        });
    }

    /**
     * Atualiza uma movimentação existente
     * @param {number} id - ID da movimentação
     * @param {Object} movimentacao - Novos dados da movimentação
     * @returns {Promise<Object>} - Movimentação atualizada
     */
    async atualizarMovimentacao(id, movimentacao) {
        return this.request(`/movimentacoes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(movimentacao)
        });
    }

    /**
     * Remove uma movimentação
     * @param {number} id - ID da movimentação
     * @returns {Promise<void>}
     */
    async removerMovimentacao(id) {
        return this.request(`/movimentacoes/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Busca movimentações por quantidade
     * @param {number} quantidade - Quantidade a buscar
     * @returns {Promise<Array>} - Lista de movimentações
     */
    async buscarMovimentacoesPorQuantidade(quantidade) {
        return this.request(`/movimentacoes/quantidade/${quantidade}`);
    }

    /**
     * Busca movimentações por intervalo de quantidade
     * @param {number} quantidadeMinima - Quantidade mínima
     * @param {number} quantidadeMaxima - Quantidade máxima
     * @returns {Promise<Array>} - Lista de movimentações
     */
    async buscarMovimentacoesPorIntervaloQuantidade(quantidadeMinima, quantidadeMaxima) {
        return this.request(`/movimentacoes/quantidade/entre?quantidadeMinima=${quantidadeMinima}&quantidadeMaxima=${quantidadeMaxima}`);
    }

    /**
     * Busca movimentações por data
     * @param {string} data - Data no formato YYYY-MM-DD
     * @returns {Promise<Array>} - Lista de movimentações
     */
    async buscarMovimentacoesPorData(data) {
        return this.request(`/movimentacoes/data/${data}`);
    }

    /**
     * Busca movimentações por intervalo de data
     * @param {string} dataInicial - Data inicial no formato YYYY-MM-DD
     * @param {string} dataFinal - Data final no formato YYYY-MM-DD
     * @returns {Promise<Array>} - Lista de movimentações
     */
    async buscarMovimentacoesPorIntervaloData(dataInicial, dataFinal) {
        return this.request(`/movimentacoes/data/entre?dataInicial=${dataInicial}&dataFinal=${dataFinal}`);
    }

    /**
     * Busca movimentações por tipo
     * @param {string} tipo - Tipo da movimentação (ENTRADA ou SAIDA)
     * @returns {Promise<Array>} - Lista de movimentações
     */
    async buscarMovimentacoesPorTipo(tipo) {
        return this.request(`/movimentacoes/tipo/${tipo}`);
    }

    // ===== ENDPOINTS DE ESTOQUE =====

    /**
     * Lista estoques com paginação
     * @param {Object} params - Parâmetros de paginação
     * @returns {Promise<Object>} - Página de estoques
     */
    async listarEstoques(params = {}) {
        try {
            const queryParams = new URLSearchParams({
                page: params.page || 0,
                size: params.size || 20,
                sortBy: params.sortBy || 'id',
                direction: params.direction || 'ASC'
            });
            
            return this.request(`/estoque?${queryParams}`);
        } catch (error) {
            // Fallback para endpoint simplificado se houver erro
            console.warn('Usando endpoint simplificado de estoque');
            return this.request('/estoque-simples');
        }
    }

    /**
     * Busca estoque por ID
     * @param {number} id - ID do estoque
     * @returns {Promise<Object>} - Estoque encontrado
     */
    async buscarEstoquePorId(id) {
        return this.request(`/estoque/${id}`);
    }

    // ===== ENDPOINTS DE PRODUTOS =====

    /**
     * Lista produtos com paginação
     * @param {Object} params - Parâmetros de paginação
     * @returns {Promise<Object>} - Página de produtos
     */
    async listarProdutos(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 0,
            size: params.size || 20,
            sortBy: params.sortBy || 'id',
            direction: params.direction || 'ASC'
        });
        
        return this.request(`/produtos?${queryParams}`);
    }

    /**
     * Busca produto por ID
     * @param {number} id - ID do produto
     * @returns {Promise<Object>} - Produto encontrado
     */
    async buscarProdutoPorId(id) {
        return this.request(`/produtos/${id}`);
    }

    /**
     * Cria um novo produto
     * @param {Object} produto - Dados do produto
     * @returns {Promise<Object>} - Produto criado
     */
    async criarProduto(produto) {
        return this.request('/produtos', {
            method: 'POST',
            body: JSON.stringify(produto)
        });
    }

    /**
     * Atualiza um produto existente
     * @param {number} id - ID do produto
     * @param {Object} produto - Novos dados do produto
     * @returns {Promise<Object>} - Produto atualizado
     */
    async atualizarProduto(id, produto) {
        return this.request(`/produtos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(produto)
        });
    }

    /**
     * Remove um produto
     * @param {number} id - ID do produto
     * @returns {Promise<void>}
     */
    async removerProduto(id) {
        return this.request(`/produtos/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== ENDPOINTS DE FORNECEDORES =====

    /**
     * Lista fornecedores com paginação
     * @param {Object} params - Parâmetros de paginação
     * @returns {Promise<Object>} - Página de fornecedores
     */
    async listarFornecedores(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 0,
            size: params.size || 20,
            sortBy: params.sortBy || 'id',
            direction: params.direction || 'ASC'
        });
        
        return this.request(`/fornecedores?${queryParams}`);
    }

    /**
     * Busca fornecedor por ID
     * @param {number} id - ID do fornecedor
     * @returns {Promise<Object>} - Fornecedor encontrado
     */
    async buscarFornecedorPorId(id) {
        return this.request(`/fornecedores/${id}`);
    }

    /**
     * Cria um novo fornecedor
     * @param {Object} fornecedor - Dados do fornecedor
     * @returns {Promise<Object>} - Fornecedor criado
     */
    async criarFornecedor(fornecedor) {
        return this.request('/fornecedores', {
            method: 'POST',
            body: JSON.stringify(fornecedor)
        });
    }

    /**
     * Atualiza um fornecedor existente
     * @param {number} id - ID do fornecedor
     * @param {Object} fornecedor - Novos dados do fornecedor
     * @returns {Promise<Object>} - Fornecedor atualizado
     */
    async atualizarFornecedor(id, fornecedor) {
        return this.request(`/fornecedores/${id}`, {
            method: 'PUT',
            body: JSON.stringify(fornecedor)
        });
    }

    /**
     * Remove um fornecedor
     * @param {number} id - ID do fornecedor
     * @returns {Promise<void>}
     */
    async removerFornecedor(id) {
        return this.request(`/fornecedores/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== ENDPOINTS DE ORDENS DE COMPRA =====

    /**
     * Lista ordens de compra com paginação
     * @param {Object} params - Parâmetros de paginação
     * @returns {Promise<Object>} - Página de ordens de compra
     */
    async listarOrdensCompra(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 0,
            size: params.size || 20,
            sortBy: params.sortBy || 'id',
            direction: params.direction || 'ASC'
        });
        
        return this.request(`/ordens-compra?${queryParams}`);
    }

    /**
     * Busca ordem de compra por ID
     * @param {number} id - ID da ordem de compra
     * @returns {Promise<Object>} - Ordem de compra encontrada
     */
    async buscarOrdemCompraPorId(id) {
        return this.request(`/ordens-compra/${id}`);
    }

    /**
     * Cria uma nova ordem de compra
     * @param {Object} ordemCompra - Dados da ordem de compra
     * @returns {Promise<Object>} - Ordem de compra criada
     */
    async criarOrdemCompra(ordemCompra) {
        return this.request('/ordens-compra', {
            method: 'POST',
            body: JSON.stringify(ordemCompra)
        });
    }

    /**
     * Atualiza uma ordem de compra existente
     * @param {number} id - ID da ordem de compra
     * @param {Object} ordemCompra - Novos dados da ordem de compra
     * @returns {Promise<Object>} - Ordem de compra atualizada
     */
    async atualizarOrdemCompra(id, ordemCompra) {
        return this.request(`/ordens-compra/${id}`, {
            method: 'PUT',
            body: JSON.stringify(ordemCompra)
        });
    }

    /**
     * Remove uma ordem de compra
     * @param {number} id - ID da ordem de compra
     * @returns {Promise<void>}
     */
    async removerOrdemCompra(id) {
        return this.request(`/ordens-compra/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== ENDPOINTS DE USUÁRIOS =====

    /**
     * Lista usuários (implementação temporária)
     * @returns {Promise<Array>} - Lista de usuários
     */
    async listarUsuarios() {
        try {
            return this.request('/usuarios');
        } catch (error) {
            // Retorna dados mockados se não houver endpoint
            console.warn('Endpoint de usuários não encontrado, usando dados mockados');
            return [
                { id: 1, login: 'admin', nome: 'Administrador' },
                { id: 2, login: 'user1', nome: 'Usuário 1' },
                { id: 3, login: 'user2', nome: 'Usuário 2' }
            ];
        }
    }

    // ===== ENDPOINTS DE SETORES =====

    /**
     * Lista setores (implementação temporária)
     * @returns {Promise<Array>} - Lista de setores
     */
    async listarSetores() {
        try {
            return this.request('/setores');
        } catch (error) {
            // Retorna dados mockados se não houver endpoint
            console.warn('Endpoint de setores não encontrado, usando dados mockados');
            return [
                { id: 1, nome: 'Almoxarifado Central' },
                { id: 2, nome: 'Farmácia' },
                { id: 3, nome: 'Enfermaria' },
                { id: 4, nome: 'UTI' }
            ];
        }
    }

    // ===== ENDPOINTS DE DADOS DE TESTE =====

    /**
     * Cria dados básicos de teste (usuários e setores)
     * @returns {Promise<string>} - Mensagem de resultado
     */
    async criarDadosBasicos() {
        return this.request('/dados-teste/criar-todos', {
            method: 'POST'
        });
    }

    /**
     * Verifica status dos dados no banco
     * @returns {Promise<string>} - Status dos dados
     */
    async verificarStatusDados() {
        return this.request('/dados-teste/status');
    }

    // ===== MÉTODOS UTILITÁRIOS =====

    /**
     * Formata data para o padrão brasileiro (DD/MM/AAAA)
     * @param {string} dateString - Data no formato ISO
     * @returns {string} - Data formatada
     */
    formatarData(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    /**
     * Formata data para o padrão ISO (YYYY-MM-DD)
     * @param {string} dateString - Data no formato brasileiro
     * @returns {string} - Data no formato ISO
     */
    formatarDataParaISO(dateString) {
        if (!dateString) return '';
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    /**
     * Formata valor monetário para o padrão brasileiro
     * @param {number} value - Valor numérico
     * @returns {string} - Valor formatado
     */
    formatarValor(value) {
        if (value === null || value === undefined) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}

// Instância global do ApiManager
window.apiManager = new ApiManager();
