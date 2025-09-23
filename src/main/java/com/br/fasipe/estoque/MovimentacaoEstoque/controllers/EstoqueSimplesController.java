package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller simplificado para dados básicos
 * Usado temporariamente para resolver problemas de dependências
 */
@Slf4j
@RestController
@RequestMapping("/api/estoque-simples")
@CrossOrigin(origins = "*")
public class EstoqueSimplesController {

    /**
     * Lista estoques mockados para desenvolvimento
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listarEstoquesMockados() {
        log.info("Listando estoques mockados");
        try {
            List<Map<String, Object>> estoques = new ArrayList<>();
            
            // Criar estoques mockados simples
            Map<String, Object> estoque1 = new HashMap<>();
            estoque1.put("id", 1);
            estoque1.put("quantidadeEstoque", 100);
            
            Map<String, Object> produto1 = new HashMap<>();
            produto1.put("id", 1);
            produto1.put("nome", "Produto Teste 1");
            produto1.put("descricao", "Descrição do produto teste 1");
            estoque1.put("produto", produto1);
            
            Map<String, Object> lote1 = new HashMap<>();
            lote1.put("id", 1);
            lote1.put("numero", "LOTE001");
            estoque1.put("lote", lote1);
            
            estoques.add(estoque1);

            Map<String, Object> estoque2 = new HashMap<>();
            estoque2.put("id", 2);
            estoque2.put("quantidadeEstoque", 50);
            
            Map<String, Object> produto2 = new HashMap<>();
            produto2.put("id", 2);
            produto2.put("nome", "Produto Teste 2");
            produto2.put("descricao", "Descrição do produto teste 2");
            estoque2.put("produto", produto2);
            
            Map<String, Object> lote2 = new HashMap<>();
            lote2.put("id", 2);
            lote2.put("numero", "LOTE002");
            estoque2.put("lote", lote2);
            
            estoques.add(estoque2);

            Map<String, Object> estoque3 = new HashMap<>();
            estoque3.put("id", 3);
            estoque3.put("quantidadeEstoque", 75);
            
            Map<String, Object> produto3 = new HashMap<>();
            produto3.put("id", 3);
            produto3.put("nome", "Produto Teste 3");
            produto3.put("descricao", "Descrição do produto teste 3");
            estoque3.put("produto", produto3);
            
            Map<String, Object> lote3 = new HashMap<>();
            lote3.put("id", 3);
            lote3.put("numero", "LOTE003");
            estoque3.put("lote", lote3);
            
            estoques.add(estoque3);

            // Criar resposta no formato de página
            Map<String, Object> response = new HashMap<>();
            response.put("content", estoques);
            response.put("totalElements", estoques.size());
            response.put("totalPages", 1);
            response.put("number", 0);
            response.put("size", estoques.size());
            response.put("numberOfElements", estoques.size());
            response.put("first", true);
            response.put("last", true);
            response.put("empty", false);

            log.info("Retornando {} estoques mockados", estoques.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erro ao listar estoques mockados: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Busca estoque mockado por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> buscarEstoqueMockadoPorId(@PathVariable Integer id) {
        log.info("Buscando estoque mockado por ID: {}", id);
        try {
            if (id >= 1 && id <= 3) {
                Map<String, Object> estoque = new HashMap<>();
                estoque.put("id", id);
                estoque.put("quantidadeEstoque", id * 25);
                
                Map<String, Object> produto = new HashMap<>();
                produto.put("id", id);
                produto.put("nome", "Produto Teste " + id);
                produto.put("descricao", "Descrição do produto teste " + id);
                estoque.put("produto", produto);
                
                Map<String, Object> lote = new HashMap<>();
                lote.put("id", id);
                lote.put("numero", "LOTE00" + id);
                estoque.put("lote", lote);
                
                return ResponseEntity.ok(estoque);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Erro ao buscar estoque mockado ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
}