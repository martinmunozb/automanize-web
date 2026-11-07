# solicitar-demo.html — Reserva de llamada y alta de prueba Nize

> Hasta el 10 de agosto de 2026 esta era la ficha de `prueba-nize.html`,
> landing separada solo para tráfico de Meta Ads. Se eliminó porque no la
> enlazaba ninguna página del sitio — `solicitar-demo.html` sí (`casos-exito.html`,
> `crm.html`, `our-services.html`), así que pasó a ser la única página de alta
> real, con el mismo comportamiento de fondo. Ver
> `docs/superpowers/specs/2026-08-10-trial-7-dias-design.md` del repo `Automanize`
> para el diseño completo del ciclo de vida del trial.

## Para qué sirve

Desde el 5 de noviembre de 2026, `solicitar-demo.html` ya no crea cuentas: sirve
para reservar la llamada Elite Gold (`automanize/elitegold`) en un popup de Cal.com.
La prueba por cuenta propia sigue disponible en el formulario de `crm.html`, que
usa `trial-signup` como se describe más abajo.

**URL**: `https://automanize.com/solicitar-demo.html`

---

## Flujo

```
1. El usuario pulsa "Elegir día y hora"
2. Se carga embed.js de Cal.com y se abre el popup (antes del clic no se contacta con Cal.com)
3. Reserva. Cal.com avisa con el evento bookingSuccessfulV2 y la web va a gracias-demo.html
4. Cal.com dispara BOOKING_CREATED contra calcom-booking, que envía la invitación
   a usar-demo.html y el evento Schedule a Meta
```

Con la reserva viajan `metadata[ua]`, `metadata[url]` (conserva los UTM) y, si
existen, `metadata[fbp]` y `metadata[fbc]`. Si embed.js no carga, el botón abre
`cal.com/automanize/elitegold`; ese camino no pasa por `gracias-demo.html`.

Si Stripe redirige aquí tras un pago (pantalla de bloqueo del trial en la app de
escritorio, `?pago=exitoso`), la tarjeta se sustituye por un aviso de "pago
confirmado". La URL está en `automanize-backend/src/integrations/stripe.js`.

La CSP de la página, en su `<meta>`, permite `https://app.cal.com` en `script-src`,
`frame-src` y `connect-src`. El monitor de Supabase no vigila la página, y
`calcom-booking` conserva su verificación de firma.

---

## Edge Function: trial-signup

Ya desplegada en Supabase, proyecto `edjugpekcntzvqaskbmc` (repo
`automanize-app`, `supabase/functions/trial-signup/index.ts`).

Hace, en orden:
1. Descarta el envío en silencio si `website` (honeypot) viene relleno
2. Valida y normaliza el telefono; bloquea contactos repetidos
3. Crea el usuario en Supabase Auth (contraseña temporal generada)
4. Crea el tenant (`plan: 'basico'`, `pagado: false`,
   `trial_ends_at: ahora + 7 días`)
5. Crea el perfil admin (`perfiles_app`) para ese usuario
6. Crea el token de activación XXXX-XXXX (`tenant_activaciones`)
7. Manda el email de bienvenida (instalador + credenciales + token) vía
   Gmail SMTP
8. Crea la carpeta de Drive del tenant (no bloqueante)

Si el correo o telefono ya existe, o falta un campo obligatorio, responde
400 con un mensaje claro. Un rechazo del tenant elimina el nuevo usuario Auth.
La migracion `sql_trial_unique_contact.sql` debe aplicarse antes de desplegar
la funcion; publicar el formulario sin DNI solo despues de esa actualizacion.

### Secretos necesarios en Supabase (Edge Functions → Secrets)

| Variable | Valor |
|---|---|
| `GMAIL_SENDER_USER` | cuenta Gmail remitente |
| `GMAIL_SENDER_APP_PASSWORD` | App Password (no la contraseña normal — requiere 2FA activado) |

---

## Qué pasa después del alta

Ver `docs/superpowers/specs/2026-08-10-trial-7-dias-design.md` (repo
`Automanize`) para el ciclo completo: a los 7 días, si la cartera es
pequeña (≤3 pisos y ≤17 habitaciones) el tenant pasa a un plan gratuito
automático; si no, se bloquea el acceso y se ofrece pagar (Stripe
Checkout) o hablar con el equipo. A los 2 meses sin pagar se borran los
datos de negocio, conservando el tenant como lead de seguimiento
comercial.

---

## Diseño

- Estética del sitio (`automanize-theme.css` + `automanize-dock.css`),
  tarjeta blanca con sombra sobre fondo del tema, botón "specular" con
  brillo que sigue al puntero
- Fuente Spline Sans
- Dos columnas en desktop (qué incluye + formulario), una columna en móvil
