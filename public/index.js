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
  'uniform vec3 u_UseTextures;\n' +
  'uniform vec3 u_LightDirection;\n' + 
  'uniform vec3 u_LightPosition;\n' +
  'uniform bool u_isLighting;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
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
  'uniform vec3 u_lightColor;\n' +
  'uniform vec3 u_lightPosition;\n' +
  'uniform vec3 u_ambientLight;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  vec3 normal = normalize(v_Normal);\n' +
  '  vec3 lightDirection = normalize(u_lightPosition - v_Position);\n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
  '  vec3 diffuse = u_lightColor * v_Color.rgb * nDotL;\n' +
  '  vec3 ambient = u_ambientLight * v_Color.rgb;\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

var g_matrixStack = []; 
var textures = [];
var images = [];

var global_x = 0;
var global_y = 0;
var global_z = 0;

var a1_View = 18;
var a2_View = -5;
var a3_View = 60;
var b1_View = 0;
var b2_View = 0;
var b3_View = -100;
var c1_View = 0;
var c2_View = 1;
var c3_View = 0;

var ANGLE_STEP = 1.0;
var g_xAngle = 10.0;//10.0;
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

var a_Position;

var u_lightPosition = [0,0,0];
var u_lightColor = [0,0,0];

var chairPos1 = 13;
var chairPos2 = 22;
var chairTowards1 = false;
var chairAway1 = false;
var chairTowards2 = false;
var chairAway2 = false;
var platePos = 2;
var platePresent = false;

var pouffePos = 18;
var pouffeAway = false;
var pouffeTowards = false;

var tvBounce = false;
var TVPos = 0;
var remotePos_x = 0;
var remoteOut = true;
var moveRemote = false;
var remoteCount = 0;
var rotateRem_y = 0;
var rotateRem_z = 0;
var rotatingRem = false;
var rotateDone = false;
var TVUp = 1;
var screenOn = false;

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
        keydown(ev, gl, u_ViewMatrix);
    };

    // var n = initVertexBuffers(gl, 0.55, 0.35, 0.1);

    img1 = new Image();
    img2 = new Image();
    img3 = new Image();
    img4 = new Image();
    img5 = new Image();
    img6 = new Image();
    img7 = new Image();
    img8 = new Image();
    img9 = new Image();
    img10 = new Image();
    img11 = new Image();
    img12 = new Image();

    //Floor Texture
    img1.src = "textures/originalsquarewood.png";
    
    //Table Texture
    img2.src = "textures/verticalplanks_256x256.jpg";
    
    //Sofa and Pouffe Texture
    img3.src = "textures/dbrownleather2_256x256.jpg";
    
    //TV Stand Texture
    img4.src = "textures/rustywoodplanks_256x256.jpg";

    //TV Texture
    img5.src = "textures/riskyglass.jpg"

    //TV Screen texture (Off)
    img6.src = "textures/static_256x256.jpg"

    //Chair Texture
    img7.src = "textures/woodboard_256x256.jpg"

    //Lamp Stand and cutlery
    img8.src = "textures/metal2_256x256.jpg"

    //Lamp Head
    img9.src = "textures/beige_256x256.jpg"

    //TV Screen Texture (On)
    img10.src = "textures/blue_256x256.jpg"

    //Plate white and cup white
    img11.src = "textures/white_256x256.jpg"

    //Remote buttons
    img12.src = "textures/red_256x256.png"

    images.push(img1);
    images.push(img2);
    images.push(img3);
    images.push(img4);
    images.push(img5);
    images.push(img6);
    images.push(img7);
    images.push(img8);
    images.push(img9);
    images.push(img10);
    images.push(img11);
    images.push(img12);

    img12.onload = function() {initTexture(gl, u_Sampler, u_UseTextures, images);}; 
    
    requestAnimationFrame(update);
};

function update() {
  //Animations
  dinnertime();
  movePouffe();
  tvbop();

  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  requestAnimationFrame(update);
}

function dinnertime() {
  if(chairAway1) {
    if(chairPos1 == 11){
      chairAway1 = false;
    } else {
      chairPos1 -= 0.25;
    } 
  } else if(chairTowards1) {
    if(chairPos1 == 13){
      chairTowards1 = false;
    } else {
      chairPos1 += 0.25
    }
  }

  if(chairTowards2) {
    if(chairPos2 == 24){
      chairTowards2 = false;
    } else {
      chairPos2 += 0.25;
    } 
  } else if(chairAway2) {
      if(chairPos2 == 22){
        chairAway2 = false;
      } else {
        chairPos2 -= 0.25;
      }
  }

  if(platePresent) {
    if(platePos != 0) {
      platePos -= 0.25;
    } 
  }
}

