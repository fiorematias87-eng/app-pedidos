import React, { useState } from 'react';

const SearchFilters: React.FC<{ onFilterChange: (filters: any) => void }> = ({ onFilterChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAllergen, setSelectedAllergen] = useState<string | null>(null);
    const allergens = ['Gluten', 'Lactose', 'Nuts', 'Soy', 'Shellfish'];

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        onFilterChange({ searchTerm: e.target.value, selectedAllergen });
    };

    const handleAllergenChange = (allergen: string) => {
        const newAllergen = selectedAllergen === allergen ? null : allergen;
        setSelectedAllergen(newAllergen);
        onFilterChange({ searchTerm, selectedAllergen: newAllergen });
    };

    return (
        <div className="flex flex-col space-y-4 p-4 bg-gray-800 rounded-lg">
            <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="p-2 rounded border border-gray-300"
            />
            <div className="flex flex-wrap">
                {allergens.map((allergen) => (
                    <button
                        key={allergen}
                        onClick={() => handleAllergenChange(allergen)}
                        className={`m-1 p-2 rounded ${selectedAllergen === allergen ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        {allergen}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchFilters;