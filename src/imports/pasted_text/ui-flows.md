5. Flujos principales de UI
Flujo 1: Inicio de sesión de usuarios internos
Pantalla: Login administrativo
Objetivo

Permitir que aplicadores, psicólogos, consultores y administradores ingresen al sistema.

Elementos UI
Logo institucional / BFA Digital.
Campo de correo o nombre de usuario.
Campo de contraseña.
Botón Iniciar sesión.
Enlace Olvidé mi contraseña si se implementa.
Mensaje de error claro.
Validaciones
Usuario obligatorio.
Contraseña obligatoria.
Si credenciales inválidas:
“Usuario o contraseña incorrectos.”
Si usuario inactivo:
“Su cuenta no está activa. Contacte al administrador.”
Resultado técnico

Al iniciar sesión correctamente:

backend valida credenciales;
backend devuelve sesión/JWT;
UI consulta permisos;
se renderiza el dashboard según rol.
Flujo 2: Acceso de participante mediante link/token
Pantalla: Validación de acceso por token
Objetivo

Permitir que el participante entre sin usuario/contraseña tradicional, usando un link único.

Ruta sugerida
/evaluacion/acceso?token=...
Elementos UI
Logo BFA Digital.
Mensaje breve:
“Validando acceso a la evaluación…”
Estado de carga.
Si el token es válido, mostrar pantalla de bienvenida.
Si el token es inválido, vencido o usado incorrectamente, mostrar error.
Estados posibles
Estado	Mensaje UI
Token válido	“Acceso autorizado.”
Token vencido	“Este enlace ha expirado. Solicite uno nuevo al aplicador.”
Sesión cerrada	“La sesión de evaluación no está abierta.”
Evaluación completada	“Esta evaluación ya fue finalizada.”
Token inválido	“El enlace no es válido o no corresponde a una evaluación activa.”
Resultado técnico

La UI envía el token al backend. El backend:

calcula hash del token;
busca asignacion_test;
valida expiración;
valida estado de sesión;
valida subtests habilitados;
crea o recupera intento_test;
devuelve contexto seguro de evaluación.
Flujo 3: Bienvenida e instrucciones del participante
Pantalla: Bienvenida a la evaluación
Objetivo

Preparar al participante antes de iniciar la prueba.

Elementos UI
Nombre del participante o código.
Nombre de la evaluación.
Lista de subtests habilitados.
Duración estimada.
Reglas generales.
Advertencia de confidencialidad.
Botón Comenzar evaluación.
Contenido sugerido
Bienvenido/a a la evaluación BFA Digital.

Esta evaluación contiene los subtests habilitados por el aplicador.
Lea cuidadosamente cada instrucción antes de responder.
Sus respuestas serán guardadas durante el proceso.
Una vez finalizada la evaluación, no podrá modificar sus respuestas.
Validaciones
No permitir iniciar si la sesión no está abierta.
No permitir iniciar si no hay subtests habilitados.
No permitir iniciar si el token expiró.
Flujo 4: Aplicación digital de subtest

El modelo de requerimientos exige que el participante pueda responder Figuras idénticas, Desplazamiento y Espacial dentro de una sesión autorizada, con instrucciones, ítems visuales, opciones y control de avance.

