package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.br.fasipe.estoque.MovimentacaoEstoque.repository.MovimentacaoRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/test")
public class TestController {

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

    @Autowired
    private EntityManager entityManager;

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> testCount() {
        try {
            long count = movimentacaoRepository.count();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", count);
            response.put("message", "Contagem realizada com sucesso");
            
            System.out.println("TestController - Count: " + count);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            System.err.println("TestController - Erro: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/basic")
    public ResponseEntity<Map<String, Object>> testBasic() {
        try {
            // Query simples apenas com IDs e dados básicos
            Query query = entityManager.createNativeQuery(
                "SELECT IDMOVIMENTACAO, TIPOMOVIM, QTDMOVIM, DATAMOVIM " +
                "FROM MOVIMENTACAO " +
                "ORDER BY DATAMOVIM DESC " +
                "LIMIT 10"
            );
            
            List<Object[]> results = query.getResultList();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", results.size());
            response.put("data", results);
            
            System.out.println("TestController - Basic query: " + results.size() + " resultados");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            System.err.println("TestController - Erro: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(500).body(response);
        }
    }
}