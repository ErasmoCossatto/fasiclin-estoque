package com.br.fasipe.estoque.service;

import com.br.fasipe.estoque.dto.LoteComEstoqueDTO;
import com.br.fasipe.estoque.exception.EntidadeNaoEncontradaException;
import com.br.fasipe.estoque.exception.EstoqueInsuficienteException;
import com.br.fasipe.estoque.exception.OperacaoInvalidaException;
import com.br.fasipe.estoque.model.*;
import com.br.fasipe.estoque.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Serviço para gerenciamento de transferências de lotes entre almoxarifados.
 * Implementa lógica de split de lote para transferências parciais.
 */
@Slf4j
@Service
public class TransferenciaLoteService {

    private final LoteRepository loteRepository;
    private final ItensAlmoxarifadosRepository itensAlmoxarifadosRepository;
    private final AlmoxarifadoRepository almoxarifadoRepository;
    private final MovimentacaoAlmoxarifadoRepository movimentacaoRepository;

    public TransferenciaLoteService(
            LoteRepository loteRepository,
            ItensAlmoxarifadosRepository itensAlmoxarifadosRepository,
            AlmoxarifadoRepository almoxarifadoRepository,
            MovimentacaoAlmoxarifadoRepository movimentacaoRepository) {
        this.loteRepository = loteRepository;
        this.itensAlmoxarifadosRepository = itensAlmoxarifadosRepository;
        this.almoxarifadoRepository = almoxarifadoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
    }

    /**
     * Lista todos os lotes disponíveis em um almoxarifado com informações de estoque.
     */
    public List<LoteComEstoqueDTO> listarLotesDisponiveis(Integer idAlmoxarifado) {
        List<ItensAlmoxarifados> itens;
        
        if (idAlmoxarifado != null) {
            itens = itensAlmoxarifadosRepository.findByAlmoxarifadoId(idAlmoxarifado);
        } else {
            itens = itensAlmoxarifadosRepository.findAll();
        }

        List<LoteComEstoqueDTO> resultado = new ArrayList<>();
        
        for (ItensAlmoxarifados item : itens) {
            if (item.getQuantidade() > 0 && item.getAtivo()) {
                Lote lote = item.getLote();
                Item produto = item.getItem();
                Almoxarifado almox = item.getAlmoxarifado();
                
                LoteComEstoqueDTO dto = new LoteComEstoqueDTO();
                dto.setIdLote(lote.getId());
                dto.setNomeLote(lote.getNomeLote());
                dto.setIdProduto(produto.getId());
                dto.setNomeProduto(produto.getNomeItem());
                dto.setDataValidade(lote.getDataValidade());
                dto.setQuantidadeDisponivel(item.getQuantidade());
                dto.setIdAlmoxarifado(almox.getId());
                dto.setNomeAlmoxarifado(almox.getNomeAlmoxarifado());
                dto.setVencido(lote.isVencido());
                dto.setProximoVencimento(lote.isProximoVencimento());
                
                resultado.add(dto);
            }
        }
        
        return resultado;
    }

