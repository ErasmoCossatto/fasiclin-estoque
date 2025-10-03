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
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Lote;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.MovimentacaoRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.EstoqueRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.UsuarioRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.SetorRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.ProdutoRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.dto.MovimentacaoEntreSetoresDTO;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

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
            
            // SEMPRE usar data e hora atuais - ignorar o que vem do frontend
            LocalDate dataAtual = LocalDate.now();
            LocalTime horaAtual = LocalTime.now();
            
            movimentacao.setDataMovimentacao(dataAtual);
            movimentacao.setHoraMovimentacao(horaAtual);
            
            log.info("Data/hora atuais definidas automaticamente - Data: {}, Hora: {}", 
                    dataAtual, horaAtual);
            
            log.info("Validações básicas concluídas com sucesso");
            
            // Validar se as entidades relacionadas existem
            validateRelatedEntities(movimentacao);
            
            log.info("Iniciando atualização das quantidades de estoque...");
            // Atualizar as quantidades dos estoques antes de salvar a movimentação
            atualizarQuantidadesEstoque(movimentacao);
            
            log.info("Salvando movimentação no banco de dados...");
            Movimentacao novaMovimentacao = movimentacaoRepository.save(movimentacao);
            log.info("Movimentação inserida com sucesso - ID: {}, Data: {}, Hora: {}", 
                    novaMovimentacao.getId(), novaMovimentacao.getDataMovimentacao(), 
                    novaMovimentacao.getHoraMovimentacao());
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
     * - MOVIMENTAÇÃO ENTRE SETORES: debita do setor origem e credita no setor destino
     */
    private void atualizarQuantidadesEstoque(Movimentacao movimentacao) {
        TipoMovimentacao tipo = movimentacao.getTipoMovimentacao();
        Integer quantidade = movimentacao.getQuantidade();
        
        log.info("Processando movimentação - Tipo: {}, Quantidade: {}", tipo, quantidade);
        
        // Verificar se é movimentação entre setores (origem e destino diferentes)
        boolean isMovimentacaoEntreSetores = movimentacao.getSetorOrigem() != null && 
                                           movimentacao.getSetorDestino() != null &&
                                           !movimentacao.getSetorOrigem().getId().equals(movimentacao.getSetorDestino().getId());
        
        if (isMovimentacaoEntreSetores) {
            // NOVA LÓGICA: Movimentação entre setores com controle específico
            processarMovimentacaoEntreSetores(movimentacao);
        } else {
            // Movimentação simples (entrada/saída no mesmo setor)
            processarMovimentacaoSimples(movimentacao, tipo, quantidade);
        }
    }
    
    /**
     * NOVA IMPLEMENTAÇÃO: Processa movimentação entre setores diferentes
     * Debita do setor origem e credita no setor destino atomicamente
     * REGRA DE NEGÓCIO: Exige que o produto já exista no setor de origem
     */
    @Transactional
    private void processarMovimentacaoEntreSetores(Movimentacao movimentacao) {
        Integer idProduto = movimentacao.getEstoque().getProduto().getId();
        Integer idSetorOrigem = movimentacao.getSetorOrigem().getId();
        Integer idSetorDestino = movimentacao.getSetorDestino().getId();
        Integer quantidade = movimentacao.getQuantidade();
        
        log.info("Processando movimentação entre setores - Produto: {}, Origem: {}, Destino: {}, Quantidade: {}", 
                idProduto, idSetorOrigem, idSetorDestino, quantidade);
        
        try {
            // 1. VALIDAR E DEBITAR do setor de origem (OBRIGATÓRIO existir)
            Estoque estoqueOrigem = buscarOuCriarEstoqueNoSetor(idProduto, idSetorOrigem, false);
            
            if (estoqueOrigem.getQuantidadeEstoque() < quantidade) {
                throw new IllegalStateException(String.format(
                    "Quantidade insuficiente no setor de origem '%s'. Disponível: %d, Solicitado: %d", 
                    movimentacao.getSetorOrigem().getNome(), estoqueOrigem.getQuantidadeEstoque(), quantidade));
            }
            
            int novaQuantidadeOrigem = estoqueOrigem.getQuantidadeEstoque() - quantidade;
            estoqueOrigem.setQuantidadeEstoque(novaQuantidadeOrigem);
            estoqueRepository.save(estoqueOrigem);
            
            log.info("DÉBITO realizado - Setor Origem: '{}' | Produto: {} | Quantidade anterior: {} | Nova quantidade: {}", 
                    movimentacao.getSetorOrigem().getNome(), idProduto, estoqueOrigem.getQuantidadeEstoque() + quantidade, novaQuantidadeOrigem);
            
            // 2. VALIDAR E CREDITAR no setor de destino (pode criar se não existir)
            Estoque estoqueDestino = buscarOuCriarEstoqueNoSetor(idProduto, idSetorDestino, true);
            
            int novaQuantidadeDestino = estoqueDestino.getQuantidadeEstoque() + quantidade;
            estoqueDestino.setQuantidadeEstoque(novaQuantidadeDestino);
            estoqueRepository.save(estoqueDestino);
            
            log.info("CRÉDITO realizado - Setor Destino: '{}' | Produto: {} | Quantidade anterior: {} | Nova quantidade: {}", 
                    movimentacao.getSetorDestino().getNome(), idProduto, estoqueDestino.getQuantidadeEstoque() - quantidade, novaQuantidadeDestino);
            
            // 3. Atualizar a referência na movimentação (usar o estoque de origem para registro)
            movimentacao.setEstoque(estoqueOrigem);
            
            log.info("Movimentação entre setores concluída com sucesso! {} → {}", 
                    movimentacao.getSetorOrigem().getNome(), movimentacao.getSetorDestino().getNome());
            
        } catch (Exception e) {
            log.error("Erro na movimentação entre setores: {}", e.getMessage(), e);
            throw new RuntimeException("Falha na movimentação entre setores: " + e.getMessage(), e);
        }
    }
    
    /**
     * Processa movimentação simples (entrada/saída no mesmo setor)
     */
    private void processarMovimentacaoSimples(Movimentacao movimentacao, TipoMovimentacao tipo, Integer quantidade) {
        Estoque estoqueAtual = movimentacao.getEstoque();
        
        log.info("Processando movimentação simples - ID: {}, Tipo: {}, Quantidade: {}, Estoque Atual: {}", 
                estoqueAtual.getId(), tipo, quantidade, estoqueAtual.getQuantidadeEstoque());
        
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
     * IMPLEMENTAÇÃO AJUSTADA: Busca estoque específico no setor
     * Para setores existentes (Teste, Compras, Estoque), não cria automaticamente
     * @param idProduto ID do produto
     * @param idSetor ID do setor
     * @param permitirCriacao Se true, permite criar estoque (apenas para casos específicos)
     * @return Estoque encontrado
     */
    private Estoque buscarOuCriarEstoqueNoSetor(Integer idProduto, Integer idSetor, boolean permitirCriacao) {
        // Buscar estoque específico do produto no setor
        List<Estoque> estoquesNoSetor = estoqueRepository.findByProdutoAndSetor(idProduto, idSetor);
        
        if (!estoquesNoSetor.isEmpty()) {
            // Estoque encontrado - retorna o primeiro (poderia ser otimizado para escolher o melhor lote)
            Estoque estoque = estoquesNoSetor.get(0);
            log.info("Estoque encontrado - Setor: {}, Produto: {}, Estoque ID: {}, Quantidade: {}", 
                    idSetor, idProduto, estoque.getId(), estoque.getQuantidadeEstoque());
            return estoque;
        }
        
        // NOVA LÓGICA: Para setores destino, tentar criar com quantidade zero
        // Para setores origem, sempre falhar se não existir
        if (!permitirCriacao) {
            throw new IllegalStateException(String.format(
                "Produto ID %d não possui estoque no setor ID %d. " +
                "Para movimentar produtos, o estoque deve estar previamente cadastrado no setor de origem.", 
                idProduto, idSetor));
        }
        
        // Para o setor DESTINO: criar estoque com quantidade zero (recebedor)
        log.info("Produto não existe no setor de destino. Criando estoque com quantidade zero - Produto: {} no Setor: {}", idProduto, idSetor);
        return criarEstoqueZeroNoSetor(idProduto, idSetor);
    }
    
    /**
     * IMPLEMENTAÇÃO MELHORADA: Cria estoque com quantidade zero no setor de destino
     * Usado apenas quando um produto vai pela primeira vez para um setor
     */
    private Estoque criarEstoqueZeroNoSetor(Integer idProduto, Integer idSetor) {
        try {
            // Buscar o produto
            Produto produto = produtoRepository.findById(idProduto)
                    .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado: " + idProduto));
            
            // Verificar se o produto pertence ao setor através do almoxarifado
            if (produto.getAlmoxarifado() == null || 
                !produto.getAlmoxarifado().getSetor().getId().equals(idSetor)) {
                
                // Buscar um estoque existente do produto para usar o mesmo lote
                List<Estoque> estoquesExistentes = estoqueRepository.findByIdProduto(idProduto);
                
                if (estoquesExistentes.isEmpty()) {
                    throw new IllegalStateException(String.format(
                        "Produto ID %d não possui nenhum estoque cadastrado no sistema. " +
                        "Cadastre o produto em pelo menos um setor antes de movimentar.", idProduto));
                }
                
                // Usar o lote do primeiro estoque existente
                Lote loteExistente = estoquesExistentes.get(0).getLote();
                
                // Criar novo estoque com quantidade zero no setor de destino
                Estoque novoEstoque = new Estoque();
                novoEstoque.setProduto(produto);
                novoEstoque.setLote(loteExistente);
                novoEstoque.setQuantidadeEstoque(0);
                
                Estoque estoqueSalvo = estoqueRepository.save(novoEstoque);
                
                log.info("Estoque criado no setor de destino - ID: {}, Produto: {}, Setor: {}, Quantidade inicial: 0", 
                        estoqueSalvo.getId(), idProduto, idSetor);
                
                return estoqueSalvo;
            }
            
            // Se chegou aqui, o produto já deveria ter estoque no setor
            throw new IllegalStateException(String.format(
                "Produto ID %d deveria ter estoque no setor ID %d mas não foi encontrado", idProduto, idSetor));
            
        } catch (Exception e) {
            log.error("Erro ao criar estoque no setor de destino - Produto {} no Setor {}: {}", idProduto, idSetor, e.getMessage(), e);
            throw new RuntimeException("Falha ao preparar setor de destino: " + e.getMessage(), e);
        }
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
            
            // 3. Verificar se o produto pode ser movimentado (tem almoxarifado)
            if (produto.getAlmoxarifado() == null) {
                throw new IllegalStateException("Produto não pode ser movimentado pois não possui almoxarifado associado");
            }
            
                        // 5. Verificar e obter estoque (central)
            Estoque estoque = buscarEstoqueNoSetor(produto, setorOrigem);
            
            // 6. Validar se há quantidade suficiente
            validarQuantidadeDisponivel(estoque, dto.getQuantidade());
            
            // 7. Registrar a movimentação (sem alterar estoque físico por ora)
            Movimentacao movimentacao = criarRegistroMovimentacao(
                produto, setorOrigem, setorDestino, usuario, dto.getQuantidade(), estoque);
            
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
            // TEMPORÁRIO: Para testes, buscar qualquer usuário do banco
            log.info("ID do usuário é nulo, buscando automaticamente um usuário para teste");
            List<Usuario> usuarios = usuarioRepository.findAll();
            if (usuarios.isEmpty()) {
                throw new IllegalStateException("Nenhum usuário encontrado no banco de dados para teste");
            }
            Usuario usuarioTeste = usuarios.get(0);
            log.info("Usuário de teste selecionado: ID {}, Login: {}", usuarioTeste.getId(), usuarioTeste.getLogin());
            return usuarioTeste;
        }
        
        Optional<Usuario> usuario = usuarioRepository.findById(idUsuario);
        if (usuario.isEmpty()) {
            log.warn("Usuário com ID {} não encontrado, retornando null para teste", idUsuario);
            return null;
        }
        
        return usuario.get();
    }
    
    private Estoque buscarEstoqueNoSetor(Produto produto, Setor setor) {
        // NOVA IMPLEMENTAÇÃO: Busca estoque específico do produto no setor
        List<Estoque> estoquesNoSetor = estoqueRepository.findByProdutoAndSetor(produto.getId(), setor.getId());
        
        if (estoquesNoSetor.isEmpty()) {
            throw new IllegalStateException(String.format(
                "Produto '%s' não possui estoque no setor '%s'", 
                produto.getNome(), setor.getNome()));
        }
        
        // Retorna o primeiro estoque encontrado (poderia ser otimizado para escolher o melhor lote)
        Estoque estoque = estoquesNoSetor.get(0);
        
        log.info("Estoque encontrado para produto {} no setor {}: Estoque ID={}, Quantidade={}", 
                produto.getId(), setor.getId(), estoque.getId(), estoque.getQuantidadeEstoque());
        
        return estoque;
    }
    
    private void validarQuantidadeDisponivel(Estoque estoque, Integer quantidadeRequerida) {
        if (estoque.getQuantidadeEstoque() < quantidadeRequerida) {
            throw new IllegalStateException(String.format(
                "Estoque insuficiente. Disponível: %d, Requerido: %d", 
                estoque.getQuantidadeEstoque(), quantidadeRequerida));
        }
        
        log.info("Validação de quantidade OK - Disponível: {}, Requerido: {}", 
                estoque.getQuantidadeEstoque(), quantidadeRequerida);
    }
    
    private Movimentacao criarRegistroMovimentacao(Produto produto, Setor setorOrigem, Setor setorDestino, 
                                                   Usuario usuario, Integer quantidade, Estoque estoque) {
        Movimentacao movimentacao = new Movimentacao();
        movimentacao.setTipoMovimentacao(TipoMovimentacao.SAIDA); // Saída do setor origem
        movimentacao.setQuantidade(quantidade);
        
        // SEMPRE usar data e hora atuais
        movimentacao.setDataMovimentacao(LocalDate.now());
        movimentacao.setHoraMovimentacao(LocalTime.now());
        
        movimentacao.setEstoque(estoque);
        movimentacao.setUsuario(usuario);
        movimentacao.setSetorOrigem(setorOrigem);
        movimentacao.setSetorDestino(setorDestino);
        
        log.info("Registro de movimentação criado com data/hora atuais: {} {}", 
                movimentacao.getDataMovimentacao(), movimentacao.getHoraMovimentacao());
        
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
                // NOVA LÓGICA: Busca estoque específico do produto no setor de origem
                if (movimentacao.getSetorOrigem() != null && movimentacao.getSetorOrigem().getId() != null) {
                    List<Estoque> estoquesNoSetor = estoqueRepository.findByProdutoAndSetor(
                            idRecebido, movimentacao.getSetorOrigem().getId());
                    
                    if (!estoquesNoSetor.isEmpty()) {
                        estoque = Optional.of(estoquesNoSetor.get(0));
                        log.info("Usando estoque específico do setor: Estoque ID {} para Produto ID {} no Setor ID {}", 
                                estoque.get().getId(), idRecebido, movimentacao.getSetorOrigem().getId());
                    } else {
                        // Se o produto não tem estoque no setor de origem, isso é um erro
                        throw new IllegalArgumentException(String.format(
                                "Produto ID %d não possui estoque no setor de origem ID %d", 
                                idRecebido, movimentacao.getSetorOrigem().getId()));
                    }
                } else {
                    // Fallback para busca genérica (movimentação simples)
                    log.info("Produto encontrado, buscando estoques para produto ID: {}", idRecebido);
                    List<Estoque> estoquesDoProduto = estoqueRepository.findByIdProduto(idRecebido);
                    log.info("Encontrados {} estoques para o produto", estoquesDoProduto.size());
                    
                    if (!estoquesDoProduto.isEmpty()) {
                        estoque = Optional.of(estoquesDoProduto.get(0));
                        log.info("Usando estoque ID {} para produto ID {}", estoque.get().getId(), idRecebido);
                    } else {
                        throw new IllegalArgumentException("Produto não possui estoque cadastrado. Produto ID: " + idRecebido);
                    }
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
        
        // SOLUÇÃO PRÁTICA: Usar primeiro usuário disponível no banco para testes
        // Quando não há usuário informado, busca o primeiro usuário existente
        if (movimentacao.getUsuario() == null || movimentacao.getUsuario().getId() == null) {
            log.info("Usuário não informado, buscando primeiro usuário disponível no banco...");
            List<Usuario> usuarios = usuarioRepository.findAll();
            if (!usuarios.isEmpty()) {
                Usuario usuarioPadrao = usuarios.get(0);
                movimentacao.setUsuario(usuarioPadrao);
                log.info("Usando usuário padrão para testes: ID {} - Login: {}", 
                        usuarioPadrao.getId(), usuarioPadrao.getLogin());
            } else {
                log.error("Nenhum usuário encontrado no banco de dados!");
                throw new IllegalStateException("É necessário ter pelo menos um usuário cadastrado no banco");
            }
        } else {
            log.info("Validando usuário informado com ID: {}", movimentacao.getUsuario().getId());
            Optional<Usuario> usuario = usuarioRepository.findById(movimentacao.getUsuario().getId());
            if (usuario.isPresent()) {
                movimentacao.setUsuario(usuario.get());
                log.info("Usuário validado com sucesso: ID {}", usuario.get().getId());
            } else {
                log.warn("Usuário com ID {} não encontrado, buscando usuário padrão", movimentacao.getUsuario().getId());
                List<Usuario> usuarios = usuarioRepository.findAll();
                if (!usuarios.isEmpty()) {
                    Usuario usuarioPadrao = usuarios.get(0);
                    movimentacao.setUsuario(usuarioPadrao);
                    log.info("Usando usuário padrão: ID {} - Login: {}", 
                            usuarioPadrao.getId(), usuarioPadrao.getLogin());
                } else {
                    throw new IllegalStateException("Nenhum usuário encontrado no banco de dados!");
                }
            }
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
        if (movimentacao.getHoraMovimentacao() != null) {
            entity.setHoraMovimentacao(movimentacao.getHoraMovimentacao());
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
            // Usar data e hora atuais
            mov1.setDataMovimentacao(LocalDate.now());
            mov1.setHoraMovimentacao(LocalTime.now());
            
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
            // Usar data atual e hora atual (não ontem)
            mov2.setDataMovimentacao(LocalDate.now());
            mov2.setHoraMovimentacao(LocalTime.now().minusHours(1)); // 1 hora atrás para diferenciação
            
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
    
    /**
     * NOVO: Consulta produtos disponíveis em cada setor
     * Útil para entender a distribuição atual do estoque
     */
    public Map<String, Object> consultarProdutosPorSetor() {
        Map<String, Object> resultado = new HashMap<>();
        
        try {
            // Buscar todos os setores
            List<Setor> setores = setorRepository.findAll();
            
            Map<String, Object> setorInfo = new HashMap<>();
            
            for (Setor setor : setores) {
                Map<String, Object> infoSetor = new HashMap<>();
                
                // Buscar estoques neste setor
                List<Estoque> estoquesSetor = estoqueRepository.findBySetor(setor.getId());
                
                List<Map<String, Object>> produtosList = new ArrayList<>();
                int totalProdutos = 0;
                int quantidadeTotal = 0;
                
                for (Estoque estoque : estoquesSetor) {
                    Map<String, Object> produtoInfo = new HashMap<>();
                    produtoInfo.put("id", estoque.getProduto().getId());
                    produtoInfo.put("nome", estoque.getProduto().getNome());
                    produtoInfo.put("quantidade", estoque.getQuantidadeEstoque());
                    produtoInfo.put("estoqueId", estoque.getId());
                    
                    produtosList.add(produtoInfo);
                    totalProdutos++;
                    quantidadeTotal += estoque.getQuantidadeEstoque();
                }
                
                infoSetor.put("produtos", produtosList);
                infoSetor.put("totalProdutos", totalProdutos);
                infoSetor.put("quantidadeTotal", quantidadeTotal);
                
                setorInfo.put(setor.getNome(), infoSetor);
            }
            
            resultado.put("setores", setorInfo);
            resultado.put("totalSetores", setores.size());
            
            log.info("Consulta de produtos por setor realizada - {} setores encontrados", setores.size());
            
        } catch (Exception e) {
            log.error("Erro ao consultar produtos por setor: {}", e.getMessage(), e);
            throw e;
        }
        
        return resultado;
    }
}