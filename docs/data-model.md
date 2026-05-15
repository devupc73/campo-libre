# Modelo de datos Campo Libre

## Entidades principales

### User
Representa a administradores, capitanes, jugadores y proveedores.

Campos principales:
- id
- full_name
- phone
- email
- role
- status

### SportsComplex
Representa un complejo deportivo.

Campos principales:
- id
- name
- address
- latitude
- longitude
- administrator_id

### Court
Representa un campo deportivo dentro de un complejo.

Campos principales:
- id
- complex_id
- name
- sport
- capacity
- price_per_hour
- status

### Reservation
Representa la separacion de un campo.

Campos principales:
- id
- court_id
- captain_id
- start_at
- end_at
- total_price
- status
- is_recurring

### MatchInvitation
Representa la convocatoria generada a partir de una reserva.

Campos principales:
- id
- reservation_id
- title
- description
- status

### Participant
Representa a cada jugador inscrito en una convocatoria.

Campos principales:
- id
- invitation_id
- user_id
- participant_type
- payment_status
- attendance_status

### Payment
Representa un pago realizado por un participante.

Campos principales:
- id
- participant_id
- method
- amount
- status
- operation_code

### WalletMovement
Representa saldos y movimientos de billetera.

Campos principales:
- id
- user_id
- movement_type
- amount
- source

### TeamDraw
Representa el resultado del sorteo de equipos.

Campos principales:
- id
- invitation_id
- team_name
- participant_id

## Estados sugeridos

Reservation:
- pending
- confirmed
- cancelled
- completed

Participant:
- titular
- substitute

Payment:
- pending
- confirmed
- rejected

Invitation:
- open
- closed
- cancelled
