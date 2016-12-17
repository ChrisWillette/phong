//chris willette
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
  tube.tangentBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tube.tangentBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tube.tangents, gl.STATIC_DRAW);
  program.vertexPosition = gl.getAttribLocation(program, 'vertexPosition');
  program.vertexNormal = gl.getAttribLocation(program, 'vertexNormal');
  program.ModelViewProjection = gl.getUniformLocation(program, 'ModelViewProjection');
  program.ModelViewMatrix = gl.getUniformLocation(program, 'ModelViewMatrix');
  program.NormalMatrix = gl.getUniformLocation(program, 'NormalMatrix');
  program.TextureMatrix = gl.getUniformLocation(program, "TextureMatrix");
  program.vertexTexCoord = gl.getAttribLocation(program, "vertexTexCoord");
  program.vertexTangent = gl.getAttribLocation(program, "vertexTangent");
  program.ambientLight = gl.getUniformLocation(program, 'ambientLight');
  program.light0Color = gl.getUniformLocation(program, 'light0Color');
  program.light0Position = gl.getUniformLocation(program, 'light0Position');
  program.material0Ambient = gl.getUniformLocation(program, 'material0Ambient');
  program.material0Diffuse = gl.getUniformLocation(program, 'material0Diffuse');
  program.material0Specular = gl.getUniformLocation(program, 'material0Specular');
  program.material0Shininess = gl.getUniformLocation(program, 'material0Shininess');
  program.material1Ambient = gl.getUniformLocation(program, 'material1Ambient');
  program.material1Diffuse = gl.getUniformLocation(program, 'material1Diffuse');
  program.material1Specular = gl.getUniformLocation(program, 'material1Specular');
  program.material1Shininess = gl.getUniformLocation(program, 'material1Shininess');  
  program.texUnit = gl.getUniformLocation(program, "texUnit");
  program.texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, program.texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 0, 255])); // yellow

  var textureImage = new Image();
  textureImage.src = 'lion.png';
  textureImage.onload = function() {
    var isPowerOfTwo = function(value) {
      return (value & (value - 1)) == 0;
    }
    gl.bindTexture(gl.TEXTURE_2D, program.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureImage);
    if (isPowerOfTwo(textureImage.width) && isPowerOfTwo(textureImage.height)) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
        gl.LINEAR_MIPMAP_LINEAR);
    } else {  // NPOT
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    frame = requestAnimationFrame(display);
  }
  gl.uniform1i(program.texUnit, 0);

  gl.uniform3fv(program.material0Ambient, [0.1, 0.1, 0.1]);
  gl.uniform3fv(program.material0Diffuse, [0.9, 0.1, 0.1]);
  gl.uniform3fv(program.material0Specular, [0.8, 0.8, 0.8]);
  gl.uniform1f(program.material0Shininess, 10.0);
  gl.uniform3fv(program.material1Ambient, [1, 1, 1]);
  gl.uniform3fv(program.material1Diffuse, [.1, 0.2, 0.7]);
  gl.uniform3fv(program.material1Specular, [0.1, 0.1, 0.1]);
  gl.uniform1f(program.material1Shininess, 1.0);
  

  gl.uniform3fv(program.ambientLight, [0.3, 0.3, 0.3]);
  gl.uniform3fv(program.light0Color, [1.0, 1.0, 1.0]);
  gl.uniform3fv(program.light0Position, [10.0, 10.0, 30.0]);
  gl.clearColor(0,0,0,0);
  gl.uniform3fv(program.fragColor, [1.0, 1.0, 0.0]);
  Projection = new Matrix4x4;
  Projection.perspective(40, 1, 0.1, 100);
  View = new Matrix4x4;
  Model = new Matrix4x4;
  Texture = new Matrix4x4;
  Texture.scale(38, 2, 1);
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
  //gl.uniformMatrix3fv(program.NormalMatrix, false, NormalMatrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, tube.texCoordBuffer);
  gl.enableVertexAttribArray(program.vertexTexCoord);
  gl.vertexAttribPointer(program.vertexTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, tube.tangentBuffer);
	gl.enableVertexAttribArray(program.vertexTangent);
	gl.vertexAttribPointer(program.vertexTangent, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(program.TextureMatrix, false, Texture.array);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tube.triangleStripBuffer);
  gl.drawElements(gl.TRIANGLE_STRIP, tube.triangleStrip.length, gl.UNSIGNED_SHORT, 0);
  gl.flush();
};
