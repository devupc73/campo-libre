# Alcance funcional Campo Libre

## Objetivo

Permitir que un usuario pueda buscar campos deportivos, reservar horarios, convocar jugadores, registrar pagos y generar equipos para un partido.

## Roles

- Administrador general
- Administrador de complejo
- Capitan
- Jugador
- Participante
- Proveedor

## Modulos MVP

1. Gestion de complejos deportivos.
2. Gestion de campos.
3. Reservas.
4. Convocatorias.
5. Participantes titulares y suplentes.
6. Pagos y billetera.
7. Sorteo de equipos.
8. Recaudacion.
9. Calificacion de participantes.
10. Reportes basicos.

## Reglas principales

- Un campo pertenece a un complejo.
- Un campo tiene deporte, capacidad, precio y ubicacion.
- Una reserva tiene inicio, fin, precio y estado.
- Una convocatoria nace desde una reserva.
- Los jugadores con pago confirmado tienen prioridad como titulares.
- Si se supera la capacidad, los excedentes pasan a suplentes.
- El sorteo solo considera participantes habilitados.
- La recaudacion compara monto esperado contra monto pagado.
