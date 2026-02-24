import AboutPage from './QuienesSomos';
import CategoryPage from './Categorias';
import CartPage from './Carrito';
import CheckoutPage from './Checkout';
import AccountPage from './Cuenta';
import HomePage from './Home';
import ProductPage from './Productos';

/** Router visual: devuelve la pagina segun `route.kind`. */
function RouteContent({ app, route }) {
  // Rutas principales de contenido
  if (route.kind === 'home') {
    return <HomePage app={app} />;
  }
  if (route.kind === 'about') {
    return <AboutPage />;
  }
  if (route.kind === 'product') {
    return <ProductPage app={app} productId={route.id} />;
  }
  if (route.kind === 'category') {
    return <CategoryPage app={app} categoryKey={route.key} />;
  }
  if (route.kind === 'cart') {
    return <CartPage app={app} />;
  }
  if (route.kind === 'checkout') {
    return <CheckoutPage app={app} />;
  }
  if (route.kind === 'account') {
    return <AccountPage app={app} />;
  }
  return null;
}

export default RouteContent;
