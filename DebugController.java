package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Usuario;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Controller temporário para diagnóstico de usuários
 * REMOVER EM PRODUÇÃO
 */
@Slf4j
@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
public class DebugController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Lista todos os usuários para diagnóstico
     */
    @GetMapping("/usuarios")
    public ResponseEntity<Map<String, Object>> listarUsuarios() {
        log.info("DEBUG: Verificando usuários no banco");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Usuario> usuarios = usuarioRepository.findAll();
            
            response.put("total", usuarios.size());
            response.put("usuarios", usuarios);
            response.put("status", "success");
            
            log.info("DEBUG: Encontrados {} usuários", usuarios.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("DEBUG: Erro ao buscar usuários: {}", e.getMessage(), e);
            
            response.put("erro", "Erro ao buscar usuários");
            response.put("mensagem", e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Busca usuário específico por ID
     */
    @GetMapping("/usuarios/{id}")
    public ResponseEntity<Map<String, Object>> buscarUsuario(@PathVariable Integer id) {
        log.info("DEBUG: Buscando usuário ID: {}", id);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            var usuario = usuarioRepository.findById(id);
            
            if (usuario.isPresent()) {
                response.put("usuario", usuario.get());
                response.put("encontrado", true);
                response.put("status", "success");
                log.info("DEBUG: Usuário ID {} encontrado", id);
            } else {
                response.put("encontrado", false);
                response.put("mensagem", "Usuário não encontrado");
                response.put("status", "not_found");
                log.warn("DEBUG: Usuário ID {} NÃO encontrado", id);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("DEBUG: Erro ao buscar usuário ID {}: {}", id, e.getMessage(), e);
            
            response.put("erro", "Erro ao buscar usuário");
            response.put("mensagem", e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cria usuário de teste
     */
    @PostMapping("/usuarios/teste")
    public ResponseEntity<Map<String, Object>> criarUsuarioTeste() {
        log.info("DEBUG: Criando usuário de teste");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Verificar se usuário ID 1 já existe
            var usuarioExistente = usuarioRepository.findById(1);
            if (usuarioExistente.isPresent()) {
                response.put("mensagem", "Usuário de teste ID 1 já existe");
                response.put("usuario", usuarioExistente.get());
                response.put("status", "already_exists");
                return ResponseEntity.ok(response);
            }
            
            // Criar usuário de teste básico
            Usuario usuarioTeste = new Usuario();
            usuarioTeste.setLogin("admin_teste");
            usuarioTeste.setSenha("123456");
            
            Usuario usuarioSalvo = usuarioRepository.save(usuarioTeste);
            
            response.put("mensagem", "Usuário de teste criado com sucesso");
            response.put("usuario", usuarioSalvo);
            response.put("status", "created");
            
            log.info("DEBUG: Usuário de teste criado - ID: {}", usuarioSalvo.getId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("DEBUG: Erro ao criar usuário de teste: {}", e.getMessage(), e);
            
            response.put("erro", "Erro ao criar usuário de teste");
            response.put("mensagem", e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}