Pantalla: Instrucciones del subtest
Elementos UI
Nombre del subtest.
Instrucciones específicas.
Tiempo límite, si aplica.
Cantidad de ítems.
Botón Iniciar subtest.
Reglas
Si el subtest tiene tiempo, iniciar contador al presionar Iniciar subtest.
Si el subtest no está habilitado en sesion_subtest, no debe mostrarse.
Si ya fue completado, mostrar estado finalizado.
Pantalla: Resolución de ítem
Layout recomendado
-------------------------------------------------
| Encabezado: Subtest / Progreso / Tiempo       |
-------------------------------------------------
| Instrucción breve del ítem                    |
|                                               |
| Imagen/enunciado principal                    |
|                                               |
| Opciones de respuesta                         |
| [A] imagen/texto   [B] imagen/texto           |
| [C] imagen/texto   [D] imagen/texto           |
|                                               |
-------------------------------------------------
| Anterior | Guardado automático | Siguiente    |
-------------------------------------------------
Elementos UI
Nombre del subtest.
Progreso: Ítem 5 de 30.
Temporizador, si aplica.
Enunciado textual.
Imagen principal, si aplica.
Opciones textuales o visuales.
Botón Anterior, si la navegación lo permite.
Botón Siguiente.
Indicador de guardado:
“Guardando…”
“Respuesta guardada”
“Sin conexión, se intentará guardar nuevamente”
Botón Finalizar subtest al llegar al último ítem.
Tipos de ítem soportados
Tipo	UI requerida
Solo texto	Enunciado + opciones o campo abierto
Solo imagen	Imagen principal + opciones
Texto e imagen	Enunciado + imagen + opciones
Comparación de imágenes	Imagen modelo + opciones visuales
Razonamiento verbal	Texto + opciones o respuesta abierta
Tipos de respuesta
Tipo	Componente UI
Opción única	Radio card / tarjeta seleccionable
Opción múltiple	Checkbox card
Texto abierto	Área de texto
Numérica	Campo numérico
Verdadero/Falso	Dos tarjetas seleccionables
Regla importante

La UI nunca debe indicar si una respuesta es correcta o incorrecta durante la evaluación.

Flujo 5: Guardado de respuestas

El requerimiento RF09 indica que el sistema debe guardar respuestas durante la evaluación para reducir riesgo de pérdida ante fallos de conexión o interrupciones.

Comportamiento UI

Cada vez que el participante seleccione una opción o escriba una respuesta:

La UI actualiza el estado local.
La UI envía la respuesta al backend.
El backend actualiza o crea respuesta_item.
La UI muestra estado de guardado.
Estados visibles
Estado técnico	Mensaje visual
Pendiente	“Guardando respuesta…”
Guardado	“Respuesta guardada”
Error temporal	“No se pudo guardar. Reintentando…”
Error final	“No se pudo guardar. Avise al aplicador.”
Comportamiento con red inestable

Si el sistema detecta pérdida de conexión:

mostrar banner superior:
“Conexión inestable. No cierre la ventana.”
conservar respuesta localmente;
reintentar envío;
bloquear finalización si hay respuestas pendientes de sincronizar.
Flujo 6: Finalización de subtest y evaluación
Pantalla: Resumen previo a finalizar
Objetivo

Permitir que el participante confirme que desea terminar.

Elementos UI
Subtests completados.
Ítems respondidos.
Ítems pendientes, si se permite ver esa información.
Advertencia:
Al finalizar, sus respuestas quedarán registradas y no podrán modificarse.
Botón Volver a revisar.
Botón primario Finalizar evaluación.
Resultado técnico

Al finalizar:

backend marca intento_test.estado = COMPLETADO;
backend bloquea modificación de respuestas;
backend calcula resultados;
backend registra auditoría/evento;
UI muestra confirmación.

El requerimiento RF10 establece que al finalizar debe registrarse el estado de la prueba y bloquearse la modificación no autorizada de respuestas.

Flujo 7: Gestión de participantes
Pantalla: Lista de participantes
Objetivo

Permitir registrar, consultar y administrar participantes.

El sistema debe registrar datos mínimos como código, nombre, edad, sexo, carrera o grupo.

