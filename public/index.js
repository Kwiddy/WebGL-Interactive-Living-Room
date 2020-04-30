// Create the vertex shader
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
  '     vec3 ambient = u_AmbientLight;\n' +
  '     v_Color = vec4(diffuse + ambient, 1);\n' +  
  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' + 
  '}\n';

  // Create the Fragment Shader
  var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'uniform vec3 u_lightColor;\n' +
  'uniform vec3 u_lightPosition;\n' +
  'uniform vec3 u_ambientLight;\n' +
  'uniform float u_lightIntensity;\n' +
  'uniform float u_pointScale;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  vec3 normal = normalize(v_Normal);\n' +
  '  vec3 lightDirection = normalize(u_lightPosition - vec3(v_Position));\n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0) * u_lightIntensity;\n' +
  '  vec3 diffuse = u_lightColor * v_Color.rgb * nDotL;\n' +
  '  vec3 ambient = u_ambientLight * v_Color.rgb;\n' +
  '  vec4 textCol = texture2D(u_Sampler, v_TexCoord);\n' +
  '  gl_FragColor = vec4(textCol.rgb * v_Color.rgb * u_lightIntensity + (nDotL * u_pointScale), textCol.a);\n' +
  //'  gl_FragColor = vec4(textCol.rgb * v_Color.rgb * nDotL, textCol.a);\n' +
  '}\n';

// Initalise the display matrices
var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

// Create matrix stack for pushing and popping 
var g_matrixStack = []; 

// Create arrays for storing the textures and their images
var textures = [];
var images = [];

// Global x, y, and z coordinates for scene construction
var global_x = -11;
var global_y = -4;
var global_z = 8;

// Initialize view variables for camera manipulation
var a1_View = -14;
var a2_View = 0;
var a3_View = 55;
var b1_View = 0;
var b2_View = 0;
var b3_View = -100;
var c1_View = 0;
var c2_View = 1;
var c3_View = 0;

// Create view variables for camera rotation
var ANGLE_STEP = 1.0;
var g_xAngle = 0.0;
var g_yAngle = 0.0;

// Initilize Variables
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

// Define booleans and limits for "C" animation
var chairPos1 = 13;
var chairPos2 = 22;
var chairTowards1 = false;
var chairAway1 = false;
var chairTowards2 = false;
var chairAway2 = false;
var platePos = 2;
var platePresent = false;

// Define booleans and limits for "P" animation
var pouffePos = 18;
var pouffeAway = false;
var pouffeTowards = false;

// Define booleans and limits for "T" animation
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

// Begin main functino
function main() {

    var canvas = document.getElementById('webgl');

    // Detect canvas dimensions and resize
    var width = canvas.width;
    var height = canvas.height;
    canvas.width = nextPowerof2(width);
    canvas.height = nextPowerof2(height);

    //Store object storing current state of graphics library 
    gl = getWebGLContext(canvas);
  
    //Check rendering context retrieval
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
  
    // Check shader initialization
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }

    // Specify values for clearing color buffers and clear
    gl.clearColor(0.0, 0.0, 0.0, 0.8);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Perform depth test on fragment
    gl.enable(gl.DEPTH_TEST);

    // Retrieve locations of uniform variables
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
    u_LightsOff = gl.getUniformLocation(gl.program, 'u_LightsOff');
    u_lightIntensity = gl.getUniformLocation(gl.program, 'u_lightIntensity');
    u_pointScale = gl.getUniformLocation(gl.program, 'u_pointScale');

    // Check uniform variable location retrieval
    if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix || !u_ProjMatrix || !u_LightColor || !u_AmbientLight || !u_LightDirection || !u_isLighting) { 
      console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
      return;
    }

    // Set initial light intensities
    initialIntensity = 1.0;
    pointIntensity = 0;

    // Specify initial values
    gl.uniform1f(u_lightIntensity, initialIntensity);
    gl.uniform1f(u_pointScale, pointIntensity);
    gl.uniform3f(u_LightColor, 0, 0, 0);
    gl.uniform3f(u_AmbientLight, 1, 1, 1);
    gl.uniform3fv(u_LightDirection, [0.5/7.5, 3.0/7.5, 4.0/7.5]);
    gl.uniform3fv(u_LightPosition, [5.0/8.0, 1.0/8.0, 2.0/8.0]);

    // Set look at and set perspective
    viewMatrix.setLookAt(a1_View, a2_View, a3_View, b1_View, b2_View, b3_View, c1_View, c2_View, c3_View);
    projMatrix.setPerspective(45, canvas.width/canvas.height, 1, 100);
    
    // Specify matrix values of view and projection matrices 
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    // Detect user keydown for camera movement
    document.onkeydown = function(ev) {
        keydown(ev, gl, u_ViewMatrix);
    };

    // var n = initVertexBuffers(gl, 0.55, 0.35, 0.1);

    // Generate a new image for each texture
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
    img10.src = "textures/bbcnews_512x512.jpg"

    //Plate white and cup white
    img11.src = "textures/white_256x256.jpg"

    //Remote buttons
    img12.src = "textures/red_256x256.png"

    // Add new texture images to array
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

    // Load final texture and initialize
    img12.onload = function() {initTexture(gl, u_Sampler, u_UseTextures, images);}; 
    
    requestAnimationFrame(update);
};


