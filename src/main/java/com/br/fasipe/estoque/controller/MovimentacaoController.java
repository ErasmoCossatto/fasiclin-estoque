package com.br.fasipe.estoque.controller;

import com.br.fasipe.estoque.dto.LoteComEstoqueDTO;
import com.br.fasipe.estoque.dto.TransferenciaLoteDTO;
import com.br.fasipe.estoque.model.MovimentacaoAlmoxarifado;
import com.br.fasipe.estoque.service.MovimentacaoService;
import com.br.fasipe.estoque.service.TransferenciaLoteService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para operações de movimentação de estoque entre almoxarifados.
 */
@RestController
@RequestMapping("/api/movimentacao")
public class MovimentacaoController {

    private final MovimentacaoService movimentacaoService;
    private final TransferenciaLoteService transferenciaLoteService;

    public MovimentacaoController(
            MovimentacaoService movimentacaoService,
            TransferenciaLoteService transferenciaLoteService) {
        this.movimentacaoService = movimentacaoService;
        this.transferenciaLoteService = transferenciaLoteService;
    }

    /**
     * Transfere estoque entre almoxarifados e lotes.
     */
    @PostMapping("/transferir")
    public ResponseEntity<MovimentacaoAlmoxarifado> transferir(@RequestBody TransferenciaRequest request) {
        MovimentacaoAlmoxarifado movimentacao = movimentacaoService.transferirEstoquePorLote(
                request.getIdProduto(),
                request.getIdAlmoxOrigem(),
                request.getIdAlmoxDestino(),
                request.getIdLoteOrigem(),
                request.getIdLoteDestino(),
                request.getQuantidade(),
                request.getResponsavel(),
                request.getObservacao()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }

    /**
     * Registra entrada de estoque (sem origem).
     */
    @PostMapping("/entrada")
    public ResponseEntity<MovimentacaoAlmoxarifado> registrarEntrada(@RequestBody EntradaRequest request) {
        MovimentacaoAlmoxarifado movimentacao = movimentacaoService.registrarEntrada(
                request.getIdProduto(),
                request.getIdAlmoxDestino(),
                request.getIdLoteDestino(),
                request.getQuantidade(),
                request.getResponsavel(),
                request.getObservacao()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }

    /**
     * Registra saída de estoque (consumo/perda).
     */
    @PostMapping("/saida")
    public ResponseEntity<MovimentacaoAlmoxarifado> registrarSaida(@RequestBody SaidaRequest request) {
        MovimentacaoAlmoxarifado movimentacao = movimentacaoService.registrarSaida(
                request.getIdProduto(),
                request.getIdAlmoxOrigem(),
                request.getIdLoteOrigem(),
                request.getQuantidade(),
                request.getResponsavel(),
                request.getObservacao()
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }

    /**
     * Consulta histórico de movimentações.
     */
    @GetMapping("/historico")
    public ResponseEntity<List<MovimentacaoAlmoxarifado>> consultarHistorico(
            @RequestParam(required = false) Integer almoxarifadoId) {
        List<MovimentacaoAlmoxarifado> historico = movimentacaoService.consultarHistorico(almoxarifadoId);
        return ResponseEntity.ok(historico);
    }

    /**
     * Lista lotes disponíveis para transferência em um almoxarifado.
     */
    @GetMapping("/lotes-disponiveis")
    public ResponseEntity<List<LoteComEstoqueDTO>> listarLotesDisponiveis(
            @RequestParam(required = false) Integer almoxarifadoId) {
        List<LoteComEstoqueDTO> lotes = transferenciaLoteService.listarLotesDisponiveis(almoxarifadoId);
        return ResponseEntity.ok(lotes);
    }

    /**
     * Transfere lote entre almoxarifados (com split automático em transferências parciais).
     */
    @PostMapping("/transferir-lote")
    public ResponseEntity<MovimentacaoAlmoxarifado> transferirLote(@RequestBody TransferenciaLoteDTO request) {
        MovimentacaoAlmoxarifado movimentacao = transferenciaLoteService.transferirLote(
                request.getIdLoteOrigem(),
                request.getIdAlmoxOrigem(),
                request.getIdAlmoxDestino(),
                request.getQuantidade(),
                request.getResponsavel(),
                request.getObservacao()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }

    /**
     * Consulta quantidade disponível de um lote em um almoxarifado.
     */
    @GetMapping("/quantidade-disponivel")
    public ResponseEntity<Integer> consultarQuantidadeDisponivel(
            @RequestParam Integer almoxarifadoId,
            @RequestParam Integer loteId) {
        Integer quantidade = transferenciaLoteService.consultarQuantidadeDisponivel(almoxarifadoId, loteId);
        return ResponseEntity.ok(quantidade);
    }

    /**
     * Exclui uma movimentação do histórico.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirMovimentacao(@PathVariable Integer id) {
        movimentacaoService.excluirMovimentacao(id);
        return ResponseEntity.noContent().build();
    }

    // DTOs

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferenciaRequest {
        private Integer idProduto;
        private Integer idAlmoxOrigem;
        private Integer idAlmoxDestino;
        private Integer idLoteOrigem;
        private Integer idLoteDestino;
        private Integer quantidade;
        private String responsavel;
        private String observacao;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntradaRequest {
        private Integer idProduto;
        private Integer idAlmoxDestino;
        private Integer idLoteDestino;
        private Integer quantidade;
        private String responsavel;
        private String observacao;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaidaRequest {
        private Integer idProduto;
        private Integer idAlmoxOrigem;
        private Integer idLoteOrigem;
        private Integer quantidade;
        private String responsavel;
        private String observacao;
    }
}
