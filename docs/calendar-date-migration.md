# Calendario con fechas específicas

La disponibilidad operativa debe almacenarse por fecha concreta mediante `court_schedules.calendar_date`.

- `calendar_date` identifica el día exacto de la franja.
- `day_of_week` se conserva temporalmente para compatibilidad y se deriva de la fecha.
- Las reservas y pagos deben mostrar la fecha de la convocatoria y la fecha de la franja.
- Las nuevas consultas admiten filtros `date_from` y `date_to`.
- El administrador del complejo puede generar disponibilidad para rangos de hasta 366 días y consultar por año, mes, semana o día.