function movePouffe() {
  if(pouffeAway) {
    if(pouffePos == 9){
      pouffeAway = false;
    } else {
      pouffePos -= 0.25;
    } 
  } else if(pouffeTowards) {
    if(pouffePos == 18){
      pouffeTowards = false;
    } else {
      pouffePos += 0.25
    }
  }
}

function tvbop() {
  var rotateLim = 9; 

  if(moveRemote) {
    if(rotatingRem){
      rotateRem_y = (rotateRem_y + Math.PI/10) % Math.PI;
      rotateRem_z = ((rotateRem_y + Math.PI/10) % Math.PI) - Math.PI/2;
      remoteCount += 1;

      if(remoteCount % (rotateLim/2) == 0) {
        rotateDone = true;
      }

      if(remoteCount % rotateLim == 0){
        rotateRem_z = 0;
        rotateRem_y = 0;
        remoteOut = false;
        rotatingRem = false;
        screenOn = !screenOn;
      }
    } else {
      if (remoteOut){
        if(remotePos_x > -5) {
          remotePos_x -= 0.5;
        } else {
          rotatingRem = true;
        }
      } else {
        if(remotePos_x < 0) {
          remotePos_x += 0.5;
        } else {
          remoteOut = true;
          moveRemote = !moveRemote;
        }
      }
    }
  }

  if(rotateDone){
    if(tvBounce) {
      if(TVUp == 1) {
        if(TVPos != 0.75) {
          TVPos += 0.25;
        } else {
          TVUp = -1;
        }
      } else {
        if(TVPos != 0) {
          TVPos -= 0.25;
        } else {
          TVUp = 1;
          tvBounce = !tvBounce;
          rotateDone = false;
        }
      }
    }
  }
}

function nextPowerof2(value) {
  return Math.pow(2, Math.ceil(Math.log(value) / Math.log(2)));
}

function isPowerof2(value) {
  return (value & (value - 1)) === 0;
}

function keydown(ev, gl, u_ViewMatrix) {
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
            a1_View += 0.2
            break;
        case 87: //w(up)
            a2_View -= 0.2
            break;
        case 83: //s(down)
            a2_View += 0.2
            break;
        case 68: //d(right)
            a1_View -= 0.2;
            break;
        case 90: //z(forwards)
            a3_View -= 0.2;
            break;
        case 88: //d(backwards)
            a3_View += 0.2;
            break;
        case 67: //c (animate chair and plate & cutlery)
            if(chairPos1 == 13) {
              platePresent = true;
              chairAway1 = true;
            } 
            else {
              platePresent = false;
              platePos = 2;
              chairTowards1 = true;
              }
              
            if(chairPos2 == 22) {
              chairTowards2 = true;
            } 
            else {
              chairAway2 = true;
              }
            break;
        case 84: //t (animate TV)
            tvBounce = true;
            moveRemote = true;
            break;
        case 80: //p (animate Pouffe)
        if(pouffePos == 18) {
          pouffeAway = true;
        } 
        else {
          pouffeTowards = true;
          }
        break;
      default: return;
    }
    viewMatrix.setLookAt(a1_View, a2_View, a3_View, b1_View, b2_View, b3_View, c1_View, c2_View, c3_View);
    viewMatrix.rotate(g_yAngle, 0, 1, 0); 
    viewMatrix.rotate(g_xAngle, 1, 0, 0);  
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements); 
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

    var verticesTexCoords = new Float32Array([   
      1, 1, 1,  0, 1, 1,  0,0, 1,   1,0, 1, 
      1, 1, 1,   1,0, 1,   1,0,0,   1, 1,0, 
      1, 1, 1,  1, 1,0,  0, 1,0,  0, 1,1, 
      0,1,1,  0, 1,0,  0,0,0,  0,0,1, 
      0,0,0,  1,0,0,   1,0, 1,  0,0,1, 
      1,0,0,  0,0,0,  0, 1,0,   1,1,0
    ]);
    var n=36;

    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    // if(!loaded && !initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    var vertexTexCoordBuffer = gl.createBuffer();
    if (!vertexTexCoordBuffer) {
      console.log('Failed to create the buffer object');
      return false;
    }

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

  buildScene(gl, u_ModelMatrix, u_NormalMatrix, global_x, global_y, global_z);

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

