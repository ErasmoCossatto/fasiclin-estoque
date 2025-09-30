package com.br.fasipe.estoque.MovimentacaoEstoque.services;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao.TipoMovimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Estoque;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Usuario;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Setor;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Produto;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.MovimentacaoRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.EstoqueRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.UsuarioRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.SetorRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.ProdutoRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.dto.MovimentacaoEntreSetoresDTO;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional
public class MovimentacaoService {

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;
    
    @Autowired
    private EstoqueRepository estoqueRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private SetorRepository setorRepository;
    
    @Autowired
    private ProdutoRepository produtoRepository;

    public List<Movimentacao> findAll() {
        System.out.println("MovimentacaoService.findAll() - Iniciando busca...");
        try {
            List<Movimentacao> movimentacoes = movimentacaoRepository.findAll();
            System.out.println("MovimentacaoService.findAll() - Encontradas " + movimentacoes.size() + " movimentações");
            
            // Ordenar por data decrescente (mais recentes primeiro)
            movimentacoes.sort((m1, m2) -> {
                if (m1.getDataMovimentacao() == null && m2.getDataMovimentacao() == null) return 0;
                if (m1.getDataMovimentacao() == null) return 1;
                if (m2.getDataMovimentacao() == null) return -1;
                return m2.getDataMovimentacao().compareTo(m1.getDataMovimentacao());
            });
            
            System.out.println("MovimentacaoService.findAll() - Ordenadas por data (mais recentes primeiro)");
            return movimentacoes;
        } catch (Exception e) {
            System.err.println("Erro no MovimentacaoService.findAll(): " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>(); // Retorna lista vazia em caso de erro
        }
    }

    public Movimentacao findById(Integer id) {
        Optional<Movimentacao> obj = movimentacaoRepository.findById(id);
        return obj.orElseThrow(() -> new RuntimeException("Movimentação não encontrada!"));
    }

    public Movimentacao insert(Movimentacao movimentacao) {
        log.info("Inserindo nova movimentação - Tipo: {}, Quantidade: {}", 
                movimentacao.getTipoMovimentacao(), movimentacao.getQuantidade());
        
        // TEMPORÁRIO: Validação de usuário desabilitada para testes
        // TODO: Reativar quando variável global de usuário estiver disponível
        
        try {
            // Validações básicas
            if (movimentacao.getQuantidade() == null || movimentacao.getQuantidade() <= 0) {
                throw new IllegalArgumentException("Quantidade deve ser maior que zero");
            }
            
            if (movimentacao.getDataMovimentacao() == null) {
                movimentacao.setDataMovimentacao(LocalDate.now());
                log.info("Data de movimentação definida automaticamente: {}", movimentacao.getDataMovimentacao());
            }
            
            // Temporariamente removido até criar coluna HORAMOVIM no banco
            /*
            // Definir hora atual se não informada (opcional)
            try {
                if (movimentacao.getHoraMovimentacao() == null) {
                    movimentacao.setHoraMovimentacao(LocalTime.now());
                }
            } catch (Exception e) {
                // Ignorar erro se coluna HORAMOVIM não existir ainda
                log.warn("Coluna HORAMOVIM pode não existir no banco: {}", e.getMessage());
            }
            */
            
            // Validar se a data é exatamente hoje
            LocalDate dataAtual = LocalDate.now();
            if (!movimentacao.getDataMovimentacao().equals(dataAtual)) {
                throw new IllegalArgumentException(
                    String.format("Movimentação só pode ser realizada na data atual. Data informada: %s, Data atual: %s", 
                        movimentacao.getDataMovimentacao(), dataAtual));
            }
            
            log.info("Validações básicas concluídas com sucesso");
            
            // Validar se as entidades relacionadas existem
            validateRelatedEntities(movimentacao);
            
            log.info("Iniciando atualização das quantidades de estoque...");
            // Atualizar as quantidades dos estoques antes de salvar a movimentação
            atualizarQuantidadesEstoque(movimentacao);
            
            log.info("Salvando movimentação no banco de dados...");
            Movimentacao novaMovimentacao = movimentacaoRepository.save(movimentacao);
            log.info("Movimentação inserida com sucesso - ID: {}", novaMovimentacao.getId());
            return novaMovimentacao;
            
        } catch (IllegalArgumentException e) {
            log.error("Erro de validação ao inserir movimentação: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Erro inesperado ao inserir movimentação: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao registrar movimentação: " + e.getMessage(), e);
        }
    }
    
    /**
     * Atualiza as quantidades dos estoques com base na movimentação
     * - ENTRADA: incrementa a quantidade no estoque
     * - SAIDA: decrementa a quantidade no estoque
     * 
     * Para movimentações entre setores, apenas registra a movimentação
     * sem alterar estoque (simplificação para funcionar com modelo atual)
     */
    private void atualizarQuantidadesEstoque(Movimentacao movimentacao) {
        Estoque estoqueAtual = movimentacao.getEstoque();
        Integer quantidade = movimentacao.getQuantidade();
        TipoMovimentacao tipo = movimentacao.getTipoMovimentacao();
        
        log.info("Processando movimentação - ID: {}, Tipo: {}, Quantidade: {}, Estoque Atual: {}", 
                estoqueAtual.getId(), tipo, quantidade, estoqueAtual.getQuantidadeEstoque());
        
        // Verificar se é movimentação entre setores (origem e destino diferentes)
        boolean isMovimentacaoEntreSetores = movimentacao.getSetorOrigem() != null && 
                                           movimentacao.getSetorDestino() != null &&
                                           !movimentacao.getSetorOrigem().getId().equals(movimentacao.getSetorDestino().getId());
        
        if (isMovimentacaoEntreSetores) {
            // Para movimentações entre setores, registramos apenas o histórico
            // A lógica de controle por setor seria implementada em versão futura
            log.info("Movimentação entre setores registrada - Origem: {} -> Destino: {}", 
                    movimentacao.getSetorOrigem().getNome(), movimentacao.getSetorDestino().getNome());
            return;
        }
        
        if (tipo == TipoMovimentacao.ENTRADA) {
            // ENTRADA: Adiciona ao estoque
            int novaQuantidade = estoqueAtual.getQuantidadeEstoque() + quantidade;
            estoqueAtual.setQuantidadeEstoque(novaQuantidade);
            estoqueRepository.save(estoqueAtual);
            
            log.info("ENTRADA executada - Estoque {} aumentou de {} para {}", 
                    estoqueAtual.getId(), estoqueAtual.getQuantidadeEstoque() - quantidade, novaQuantidade);
                    
        } else if (tipo == TipoMovimentacao.SAIDA) {
            // SAIDA: Subtrai do estoque
            if (estoqueAtual.getQuantidadeEstoque() < quantidade) {
                throw new IllegalArgumentException(String.format(
                    "Quantidade insuficiente no estoque. Disponível: %d, Solicitado: %d", 
                    estoqueAtual.getQuantidadeEstoque(), quantidade));
            }
            
            int novaQuantidade = estoqueAtual.getQuantidadeEstoque() - quantidade;
            estoqueAtual.setQuantidadeEstoque(novaQuantidade);
            estoqueRepository.save(estoqueAtual);
            
            log.info("SAIDA executada - Estoque {} diminuiu de {} para {}", 
                    estoqueAtual.getId(), estoqueAtual.getQuantidadeEstoque() + quantidade, novaQuantidade);
        }
        
        // Atualizar a referência na movimentação
        movimentacao.setEstoque(estoqueAtual);
    }
    
    /**
     * Método principal para movimentação de produtos entre setores
     * Executa a lógica transacional completa de movimentação
     */
    @Transactional
    public Movimentacao movimentarProdutoEntreSetores(MovimentacaoEntreSetoresDTO dto) {
        log.info("Iniciando movimentação entre setores - Produto: {}, Origem: {}, Destino: {}, Quantidade: {}",
                dto.getIdProduto(), dto.getIdSetorOrigem(), dto.getIdSetorDestino(), dto.getQuantidade());
        
        try {
            // 1. Validações básicas
            validarMovimentacaoEntreSetores(dto);
            
            // 2. Buscar entidades necessárias
            Produto produto = buscarProduto(dto.getIdProduto());
            Setor setorOrigem = buscarSetor(dto.getIdSetorOrigem());
            Setor setorDestino = buscarSetor(dto.getIdSetorDestino());
            Usuario usuario = buscarUsuario(dto.getIdUsuario()); // Pode retornar null
            
            // 3. Verificar e obter estoque de origem
            Estoque estoqueOrigem = buscarEstoqueNoSetor(produto, setorOrigem);
            
            // 4. Validar se há quantidade suficiente
            validarQuantidadeDisponivel(estoqueOrigem, dto.getQuantidade());
            
            // 5. Buscar ou criar estoque de destino
            Estoque estoqueDestino = buscarOuCriarEstoqueNoSetor(produto, setorDestino);
            
            // 6. Executar a movimentação (atômica)
            executarMovimentacaoAtômica(estoqueOrigem, estoqueDestino, dto.getQuantidade());
            
            // 7. Registrar a movimentação
            Movimentacao movimentacao = criarRegistroMovimentacao(
                produto, setorOrigem, setorDestino, usuario, dto.getQuantidade(), estoqueOrigem);
            
            Movimentacao movimentacaoSalva = movimentacaoRepository.save(movimentacao);
            
            log.info("Movimentação entre setores realizada com sucesso - ID: {}", movimentacaoSalva.getId());
            return movimentacaoSalva;
            
        } catch (Exception e) {
            log.error("Erro na movimentação entre setores: {}", e.getMessage(), e);
            throw new RuntimeException("Falha na movimentação: " + e.getMessage(), e);
        }
    }
    
    private void validarMovimentacaoEntreSetores(MovimentacaoEntreSetoresDTO dto) {
        if (dto.getIdSetorOrigem().equals(dto.getIdSetorDestino())) {
            throw new IllegalArgumentException("Setor de origem deve ser diferente do setor de destino");
        }
        
        if (dto.getQuantidade() <= 0) {
            throw new IllegalArgumentException("Quantidade deve ser maior que zero");
        }
    }
    
    private Produto buscarProduto(Integer idProduto) {
        return produtoRepository.findById(idProduto)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado: " + idProduto));
    }
    
    private Setor buscarSetor(Integer idSetor) {
        return setorRepository.findById(idSetor)
                .orElseThrow(() -> new IllegalArgumentException("Setor não encontrado: " + idSetor));
    }
    
    private Usuario buscarUsuario(Integer idUsuario) {
        if (idUsuario == null) {
            log.info("ID do usuário é nulo, retornando null para teste");
            return null;
        }
        
        Optional<Usuario> usuario = usuarioRepository.findById(idUsuario);
        if (usuario.isEmpty()) {
            log.warn("Usuário com ID {} não encontrado, retornando null para teste", idUsuario);
            return null;
        }
        
        return usuario.get();
    }
    
    private Estoque buscarEstoqueNoSetor(Produto produto, Setor setor) {
        // Aqui assumimos que existe uma relação entre Estoque e Setor
        // Como não vemos essa relação direta no modelo Estoque atual, 
        // vamos buscar estoques do produto e verificar se há algum disponível
        // Esta lógica pode precisar ser ajustada baseada na estrutura real do banco
        
        List<Estoque> estoquesDisponiveis = estoqueRepository.findByIdProduto(produto.getId());
        
        if (estoquesDisponiveis.isEmpty()) {
            throw new IllegalStateException("Não há estoque disponível para o produto no setor de origem");
        }
        
        // Por simplicidade, retornamos o primeiro estoque disponível
        // Em um cenário real, você teria que implementar a lógica para associar estoque com setor
        return estoquesDisponiveis.get(0);
    }
    
    private void validarQuantidadeDisponivel(Estoque estoque, Integer quantidadeRequerida) {
        if (estoque.getQuantidadeEstoque() < quantidadeRequerida) {
            throw new IllegalStateException(String.format(
                "Estoque insuficiente. Disponível: %d, Requerido: %d", 
                estoque.getQuantidadeEstoque(), quantidadeRequerida));
        }
    }
    
    private Estoque buscarOuCriarEstoqueNoSetor(Produto produto, Setor setorDestino) {
        // Buscar estoque existente para o produto no setor destino
        List<Estoque> estoquesDestino = estoqueRepository.findByIdProduto(produto.getId());
        
        if (!estoquesDestino.isEmpty()) {
            // Se existe estoque, usa o primeiro (ajustar lógica conforme necessário)
            return estoquesDestino.get(0);
        }
        
        // Se não existe, precisaríamos criar um novo estoque
        // Porém, o modelo Estoque requer um Lote, que não temos neste contexto
        // Esta lógica precisa ser ajustada baseada nos requisitos reais
        throw new IllegalStateException("Não foi possível localizar ou criar estoque no setor destino. " +
                "Necessário ajustar lógica para criação de estoque sem lote.");
    }
    
    private void executarMovimentacaoAtômica(Estoque estoqueOrigem, Estoque estoqueDestino, Integer quantidade) {
        // Subtrai do estoque origem
        int novaQuantidadeOrigem = estoqueOrigem.getQuantidadeEstoque() - quantidade;
        estoqueOrigem.setQuantidadeEstoque(novaQuantidadeOrigem);
        estoqueRepository.save(estoqueOrigem);
        
        // Adiciona ao estoque destino
        int novaQuantidadeDestino = estoqueDestino.getQuantidadeEstoque() + quantidade;
        estoqueDestino.setQuantidadeEstoque(novaQuantidadeDestino);
        estoqueRepository.save(estoqueDestino);
        
        log.info("Movimentação executada: Origem {} -> {}, Destino {} -> {}", 
                estoqueOrigem.getQuantidadeEstoque() + quantidade, novaQuantidadeOrigem,
                estoqueDestino.getQuantidadeEstoque() - quantidade, novaQuantidadeDestino);
    }
    
    private Movimentacao criarRegistroMovimentacao(Produto produto, Setor setorOrigem, Setor setorDestino, 
                                                   Usuario usuario, Integer quantidade, Estoque estoque) {
        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setTipoMovimentacao(TipoMovimentacao.SAIDA); // Saída do setor origem
        movimentacao.setQuantidade(quantidade);
        movimentacao.setDataMovimentacao(LocalDate.now());
        movimentacao.setEstoque(estoque);
        movimentacao.setUsuario(usuario);
        movimentacao.setSetorOrigem(setorOrigem);
        movimentacao.setSetorDestino(setorDestino);
        
        return movimentacao;
    }
    
    private void validateRelatedEntities(Movimentacao movimentacao) {
        log.info("Iniciando validação de entidades relacionadas...");
        
        // Validar estoque
        if (movimentacao.getEstoque() == null || movimentacao.getEstoque().getId() == null) {
            throw new IllegalArgumentException("Estoque deve ser informado");
        }
        
        // Primeiro tenta buscar por ID de estoque diretamente
        Integer idRecebido = movimentacao.getEstoque().getId();
        log.info("Validando estoque com ID: {}", idRecebido);
        
        Optional<Estoque> estoque = estoqueRepository.findById(idRecebido);
        
        if (estoque.isEmpty()) {
            // Se não encontrou como estoque, tenta como produto
            log.info("Não encontrou estoque com ID {}, tentando buscar como produto...", idRecebido);
            Optional<Produto> produto = produtoRepository.findById(idRecebido);
            if (produto.isPresent()) {
                // Busca estoque que contém esse produto
                log.info("Produto encontrado, buscando estoques para produto ID: {}", idRecebido);
                List<Estoque> estoquesDoProduto = estoqueRepository.findByIdProduto(idRecebido);
                log.info("Encontrados {} estoques para o produto", estoquesDoProduto.size());
                
                if (!estoquesDoProduto.isEmpty()) {
                    // Usa o primeiro estoque encontrado para esse produto
                    estoque = Optional.of(estoquesDoProduto.get(0));
                    log.info("Usando estoque ID {} para produto ID {}", estoque.get().getId(), idRecebido);
                } else {
                    // Se o produto não tem estoque, vamos criar um temporário
                    log.error("Produto {} não possui estoque cadastrado", idRecebido);
                    throw new IllegalArgumentException("Produto não possui estoque cadastrado. Produto ID: " + idRecebido);
                }
            } else {
                log.error("Nem estoque nem produto encontrado com ID: {}", idRecebido);
                throw new IllegalArgumentException("Nem estoque nem produto encontrado com ID: " + idRecebido);
            }
        } else {
            log.info("Estoque encontrado diretamente com ID {}", idRecebido);
        }
        
        movimentacao.setEstoque(estoque.get());
        log.info("Estoque validado com sucesso: ID {}", estoque.get().getId());
        
        // Validar usuário (OPCIONAL - para testes)
        if (movimentacao.getUsuario() != null && movimentacao.getUsuario().getId() != null) {
            log.info("Validando usuário com ID: {}", movimentacao.getUsuario().getId());
            Optional<Usuario> usuario = usuarioRepository.findById(movimentacao.getUsuario().getId());
            if (usuario.isEmpty()) {
                log.warn("Usuário com ID {} não encontrado, prosseguindo sem usuário para testes", movimentacao.getUsuario().getId());
                movimentacao.setUsuario(null);
            } else {
                movimentacao.setUsuario(usuario.get());
                log.info("Usuário validado com sucesso: ID {}", usuario.get().getId());
            }
        } else {
            log.info("Movimentação sendo realizada sem usuário (modo teste)");
            movimentacao.setUsuario(null);
        }
        
        // Validar setor origem
        if (movimentacao.getSetorOrigem() == null || movimentacao.getSetorOrigem().getId() == null) {
            throw new IllegalArgumentException("Setor de origem deve ser informado");
        }
        
        log.info("Validando setor de origem com ID: {}", movimentacao.getSetorOrigem().getId());
        Optional<Setor> setorOrigem = setorRepository.findById(movimentacao.getSetorOrigem().getId());
        if (setorOrigem.isEmpty()) {
            log.error("Setor de origem não encontrado: {}", movimentacao.getSetorOrigem().getId());
            throw new IllegalArgumentException("Setor de origem não encontrado: " + movimentacao.getSetorOrigem().getId());
        }
        movimentacao.setSetorOrigem(setorOrigem.get());
        log.info("Setor de origem validado com sucesso: {} - {}", setorOrigem.get().getId(), setorOrigem.get().getNome());
        
        // Validar setor destino
        if (movimentacao.getSetorDestino() == null || movimentacao.getSetorDestino().getId() == null) {
            throw new IllegalArgumentException("Setor de destino deve ser informado");
        }
        
        log.info("Validando setor de destino com ID: {}", movimentacao.getSetorDestino().getId());
        Optional<Setor> setorDestino = setorRepository.findById(movimentacao.getSetorDestino().getId());
        if (setorDestino.isEmpty()) {
            log.error("Setor de destino não encontrado: {}", movimentacao.getSetorDestino().getId());
            throw new IllegalArgumentException("Setor de destino não encontrado: " + movimentacao.getSetorDestino().getId());
        }
        movimentacao.setSetorDestino(setorDestino.get());
        log.info("Setor de destino validado com sucesso: {} - {}", setorDestino.get().getId(), setorDestino.get().getNome());
        
        // Validar se setor origem é diferente do destino
        if (movimentacao.getSetorOrigem().getId().equals(movimentacao.getSetorDestino().getId())) {
            log.error("Setor de origem e destino são iguais: {}", movimentacao.getSetorOrigem().getId());
            throw new IllegalArgumentException("Setor de origem deve ser diferente do setor de destino");
        }
        
        log.info("Todas as entidades relacionadas foram validadas com sucesso");
    }

    public Movimentacao update(Integer id, Movimentacao movimentacao) {
        log.info("Atualizando movimentação ID: {}", id);
        
        Movimentacao entity = findById(id);
        
        // Validar se as entidades relacionadas existem antes de atualizar
        validateRelatedEntities(movimentacao);
        
        updateData(entity, movimentacao);
        
        try {
            Movimentacao movimentacaoAtualizada = movimentacaoRepository.save(entity);
            log.info("Movimentação atualizada com sucesso - ID: {}", id);
            return movimentacaoAtualizada;
        } catch (Exception e) {
            log.error("Erro ao atualizar movimentação ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao atualizar movimentação: " + e.getMessage());
        }
    }

    public void delete(Integer id) {
        log.info("Removendo movimentação ID: {}", id);
        
        // Verifica se existe antes de tentar deletar
        findById(id);
        
        try {
            movimentacaoRepository.deleteById(id);
            log.info("Movimentação removida com sucesso - ID: {}", id);
        } catch (Exception e) {
            log.error("Erro ao remover movimentação ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao remover movimentação: " + e.getMessage());
        }
    }

    private void updateData(Movimentacao entity, Movimentacao movimentacao) {
        if (movimentacao.getTipoMovimentacao() != null) {
            entity.setTipoMovimentacao(movimentacao.getTipoMovimentacao());
        }
        if (movimentacao.getQuantidade() != null && movimentacao.getQuantidade() > 0) {
            entity.setQuantidade(movimentacao.getQuantidade());
        }
        if (movimentacao.getDataMovimentacao() != null) {
            entity.setDataMovimentacao(movimentacao.getDataMovimentacao());
        }
        
        // Atualizar relacionamentos se fornecidos
        if (movimentacao.getEstoque() != null) {
            entity.setEstoque(movimentacao.getEstoque());
        }
        if (movimentacao.getUsuario() != null) {
            entity.setUsuario(movimentacao.getUsuario());
        }
        if (movimentacao.getSetorOrigem() != null) {
            entity.setSetorOrigem(movimentacao.getSetorOrigem());
        }
        if (movimentacao.getSetorDestino() != null) {
            entity.setSetorDestino(movimentacao.getSetorDestino());
        }
    }

    public List<Movimentacao> findByQuantidade(Integer quantidade) {
        return movimentacaoRepository.findByQuantidade(quantidade);
    }

    public List<Movimentacao> findByQuantidadeBetween(Integer quantidadeMinima, Integer quantidadeMaxima) {
        // Como não temos método específico no repository, vamos usar stream
        return movimentacaoRepository.findAll().stream()
                .filter(m -> m.getQuantidade() >= quantidadeMinima && m.getQuantidade() <= quantidadeMaxima)
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Movimentacao> findByDataMovimentacao(LocalDate data) {
        return movimentacaoRepository.findAll().stream()
                .filter(m -> m.getDataMovimentacao().equals(data))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Movimentacao> findByDataMovimentacaoBetween(LocalDate dataInicial, LocalDate dataFinal) {
        return movimentacaoRepository.findAll().stream()
                .filter(m -> !m.getDataMovimentacao().isBefore(dataInicial) && !m.getDataMovimentacao().isAfter(dataFinal))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Movimentacao> findByTipoMovimentacao(TipoMovimentacao tipo) {
        return movimentacaoRepository.findByTipoMovimentacao(tipo);
    }

    /**
     * Método para criar dados de teste (temporário para desenvolvimento)
     */
    public void criarDadosTeste() {
        try {
            // Verificar se já existem dados
            List<Movimentacao> existentes = movimentacaoRepository.findAll();
            if (!existentes.isEmpty()) {
                System.out.println("Já existem " + existentes.size() + " movimentações no banco");
                return;
            }

            // Criar dados básicos de teste primeiro
            criarDadosBasicos();

            // Criar algumas movimentações de teste
            Movimentacao mov1 = new Movimentacao();
            mov1.setTipoMovimentacao(TipoMovimentacao.ENTRADA);
            mov1.setQuantidade(100);
            mov1.setDataMovimentacao(java.time.LocalDate.now());
            
            // Criar entidades padrão para teste
            Estoque estoque1 = new Estoque();
            estoque1.setId(1);
            mov1.setEstoque(estoque1);
            
            Usuario usuario1 = new Usuario();
            usuario1.setId(1);
            mov1.setUsuario(usuario1);
            
            Setor setor1 = new Setor();
            setor1.setId(1);
            mov1.setSetorOrigem(setor1);
            
            Setor setor2 = new Setor();
            setor2.setId(2);
            mov1.setSetorDestino(setor2);
            
            Movimentacao mov2 = new Movimentacao();
            mov2.setTipoMovimentacao(TipoMovimentacao.SAIDA);
            mov2.setQuantidade(50);
            mov2.setDataMovimentacao(java.time.LocalDate.now().minusDays(1));
            
            // Reutilizar as mesmas entidades para mov2
            mov2.setEstoque(estoque1);
            mov2.setUsuario(usuario1);
            mov2.setSetorOrigem(setor2);
            mov2.setSetorDestino(setor1);

            movimentacaoRepository.save(mov1);
            movimentacaoRepository.save(mov2);
            
            System.out.println("Dados de teste criados com sucesso!");
        } catch (Exception e) {
            System.err.println("Erro ao criar dados de teste: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Método para criar dados básicos necessários para testes
     */
    private void criarDadosBasicos() {
        // Este método deveria idealmente criar dados nas outras tabelas também
        // Por enquanto, usamos apenas IDs que devem existir no banco
        System.out.println("Criando dados básicos...");
        // Aqui você pode adicionar lógica para criar produtos, estoques, usuários e setores
        // se eles não existirem no banco
    }
}