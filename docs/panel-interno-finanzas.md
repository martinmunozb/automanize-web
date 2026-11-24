# Gastos recurrentes del panel interno

«Nuevo gasto» permite guardar una recurrencia semanal, quincenal, mensual o
anual con fecha inicial y entre 2 y 60 ocurrencias. Si la fecha inicial ya
llegó, se registra el gasto al guardar. Si es futura, queda programado.
La primera fecha cuenta como una ocurrencia y es la que recibe el PDF adjunto.
Los meses cortos usan el último día disponible y el día original se conserva
como referencia para las siguientes fechas.

Supabase Cron comprueba las fechas cada 15 minutos según la hora de Madrid y
registra solo los vencimientos alcanzados. Si se interrumpe la ejecución,
recupera las cuotas vencidas. Guardar con el mismo identificador o repetir la
tarea programada conserva una sola ocurrencia por fecha de cada programación.
Los gastos individuales, ingresos y registros existentes conservan su flujo.

La RPC `finanzas_programar_gasto` usa la autorización existente
`is_finanzas_admin()` y se ejecuta con una sesión autenticada. El navegador
no tiene acceso directo a la tabla de recurrencias ni a la función de cron.
La RPC utiliza la familia de rutas Supabase REST ya documentada. Las
ejecuciones programadas se consultan en `cron.job_run_details`.

Aplicar primero `ops/sql/finanzas-gastos-recurrentes.sql` con la cuenta
administrativa que será propietaria de la tarea de Supabase Cron. Confirmar que
la tarea figura activa y comprobar la RPC con una cuenta financiera, una
cuenta autenticada sin acceso y una sesión anónima antes de publicar el HTML.
