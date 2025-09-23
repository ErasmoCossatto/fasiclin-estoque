package com.br.fasipe.estoque.MovimentacaoEstoque.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Usuario;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    
    /**
     * Busca usuário por login
     * @param login Login do usuário
     * @return Optional contendo o usuário se encontrado
     */
    Optional<Usuario> findByLogin(String login);
    
    /**
     * Verifica se existe usuário com o login informado
     * @param login Login do usuário
     * @return true se existe, false caso contrário
     */
    boolean existsByLogin(String login);
}