/**
 * ApiManager - Gerenciador centralizado de APIs REST para o sistema de estoque
 * 
 * @class ApiManager
 * @description Centraliza todas as operações HTTP com o backend Spring Boot.
 *              Fornece métodos para movimentações, produtos, almoxarifados, estoques e lotes.
 *              Implementa tratamento de erros padronizado e logging de requisições.
 * 
 * @author Sistema de Estoque FasiClin
 * @version 2.0.0
 * 
 * @property {string} baseURL - URL base da API (http://localhost:8080/api)
 * @property {Object} headers - Headers padrão para requisições (Content-Type, Accept)
 * 
 * @example
 * // Instanciado globalmente como window.apiManager
 * const apiManager = new ApiManager();
 * const movimentacoes = await apiManager.listarMovimentacoes();
 */
class ApiManager {
    /**
     * Construtor do ApiManager
     * @constructor
     * @description Inicializa configurações base da API (URL e headers)
     */
    constructor() {
        /** @type {string} URL base do backend Spring Boot */
        this.baseURL = 'http://localhost:8080/api';

        /** @type {Object} Headers padrão para todas as requisições */
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Método genérico para fazer requisições HTTP com tratamento de erros
     * @async
     * @param {string} endpoint - Endpoint da API (ex: '/movimentacao/historico')
     * @param {Object} [options={}] - Opções da requisição (method, body, headers, etc.)
     * @param {string} [options.method='GET'] - Método HTTP (GET, POST, PUT, DELETE)
     * @param {string} [options.body] - Corpo da requisição (JSON stringified)
     * @param {Object} [options.headers] - Headers adicionais
     * @returns {Promise<Object>} Promise com {success: boolean, data: any, error?: string}
     * @throws {Error} Se houver falha na comunicação com o servidor
     * 
     * @example
     * const result = await apiManager.request('/produtos', { method: 'GET' });
     * if (result.success) {
     *   console.log('Produtos:', result.data);
     * }
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.headers,
            mode: 'cors',
            ...options
        };

