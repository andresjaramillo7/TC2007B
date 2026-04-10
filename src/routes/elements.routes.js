const express = require('express');
const router = express.Router();

let elements = [
  { id: 1, name: 'Elemento 1', description: 'Descripción del elemento 1' },
  { id: 2, name: 'Elemento 2', description: 'Descripción del elemento 2' }
];

/**
 * @swagger
 * tags:
 *   name: Elements
 *   description: API para gestionar elementos
 */

/**
 * @swagger
 * /api/elements:
 *   get:
 *     summary: Obtener todos los elementos
 *     tags: [Elements]
 *     responses:
 *       200:
 *         description: Lista de elementos
 */
router.get('/', (req, res) => {
  res.json(elements);
});

/**
 * @swagger
 * /api/elements/{id}:
 *   get:
 *     summary: Obtener un elemento por ID
 *     tags: [Elements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del elemento
 *     responses:
 *       200:
 *         description: Elemento encontrado
 *       404:
 *         description: Elemento no encontrado
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const element = elements.find(e => e.id === id);

  if (!element) {
    return res.status(404).json({ message: 'Elemento no encontrado' });
  }

  res.json(element);
});

/**
 * @swagger
 * /api/elements:
 *   post:
 *     summary: Crear un nuevo elemento
 *     tags: [Elements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Elemento creado correctamente
 */
router.post('/', (req, res) => {
  const { name, description } = req.body;

  const newElement = {
    id: elements.length > 0 ? elements[elements.length - 1].id + 1 : 1,
    name,
    description
  };

  elements.push(newElement);
  res.status(201).json(newElement);
});

/**
 * @swagger
 * /api/elements/{id}:
 *   put:
 *     summary: Actualizar un elemento por ID
 *     tags: [Elements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Elemento actualizado
 *       404:
 *         description: Elemento no encontrado
 */
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    const index = elements.findIndex(e => e.id === id);
    
    if (index === -1) {
        return res.status(404).json({ message: 'Elemento no encontrado' });
    }
    
    elements[index] = { id, name, description };
    res.json(elements[index]);
});

/**
 * @swagger
 * /api/elements/{id}:
 *   delete:
 *     summary: Eliminar un elemento por ID
 *     tags: [Elements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Elemento eliminado
 *       404:
 *         description: Elemento no encontrado
 */
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = elements.findIndex(e => e.id === id);

    if (index === -1) {
    return res.status(404).json({ message: 'Elemento no encontrado' });
}
const deletedElement = elements.splice(index, 1);
res.json({
    message: 'Elemento eliminado correctamente',
    element: deletedElement[0]
});
});

module.exports = router;