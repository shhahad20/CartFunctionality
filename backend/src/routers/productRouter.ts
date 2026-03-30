import { Router } from 'express';
import { home } from '../controllers/homeController.js';
import { getProductById, getProducts } from '../controllers/productController.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);


export default router;