// Update the scene with animation frames
function update() {
  //Animations
  dinnertime();
  movePouffe();
  tvbop();

  // Draw matrix
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  
  // Request animation frame for update
  requestAnimationFrame(update);
}

// "C" animation
function dinnertime() {
  // Move chair away from table if required up to predefined limit
  //  Otherwise, move towards
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

  // Descent plates if bool is true
  if(platePresent) {
    if(platePos != 0) {
      platePos -= 0.25;
    } 
  }
}

// "P" animation
function movePouffe() {
  //Move pouffe backwards and forwards to predefined limits
  if(pouffeAway) {
    if(pouffePos == 9){
      pouffeAway = false;
    } else {
      pouffePos -= 0.5;
    } 
  } else if(pouffeTowards) {
    if(pouffePos == 18){
      pouffeTowards = false;
    } else {
      pouffePos += 0.5
    }
  }
}

// "T" animation
function tvbop() {
  // Set limit for tv remote animation
  var rotateLim = 9; 

  // Remove tv remote
  if(moveRemote) {
    //Detect rotating stage in animation
    if(rotatingRem){
      // Set circular motion
      rotateRem_y = (rotateRem_y + Math.PI/10) % Math.PI;
      rotateRem_z = ((rotateRem_y + Math.PI/10) % Math.PI) - Math.PI/2;
      
      //Increment counter
      remoteCount += 1;

      // Detect when remote has finished cycle
      if(remoteCount % (rotateLim/2) == 0) {
        rotateDone = true;
      }

      // Change bools as rotation has now finished
      if(remoteCount % rotateLim == 0){
        rotateRem_z = 0;
        rotateRem_y = 0;
        remoteOut = false;
        rotatingRem = false;
        screenOn = !screenOn;
      }
    } else {
      // sliding the remote out from initial position
      //  and returning to initial position when required
      //  based on the completion of the rotation
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

  // Animate the TV for once rotation has completed
  // Move the TV up and then down to predefined limits
  //  Before stopping
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

// Find the next power of 2 for canvas size
function nextPowerof2(value) {
  return Math.pow(2, Math.ceil(Math.log(value) / Math.log(2)));
}

// Check that a value is a power of 2
function isPowerof2(value) {
  return (value & (value - 1)) === 0;
}

// For when a key has been presesd
function keydown(ev, gl, u_ViewMatrix) {
  // Detect the key pressed
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
      case 76: //l (increase light intensity)
        initialIntensity += 0.2;
        break;
      case 75: // k (decrease light intensity)
        initialIntensity -= 0.1;
        break;
      case 77: // m (increase point light intensity)
        pointIntensity += 0.1;
        break;
      case 78: // n (decrease point light intensity)
        pointIntensity -= 0.1;
        break;
    default: return;
  }

  // Restrict light intensity to limits
  if (initialIntensity > 1) {
    initialIntensity = 1;
  }
  if (initialIntensity < 0) {
    initialIntensity = 0;
  }
  if (pointIntensity > 1) {
    pointIntensity = 1;
  }
  if (pointIntensity < 0) {
    pointIntensity = 0;
  }

  // Set look at for the view matrix with the updated variables
  viewMatrix.setLookAt(a1_View, a2_View, a3_View, b1_View, b2_View, b3_View, c1_View, c2_View, c3_View);
  
  // Set viewmatrix rotation as required
  viewMatrix.rotate(g_yAngle, 0, 1, 0); 
  viewMatrix.rotate(g_xAngle, 1, 0, 0); 
  
  // Update light intensity
  gl.uniform1f(u_lightIntensity, initialIntensity);
  gl.uniform1f(u_pointScale, pointIntensity);

  // Specify matrix values
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements); 
  }

// Initialize vertex buffers
function initVertexBuffers(gl) {
  // Create vertices array
  var vertices = new Float32Array([   
    0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, 
    0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, 
    0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, 
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, 
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, 
    0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  
  ]);
  
  // Colors
  var colors = new Float32Array([
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
 ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Texture Coordinates
  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoord', texCoords, 2)) return -1;


  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

// Initialize array buffer
function initArrayBuffer (gl, attribute, data, num) {
  // Create buffer and error handle
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // Create buffer object's data store
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // store attribute location and error handle
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }

  // binds buffer to attribute
  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);

  // reset the array buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

// Set vertex information
function initAxesVertexBuffers(gl) {
  // Set vertices colours
  var verticesColors = new Float32Array([
    -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  
      20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
      0.0,  20.0,   0.0,  1.0,  1.0,  1.0, 
      0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
      0.0,   0.0, -20.0,  1.0,  1.0,  1.0, 
      0.0,   0.0,  20.0,  1.0,  1.0,  1.0 
  ]);
  var n = 6;

  // Create vertex colour buffer and error handling
  var vertexColorBuffer = gl.createBuffer();  
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind buffer to ARRAY_BUFFER
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  // Get size of elements
  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  
  // Store position and error handling
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  // Bind vertexColorBuffer to a_Position
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  

  // Get color location and error handling
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }

  // Bind vertexColorBuffer to a_color
  gl.vertexAttribPointer(a_Color, 2, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Color);  

  // Reset ARRAY_BUFFER
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

//Push Matrix to matrix stack
function pushMatrix(m) { 
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

// Pop matrix from matric stack
function popMatrix() { 
  return g_matrixStack.pop();
}

// Initialize drawing of scene
function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

  // Clear buffer bits
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  
  // Set is lighting to true
  gl.uniform1i(u_isLighting, true); 

  // Construct the scene
  buildScene(gl, u_ModelMatrix, u_NormalMatrix, global_x, global_y, global_z);

}

// Draw a box
function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  
  //Push to the model Matrix
  pushMatrix(modelMatrix);

    // Define u_ModelMatrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Define the normal matrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Render from triangles
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  // Pop from the model matrix
  modelMatrix = popMatrix();
}

// Initialize textures
function initTexture(gl, u_Sampler, u_UseTextures, images){

  // For each available image loaded earlier
  for(i=0; i<images.length; i++) {
    // Create and bind the new texture
    var texture = gl.createTexture();
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Try specifying texture image and error handling
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
    } catch(e) {
        console.log(typeof(images[i]));
        console.log(e);
    }

    // Check image is size-compatible
    if(isPowerof2(images[i].width) && isPowerof2(images[i].height)) {
      // Generate mipmap
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // Wrap texture to fit
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    // Clear Buffer bits
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //Reset variables
    gl.uniform1i(u_Sampler, 0);
    gl.uniform1i(u_UseTextures, true);

    // Push new texture to array
    textures.push(texture);
  }
}

// Build chair for scene
function buildChair(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z, face) {
  // Bind texture to chair
  gl.bindTexture(gl.TEXTURE_2D, textures[6]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(2.0, 0.5, 2.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Change chair orientation
  if(face == "far"){
    pushMatrix(modelMatrix);
    modelMatrix.translate(translate_x, translate_y+1.25, translate_z-0.75);  
    modelMatrix.scale(2.0, 2.0, 0.5);
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

// Build floor for scene
function buildFloor(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  // Bind texture to floor
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-2.04, translate_z+2);
  modelMatrix.scale(25.0, 0.1, 27.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

// Build table for scene
function buildTable(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  // Bind texture to table
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(6.5, 0.5, 5.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-3, translate_y-1.8, translate_z-2);  
  modelMatrix.scale(0.5, 3.4, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-3, translate_y-1.8, translate_z+2);  
  modelMatrix.scale(0.5, 3.4, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+3, translate_y-1.8, translate_z-2);  
  modelMatrix.scale(0.5, 3.4, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+3, translate_y-1.8, translate_z+2);  
  modelMatrix.scale(0.5, 3.4, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

// Build lamp for scene
function buildLamp(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {  
  // Bind texture to lamp base
  gl.bindTexture(gl.TEXTURE_2D, textures[7]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(2.0, 1, 2.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y+4.5, translate_z);  
  modelMatrix.scale(0.5, 8.0, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Bind texture to lamp head
  gl.bindTexture(gl.TEXTURE_2D, textures[8]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y+10, translate_z);  
  modelMatrix.scale(2.0, 3.0, 2.0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

// Build TV Stand for scene
function buildTvStand(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  // Bind texture to TV Stand
  gl.bindTexture(gl.TEXTURE_2D, textures[3]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.25, translate_y-0.5, translate_z);
  modelMatrix.scale(3.0, 0.5, 10.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+0.4, translate_y-2, translate_z+.4);
  modelMatrix.scale(2.2, 2.5, 9.2); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

// Build TV for scene
function buildTv(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  // Bind texture to TV
  gl.bindTexture(gl.TEXTURE_2D, textures[4]);

  // Base
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);
  modelMatrix.scale(1.0, 0.3, 6.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // TV Support
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y+0.3, translate_z+0.3);
  modelMatrix.scale(0.5, 0.6, 1.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // TV Body
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y+2.8, translate_z+0.25);
  modelMatrix.scale(0.5, 5.0, 12.0); 
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Build TV Screen
  buildTvScreen(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), translate_x-0.35, translate_y+1.5, translate_z+3);

}

// Build TV Screen for TV
function buildTvScreen(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  // Bind texture depending on animation screen status
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

// Build TV remote for scene
function buildRemote(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  // Bind texture to TV remote
  gl.bindTexture(gl.TEXTURE_2D, textures[4]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.5, translate_z-1);  
  modelMatrix.scale(1.5, 0.5, 0.8);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Build buttons for TV remote
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x-0.45, translate_y+0.25, translate_z-0.21)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.45, translate_y+0.25, translate_z-0.21)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x-0.2, translate_y+0.25, translate_z-0.21)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.2, translate_y+0.25, translate_z-0.21)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x-0.45, translate_y+0.25, translate_z+0.21)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.45, translate_y+0.25, translate_z+0.21)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x-0.2, translate_y+0.25, translate_z+0.21)
  buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x+0.2, translate_y+0.25, translate_z+0.21)
}

// Build buttons for TV remote
function buildButton(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  // Bind texture to TV remote buttons
  gl.bindTexture(gl.TEXTURE_2D, textures[11]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.5, translate_z-1);  
  modelMatrix.scale(0.2, 0.05, 0.2);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

// Build Pouffe for scene
function buildPouffe(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y, translate_z);  
  modelMatrix.scale(3.0, 1.25, 3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Bind texture for Pouffe top
  gl.bindTexture(gl.TEXTURE_2D, textures[8]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y+1, translate_z-0.05);  
  modelMatrix.scale(3.25, 0.75, 3.25);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Bind texture for Pouffe Body
  gl.bindTexture(gl.TEXTURE_2D, textures[2]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+1.25, translate_y-0.8, translate_z+1.2);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-1.25, translate_y-0.8, translate_z+1.2);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+1.25, translate_y-0.8, translate_z-1.2);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-1.25, translate_y-0.8, translate_z-1.2);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

// Build Plate setup for scene "C" animation
function buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  //Bind texture for plates
  gl.bindTexture(gl.TEXTURE_2D, textures[10]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-12, translate_y+1.5, translate_z-1.5);  
  modelMatrix.scale(1.5, 0.15, 1.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Bind texture for cutlery
  gl.bindTexture(gl.TEXTURE_2D, textures[7]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-11, translate_y+1.5, translate_z-1.5);  
  modelMatrix.scale(0.2, 0.15, 1.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-13, translate_y+1.5, translate_z-1.5);  
  modelMatrix.scale(0.2, 0.15, 1.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

}

// Build sofa for scene
function buildSofa(gl, u_ModelMatrix, u_NormalMatrix, n, translate_x, translate_y, translate_z) {
  // Bind texture for sofa body
  gl.bindTexture(gl.TEXTURE_2D, textures[2]);
  
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.1, translate_y-2.3, translate_z+3.4);  
  modelMatrix.scale(3.0, 1.25, 13);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Bind texture for Sofa Top
  gl.bindTexture(gl.TEXTURE_2D, textures[8]);

  // Cushions
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.3, translate_z+1.9);  
  modelMatrix.scale(3.125, 0.75, 2.95);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.3, translate_z-1.125);  
  modelMatrix.scale(3.125, 0.75, 2.95);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.3, translate_z+4.9);  
  modelMatrix.scale(3.125, 0.75, 2.95);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x, translate_y-1.3, translate_z+7.9);  
  modelMatrix.scale(3.125, 0.75, 3.1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Bind texture for sofa body
  gl.bindTexture(gl.TEXTURE_2D, textures[2]);

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.05, translate_y-1.5, translate_z+10);  
  modelMatrix.scale(3.125, 3, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-0.05, translate_y-1.5, translate_z-3.3);  
  modelMatrix.scale(3.125, 3, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-2, translate_y-1, translate_z+3.3);  
  modelMatrix.scale(0.75, 4, 14);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Legs
  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-2, translate_y-3.2, translate_z-3.2);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x-2, translate_y-3.2, translate_z+10.25);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+1.2, translate_y-3.2, translate_z+10.25);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(translate_x+1.2, translate_y-3.2, translate_z-3.2);  
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

