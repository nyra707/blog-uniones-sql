var enlacesVacios = document.querySelectorAll('a[href="#"]');
for (var i = 0; i < enlacesVacios.length; i++) {
  enlacesVacios[i].addEventListener('click', function (e) {
    e.preventDefault();
  });
}

var items = document.querySelectorAll('.item');
var puntos = document.querySelectorAll('.punto');
var contador = document.getElementById('contador');
var btnAnterior = document.getElementById('btn-anterior');
var btnSiguiente = document.getElementById('btn-siguiente');
var itemActual = 0;

function mostrarItem(numero) {
  if (numero < 0) {
    numero = items.length - 1;
  }
  if (numero >= items.length) {
    numero = 0;
  }
  itemActual = numero;

  for (var i = 0; i < items.length; i++) {
    items[i].hidden = (i !== numero);
    if (i === numero) {
      puntos[i].classList.add('activo');
    } else {
      puntos[i].classList.remove('activo');
    }
  }

  contador.textContent = 'Ítem ' + (numero + 1) + ' de ' + items.length;
}

btnAnterior.addEventListener('click', function () {
  mostrarItem(itemActual - 1);
});

btnSiguiente.addEventListener('click', function () {
  mostrarItem(itemActual + 1);
});

for (var p = 0; p < puntos.length; p++) {
  puntos[p].addEventListener('click', function (e) {
    e.preventDefault();
    mostrarItem(Number(this.getAttribute('data-item')));
  });
}

document.addEventListener('keydown', function (e) {
  var etiqueta = document.activeElement.tagName;
  if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA') {
    return;
  }
  if (e.key === 'ArrowLeft') {
    mostrarItem(itemActual - 1);
  } else if (e.key === 'ArrowRight') {
    mostrarItem(itemActual + 1);
  }
});

mostrarItem(0);

var formBusqueda = document.getElementById('form-busqueda');
var campoBusqueda = document.getElementById('campo-busqueda');
var articulo = document.getElementById('articulo');
var mensajeBusqueda = document.getElementById('mensaje-busqueda');

function simplificar(texto) {
  var resultado = '';
  for (var i = 0; i < texto.length; i++) {
    var letra = texto.charAt(i).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (letra.length !== 1) {
      letra = texto.charAt(i);
    }
    resultado += letra;
  }
  return resultado;
}

function limpiarResaltados() {
  var marcas = articulo.querySelectorAll('mark.resaltado');
  for (var i = 0; i < marcas.length; i++) {
    var padre = marcas[i].parentNode;
    padre.replaceChild(document.createTextNode(marcas[i].textContent), marcas[i]);
    padre.normalize();
  }
  mensajeBusqueda.hidden = true;
}

