var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec4 v_Color;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  if(u_isLighting)\n' + 
  '  {\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
        // Calculate the color due to diffuse reflection
  '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '     v_Color = vec4(diffuse, a_Color.a);\n' +  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' + 
  '}\n';

  var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

var ANGLE_STEP = 3.0;
var g_xAngle = 0.0;
var g_yAngle = 0.0

function main() {
    var canvas = document.getElementById('webgl');
  
    var gl = getWebGLContext(canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
  
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

    var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

    if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
        !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
        !u_isLighting ) { 
      console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
      return;
    }

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize();
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);
    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    document.onkeydown = function(ev) {
        keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
    };

    draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
};

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
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
        case 39:
            g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
            break;
        default: return;
    }
    draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function initVertexBuffers(gl) {
    var vertices = new Float32Array([   
        0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, 
        0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, 
        0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, 
       -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, 
       -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, 
        0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  
     ]);
   
     var colors = new Float32Array([    
       1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     
       1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     
       1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     
       1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     
       1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     
       1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    
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

    return indices.length;
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
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
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
  
  var g_matrixStack = []; 
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
  
    modelMatrix.setTranslate(0, 0, 0);  

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  
    gl.drawArrays(gl.LINES, 0, n);
  
    gl.uniform1i(u_isLighting, true); 
  
    var n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
  
    modelMatrix.setTranslate(0, 0, 0);  
    modelMatrix.rotate(g_yAngle, 0, 1, 0); 
    modelMatrix.rotate(g_xAngle, 1, 0, 0); 
  
    pushMatrix(modelMatrix);
    modelMatrix.scale(2.0, 0.5, 2.0); 
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  
    pushMatrix(modelMatrix);
    modelMatrix.translate(0, 1.25, -0.75);  
    modelMatrix.scale(2.0, 2.0, 0.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
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