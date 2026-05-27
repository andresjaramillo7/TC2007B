require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const elementsRoutes = require('./routes/elements.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
    message: 'API funcionando correctamente'
});
});

app.use('/api/elements', elementsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Swagger en http://localhost:${PORT}/api-docs`);
});