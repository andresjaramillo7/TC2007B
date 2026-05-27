const swaggerJSDoc = require('swagger-jsdoc');

const options = {
definition: {
openapi: '3.0.0', // 🔥 ESTA LÍNEA ES LA CLAVE
info: {
title: 'API Backend Actividad',
version: '1.0.0',
description: 'Documentación de API con Swagger'
},
servers: [
{
url: 'http://localhost:3000'
}
]
},
apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
