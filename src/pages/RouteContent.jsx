import AboutPage from './QuienesSomos';
import CategoryPage from './Categorias';
import HomePage from './Home';
import ProductPage from './Productos';

function RouteContent({ app, route }) {
  
  if (route.kind === 'home') {
    return <Home app={app} />;
  }
  if (route.kind === 'about') {
    return <QuienesSomos />;
  }
  if (route.kind === 'product') {
    return <Productos app={app} productId={route.id} />;
  }
  if (route.kind === 'category') {
    return <Categorias app={app} categoryKey={route.key} />;
  }
  return null;
}

export default RouteContent;
