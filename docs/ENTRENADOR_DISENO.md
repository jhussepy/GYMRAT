# Modo entrenador — diseño (DESACTIVADO)

Estado: **diseño, sin activar**. No hay endpoints públicos ni cambios de acceso a datos.
Motivo: el entrenador vería datos de salud de otra persona. Eso requiere revisión legal y pruebas de seguridad antes de activarlo.

## 1. Modelo de cuentas

- Cada cuenta es **cliente** por defecto. Un **entrenador** es una cuenta con rol `coach`, asignado manualmente por el administrador (no por autoinscripción).
- Un vínculo `coach_link` une un entrenador con un cliente y tiene estado: `invited` → `active` → `revoked`.
- Un cliente puede tener **un** entrenador activo a la vez (simplifica permisos).

## 2. Consentimiento (requisito previo)

- El **cliente** inicia o acepta la invitación. El entrenador no puede forzar un vínculo.
- El consentimiento es **por categoría de dato**, desmarcado por defecto:
  - [ ] Entrenamientos y series
  - [ ] Peso y medidas corporales
  - [ ] Comidas y calorías
  - [ ] Sueño y recuperación
  - [ ] Fotos de progreso → **nunca** (las fotos viven solo en el dispositivo, fuera de la nube)
- Se guarda **fecha y versión** del texto aceptado.
- El cliente puede **revocar** en cualquier momento; el acceso se corta en la misma petición, no en la siguiente sincronización.

## 3. Reglas de acceso (servidor)

- Toda lectura de datos de un cliente comprueba **en el servidor**: rol `coach`, vínculo `active`, categoría autorizada y vigencia.
- El entrenador **no puede escribir** en el estado del cliente. Solo lee.
- Cada lectura queda registrada en un registro de auditoría (quién, qué categoría, cuándo).
- Por defecto, el vínculo caduca a los **90 días** y hay que renovarlo.

## 4. Lo que NO se hace

- Ningún dato sale a terceros fuera de este vínculo: ni a analítica, ni a otros entrenadores, ni a IA.
- Las fotos de progreso no se comparten.
- Un entrenador no ve datos de clientes que no le hayan vinculado.

## 5. Antes de activarlo

- [ ] Revisión legal de la base del tratamiento de datos de salud de un tercero (el entrenador como destinatario).
- [ ] Actualizar la Política de privacidad y los Términos (entrenadores, consentimiento por categoría, auditoría).
- [ ] Pruebas de seguridad: un entrenador no puede leer clientes sin vínculo, ni tras revocación, ni categorías no autorizadas.
- [ ] Probar la revocación: el acceso debe cortarse de inmediato.
- [ ] Decidir el proveedor y el lugar de los registros de auditoría.

## 6. Versión del estado

Cuando se implemente, los vínculos se guardarán fuera del estado personal (tabla propia en Supabase), para que ninguna versión antigua de la app pueda sobrescribirlos.