    /**
     * Transfere quantidade de um lote entre almoxarifados.
     * - Transferência TOTAL: move o lote inteiro
     * - Transferência PARCIAL: faz split do lote (cria novo lote no destino)
     */
    @Transactional
    public MovimentacaoAlmoxarifado transferirLote(
            Integer idLoteOrigem,
            Integer idAlmoxOrigem,
            Integer idAlmoxDestino,
            Integer quantidade,
            String responsavel,
            String observacao) {

        log.info("Iniciando transferência de lote: Lote={}, AlmoxOrigem={}, AlmoxDestino={}, Qtd={}",
                idLoteOrigem, idAlmoxOrigem, idAlmoxDestino, quantidade);

        // 1. Validações
        validarParametros(quantidade, responsavel);
        
        if (idAlmoxOrigem.equals(idAlmoxDestino)) {
            throw new OperacaoInvalidaException("Almoxarifado de origem e destino não podem ser iguais");
        }

        // 2. Buscar entidades
        Lote loteOrigem = buscarLote(idLoteOrigem);
        Almoxarifado almoxOrigem = buscarAlmoxarifado(idAlmoxOrigem);
        Almoxarifado almoxDestino = buscarAlmoxarifado(idAlmoxDestino);
        Item produto = loteOrigem.getItem();

        validarAlmoxarifadoAtivo(almoxOrigem);
        validarAlmoxarifadoAtivo(almoxDestino);

        // 3. Buscar item de estoque na origem
        ItensAlmoxarifados itemOrigem = buscarItemEstoque(almoxOrigem, produto, loteOrigem);
        
        // 4. Validar quantidade disponível
        if (itemOrigem.getQuantidade() < quantidade) {
            throw new EstoqueInsuficienteException(
                    String.format("Estoque insuficiente. Disponível: %d, Solicitado: %d",
                            itemOrigem.getQuantidade(), quantidade));
        }

        // 5. Determinar se é transferência total ou parcial
        boolean isTransferenciaTotal = itemOrigem.getQuantidade().equals(quantidade);
        Lote loteDestino;

        if (isTransferenciaTotal) {
            // Transferência TOTAL: usa o mesmo lote
            log.debug("Transferência TOTAL detectada");
            loteDestino = loteOrigem;
            
            // Remove da origem
            itemOrigem.removerQuantidade(quantidade);
            if (itemOrigem.getQuantidade() == 0) {
                itensAlmoxarifadosRepository.delete(itemOrigem);
            } else {
                itensAlmoxarifadosRepository.save(itemOrigem);
            }
            
        } else {
            // Transferência PARCIAL: cria novo lote (split)
            log.debug("Transferência PARCIAL detectada - fazendo split de lote");
            loteDestino = loteOrigem.criarLoteDerivado(quantidade);
            loteDestino = loteRepository.save(loteDestino);
            
            // Reduz quantidade na origem
            itemOrigem.removerQuantidade(quantidade);
            itensAlmoxarifadosRepository.save(itemOrigem);
        }

        // 6. Creditar no destino
        creditarEstoque(almoxDestino, produto, loteDestino, quantidade);

        // 7. Registrar movimentação
        MovimentacaoAlmoxarifado movimentacao = registrarMovimentacao(
                almoxOrigem, almoxDestino, produto, loteOrigem, loteDestino,
                quantidade, responsavel, observacao);

        log.info("Transferência concluída. Movimentação ID: {}, Lote Destino: {}",
                movimentacao.getId(), loteDestino.getId());

        return movimentacao;
    }

    /**
     * Consulta quantidade disponível de um lote específico em um almoxarifado.
     */
    public Integer consultarQuantidadeDisponivel(Integer idAlmoxarifado, Integer idLote) {
        Lote lote = buscarLote(idLote);
        
        List<ItensAlmoxarifados> itens = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndItemIdAndLoteId(
                        idAlmoxarifado, lote.getItem().getId(), idLote);
                        
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

    private Lote buscarLote(Integer id) {
        return loteRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Lote", id));
    }

    private Almoxarifado buscarAlmoxarifado(Integer id) {
        return almoxarifadoRepository.findById(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Almoxarifado", id));
    }

    private void validarAlmoxarifadoAtivo(Almoxarifado almoxarifado) {
        if (!almoxarifado.getAtivo()) {
            throw new OperacaoInvalidaException(
                    "Almoxarifado '" + almoxarifado.getNomeAlmoxarifado() + "' está inativo");
        }
    }

    private ItensAlmoxarifados buscarItemEstoque(Almoxarifado almox, Item produto, Lote lote) {
        List<ItensAlmoxarifados> itens = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndItemIdAndLoteId(almox.getId(), produto.getId(), lote.getId());
                
        if (itens.isEmpty()) {
            throw new EntidadeNaoEncontradaException(
                    String.format("Item de estoque não encontrado (Almox: %s, Produto: %s, Lote: %s)",
                            almox.getNomeAlmoxarifado(), produto.getNomeItem(), lote.getNomeLote()));
        }
        
        return itens.get(0);
    }

    private void creditarEstoque(Almoxarifado almox, Item produto, Lote lote, Integer quantidade) {
        List<ItensAlmoxarifados> itens = itensAlmoxarifadosRepository
                .findByAlmoxarifadoIdAndItemIdAndLoteId(almox.getId(), produto.getId(), lote.getId());

        ItensAlmoxarifados item;

        if (!itens.isEmpty()) {
            // UPDATE: Item já existe
            item = itens.get(0);
            item.adicionarQuantidade(quantidade);
            log.debug("Atualizado saldo existente. Novo saldo: {}", item.getQuantidade());
        } else {
            // INSERT: Criar novo item
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
