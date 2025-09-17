package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Fornecedor;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.FornecedorService;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

/**
 * Controller para gerenciamento de fornecedores
 * Endpoints para controle de parceiros comerciais
 */
@Slf4j
@RestController
@RequestMapping("/api/fornecedores")
@CrossOrigin(origins = "*")
public class FornecedorController {

    @Autowired
    private FornecedorService fornecedorService;

    /**
     * Lista todos os fornecedores com paginação
     * Endpoint principal para visualização de fornecedores
     */
    @GetMapping
    public ResponseEntity<Page<Fornecedor>> listarFornecedores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction direction) {
        
        log.info("Listando fornecedores - Página: {}, Tamanho: {}, Ordenação: {}", page, size, sortBy);
        
        Page<Fornecedor> fornecedores = fornecedorService.findAllPaginated(page, size, sortBy, direction);
        
        return ResponseEntity.ok(fornecedores);
    }

    /**
     * Busca fornecedor por ID
     * Endpoint para detalhamento de fornecedor específico
     */
    @GetMapping("/{id}")
    public ResponseEntity<Fornecedor> buscarFornecedorPorId(@PathVariable Integer id) {
        log.info("Buscando fornecedor por ID: {}", id);
        
        Optional<Fornecedor> fornecedor = fornecedorService.findById(id);
        
        return fornecedor.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Lista fornecedores por representante
     * Endpoint para busca por contato
     */
    @GetMapping("/representante/{representante}")
    public ResponseEntity<List<Fornecedor>> listarFornecedoresPorRepresentante(@PathVariable String representante) {
        log.info("Listando fornecedores por representante: {}", representante);
        
        List<Fornecedor> fornecedores = fornecedorService.findByRepresentante(representante);
        
        return ResponseEntity.ok(fornecedores);
    }

    /**
     * Lista fornecedores por contato do representante
     * Endpoint para busca por telefone/contato
     */
    @GetMapping("/contato/{contatoRepresentante}")
    public ResponseEntity<List<Fornecedor>> listarFornecedoresPorContato(@PathVariable String contatoRepresentante) {
        log.info("Listando fornecedores por contato: {}", contatoRepresentante);
        
        List<Fornecedor> fornecedores = fornecedorService.findByContatoRepresentante(contatoRepresentante);
        
        return ResponseEntity.ok(fornecedores);
    }

    /**
     * Lista fornecedores ativos
     * Endpoint para visualização de fornecedores disponíveis
     */
    @GetMapping("/ativos")
    public ResponseEntity<Page<Fornecedor>> listarFornecedoresAtivos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando fornecedores ativos - Página: {}", page);
        
        Page<Fornecedor> fornecedores = fornecedorService.findFornecedoresAtivos(page, size);
        
        return ResponseEntity.ok(fornecedores);
    }

    /**
     * Cria um novo fornecedor
     * Endpoint para cadastro de fornecedores
     */
    @PostMapping
    public ResponseEntity<Fornecedor> criarFornecedor(@RequestBody Fornecedor fornecedor) {
        log.info("Criando novo fornecedor: {}", fornecedor.getRepresentante());
        
        Fornecedor fornecedorSalvo = fornecedorService.save(fornecedor);
        
        return ResponseEntity.ok(fornecedorSalvo);
    }

    /**
     * Atualiza um fornecedor existente
     * Endpoint para edição de informações do fornecedor
     */
    @PutMapping("/{id}")
    public ResponseEntity<Fornecedor> atualizarFornecedor(@PathVariable Integer id, @RequestBody Fornecedor fornecedor) {
        log.info("Atualizando fornecedor ID: {}", id);
        
        fornecedor.setId(id);
        Fornecedor fornecedorAtualizado = fornecedorService.update(fornecedor);
        
        return ResponseEntity.ok(fornecedorAtualizado);
    }

    /**
     * Remove um fornecedor
     * Endpoint para exclusão de fornecedores (usar com cuidado)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerFornecedor(@PathVariable Integer id) {
        log.info("Removendo fornecedor ID: {}", id);
        
        fornecedorService.deleteById(id);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Verifica se fornecedor existe por ID
     * Endpoint para validação de existência
     */
    @GetMapping("/{id}/existe")
    public ResponseEntity<Boolean> verificarExistencia(@PathVariable Integer id) {
        log.info("Verificando existência do fornecedor ID: {}", id);
        
        boolean existe = fornecedorService.existsById(id);
        
        return ResponseEntity.ok(existe);
    }

    /**
     * Verifica se fornecedor existe por representante
     * Endpoint para validação de representante
     */
    @GetMapping("/representante/{representante}/existe")
    public ResponseEntity<Boolean> verificarExistenciaPorRepresentante(@PathVariable String representante) {
        log.info("Verificando existência do fornecedor por representante: {}", representante);
        
        boolean existe = fornecedorService.existsByRepresentante(representante);
        
        return ResponseEntity.ok(existe);
    }

    /**
     * Conta total de fornecedores
     * Endpoint para estatísticas
     */
    @GetMapping("/total")
    public ResponseEntity<Long> contarFornecedores() {
        log.info("Contando total de fornecedores");
        
        long total = fornecedorService.count();
        
        return ResponseEntity.ok(total);
    }

    /**
     * Conta fornecedores ativos
     * Endpoint para estatísticas de fornecedores disponíveis
     */
    @GetMapping("/total-ativos")
    public ResponseEntity<Long> contarFornecedoresAtivos() {
        log.info("Contando fornecedores ativos");
        
        long total = fornecedorService.countAtivos();
        
        return ResponseEntity.ok(total);
    }
}