// Build scene
function buildScene(gl, u_ModelMatrix, u_NormalMatrix, global_x, global_y, global_z) {
  // Build chairs
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x-10, global_y, global_z-9+chairPos1, "far");
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x-6, global_y, global_z-9+chairPos1, "far");
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x-10, global_y, global_z-10+chairPos2, "near");
  buildChair(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x-6, global_y, global_z-10+chairPos2, "near");

  // Build TV and remote
  buildTv(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+11.5, global_y+TVPos+1, global_z+2);
  buildRemote(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+11.5+remotePos_x, global_y+2.75+Math.sin(rotateRem_y), global_z+7+Math.sin(rotateRem_z));

  // Build table
  buildTable(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x-8, global_y+1.5, global_z+8);
  
  // // Build plate setup for "C" animation
  if(platePresent){
    buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+5.5, global_y+0.2+platePos, global_z+8.5);
    buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+2.5, global_y+0.2+platePos, global_z+8.5);
    buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+5.5, global_y+0.2+platePos, global_z+11);
    buildPlateSetup(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+2.5, global_y+0.2+platePos, global_z+11);
  }

  // // Build lamp
  buildLamp(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+11, global_y-1.5, global_z-8);
  
  // Build TV Stand
  buildTvStand(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+11, global_y+1.25, global_z+2);

  // Build sofa and pouffe
  buildSofa(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+2.5, global_y+1.45, global_z-2);
  buildPouffe(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x+7, global_y-1, global_z-12+pouffePos);
 
  // Build floor
  buildFloor(gl, u_ModelMatrix, u_NormalMatrix, initVertexBuffers(gl), global_x, global_y, global_z);
}