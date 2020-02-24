var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' + 
  'attribute vec2 a_TexCoord;\n' +       
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     
  'uniform vec3 u_AmbientLight;\n' +
  //'uniform vec3 u_Sampler;\n' +
  'uniform vec3 u_UseTextures;\n' +
  'uniform vec3 u_LightDirection;\n' + 
  'uniform vec3 u_LightPosition;\n' +
  'uniform bool u_isLighting;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '  if(u_isLighting)\n' + 
  '  {\n' +
  '     vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
  '     vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
  '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '     vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
  '     v_Color = vec4(diffuse + ambient, a_Color.a);\n' +  
  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' + 
  '}\n';

  var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

var g_matrixStack = []; 

var a1_View = 0;
var a2_View = 0;
var a3_View = 50;
var b1_View = 0;
var b2_View = 0;
var b3_View = -100;
var c1_View = 0;
var c2_View = 1;
var c3_View = 0;

var ANGLE_STEP = 2.0;
var g_xAngle = 15.0;
var g_yAngle = 0.0;

var canvas;
var gl;

var u_ModelMatrix;
var u_ViewMatrix;
var u_NormalMatrix;
var u_ProjMatrix;
var u_LightColor;
var u_AmbientLight;
var u_LightDirection;
var u_LightPosition;
var u_Sampler;
var u_UseTextures;

var u_isLighting;

var loaded;
var texture;
var img;

var a_Position;

function main() {

    var canvas = document.getElementById('webgl');

    var width = canvas.width;
    var height = canvas.height;

    canvas.width = nextPowerof2(width);
    canvas.height = nextPowerof2(height);

    gl = getWebGLContext(canvas);
  
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
  
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.8);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    u_UseTextures = gl.getUniformLocation(gl.program, 'u_UseTextures');
    u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

    if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix || !u_ProjMatrix || !u_LightColor || !u_AmbientLight || !u_LightDirection || !u_isLighting ) { 
      console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
      return;
    }

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3f(u_AmbientLight, 0.3, 0.3, 0.3);
    gl.uniform3fv(u_LightDirection, [0.5/7.5, 3.0/7.5, 4.0/7.5]);
    gl.uniform3fv(u_LightPosition, [5.0/7.0, 1.0/7.0, 2.0/7.0]);

    viewMatrix.setLookAt(a1_View, a2_View, a3_View, b1_View, b2_View, b3_View, c1_View, c2_View, c3_View);
    projMatrix.setPerspective(45, canvas.width/canvas.height, 1, 100);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    document.onkeydown = function(ev) {
        keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix);
    };

    //var n = initVertexBuffers(gl, 0.55, 0.35, 0.1);

    loaded = false;
    img = new Image();

    img.onload = function() {
      texture = gl.createTexture();
      loaded = true;
    };
    img.src = "wood.png";
    //img.src = "carpet.jpg";

    requestAnimationFrame(update);
};

function update() {
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  requestAnimationFrame(update);
}

function nextPowerof2(value) {
  return Math.pow(2, Math.ceil(Math.log(value) / Math.log(2)));
}

function isPowerof2(value) {
  return (value & (value - 1)) === 0;
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_ViewMatrix) {
    switch (ev.keyCode) {
        case 40: //up
            g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
            break;
        case 38: //down
            g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
            break;
        case 37: //left
            g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
            break;
        case 39: //right
            g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
            break;
        case 65: //a(left)
            a1_View += 0.25
            break;
        case 87: //w(up)
            a2_View -= 0.25
            break;
        case 83: //s(down)
            a2_View += 0.25
            break;
        case 68: //d(right)
            a1_View -= 0.25;
            break;
        case 90: //Z(forwards)
            a3_View -= 0.25
            break;
        case 88: //d(backwards)
            a3_View += 0.25
            break;
        default: return;
    }
    viewMatrix.setLookAt(a1_View, a2_View, a3_View, b1_View, b2_View, b3_View, c1_View, c2_View, c3_View);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
}

function initVertexBuffers(gl, rVal, gVal, bVal) {
    var vertices = new Float32Array([   
      0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, 
      0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, 
      0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, 
      -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, 
      -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, 
      0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  
    ]);
  
    var colors = new Float32Array([    
      rVal, gVal, bVal,   rVal, gVal, bVal,   rVal, gVal, bVal,  rVal, gVal, bVal,     
      rVal, gVal, bVal,   rVal, gVal, bVal,   rVal, gVal, bVal,  rVal, gVal, bVal,     
      rVal, gVal, bVal,   rVal, gVal, bVal,   rVal, gVal, bVal,  rVal, gVal, bVal,     
      rVal, gVal, bVal,   rVal, gVal, bVal,   rVal, gVal, bVal,  rVal, gVal, bVal,     
      rVal, gVal, bVal,   rVal, gVal, bVal,   rVal, gVal, bVal,  rVal, gVal, bVal,     
      rVal, gVal, bVal,   rVal, gVal, bVal,   rVal, gVal, bVal,  rVal, gVal, bVal　    
    ]);
    
    var normals = new Float32Array([    
      0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  
      1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  
      0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  
      -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  
      0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  
      0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   
    ]);
   
    var indices = new Uint8Array([
      0, 1, 2,   0, 2, 3,    
      4, 5, 6,   4, 6, 7,    
      8, 9,10,   8,10,11,    
      12,13,14,  12,14,15,    
      16,17,18,  16,18,19,    
      20,21,22,  20,22,23     
    ]);

    //Last two lines aren't loading
    var verticesTexCoords = new Float32Array([   
      0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   
      0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   
      0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,   
      -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, //remember to add a comma back in here  
      -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,  
      0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5
    ]);
    var n=36; //Does this need to be changed?

    var vertexTexCoordBuffer = gl.createBuffer();
    if (!vertexTexCoordBuffer) {
      console.log('Failed to create the buffer object');
      return false;
  }

    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

    var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');

    gl.vertexAttribPointer(a_TexCoord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TexCoord);

    return n;
}

