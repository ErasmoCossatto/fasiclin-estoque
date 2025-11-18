package com.br.fasipe.estoque.service;

import com.br.fasipe.estoque.exception.EntidadeNaoEncontradaException;
import com.br.fasipe.estoque.exception.EstoqueInsuficienteException;
import com.br.fasipe.estoque.exception.OperacaoInvalidaException;
import com.br.fasipe.estoque.model.*;
import com.br.fasipe.estoque.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Serviço responsável pela lógica de movimentação de estoque entre almoxarifados.
 * Implementa a regra de negócio de transferência por lote com controle transacional.
 */
@Slf4j
@Service
public class MovimentacaoService {

    private final ItensAlmoxarifadosRepository itensAlmoxarifadosRepository;
    private final MovimentacaoAlmoxarifadoRepository movimentacaoRepository;
    private final ProdutoRepository produtoRepository;
    private final AlmoxarifadoRepository almoxarifadoRepository;
    private final LoteRepository loteRepository;

    public MovimentacaoService(
            ItensAlmoxarifadosRepository itensAlmoxarifadosRepository,
            MovimentacaoAlmoxarifadoRepository movimentacaoRepository,
            ProdutoRepository produtoRepository,
            AlmoxarifadoRepository almoxarifadoRepository,
            LoteRepository loteRepository) {
        this.itensAlmoxarifadosRepository = itensAlmoxarifadosRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.produtoRepository = produtoRepository;
        this.almoxarifadoRepository = almoxarifadoRepository;
        this.loteRepository = loteRepository;
    }

    /**
     * Transfere estoque de um produto entre almoxarifados e lotes.
     * 
     * @param idProduto ID do produto a ser movimentado
     * @param idAlmoxOrigem ID do almoxarifado de origem (null para entrada)
     * @param idAlmoxDestino ID do almoxarifado de destino
     * @param idLoteOrigem ID do lote de origem (null para entrada)
     * @param idLoteDestino ID do lote de destino
     * @param quantidade Quantidade a ser transferida
     * @param responsavel Nome do responsável pela movimentação
     * @param observacao Observações sobre a movimentação
     * @return MovimentacaoAlmoxarifado criada
     */
    @Transactional
    public MovimentacaoAlmoxarifado transferirEstoquePorLote(
            Integer idProduto,
            Integer idAlmoxOrigem,
            Integer idAlmoxDestino,
            Integer idLoteOrigem,
            Integer idLoteDestino,
            Integer quantidade,
            String responsavel,
            String observacao) {

        log.info("Iniciando transferência: Produto={}, AlmoxOrigem={}, AlmoxDestino={}, LoteOrigem={}, LoteDestino={}, Qtd={}",
                idProduto, idAlmoxOrigem, idAlmoxDestino, idLoteOrigem, idLoteDestino, quantidade);

        // 1. Validações básicas
        validarParametros(quantidade, responsavel);

        // 2. Buscar e validar entidades
        Produto produto = buscarProduto(idProduto);
        Almoxarifado almoxDestino = buscarAlmoxarifado(idAlmoxDestino);
        Lote loteDestino = buscarLote(idLoteDestino);

        Almoxarifado almoxOrigem = null;
        Lote loteOrigem = null;
        
        // Se tem origem, é transferência; se não, é entrada
        boolean isEntrada = (idAlmoxOrigem == null || idLoteOrigem == null);
        
        if (!isEntrada) {
            almoxOrigem = buscarAlmoxarifado(idAlmoxOrigem);
            loteOrigem = buscarLote(idLoteOrigem);
            validarAlmoxarifadoAtivo(almoxOrigem);
            
            // 3. Debitar da origem
            debitarEstoque(almoxOrigem, produto, loteOrigem, quantidade);
        }

        validarAlmoxarifadoAtivo(almoxDestino);

        // 4. Creditar no destino
        creditarEstoque(almoxDestino, produto, loteDestino, quantidade);

        // 5. Registrar histórico
        MovimentacaoAlmoxarifado movimentacao = registrarMovimentacao(
                almoxOrigem, almoxDestino, produto, loteOrigem, loteDestino,
                quantidade, responsavel, observacao);

        log.info("Transferência concluída com sucesso. ID Movimentação: {}", movimentacao.getId());
        return movimentacao;
    }