function initTexture(gl, u_Sampler, u_UseTextures, images){

  for(i=0; i<images.length; i++) {
    var texture = gl.createTexture();

    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
    } catch(e) {
        console.log(typeof(images[i]));
        console.log(e);
    }

    if(isPowerof2(images[i].width) && isPowerof2(images[i].height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1i(u_Sampler, 0);
    gl.uniform1i(u_UseTextures, true);
    //gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    textures.push(texture);
  }
}

function buildChair(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z, face) {
  gl.bindTexture(gl.TEXTURE_2D, textures[6]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(2.0, 0.5, 2.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  if(face == "far"){
    pushMatrix(modelMatrix);
    modelMatrix.translate(translate_x, translate_y+0.5, translate_z);  
    modelMatrix.scale(2.0, 2.0, 0.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  } else if(face == "near") {
    pushMatrix(modelMatrix);
    modelMatrix.translate(translate_x, translate_y+0.5, translate_z+1.5);  
    modelMatrix.scale(2.0, 2.0, 0.5);
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+1.5, translate_y-2, translate_z+1.5);  
  modelMatrix.scale(0.5, 2.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-2, translate_z+1.5);  
  modelMatrix.scale(0.5, 2.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+1.5, translate_y-2, translate_z);  
  modelMatrix.scale(0.5, 2.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-2, translate_z);  
  modelMatrix.scale(0.5, 2.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildFloor(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-2.04, translate_z+2);
  modelMatrix.scale(25.0, 0.1, 27.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildTable(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(6.5, 0.5, 5.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.5, translate_y-3, translate_z+0.5);  
  modelMatrix.scale(0.5, 3.4, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.5, translate_y-3, translate_z+4);  
  modelMatrix.scale(0.5, 3.4, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+5.5, translate_y-3, translate_z+0.5);  
  modelMatrix.scale(0.5, 3.4, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+5.5, translate_y-3, translate_z+4);  
  modelMatrix.scale(0.5, 3.4, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildLamp(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {  
  gl.bindTexture(gl.TEXTURE_2D, textures[7]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.75, translate_y-2, translate_z-0.75);
  modelMatrix.scale(2.0, 1, 2.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-2, translate_z);  
  modelMatrix.scale(0.5, 8.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.bindTexture(gl.TEXTURE_2D, textures[8]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.75, translate_y+5, translate_z-0.75);  
  modelMatrix.scale(2.0, 3.0, 2.0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildTvStand(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  gl.bindTexture(gl.TEXTURE_2D, textures[3]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(3.0, 0.5, 10.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.4, translate_y-2, translate_z+.4);
  modelMatrix.scale(2.2, 2.5, 9.2); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildTv(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  gl.bindTexture(gl.TEXTURE_2D, textures[4]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(1.0, 0.3, 6.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.25, translate_y+0.3, translate_z+2.5);
  modelMatrix.scale(0.5, 0.6, 1.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.25, translate_y+0.9, translate_z-3);
  modelMatrix.scale(0.5, 5.0, 12.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y+0.9, translate_z-3);
  modelMatrix.scale(0.35, 0.5, 12.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y+5.4, translate_z-3);
  modelMatrix.scale(0.35, 0.5, 12.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y+1.4, translate_z-3);
  modelMatrix.scale(0.35, 4, 0.5); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y+1.4, translate_z+8.5);
  modelMatrix.scale(0.35, 4, 0.5); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //v---- The Screen (May need a different texture to the body)
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.15, translate_y+1.4, translate_z-2.5);
  modelMatrix.scale(0.05, 4.0, 11.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  buildTvScreen(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), translate_x, translate_y, translate_z);

}

function buildTvScreen(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  if(screenOn){
    gl.bindTexture(gl.TEXTURE_2D, textures[9]);
  } else {
    gl.bindTexture(gl.TEXTURE_2D, textures[5]);
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.12, translate_y+1.4, translate_z-2.5);
  modelMatrix.scale(0.05, 4.0, 11.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

}

function buildRemote(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  gl.bindTexture(gl.TEXTURE_2D, textures[4]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.5, translate_z-1);  
  modelMatrix.scale(1.5, 0.5, 0.8);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.1, translate_y+0.5, translate_z+0.08)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+1.2, translate_y+0.5, translate_z+0.08)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.46, translate_y+0.5, translate_z+0.08)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.82, translate_y+0.5, translate_z+0.08)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.1, translate_y+0.5, translate_z+0.5)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+1.2, translate_y+0.5, translate_z+0.5)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.46, translate_y+0.5, translate_z+0.5)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.82, translate_y+0.5, translate_z+0.5)
}

function buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  gl.bindTexture(gl.TEXTURE_2D, textures[11]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.5, translate_z-1);  
  modelMatrix.scale(0.2, 0.05, 0.2);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildPouffe(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.5, translate_z-1);  
  modelMatrix.scale(3.0, 1.25, 3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.bindTexture(gl.TEXTURE_2D, textures[8]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.125, translate_y-0.5, translate_z-1.125);  
  modelMatrix.scale(3.25, 0.75, 3.25);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.bindTexture(gl.TEXTURE_2D, textures[2]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+2.5, translate_y-2, translate_z+1.5);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-2, translate_z+1.5);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+2.5, translate_y-2, translate_z-1);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-2, translate_z-1);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  gl.bindTexture(gl.TEXTURE_2D, textures[10]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-12, translate_y+1.5, translate_z-1.5);  
  modelMatrix.scale(1.5, 0.15, 1.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.bindTexture(gl.TEXTURE_2D, textures[7]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-10, translate_y+1.6, translate_z-1.5);  
  modelMatrix.scale(0.2, 0.15, 1.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-12.5, translate_y+1.5, translate_z-1.5);  
  modelMatrix.scale(0.2, 0.15, 1.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

}

function buildSofa(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  gl.bindTexture(gl.TEXTURE_2D, textures[2]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.5, translate_z-1);  
  modelMatrix.scale(3.0, 1.25, 12);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.bindTexture(gl.TEXTURE_2D, textures[8]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-0.5, translate_z+1.9);  
  modelMatrix.scale(3.125, 0.75, 2.95);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-0.5, translate_z-1.125);  
  modelMatrix.scale(3.125, 0.75, 2.95);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-0.5, translate_z+4.9);  
  modelMatrix.scale(3.125, 0.75, 2.95);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-0.5, translate_z+7.9);  
  modelMatrix.scale(3.125, 0.75, 3.1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.bindTexture(gl.TEXTURE_2D, textures[2]);
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.5, translate_z+11);  
  modelMatrix.scale(3.125, 3, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.5, translate_z-2);  
  modelMatrix.scale(3.125, 3, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.75, translate_y-1.5, translate_z-2);  
  modelMatrix.scale(0.75, 4, 14);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.5, translate_y-2, translate_z-2);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.5, translate_y-2, translate_z+11.5);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+2.5, translate_y-2, translate_z+11.5);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+2.5, translate_y-2, translate_z-2);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function buildScene(gl, u_ModelMatrix, u_NormalMatrix, global_x, global_y, global_z) {
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+1, global_y+0, global_z+chairPos1, "far");
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+5, global_y+0, global_z+chairPos1, "far");
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+1, global_y+0, global_z+chairPos2, "near");
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+5, global_y+0, global_z+chairPos2, "near");

  buildTv(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+22.5, global_y+TVPos+0.5, global_z+10);
  buildRemote(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+22+remotePos_x, global_y+2+Math.sin(rotateRem_y), global_z+17.5+Math.sin(rotateRem_z));

  buildTable(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+1, global_y+1, global_z+16);
  if(platePresent){
    buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+17, global_y+platePos, global_z+18);
    buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+13.75, global_y+platePos, global_z+18);
    buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+17, global_y+platePos, global_z+20);
    buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+13.75, global_y+platePos, global_z+20);
  }

  buildLamp(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+23, global_y+0, global_z+2);
  buildLamp(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+23, global_y+0, global_z+22);
  
  buildTvStand(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+21.5, global_y+0, global_z+8);

  buildSofa(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+13, global_y, global_z+9);
  buildPouffe(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+17, global_y+0, global_z+pouffePos);
 
  buildFloor(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x, global_y, global_z-2.5);
}