Elementos UI
Tabla con:
código;
nombres;
apellidos;
edad;
sexo;
carrera;
grupo;
estado.
Filtros:
código;
nombre;
carrera;
grupo;
estado.
Botón Nuevo participante.
Botón Importar CSV/Excel, si se implementa.
Acción Editar.
Acción Desactivar.
Pantalla: Formulario de participante
Campos
Código único.
Nombres.
Apellidos.
Edad o fecha de nacimiento.
Sexo.
Carrera.
Grupo.
Estado.
Validaciones
Código obligatorio y único.
Nombres obligatorios.
Apellidos obligatorios.
Edad válida.
No solicitar datos sensibles innecesarios.
Flujo 8: Gestión de instrumentos y subtests
Pantalla: Lista de tests
Elementos UI
Código del test.
Nombre.
Versión actual.
Estado:
borrador;
publicado;
retirado.
Fecha de creación.
Acciones:
ver;
editar borrador;
duplicar versión;
publicar;
retirar.
Pantalla: Editor de versión de test
Secciones
Datos generales.
Subtests.
Ítems.
Opciones.
Imágenes.
Claves y puntajes.
Revisión final.
Publicación.
Pantalla: Configuración de subtest

El sistema debe permitir configurar los subtests Figuras idénticas, Desplazamiento y Espacial, incluyendo instrucciones, ítems, opciones, imágenes, tiempos, claves y reglas de calificación.

Campos
Código del subtest.
Nombre.
Instrucciones.
Orden.
Tiempo límite.
Permitir aleatorizar ítems.
Permitir aleatorizar opciones.
Estado.
Acciones
Crear subtest.
Editar subtest.
Reordenar subtests.
Activar/desactivar.
Pantalla: Editor de ítems
Layout recomendado
-------------------------------------------------
| Lista lateral de ítems                         |
| Ítem 1                                         |
| Ítem 2                                         |
| Ítem 3                                         |
-------------------------------------------------
| Panel principal                                |
| Código item                                    |
| Tipo de item                                   |
| Tipo de respuesta                              |
| Enunciado                                      |
| Imágenes asociadas                             |
| Opciones                                       |
| Clave y puntaje                                |
-------------------------------------------------
Campos del ítem
Código.
Tipo de ítem.
Tipo de respuesta.
Enunciado.
Instrucción.
Orden.
Puntaje base.
Peso.
Tiempo límite.
Confidencialidad.
Estado.
Acciones
Agregar ítem.
Duplicar ítem.
Reordenar ítem.
Agregar imagen.
Agregar opción.
Configurar clave.
Vista previa segura.
Flujo 9: Carga y uso de imágenes
Pantalla: Carga de recurso multimedia
Elementos UI
Selector de archivo.
Vista previa.
Nombre del archivo.
Tipo MIME detectado.
Tamaño.
Estado de confidencialidad.
Rol de la imagen:
enunciado;
referencia;
opción;
apoyo visual.
Botón Subir imagen.
Reglas
Solo aceptar formatos autorizados:
PNG;
JPG/JPEG;
WEBP si se permite.
Validar tamaño máximo.
Mostrar advertencia:
Las imágenes de los ítems son confidenciales y no deben compartirse fuera del sistema.
Funcionamiento real

La UI no debe recibir una ruta pública permanente. Debe recibir una URL temporal o un endpoint protegido. La arquitectura propuesta contempla almacenamiento protegido de imágenes/ítems junto con API segura, base relacional y dashboards.

Flujo 10: Configuración de claves y puntajes
Pantalla: Clave de respuesta
Objetivo

Permitir que el psicólogo/coordinador configure qué respuesta es correcta y qué puntaje otorga.

Elementos UI según tipo de respuesta
Opción única
Lista de opciones.
Selector de opción correcta.
Puntaje.
Peso.
Opción múltiple
Varias opciones correctas.
Puntaje por opción o puntaje total.
Penalización, si se implementa en futuro.
Texto abierto
Marcar como Requiere revisión manual.
Puntaje máximo.
Criterio de revisión textual interno.
Numérica
Valor esperado.
Tolerancia, si aplica.
Puntaje.
Restricciones
No mostrar esta pantalla a aplicadores ni participantes.
Cambios en claves deben auditarse.
No permitir modificar claves de una versión publicada sin crear nueva versión.
Flujo 11: Publicación de versión
Pantalla: Revisión y publicación
Objetivo

