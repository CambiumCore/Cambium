// an exploration of the structure and shape of Cambium
// NB the rendering portions of this code originate from a long ago code retreat session building a 3D version of the chaos game, hence the ancient version of three.js


var container
var camera, controls, scene, renderer

let n = +location.hash.split(',')[0].slice(1) || 64
let k = +location.hash.split(',')[1]          || 8
let o = +location.hash.split(',')[2]          || 10

init()
go(n, k)

function go(n, k) {
  clear()
  build_world(n, k)
  render()
}

function render() {
  renderer.render( scene, camera )
}

function clear() {
  while(scene.children.length > 0)
    scene.remove(scene.children[0])
}


function build_world(n, k) {
  // n is total number of nodes (power of two)
  // k is group size (power of two)
  let q = largesse(n, k)
  let angle = 2*Math.PI/k
  let geometry = new THREE.CylinderGeometry( 0, 5, 8.66, 4, 1 )
  let special = 13
  let ppp = peers(special, k, n).pop() //flatMap(x=>x)

  for(let y=0; y < q.length; y++) {
    for(let x=0; x < q[y].length; x++) {
      for(let z=0; z < q[y][x].length; z++) {
        for(let p=0; p < q[y][x][z].length; p++) {

          let hue = q[y][x][z][p]/n
          let opa = ppp.includes(q[y][x][z][p]) ? 1 : o/100
          let color = hslToRgb(hue, 0.8, 0.5)

          // if(q[y][x][z][p] == special)
            // color = 0x000000

          let material =  new THREE.MeshLambertMaterial( { color: color
                                                         , shading: THREE.FlatShading
                                                         , transparent: true
                                                         , opacity: opa
                                                         } )
          let mesh = new THREE.Mesh( geometry, material )

          mesh.position.x = z*200/q[y][x].length
                          + 200/q[y][x].length

          mesh.position.y = 80*y
                          + 10*Math.cos(p*angle)

          mesh.position.z = x*(14*2**q.length)/q[y].length
                          + (7*2**q.length)/q[y].length
                          + 10*Math.sin(p*angle)

          mesh.updateMatrix()
          mesh.matrixAutoUpdate = false
          scene.add( mesh )
        }
      }
    }
  }

  light = new THREE.DirectionalLight( 0xffffff )
  light.position.set( 1, 1, 1 )
  scene.add( light )

  light = new THREE.DirectionalLight( 0x002288 )
  light.position.set( -1, -1, -1 )
  scene.add( light )

  light = new THREE.AmbientLight( 0x777777 )
  scene.add( light )
}


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
  return [...Array(k).keys()].map(x=>(x<<l)).map((x,j)=>x|((i+j)&((2**l)-1))).map(x=>x+p)
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
  // returns [p, i] -- the branch prefix and the group stack index
  return [x>>l+Math.log2(k), (Math.abs((x>>l)%k - x%(2**l)) % (2**l))]
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





function init(n, k) {
  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 )
  camera.position.x = 900
  camera.position.y = 100
  camera.position.z = 50

  controls = new THREE.OrbitControls( camera )
  controls.damping = 0.02
  controls.addEventListener( 'change', render )

  scene = new THREE.Scene()

  renderer = new THREE.WebGLRenderer( { antialias: false } )
  renderer.setClearColor(0xffffff)
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )

  container = document.getElementById( 'container' )
  container.appendChild( renderer.domElement )

  window.addEventListener( 'resize', onWindowResize, false )
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
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
  var r, g, b

  if(s == 0){
    r = g = b = l; // achromatic
  }else{
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
  /* return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];*/
}
