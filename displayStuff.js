
var gl;
var canvas;
var program;
var camera;
var Model, View, Projection, Texture;

function getMousePos(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
  };
};
var mouseDrag;

function mouseDown(event) {
  mouseDrag = getMousePos(canvas, event);
};
var radiansPerPixel = 0.01;
var phiMin = -Math.PI / 2 + 0.001;
var phiMax = +Math.PI / 2 - 0.001;
var frame;

function mouseMove(event) {
  if (mouseDrag) {
      var mousePos = getMousePos(canvas, event);
      var dx = mousePos.x - mouseDrag.x;
      var dy = mousePos.y - mouseDrag.y;
      camera.theta += dx * radiansPerPixel;
      camera.phi += dy * radiansPerPixel;
      if (camera.phi < phiMin) {
          camera.phi = phiMin;
      } else {
          if (camera.phi > phiMax) {
              camera.phi = phiMax;
          };
      };
      mouseDrag = mousePos;
      if (!frame) {
          frame = requestAnimationFrame(display);
      };
  };
};

function mouseUp(event) {
  mouseDrag = null;
};

function init(N, M, p, q, a, b, R) {
  canvas = document.getElementById('myCanvas');
  gl = canvas.getContext('experimental-webgl');
  canvas.addEventListener('mousedown', mouseDown, false);
  canvas.addEventListener('mousemove', mouseMove, false);
  document.body.addEventListener('mouseup', mouseUp, false);
  var v = document.getElementById('vertex').firstChild.nodeValue;
  var vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, v);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(vs));
      return false;
  };
  var f = document.getElementById('fragment').firstChild.nodeValue;
  var fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, f);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(fs));
      return false;
  };
  program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);
  tube.N = N;
  tube.M = M;
  tube.p = p;
  tube.q = q;
  tube.a = a;
  tube.b = b;
  tube.R = R;
  tube.createGeometry();
  tube.createTriangleStrip();
  tube.createTexCoords();
  tube.vertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tube.vertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tube.verts, gl.STATIC_DRAW);
  tube.normBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tube.normBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tube.normals, gl.STATIC_DRAW);
  tube.triangleStripBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tube.triangleStripBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tube.triangleStrip, gl.STATIC_DRAW);
  tube.texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tube.texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tube.texCoords, gl.STATIC_DRAW);
  program.vertexPosition = gl.getAttribLocation(program, 'vertexPosition');
  program.vertexNormal = gl.getAttribLocation(program, 'vertexNormal');
  program.ModelViewProjection = gl.getUniformLocation(program, 'ModelViewProjection');
  program.ModelViewMatrix = gl.getUniformLocation(program, 'ModelViewMatrix');
  program.NormalMatrix = gl.getUniformLocation(program, 'NormalMatrix');
  program.TextureMatrix = gl.getUniformLocation(program, "TextureMatrix");
  program.vertexNormal = gl.getAttribLocation(program, "vertexNormal");
  program.vertexTexCoord = gl.getAttribLocation(program, "vertexTexCoord");
  program.ambientLight = gl.getUniformLocation(program, 'ambientLight');
  program.light0Color = gl.getUniformLocation(program, 'light0Color');
  program.light0Position = gl.getUniformLocation(program, 'light0Position');
  program.materialAmbient = gl.getUniformLocation(program, 'materialAmbient');
  program.materialDiffuse = gl.getUniformLocation(program, 'materialDiffuse');
  program.materialSpecular = gl.getUniformLocation(program, 'materialSpecular');
  program.materialShininess = gl.getUniformLocation(program, 'materialShininess');
  gl.uniform3fv(program.materialAmbient, [0.1, 0.1, 0.1]);
  gl.uniform3fv(program.materialDiffuse, [0.1, 0.6, 0.6]);
  gl.uniform3fv(program.materialSpecular, [0.3, 0.3, 0.3]);
  gl.uniform1f(program.materialShininess, 10.0);
  gl.uniform3fv(program.ambientLight, [0.3, 0.3, 0.3]);
  gl.uniform3fv(program.light0Color, [1.0, 1.0, 1.0]);
  gl.uniform3fv(program.light0Position, [10.0, 10.0, 30.0]);
  gl.clearColor(0, 0, 0.3, 1);
  gl.uniform3fv(program.fragColor, [1.0, 1.0, 0.0]);
  TextureMatrix = new Matrix4x4;
  TextureMatrix.scale(38, 2, 1);
  Projection = new Matrix4x4;
  Projection.perspective(40, 1, 0.1, 100);
  View = new Matrix4x4;
  Model = new Matrix4x4;
  Texture = new Matrix4x4;
  camera = {};
  camera.lookat = {x: 0, y: 0, z: 0};
  camera.distance = 25;
  camera.phi = Math.PI / 6;
  camera.theta = Math.PI / 4;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.frontFace(gl.CW);
  gl.enable(gl.CULL_FACE);
  gl.lineWidth(2.0);
};

function getCameraPosition() {
  var d_cos_phi = camera.distance * Math.cos(camera.phi);
  camera.x = d_cos_phi * Math.sin(camera.theta) + camera.lookat.x;
  camera.y = d_cos_phi * Math.cos(camera.theta) + camera.lookat.y;
  camera.z = camera.distance * Math.sin(camera.phi) + camera.lookat.z;
};

function display() {
  frame = undefined;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  getCameraPosition();
  View.identity();
  View.lookat(camera.x, camera.y, camera.z, camera.lookat.x, camera.lookat.y, camera.lookat.z, 0, 0, 1);
  var ModelView = View.mult(Model);
  var NormalMatrix = ModelView.normal();
  var ModelViewProjection = Projection.mult(ModelView);
  gl.uniformMatrix4fv(program.ModelViewProjection, false, ModelViewProjection.array);
  gl.uniformMatrix4fv(program.ModelViewMatrix, false, ModelView.array);
  gl.uniformMatrix3fv(program.NormalMatrix, false, NormalMatrix);
  gl.uniform3fv(program.fragColor, [1, 1, 0.3]);
  gl.bindBuffer(gl.ARRAY_BUFFER, tube.vertBuffer);
  gl.enableVertexAttribArray(program.vertexPosition);
  gl.vertexAttribPointer(program.vertexPosition, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, tube.normBuffer);
  gl.enableVertexAttribArray(program.vertexNormal);
  gl.vertexAttribPointer(program.vertexNormal, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix3fv(program.NormalMatrix, false, NormalMatrix);
  gl.uniformMatrix4fv(program.TextureMatrix, false, Texture.array);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tube.triangleStripBuffer);
  gl.drawElements(gl.TRIANGLE_STRIP, tube.triangleStrip.length, gl.UNSIGNED_SHORT, 0);
  gl.flush();
};