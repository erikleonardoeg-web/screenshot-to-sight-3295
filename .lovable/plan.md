# LeadZap — Fase 5: Cakto e assinaturas seguras

## Resultado
Integrar contratação Start/Pro, confirmação de pagamentos e acesso por empresa, preservando CRM, identidade visual e isolamento atual. Sem compras reais, sem liberação por retorno do checkout e sem iniciar a próxima fase.

## Contrato oficial consultado
- [Desenvolvedores](https://www.cakto.com.br/developers), [documentação](https://docs.cakto.com.br/), [webhooks](https://docs.cakto.com.br/conceitos/webhooks) e [callback](https://docs.cakto.com.br/conceitos/redirect-pos-pagamento).
- Webhooks: HMAC-SHA256 em `X-Cakto-Signature`, sobre timestamp + ponto + corpo original; `X-Cakto-Timestamp` com janela oficial de 300 segundos. Não aceitar ausência de assinatura como autorização para baixar a proteção.
- Checkout: parâmetro documentado `callback`, devolvido no pedido. Não inventar metadados ou identificar a empresa somente pelo e-mail.
- Não existe sinal universal documentado que permita reconhecer todos os eventos de teste. Separar recebimento de teste e produção; ativação real exige conciliação com a API autenticada da Cakto.
- O guia informa prazo de oito segundos e que respostas HTTP de erro não têm reenvio automático garantido. Persistir antes de confirmar recebimento e preparar reprocessamento protegido.

## Implementação
1. **Configuração:** manter IDs internos `start` e `pro`. Preços previstos R$ 39,90 e R$ 59,90 configuráveis, não definitivos. Produtos, ofertas, checkout e limites não receberão valores fictícios. Limites numéricos continuam sem aplicação até definição aprovada.
2. **Assinatura:** criar página própria com plano, status, datas confirmadas, trial, dias restantes e aviso nos dois dias finais. Contagem e autorização usam horário do backend. Proprietário vê informações financeiras; membros recebem somente autorização de uso e aviso para contatar o proprietário.
3. **Checkout:** função autenticada confirma proprietário e empresa no backend, sem aceitar empresa arbitrária. Registrar intenção temporária com token opaco, produto/oferta/plano esperados e vínculo à assinatura. Enviar apenas token ao checkout; nunca conceder acesso no retorno. Checkout permanece indisponível enquanto a configuração estiver incompleta.
4. **Webhooks:** endpoints separados de teste e produção, validação de assinatura, tamanho e estrutura. Registrar apenas dados necessários, nunca segredo, cartão, documento ou payload bruto com informações pessoais. Eventos sem vínculo seguro, produto desconhecido ou configuração incompleta vão para investigação e não liberam acesso.
5. **Processamento:** reutilizar `subscriptions`, `subscription_events` e `audit_logs`. Recebimento e atualização consistentes, com deduplicação e bloqueio transacional. Uma intenção vincula o pedido inicial; renovações usam o identificador externo de assinatura já associado. Não tratar timestamp de entrega como ordem das mudanças comerciais. Consultar estado atual na API antes de aplicar acesso real.
6. **Testes e relatório:** testes locais sem credenciais reais de pagamento, cenários reais de permissão com contas temporárias, telas em computador/celular e relatório final com arquivos, funções, alterações, eventos, configuração e pendências. Não declarar produção sem teste completo autorizado.

## Proposta de acesso e RLS — aprovação antes da aplicação
**Não substituir nem enfraquecer as políticas atuais.** Adicionar políticas **restritivas**, combinadas com as existentes, em `leads`, `clients`, `budgets`, `tasks`, `interactions` e `pipeline_stages`. A empresa deverá ter tanto permissão multiempresa atual quanto assinatura autorizada para ler, criar, editar ou excluir CRM. Conversão de lead deverá respeitar a mesma regra.

Manter perfil, identificação da empresa, equipe e página de assinatura acessíveis conforme suas permissões atuais, permitindo regularização. Não ampliar leitura de `subscriptions` para funcionários e não conceder escrita de assinaturas/eventos ao navegador. Dados existentes não serão apagados.

**Regras propostas:**
- Trial válido: acesso até `trial_ends_at`, definido no cadastro e nunca reiniciado.
- Ativa: acesso apenas com confirmação real e período de direito de uso confiável; nenhuma data será inventada a partir de uma previsão de cobrança.
- Cancelada: não é reembolso; preservar apenas período já pago e confirmado, quando houver. Sem período confirmado, restringir.
- Pendência/recusa: nunca ativa pagamento novo; período previamente pago ou trial ainda válido não será perdido por uma simples tentativa recusada. Inadimplência confirmada além do direito vigente restringe.
- Suspensão, reembolso confirmado ou chargeback: restringir conforme estado atual conciliado. Eventos inválidos não mudam nada.
- Ausência de assinatura ou trial expirado: restringir CRM e permitir regularização pelo proprietário. Sem tolerância adicional.

**Impacto importante:** empresas com trials antigos vencidos poderão perder acesso ao CRM quando esta proteção for ativada. A ativação não deve ocorrer antes da configuração do caminho de regularização e da confirmação dessas regras.

## Mapeamento de eventos
| Evento documentado | Tratamento |
|---|---|
| `purchase_approved`, `subscription_renewed` | Candidatos à ativação/renovação; exigir pedido real conciliado, plano e empresa válidos. |
| `subscription_created`, `subscription_resumed`, `subscription_late_recovered` | Conciliar situação atual; criação ou retomada isolada não comprova pagamento. |
| `purchase_refused`, `subscription_renewal_refused`, `subscription_late` | Registrar recusa/pendência; calcular acesso pelo direito confirmado vigente. |
| `subscription_canceled` | Cancelar renovação sem presumir reembolso; usar período pago confirmado. |
| `subscription_paused` | Suspensão confirmada na conciliação. |
| `refund`, `chargeback` | Reembolso/disputa confirmados; revisar e restringir direito correspondente. |
| `pix_gerado`, `boleto_gerado` e demais pagamentos gerados | Registrar pendência, sem ativação. |
| `refund_requested` e desconhecidos | Registrar sem conceder ou revogar acesso automaticamente. |

## Detalhes técnicos
- TanStack Start: funções internas autenticadas e rotas `/api/public/cakto/webhook` e `/api/public/cakto/webhook-test`; não criar Edge Functions.
- Migração aditiva: metadados de processamento nos eventos, vínculos externos únicos, funções transacionais de recebimento/processamento e autorização. Uma tabela de intenções de checkout é justificável: as tabelas atuais não representam tentativa temporária anterior ao pedido, e não serão duplicadas tabelas de assinatura.
- Intenções: acesso operacional somente no backend; proprietário solicita por função autorizada. Token de correlação não é segredo de API, mas deve ser armazenado com hash e não divulgado em logs.
- Serviço de conciliação com a API Cakto protegido e configurado via conexão segura, se disponível. Autorização por empresa e papéis continua nas funções existentes.
- Dedupe por tipo de evento, pedido e ciclo/estado relevante, mais digest para repetição exata; o envelope não documenta ID global exclusivo nem ordem garantida. Reprocessamento não pode duplicar efeito ou reativar estado obsoleto.

## Configuração externa e limites de verificação
- Necessários: produtos recorrentes e ofertas Start/Pro, IDs reais, URLs reais, preços aprovados, segredo(s) dos webhooks e credenciais de API Cakto para conciliação. Solicitar credenciais por formulário seguro, não pelo chat.
- Antes da operação real, confirmar assinaturas dos webhooks na conta, formato do identificador de assinatura, propagação do callback e fonte confiável do período pago. Datas estimadas de próxima cobrança não serão usadas silenciosamente como direito de acesso.
- O backend já impede alterar datas/status e já cria uma única assinatura por empresa. **Isso não impede a mesma pessoa de cadastrar outra conta com outro e-mail.** Bloquear trials ilimitados entre identidades exige um identificador de empresa/pessoa verificável e política aprovada; não prometer solução apenas com e-mail, nome ou documento digitado. Esse requisito permanece pendente até a definição dessa verificação, sem impor coleta nova de documentos automaticamente.
- Sem Cakto configurada, entregar estrutura e testes locais, com contratação real desligada. Nenhuma cobrança real será feita sem autorização explícita.

## Verificação prevista
Cobrir Start/Pro, aprovação, pendência, recusa, renovação, cancelamento, reembolso, chargeback, assinatura inválida, replay, evento duplicado, empresa inexistente, produto incorreto, trial vencido, assinatura ativa/suspensa, funcionário na página financeira, alteração manual de status, isolamento de duas empresas, processamento concorrente e reprocessamento. Distinguir testes simulados aprovados de testes Cakto ainda dependentes de configuração.