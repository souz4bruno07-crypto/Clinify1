# Documentação Swagger/OpenAPI - Clinify API

A API do Clinify possui documentação completa no formato Swagger/OpenAPI, facilitando a integração e compreensão de todos os endpoints disponíveis.

## 📚 Acesso à Documentação

Após iniciar o servidor backend, a documentação interativa está disponível em:

**URL Local:** `http://localhost:3001/api/docs`

**JSON da Documentação:** `http://localhost:3001/api/docs.json`

## 🚀 Como Usar

### 1. Instalar Dependências

Certifique-se de que as dependências do Swagger estão instaladas:

```bash
npm install
```

### 2. Iniciar o Servidor

```bash
npm run dev
```

### 3. Acessar a Documentação

Abra seu navegador e acesse: `http://localhost:3001/api/docs`

## 🔑 Autenticação

A maioria dos endpoints requer autenticação via JWT. Para usar os endpoints protegidos:

1. Use o endpoint `/api/auth/signin` para obter um token JWT
2. Na interface do Swagger UI, clique no botão **"Authorize"** (🔒) no topo da página
3. Cole o token JWT no campo (formato: `Bearer seu-token-aqui` ou apenas `seu-token-aqui`)
4. Agora você pode testar todos os endpoints protegidos diretamente pela interface

## 📋 Categorias de Endpoints

A documentação está organizada nas seguintes categorias:

### 🔐 Auth
- Registro de usuário
- Login e autenticação
- Gerenciamento de perfil
- Recuperação de senha

### 💰 Transactions
- Listar transações financeiras
- Criar, atualizar e deletar transações
- Importação em lote
- Geração de dados de exemplo

### 👥 Patients
- CRUD completo de pacientes
- Busca e filtros
- Aniversariantes próximos

### 👨‍⚕️ Staff
- Gerenciamento de equipe
- Comissões e metas
- Perfis profissionais

### 📅 Appointments
- Agendamentos
- Calendário
- Status e confirmações

### 💼 Quotes
- Criação de orçamentos
- Envio e aprovação
- Histórico de cotações

### 📦 Inventory
- Controle de estoque
- Movimentações
- Alertas de estoque baixo
- Produtos e categorias
- Relatórios de consumo

### 💬 Chat
- Threads de conversa
- Mensagens
- Integração CRM
- Contatos

### 📋 Prescriptions
- Prescrições médicas digitais
- Assinatura digital
- Histórico por paciente

### 📊 Categories
- Categorias financeiras
- Tipos de despesas/receitas

### 🎯 Targets
- Metas mensais
- Planejamento financeiro

### 👤 Users
- Membros da clínica
- Perfis de usuário

### 💳 Billing
- Assinaturas
- Planos disponíveis
- Webhooks de pagamento

## 🧪 Testando Endpoints

O Swagger UI permite testar os endpoints diretamente:

1. Expanda o endpoint desejado
2. Clique em **"Try it out"**
3. Preencha os parâmetros necessários
4. Clique em **"Execute"**
5. Veja a resposta em tempo real

## 📝 Formato de Datas

- **Timestamps:** Números inteiros representando milissegundos desde a época Unix
- **Datas ISO:** Strings no formato `YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ss.sssZ`

## 🔒 Segurança

- Todos os endpoints protegidos requerem token JWT no header `Authorization: Bearer <token>`
- O Swagger UI gerencia automaticamente os headers de autenticação após você autorizar
- Rate limiting está ativo para prevenir abuso

## 📤 Exportar Especificação

Você pode exportar a especificação OpenAPI completa:

```bash
curl http://localhost:3001/api/docs.json > openapi.json
```

Isso permite usar a especificação com outras ferramentas como:
- Postman (importar coleção)
- Insomnia
- Geradores de código cliente
- Testes automatizados

## 🛠️ Manutenção

Os comentários de documentação estão em:
- `src/config/swagger-routes.ts` - Definições de rotas e endpoints
- `src/config/swagger.ts` - Configuração e schemas

Para adicionar novos endpoints:
1. Crie a rota no arquivo apropriado em `src/routes/`
2. Adicione a documentação em `src/config/swagger-routes.ts` usando comentários JSDoc `@swagger`
3. Se necessário, adicione novos schemas em `src/config/swagger.ts`

## 💡 Dicas

- Use o filtro de busca no Swagger UI para encontrar endpoints rapidamente
- Os exemplos de requisição/resposta podem ser copiados diretamente
- A documentação é atualizada automaticamente quando você reinicia o servidor
- Mantenha os schemas atualizados para documentação precisa