Evitar que una versión incompleta sea utilizada en sesiones reales.

Checklist UI

Antes de publicar, la interfaz debe validar:

test tiene nombre y código;
versión tiene instrucciones;
existen subtests;
cada subtest tiene ítems;
cada ítem tiene tipo de respuesta;
cada ítem de opción tiene opciones;
cada ítem automático tiene clave;
las imágenes requeridas están cargadas;
los puntajes están definidos;
no hay ítems inactivos dentro de flujo activo.
Botón

Publicar versión

Advertencia
Una vez publicada, esta versión no debe modificarse directamente.
Para cambios posteriores deberá crear una nueva versión.
Flujo 12: Creación de sesión de aplicación
Pantalla: Nueva sesión

El requerimiento RF04 establece que el aplicador debe crear sesiones controladas definiendo fecha, participantes, subtests habilitados, estado y condiciones de aplicación.

Campos
Código de sesión.
Nombre.
Descripción.
Fecha y hora de inicio.
Fecha y hora de cierre.
Ubicación.
Test/versión.
Subtests habilitados.
Configuración de aleatorización.
Evaluador responsable.
Selector de subtests

Debe mostrar tarjetas:

[ ] Figuras idénticas
[ ] Desplazamiento
[ ] Espacial

Cada tarjeta debe incluir:

nombre;
instrucciones resumidas;
tiempo límite;
cantidad de ítems;
estado del subtest;
orden de aplicación.
Acciones
Guardar como programada.
Abrir sesión.
Cancelar.
Cerrar sesión.
Flujo 13: Asignación de participantes y generación de tokens
Pantalla: Participantes de la sesión
Elementos UI
Buscador de participantes.
Tabla de participantes asignados.
Estado de token.
Estado de evaluación.
Botón Agregar participante.
Botón Generar tokens.
Botón Copiar enlace.
Botón Reenviar enlace, si se implementa.
Columnas sugeridas
Código	Nombre	Grupo	Estado token	Estado evaluación	Acciones
Estados de token
Generado.
No generado.
Vencido.
Usado.
Revocado.
Reglas
El token debe generarse solo para participantes asignados.
No mostrar el token completo después de creado, solo permitir copiar link en el momento autorizado.
Guardar hash en base de datos, no token plano.
Permitir regenerar token si el anterior venció.
Flujo 14: Supervisión de sesión
Pantalla: Monitor de sesión
Objetivo

Permitir al aplicador supervisar una sesión grupal.

Elementos UI
Resumen:
participantes asignados;
no iniciados;
en progreso;
completados;
interrumpidos.
Tabla en tiempo real:
participante;
subtest actual;
progreso;
última actividad;
estado;
incidencias.
Filtros por estado.
Botón Cerrar sesión.
Botón Exportar listado de avance, si aplica.
Estados de evaluación
Estado	Color sugerido
No iniciado	Gris
En progreso	Azul
Completado	Verde
Interrumpido	Amarillo
Anulado	Rojo
Acciones del aplicador
Ver progreso.
Marcar incidencia.
Regenerar token.
Anular asignación.
Cerrar sesión.
Flujo 15: Resultados individuales
Pantalla: Resultado individual
Objetivo

Mostrar resultados cuantitativos autorizados.

El sistema debe permitir consultar resultados individuales con puntajes por subtest y la información aprobada para interpretación.

Elementos UI
Datos mínimos del participante.
Sesión.
Test y versión.
Estado de evaluación.
Puntaje total directo.
Tabla por subtest:
subtest;
cantidad de ítems;
correctas;
incorrectas;
pendientes de revisión;
puntaje directo.
Botón Exportar PDF.
Botón Exportar Excel/CSV, según permisos.
Restricción

No mostrar diagnóstico psicológico definitivo.

