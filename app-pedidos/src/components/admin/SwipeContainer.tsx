import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import CatalogManager from './CatalogManager';
import KdsBoard from './KdsBoard';

const SwipeContainer: React.FC = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    return (
        <div className="w-full h-full">
            <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                    <Tab
                        className={({ selected }) =>
                            `w-full py-2.5 text-sm font-medium leading-5 text-blue-700 rounded-lg ${
                                selected ? 'bg-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                            }`
                        }
                    >
                        Catalogo
                    </Tab>
                    <Tab
                        className={({ selected }) =>
                            `w-full py-2.5 text-sm font-medium leading-5 text-blue-700 rounded-lg ${
                                selected ? 'bg-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                            }`
                        }
                    >
                        KDS
                    </Tab>
                </Tab.List>
                <Tab.Panels className="mt-2">
                    <Tab.Panel>
                        <CatalogManager />
                    </Tab.Panel>
                    <Tab.Panel>
                        <KdsBoard />
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
};

export default SwipeContainer;