# solicitar-demo.html — Landing trial gratuito Nize

> Hasta el 10 de agosto de 2026 esta era la ficha de `prueba-nize.html`,
> landing separada solo para tráfico de Meta Ads. Se eliminó porque no la
> enlazaba ninguna página del sitio — `solicitar-demo.html` sí (`casos-exito.html`,
> `crm.html`, `our-services.html`), así que pasó a ser la única página de alta
> real, con el mismo comportamiento de fondo. Ver
> `docs/superpowers/specs/2026-08-10-trial-7-dias-design.md` del repo `Automanize`
> para el diseño completo del ciclo de vida del trial.

## Para qué sirve

Página de captación enlazada desde el sitio (casos de éxito, CRM, servicios).
Un potencial cliente de Nize (inmobiliaria o particular con varios pisos)
rellena sus datos y se le crea una cuenta real con **7 días de prueba
gratis** del software — no es un simple envío de lead por correo.

**URL**: `https://automanize.com/solicitar-demo.html`

---

## Flujo

```
1. Usuario llega desde una de las páginas que enlazan aquí
2. Rellena el formulario: nombre/empresa, correo, teléfono, NIF/DNI
3. POST a Supabase Edge Function: /functions/v1/trial-signup
4. La función crea usuario (Supabase Auth), tenant, perfil admin,
   token de activación, envía email de bienvenida (instalador +
   credenciales + código) y crea la carpeta de Drive del tenant
5. Usuario ve pantalla de confirmación con enlace de descarga directa
```

Si Stripe redirige aquí de vuelta tras un pago (pantalla de bloqueo del
trial en la app de escritorio, `?pago=exitoso`), la tarjeta del formulario
se sustituye por un aviso de "pago confirmado" en vez de pedir el alta otra
vez.

---

## Formulario

- **Nombre y apellidos**: texto libre — se envía como `empresa` al backend
  (es lo que se muestra como nombre del tenant en toda la app y en el
  panel de superadmin; vale igual para una persona particular con varios
  pisos que para una inmobiliaria formal)
- **Correo electrónico**: email, obligatorio (con esto se crea el usuario
  de Supabase Auth)
- **Teléfono**: campo de texto libre único, sin selector de prefijo de país
  (a diferencia de `formulario.html`, ver `docs/telefono.md`) — el backend
  no valida su formato, solo que no esté vacío
- **NIF / DNI**: obligatorio, validado por checksum en el backend (DNI/NIE
  reales, CIF solo por formato) — evita altas duplicadas con NIF distinto
  usando emails distintos
- **Honeypot**: campo oculto `website` anti-spam, invisible para una
  persona real

### Envío

```js
fetch(`${SUPABASE_URL}/functions/v1/trial-signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
  body: JSON.stringify({ empresa, telefono, email, nif, website }),
});
```

---

## Edge Function: trial-signup

Ya desplegada en Supabase, proyecto `edjugpekcntzvqaskbmc` (repo
`automanize-app`, `supabase/functions/trial-signup/index.ts`).

Hace, en orden:
1. Descarta el envío en silencio si `website` (honeypot) viene relleno
2. Valida NIF/DNI/CIF (checksum real para DNI/NIE, formato para CIF)
3. Crea el usuario en Supabase Auth (contraseña temporal generada)
4. Crea el tenant (`plan: 'basico'`, `pagado: false`,
   `trial_ends_at: ahora + 7 días`, `nif`)
5. Crea el perfil admin (`perfiles_app`) para ese usuario
6. Crea el token de activación XXXX-XXXX (`tenant_activaciones`)
7. Manda el email de bienvenida (instalador + credenciales + token) vía
   Gmail SMTP
8. Crea la carpeta de Drive del tenant (no bloqueante)

Si el NIF ya existe (`tenants_nif_unique_idx`) o es inválido, o si falta
cualquier campo obligatorio, responde 400 con un mensaje claro y no crea
nada.

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
