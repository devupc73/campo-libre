# Calendario con fechas específicas

La disponibilidad operativa se almacena por fecha concreta mediante `court_schedules.calendar_date`.

- `calendar_date` identifica el día exacto de la franja.
- `day_of_week` se conserva temporalmente para compatibilidad y se deriva de la fecha.
- Las nuevas consultas admiten filtros `date_from` y `date_to`.
- El administrador puede generar hasta 366 días y consultar por año, mes, semana o día.
- El gestor solo puede seleccionar franjas cuya fecha coincide con `match_date` de la convocatoria.
- Las franjas semanales antiguas se mantienen como respaldo únicamente cuando no existe disponibilidad fechada para el día consultado.
