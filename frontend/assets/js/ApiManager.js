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
            'Accept': 'application/json',
            'Authorization': 'Basic ' + btoa('admin:admin'), // Autenticação básica
            'Access-Control-Allow-Origin': '*'
        };
    }

    /**
     * Método genérico para fazer requisições HTTP com melhor tratamento de erros
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções da requisição (method, body, etc.)
     * @returns {Promise} - Promise com a resposta da API
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
     * Lista estoques com paginação (otimizado para movimentações)
     * @param {Object} params - Parâmetros de paginação
     * @returns {Promise<Object>} - Página de estoques com produtos
     */
    async listarEstoques(params = {}) {
        try {
            console.log(`[ESTOQUE] Chamando endpoint: /estoque`);
            const result = await this.request('/estoque');
            
            console.log(`[ESTOQUE] Resposta bruta da API:`, result);
            
            if (result.success && result.data) {
                // Retorna os dados diretamente, seja paginado ou não
                console.log(`[ESTOQUE] ✅ Sucesso na API - Retornando dados:`, result.data);
                return result.data;
            } else {
                console.warn('[ESTOQUE] Resposta não possui success=true ou data, usando dados mockados');
                return this.getMockedEstoques();
            }
        } catch (error) {
            console.warn(`[ESTOQUE] ❌ Erro: ${error.message}, usando dados mockados`);
            return this.getMockedEstoques();
        }
    }

    /**
     * Normaliza um item de estoque para ter estrutura consistente
     */
    normalizeEstoqueItem(item) {
        return {
            estoqueId: item.estoqueId || item.id,
            id: item.estoqueId || item.id,
            quantidadeEstoque: item.quantidadeEstoque || item.quantidade || 0,
            produto: {
                id: item.produto?.id || item.id,
                nome: item.produto?.nome || item.nome || 'Produto não informado',
                descricao: item.produto?.descricao || item.descricao || 'Descrição não disponível',
                codBarras: item.produto?.codBarras || item.codBarras || ''
            },
            almoxarifado: {
                id: item.almoxarifado?.id || item.produto?.almoxarifado?.id || 1,
                nome: item.almoxarifado?.nome || item.produto?.almoxarifado?.nome || 'Almoxarifado não informado',
                setor: item.almoxarifado?.setor || item.produto?.almoxarifado?.setor
            },
            lote: {
                id: item.lote?.id || 1,
                dataVencimento: item.lote?.dataVencimento || '2025-12-31',
                quantidade: item.lote?.quantidade || item.quantidadeEstoque || 0
            }
        };
    }

    /**
     * Retorna dados mockados para estoque quando todos os endpoints falham
     */
    getMockedEstoques() {
        return {
            content: [
                {
                    estoqueId: 1,
                    id: 1,
                    quantidadeEstoque: 100,
                    produto: { 
                        id: 1, 
                        nome: 'Dipirona 500mg', 
                        descricao: 'Analgésico e antitérmico',
                        codBarras: '7891234567890'
                    },
                    almoxarifado: {
                        id: 1,
                        nome: 'Farmácia Central',
                        setor: { id: 1, nome: 'Farmácia' }
                    },
                    lote: { 
                        id: 1, 
                        dataVencimento: '2025-12-31',
                        quantidade: 100
                    }
                },
                {
                    estoqueId: 2,
                    id: 2,
                    quantidadeEstoque: 50,
                    produto: { 
                        id: 2, 
                        nome: 'Paracetamol 750mg', 
                        descricao: 'Analgésico e antitérmico',
                        codBarras: '7891234567891'
                    },
                    almoxarifado: {
                        id: 2,
                        nome: 'Almoxarifado UTI',
                        setor: { id: 2, nome: 'UTI' }
                    },
                    lote: { 
                        id: 2, 
                        dataVencimento: '2026-01-15',
                        quantidade: 50
                    }
                },
                {
                    estoqueId: 3,
                    id: 3,
                    quantidadeEstoque: 25,
                    produto: { 
                        id: 3, 
                        nome: 'Ibuprofeno 600mg', 
                        descricao: 'Anti-inflamatório',
                        codBarras: '7891234567892'
                    },
                    almoxarifado: {
                        id: 3,
                        nome: 'Enfermaria Geral',
                        setor: { id: 3, nome: 'Enfermaria' }
                    },
                    lote: { 
                        id: 3, 
                        dataVencimento: '2025-11-30',
                        quantidade: 25
                    }
                }
            ],
            totalElements: 3,
            totalPages: 1,
            number: 0,
            size: 3
        };
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
     * Lista produtos com informações de estoque
     * @param {Object} params - Parâmetros de paginação
     * @returns {Promise<Object>} - Página de produtos com estoque
     */
    async listarProdutos(params = {}) {
        try {
            console.log(`[PRODUTOS] Chamando endpoint: /produtos`);
            const result = await this.request('/produtos');
            
            console.log(`[PRODUTOS] Resposta bruta da API:`, result);
            
            if (result.success && result.data) {
                // Retorna os dados diretamente, seja paginado ou não
                console.log(`[PRODUTOS] ✅ Sucesso na API - Retornando dados:`, result.data);
                return result.data;
            } else {
                console.warn('[PRODUTOS] Resposta não possui success=true ou data, usando dados mockados');
                return this.getMockedProdutos();
            }
        } catch (error) {
            console.warn(`[PRODUTOS] ❌ Erro: ${error.message}, usando dados mockados`);
            return this.getMockedProdutos();
        }
    }

    /**
     * Busca produtos por nome (para autocompletar)
     * @param {string} nome - Nome ou parte do nome do produto
     * @returns {Promise<Array>} - Lista de produtos encontrados
     */
    async buscarProdutosPorNome(nome) {
        try {
            console.log(`[PRODUTOS] Buscando produtos por nome: ${nome}`);
            const result = await this.request(`/produtos/buscar-por-nome?nome=${encodeURIComponent(nome)}`);
            
            if (result.success && result.data) {
                return Array.isArray(result.data) ? result.data : [result.data];
            }
            return [];
        } catch (error) {
            console.warn(`[PRODUTOS] Erro ao buscar por nome: ${error.message}`);
            return [];
        }
    }

    /**
     * Verifica disponibilidade de estoque
     * @param {number} produtoId - ID do produto
     * @param {number} quantidade - Quantidade solicitada
     * @returns {Promise<Object>} - Informações de disponibilidade
     */
    async verificarDisponibilidadeEstoque(produtoId, quantidade) {
        try {
            console.log(`[PRODUTOS] Verificando disponibilidade: Produto ${produtoId}, Quantidade ${quantidade}`);
            const result = await this.request(`/produtos/${produtoId}/verificar-estoque?quantidade=${quantidade}`);
            
            if (result.success) {
                return result.data;
            }
            return { disponivel: false, mensagem: 'Erro ao verificar estoque' };
        } catch (error) {
            console.warn(`[PRODUTOS] Erro ao verificar estoque: ${error.message}`);
            return { disponivel: false, mensagem: 'Erro ao verificar estoque' };
        }
    }

    /**
     * Retorna dados mockados para produtos
     */
    getMockedProdutos() {
        return {
            content: [
                {
                    idProduto: 1,
                    id: 1,
                    nome: 'Esparadrapo',
                    descricao: 'Esparadrapo tecido branco 10cm x 4,5m',
                    stqMax: 1000,
                    stqMin: 200
                },
                {
                    idProduto: 2,
                    id: 2,
                    nome: 'Termômetro Digital',
                    descricao: 'Termômetro digital com medição rápida e precisa da temperatura',
                    stqMax: 50,
                    stqMin: 5
                },
                {
                    idProduto: 5,
                    id: 5,
                    nome: 'Esparadrapo',
                    descricao: 'Esparadrapo resistente à água, indicado para curativos',
                    stqMax: 75,
                    stqMin: 15
                }
            ],
            totalElements: 3,
            totalPages: 1,
            number: 0,
            size: 3
        };
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
                console.warn('[USUARIOS] Resposta vazia ou erro, usando dados mockados');
                return this.getMockedUsuarios();
            }
        } catch (error) {
            console.warn(`[USUARIOS] ❌ Erro: ${error.message}, usando dados mockados`);
            return this.getMockedUsuarios();
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

    /**
     * Retorna dados mockados para usuários
     */
    getMockedUsuarios() {
        return [
            { id: 1, login: 'admin', nome: 'Administrador do Sistema', ativo: true },
            { id: 2, login: 'farmaceutico', nome: 'João Silva - Farmacêutico', ativo: true },
            { id: 3, login: 'enfermeiro', nome: 'Maria Santos - Enfermeira', ativo: true },
            { id: 4, login: 'almoxarife', nome: 'Pedro Costa - Almoxarife', ativo: true }
        ];
    }

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
                console.warn('[SETORES] Resposta vazia ou erro, usando dados mockados');
                return this.getMockedSetores();
            }
        } catch (error) {
            console.warn(`[SETORES] ❌ Erro: ${error.message}, usando dados mockados`);
            return this.getMockedSetores();
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

    /**
     * Retorna dados mockados para setores
     */
    getMockedSetores() {
        return [
            { id: 1, nome: 'Farmácia Central', ativo: true },
            { id: 2, nome: 'UTI - Unidade de Terapia Intensiva', ativo: true },
            { id: 3, nome: 'Enfermaria Geral', ativo: true },
            { id: 4, nome: 'Centro Cirúrgico', ativo: true },
            { id: 5, nome: 'Pronto Socorro', ativo: true },
            { id: 6, nome: 'Almoxarifado Central', ativo: true }
        ];
    }

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
