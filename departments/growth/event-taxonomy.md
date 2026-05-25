# Event Taxonomy

Esta taxonomia define eventos conceituais minimos para orientar analise futura. Ela nao cria tracking real e nao deve ser implementada sem aprovacao tecnica.

## Eventos minimos

- `landing_page_viewed`
- `cta_trial_clicked`
- `signup_started`
- `signup_completed`
- `trial_started`
- `first_login_completed`
- `student_created`
- `workout_created`
- `class_scheduled`
- `payment_registered`
- `plan_viewed`
- `checkout_started`
- `payment_completed`
- `refund_requested`
- `subscription_cancelled`
- `user_returned_day_7`
- `support_ticket_created`

## Propriedades futuras sugeridas

- `user_id` quando permitido e seguro.
- `account_id` quando permitido e seguro.
- `segment`.
- `source`.
- `campaign`.
- `plan`.
- `timestamp`.
- `page`.

## Regras

- Nao criar tracking real nesta etapa.
- Nao alterar codigo, banco, analytics ou integracoes.
- Nao coletar dados sensiveis sem desenho tecnico e aprovacao.
- Validar nomenclatura com CTO antes de implementacao.
- Documentar finalidade de cada evento antes de instrumentar.
