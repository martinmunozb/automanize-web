# Vídeo de producto de nize.html

El reproductor del hero de `nize.html` ya está montado. Para publicar el vídeo
basta con dejar los ficheros en esta carpeta con estos nombres exactos. **No hay
que tocar HTML, CSS ni JS.**

```
assets/video/nize-demo.mp4        ← obligatorio (el que garantiza compatibilidad)
assets/video/nize-demo.webm       ← opcional, recomendado (mejor calidad por MB)
assets/video/nize-demo.av1.mp4    ← opcional, la mejor calidad de las tres
```

El navegador coge la primera que entiende, en este orden: **AV1 → VP9 → H.264**.
Con solo el `.mp4` ya funciona en todas partes; los otros dos son mejora.

El póster (`assets/images/nize-demo-poster-1920.webp`) ya está generado a partir
de la captura del panel. Si el vídeo empieza por otro fotograma, regenéralo para
que no se note el salto al arrancar.

---

## Cómo exportar

Grábalo o expórtalo a **1920×1080** (Full HD). No subas 4K: en el hero se ve a
menos de 1000 px de ancho, así que 4K solo multiplica el peso sin que se note.

Con [ffmpeg](https://ffmpeg.org/), desde la carpeta donde tengas el original:

### 1. MP4 / H.264 — el obligatorio

```bash
ffmpeg -i original.mov \
  -vf "scale=1920:-2" \
  -c:v libx264 -preset slow -crf 20 \
  -profile:v high -level 4.0 -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  nize-demo.mp4
```

- `-crf 20` es calidad alta. Baja a 18 si quieres más (pesará más); sube a 23
  si te importa el peso.
- **`-movflags +faststart` no es opcional**: mueve el índice al principio del
  fichero para que el vídeo empiece a verse mientras descarga. Sin eso, el
  navegador se traga el fichero entero antes de pintar el primer fotograma.
- `-pix_fmt yuv420p` es lo que hace que se vea en Safari y en móviles.

### 2. WebM / VP9 — recomendado

```bash
ffmpeg -i original.mov \
  -vf "scale=1920:-2" \
  -c:v libvpx-vp9 -crf 30 -b:v 0 -row-mt 1 \
  -c:a libopus -b:a 128k \
  nize-demo.webm
```

Misma calidad que el MP4 ocupando bastante menos. `-b:v 0` activa el modo de
calidad constante: sin eso, `-crf` se ignora.

### 3. AV1 — la mejor calidad, opcional

```bash
ffmpeg -i original.mov \
  -vf "scale=1920:-2" \
  -c:v libsvtav1 -crf 32 -preset 6 \
  -c:a libopus -b:a 128k \
  -movflags +faststart \
  nize-demo.av1.mp4
```

Tarda más en codificar y no lo soportan los equipos antiguos, pero quien pueda
verlo lo verá mejor y descargando menos.

---

## Peso recomendado

Apunta a **menos de 8 MB** para un vídeo de 20-30 segundos. Es lo que va a
descargar todo el que entre a la página, y por encima de eso se nota.

Comprueba el peso final antes de subir:

```bash
ls -lh nize-demo.*
```

---

## Cómo se comporta el reproductor

- **Arranca solo** al entrar en pantalla y se **pausa al salir**, para no gastar
  batería y datos con el vídeo fuera de vista.
- **Empieza en silencio**, porque ningún navegador permite el autoplay con
  sonido. Aparece un botón «Activar sonido» abajo a la derecha, y solo si el
  fichero trae pista de audio.
- **Se repite en bucle.** Si el vídeo lleva narración y prefieres que se pare al
  acabar, quita `loop` del `<video>` en `nize.html`.
- Con **«reducir movimiento»** activado en el sistema no arranca solo: se queda
  el póster con los controles.
- Si el navegador bloquea el autoplay igualmente, aparecen los controles para
  que se pueda dar al play a mano.

## Si quieres cambiar algo

| Qué | Dónde |
|---|---|
| Que no se repita | quitar `loop` en `nize.html` |
| Que arranque con sonido | no se puede: lo bloquean todos los navegadores |
| Que no arranque solo | quitar `autoplay` y poner `controls` en `nize.html` |
| Cambiar el póster | `assets/images/nize-demo-poster-1920.webp` |
| Estilos del botón de sonido | `.video-sound` en `landing.css` |
