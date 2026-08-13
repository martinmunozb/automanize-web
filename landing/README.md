# Landing Nize — Automanize

Landing page de Automanize (CRM Nize) construida sobre la plantilla
[shadcn-landing-page](https://github.com/leoMirandaa/shadcn-landing-page)
de Leo Miranda (MIT). Se ha mantenido el diseño original y solo se ha
sustituido el contenido.

## Arrancar

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # genera dist/
```

## Secciones

| Componente | Contenido |
|---|---|
| `Navbar` | Logo, enlaces y botón con pop-up |
| `Hero` | Logo, titular, subtitular, 3 beneficios y botón con pop-up |
| `About` | "Somos Martín, Gabi y Antonio" + botón con pop-up |
| `FAQ` | Las 4 preguntas frecuentes |
| `Pricing` | Pack Nize Premium y Pack Nize Elite Gold + botón con pop-up |
| `Footer` | Enlaces y contacto |

Todos los botones abren el mismo pop-up: `src/components/CtaButton.tsx`.

## Formulario del pop-up

El pop-up recoge nombre, email, teléfono e inmuebles (opcional) y hace un
`POST` en JSON al endpoint definido en la variable de entorno
`VITE_LEAD_WEBHOOK_URL`.

```bash
cp .env.example .env
# y descomenta / ajusta la URL dentro de .env
```

Si la variable no está definida, el formulario no envía nada: muestra la
pantalla de confirmación y escribe el lead en la consola del navegador.

## Pendiente de decidir

- **Precios**: no se muestran importes. En `src/components/Pricing.tsx`, cada
  pack tiene el campo `price: null`; al ponerle un número se renderiza
  `XX€ /mes` en lugar de "7 días gratis".
