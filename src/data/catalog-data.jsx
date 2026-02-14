export const HOME_CATEGORY_KEYS = ['collares', 'aretes', 'pulseras', 'anillos'];

export const CATEGORIES = {
  collares: {
    title: 'Collares',
    desc: 'Disenos artesanales creados con dedicacion para expresar tu esencia.',
    heroImg: 'imagenes/Collar_Nautilus.jpeg',
    heroImgHover: 'imagenes/Collar_Nautilus_Negro.jpeg',
    products: ['gargantilla-luna', 'gargantilla-perla', 'gargantilla-minimal'],
    tabs: [
      {
        id: 'caballero',
        label: 'Para Caballero',
        content:
          'Accesorios con caracter y diseno moderno, ideales para un estilo autentico.',
      },
      {
        id: 'dama',
        label: 'Para Dama',
        content:
          'Disenos delicados que realzan tu estilo y aportan elegancia para cada ocasion.',
      },
    ],
  },
  aretes: {
    title: 'Aretes',
    desc: 'Aretes elegantes y versatiles para cualquier ocasion.',
    heroImg: 'imagenes/Anillo_Muestra.jpeg',
    heroImgHover: 'imagenes/Anillo_Modelo.jpeg',
    products: ['arracadas-clasicas', 'arracadas-chunky'],
  },
  'collares/caballero': {
    title: 'Collares Caballero',
    desc: 'Collares cortos para usar solos o combinar en capas.',
    heroImg: 'imagenes/Collar_Nautilus.jpeg',
    heroImgHover: 'imagenes/Collar_Nautilus_Negro.jpeg',
    products: ['gargantilla-luna', 'gargantilla-perla', 'gargantilla-minimal'],
  },
  'collares/dama': {
    title: 'Collares Dama',
    desc: 'Collares cortos para dama que aportan delicadeza y estilo.',
    heroImg: 'imagenes/Anillo_Muestra.jpeg',
    heroImgHover: 'imagenes/Anillo_Modelo.jpeg',
    products: ['corbatin-satin', 'corbatin-oro'],
  },
  anillos: {
    title: 'Anillos',
    desc: 'Anillos clasicos y modernos para cualquier ocasion.',
    heroImg: 'imagenes/Anillo_Modelo.jpeg',
    heroImgHover: 'imagenes/Anillo_Muestra.jpeg',
    products: ['anillo-modelo', 'anillo-muestra'],
  },
  pulseras: {
    title: 'Pulseras',
    desc: 'Piezas cuidadosamente elaboradas que combinan diseno y detalle.',
    heroImg: 'imagenes/Pulsera_Volcanica.png',
    heroImgHover: 'imagenes/Pulseras_Onyx.png',
    products: ['pulsera-nudo', 'pulsera-bicolor'],
    tabs: [
      {
        id: 'caballero',
        label: 'Para Caballero',
        content: 'Pulseras con estilo sobrio y materiales resistentes.',
      },
      {
        id: 'dama',
        label: 'Para Dama',
        content: 'Pulseras delicadas y versatiles para cualquier ocasion.',
      },
    ],
  },
  'pulseras/caballero': {
    title: 'Pulseras Para Caballero',
    desc: 'Pulseras sobrias para uso diario.',
    heroImg: 'imagenes/Pulsera_Volcanica.png',
    heroImgHover: 'imagenes/Pulseras_Onyx.png',
    products: ['pulsera-nudo'],
  },
  'pulseras/dama': {
    title: 'Pulseras Para Dama',
    desc: 'Pulseras delicadas y versatiles.',
    heroImg: 'imagenes/Pulseras_Onyx.png',
    heroImgHover: 'imagenes/Pulsera_Volcanica.png',
    products: ['pulsera-bicolor'],
  },
};

export const PRODUCTS = {
  'gargantilla-luna': {
    title: 'Collar Aquamarina',
    price: 250,
    img: 'imagenes/Collar_Aquamarina.jpeg',
    imgHover: 'imagenes/Collar_Nautilus_Negro.jpeg',
  },
  'gargantilla-perla': {
    title: 'Collar Nautilus',
    price: 270,
    img: 'imagenes/Collar_Nautilus.jpeg',
    imgHover: 'imagenes/Collar_Nautilus_Negro.jpeg',
  },
  'gargantilla-minimal': {
    title: 'Collar Libelula',
    price: 170,
    img: 'imagenes/Collar_Libelula.jpeg',
    imgHover: 'imagenes/Collar_Nautilus_Negro.jpeg',
  },
  'corbatin-satin': {
    title: 'Collar Amatista',
    price: 280,
    img: 'imagenes/Collar_Amatista.jpeg',
  },
  'corbatin-oro': {
    title: 'Collar Oro',
    price: 310,
    img: 'imagenes/Collar_Arbolvida.jpeg',
  },
  'arracadas-clasicas': {
    title: 'Arracadas Clasicas',
    price: 260,
    img: 'imagenes/Anillo_Muestra.jpeg',
  },
  'arracadas-chunky': {
    title: 'Arracadas Chunky',
    price: 320,
    img: 'imagenes/Anillo_Modelo.jpeg',
  },
  'anillo-modelo': {
    title: 'Anillo Modelo',
    price: 290,
    img: 'imagenes/Anillo_Modelo.jpeg',
  },
  'anillo-muestra': {
    title: 'Anillo Muestra',
    price: 260,
    img: 'imagenes/Anillo_Muestra.jpeg',
  },
  'pulsera-nudo': {
    title: 'Pulsera Piedra Volcanica',
    price: 180,
    img: 'imagenes/Pulsera_Volcanica.png',
  },
  'pulsera-bicolor': {
    title: 'Pulsera Onyx',
    price: 210,
    img: 'imagenes/Pulseras_Onyx.png',
  },
};

export const DEFAULT_CATEGORY_TABS = [
  {
    id: 'descripcion',
    label: 'Descripcion',
    content: (category) => category.desc,
  },
  {
    id: 'materiales',
    label: 'Materiales',
    content: () => 'Materiales de la coleccion (editable).',
  },
  {
    id: 'cuidados',
    label: 'Cuidados',
    content: () => 'Evita quimicos, guarda por separado y limpia con pano suave.',
  },
];

export const DEFAULT_PRODUCT_COLORS = [
  { name: 'Negro', value: '#111111' },
  { name: 'Dorado', value: '#d4af37' },
  { name: 'Plateado', value: '#bfc7d5' },
  { name: 'Rosa', value: '#e7a9b7' },
];
