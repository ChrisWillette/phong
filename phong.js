//chris willette
var tube = {
  verts: null,
  normals: null,
  tangets: null,
  createGeometry: function() {
      var N = this.N, M = this.M;
      var a = this.a, b = this.b;
      var p = this.p, q = this.q;
      var R = this.R;
      var sz = (N + 1) * (M + 1) * 3;
      this.verts = new Float32Array(sz);
      this.normals = new Float32Array(sz);
      this.tangents = new Float32Array(3*(this.N+1)*(this.M+1));
      var n = 0;
      var dt = 2 * Math.PI / N;
      var du = 2 * Math.PI / M;
      for (var i = 0, t = 0.0; i <= N; i++, t += dt) {
          if (i == N) {
              t == 0.0;
          };
          var sinqt = Math.sin(q * t), cosqt = Math.cos(q * t);
          var sinpt = Math.sin(p * t), cospt = Math.cos(p * t);
          var abcos = a + b * cosqt;
          var C = [abcos * cospt, abcos * sinpt, b * sinqt];
          var T = [-p * C[1] - b * q * sinqt * cospt, p * C[0] - b * q * sinqt * sinpt, q * b * cosqt];
          var A = [-p * T[1] + b * q * (p * sinqt * sinpt - q * cosqt * cospt), 
                    p * T[0] - b * q * (p * sinqt * cospt + q * cosqt * sinpt),
                  -q * q * b * sinqt];
          var B = cross3(T, A);
          norm3(T);
          norm3(B);
          var N_ = cross3(B, T);
          for (var j = 0, u = 0.0; j <= M; j++, u += du) {
              if (j == M) {
                  u = 0.0;
              };
              var cosu = Math.cos(u), sinu = Math.sin(u);
              for (var k = 0; k < 3; k++) {
                  this.normals[n] = cosu * N_[k] + sinu * B[k];
                  this.verts[n] = C[k] + R * this.normals[n];
                  this.tangents[n] = T[k]; // added tangent vector
                  n++;
              };
          };
      };
  },

  triangleStrip: null,
  createTriangleStrip: function() {
      var N = this.N, M = this.M;
      var nm = 2 * (M + 2) * this.N - 2;
      this.triangleStrip = new Uint16Array(nm);
      var index = function(i, j) {
          return i * (M + 1) + j;
      };
      n = 0;
      for (var i = 0; i < this.N; i++) {
          if (i > 0) {
              this.triangleStrip[n++] = index(i, 0);
          };
          for (var j = 0; j <= M; j++) {
              this.triangleStrip[n++] = index(i, j);
              this.triangleStrip[n++] = index(i + 1, j);
          };
          if (i < this.N - 1) {
              this.triangleStrip[n++] = index(i + 1, M);
          };
      };
  },

  texCoords: null,
  createTexCoords: function(){
  	this.texCoords = new Float32Array(2*(this.N+1)*(this.M+1));
  	var index = 0;
  	for (var i = 0; i <= this.N; i++){
			for (var j = 0; j <= this.M; j++) {
				this.texCoords[index++] = i/this.N;
				this.texCoords[index++] = j/this.M;
			}
  	}
  }
}; 