    /**
     * Registra entrada de estoque (sem origem).
     */
    @Transactional
    public MovimentacaoAlmoxarifado registrarEntrada(
            Integer idProduto,
            Integer idAlmoxDestino,
            Integer idLoteDestino,
            Integer quantidade,
            String responsavel,
            String observacao) {
        
        return transferirEstoquePorLote(
                idProduto, null, idAlmoxDestino, null, idLoteDestino,
                quantidade, responsavel, observacao);
    }

    /**
     * Consulta o histórico de movimentações.
     */
    public List<MovimentacaoAlmoxarifado> consultarHistorico(Integer almoxarifadoId) {
        if (almoxarifadoId != null) {
            return movimentacaoRepository.findByAlmoxarifadoOrigemOrDestino(almoxarifadoId);
        }
        return movimentacaoRepository.findAll();
    }

    /**
     * Consulta saldo de um produto em um almoxarifado.
     */
    public List<ItensAlmoxarifados> consultarSaldo(Integer almoxarifadoId, Integer produtoId) {
        if (almoxarifadoId != null && produtoId != null) {
            return itensAlmoxarifadosRepository.findByAlmoxarifadoId(almoxarifadoId).stream()
                    .filter(item -> item.getProduto().getId().equals(produtoId))
                    .toList();
        } else if (almoxarifadoId != null) {
            return itensAlmoxarifadosRepository.findByAlmoxarifadoId(almoxarifadoId);
        } else if (produtoId != null) {
            return itensAlmoxarifadosRepository.findByProdutoId(produtoId);
        }
        return itensAlmoxarifadosRepository.findAll();
    }

    /**
     * Verifica se há estoque disponível suficiente para uma movimentação.
     * Útil para validação no frontend antes de submeter.
     *
     * @param idAlmoxOrigem ID do almoxarifado de origem
     * @param idProduto ID do produto
     * @param idLote ID do lote
     * @param quantidade Quantidade desejada
     * @return true se há estoque disponível, false caso contrário
     */
    public boolean verificarDisponibilidade(
            Integer idAlmoxOrigem,
            Integer idProduto,
            Integer idLote,
            Integer quantidade) {
        
        if (idAlmoxOrigem == null || idProduto == null || idLote == null || quantidade == null) {
            return false;
        }

        Optional<ItensAlmoxarifados> itemOpt = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndProdutoIdAndLoteId(idAlmoxOrigem, idProduto, idLote);

        if (itemOpt.isEmpty()) {
            log.debug("Item não encontrado no estoque: Almox={}, Produto={}, Lote={}",
                    idAlmoxOrigem, idProduto, idLote);
            return false;
        }

        Integer disponivel = itemOpt.get().getQuantidade();
        boolean temEstoque = disponivel >= quantidade;
        
        log.debug("Verificação de disponibilidade: Disponível={}, Solicitado={}, Resultado={}",
                disponivel, quantidade, temEstoque);
        
        return temEstoque;
    }

    /**
     * Consulta a quantidade disponível de um produto específico em um almoxarifado e lote.
     *
     * @param idAlmoxarifado ID do almoxarifado
     * @param idProduto ID do produto
     * @param idLote ID do lote
     * @return Quantidade disponível ou 0 se não encontrado
     */
    public Integer consultarQuantidadeDisponivel(
            Integer idAlmoxarifado,
            Integer idProduto,
            Integer idLote) {
        
        if (idAlmoxarifado == null || idProduto == null || idLote == null) {
            return 0;
        }

        return itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndProdutoIdAndLoteId(idAlmoxarifado, idProduto, idLote)
                .map(ItensAlmoxarifados::getQuantidade)
                .orElse(0);
    }

    // Métodos auxiliares privados

    private void validarParametros(Integer quantidade, String responsavel) {
        if (quantidade == null || quantidade <= 0) {
            throw new OperacaoInvalidaException("Quantidade deve ser maior que zero");
        }
        if (responsavel == null || responsavel.trim().isEmpty()) {
            throw new OperacaoInvalidaException("Responsável é obrigatório");
        }
    }

