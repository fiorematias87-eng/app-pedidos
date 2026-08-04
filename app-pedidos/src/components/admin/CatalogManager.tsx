import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, addProduct, updateProduct, deleteProduct } from '../../services/productsService';
import { selectProducts } from '../../store/slices/adminSlice';
import Button from '../common/Button';
import Modal from '../common/Modal';

const CatalogManager = () => {
    const dispatch = useDispatch();
    const products = useSelector(selectProducts);
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', stock: '' });

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleAddOrUpdateProduct = () => {
        if (currentProduct) {
            dispatch(updateProduct({ ...formData, id: currentProduct.id }));
        } else {
            dispatch(addProduct(formData));
        }
        setModalOpen(false);
        setFormData({ name: '', price: '', stock: '' });
        setCurrentProduct(null);
    };

    const handleEditProduct = (product) => {
        setCurrentProduct(product);
        setFormData({ name: product.name, price: product.price, stock: product.stock });
        setModalOpen(true);
    };

    const handleDeleteProduct = (id) => {
        dispatch(deleteProduct(id));
    };

    return (
        <div className="catalog-manager">
            <Button onClick={() => setModalOpen(true)}>Add Product</Button>
            <ul>
                {products.map(product => (
                    <li key={product.id}>
                        <span>{product.name} - ${product.price} (Stock: {product.stock})</span>
                        <Button onClick={() => handleEditProduct(product)}>Edit</Button>
                        <Button onClick={() => handleDeleteProduct(product.id)}>Delete</Button>
                    </li>
                ))}
            </ul>
            {isModalOpen && (
                <Modal onClose={() => setModalOpen(false)}>
                    <h2>{currentProduct ? 'Edit Product' : 'Add Product'}</h2>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Product Name"
                    />
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Price"
                    />
                    <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        placeholder="Stock"
                    />
                    <Button onClick={handleAddOrUpdateProduct}>
                        {currentProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                </Modal>
            )}
        </div>
    );
};

export default CatalogManager;