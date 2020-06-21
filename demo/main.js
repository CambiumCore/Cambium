// an exploration of the structure and shape of Cambium
// NB the rendering portions of this code were cobbed from a long ago code retreat session building a 3D version of the chaos game, hence the ancient version of three.js


var container
var camera, controls, scene, renderer

let l = location.hash.slice(1).split(',') // url params
let h = { nodes:   [+l[0], 3, 10]  // log of the number of nodes
        , group:   [+l[1], 1, 6]   // log of the size of groups
        , opacity: [+l[2], 1, 100] // opacity of nodes
        , special: [+l[3], 1, 100] // the special node
        }

init()
go()

function go(n=h.nodes[0], k=h.group[0], o=h.opacity[0], s=h.special[0]) {
  clear()
  build_world(n, k, o, s%2**n)
  render()
}

function render() {
  renderer.render( scene, camera )
}

function clear() {
  while(scene.children.length > 0)
    scene.remove(scene.children[0])
}

function build_world(n=6, k=3, o=10, s=13) {
  n = 2**n
  k = 2**k
  let q = largesse(n, k)
  let angle = 2*Math.PI/k
  let geometry = new THREE.CylinderGeometry( 0, 5, 8.66, 4, 1 )
  let ppp = peers(s, k, n).pop() //flatMap(x=>x)
  add_lights(scene)

  for(let y=0; y < q.length; y++) {
    for(let x=0; x < q[y].length; x++) {
      for(let z=0; z < q[y][x].length; z++) {
        for(let p=0; p < q[y][x][z].length; p++) {

          let hue = q[y][x][z][p]/n
          let opa = ppp.includes(q[y][x][z][p]) ? 1 : o/100
          let color = hslToRgb(hue, 0.8, 0.5)

          if(q[y][x][z][p] == s)
            color = 0x000000

          let material =  new THREE.MeshLambertMaterial( { color: color
                                                         , opacity: opa
                                                         , transparent: true
                                                         , shading: THREE.FlatShading
                                                         } )

          let mesh = new THREE.Mesh( geometry, material )

          mesh.position.x = (z+1) * 200/q[y][x].length

          mesh.position.y = y * 80
                          + 10 * Math.cos(p*angle)

          mesh.position.z = x * (14*2**q.length)/q[y].length
                          +     (7*2**q.length)/q[y].length
                          + 10 * Math.sin(p*angle)

          mesh.updateMatrix()
          mesh.matrixAutoUpdate = false
          scene.add( mesh )
        }
      }
    }
  }
}


//
// Cambium-specific helpers
//

// a few samples of console commands
// histo(Object.values(histo(dupes(peers2(9999, 16, 2**30)))))
// Object.keys(histo(dupes(peers2(9999, 16, 2**30)))) // lots of these -- check the length of output
// histo(dupes(peers2(999999, 16, 2**13)))
// peers2(3, 16, 1024)
// show(peers(3, 4, 64))
// reverse(16, 2, 1)

// and remember you can set the location in the url:
// http://localhost:3001/#1024,16


// Legend for the below:
// n is total number of nodes (power of two)
// k is group size (power of two)
// i is the group stack index
// l is the level
// p is the prefix

function smallesse(k, i, l, p) {
  return [...Array(k).keys()].map(j=>j+i&2**l-1|j<<l).map(x=>x+p)
  // j is a counter
  // +i offsets it by the group stack index
  // &2**l-1 is a low-pass bit filter
  // |j<<l adds the j-bits to the high end
  // +p adds the prefix to the high end
  // note that j+i is the only bitwise overlap
}

function largesse(n, k) {
  let out = [], kk=Math.log2(k)
  for(let l=0, ll=n/k; ll>=1; l++, ll/=2) { // level
    let level = []; out.push(level)
    for(let b=0; b<ll; b++) {               // branch
      let branch = []; level.push(branch)
      for(let i=0; i<2**l; i++)             // group stack
        branch.push(smallesse(k, i, l, b<<kk+l)) } }
  return out
}

