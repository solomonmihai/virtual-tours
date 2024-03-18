import '../style.css'
import initApp from './initApp';

document.querySelector('#app').innerHTML = `
  <canvas id="three-canvas">
`

await initApp();
