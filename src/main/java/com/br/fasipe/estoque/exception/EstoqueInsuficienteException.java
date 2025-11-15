package com.br.fasipe.estoque.exception;

/**
 * Exceção lançada quando não há quantidade suficiente em estoque.
 */
public class EstoqueInsuficienteException extends RuntimeException {
    
    public EstoqueInsuficienteException(String mensagem) {
        super(mensagem);
    }
    
    public EstoqueInsuficienteException(Integer quantidadeDisponivel, Integer quantidadeSolicitada) {
        super(String.format("Estoque insuficiente. Disponível: %d, Solicitado: %d", 
            quantidadeDisponivel, quantidadeSolicitada));
    }
}
