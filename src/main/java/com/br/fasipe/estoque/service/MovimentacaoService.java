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
    private final ItemRepository itemRepository;
    private final AlmoxarifadoRepository almoxarifadoRepository;
    private final LoteRepository loteRepository;

    public MovimentacaoService(
            ItensAlmoxarifadosRepository itensAlmoxarifadosRepository,
            MovimentacaoAlmoxarifadoRepository movimentacaoRepository,
            ItemRepository itemRepository,
            AlmoxarifadoRepository almoxarifadoRepository,
            LoteRepository loteRepository) {
        this.itensAlmoxarifadosRepository = itensAlmoxarifadosRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.itemRepository = itemRepository;
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
        Item produto = buscarItem(idProduto);
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
     * Registra saída de estoque (consumo/perda).
     */
    @Transactional
    public MovimentacaoAlmoxarifado registrarSaida(
            Integer idProduto,
            Integer idAlmoxOrigem,
            Integer idLoteOrigem,
            Integer quantidade,
            String responsavel,
            String observacao) {

        log.info("Iniciando saída: Produto={}, AlmoxOrigem={}, LoteOrigem={}, Qtd={}",
                idProduto, idAlmoxOrigem, idLoteOrigem, quantidade);

        validarParametros(quantidade, responsavel);

        Item produto = buscarItem(idProduto);
        Almoxarifado almoxOrigem = buscarAlmoxarifado(idAlmoxOrigem);
        Lote loteOrigem = buscarLote(idLoteOrigem);

        validarAlmoxarifadoAtivo(almoxOrigem);

        debitarEstoque(almoxOrigem, produto, loteOrigem, quantidade);

        MovimentacaoAlmoxarifado movimentacao = registrarMovimentacao(
                almoxOrigem, null, produto, loteOrigem, null,
                quantidade, responsavel, observacao);

        log.info("Saída concluída com sucesso. ID Movimentação: {}", movimentacao.getId());
        return movimentacao;
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
        List<ItensAlmoxarifados> rawList;
        
        if (almoxarifadoId != null && produtoId != null) {
            rawList = itensAlmoxarifadosRepository.findByAlmoxarifadoId(almoxarifadoId).stream()
                    .filter(item -> item.getItem().getId().equals(produtoId))
                    .toList();
        } else if (almoxarifadoId != null) {
            rawList = itensAlmoxarifadosRepository.findByAlmoxarifadoId(almoxarifadoId);
        } else if (produtoId != null) {
            rawList = itensAlmoxarifadosRepository.findByItemId(produtoId);
        } else {
            rawList = itensAlmoxarifadosRepository.findAll();
        }
        
        // Consolidar duplicatas para visualização
        java.util.Map<String, ItensAlmoxarifados> mergedMap = new java.util.HashMap<>();
        
        for (ItensAlmoxarifados item : rawList) {
            // Chave única: Almox + Item + Lote
            String key = item.getAlmoxarifado().getId() + "-" + item.getItem().getId() + "-" + item.getLote().getId();
            
            if (mergedMap.containsKey(key)) {
                ItensAlmoxarifados existing = mergedMap.get(key);
                // Somar quantidade (apenas em memória para exibição)
                existing.setQuantidade(existing.getQuantidade() + item.getQuantidade());
            } else {
                // Adicionar ao mapa (usando o próprio objeto, cuidado para não alterar o original se for persistido na mesma transação)
                // Como é leitura, não deve ter problema, mas ideal seria clonar.
                // Para simplificar, usamos o objeto original.
                mergedMap.put(key, item);
            }
        }
        
        return new java.util.ArrayList<>(mergedMap.values());
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

        List<ItensAlmoxarifados> itens = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndItemIdAndLoteId(idAlmoxOrigem, idProduto, idLote);

        if (itens.isEmpty()) {
            log.debug("Item não encontrado no estoque: Almox={}, Produto={}, Lote={}",
                    idAlmoxOrigem, idProduto, idLote);
            return false;
        }

        // Soma a quantidade de todos os registros encontrados (caso haja duplicatas)
        Integer disponivel = itens.stream().mapToInt(ItensAlmoxarifados::getQuantidade).sum();
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

        List<ItensAlmoxarifados> itens = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndItemIdAndLoteId(idAlmoxarifado, idProduto, idLote);
                
        return itens.stream().mapToInt(ItensAlmoxarifados::getQuantidade).sum();
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

    private Item buscarItem(Integer id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Item", id));
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

    private void debitarEstoque(Almoxarifado almox, Item produto, Lote lote, Integer quantidade) {
        List<ItensAlmoxarifados> itens = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndItemIdAndLoteId(almox.getId(), produto.getId(), lote.getId());

        if (itens.isEmpty()) {
            throw new EstoqueInsuficienteException(
                    String.format("Produto '%s' (Lote: %s) não encontrado no almoxarifado '%s'. " +
                            "Realize uma entrada de estoque antes de transferir.",
                            produto.getDescricao(), lote.getNomeLote(), almox.getNomeAlmoxarifado()));
        }

        ItensAlmoxarifados itemPrincipal = itens.get(0);

        // Se houver duplicatas, consolidar
        if (itens.size() > 1) {
            log.warn("Detectada duplicidade de estoque para Almox={}, Produto={}, Lote={}. Consolidando...", 
                    almox.getId(), produto.getId(), lote.getId());
            
            int totalQuantidade = 0;
            for (ItensAlmoxarifados item : itens) {
                totalQuantidade += item.getQuantidade();
            }
            
            // Mantém o primeiro e remove os outros
            itemPrincipal.setQuantidade(totalQuantidade);
            
            for (int i = 1; i < itens.size(); i++) {
                itensAlmoxarifadosRepository.delete(itens.get(i));
            }
            
            log.info("Estoque consolidado. Nova quantidade total: {}", totalQuantidade);
        }
        
        if (itemPrincipal.getQuantidade() < quantidade) {
            throw new EstoqueInsuficienteException(
                    String.format("Estoque insuficiente no almoxarifado '%s'. " +
                            "Produto: '%s', Lote: %s. Disponível: %d, Solicitado: %d",
                            almox.getNomeAlmoxarifado(), produto.getDescricao(),
                            lote.getNomeLote(), itemPrincipal.getQuantidade(), quantidade));
        }

        itemPrincipal.removerQuantidade(quantidade);
        itensAlmoxarifadosRepository.save(itemPrincipal);
        
        log.debug("Debitado {} unidades do estoque. Saldo atual: {}", quantidade, itemPrincipal.getQuantidade());
    }

    private void creditarEstoque(Almoxarifado almox, Item produto, Lote lote, Integer quantidade) {
        List<ItensAlmoxarifados> itens = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndItemIdAndLoteId(almox.getId(), produto.getId(), lote.getId());

        ItensAlmoxarifados item;
        
        if (!itens.isEmpty()) {
            // UPDATE: Item já existe
            item = itens.get(0);
            
            // Se houver duplicatas, consolidar antes de creditar
            if (itens.size() > 1) {
                log.warn("Detectada duplicidade de estoque (crédito) para Almox={}, Produto={}, Lote={}. Consolidando...", 
                        almox.getId(), produto.getId(), lote.getId());
                
                int totalQuantidade = 0;
                for (ItensAlmoxarifados i : itens) {
                    totalQuantidade += i.getQuantidade();
                }
                
                item.setQuantidade(totalQuantidade);
                
                for (int i = 1; i < itens.size(); i++) {
                    itensAlmoxarifadosRepository.delete(itens.get(i));
                }
            }
            
            item.adicionarQuantidade(quantidade);
            log.debug("Atualizado saldo existente. Novo saldo: {}", item.getQuantidade());
        } else {
            // INSERT: Criar novo item de estoque
            item = new ItensAlmoxarifados();
            item.setAlmoxarifado(almox);
            item.setItem(lote.getItem());
            item.setLote(lote);
            item.setQuantidade(quantidade);
            item.setEstoqueMinimo(10);
            item.setEstoqueMaximo(100);
            item.setAtivo(true);
            log.debug("Criado novo item de estoque com quantidade: {}", quantidade);
        }

        itensAlmoxarifadosRepository.save(item);
    }

    private MovimentacaoAlmoxarifado registrarMovimentacao(
            Almoxarifado almoxOrigem,
            Almoxarifado almoxDestino,
            Item produto,
            Lote loteOrigem,
            Lote loteDestino,
            Integer quantidade,
            String responsavel,
            String observacao) {

        MovimentacaoAlmoxarifado movimentacao = new MovimentacaoAlmoxarifado();
        movimentacao.setAlmoxarifadoOrigem(almoxOrigem);
        movimentacao.setAlmoxarifadoDestino(almoxDestino);
        movimentacao.setItem(produto);
        movimentacao.setLoteOrigem(loteOrigem);
        movimentacao.setLoteDestino(loteDestino);
        movimentacao.setQuantidade(quantidade);
        movimentacao.setDataMovimentacao(LocalDateTime.now());
        movimentacao.setResponsavel(responsavel);
        movimentacao.setObservacao(observacao);

        return movimentacaoRepository.save(movimentacao);
    }
}
