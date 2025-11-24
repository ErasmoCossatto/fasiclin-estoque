package com.br.fasipe.estoque.controller;

import com.br.fasipe.estoque.dto.ProdutoDTO;
import com.br.fasipe.estoque.model.Produto;
import com.br.fasipe.estoque.repository.ItensAlmoxarifadosRepository;
import com.br.fasipe.estoque.repository.ProdutoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller REST para operações de produto.
 */
@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    private final ProdutoRepository produtoRepository;
    private final ItensAlmoxarifadosRepository itensAlmoxarifadosRepository;

    public ProdutoController(
            ProdutoRepository produtoRepository,
            ItensAlmoxarifadosRepository itensAlmoxarifadosRepository) {
        this.produtoRepository = produtoRepository;
        this.itensAlmoxarifadosRepository = itensAlmoxarifadosRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProdutoDTO>> listarTodos() {
        List<ProdutoDTO> dtos = produtoRepository.findAll()
                .stream()
                .map(ProdutoDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProdutoDTO> buscarPorId(@PathVariable Integer id) {
        Optional<Produto> produto = produtoRepository.findById(id);
        return produto
                .map(ProdutoDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/saldo-total")
    public ResponseEntity<Map<String, Object>> consultarSaldoTotal(@PathVariable Integer id) {
        if (!produtoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        Integer quantidadeTotal = itensAlmoxarifadosRepository.somarQuantidadePorItem(id);
        
        Map<String, Object> response = new HashMap<>();
        response.put("produtoId", id);
        response.put("quantidadeTotal", quantidadeTotal != null ? quantidadeTotal : 0);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Produto> criar(@RequestBody Produto produto) {
        Produto salvo = produtoRepository.save(produto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizar(@PathVariable Integer id, @RequestBody Produto produto) {
        if (!produtoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        produto.setId(id);
        Produto atualizado = produtoRepository.save(produto);
        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        if (!produtoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        produtoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
