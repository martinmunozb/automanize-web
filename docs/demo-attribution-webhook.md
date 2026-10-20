# Campañas del formulario de demo

`solicitar-demo.html` captura `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content` y `utm_term`, junto con `landing_url`. Conserva la última campaña
en la misma pestaña hasta 24 horas; una URL con UTM sustituye la campaña anterior.
Funciona sin sessionStorage, usando los parámetros de la visita actual.

El POST a `trial-signup` incluye `attribution`. La función normaliza esos datos
y los guarda en `user_metadata.attribution` del usuario Auth (solo tras un alta
correcta quedan asociados a una cuenta).

Tras crear usuario, tenant, perfil y activación, el servidor envía un POST JSON
al secreto `TRIAL_SIGNUP_WEBHOOK_URL`. Sin ese secreto no envía nada.
Opcionalmente `TRIAL_SIGNUP_WEBHOOK_TOKEN` añade `Authorization: Bearer …`.
No se envían contraseñas ni códigos de activación.

Ejemplo de cuerpo:

```json
{
  "event": "nize.trial_signup",
  "event_id": "trial_signup:<tenant_id>",
  "created_at": "2026-10-20T12:00:00.000Z",
  "tenant_id": "<tenant_id>",
  "nombre": "Contacto de ejemplo",
  "email": "contacto@example.com",
  "telefono": "+34600000000",
  "attribution": {
    "utm_source": "fbads",
    "utm_medium": "ad1",
    "landing_url": "https://automanize.com/solicitar-demo?utm_source=fbads&utm_medium=ad1"
  }
}
```

Hasta tres intentos ante fallos de red, HTTP 429 o 5xx, con cinco segundos de
timeout por intento. El receptor debe deduplicar por `event_id`. Un fallo no
bloquea la cuenta; se registra en los logs de la función. No hay cola persistente
de reenvío tras agotar los intentos.

Para activar: publicar la web, desplegar `trial-signup` y configurar la URL
HTTPS de destino cuando esté disponible (y token si el receptor lo requiere).
