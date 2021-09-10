import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { Alert } from 'react-native';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsLoaded = await AsyncStorage.getItem('@products');

      if (productsLoaded) {
        setProducts([...JSON.parse(productsLoaded)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const newProduct: Product = {
        ...product,
        quantity: 1,
      };

      if (products.find(p => p.id === product.id)) {
        Alert.alert('Product already added to the cart !');
        return;
      }

      setProducts(p => p.concat(newProduct));
      const productsClone = products.slice();

      await AsyncStorage.setItem(`@products`, JSON.stringify(productsClone));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsClone = products.slice();
      const product = productsClone.find(p => p.id === id);

      if (product) {
        product.quantity += 1;

        setProducts(productsClone);
        AsyncStorage.setItem(`@products`, JSON.stringify(productsClone));
        return;
      }

      Alert.alert('An error has occured, try again.');
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsClone = products.slice();
      const product = productsClone.find(p => p.id === id);

      if (product) {
        if (product.quantity === 0) {
          return;
        }
        product.quantity -= 1;
        setProducts(productsClone);

        AsyncStorage.setItem(`@products`, JSON.stringify(productsClone));
        return;
      }

      Alert.alert('An error has occured, try again.');
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
