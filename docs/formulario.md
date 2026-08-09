# formulario.html — Formulario dinámico de leads

## Para qué sirve

Formulario wizard paso a paso que recibe un lead (persona interesada en alquilar). Reemplaza la larga conversación de preguntas por WhatsApp — el lead responde todo de una vez en el móvil. Tiene dos modos de entrada:

| Modo | URL | Cuándo se usa |
|---|---|---|
| **Token** (lead ya identificado) | `https://automanize.com/formulario.html?token=<uuid>` | n8n ya creó la fila en `clientes` (lead que escribió por WhatsApp) y envía este enlace de un solo uso. |
| **Público** (link reutilizable por tenant) | `https://automanize.com/f/<slug>` | Enlace fijo por inmobiliaria para compartir donde sea (Idealista, redes, etc.). No hay cliente todavía — el formulario pide nombre y teléfono si el tenant tiene WhatsApp, o nombre y email obligatorio si solo usa email, y crea el lead al enviar. |

---

## Cómo generar el enlace público de un tenant nuevo

1. El tenant necesita una columna `slug` en `tenants` (texto corto, único, sin espacios — ej. `invictarent`). Si es un tenant nuevo, hay que rellenarla:
   ```sql
   UPDATE tenants SET slug = 'nombretenant' WHERE id = '<tenant_id>';
   ```
2. Su enlace público es directamente: `https://automanize.com/f/<slug>`.
3. El tenant debe tener `activo = true` (si no, `get_tenant_by_slug` no lo encuentra → error "Enlace no válido").
4. **Necesita preguntas activas en `tenant_preguntas`** — crear un tenant nuevo NO las copia automáticamente, hay que poblarlas a mano (si no, error genérico "No hemos podido cargar el formulario"):
   ```sql
   insert into tenant_preguntas (tenant_id, pregunta_id, activa, orden)
   select '<tenant_id>', id, activa_por_defecto, orden_defecto
   from preguntas_catalogo;
   ```
   Esto copia el set de preguntas por defecto (`activa_por_defecto`/`orden_defecto` de `preguntas_catalogo`); luego se pueden desactivar/reordenar individualmente por tenant como con InvictaRent.

La reescritura de `/f/<slug>` → `formulario.html?t=<slug>` vive en el **Caddyfile del servidor** (`/root/caddy-main/Caddyfile`, bloque `automanize.com`), no en `_redirects` (ese archivo es de Netlify y no lo lee nada en producción — el hosting real es Caddy + nginx sobre un VPS, no Netlify, pese a lo que sugiera `netlify.toml`). Dado que Caddy reescribe la petición solo de cara al servidor, el navegador nunca ve el `?t=<slug>` resultante — por eso el JS lee el slug directamente de `location.pathname` (`/f/<slug>`), no del query string.

---

## Flujo completo

```
1. n8n detecta nuevo lead en WhatsApp (o el propio lead entra por /f/<slug>)
2. Se crea el registro en clientes con form_token (uuid, gen_random_uuid())
   - modo token: n8n ya lo crea al detectar el lead, con form_token_expira (24h)
   - modo público: lo crea crear_lead_publico() al enviar el wizard
3. Lead abre el enlace en el móvil y responde el wizard
4. Al enviar: submit_formulario()/crear_lead_publico() guarda respuestas,
   invalida el token de reenvío y devuelve { id, form_token } (no un booleano)
5. POST a backend.automanize.com/webhook/formulario con { token, tenant_id, telefono, cliente_id }
   (`telefono` es `null` para un tenant que solo usa email).
6. El backend Node.js (no n8n) hace matching de propiedades con IA y avisa
   al gestor por el canal disponible.
7. El resultado (éxito o error) se guarda en clientes.webhook_formulario_status
   vía la RPC registrar_estado_webhook_formulario, para poder verlo/reintentarlo
   desde Nize (repo automanize-app, docs/CLIENTES.md → "Reenvío de notificación
   WhatsApp al gestor")
```

**Nota histórica (corregida el 4 de agosto de 2026):** hasta esa fecha el paso 5 no incluía `token` en el body — el backend lo exige para autenticar la llamada, así que la petición fallaba siempre con 401 y el error se tragaba en silencio (`.catch(() => {})`). El lead se guardaba bien en `clientes`, pero el WhatsApp nunca llegaba al gestor. Nadie lo detectó porque no había ningún registro del fallo — por eso ahora el paso 7 existe: cualquier fallo futuro queda guardado y visible.

---

## Diseño y UX

- **Estética**: Nize (fondo `#0D0D0D`, acento amarillo `#F0C000`, fuente Inter)
- **Mobile-first**: header y nav sticky arriba/abajo, botones mínimo 52px
- **Wizard**: una pregunta por pantalla, barra de progreso fina en amarillo
- **Sin scroll**: cada paso cabe en pantalla sin desplazar

