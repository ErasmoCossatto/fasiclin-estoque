document.addEventListener('DOMContentLoaded', () => {

    // Array para armazenar as movimentações carregadas da API
    let movements = [];
    let estoques = [];
    let usuarios = [];
    let setores = [];

    // Elementos do DOM
    const movementsTableBody = document.getElementById('movements-table-body');
    const addMovementBtn = document.getElementById('add-movement-btn');
    const movementModal = document.getElementById('movement-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const movementForm = document.getElementById('movement-form');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const startItemSpan = document.getElementById('start-item');
    const endItemSpan = document.getElementById('end-item');
    const totalItemsSpan = document.getElementById('total-items');
    const modalTitle = document.getElementById('modal-title');
    const movementIdInput = document.getElementById('movement-id');

    // Selects do modal
    const estoqueSelect = document.getElementById('estoque-select');
    const usuarioSelect = document.getElementById('usuario-select');
    const setorOrigemSelect = document.getElementById('setor-origem-select');
    const setorDestinoSelect = document.getElementById('setor-destino-select');

    // Variáveis de paginação
    let currentPage = 1;
    const itemsPerPage = 5;
    let movementToDelete = null;

    // Inicializa a aplicação
    async function init() {
        setupEventListeners();
        await loadInitialData();
        await loadMovements();
    }

    // Carrega dados iniciais necessários para o formulário
    async function loadInitialData() {
        try {
            showLoading(true);
            showLoadingMessage('Carregando dados do sistema...');
            
            console.log('🔄 Iniciando carregamento de dados iniciais...');
            
            const loadPromises = [
                loadEstoques(),
                loadUsuarios(), 
                loadSetores()
            ];
            
            // Executa todas as cargas em paralelo para melhor performance
            const [estoquesResult, usuariosResult, setoresResult] = await Promise.allSettled(loadPromises);
            
            // Processa resultados
            estoques = estoquesResult.status === 'fulfilled' ? estoquesResult.value : [];
            usuarios = usuariosResult.status === 'fulfilled' ? usuariosResult.value : [];
            setores = setoresResult.status === 'fulfilled' ? setoresResult.value : [];
            
            console.log('📊 Dados carregados:', {
                estoques: estoques.length,
                usuarios: usuarios.length, 
                setores: setores.length
            });
            
            // Valida se temos dados mínimos necessários
            validateMinimumData();
            
            populateSelects();
            showSuccessMessage('Dados carregados com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro geral ao carregar dados iniciais:', error);
            showErrorMessage('Erro ao carregar dados do sistema. Usando dados de exemplo.');
            
            // Garante dados mínimos para funcionamento
            ensureMinimumData();
            populateSelects();
        } finally {
            hideLoading();
        }
    }

    // Carrega estoques com tratamento robusto
    async function loadEstoques() {
        try {
            console.log('📦 Carregando estoques...');
            const estoquesResponse = await apiManager.listarEstoques({ size: 100 });
            const estoquesData = estoquesResponse.content || estoquesResponse || [];
            
            if (!Array.isArray(estoquesData) || estoquesData.length === 0) {
                console.warn('⚠️ Nenhum estoque encontrado, usando dados padrão');
                return apiManager.getMockedEstoques().content;
            }
            
            console.log('✅ Estoques carregados:', estoquesData.length, 'itens');
            return estoquesData;
            
        } catch (error) {
            console.error('❌ Erro ao carregar estoques:', error);
            return apiManager.getMockedEstoques().content;
        }
    }

    // Carrega usuários (usando endpoint com fallback)
    async function loadUsuarios() {
        try {
            console.log('👥 Carregando usuários...');
            const usuariosData = await apiManager.listarUsuarios();
            
            if (!Array.isArray(usuariosData) || usuariosData.length === 0) {
                console.warn('⚠️ Nenhum usuário encontrado, usando dados padrão');
                return apiManager.getMockedUsuarios();
            }
            
            console.log('✅ Usuários carregados:', usuariosData.length, 'itens');
            return usuariosData;
            
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
            return apiManager.getMockedUsuarios();
        }
    }

    // Carrega setores (usando endpoint com fallback)
    async function loadSetores() {
        try {
            console.log('🏥 Carregando setores...');
            const setoresData = await apiManager.listarSetores();
            
            if (!Array.isArray(setoresData) || setoresData.length === 0) {
                console.warn('⚠️ Nenhum setor encontrado, usando dados padrão');
                return apiManager.getMockedSetores();
            }
            
            console.log('✅ Setores carregados:', setoresData.length, 'itens');
            return setoresData;
            
        } catch (error) {
            console.error('❌ Erro ao carregar setores:', error);
            return apiManager.getMockedSetores();
        }
    }

    // Valida se temos dados mínimos para funcionamento
    function validateMinimumData() {
        const errors = [];
        
        if (!estoques || estoques.length === 0) {
            errors.push('Nenhum produto em estoque encontrado');
        }
        
        if (!usuarios || usuarios.length === 0) {
            errors.push('Nenhum usuário encontrado');
        }
        
        if (!setores || setores.length === 0) {
            errors.push('Nenhum setor encontrado');
        }
        
        if (errors.length > 0) {
            console.warn('⚠️ Problemas nos dados:', errors);
            showWarningMessage('Alguns dados podem estar incompletos: ' + errors.join(', '));
        }
    }

    // Garante dados mínimos em caso de falha total
    function ensureMinimumData() {
        if (!estoques || estoques.length === 0) {
            estoques = apiManager.getMockedEstoques().content;
        }
        if (!usuarios || usuarios.length === 0) {
            usuarios = apiManager.getMockedUsuarios();
        }
        if (!setores || setores.length === 0) {
            setores = apiManager.getMockedSetores();
        }
    }

    // Popula os selects com os dados carregados
    function populateSelects() {
        console.log('Populando selects com os dados carregados...');
        
        // Popula select de estoques
        estoqueSelect.innerHTML = '<option value="">Selecione um produto...</option>';
        
        if (estoques && estoques.length > 0) {
            console.log('Populando', estoques.length, 'estoques');
            estoques.forEach(estoque => {
                const option = document.createElement('option');
                // Usa estoqueId se disponível, caso contrário usa id
                option.value = estoque.estoqueId || estoque.id;
                
                // Cria uma descrição mais detalhada incluindo localização quando disponível
                let descricao = estoque.produto?.nome || 'Produto não informado';
                descricao += ` (Qtd: ${estoque.quantidadeEstoque || 0})`;
                
                // Adiciona informação de localização se disponível
                if (estoque.almoxarifado) {
                    descricao += ` - Local: ${estoque.almoxarifado.nome}`;
                } else if (estoque.produto && estoque.produto.almoxarifado) {
                    const almox = estoque.produto.almoxarifado;
                    if (almox.nome) {
                        descricao += ` - Local: ${almox.nome}`;
                    }
                    // Se tem setor, adiciona também
                    if (almox.setor && almox.setor.nome) {
                        descricao += ` (${almox.setor.nome})`;
                    }
                }
                
                option.textContent = descricao;
                estoqueSelect.appendChild(option);
            });
        } else {
            console.warn('Nenhum estoque encontrado, adicionando opção de aviso');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum produto em estoque encontrado';
            option.disabled = true;
            estoqueSelect.appendChild(option);
        }

        // Popula select de usuários
        usuarioSelect.innerHTML = '<option value="">Selecione um usuário...</option>';
        
        if (usuarios && usuarios.length > 0) {
            console.log('Populando', usuarios.length, 'usuários');
            usuarios.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.id;
                option.textContent = usuario.nome || usuario.login;
                usuarioSelect.appendChild(option);
            });
        } else {
            console.warn('Nenhum usuário encontrado');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum usuário encontrado';
            option.disabled = true;
            usuarioSelect.appendChild(option);
        }

        // Popula selects de setores
        const populateSetorSelect = (selectElement, label) => {
            selectElement.innerHTML = `<option value="">Selecione um setor...</option>`;
            
            if (setores && setores.length > 0) {
                console.log('Populando', setores.length, 'setores para', label);
                setores.forEach(setor => {
                    const option = document.createElement('option');
                    option.value = setor.id;
                    option.textContent = setor.nome;
                    selectElement.appendChild(option);
                });
            } else {
                console.warn('Nenhum setor encontrado para', label);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Nenhum setor encontrado';
                option.disabled = true;
                selectElement.appendChild(option);
            }
        };

        populateSetorSelect(setorOrigemSelect, 'Setor Origem');
        populateSetorSelect(setorDestinoSelect, 'Setor Destino');
        
        console.log('Selects populados com sucesso');
    }

    // Renderiza a tabela de movimentações
    function renderMovements() {
        const movementsTableBody = document.getElementById('movements-table-body');
        const mobileCards = document.getElementById('mobile-cards');
        
        movementsTableBody.innerHTML = '';
        if (mobileCards) mobileCards.innerHTML = '';
        
        const totalPages = Math.ceil(movements.length / itemsPerPage);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, movements.length);
        
        if (movements.length === 0) {
            const emptyMessage = `
                <div style="padding: 2rem; text-align: center; color: var(--gray-500);">
                    <p>Nenhuma movimentação encontrada</p>
                    <button onclick="loadMovements()" class="btn btn-primary">
                        Tentar Novamente
                    </button>
                </div>
            `;
            
            movementsTableBody.innerHTML = `<tr><td colspan="6">${emptyMessage}</td></tr>`;
            if (mobileCards) mobileCards.innerHTML = emptyMessage;
        } else {
            // Renderização para tabela (desktop/tablet)
            for (let i = startIndex; i < endIndex; i++) {
                const movement = movements[i];
                const row = document.createElement('tr');
                
                const typeClass = movement.tipoMovimentacao === 'ENTRADA' ? 'type-income' : 'type-expense';
                const amountClass = movement.tipoMovimentacao === 'ENTRADA' ? 'amount-income' : 'amount-expense';
                const typeText = movement.tipoMovimentacao === 'ENTRADA' ? 'Entrada' : 'Saída';
                const amountPrefix = movement.tipoMovimentacao === 'ENTRADA' ? '+' : '-';

                row.innerHTML = `
                    <td>${movement.id}</td>
                    <td>${movement.nomeProduto || 'Produto não encontrado'}</td>
                    <td><span class="type-badge ${typeClass}">${typeText}</span></td>
                    <td class="${amountClass}">${amountPrefix} ${movement.quantidade} unidades</td>
                    <td>${formatDate(movement.dataMovimentacao)}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" data-id="${movement.id}" title="Editar">Editar</button>
                        <button class="delete-btn" data-id="${movement.id}" title="Excluir">Excluir</button>
                    </td>
                `;
                
                movementsTableBody.appendChild(row);
            }
            
            // Renderização para cards mobile
            if (mobileCards) {
                const mobileCardsHTML = movements.slice(startIndex, endIndex).map(movement => {
                    const typeClass = movement.tipoMovimentacao === 'ENTRADA' ? 'type-income' : 'type-expense';
                    const typeText = movement.tipoMovimentacao === 'ENTRADA' ? 'Entrada' : 'Saída';
                    const amountPrefix = movement.tipoMovimentacao === 'ENTRADA' ? '+' : '-';
                    
                    return `
                        <div class="mobile-card">
                            <div class="mobile-card-header">
                                <div class="mobile-card-id">#${movement.id}</div>
                                <span class="type-badge ${typeClass}">${typeText}</span>
                            </div>
                            <div class="mobile-card-body">
                                <div class="mobile-card-row">
                                    <span class="mobile-card-label">Produto</span>
                                    <span class="mobile-card-value">${movement.nomeProduto || 'Produto não encontrado'}</span>
                                </div>
                                <div class="mobile-card-row">
                                    <span class="mobile-card-label">Quantidade</span>
                                    <span class="mobile-card-value">${amountPrefix} ${movement.quantidade} unidades</span>
                                </div>
                                <div class="mobile-card-row">
                                    <span class="mobile-card-label">Data</span>
                                    <span class="mobile-card-value">${formatDate(movement.dataMovimentacao)}</span>
                                </div>
                                <div class="mobile-card-row">
                                    <span class="mobile-card-label">Usuário</span>
                                    <span class="mobile-card-value">${movement.nomeUsuario || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="mobile-card-actions">
                                <button class="edit-btn" data-id="${movement.id}">
                                    Editar
                                </button>
                                <button class="delete-btn" data-id="${movement.id}">
                                    Excluir
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                mobileCards.innerHTML = mobileCardsHTML;
            }
        }
        
        updatePaginationInfo(totalPages);
    }

    // Formata a data para o padrão dd/mm/aaaa
    function formatDate(dateString) {
        if (!dateString) return '';
        // Se for uma data ISO completa (com hora), pega apenas a parte da data
        const date = dateString.includes('T') ? dateString.split('T')[0] : dateString;
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
    }

    // Carrega movimentações da API
    async function loadMovements() {
        try {
            showLoading(true);
            movements = await apiManager.listarMovimentacoes();
            renderMovements();
        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
            showError('Erro ao carregar movimentações. Verifique se o backend está rodando.');
        } finally {
            showLoading(false);
        }
    }

    // Mostra/oculta indicador de carregamento
    function showLoading(show) {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    function hideLoading() {
        showLoading(false);
    }

    // Mostra mensagem de carregamento personalizada
    function showLoadingMessage(message) {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            loadingElement.style.display = 'block';
        }
    }

    // Sistema de notificações melhorado
    function showSuccessMessage(message) {
        showNotification(message, 'success');
    }

    function showErrorMessage(message) {
        showNotification(message, 'error');
    }

    function showWarningMessage(message) {
        showNotification(message, 'warning');
    }

    function showNotification(message, type = 'info') {
        // Remove notificações anteriores
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove automaticamente após 5 segundos (exceto erros que ficam mais tempo)
        const timeout = type === 'error' ? 8000 : 5000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, timeout);
    }

    function getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌', 
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Mostra mensagem de erro (mantém compatibilidade)
    function showError(message) {
        showErrorMessage(message);
    }

    // Testa a conectividade com o backend
    async function testConnection() {
        try {
            showLoading(true);
            console.log('Iniciando teste de conectividade...');
            
            const resultados = {};
            
            // Teste 1: Verificar status do sistema
            console.log('Testando status do sistema...');
            try {
                const status = await apiManager.verificarStatusSistema();
                resultados.status = { sucesso: true, dados: status };
                console.log('✅ Status do sistema:', status);
            } catch (error) {
                resultados.status = { sucesso: false, erro: error.message };
                console.log('❌ Erro no status do sistema:', error);
            }
            
            // Teste 2: Testar endpoint de setores
            console.log('Testando endpoint de setores...');
            try {
                const testSetores = await apiManager.listarSetores();
                resultados.setores = { sucesso: true, count: testSetores.length };
                console.log('✅ Setores carregados:', testSetores.length);
            } catch (error) {
                resultados.setores = { sucesso: false, erro: error.message };
                console.log('❌ Erro nos setores:', error);
            }
            
            // Teste 3: Testar endpoint de usuários
            console.log('Testando endpoint de usuários...');
            try {
                const testUsuarios = await apiManager.listarUsuarios();
                resultados.usuarios = { sucesso: true, count: testUsuarios.length };
                console.log('✅ Usuários carregados:', testUsuarios.length);
            } catch (error) {
                resultados.usuarios = { sucesso: false, erro: error.message };
                console.log('❌ Erro nos usuários:', error);
            }
            
            // Teste 4: Testar endpoint de estoques
            console.log('Testando endpoint de estoques...');
            try {
                const testEstoques = await apiManager.listarEstoques({ size: 10 });
                const estoquesList = testEstoques.content || testEstoques;
                resultados.estoques = { sucesso: true, count: estoquesList.length };
                console.log('✅ Estoques carregados:', estoquesList.length);
            } catch (error) {
                resultados.estoques = { sucesso: false, erro: error.message };
                console.log('❌ Erro nos estoques:', error);
            }
            
            // Teste 5: Testar endpoint de movimentações
            console.log('Testando endpoint de movimentações...');
            try {
                const testMovimentacoes = await apiManager.listarMovimentacoes();
                resultados.movimentacoes = { sucesso: true, count: testMovimentacoes.length };
                console.log('✅ Movimentações carregadas:', testMovimentacoes.length);
            } catch (error) {
                resultados.movimentacoes = { sucesso: false, erro: error.message };
                console.log('❌ Erro nas movimentações:', error);
            }
            
            // Mostra resultado detalhado
            let relatorio = '📊 RELATÓRIO DE CONECTIVIDADE\n\n';
            
            Object.entries(resultados).forEach(([teste, resultado]) => {
                const icone = resultado.sucesso ? '✅' : '❌';
                relatorio += `${icone} ${teste.toUpperCase()}: `;
                
                if (resultado.sucesso) {
                    if (resultado.count !== undefined) {
                        relatorio += `OK (${resultado.count} itens)\n`;
                    } else {
                        relatorio += 'OK\n';
                    }
                } else {
                    relatorio += `FALHA - ${resultado.erro}\n`;
                }
            });
            
            // Recomendações
            relatorio += '\n💡 RECOMENDAÇÕES:\n';
            
            const falhas = Object.values(resultados).filter(r => !r.sucesso).length;
            
            if (falhas === 0) {
                relatorio += '• Sistema funcionando perfeitamente!\n';
                relatorio += '• Todos os endpoints estão respondendo.\n';
            } else if (falhas <= 2) {
                relatorio += '• Alguns endpoints têm problemas, mas o sistema pode funcionar.\n';
                relatorio += '• Clique em "Criar Dados Básicos" para resolver.\n';
            } else {
                relatorio += '• Muitos endpoints com problemas.\n';
                relatorio += '• Verifique se o banco de dados está funcionando.\n';
                relatorio += '• Execute o script SQL para criar as tabelas.\n';
                relatorio += '• Clique em "Criar Dados Básicos" após corrigir o banco.\n';
            }
            
            alert(relatorio);
            
        } catch (error) {
            console.error('Erro geral no teste de conectividade:', error);
            alert('❌ Erro ao executar teste de conectividade:\n\n' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Cria dados de teste
    async function createTestData() {
        try {
            showLoading(true);
            const response = await fetch('http://localhost:8080/api/movimentacoes/test-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                alert('Dados de teste criados com sucesso!');
                await loadMovements(); // Recarrega a lista
            } else {
                const errorText = await response.text();
                showError('Erro ao criar dados de teste: ' + errorText);
            }
        } catch (error) {
            console.error('Erro ao criar dados de teste:', error);
            showError('Erro ao criar dados de teste: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Cria dados básicos (usuários e setores)
    async function createBasicData() {
        try {
            showLoading(true);
            
            // Primeiro verifica o status do sistema
            console.log('Verificando status do sistema...');
            const status = await apiManager.verificarStatusSistema();
            console.log('Status do sistema:', status);
            
            // Depois tenta criar os dados básicos
            console.log('Criando dados básicos...');
            const result = await apiManager.criarDadosBasicos();
            console.log('Resultado da criação:', result);
            
            alert('Dados básicos processados com sucesso!\n\nStatus: ' + JSON.stringify(status, null, 2) + '\n\nResultado: ' + JSON.stringify(result, null, 2));
            
            // Recarrega os dados necessários
            await loadInitialData();
        } catch (error) {
            console.error('Erro ao processar dados básicos:', error);
            showError('Erro ao processar dados básicos: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Configura os ouvintes de eventos
    function setupEventListeners() {
        addMovementBtn.addEventListener('click', openAddModal);
        closeModalBtn.addEventListener('click', closeMovementModal);
        cancelBtn.addEventListener('click', closeMovementModal);
        movementForm.addEventListener('submit', saveMovement);
        
        movementsTableBody.addEventListener('click', handleTableActions);

        cancelDeleteBtn.addEventListener('click', closeConfirmModal);
        confirmDeleteBtn.addEventListener('click', processDelete);

        prevPageBtn.addEventListener('click', goToPrevPage);
        nextPageBtn.addEventListener('click', goToNextPage);

        // Evento para preenchimento automático do Setor Origem
        estoqueSelect.addEventListener('change', handleEstoqueChange);

        // Botão para testar conexão
        const testConnectionBtn = document.getElementById('test-connection-btn');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', testConnection);
        }

        // Botão para criar dados de teste
        const createTestDataBtn = document.getElementById('create-test-data-btn');
        if (createTestDataBtn) {
            createTestDataBtn.addEventListener('click', createTestData);
        }

        // Botão para criar dados básicos
        const createBasicDataBtn = document.getElementById('create-basic-data-btn');
        if (createBasicDataBtn) {
            createBasicDataBtn.addEventListener('click', createBasicData);
        }
    }

    // Função que trata a mudança do select de estoque
    async function handleEstoqueChange(e) {
        const estoqueId = parseInt(e.target.value);
        
        console.log('Estoque selecionado ID:', estoqueId);
        
        if (!estoqueId) {
            // Se nenhum produto foi selecionado, limpa o setor origem
            setorOrigemSelect.value = '';
            console.log('Nenhum produto selecionado, limpando setor origem');
            return;
        }

        try {
            // Busca os detalhes do estoque selecionado usando estoqueId ou id
            const estoque = estoques.find(est => (est.estoqueId || est.id) === estoqueId);
            
            console.log('Estoque encontrado:', estoque);
            
            if (estoque) {
                // Primeiro verifica se tem almoxarifado diretamente no estoque (nova estrutura)
                let almoxarifado = estoque.almoxarifado;
                
                // Se não tem, verifica se tem no produto (estrutura antiga)
                if (!almoxarifado && estoque.produto && estoque.produto.almoxarifado) {
                    almoxarifado = estoque.produto.almoxarifado;
                }
                
                console.log('Almoxarifado do produto:', almoxarifado);
                
                if (almoxarifado) {
                    // Busca o setor correspondente ao almoxarifado
                    let setorId = null;
                    
                    // Se o almoxarifado tem um setor associado
                    if (almoxarifado.setor && almoxarifado.setor.id) {
                        setorId = almoxarifado.setor.id;
                    } else if (almoxarifado.setor) {
                        // Caso tenha apenas o ID do setor
                        setorId = almoxarifado.setor;
                    } else {
                        // Como fallback, procura um setor que tenha o mesmo nome ou ID do almoxarifado
                        const setorCorrespondente = setores.find(s => 
                            s.nome === almoxarifado.nome || 
                            s.id === almoxarifado.id
                        );
                        if (setorCorrespondente) {
                            setorId = setorCorrespondente.id;
                        }
                    }
                    
                    console.log('Setor ID determinado:', setorId);
                    
                    // Define o setor origem automaticamente
                    if (setorId) {
                        setorOrigemSelect.value = setorId;
                        console.log('Setor origem preenchido automaticamente com ID:', setorId);
                        
                        // Adiciona feedback visual para o usuário
                        const setorOption = setorOrigemSelect.querySelector(`option[value="${setorId}"]`);
                        if (setorOption) {
                            console.log('Setor origem definido como:', setorOption.textContent);
                        }
                    } else {
                        console.warn('Setor não encontrado para o almoxarifado:', almoxarifado);
                        // Como fallback, usa o primeiro setor disponível
                        if (setores && setores.length > 0) {
                            const primeiroSetor = setores[0];
                            setorOrigemSelect.value = primeiroSetor.id;
                            console.log('Usando primeiro setor disponível como fallback:', primeiroSetor.nome);
                        } else {
                            setorOrigemSelect.value = '';
                        }
                    }
                } else {
                    console.warn('Almoxarifado não encontrado para o estoque:', estoque);
                    
                    // Como fallback, usa o primeiro setor disponível se existir
                    if (setores && setores.length > 0) {
                        const primeiroSetor = setores[0];
                        setorOrigemSelect.value = primeiroSetor.id;
                        console.log('Usando primeiro setor disponível como fallback (sem almoxarifado):', primeiroSetor.nome);
                    } else {
                        setorOrigemSelect.value = '';
                        console.log('Nenhum setor disponível para usar como fallback');
                    }
                }
            } else {
                console.warn('Estoque não encontrado para ID:', estoqueId);
                setorOrigemSelect.value = '';
            }
        } catch (error) {
            console.error('Erro ao preencher setor origem:', error);
            setorOrigemSelect.value = '';
        }
    }

    // Funções do Modal
    function openAddModal() {
        modalTitle.textContent = 'Nova Movimentação';
        movementForm.reset();
        movementIdInput.value = '';
        
        // Limpa os selects
        estoqueSelect.value = '';
        usuarioSelect.value = '';
        setorOrigemSelect.value = '';
        setorDestinoSelect.value = '';
        
        // Define a data atual como padrão
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        document.getElementById('date').value = todayString;
        
        movementModal.classList.remove('hidden');
        
        console.log('Modal Nova Movimentação aberta');
    }
    
    function closeMovementModal() {
        movementModal.classList.add('hidden');
    }

    function openEditModal(id) {
        const movement = movements.find(m => m.id === id);
        if (movement) {
            modalTitle.textContent = 'Editar Movimentação';
            movementIdInput.value = movement.id;
            
            // Popula os selects com os valores da movimentação
            if (movement.estoque?.id) {
                estoqueSelect.value = movement.estoque.id;
            }
            if (movement.usuario?.id) {
                usuarioSelect.value = movement.usuario.id;
            }
            if (movement.setorOrigem?.id) {
                setorOrigemSelect.value = movement.setorOrigem.id;
            }
            if (movement.setorDestino?.id) {
                setorDestinoSelect.value = movement.setorDestino.id;
            }
            
            document.getElementById('type').value = movement.tipoMovimentacao;
            document.getElementById('amount').value = movement.quantidade;
            document.getElementById('date').value = formatDateForInput(movement.dataMovimentacao);
            movementModal.classList.remove('hidden');
        }
    }

    // Formata data para input do tipo date
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        // Se for uma data ISO completa (com hora), pega apenas a parte da data
        const date = dateString.includes('T') ? dateString.split('T')[0] : dateString;
        return date;
    }

    // Lida com cliques nos botões de editar e excluir
    function handleTableActions(e) {
        const target = e.target;
        if (target.classList.contains('edit-btn')) {
            const id = parseInt(target.getAttribute('data-id'));
            openEditModal(id);
        }
        if (target.classList.contains('delete-btn')) {
            const id = parseInt(target.getAttribute('data-id'));
            openConfirmModal(id);
        }
    }

    // Funções de confirmação de exclusão
    function openConfirmModal(id) {
        movementToDelete = id;
        confirmModal.classList.remove('hidden');
    }

    function closeConfirmModal() {
        confirmModal.classList.add('hidden');
        movementToDelete = null;
    }

    async function processDelete() {
        if (movementToDelete !== null) {
            try {
                showLoading(true);
                await apiManager.removerMovimentacao(movementToDelete);
                
                // Remove da lista local
                movements = movements.filter(m => m.id !== movementToDelete);
                
                // Reajusta a página atual se a última movimentação da página for excluída
                const totalPages = Math.ceil(movements.length / itemsPerPage);
                if(currentPage > totalPages && totalPages > 0) {
                    currentPage = totalPages;
                }

                renderMovements();
                closeConfirmModal();
            } catch (error) {
                console.error('Erro ao excluir movimentação:', error);
                showError('Erro ao excluir movimentação. Tente novamente.');
            } finally {
                showLoading(false);
            }
        }
    }

    // Salva (cria ou atualiza) uma movimentação com validação robusta
    async function saveMovement(e) {
        e.preventDefault();
        
        const formData = extractFormData();
        
        // Validação completa antes do envio
        const validationResult = validateMovimentacao(formData);
        if (!validationResult.isValid) {
            showErrorMessage(validationResult.errors.join('\n'));
            highlightInvalidFields(validationResult.invalidFields);
            return;
        }
        
        // Remove destaque de campos inválidos
        clearFieldHighlights();
        
        try {
            showLoading(true);
            showLoadingMessage(formData.id ? 'Atualizando movimentação...' : 'Criando movimentação...');
            
            let savedMovement;
            
            if (formData.id) {
                console.log('🔄 Atualizando movimentação existente:', formData.id);
                savedMovement = await apiManager.atualizarMovimentacao(formData.id, formData.movimentacaoData);
                updateMovementInList(savedMovement);
                showSuccessMessage('Movimentação atualizada com sucesso!');
            } else {
                console.log('➕ Criando nova movimentação');
                savedMovement = await apiManager.criarMovimentacao(formData.movimentacaoData);
                addMovementToList(savedMovement);
                showSuccessMessage('Movimentação criada com sucesso!');
            }
            
            console.log('✅ Movimentação salva:', savedMovement);
            
            closeMovementModal();
            renderMovements();
            
        } catch (error) {
            console.error('❌ Erro ao salvar movimentação:', error);
            
            let errorMessage = 'Erro ao salvar movimentação.';
            
            // Tratamento específico de erros
            if (error.message.includes('400')) {
                errorMessage += ' Dados inválidos fornecidos.';
            } else if (error.message.includes('404')) {
                errorMessage += ' Produto, usuário ou setor não encontrado.';
            } else if (error.message.includes('409')) {
                errorMessage += ' Conflito de dados (ex: estoque insuficiente).';
            } else if (error.message.includes('500')) {
                errorMessage += ' Erro interno do servidor.';
            } else {
                errorMessage += ` ${error.message}`;
            }
            
            showErrorMessage(errorMessage);
        } finally {
            hideLoading();
        }
    }

    // Extrai dados do formulário
    function extractFormData() {
        const id = movementIdInput.value;
        const estoqueId = parseInt(estoqueSelect.value);
        const usuarioId = parseInt(usuarioSelect.value);
        const setorOrigemId = parseInt(setorOrigemSelect.value);
        const setorDestinoId = parseInt(setorDestinoSelect.value);
        const tipoMovimentacao = document.getElementById('type').value;
        const quantidade = parseInt(document.getElementById('amount').value);
        const date = document.getElementById('date').value;

        return {
            id: id ? parseInt(id) : null,
            estoqueId,
            usuarioId,
            setorOrigemId,
            setorDestinoId,
            tipoMovimentacao,
            quantidade,
            date,
            movimentacaoData: {
                tipoMovimentacao,
                quantidade,
                dataMovimentacao: date,
                estoque: { id: estoqueId },
                usuario: { id: usuarioId },
                setorOrigem: { id: setorOrigemId },
                setorDestino: { id: setorDestinoId }
            }
        };
    }

    // Validação completa da movimentação
    function validateMovimentacao(formData) {
        const errors = [];
        const invalidFields = [];

        // Validações obrigatórias
        if (!formData.estoqueId) {
            errors.push('• Produto (Estoque) é obrigatório');
            invalidFields.push('estoque-select');
        }

        if (!formData.usuarioId) {
            errors.push('• Usuário é obrigatório');
            invalidFields.push('usuario-select');
        }

        if (!formData.setorOrigemId) {
            errors.push('• Setor de origem é obrigatório');
            invalidFields.push('setor-origem-select');
        }

        if (!formData.setorDestinoId) {
            errors.push('• Setor de destino é obrigatório');
            invalidFields.push('setor-destino-select');
        }

        if (!formData.tipoMovimentacao) {
            errors.push('• Tipo de movimentação é obrigatório');
            invalidFields.push('type');
        }

        if (!formData.quantidade || formData.quantidade <= 0) {
            errors.push('• Quantidade deve ser maior que zero');
            invalidFields.push('amount');
        }

        if (!formData.date) {
            errors.push('• Data é obrigatória');
            invalidFields.push('date');
        }

        // Validações lógicas
        if (formData.setorOrigemId && formData.setorDestinoId && formData.setorOrigemId === formData.setorDestinoId) {
            errors.push('• Setor de origem deve ser diferente do setor de destino');
            invalidFields.push('setor-origem-select', 'setor-destino-select');
        }

        // Validação de data
        if (formData.date) {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            
            if (selectedDate > today) {
                errors.push('• Data não pode ser no futuro');
                invalidFields.push('date');
            }
        }

        // Validação de estoque disponível (para saídas)
        if (formData.tipoMovimentacao === 'SAIDA' && formData.estoqueId && formData.quantidade) {
            const estoque = estoques.find(e => (e.estoqueId || e.id) === formData.estoqueId);
            if (estoque && estoque.quantidadeEstoque < formData.quantidade) {
                errors.push(`• Quantidade insuficiente em estoque (disponível: ${estoque.quantidadeEstoque})`);
                invalidFields.push('amount');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            invalidFields
        };
    }

    // Destaca campos inválidos
    function highlightInvalidFields(fieldIds) {
        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('field-invalid');
            }
        });
    }

    // Remove destaque de campos inválidos
    function clearFieldHighlights() {
        document.querySelectorAll('.field-invalid').forEach(field => {
            field.classList.remove('field-invalid');
        });
    }

    // Atualiza movimentação na lista local
    function updateMovementInList(updatedMovement) {
        const index = movements.findIndex(m => m.id === updatedMovement.id);
        if (index !== -1) {
            movements[index] = updatedMovement;
        }
    }

    // Adiciona movimentação à lista local
    function addMovementToList(newMovement) {
        movements.unshift(newMovement); // Adiciona no início para mostrar os mais recentes primeiro
    }
    
    // Funções de Paginação
    function updatePaginationInfo(totalPages) {
        const startItem = movements.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
        const endItem = Math.min(currentPage * itemsPerPage, movements.length);
        
        startItemSpan.textContent = startItem;
        endItemSpan.textContent = endItem;
        totalItemsSpan.textContent = movements.length;
        
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    function goToPrevPage() {
        if (currentPage > 1) {
            currentPage--;
            renderMovements();
        }
    }

    function goToNextPage() {
        const totalPages = Math.ceil(movements.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderMovements();
        }
    }

    // Inicia a aplicação
    init();
});