function initArrayBuffer (gl, attribute, data, num, type) {
    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }

    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
    return true;
}

function initAxesVertexBuffers(gl) {

    var verticesColors = new Float32Array([
      -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  
       20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
       0.0,  20.0,   0.0,  1.0,  1.0,  1.0, 
       0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
       0.0,   0.0, -20.0,  1.0,  1.0,  1.0, 
       0.0,   0.0,  20.0,  1.0,  1.0,  1.0 
    ]);
    var n = 6;
  
    var vertexColorBuffer = gl.createBuffer();  
    if (!vertexColorBuffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
  
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
  
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);  
  
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_Color < 0) {
      console.log('Failed to get the storage location of a_Color');
      return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);  
  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
    return n;
}
  
function pushMatrix(m) { 
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { 
  return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, false); 
  
  var n = initAxesVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  
  gl.uniform1i(u_isLighting, true); 

  modelMatrix.setTranslate(0, 0, 0);  
  modelMatrix.rotate(g_yAngle, 0, 1, 0); 
  modelMatrix.rotate(g_xAngle, 1, 0, 0);

  try {
    render(loaded);

    function render(loaded) {
      if(loaded) {
        drawTexture(gl, n, img, u_Sampler, u_UseTextures, texture);
        buildScene(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
      } 
  }

  } catch {
    console.log('Failed to initialize textures');
    return;
  }    
}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}

function drawTexture(gl, n, image, u_Sampler, u_UseTextures, texture){
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  } catch(e) {
      console.log(typeof(image));
      console.log(e);
  }

  if(isPowerof2(image.width) && isPowerof2(image.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

 // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniform1i(u_Sampler, 0);
  gl.uniform1i(u_UseTextures, true);
  //gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function buildChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, n, translate_x, translate_y, translate_z, face) {
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(2.0, 0.5, 2.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  if(face == "far"){
    pushMatrix(modelMatrix);
    modelMatrix.translate(translate_x, translate_y+1.25, translate_z-0.75);  
    modelMatrix.scale(2.0, 2.0, 0.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  } else if(face == "left") {
    pushMatrix(modelMatrix);
    modelMatrix.translate(translate_x-0.75, translate_y+1.25, translate_z);  
    modelMatrix.scale(0.5, 2.0, 2.0);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  } else if(face == "right") {
    pushMatrix(modelMatrix);
    modelMatrix.translate(translate_x+0.75, translate_y+1.25, translate_z);  
    modelMatrix.scale(0.5, 2.0, 2.0);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  } else if(face == "near") {
    pushMatrix(modelMatrix);
    modelMatrix.translate(translate_x, translate_y+1.25, translate_z+0.75);  
    modelMatrix.scale(2.0, 2.0, 0.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.75, translate_y-1, translate_z+0.75);  
  modelMatrix.scale(0.5, 2.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.75, translate_y-1, translate_z+0.75);  
  modelMatrix.scale(0.5, 2.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.75, translate_y-1, translate_z-0.75);  
  modelMatrix.scale(0.5, 2.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.75, translate_y-1, translate_z-0.75);  
  modelMatrix.scale(0.5, 2.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildFloor(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, n) {
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, -2.04, 0);
  modelMatrix.scale(25.0, 0.1, 25.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, n, translate_x, translate_y, translate_z) {
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(6.5, 0.5, 5.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-2.5, translate_y-1.5, translate_z-1.5);  
  modelMatrix.scale(0.5, 3.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-2.5, translate_y-1.5, translate_z+1.5);  
  modelMatrix.scale(0.5, 3.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+2.5, translate_y-1.5, translate_z-1.5);  
  modelMatrix.scale(0.5, 3.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+2.5, translate_y-1.5, translate_z+1.5);  
  modelMatrix.scale(0.5, 3.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildScene(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, initVertexBuffers(gl, 0.55, 0.35, 0.1), 0, 0, 0, "far");
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, initVertexBuffers(gl, 0.55, 0.35, 0.1), 3, 0, 0, "far");
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, initVertexBuffers(gl, 0.55, 0.35, 0.1), 0, 0, 7.5, "near");
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, initVertexBuffers(gl, 0.55, 0.35, 0.1), 3, 0, 7.5, "near");
  buildTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, initVertexBuffers(gl, 77/117, 40/117, 0.3), 1.5, 1.25, 3.75);
  buildFloor(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, initVertexBuffers(gl, 1, 1, 1));
}