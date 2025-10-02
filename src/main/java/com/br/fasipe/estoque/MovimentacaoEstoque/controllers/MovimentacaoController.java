package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao.TipoMovimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.MovimentacaoService;
import com.br.fasipe.estoque.MovimentacaoEstoque.dto.MovimentacaoEntreSetoresDTO;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import jakarta.validation.Valid;

/**
 * Controller para gerenciamento de movimentações de estoque
 * Endpoints para controle de entrada e saída de produtos
 */
@Slf4j
@RestController
@RequestMapping("/api/movimentacoes")
@CrossOrigin(origins = "*")
public class MovimentacaoController {

    @Autowired
    private MovimentacaoService movimentacaoService;

    /**
     * Lista todas as movimentações
     * Endpoint principal para visualização do histórico de movimentações
     */
    @GetMapping
    public ResponseEntity<List<Movimentacao>> listarMovimentacoes() {
        log.info("Listando todas as movimentações");
        try {
            List<Movimentacao> movimentacoes = movimentacaoService.findAll();
            log.info("Encontradas {} movimentações", movimentacoes.size());
            
            // Log detalhado das primeiras movimentações para debug
            if (movimentacoes.size() > 0) {
                for (int i = 0; i < Math.min(3, movimentacoes.size()); i++) {
                    Movimentacao mov = movimentacoes.get(i);
                    log.info("Movimentação {}: ID={}, Tipo={}, Quantidade={}, Data={}, Hora={}", 
                            i + 1, mov.getId(), mov.getTipoMovimentacao(), mov.getQuantidade(),
                            mov.getDataMovimentacao(), mov.getHoraMovimentacao());
                }
            } else {
                log.warn("Nenhuma movimentação encontrada no banco de dados!");
            }

            return ResponseEntity.ok(movimentacoes);
        } catch (Exception e) {
            log.error("Erro ao listar movimentações: {}", e.getMessage(), e);
            // Retornar lista vazia em vez de erro 500
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Busca movimentação por ID
     * Endpoint para detalhamento de movimentação específica
     */
    @GetMapping("/{id}")
    public ResponseEntity<Movimentacao> buscarMovimentacaoPorId(@PathVariable Integer id) {
        log.info("Buscando movimentação por ID: {}", id);
        Movimentacao movimentacao = movimentacaoService.findById(id);
        return ResponseEntity.ok(movimentacao);
    }

    /**
     * Criar nova movimentação de estoque
     * Endpoint para registrar entradas e saídas de produtos
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> criarMovimentacao(@RequestBody Movimentacao movimentacao) {
        log.info("Recebendo solicitação de movimentação: {}", movimentacao);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Inserir movimentação
            Movimentacao movimentacaoSalva = movimentacaoService.insert(movimentacao);
            log.info("Movimentação criada com sucesso, ID: {}", movimentacaoSalva.getId());
            
            // Verificar se a movimentação foi realmente salva
            if (movimentacaoSalva != null && movimentacaoSalva.getId() != null) {
                log.info("Confirmado: Movimentação salva no banco - ID={}, Tipo={}, Quantidade={}", 
                        movimentacaoSalva.getId(), 
                        movimentacaoSalva.getTipoMovimentacao(),
                        movimentacaoSalva.getQuantidade());
            } else {
                log.error("ALERTA: Movimentação não foi salva corretamente!");
            }
            
            response.put("success", true);
            response.put("message", "Movimentação criada com sucesso");
            response.put("id", movimentacaoSalva.getId());
            response.put("movimentacao", movimentacaoSalva);
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.warn("Erro de negócio: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            log.error("Erro ao criar movimentação: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Erro interno do servidor: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Movimenta produto entre setores
     * Endpoint principal para transferência de produtos entre setores/almoxarifados
     */
    @PostMapping("/entre-setores")
    public ResponseEntity<?> movimentarEntreSetores(@Valid @RequestBody MovimentacaoEntreSetoresDTO dto) {
        log.info("Recebendo solicitação de movimentação entre setores: {}", dto);
        
        try {
            Movimentacao movimentacao = movimentacaoService.movimentarProdutoEntreSetores(dto);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
        } catch (IllegalArgumentException e) {
            log.warn("Erro de validação na movimentação entre setores: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "erro", "Dados inválidos",
                "mensagem", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            log.warn("Erro de estado na movimentação entre setores: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "erro", "Estado inválido",
                "mensagem", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erro interno na movimentação entre setores: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "erro", "Erro interno do servidor",
                "mensagem", "Falha ao processar movimentação"
            ));
        }
    }

    /**
     * Atualiza uma movimentação existente
     * Endpoint para correção de registros de movimentação
     */
    @PutMapping("/{id}")
    public ResponseEntity<Movimentacao> atualizarMovimentacao(
            @PathVariable Integer id,
            @RequestBody Movimentacao movimentacao) {
        log.info("Atualizando movimentação ID: {}", id);
        Movimentacao movimentacaoAtualizada = movimentacaoService.update(id, movimentacao);
        return ResponseEntity.ok(movimentacaoAtualizada);
    }

    /**
     * Remove uma movimentação
     * Endpoint para exclusão de registros de movimentação (usar com cautela)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerMovimentacao(@PathVariable Integer id) {
        log.info("Removendo movimentação ID: {}", id);
        movimentacaoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Busca movimentações por quantidade
     * Endpoint para filtrar movimentações por quantidade específica
     */
    @GetMapping("/quantidade/{quantidade}")
    public ResponseEntity<List<Movimentacao>> buscarPorQuantidade(@PathVariable Integer quantidade) {
        log.info("Buscando movimentações com quantidade: {}", quantidade);
        List<Movimentacao> movimentacoes = movimentacaoService.findByQuantidade(quantidade);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Busca movimentações por intervalo de quantidade
     * Endpoint para filtrar movimentações por faixa de quantidade
     */
    @GetMapping("/quantidade/entre")
    public ResponseEntity<List<Movimentacao>> buscarPorIntervaloQuantidade(
            @RequestParam Integer quantidadeMinima,
            @RequestParam Integer quantidadeMaxima) {
        log.info("Buscando movimentações com quantidade entre {} e {}", quantidadeMinima, quantidadeMaxima);
        List<Movimentacao> movimentacoes = movimentacaoService.findByQuantidadeBetween(quantidadeMinima, quantidadeMaxima);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Busca movimentações por data
     * Endpoint para filtrar movimentações por data específica
     */
    @GetMapping("/data/{data}")
    public ResponseEntity<List<Movimentacao>> buscarPorData(
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate data) {
        log.info("Buscando movimentações na data: {}", data);
        List<Movimentacao> movimentacoes = movimentacaoService.findByDataMovimentacao(data);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Busca movimentações por intervalo de data
     * Endpoint para filtrar movimentações por período
     */
    @GetMapping("/data/entre")
    public ResponseEntity<List<Movimentacao>> buscarPorIntervaloData(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dataInicial,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dataFinal) {
        log.info("Buscando movimentações entre {} e {}", dataInicial, dataFinal);
        List<Movimentacao> movimentacoes = movimentacaoService.findByDataMovimentacaoBetween(dataInicial, dataFinal);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Busca movimentações por tipo
     * Endpoint para filtrar movimentações por tipo (entrada/saída)
     */
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<Movimentacao>> buscarPorTipo(@PathVariable TipoMovimentacao tipo) {
        log.info("Buscando movimentações do tipo: {}", tipo);
        List<Movimentacao> movimentacoes = movimentacaoService.findByTipoMovimentacao(tipo);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Endpoint para criar dados de teste (temporário para desenvolvimento)
     */
    @PostMapping("/test-data")
    public ResponseEntity<String> criarDadosTeste() {
        log.info("Criando dados de teste");
        try {
            movimentacaoService.criarDadosTeste();
            return ResponseEntity.ok("Dados de teste criados com sucesso!");
        } catch (Exception e) {
            log.error("Erro ao criar dados de teste: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erro ao criar dados de teste: " + e.getMessage());
        }
    }
}