function reverse(x, k, l) {
  let kk = Math.log2(k)
  let p = (x>>l+kk)<<l+kk   // high pass filter for p-bits

  let j = x-p-(x%2**l)>>l   // isolate j from x, then shift it down
  let iplusj = x & 2**l-1   // low pass to take off the high p-bits and j-bits, leaving (i+j)%2**l
  let d = iplusj - j        // subtract j from iplusj
  let i = d>=0 ? d : d+2**l // if negative add l to reverse the modulo

  return [p, i]
}

function peers(x, k, n) {
  let out = []
  let top = Math.log2(n/k)
  for(let l=0; l<=top; l++) {
    let [p, i] = reverse(x, k, l)
    out.push(smallesse(k, i, l, p))
  }
  return out
}

function peers2(x, k, n) {
  return peers(x, k, n).flatMap((ps,l)=>ps.filter(z=>z!=x)
                       .map(z=>{let [p, i] = reverse(z, k, n)
                                return smallesse(k, i, l, p)}))
}

function peersX(x, k, n) {
  return peers(x, k, n).flatMap(ps=>ps.filter(z=>z!=x).map(z=>peers(z, k, n)))
}

function dupes(xs) {
  return xs.flat(Infinity).filter((n,k,ns)=>ns.lastIndexOf(n)>k)
}

function histo(xs) {
  return xs.reduce((acc,x)=>{acc[x]=++acc[x]||1; return acc}, {})
}

let show = x=>JSON.stringify(x, (k,v)=>+v[1]?v+"":v, 2)

function test(x, k, l) {
  let q = largesse(k*2**l, k)
  let seen = [], dupes = []
  // grab all neighbours
  // TODO: do this for allies too
  JSON.stringify(q, (k,v)=>{if(v.indexOf(x)>=0)seen=seen.concat(v);return +v[1]?0:v})

  // track dupes
  dupes = seen.filter((n,k)=>n!=x?seen.lastIndexOf(n)>k:0)

  return [dupes, seen]
}


//
// Setup routines and non-Cambium helpers
//

function init(n, k) {
  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 )
  camera.position.x = 900
  camera.position.y = 100
  camera.position.z = 50

  controls = new THREE.OrbitControls( camera, el('container') )
  controls.damping = 0.03
  controls.addEventListener( 'change', render )

  scene = new THREE.Scene()

  renderer = new THREE.WebGLRenderer( { antialias: false } )
  renderer.setClearColor(0xffffff)
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )

  container = el( 'container' )
  container.appendChild( renderer.domElement )

  window.addEventListener( 'resize', onWindowResize, false )

  knobs(h)
}

function knobs(k, html='') {
  for(let p in k)
    html += `<span>${p}: <input type=range min=${k[p][1]} max=${k[p][2]} value=${k[p][0]} oninput="h.${p}[0]=+this.value; go()" /></span>\n`
  el('knobs').innerHTML = html
}

function el(id) {
  return document.getElementById(id)
}

function add_lights(scene) {
  light = new THREE.DirectionalLight( 0xffffff )
  light.position.set( 1, 1, 1 )
  scene.add( light )

  light = new THREE.DirectionalLight( 0x002288 )
  light.position.set( -1, -1, -1 )
  scene.add( light )

  light = new THREE.AmbientLight( 0x777777 )
  scene.add( light )
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize( window.innerWidth, window.innerHeight )

  render()
}


/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 * Via https://gist.github.com/mjackson/5311256 (ish)
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l) {
  var r, g, b

  if(s == 0) {
    r = g = b = l // achromatic
  }
  else {
    var hue2rgb = function hue2rgb(p, q, t){
      if(t < 0) t += 1
      if(t > 1) t -= 1
      if(t < 1/6) return p + (q - p) * 6 * t
      if(t < 1/2) return q
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s
    var p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return (Math.round(r * 255)<<16) + (Math.round(g * 255)<<8) + Math.round(b * 255)
}
