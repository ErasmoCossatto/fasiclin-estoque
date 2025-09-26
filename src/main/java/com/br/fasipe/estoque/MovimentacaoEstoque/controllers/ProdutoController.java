package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Produto;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.ProdutoService;

import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Controller para gerenciamento de produtos com foco em estoque
 * Endpoints otimizados para operações de controle de estoque
 */
@Slf4j
@RestController
@RequestMapping("/api/produtos")
@CrossOrigin(origins = "*")
public class ProdutoController {

    @Autowired
    private ProdutoService produtoService;

    /**
     * Lista todos os produtos com paginação
     * Endpoint principal para visualização de produtos em estoque
     */
    @GetMapping
    public ResponseEntity<Page<Produto>> listarProdutos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") Sort.Direction direction) {
        
        try {
            log.info("Listando produtos - Página: {}, Tamanho: {}, Ordenação: {}", page, size, sortBy);
            
            Page<Produto> produtos = produtoService.findAllPaginated(page, size, sortBy, direction);
            
            log.info("Produtos encontrados: {}", produtos.getTotalElements());
            return ResponseEntity.ok(produtos);
            
        } catch (Exception e) {
            log.error("Erro ao listar produtos: ", e);
            throw new RuntimeException("Erro ao buscar produtos: " + e.getMessage(), e);
        }
    }

    /**
     * Lista todos os produtos ordenados por IDPRODUTO para movimentação
     * Incluí produtos com ID_ALMOX NULL mas não permite movimentá-los
     */
    @GetMapping("/todos-para-movimentacao")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> listarTodosParaMovimentacao() {
        try {
            log.info("Listando todos os produtos ordenados por IDPRODUTO para movimentação");
            
            java.util.List<java.util.Map<String, Object>> produtos = produtoService.buscarTodosParaMovimentacao();
            
            log.info("Produtos encontrados para movimentação: {}", produtos.size());
            return ResponseEntity.ok(produtos);
            
        } catch (Exception e) {
            log.error("Erro ao listar produtos para movimentação: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Endpoint de teste simples para diagnóstico
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        log.info("Endpoint de teste acessado");
        return ResponseEntity.ok("API está funcionando!");
    }

    /**
     * Busca produto por ID
     * Endpoint para detalhamento de produto específico
     */
    @GetMapping("/{id}")
    public ResponseEntity<Produto> buscarProdutoPorId(@PathVariable Integer id) {
        log.info("Buscando produto por ID: {}", id);
        
        Optional<Produto> produto = produtoService.findById(id);
        
        return produto.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Busca produto por código de barras
     * Endpoint CRÍTICO para entrada rápida de produtos no estoque
     */
    @GetMapping("/codigo-barras/{codBarras}")
    public ResponseEntity<Produto> buscarProdutoPorCodigoBarras(@PathVariable String codBarras) {
        log.info("Buscando produto por código de barras: {}", codBarras);
        
        Optional<Produto> produto = produtoService.findByCodBarras(codBarras);
        
        return produto.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Busca produto por nome
     * Endpoint para busca textual de produtos
     */
    @GetMapping("/nome/{nome}")
    public ResponseEntity<Produto> buscarProdutoPorNome(@PathVariable String nome) {
        log.info("Buscando produto por nome: {}", nome);
        
        Optional<Produto> produto = produtoService.findByNome(nome);
        
        return produto.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Lista produtos com estoque baixo
     * Endpoint CRÍTICO para alertas de reposição
     */
    @GetMapping("/estoque-baixo")
    public ResponseEntity<Page<Produto>> listarProdutosComEstoqueBaixo(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando produtos com estoque baixo - Página: {}", page);
        
        Page<Produto> produtos = produtoService.findProdutosComEstoqueBaixo(page, size);
        
        return ResponseEntity.ok(produtos);
    }

    /**
     * Lista produtos próximos do ponto de pedido
     * Endpoint para planejamento de compras
     */
    @GetMapping("/proximos-pedido")
    public ResponseEntity<Page<Produto>> listarProdutosProximosDoPedido(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando produtos próximos do ponto de pedido - Página: {}", page);
        
        Page<Produto> produtos = produtoService.findProdutosProximosDoPedido(page, size);
        
        return ResponseEntity.ok(produtos);
    }

    /**
     * Lista produtos por almoxarifado
     * Endpoint para controle por localização
     */
    @GetMapping("/almoxarifado/{idAlmoxarifado}")
    public ResponseEntity<Page<Produto>> listarProdutosPorAlmoxarifado(
            @PathVariable Integer idAlmoxarifado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando produtos do almoxarifado {} - Página: {}", idAlmoxarifado, page);
        
        Page<Produto> produtos = produtoService.findByAlmoxarifado(idAlmoxarifado, page, size);
        
        return ResponseEntity.ok(produtos);
    }

    /**
     * Lista produtos por temperatura ideal
     * Endpoint para controle de produtos refrigerados
     */
    @GetMapping("/temperatura/{tempIdeal}")
    public ResponseEntity<Page<Produto>> listarProdutosPorTemperatura(
            @PathVariable BigDecimal tempIdeal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Listando produtos com temperatura ideal {} - Página: {}", tempIdeal, page);
        
        Page<Produto> produtos = produtoService.findByTempIdeal(tempIdeal, page, size);
        
        return ResponseEntity.ok(produtos);
    }

    /**
     * Cria um novo produto
     * Endpoint para cadastro de produtos no sistema
     */
    @PostMapping
    public ResponseEntity<Produto> criarProduto(@RequestBody Produto produto) {
        log.info("Criando novo produto: {}", produto.getNome());
        
        Produto produtoSalvo = produtoService.save(produto);
        
        return ResponseEntity.ok(produtoSalvo);
    }

    /**
     * Atualiza um produto existente
     * Endpoint para edição de informações do produto
     */
    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizarProduto(@PathVariable Integer id, @RequestBody Produto produto) {
        log.info("Atualizando produto ID: {}", id);
        
        produto.setId(id);
        Produto produtoAtualizado = produtoService.update(produto);
        
        return ResponseEntity.ok(produtoAtualizado);
    }

    /**
     * Remove um produto
     * Endpoint para exclusão de produtos (usar com cuidado)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerProduto(@PathVariable Integer id) {
        log.info("Removendo produto ID: {}", id);
        
        produtoService.deleteById(id);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Verifica se produto existe
     * Endpoint para validação de existência
     */
    @GetMapping("/{id}/existe")
    public ResponseEntity<Boolean> verificarExistencia(@PathVariable Integer id) {
        log.info("Verificando existência do produto ID: {}", id);
        
        boolean existe = produtoService.existsById(id);
        
        return ResponseEntity.ok(existe);
    }

    /**
     * Conta total de produtos
     * Endpoint para estatísticas
     */
    @GetMapping("/total")
    public ResponseEntity<Long> contarProdutos() {
        log.info("Contando total de produtos");
        
        long total = produtoService.count();
        
        return ResponseEntity.ok(total);
    }

    /**
     * Busca produtos por nome (para autocompletar)
     * Endpoint para busca dinâmica de produtos
     */
    @GetMapping("/buscar-por-nome")
    public ResponseEntity<java.util.List<Produto>> buscarPorNome(@RequestParam String nome) {
        log.info("Buscando produtos por nome: {}", nome);
        
        try {
            java.util.List<Produto> produtos = produtoService.buscarPorNomeContendo(nome);
            return ResponseEntity.ok(produtos);
        } catch (Exception e) {
            log.error("Erro ao buscar produtos por nome: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Verifica disponibilidade de estoque para um produto
     * Endpoint CRÍTICO para validação de estoque antes de movimentações
     */
    @GetMapping("/{id}/verificar-estoque")
    public ResponseEntity<java.util.Map<String, Object>> verificarEstoque(
            @PathVariable Integer id, 
            @RequestParam Integer quantidade) {
        log.info("Verificando estoque para produto ID: {}, quantidade: {}", id, quantidade);
        
        try {
            java.util.Map<String, Object> resultado = produtoService.verificarDisponibilidadeEstoque(id, quantidade);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro ao verificar estoque: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Busca produtos por IDPRODUTO (campo específico do banco)
     * Endpoint para busca pelo campo IDPRODUTO da tabela
     */
    @GetMapping("/por-idproduto/{idProduto}")
    public ResponseEntity<Produto> buscarPorIdProduto(@PathVariable Long idProduto) {
        log.info("Buscando produto por IDPRODUTO: {}", idProduto);
        
        try {
            Optional<Produto> produto = produtoService.buscarPorIdProduto(idProduto);
            return produto.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Erro ao buscar por IDPRODUTO: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
