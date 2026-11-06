# FacturaIA

Aplicación web de prueba para leer fotografías de tickets, organizar datos y exportarlos a Excel.

## Incluye
- OCR en navegador con Tesseract.js (español e inglés).
- Extracción estructurada con `@chirag127/keyless-ai`.
- Clientes e historial guardados en `localStorage`.
- Exportación Excel con hojas Resumen, Productos y Validaciones.
- Preparación de configuración Supabase, todavía desactivada.
- Preparado para despliegue en Vercel.

## Ejecutar localmente
1. Instala Node.js.
2. En la carpeta del proyecto ejecuta `npm install`.
3. Ejecuta `npm run dev`.
4. Abre la URL local indicada por Vercel.

## Desplegar en Vercel
Sube el contenido de esta carpeta a un repositorio GitHub e impórtalo desde Vercel. No requiere build command especial; el proyecto usa `index.html` y funciones dentro de `api/`.

## Configuración IA
La ruta `api/procesar.js` utiliza `@chirag127/keyless-ai`. El modelo se puede cambiar con la variable `KEYLESS_MODEL`; por defecto usa `kilo-auto/free`. La disponibilidad depende de los proveedores comunitarios de la librería y sus límites. Si falla, el formulario permite completar los campos manualmente.

## Supabase (pendiente)
Supabase NO está conectado en esta versión. Cuando el propietario facilite URL y credenciales, debe implementarse la conexión desde funciones serverless. Nunca publiques `SUPABASE_SERVICE_ROLE_KEY` en el frontend ni en GitHub.

## Privacidad y límites
Las fotografías se procesan en el navegador y no se guardan ni suben a una carpeta del servidor. Los registros actuales se almacenan solo en el `localStorage` del navegador/dispositivo; no se sincronizan entre dispositivos. No se ha implementado autenticación multiusuario.

Esta herramienta organiza información y genera hojas Excel para revisión. **No emite facturas fiscales oficiales ni realiza timbrado.** Para emisión legal se necesita integrar el proveedor/PAC autorizado y los certificados/requisitos fiscales correspondientes del país.

## Estado
Proyecto inicial de prueba. Antes de usar con información real, probar el OCR, revisar los datos extraídos y verificar el despliegue y las variables de entorno.
