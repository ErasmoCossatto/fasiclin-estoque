package com.br.fasipe.estoque.controller;

import com.br.fasipe.estoque.model.Item;
import com.br.fasipe.estoque.repository.ItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Controller REST para operações de Item.
 */
@RestController
@RequestMapping("/api/itens")
public class ItemController {

    private final ItemRepository itemRepository;

    public ItemController(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @GetMapping
    public ResponseEntity<List<Item>> listarTodos() {
        List<Item> itens = itemRepository.findAll();
        return ResponseEntity.ok(itens);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> buscarPorId(@PathVariable Integer id) {
        Optional<Item> item = itemRepository.findById(id);
        return item.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ativos")
    public ResponseEntity<List<Item>> listarAtivos() {
        List<Item> itens = itemRepository.findByAtivo("S");
        return ResponseEntity.ok(itens);
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Item>> buscarPorNome(@RequestParam String nome) {
        List<Item> itens = itemRepository.findByNomeItemContainingIgnoreCase(nome);
        return ResponseEntity.ok(itens);
    }

    @PostMapping
    public ResponseEntity<Item> criar(@RequestBody Item item) {
        Item salvo = itemRepository.save(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> atualizar(@PathVariable Integer id, @RequestBody Item item) {
        if (!itemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        item.setId(id);
        Item atualizado = itemRepository.save(item);
        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        if (!itemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        itemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
