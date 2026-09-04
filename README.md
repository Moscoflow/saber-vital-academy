# Saber Vital Academy — V1

Primera versión funcional de frontend construida con los materiales suministrados.

Incluye:
- Home responsive.
- Video de inicio integrado.
- Catálogo con 108 cursos cargados desde las piezas suministradas.
- Búsqueda, filtros por categoría y precio, ordenamiento y paginación.
- Ficha individual de curso.
- Carrito con persistencia local del navegador.
- Pantallas de inicio de sesión y registro con validaciones visuales.
- Diseño responsive para móvil, tablet y escritorio.

No incluye todavía:
- Base de datos.
- Autenticación real.
- Pasarela de pago real.
- Aula virtual.
- Certificados.
- Panel administrativo.

## Cómo abrir
Abre `index.html` en un navegador moderno. Para una vista más fiable, sirve la carpeta con un servidor web local.

Ejemplo con Python:

    python -m http.server 8080

Luego abre `http://localhost:8080`.

## Próxima fase recomendada
Migrar este frontend aprobado a Next.js + Supabase/PostgreSQL y conectar Wompi o Mercado Pago.