    private Produto buscarProduto(Integer id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Produto", id));
    }

    private Almoxarifado buscarAlmoxarifado(Integer id) {
        return almoxarifadoRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Almoxarifado", id));
    }

    private Lote buscarLote(Integer id) {
        return loteRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Lote", id));
    }

    private void validarAlmoxarifadoAtivo(Almoxarifado almoxarifado) {
        if (!almoxarifado.getAtivo()) {
            throw new OperacaoInvalidaException(
                    "Almoxarifado '" + almoxarifado.getNomeAlmoxarifado() + "' está inativo");
        }
    }

    private void debitarEstoque(Almoxarifado almox, Produto produto, Lote lote, Integer quantidade) {
        Optional<ItensAlmoxarifados> itemOpt = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndProdutoIdAndLoteId(almox.getId(), produto.getId(), lote.getId());

        if (itemOpt.isEmpty()) {
            throw new EstoqueInsuficienteException(
                    String.format("Produto '%s' (Lote: %s) não encontrado no almoxarifado '%s'. " +
                            "Realize uma entrada de estoque antes de transferir.",
                            produto.getDescricao(), lote.getNomeLote(), almox.getNomeAlmoxarifado()));
        }

        ItensAlmoxarifados item = itemOpt.get();
        
        if (item.getQuantidade() < quantidade) {
            throw new EstoqueInsuficienteException(
                    String.format("Estoque insuficiente no almoxarifado '%s'. " +
                            "Produto: '%s', Lote: %s. Disponível: %d, Solicitado: %d",
                            almox.getNomeAlmoxarifado(), produto.getDescricao(),
                            lote.getNomeLote(), item.getQuantidade(), quantidade));
        }

        item.removerQuantidade(quantidade);
        itensAlmoxarifadosRepository.save(item);
        
        log.debug("Debitado {} unidades do estoque. Saldo atual: {}", quantidade, item.getQuantidade());
    }

    private void creditarEstoque(Almoxarifado almox, Produto produto, Lote lote, Integer quantidade) {
        Optional<ItensAlmoxarifados> itemOpt = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndProdutoIdAndLoteId(almox.getId(), produto.getId(), lote.getId());

        ItensAlmoxarifados item;
        
        if (itemOpt.isPresent()) {
            // UPDATE: Item já existe, apenas adiciona quantidade
            item = itemOpt.get();
            item.adicionarQuantidade(quantidade);
            log.debug("Atualizado saldo existente. Novo saldo: {}", item.getQuantidade());
        } else {
            // INSERT: Criar novo item de estoque
            item = new ItensAlmoxarifados();
            item.setAlmoxarifado(almox);
            item.setProduto(produto);
            item.setLote(lote);
            item.setQuantidade(quantidade);
            item.setEstoqueMinimo(produto.getEstoqueMinimo());
            item.setEstoqueMaximo(produto.getEstoqueMaximo());
            item.setAtivo(true);
            log.debug("Criado novo item de estoque com quantidade: {}", quantidade);
        }

        itensAlmoxarifadosRepository.save(item);
    }

    private MovimentacaoAlmoxarifado registrarMovimentacao(
            Almoxarifado almoxOrigem,
            Almoxarifado almoxDestino,
            Produto produto,
            Lote loteOrigem,
            Lote loteDestino,
            Integer quantidade,
            String responsavel,
            String observacao) {

        MovimentacaoAlmoxarifado movimentacao = new MovimentacaoAlmoxarifado();
        movimentacao.setAlmoxarifadoOrigem(almoxOrigem);
        movimentacao.setAlmoxarifadoDestino(almoxDestino);
        movimentacao.setProduto(produto);
        movimentacao.setLoteOrigem(loteOrigem);
        movimentacao.setLoteDestino(loteDestino);
        movimentacao.setQuantidade(quantidade);
        movimentacao.setDataMovimentacao(LocalDateTime.now());
        movimentacao.setResponsavel(responsavel);
        movimentacao.setObservacao(observacao);

        return movimentacaoRepository.save(movimentacao);
    }
}
