# Estágio de Build
FROM maven:3.9-eclipse-temurin-24 AS build
WORKDIR /app

# Copia o arquivo de dependências e o código fonte Java
COPY pom.xml .
COPY src ./src

# === PASSO CRÍTICO ===
# Copia a pasta 'frontend' da raiz para dentro dos recursos estáticos do Spring Boot
# Isso permite que o Java sirva o HTML/CSS/JS automaticamente
COPY frontend ./src/main/resources/static

# Compila o projeto gerando o .jar (pula testes para agilizar deploy)
RUN mvn clean package -DskipTests

# Estágio de Execução (Imagem leve)
FROM eclipse-temurin:24-jre
WORKDIR /app

# Copia o .jar gerado no estágio anterior
COPY --from=build /app/target/*.jar app.jar

# Expõe a porta padrão do Spring Boot
EXPOSE 8080

# Comando de inicialização
ENTRYPOINT ["java", "-jar", "app.jar"]
