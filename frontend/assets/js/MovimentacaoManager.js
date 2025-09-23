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
            
            // Carrega dados em paralelo
            const [estoquesResponse, usuariosResponse, setoresResponse] = await Promise.all([
                apiManager.listarEstoques({ size: 100 }),
                loadUsuarios(),
                loadSetores()
            ]);

            estoques = estoquesResponse.content || estoquesResponse;
            
            populateSelects();
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            showError('Erro ao carregar dados necessários para o formulário.');
        } finally {
            showLoading(false);
        }
    }

    // Carrega usuários (usando endpoint temporário ou dados mockados)
    async function loadUsuarios() {
        try {
            usuarios = await apiManager.listarUsuarios();
            return usuarios;
        } catch (error) {
            console.warn('Usando usuários mockados');
            usuarios = [
                { id: 1, login: 'admin', nome: 'Administrador' },
                { id: 2, login: 'user1', nome: 'Usuário 1' },
                { id: 3, login: 'user2', nome: 'Usuário 2' }
            ];
            return usuarios;
        }
    }

    // Carrega setores (usando endpoint temporário ou dados mockados)
    async function loadSetores() {
        try {
            setores = await apiManager.listarSetores();
            return setores;
        } catch (error) {
            console.warn('Usando setores mockados');
            setores = [
                { id: 1, nome: 'Almoxarifado Central' },
                { id: 2, nome: 'Farmácia' },
                { id: 3, nome: 'Enfermaria' },
                { id: 4, nome: 'UTI' }
            ];
            return setores;
        }
    }

    // Popula os selects com os dados carregados
    function populateSelects() {
        // Popula select de estoques
        estoqueSelect.innerHTML = '<option value="">Selecione um produto...</option>';
        estoques.forEach(estoque => {
            const option = document.createElement('option');
            option.value = estoque.id;
            option.textContent = `${estoque.produto?.nome || 'Produto não informado'} (Qtd: ${estoque.quantidadeEstoque || 0})`;
            estoqueSelect.appendChild(option);
        });

        // Popula select de usuários
        usuarioSelect.innerHTML = '<option value="">Selecione um usuário...</option>';
        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.id;
            option.textContent = usuario.nome || usuario.login;
            usuarioSelect.appendChild(option);
        });

        // Popula selects de setores
        const populateSetorSelect = (selectElement) => {
            selectElement.innerHTML = '<option value="">Selecione um setor...</option>';
            setores.forEach(setor => {
                const option = document.createElement('option');
                option.value = setor.id;
                option.textContent = setor.nome;
                selectElement.appendChild(option);
            });
        };

        populateSetorSelect(setorOrigemSelect);
        populateSetorSelect(setorDestinoSelect);
    }

    // Renderiza a tabela de movimentações
    function renderMovements() {
        movementsTableBody.innerHTML = '';
        const totalPages = Math.ceil(movements.length / itemsPerPage);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, movements.length);
        
        if (movements.length === 0) {
             movementsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma movimentação encontrada.</td></tr>';
        } else {
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

    // Mostra mensagem de erro
    function showError(message) {
        alert(message); // Por enquanto usando alert, depois pode ser substituído por um modal
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
            const result = await apiManager.criarDadosBasicos();
            alert('Dados básicos criados com sucesso!\n\n' + result);
            
            // Recarrega os dados necessários
            await loadInitialData();
        } catch (error) {
            console.error('Erro ao criar dados básicos:', error);
            showError('Erro ao criar dados básicos: ' + error.message);
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
        
        movementModal.classList.remove('hidden');
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

    // Salva (cria ou atualiza) uma movimentação
    async function saveMovement(e) {
        e.preventDefault();
        
        const id = movementIdInput.value;
        const estoqueId = parseInt(estoqueSelect.value);
        const usuarioId = parseInt(usuarioSelect.value);
        const setorOrigemId = parseInt(setorOrigemSelect.value);
        const setorDestinoId = parseInt(setorDestinoSelect.value);
        const tipoMovimentacao = document.getElementById('type').value;
        const quantidade = parseInt(document.getElementById('amount').value);
        const date = document.getElementById('date').value;

        // Validação
        if (!estoqueId || !usuarioId || !setorOrigemId || !setorDestinoId || !tipoMovimentacao || !quantidade || !date) {
            showError('Todos os campos são obrigatórios.');
            return;
        }

        // Dados da movimentação seguindo a estrutura do backend
        const movimentacaoData = {
            tipoMovimentacao: tipoMovimentacao,
            quantidade: quantidade,
            dataMovimentacao: date,
            estoque: { id: estoqueId },
            usuario: { id: usuarioId },
            setorOrigem: { id: setorOrigemId },
            setorDestino: { id: setorDestinoId }
        };

        console.log('Dados sendo enviados:', movimentacaoData);

        try {
            showLoading(true);
            
            if (id) { // Atualiza
                const updatedMovement = await apiManager.atualizarMovimentacao(parseInt(id), movimentacaoData);
                const index = movements.findIndex(m => m.id === parseInt(id));
                if (index !== -1) {
                    movements[index] = updatedMovement;
                }
            } else { // Cria
                const newMovement = await apiManager.criarMovimentacao(movimentacaoData);
                movements.unshift(newMovement); // Adiciona no início da lista
            }
            
            closeMovementModal();
            renderMovements();
        } catch (error) {
            console.error('Erro ao salvar movimentação:', error);
            showError('Erro ao salvar movimentação. Verifique os dados e tente novamente.');
        } finally {
            showLoading(false);
        }
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
