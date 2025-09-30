package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.*;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.*;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Controller temporário para diagnóstico
 * REMOVER EM PRODUÇÃO
 */
@Slf4j
@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
public class DebugController {

    @Autowired
    private EstoqueRepository estoqueRepository;
    
    @Autowired
    private SetorRepository setorRepository;
    
    @Autowired
    private ProdutoRepository produtoRepository;

    /**
     * Verifica se existe estoque com ID específico
     */
    @GetMapping("/estoque/{id}")
    public ResponseEntity<Map<String, Object>> verificarEstoque(@PathVariable Integer id) {
        log.info("DEBUG: Verificando estoque ID: {}", id);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            var estoque = estoqueRepository.findById(id);
            
            if (estoque.isPresent()) {
                response.put("encontrado", true);
                response.put("estoque", estoque.get());
                log.info("DEBUG: Estoque ID {} encontrado", id);
            } else {
                response.put("encontrado", false);
                response.put("mensagem", "Estoque não encontrado");
                
                // Verificar se é um produto
                var produto = produtoRepository.findById(id);
                if (produto.isPresent()) {
                    response.put("ehProduto", true);
                    response.put("produto", produto.get());
                    
                    // Buscar estoques deste produto
                    List<Estoque> estoquesDoProduto = estoqueRepository.findByIdProduto(id);
                    response.put("estoquesEncontrados", estoquesDoProduto.size());
                    response.put("estoquesDetalhes", estoquesDoProduto);
                } else {
                    response.put("ehProduto", false);
                }
                
                log.warn("DEBUG: Estoque ID {} NÃO encontrado", id);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("DEBUG: Erro ao verificar estoque ID {}: {}", id, e.getMessage(), e);
            
            response.put("erro", "Erro ao verificar estoque");
            response.put("mensagem", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Verifica se existe setor com ID específico
     */
    @GetMapping("/setor/{id}")
    public ResponseEntity<Map<String, Object>> verificarSetor(@PathVariable Integer id) {
        log.info("DEBUG: Verificando setor ID: {}", id);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            var setor = setorRepository.findById(id);
            
            if (setor.isPresent()) {
                response.put("encontrado", true);
                response.put("setor", setor.get());
                log.info("DEBUG: Setor ID {} encontrado: {}", id, setor.get().getNome());
            } else {
                response.put("encontrado", false);
                response.put("mensagem", "Setor não encontrado");
                log.warn("DEBUG: Setor ID {} NÃO encontrado", id);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("DEBUG: Erro ao verificar setor ID {}: {}", id, e.getMessage(), e);
            
            response.put("erro", "Erro ao verificar setor");
            response.put("mensagem", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lista todos os dados para verificação geral
     */
    @GetMapping("/todos-dados")
    public ResponseEntity<Map<String, Object>> listarTodosDados() {
        log.info("DEBUG: Listando todos os dados");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Estoque> estoques = estoqueRepository.findAll();
            List<Setor> setores = setorRepository.findAll();
            List<Produto> produtos = produtoRepository.findAll();
            
            response.put("estoques", estoques);
            response.put("setores", setores);
            response.put("produtos", produtos);
            response.put("totalEstoques", estoques.size());
            response.put("totalSetores", setores.size());
            response.put("totalProdutos", produtos.size());
            
            log.info("DEBUG: Encontrados {} estoques, {} setores, {} produtos", 
                    estoques.size(), setores.size(), produtos.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("DEBUG: Erro ao listar todos os dados: {}", e.getMessage(), e);
            
            response.put("erro", "Erro ao listar dados");
            response.put("mensagem", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}