El sistema puede generar resultados, pero no debe emitir diagnósticos automáticos ni sustituir el criterio profesional.

Flujo 16: Revisión manual de respuestas abiertas
Pantalla: Bandeja de revisión
Objetivo

Permitir revisar respuestas abiertas que no pueden calificarse automáticamente.

Elementos UI
Filtro por sesión.
Filtro por subtest.
Filtro por participante.
Tabla:
participante;
ítem;
respuesta;
estado;
puntaje manual;
revisor.
Botón Revisar.
Pantalla: Revisión de respuesta
Elementos
Enunciado.
Respuesta del participante.
Criterio de evaluación.
Campo puntaje.
Comentario interno opcional.
Botón Guardar revisión.
Resultado técnico
Actualiza respuesta_item.puntaje_manual.
Marca revisado_por.
Marca revisado_en.
Recalcula resultado si corresponde.
Registra auditoría.
Flujo 17: Resultados agregados y dashboard
Pantalla: Dashboard de resultados
Objetivo

Mostrar indicadores agregados para usuarios autorizados.

El sistema debe permitir resultados agrupados por sesión, grupo, carrera, edad, sexo, subtest u otros criterios aprobados.

Indicadores sugeridos
Total de participantes evaluados.
Evaluaciones completadas.
Evaluaciones en progreso.
Promedio de puntaje directo.
Promedio por subtest.
Distribución de correctas/incorrectas.
Resultados por grupo.
Resultados por carrera.
Resultados por sexo.
Resultados por edad.
Filtros
Sesión.
Fecha.
Grupo.
Carrera.
Sexo.
Edad.
Subtest.
Estado de evaluación.
Visualizaciones
Tarjetas de métricas.
Gráfico de barras por subtest.
Tabla comparativa por grupo.
Tabla exportable.
Línea de tiempo de aplicaciones, si aplica.
Flujo 18: Exportación de reportes
Pantalla: Centro de reportes
Tipos de reporte
Reporte individual.
Reporte por sesión.
Reporte agregado.
Reporte de avance.
Reporte de auditoría, solo administrador.
Formatos
PDF.
Excel.
CSV.

El requerimiento RF14 establece exportación de reportes individuales o agregados en PDF, Excel o CSV.

Elementos UI
Tipo de reporte.
Filtros.
Vista previa.
Botón Generar reporte.
Historial de reportes generados.
Botón Descargar.
Reglas
Toda exportación debe auditarse.
Los reportes individuales solo deben estar disponibles para usuarios autorizados.
Los reportes generados deben guardarse en almacenamiento protegido.
Flujo 19: Auditoría
Pantalla: Auditoría y trazabilidad
Objetivo

Permitir revisar acciones sensibles.

El requerimiento RF15 exige registrar inicio de sesión, creación de sesiones, configuración de subtests, consultas de resultados, exportaciones, cambios de permisos y accesos a información sensible.

Filtros
Usuario.
Acción.
Entidad.
Fecha.
IP.
Tipo de evento.
Tabla
Fecha	Usuario	Acción	Entidad	ID entidad	IP	Detalle
Acciones auditables desde UI
Inicio de sesión.
Creación de sesión.
Edición de instrumento.
Carga de imagen.
Cambio de clave.
Publicación de versión.
Consulta de resultado.
Exportación de reporte.
Cambio de permisos.
Regeneración de token.
Flujo 20: Administración de usuarios, roles y permisos
Pantalla: Usuarios
Elementos UI
Tabla de usuarios.
Filtro por rol.
Filtro por estado.
Botón Nuevo usuario.
Acción Editar.
Acción Activar/desactivar.
Acción Asignar roles.
Pantalla: Roles y permisos
Elementos
Lista de roles.
Matriz de permisos.
Checkboxes por permiso.
Botón Guardar cambios.
Regla

Cambios de permisos deben registrarse en auditoría.