function buscar(texto) {
  limpiarResaltados();

  var buscado = simplificar(texto.trim());
  if (buscado === '') {
    return;
  }

  var recorrido = document.createTreeWalker(articulo, NodeFilter.SHOW_TEXT, null);
  var nodos = [];
  while (recorrido.nextNode()) {
    nodos.push(recorrido.currentNode);
  }

  for (var n = 0; n < nodos.length; n++) {
    var nodo = nodos[n];
    var plano = simplificar(nodo.nodeValue);
    var posiciones = [];
    var pos = plano.indexOf(buscado);

    while (pos !== -1) {
      posiciones.push(pos);
      pos = plano.indexOf(buscado, pos + buscado.length);
    }

    for (var k = posiciones.length - 1; k >= 0; k--) {
      var rango = document.createRange();
      rango.setStart(nodo, posiciones[k]);
      rango.setEnd(nodo, posiciones[k] + buscado.length);
      var marca = document.createElement('mark');
      marca.className = 'resaltado';
      rango.surroundContents(marca);
    }
  }

  var marcas = articulo.querySelectorAll('mark.resaltado');
  mensajeBusqueda.hidden = false;

  if (marcas.length === 0) {
    mensajeBusqueda.textContent = 'No se encontraron resultados para "' + texto.trim() + '".';
    return;
  }

  mensajeBusqueda.textContent = marcas.length + ' resultado(s) para "' + texto.trim() + '". ';
  var limpiar = document.createElement('a');
  limpiar.href = '#';
  limpiar.textContent = '[quitar resaltado]';
  limpiar.addEventListener('click', function (e) {
    e.preventDefault();
    limpiarResaltados();
    campoBusqueda.value = '';
  });
  mensajeBusqueda.appendChild(limpiar);

  var primera = marcas[0];
  var itemDeLaMarca = primera.closest('.item');
  if (itemDeLaMarca) {
    for (var i = 0; i < items.length; i++) {
      if (items[i] === itemDeLaMarca) {
        mostrarItem(i);
      }
    }
  }
  primera.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

formBusqueda.addEventListener('submit', function (e) {
  e.preventDefault();
  buscar(campoBusqueda.value);
});

function leerGuardado(clave, valorPorDefecto) {
  try {
    var dato = localStorage.getItem(clave);
    if (dato === null) {
      return valorPorDefecto;
    }
    return JSON.parse(dato);
  } catch (error) {
    return valorPorDefecto;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
  }
}

var kudos = leerGuardado('blog_kudos', 0);
var numKudos = document.getElementById('num-kudos');
numKudos.textContent = kudos;

function darKudos(cantidad) {
  kudos = kudos + cantidad;
  numKudos.textContent = kudos;
  guardar('blog_kudos', kudos);
}

document.getElementById('dar-1').addEventListener('click', function (e) {
  e.preventDefault();
  darKudos(1);
});

document.getElementById('dar-2').addEventListener('click', function (e) {
  e.preventDefault();
  darKudos(2);
});

var comentarios = leerGuardado('blog_comentarios', []);
var mostrarTodos = false;
var MAXIMO_VISIBLES = 3;

var listaComentarios = document.getElementById('lista-comentarios');
var comentVistos = document.getElementById('coment-vistos');
var comentTotal = document.getElementById('coment-total');
var formComentario = document.getElementById('form-comentario');
var btnAddComent = document.getElementById('btn-add-coment');
var campoNombre = document.getElementById('coment-nombre');
var campoTexto = document.getElementById('coment-texto');

function dibujarComentarios() {
  listaComentarios.innerHTML = '';

  var ordenados = comentarios.slice().reverse();
  var cantidad = mostrarTodos ? ordenados.length : Math.min(MAXIMO_VISIBLES, ordenados.length);

  for (var i = 0; i < cantidad; i++) {
    var caja = document.createElement('div');
    caja.className = 'coment';

    var cabecera = document.createElement('div');
    cabecera.className = 'coment-cab';
    var autor = document.createElement('b');
    autor.textContent = ordenados[i].nombre;
    cabecera.appendChild(autor);
    cabecera.appendChild(document.createTextNode(' - ' + ordenados[i].fecha));

    var cuerpo = document.createElement('div');
    cuerpo.className = 'coment-texto';
    cuerpo.textContent = ordenados[i].texto;

    caja.appendChild(cabecera);
    caja.appendChild(cuerpo);
    listaComentarios.appendChild(caja);
  }

  comentVistos.textContent = cantidad;
  comentTotal.textContent = ordenados.length;
}

function abrirFormulario() {
  formComentario.hidden = false;
  btnAddComent.hidden = true;
  campoTexto.focus();
}

function cerrarFormulario() {
  formComentario.hidden = true;
  btnAddComent.hidden = false;
  campoTexto.value = '';
}

btnAddComent.addEventListener('click', abrirFormulario);

document.getElementById('abrir-form').addEventListener('click', function (e) {
  e.preventDefault();
  abrirFormulario();
});

document.getElementById('cancelar-coment').addEventListener('click', cerrarFormulario);

document.getElementById('ver-todos').addEventListener('click', function (e) {
  e.preventDefault();
  mostrarTodos = true;
  dibujarComentarios();
});

formComentario.addEventListener('submit', function (e) {
  e.preventDefault();

  var texto = campoTexto.value.trim();
  if (texto === '') {
    return;
  }

  var nombre = campoNombre.value.trim();
  if (nombre === '') {
    nombre = 'Anónimo';
  }

  comentarios.push({
    nombre: nombre,
    texto: texto,
    fecha: new Date().toLocaleDateString('es-CL')
  });
  guardar('blog_comentarios', comentarios);

  cerrarFormulario();
  dibujarComentarios();
});

dibujarComentarios();
