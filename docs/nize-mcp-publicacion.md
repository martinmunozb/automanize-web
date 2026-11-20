# Política pública del conector MCP de Nize

Estado al 11/11/2026: política desplegada y verificada en producción.

`nize-privacy.html` describe expresamente el conector opcional de Nize para ChatGPT y Claude: OAuth y revocación, aislamiento por empresa, rol y permisos, categorías excluidas de las respuestas, destinatarios, conservación de tokens y auditoría, y ausencia de almacenamiento de la conversación completa.

La publicación de esta página no abre el MCP ni cambia permisos. Es un requisito informativo de los directorios de OpenAI y Anthropic. `https://automanize.com/nize-privacy` devuelve 200 a `ChatGPT-User`, `OAI-SearchBot` y `Claude-User`; las páginas privadas continúan bloqueadas para esos agentes.

La ruta ya pertenece a la familia pública de páginas de marketing vigilada por el host. No introduce una ruta nueva de acceso a datos ni necesita ampliar el monitor de Supabase.