---

## Lógica de carga (init)

1. Lee `?token` de la URL → error `notfound` si no hay token
2. `GET clientes WHERE form_token = eq.{token}` → obtiene `tenant_id`, `telefono`, `form_token_expira`, `formulario_enviado`
3. Valida caducidad y si ya se envió → pantallas de error específicas
4. `RPC get_tenant_public_info(tenant_id)` → nombre del tenant para la cabecera
5. `GET tenant_preguntas WHERE tenant_id AND activa = true ORDER BY orden` → preguntas del tenant
6. `GET preguntas_catalogo WHERE id IN (pregunta_ids)` → detalles de cada pregunta
7. Para `dynamic_zone_multi_select`: `GET inmuebles_disponibles WHERE tenant_id AND estado = 'disponible'` → zonas distintas
8. Renderiza el wizard

---

## Tipos de input

| tipo_input | Componente |
|---|---|
| `text` | Input texto libre |
| `number` | Input numérico (sin flechas) |
| `email` | Input email obligatorio y validado antes de continuar |
| `single_select` | Botones radio-style |
| `multi_select` | Botones checkbox-style, valor guardado como CSV |
| `boolean` | Dos tarjetas grandes (fácil de tocar en móvil) |
| `dynamic_zone_multi_select` | Como multi_select pero opciones vienen de `inmuebles_disponibles.zona` |

---

## Lógica condicional

- Si `clave === 'aval_ingreso'` y `answers['tieneAval'] === 'false'` → el paso se oculta y se salta.
- El payload de submit solo incluye los pasos visibles.

---

## Payload de submit

```js
// Keyed por pregunta_id (uuid), valores siempre como string
{
  "554dee00-2be1-42cc-802c-88e1d9597d52": "Chamberí,Salamanca",
  "44be1e97-53b9-4ef6-854a-325c71dc8c49": "800",
  "955abadc-f35a-4137-b54c-a3c3bd713d34": "true",
  ...
}
```

La función `submit_formulario` castea automáticamente:
- integer/smallint/bigint/numeric → `Number(v)`
- boolean → `v === 'true'`
- "" → NULL
- texto → tal cual

---

## Constantes configuradas

```js
// El nombre de la variable quedó de cuando esto pasaba por n8n; desde el
// cutover del 22 de julio de 2026, n8n está inerte para este flujo y el
// destino real es el backend Node.js.
const N8N_WEBHOOK_URL = 'https://backend.automanize.com/webhook/formulario';
```

---

## Aviso al gestor tras el envío

Tras guardar el lead, `submit()` llama a `N8N_WEBHOOK_URL` con `{ token, tenant_id, telefono, cliente_id }` — el `token` es el `form_token` que acaba de devolver `submit_formulario`/`crear_lead_publico`, obligatorio para que el backend acepte la llamada. Para tenants sin WhatsApp, `telefono` es `null` y `cliente_id` identifica el lead creado con email.

Esa llamada es **best-effort respecto a la pantalla de éxito** (nunca bloquea al lead viendo "¡Solicitud enviada!"), pero su resultado **sí se registra siempre**:

```js
fetch(N8N_WEBHOOK_URL, { method: 'POST', headers: {...}, body: JSON.stringify({ token: formToken, tenant_id: S.tenantId, telefono: S.telefono, cliente_id: clienteId }) })
  .then(r => registrar_estado_webhook_formulario({ p_form_token: formToken, p_status: r.ok ? 'enviado' : 'error', p_error: ... }))
  .catch(err => registrar_estado_webhook_formulario({ p_form_token: formToken, p_status: 'error', p_error: String(err) }));
```

- `registrar_estado_webhook_formulario` (RPC, `SECURITY DEFINER`, otorgada a `anon`) escribe en `clientes.webhook_formulario_status` (`'pendiente'|'enviado'|'error'`), `webhook_formulario_error` y `webhook_formulario_enviado_en`.
- El backend procesa el matching y registra el resultado antes de responder `ok:true`; el canal del envío de opciones depende de la configuración WhatsApp del tenant.
- Desde Nize (repo `automanize-app`), la ficha del interesado muestra este estado con un banner y permite reenviar el aviso con el mismo `form_token` sin tener que tocar la base de datos a mano — ver `docs/CLIENTES.md` → "Reenvío de notificación WhatsApp al gestor" en ese repo.

---

## Pantallas de error

| errorKey | Cuándo |
|---|---|
| `notfound` | Token no existe en la BD |
| `expired` | `form_token_expira` ya pasó |
| `used` | `formulario_enviado = true` |
| `generic` | Error de red u otro inesperado |
