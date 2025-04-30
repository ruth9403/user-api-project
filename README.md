
## Descripción

Este proyecto vacío, con ciertas utilidades, se entrega como material para facilitar el desarollo de la prueba técnica

Corresponde al desarrollador construir la funcionalidad. Para ejecutar el API se puede hacer mediante:
  ```
  npm start
  ```

Como utilidades para agilizar el desarrollo se incluye lo siguiente:

- Una capreta "lib" con un objeto de conexión a SQLite. Aunque el desarrollador tiene la libertad de usar lo que considere en este aspecto.

- En el caso de que se desee utilizar SQLite, existe una carpeta "sql" con un script que ejecuta las queries iniciales para crear el esquema de base de datos, el script ejecutará las sentencias escritas en el fichero createSchema.sql de la misma carpeta. para ejecutarlo sería de la siguiente forma:
  ```
  npm run create-db
  ```
- Un objeto en la carpeta "services" para realizar peticiones al API externa que procesa usuarios del hemisferio sur


## Requisitos

- Uso de Node.js y framework Express.js
- Uso de base de datos relacional SQL para alojar los datos.
- Uso de lenguaje SQL (no usar ORM)
- La programación asíncrona debe realizarse mediante promesas o async/await.
- Entrada y salida del API en formato JSON
- Antes de procesar cada petición, se debe imprimir un log con la información correspondiente, método, path y parámetros.
- Control de errores y excepciones.
- Buena organización y estilo de código intentando seguir un patrón de diseño en el que la lógica y el modelo de datos sean independientes.

## Criterios y Asumsiones
- Las querys planteadas para listar los amigos de un usuario `?:userId` se realizan crearon bajo el supuesto de que existe una tabla  `friendship` con la siguiente estructura y restriciones, _en este proyecto aún no se encuentran implementadas, solo se conceptualiza para el futuro desarrollo_

// Create table friendship
```
--Create Table friendship 
CREATE TABLE IF NOT EXISTS friendship (
  user_id1 TEXT NOT NULL,
  user_id2 TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id1, user_id2),
  FOREIGN KEY (user_id1) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id2) REFERENCES user(id) ON DELETE CASCADE,
  CONSTRAINT no_self_friendship CHECK (user_id1 != user_id2)
);
```

 - Usa ambos IDs (user_id1 y user_id2) como clave primaria, dado que serian UUIDs.
 - Relacion 1:N, insertando los UUID correspondientes de los user de manera ordenada desde el endpoint de la app aplicando sort de tal manera que siempre (A,B) se almacene de `A<B` y no se consideren como distintos registros como (B,A).
 -Posteriormente, se podrìan listar los users utilizando las siguientes querys:

// User del norte
```
// Query to List friends, ONLY friends from the North (stored in our DB):

SELECT u.id, u.username, u.email, u.latitude, u.longitude, u.browser_language
FROM friendship f
JOIN user u ON (u.id = f.user_id2 OR u.id = f.user_id1)
WHERE (f.user_id1 = ? OR f.user_id2 = ?) AND u.id != ?;
```
// Users del Sur:
```
--Query to Count friends, ONLY friends from the North (stored in our DB):
/* SELECT COUNT(*) as friend_total
FROM friendship
WHERE user_id1 = ? OR user_id2 = ?; */
```

- Por otro lado, se usó la mocked API del archivo `southernUsersApi.service.js` como el servicio externo que simula el crud para lso usuarios del sur, solo se crearon los métodos necesarios, pero básicamente solo simula la demora de un proceso I/O.