        try {
            console.log(`[API] ${config.method || 'GET'} ${url}`);
            if (config.body) {
                console.log('[API] Request body:', config.body);
            }
            const response = await fetch(url, config);

            // Log do status da resposta
            console.log(`[API] Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                // Tentar obter detalhes do erro
                let errorDetails;
                try {
                    errorDetails = await response.text();
                    console.error(`[API] Error details:`, errorDetails);
                } catch (e) {
                    errorDetails = 'Não foi possível obter detalhes do erro';
                }
                throw new Error(`HTTP Error: ${response.status} ${response.statusText} - ${errorDetails}`);
            }

            // Verifica se a resposta tem conteúdo
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('[API] Response data:', data);
                return { success: true, data: data };
            }

            return { success: true, data: null };
        } catch (error) {
            console.error(`[API Error] ${config.method || 'GET'} ${url}:`, error);
            return { success: false, error: error.message, data: null };
        }
    }

    // ===== ENDPOINTS DE MOVIMENTAÇÃO =====

    /**
     * Lista histórico de movimentações
     * @param {number} almoxarifadoId - Filtrar por almoxarifado (opcional)
     * @returns {Promise<Array>} - Lista de movimentações
     */
    async listarMovimentacoes(almoxarifadoId = null) {
        console.log('[API] Iniciando requisição para listar movimentações...');

        try {
            const url = almoxarifadoId ? `/movimentacao/historico?almoxarifadoId=${almoxarifadoId}` : '/movimentacao/historico';
            const result = await this.request(url);
            console.log('[API] Resposta completa de movimentações:', result);

            if (result.success) {
                console.log('[API] ✅ Movimentações carregadas com sucesso');
                return result;
            } else {
                console.warn('[API] ⚠️ Resposta sem sucesso:', result);
                return { success: false, data: [], error: 'Nenhuma movimentação encontrada' };
            }
        } catch (error) {
            console.error('[API] ❌ Erro ao listar movimentações:', error);
            throw error;
        }
    }

    /**
     * Transfere estoque entre almoxarifados
     * @async
     * @param {Object} transferencia - Dados da transferência
     * @param {number} transferencia.produtoId - ID do produto
     * @param {number} transferencia.almoxarifadoOrigemId - ID do almoxarifado de origem
     * @param {number} transferencia.almoxarifadoDestinoId - ID do almoxarifado de destino
     * @param {number} transferencia.quantidade - Quantidade a transferir
     * @param {number} [transferencia.loteId] - ID do lote (opcional)
     * @returns {Promise<Object>} Movimentação criada com sucesso
     * @throws {Error} Se houver estoque insuficiente ou parâmetros inválidos
     */
    async transferirEstoque(transferencia) {
        return this.request('/movimentacao/transferir', {
            method: 'POST',
            body: JSON.stringify(transferencia)
        });
    }

    /**
     * Registra entrada de estoque em um almoxarifado
     * @async
     * @param {Object} entrada - Dados da entrada
     * @param {number} entrada.produtoId - ID do produto
     * @param {number} entrada.almoxarifadoId - ID do almoxarifado de destino
     * @param {number} entrada.quantidade - Quantidade a registrar
     * @param {number} [entrada.loteId] - ID do lote (opcional)
     * @returns {Promise<Object>} Movimentação de entrada criada
     * @throws {Error} Se houver parâmetros inválidos
     */
    async registrarEntrada(entrada) {
        return this.request('/movimentacao/entrada', {
            method: 'POST',
            body: JSON.stringify(entrada)
        });
    }

    // ===== ENDPOINTS DE ALMOXARIFADOS =====

    /**
     * Lista todos os almoxarifados cadastrados
     * @async
     * @returns {Promise<Array<Object>>} Array de almoxarifados com propriedades id, nome, ativo, setor
     * @description Busca todos os almoxarifados independente do status ativo/inativo.
     *              Retorna array vazio em caso de erro.
     */
    async listarAlmoxarifados() {
        try {
            console.log(`[ALMOXARIFADO] Chamando endpoint: /almoxarifado`);
            const result = await this.request('/almoxarifado');

            if (result.success && result.data) {
                return Array.isArray(result.data) ? result.data : [result.data];
            }
            return [];
        } catch (error) {
            console.error(`[ALMOXARIFADO] Erro: ${error.message}`);
            return [];
        }
    }

    /**
     * Lista apenas almoxarifados ativos
     * @async
     * @returns {Promise<Array<Object>>} Array de almoxarifados ativos
     * @description Filtra almoxarifados com status ativo=true.
     *              Ideal para população de selects em formulários.
     */
    async listarAlmoxarifadosAtivos() {
        try {
            const result = await this.request('/almoxarifado/ativos');
            if (result.success && result.data) {
                return Array.isArray(result.data) ? result.data : [result.data];
            }
            return [];
        } catch (error) {
            console.error(`[ALMOXARIFADO] Erro ao buscar ativos: ${error.message}`);
            return [];
        }
    }

    /**
     * Consulta saldo atual de um almoxarifado
     * @async
     * @param {number} almoxarifadoId - ID do almoxarifado
     * @returns {Promise<Array<Object>>} Array de itens com produto, lote, quantidade disponível
     * @description Retorna lista de todos os produtos e lotes disponíveis no almoxarifado.
     *              Cada item contém: produto, lote, quantidadeDisponivel.
     */
    async consultarSaldoAlmoxarifado(almoxarifadoId) {
        try {
            const result = await this.request(`/almoxarifado/${almoxarifadoId}/saldo`);
            if (result.success && result.data) {
                return Array.isArray(result.data) ? result.data : [result.data];
            }
            return [];
        } catch (error) {
            console.error(`[ALMOXARIFADO] Erro ao consultar saldo: ${error.message}`);
            return [];
        }
    }

    // ===== ENDPOINTS DE PRODUTOS =====

    /**
     * Lista todos os produtos cadastrados
     * @async
     * @returns {Promise<Array<Object>>} Array de produtos com id, nome, descrição, unidade medida
     * @description Busca catálogo completo de produtos do sistema.
     *              Retorna array vazio em caso de erro.
     */
    async listarProdutos() {
        try {
            console.log(`[PRODUTOS] Chamando endpoint: /produto`);
            const result = await this.request('/produto');

            if (result.success && result.data) {
                return Array.isArray(result.data) ? result.data : [result.data];
            }
            return [];
        } catch (error) {
            console.error(`[PRODUTOS] Erro: ${error.message}`);
            return [];
        }
    }

    /**
     * Consulta saldo total de um produto em todos os almoxarifados
     * @async
     * @param {number} produtoId - ID do produto
     * @returns {Promise<Object>} Objeto com produtoId e quantidadeTotal somando todos almoxarifados
     * @description Retorna quantidade total disponível considerando todos os lotes e almoxarifados.
     *              Em caso de erro, retorna {produtoId, quantidadeTotal: 0}.
     */
    async consultarSaldoTotalProduto(produtoId) {
        try {
            const result = await this.request(`/produto/${produtoId}/saldo-total`);
            if (result.success && result.data) {
                return result.data;
            }
            return { produtoId, quantidadeTotal: 0 };
        } catch (error) {
            console.error(`[PRODUTOS] Erro ao consultar saldo: ${error.message}`);
            return { produtoId, quantidadeTotal: 0 };
        }
    }

    /**
     * Busca um produto específico por ID
     * @async
     * @param {number} id - ID do produto
     * @returns {Promise<Object>} Produto com todas as propriedades (id, nome, descricao, unidadeMedida)
     * @throws {Error} Se o produto não existir
     */
    async buscarProdutoPorId(id) {
        return this.request(`/produto/${id}`);
    }    // ===== ENDPOINTS DE FORNECEDORES =====

    /**
     * Lista fornecedores com paginação e ordenação
     * @async
     * @param {Object} [params={}] - Parâmetros de paginação
     * @param {number} [params.page=0] - Número da página (começa em 0)
     * @param {number} [params.size=20] - Tamanho da página
     * @param {string} [params.sortBy='id'] - Campo para ordenação
     * @param {string} [params.direction='ASC'] - Direção da ordenação (ASC/DESC)
     * @returns {Promise<Object>} Página de fornecedores com content, totalElements, totalPages
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
     * Busca um fornecedor específico por ID
     * @async
     * @param {number} id - ID do fornecedor
     * @returns {Promise<Object>} Fornecedor com cnpj, razaoSocial, nomeFantasia, contato
     * @throws {Error} Se o fornecedor não existir
     */
    async buscarFornecedorPorId(id) {
        return this.request(`/fornecedores/${id}`);
    }

    /**
     * Cria um novo fornecedor
     * @async
     * @param {Object} fornecedor - Dados do fornecedor
     * @param {string} fornecedor.cnpj - CNPJ do fornecedor
     * @param {string} fornecedor.razaoSocial - Razão social
     * @param {string} [fornecedor.nomeFantasia] - Nome fantasia (opcional)
     * @param {string} [fornecedor.contato] - Informações de contato (opcional)
     * @returns {Promise<Object>} Fornecedor criado com ID gerado
     * @throws {Error} Se CNPJ já estiver cadastrado ou dados inválidos
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
     * Lista usuários (implementação com fallback robusto)
     * @returns {Promise<Array>} - Lista de usuários
     */
    async listarUsuarios() {
        try {
            console.log(`[USUARIOS] Chamando endpoint: /usuarios`);
            const result = await this.request('/usuarios');

            if (result.success && result.data) {
                // Normaliza resultado para array
                const usuarios = Array.isArray(result.data) ? result.data : [result.data];
                console.log(`[USUARIOS] ✅ Sucesso: ${usuarios.length} usuários`);
                return usuarios.map(user => this.normalizeUsuarioItem(user));
            } else {
                console.warn('[USUARIOS] Resposta vazia ou erro, retornando lista vazia');
                return [];
            }
        } catch (error) {
            console.error(`[USUARIOS] ❌ Erro: ${error.message}, retornando lista vazia`);
            return [];
        }
    }

    /**
     * Normaliza um item de usuário
     */
    normalizeUsuarioItem(user) {
        return {
            id: user.id,
            login: user.login || user.loginUsuario || `user${user.id}`,
            nome: user.nome || user.nomeUsuario || user.login || `Usuário ${user.id}`,
            ativo: user.ativo !== undefined ? user.ativo : true
        };
    }

    // Métodos de usuários mockados removidos

    // ===== ENDPOINTS DE SETORES =====

    /**
     * Lista setores (implementação com fallback robusto)
     * @returns {Promise<Array>} - Lista de setores
     */
    async listarSetores() {
        try {
            console.log(`[SETORES] Chamando endpoint: /setores`);
            const result = await this.request('/setores');

            if (result.success && result.data) {
                // Normaliza resultado para array
                const setores = Array.isArray(result.data) ? result.data : [result.data];
                console.log(`[SETORES] ✅ Sucesso: ${setores.length} setores`);
                return setores.map(setor => this.normalizeSetorItem(setor));
            } else {
                console.warn('[SETORES] Resposta vazia ou erro, retornando lista vazia');
                return [];
            }
        } catch (error) {
            console.error(`[SETORES] ❌ Erro: ${error.message}, retornando lista vazia`);
            return [];
        }
    }

    /**
     * Normaliza um item de setor
     */
    normalizeSetorItem(setor) {
        return {
            id: setor.id,
            nome: setor.nome || setor.nomeSetor || `Setor ${setor.id}`,
            ativo: setor.ativo !== undefined ? setor.ativo : true
        };
    }

    // Métodos de setores mockados removidos

    // ===== ENDPOINTS DE INICIALIZAÇÃO =====

    /**
     * Verifica o status das tabelas do sistema
     * @returns {Promise<Object>} - Status das tabelas
     */
    async verificarStatusSistema() {
        try {
            return this.request('/inicializacao/status');
        } catch (error) {
            console.error('Erro ao verificar status do sistema:', error);
            return { erro: error.message };
        }
    }

    /**
     * Cria dados básicos necessários para o funcionamento do sistema
     * @returns {Promise<Object>} - Resultado da criação
     */
    async criarDadosBasicos() {
        try {
            return this.request('/inicializacao/criar-dados-basicos', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Erro ao criar dados básicos:', error);
            throw error;
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

    // ===== ENDPOINTS AUXILIARES PARA MOVIMENTAÇÃO =====

    /**
     * Busca a localização atual de um produto através do estoque
     * @param {number} estoqueId - ID do estoque
     * @returns {Promise<Object>} - Informações do estoque com localização
     */
    async buscarLocalizacaoEstoque(estoqueId) {
        try {
            return this.request(`/estoque/${estoqueId}`);
        } catch (error) {
            console.warn('Erro ao buscar localização do estoque:', error);
            return null;
        }
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
