# usar-demo.html — Página oculta de la prueba tras agendar la llamada

Página **no publicada**: no la enlaza ninguna otra página del sitio, lleva
`noindex, nofollow` y sin el token del correo no enseña formulario. Se llega
solo desde el enlace personal que se manda al agendar la llamada de Elite Gold
en `nize.html` o `solicitar-demo.html` (Edge Function `calcom-booking`, repo `automanize-app`).

**URL**: `https://automanize.com/usar-demo.html?t=<token uuid>`

## En qué se diferencia de solicitar-demo.html

`solicitar-demo.html` es la página pública para reservar la llamada en Cal.com.
Reservar desde ella también genera este enlace personal, porque usa el mismo evento.

| | `solicitar-demo.html` | `usar-demo.html` |
|---|---|---|
| Quién entra | cualquiera, desde el sitio | solo quien ya agendó la llamada |
| Qué hace | abre el calendario de Cal.com | arranca la prueba de 7 días |
| Campos | los pide Cal.com al reservar | **ninguno**: todo viene puesto |
| Botón | "Elegir día y hora" | "Usar la demo y descargar" |

El texto evita el "solicitar" a propósito: aquí no hay nada que pedir ni que
aprobar, la prueba de 7 días se activa sola al pulsar el botón.

## Flujo

```
1. Llega desde el correo con ?t=<token>
2. RPC invitacion_prueba_datos(p_token) → { ok, nombre, email, telefono, usado }
   - ok:false o token con formato raro → "Este enlace no es válido"
   - usado:true → pantalla de "tu cuenta ya está creada" + descarga
   - si no → formulario con todo puesto (nombre y email bloqueados)
3. Acepta la política de privacidad (el teléfono viene puesto y es lo
   único editable, por si lo escribió mal)
4. POST a trial-signup con invitacion_token (sin NIF)
5. Cuenta creada + 7 días de prueba → pantalla de descarga, y por correo le
   llegan contraseña y código de activación (lo manda trial-signup)
```

## Detalles que no son obvios

- **El formato del token se comprueba antes de preguntar**: el parámetro entra
  en un `uuid` de Postgres, y cualquier basura devolvería un 400 en vez del
  "enlace no válido" que toca enseñar.
- **El teléfono viene de las notas de la reserva**: `nize.html` lo pide en el
  paso 1 y `landing.js` lo mete en las notas de Cal.com para que vuelva en el
  webhook. Si viene vacío (reserva vieja, notas editadas a mano), el campo sale
  en blanco y se escribe.
- **Nombre y email son `readonly`**: el email identifica la invitación, así que
  cambiarlo no tendría ningún efecto — `trial-signup` exige que coincida con el
  de la invitación para aplicar la exención de NIF.
- **El enlace vale una vez**, pero solo se quema si el alta sale bien: si falla
  a medias, la persona puede volver a abrirlo.
- **La página no valida nada crítico**: quien decide si se exime el NIF es
  `trial-signup` en el servidor. Ver
  `automanize-app/docs/CALCOM_INVITACION_PRUEBA_7_DIAS.md`.
- Reutiliza el mismo `automanize-theme.css` + dock inyectado por
  `automanize-ui.js` que el resto del sitio; el CSS propio del formulario y del
  botón "specular" está copiado de `solicitar-demo.html` (las dos páginas son
  autocontenidas, como el resto de landings de este repo).
