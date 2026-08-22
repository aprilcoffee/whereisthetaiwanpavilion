/* "It's easy to remove a name" — a small breakout on the pavilion list.
   Self-contained: if anything here fails the rest of the page is unaffected.
   The real sign-up link lives in the letter; this is only a second route to it. */

(function () {
  var board = document.getElementById("board");
  var host  = document.getElementById("bricks");
  var sparks = document.getElementById("sparks");
  var ballEl = document.getElementById("ball");
  var padEl  = document.getElementById("paddle");
  var overlay = document.getElementById("overlay");
  var startBtn = document.getElementById("game-start");
  var hintEl = document.getElementById("hint");
  if (!board || !host || !sparks || !ballEl || !padEl || !overlay || !startBtn || !hintEl) return;

  /* rows are balanced like a brick wall, widest names spread across the top */
  var ROWS = [
    [["1646", "#C2185B"], ["ALLARTNOW", "#4CAF50"], ["ASAKUSA", "#8B1A1A"], ["AUSTRIA", "#E0A81E"], ["BRAZIL", "#2E6B5E"]],
    [["CANADA", "#3F51B5"], ["CASA WABI", "#E08A4B"], ["CASINO LUXEMBOURG", "#9AD0E3"]],
    [["CHINA", "#E91E8C"], ["DENMARK", "#8A8A22"], ["FRANCE", "#F0A6C8"], ["INDONESIA", "#5EBFA0"]],
    [["ITALY", "#2E6FA8"], ["IVAE", "#A66A2C"], ["KALAALLIT ILLUUTAAT", "#A8C63C"]],
    [["KOGANECHO", "#C0AEDA"], ["NTMOFA", "#9E9E9E"], ["PERU", "#E04A2F"], ["PHILIPPINES", "#2E6B5E"]],
    [["POLAND", "#6A3FA0"], ["MALTA", "#E8622A"], ["MONGOLIA", "#F2A93B"], ["NETHERLANDS", "#3FA9A0"]],
    [["STATELESS MIND", "#2E9BD6"], ["SWITZERLAND", "#8A8A8A"]],
    [["UCCN", "#D4A017"], ["URUGUAY", "#3FA043"]]
  ];

  var n = 0;
  ROWS.forEach(function (row) {
    var r = document.createElement("div");
    r.className = "brick-row";
    row.forEach(function (pair) {
      var b = document.createElement("span");
      b.className = "brick";
      b.textContent = pair[0];
      b.style.color = pair[1];
      b.style.borderColor = pair[1];
      b.style.flexGrow = String(pair[0].length);
      b.style.transitionDelay = (n++ * 26) + "ms";
      r.appendChild(b);
    });
    host.appendChild(r);
  });

  var bricks = [].slice.call(host.querySelectorAll(".brick"));
  var boxes = [], W = 0, H = 0, R = 5;
  var PAD = { w: 0, h: 0, x: 0 };
  var ball = { x: 0, y: 0, vx: 0, vy: 0 };
  var state = "idle";            // idle | ready | playing | done
  var raf = 0, last = 0, left = 0, base = 1;

  function measure() {
    var br = board.getBoundingClientRect();
    W = br.width; H = br.height;
    board.style.setProperty("--u", (W / 100) + "px");
    R = Math.max(4, W * 0.0135);
    PAD.w = Math.max(52, W * 0.2);
    PAD.h = Math.max(6, W * 0.02);
    padEl.style.width = PAD.w + "px";
    padEl.style.height = PAD.h + "px";
    ballEl.style.width = ballEl.style.height = (R * 2) + "px";
    base = Math.max(4.2, W * 0.018);

    boxes = bricks.map(function (el) {
      var b = el.getBoundingClientRect();
      return { el: el, x: b.left - br.left, y: b.top - br.top, w: b.width, h: b.height,
               alive: el.dataset.dead !== "1" };
    });
  }

  /* the ball always travels at the same speed — only its direction changes */
  function normalise() {
    var sp = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx = ball.vx / sp * base;
    ball.vy = ball.vy / sp * base;
    // never let it crawl horizontally
    if (Math.abs(ball.vy) < base * 0.3) {
      ball.vy = (ball.vy < 0 ? -1 : 1) * base * 0.3;
      normalise();
    }
  }

  function draw() {
    ballEl.style.transform = "translate(" + (ball.x - R) + "px," + (ball.y - R) + "px)";
    padEl.style.transform  = "translate(" + PAD.x + "px," + (H - PAD.h) + "px)";
  }

  function toPaddle() {
    state = "ready";
    ball.x = PAD.x + PAD.w / 2;
    ball.y = H - PAD.h - R - 1;
    ball.vx = ball.vy = 0;
    hintEl.hidden = false;
    draw();
  }

  function launch() {
    if (state !== "ready") return;
    hintEl.hidden = true;
    var ang = (-0.5 + (Math.random() - 0.5) * 0.5) * Math.PI;   // upward, slight spread
    ball.vx = Math.cos(ang) * base;
    ball.vy = -Math.abs(Math.sin(ang) * base);
    normalise();
    state = "playing";
    last = 0;
    raf = requestAnimationFrame(step);
  }

  function burst(x, y, colour) {
    for (var i = 0; i < 7; i++) {
      var p = document.createElement("i");
      p.className = "spark";
      p.style.background = colour;
      p.style.left = x + "px";
      p.style.top = y + "px";
      var a = Math.random() * Math.PI * 2, d = (0.6 + Math.random()) * R * 3;
      p.style.setProperty("--dx", (Math.cos(a) * d).toFixed(1) + "px");
      p.style.setProperty("--dy", (Math.sin(a) * d).toFixed(1) + "px");
      sparks.appendChild(p);
      setTimeout(function (el) { return function () { el.remove(); }; }(p), 520);
    }
  }

  function hit(box) {
    var cx = Math.max(box.x, Math.min(ball.x, box.x + box.w));
    var cy = Math.max(box.y, Math.min(ball.y, box.y + box.h));
    var dx = ball.x - cx, dy = ball.y - cy;
    if (dx * dx + dy * dy > R * R) return false;
    var ox = (box.w / 2 + R) - Math.abs(ball.x - (box.x + box.w / 2));
    var oy = (box.h / 2 + R) - Math.abs(ball.y - (box.y + box.h / 2));
    if (ox < oy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
    return true;
  }

  function step(t) {
    if (state !== "playing") return;
    var dt = last ? Math.min(2.5, (t - last) / 16.667) : 1;
    last = t;

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x < R)     { ball.x = R;     ball.vx =  Math.abs(ball.vx); }
    if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); }
    if (ball.y < R)     { ball.y = R;     ball.vy =  Math.abs(ball.vy); }

    // paddle
    var py = H - PAD.h;
    if (ball.vy > 0 && ball.y + R >= py && ball.y - R < py &&
        ball.x >= PAD.x - R && ball.x <= PAD.x + PAD.w + R) {
      ball.y = py - R;
      ball.vy = -Math.abs(ball.vy);
      var rel = Math.max(-1, Math.min(1, (ball.x - (PAD.x + PAD.w / 2)) / (PAD.w / 2)));
      ball.vx += rel * base * 0.6;
      normalise();
    }

    // missed — the ball goes back to the paddle, nothing else is lost
    if (ball.y - R > H) { return toPaddle(); }

    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (!b.alive) continue;
      if (hit(b)) {
        b.alive = false;
        b.el.dataset.dead = "1";
        b.el.classList.add("dead");
        burst(ball.x, ball.y, b.el.style.color);
        left--;
        normalise();
        if (left <= 0) return win();
        break;
      }
    }

    // with only a few names left, bend the path a touch toward the nearest one
    // so the endgame does not drag — gentle enough not to read as a swerve
    if (left <= 10) {
      var best = null, bd2 = Infinity;
      for (var k = 0; k < boxes.length; k++) {
        var q = boxes[k];
        if (!q.alive) continue;
        var qx = (q.x + q.w / 2) - ball.x, qy = (q.y + q.h / 2) - ball.y;
        var dd = qx * qx + qy * qy;
        if (dd < bd2) { bd2 = dd; best = [qx, qy]; }
      }
      if (best) {
        var dl = Math.sqrt(bd2) || 1;
        ball.vx += best[0] / dl * base * 0.07 * dt;
        ball.vy += best[1] / dl * base * 0.07 * dt;
        normalise();
      }
    }

    draw();
    raf = requestAnimationFrame(step);
  }

  function win() {
    cancelAnimationFrame(raf);
    hintEl.hidden = true;
    setTimeout(reset, 700);
  }

  function start() {
    overlay.hidden = true;
    board.classList.add("playing");
    host.classList.add("on");                 // bricks fade in, staggered
    measure();
    left = boxes.filter(function (b) { return b.alive; }).length;
    PAD.x = (W - PAD.w) / 2;
    toPaddle();
  }

  function reset() {
    bricks.forEach(function (el) { delete el.dataset.dead; el.classList.remove("dead"); });
    sparks.textContent = "";
    board.classList.remove("playing");
    host.classList.remove("on");
    overlay.hidden = false;
    hintEl.hidden = true;
    state = "idle";
    measure();
    draw();
  }

  function movePaddle(clientX) {
    if (state === "idle" || state === "done") return;
    var br = board.getBoundingClientRect();
    PAD.x = Math.max(0, Math.min(W - PAD.w, clientX - br.left - PAD.w / 2));
    if (state === "ready") { ball.x = PAD.x + PAD.w / 2; }
    draw();
  }

  board.addEventListener("pointermove", function (e) { movePaddle(e.clientX); });
  board.addEventListener("pointerdown", function (e) { movePaddle(e.clientX); launch(); });
  board.addEventListener("touchmove", function (e) {
    if (e.touches[0]) { movePaddle(e.touches[0].clientX); e.preventDefault(); }
  }, { passive: false });
  document.addEventListener("keydown", function (e) {
    if (state === "idle" || state === "done") return;
    if (e.key === "ArrowLeft")  { PAD.x = Math.max(0, PAD.x - W * 0.06); if (state === "ready") ball.x = PAD.x + PAD.w / 2; draw(); }
    if (e.key === "ArrowRight") { PAD.x = Math.min(W - PAD.w, PAD.x + W * 0.06); if (state === "ready") ball.x = PAD.x + PAD.w / 2; draw(); }
    if (e.key === " " || e.key === "Enter") { if (state === "ready") { launch(); e.preventDefault(); } }
  });

  startBtn.addEventListener("click", start);

  var t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      measure();
      PAD.x = Math.min(PAD.x, W - PAD.w);
      if (state === "ready") toPaddle();
      else { ball.x = Math.min(ball.x, W - R); ball.y = Math.min(ball.y, H - R); draw(); }
    }, 150);
  });

  measure();
  draw();
})();
