import React, { useEffect, useState } from 'react';
import { Product } from '../../types/delivery';
import { fetchProducts } from '../../services/productsService';
import SearchFilters from './SearchFilters';
import CartPanel from './CartPanel';
import LiveTrackerPanel from './LiveTrackerPanel';
import Spinner from '../common/Spinner';

const CatalogView: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const fetchedProducts = await fetchProducts();
                setProducts(fetchedProducts);
            } catch (err) {
                setError('Error fetching products');
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    if (loading) {
        return <Spinner />;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col">
            <SearchFilters />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                    <div key={product.id} className="p-4 border rounded shadow">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p>{product.description}</p>
                        <p className="font-bold">${product.price.toFixed(2)}</p>
                    </div>
                ))}
            </div>
            <CartPanel />
            <LiveTrackerPanel />
        </div>
    );
};

export default CatalogView;