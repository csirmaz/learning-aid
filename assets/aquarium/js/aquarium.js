/* ===========================================================================
 * aquarium.js  --  A lightweight, static 2D aquarium widget.
 * options: { basePath, storageKey, startEmpty }
 * ========================================================================= */

/* `global` is bound to `window` by the call at the foot of this file.  */
(function (global) {
  'use strict';

  var Config = global.AQUARIUM_CONFIG;
  if (!Config) { console.error('[Aquarium] config.js must be loaded before aquarium.js'); return; }

  /* ---------- small helpers ---------------------------------------------- */

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  
  function rand(a, b) { return a + Math.random() * (b - a); }
  
  function pickKey(obj) { 
    var k = Object.keys(obj);
    return k[(Math.random() * k.length) | 0];
  }
  
  function elem(tag, cls) { // Create DOM element
    var e = document.createElement(tag); 
    if (cls) e.className = cls; 
    return e;
  }

  /* Monotonic millisecond clock. `performance.now()` returns a steadily
   * increasing timestamp unaffected by wall-clock changes */
  var now = (global.performance && global.performance.now) ? function() { return global.performance.now(); } : function() { return Date.now(); };

  /* `seq` is a process-wide counter; `uid(prefix)` increments it and returns a
   * short unique id such as "f3" or "i7". */
  var seq = 0;
  function uid(p) { return p + (++seq); }

  /* ---------- Aquarium instance ---------------------------------------------- */

  function Aquarium(container, options) {
    if(!container) throw new Error('[Aquarium] a container element is required');
    this.container = container;
    this.opts = options || {};
    this.storeKey = this.opts.storageKey || 'aquarium_default';

    this.fish = []; 
    this.items = []; 
    this.food = [];
    this.attractors = [];
    this.worldW = 0; 
    this.worldH = 0;
    this._drag = null;
    this._dirty = false; 
    this._lastSave = 0;
    this._lastScroll = 0;
    this._last = now(); 
    this._running = false;

    this._buildDOM();
    this._relayout();

    if (!this._loadState()) {
      if (!this.opts.startEmpty) this._seed();
      this._saveState();
    }

    this._bindEvents();
    this._start();
  }

  var P = Aquarium.prototype;

  /* ---------- DOM scaffold ----------------------------------------------- */
  P._buildDOM = function () {
    var c = this.container;
    c.classList.add('aq-host');

    var root  = elem('div', 'aq-root');
    var tank  = elem('div', 'aq-tank');
    var world = elem('div', 'aq-world');
    var sand  = elem('div', 'aq-sand');
    var bg    = elem('div', 'aq-bubbles');

    for (var i = 0; i < 9; i++) {
      var b = elem('span', 'aq-bubble');
      b.style.left = rand(2, 98).toFixed(1) + '%';
      b.style.animationDuration = rand(6, 13).toFixed(1) + 's';
      b.style.animationDelay = (-rand(0, 13)).toFixed(1) + 's';
      b.style.setProperty('--s', (rand(5, 13) | 0) + 'px');
      bg.appendChild(b);
    }

    world.appendChild(sand);
    world.appendChild(bg);
    tank.appendChild(world);
    root.appendChild(tank);

    var fadeL = elem('div', 'aq-fade aq-fade-l');
    var fadeR = elem('div', 'aq-fade aq-fade-r');
    var hintL = elem('div', 'aq-hint aq-hint-l'); hintL.textContent = '\u2039';
    var hintR = elem('div', 'aq-hint aq-hint-r'); hintR.textContent = '\u203A';
    root.appendChild(fadeL); 
    root.appendChild(fadeR);
    root.appendChild(hintL); 
    root.appendChild(hintR);
    c.appendChild(root);

    this.root = root; 
    this.tank = tank; 
    this.world = world;
  };

  P._asset = function(src) {
    var b = this.opts.basePath || '';
    if (b && b.charAt(b.length - 1) !== '/') b += '/';
    return b + src;
  };

  /* ---------- sizing / responsive layout --------------------------------- */
  
  P._relayout = function () {
    var W = this.container.clientWidth, H = this.container.clientHeight;
    if (!W || !H) return;
    this.worldW = W * Config.worldWidthFactor;
    this.worldH = H;
    this.world.style.width = this.worldW + 'px';

    var self = this;
    this.items.forEach(function (it) { self._placeFromNorm(it); self._sizeEntity(it, it.def); });
    this.fish.forEach(function (f)  { self._placeFromNorm(f);  self._sizeEntity(f, f.def); });
    this.food.forEach(function (p)  { self._placeFromNorm(p);  self._sizeEntity(p, Config.food); });
    this._updateHints();
  };

  /* Shows a scroll arrow on each side the tank can still be scrolled towards. */
  P._updateHints = function () {
    var t = this.tank, cls = this.root.classList;
    var max = t.scrollWidth - t.clientWidth, sl = t.scrollLeft;
    if (sl > 2)         cls.add('aq-can-left');  else cls.remove('aq-can-left');
    if (sl < max - 2)   cls.add('aq-can-right'); else cls.remove('aq-can-right');
  };

  /* normalised (nx,ny) are the canonical position; px (x,y) are derived. */
  P._placeFromNorm = function (e) {
    e.x = (e.nx || 0) * this.worldW;
    e.y = (e.ny || 0) * this.worldH;
  };

  P._sizeEntity = function (e, def) {
    e._h = def.h * this.worldH * Config.worldHeightFactor;
    e.collideHeight = (def.collideHeight === undefined ? def.h : def.collideHeight) * this.worldH * Config.worldHeightFactor;
    e._w = e._h * def.aspect;
    e.el.style.width  = e._w + 'px';
    e.el.style.height = e._h + 'px';
  };

  /* ---------- spawning ---------------------------------------------------- */
  
  P._spawnFish = function (type, nx, ny, dir) {
    var def = Config.fish[type];
    var el = elem('div', 'aq-fish');
    var inner = elem('div', 'aq-fish-inner');
    var img = new Image();
    img.src = this._asset(def.src);
    img.draggable = false;
    inner.style.animationDuration = rand(1.4, 2.6).toFixed(2) + 's';
    inner.appendChild(img);
    el.appendChild(inner);
    this.world.appendChild(el);

    var f = {
      kind: 'fish', 
      id: uid('f'), 
      type: type, 
      def: def, 
      el: el, 
      img: img,
      nx: nx, 
      ny: ny, 
      x: 0, 
      y: 0, 
      vx: 0, 
      vy: 0,
      dir: dir || 1, 
      tnx: 0, 
      tny: 0, 
      phase: rand(0, 6.28), 
      wiggle: 0, 
      _w: 0, 
      _h: 0
    };
    this._newWander(f);
    this._placeFromNorm(f);
    this._sizeEntity(f, def);
    this.fish.push(f);

    var self = this;
    el.addEventListener('click', function(ev) { ev.stopPropagation(); self._pokeFish(f, ev); });
    return f;
  };

  P._spawnItem = function(type, nx, ny) {
    var def = Config.items[type];
    var el = elem('div', 'aq-item ' + (def.draggable ? 'aq-draggable' : 'aq-fixed'));
    var img = new Image();
    img.src = this._asset(def.src); 
    img.draggable = false;
    el.appendChild(img);
    this.world.appendChild(el);

    var it = {
      kind: 'item', 
      id: uid('i'), 
      type: type, 
      def: def, 
      el: el, 
      img: img,
      nx: nx, 
      ny: ny, 
      x: 0, 
      y: 0, 
      drag: false, 
      _w: 0, 
      _h: 0
    };
    this._placeFromNorm(it);
    this._sizeEntity(it, def);
    this.items.push(it);

    if (def.draggable) this._makeDraggable(it);
    return it;
  };

  P._spawnFood = function(nx, ny) {
    var el = elem('div', 'aq-food');
    var img = new Image();
    img.src = this._asset(Config.food.src); img.draggable = false;
    el.appendChild(img);
    this.world.appendChild(el);

    var p = {
      kind: 'food', 
      id: uid('p'), 
      def: Config.food, 
      el: el, 
      img: img,
      nx: nx, 
      ny: ny, 
      x: 0, 
      y: 0, 
      rest: 0, 
      _w: 0, 
      _h: 0
    };
    this._placeFromNorm(p);
    this._sizeEntity(p, Config.food);
    this.food.push(p);
    return p;
  };

  P._newWander = function(f) {
    var nx = (typeof f.nx === 'number') ? f.nx : 0.5, t = 0.5;
    for (var k = 0; k < 6; k++) {            /* pick a target worth travelling to */
      t = rand(0.06, 0.94);
      if (Math.abs(t - nx) >= 0.22) break;
    }
    f.tnx = t;
    f.tny = rand(Config.tuning.fishCeil + 0.04, Config.tuning.fishFloor - 0.04);
  };

  P._seed = function () {
    this._spawnItem('rock',    0.16, Config.tuning.itemRest);
    this._spawnItem('seaweed', 0.46, Config.tuning.itemRest);
    this._spawnItem('coral',   0.78, Config.tuning.itemRest);
    this._spawnFish('goldfish',  0.25, 0.40);
  };

  /* ---------- persistence ------------------------------------------------- */
  P._loadState = function() {
    var raw;
    try { raw = global.localStorage.getItem(this.storeKey); } catch (e) { return false; }
    if (!raw) return false;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return false; }
    if (!data || !data.items || !data.fish) return false;

    var self = this;
    data.items.forEach(function (s) {
      if (Config.items[s.type]) self._spawnItem(s.type, s.nx, s.ny);
    });
    data.fish.forEach(function (s) {
      if (Config.fish[s.type]) self._spawnFish(s.type, s.nx, s.ny, s.dir);
    });
    (data.food || []).forEach(function (s) { self._spawnFood(s.nx, s.ny); });
    return true;
  };

  P._saveState = function() {
    var data = {
      items: this.items.map(function (it) { return { type: it.type, nx: it.nx, ny: it.ny }; }),
      fish:  this.fish.map(function (f)  { return { type: f.type, nx: f.nx, ny: f.ny, dir: f.dir }; }),
      food:  this.food.map(function (p)  { return { nx: p.nx, ny: p.ny }; })
    };
    try { global.localStorage.setItem(this.storeKey, JSON.stringify(data)); } catch (e) {}
    this._dirty = false;
    this._lastSave = now() / 1000;
  };

  P._queueSave = function () { this._dirty = true; };

  /* ---------- public-ish grant API --------------------------------------- */

  P.grantFish = function(type) {
    type = (type && Config.fish[type]) ? type : pickKey(Config.fish);
    var viewX = this.tank.scrollLeft + this.container.clientWidth * rand(0.2, 0.8);
    var nx = clamp(viewX / this.worldW, 0.12, 0.88);
    var f = this._spawnFish(type, nx, rand(Config.tuning.fishCeil + 0.06, 0.62));
    f.wiggle = now() / 1000 + 0.85;
    this.attractors.push({ x: f.x, y: f.y, until: now() / 1000 + Config.tuning.lureTtl }); // others attracted to new
    this._saveState();
    return type;
  };

  P.grantItem = function(type) {
    type = (type && Config.items[type]) ? type : pickKey(Config.items);
    var viewX = this.tank.scrollLeft + this.container.clientWidth * rand(0.2, 0.8);
    var nx = clamp(viewX / this.worldW, 0.06, 0.94);
    var ny = Config.items[type].draggable ? 0.12 : T.itemRest;
    var it = this._spawnItem(type, nx, ny);   // spawns high, then settles down
    this.attractors.push({ x: it.x, y: this.worldH * 0.72, until: now() / 1000 + Config.tuning.itemTtl }); // fish attracted to new item
    this._saveState();
    return type;
  };

  P.feed = function(count) {
    count = clamp((count | 0) || 6, 1, 30);
    var cw = this.container.clientWidth;
    var base = this.tank.scrollLeft + cw * 0.5;
    for (var i = 0; i < count; i++) {
      var nx = clamp((base + rand(-0.42, 0.42) * cw) / this.worldW, 0.04, 0.96);
      this._spawnFood(nx, rand(0.03, 0.12));
    }
    this._saveState();
    return count;
  };

  P.reset = function() {
    try { global.localStorage.removeItem(this.storeKey); } catch (e) {}
    var rm = function (e) { if (e.el && e.el.parentNode) e.el.parentNode.removeChild(e.el); };
    this.fish.forEach(rm); this.items.forEach(rm); this.food.forEach(rm);
    this.fish = []; this.items = []; this.food = []; this.attractors = [];
    if (!this.opts.startEmpty) this._seed();
    this._saveState();
  };

  /* ---------- drag & drop (pointer events, touch friendly) --------------- */

  P._makeDraggable = function(it) {
    var self = this;
    it.el.addEventListener('pointerdown', function(ev) {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.preventDefault();
      self._beginDrag(it, ev);
    });
  };

  P._beginDrag = function(it, ev) {
    if (this._drag) return;
    var wr = this.world.getBoundingClientRect();
    it.drag = true;
    it.el.classList.add('aq-dragging');
    try { it.el.setPointerCapture(ev.pointerId); } catch (er) {}

    var self = this;
    var d = {
      it: it, 
      pid: ev.pointerId,
      offx: it.x - (ev.clientX - wr.left),
      offy: it.y - (ev.clientY - wr.top),
      cx: ev.clientX,
      move: function(ev2) { if(ev2.pointerId === d.pid) self._dragMove(ev2); },
      up:   function(ev2) { if(ev2.pointerId === d.pid) self._endDrag(ev2); }
    };
    d.scrollTimer = setInterval(function () { self._dragEdgeScroll(); }, 40);
    this._drag = d;

    it.el.addEventListener('pointermove', d.move);
    it.el.addEventListener('pointerup', d.up);
    it.el.addEventListener('pointercancel', d.up);
  };

  P._dragMove = function(ev) {
    var d = this._drag, it = d.it;
    d.cx = ev.clientX;
    var wr = this.world.getBoundingClientRect();
    var x = (ev.clientX - wr.left) + d.offx;
    var y = (ev.clientY - wr.top) + d.offy;
    it.x = clamp(x, it._w / 2, this.worldW - it._w / 2);
    it.y = clamp(y, it._h, this.worldH * Config.tuning.dragFloor);
    it.nx = it.x / this.worldW;
    it.ny = it.y / this.worldH;
  };

  /* keeps a held item scrolling when the finger rests against an edge */
  P._dragEdgeScroll = function () {
    var d = this._drag; 
    if (!d || d.cx == null) return;
    var tr = this.tank.getBoundingClientRect(), step = 0;
    if (d.cx < tr.left + 36)  step = -9;
    else if (d.cx > tr.right - 36) step = 9;
    if (!step) return;
    var before = this.tank.scrollLeft;
    this.tank.scrollLeft += step;
    var moved = this.tank.scrollLeft - before;
    if (moved) {
      var it = d.it;
      it.x = clamp(it.x + moved, it._w / 2, this.worldW - it._w / 2);
      it.nx = it.x / this.worldW;
    }
  };

  P._endDrag = function(ev) {
    var d = this._drag; 
    if (!d) return;
    var it = d.it;
    it.el.removeEventListener('pointermove', d.move);
    it.el.removeEventListener('pointerup', d.up);
    it.el.removeEventListener('pointercancel', d.up);
    try { it.el.releasePointerCapture(d.pid); } catch (e) {}
    if (d.scrollTimer) clearInterval(d.scrollTimer);
    it.el.classList.remove('aq-dragging');
    it.drag = false;
    this._drag = null;

    /* a moved item draws fish */
    this.attractors.push({
      x: it.x, y: Math.min(it.y, this.worldH * 0.78),
      until: now() / 1000 + Config.tuning.itemTtl
    });
    this._saveState();
  };

  /* ---------- stacking / settling ---------------------------------------- */
  /* Returns the surface an item should rest its base on: the highest
     overlapping item that sits strictly below it, else the sand.        */

  P._supportOf = function(it) {
    var best = this.worldH * Config.tuning.itemRest, who = null;
    for (var i = 0; i < this.items.length; i++) {
      var c = this.items[i];
      if (c === it || c.drag) continue;
      if (Math.abs(it.x - c.x) > (it._w + c._w) * 0.34) continue;  /* must overlap in x */
      if (c.y <= it.y + 2) continue;                               /* c must be below us */
      var top = c.y - c.collideHeight;
      if (top < best) { best = top; who = c; }
    }
    return { y: best, item: who };
  };

  P._stepItems = function(dt) {
    var fall = Config.tuning.itemFall * this.worldH * dt;
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (it.drag || !it.def.draggable) continue;
      var sy = this._supportOf(it).y;
      if (it.y < sy) it.y = Math.min(sy, it.y + fall);
      else if (it.y > sy) it.y = sy;
      it.ny = it.y / this.worldH;
    }
  };

  /* ---------- food ------------------------------------------------------- */
  
  P._stepFood = function (dt) {
    var H = this.worldH, sink = Config.tuning.foodSink * H * dt;
    var restY = H * Config.tuning.itemRest, t = now() / 1000;
    for (var i = this.food.length - 1; i >= 0; i--) {
      var p = this.food[i];
      if (p.y < restY) { p.y += sink; }
      else {
        p.y = restY;
        if (!p.rest) p.rest = t;
        if (t - p.rest > Config.tuning.foodRestLife) { this._removeFood(i); continue; }
      }
      p.ny = p.y / H;
    }
  };

  P._removeFood = function (i) {
    var p = this.food[i];
    if (!p) return;
    this.food.splice(i, 1);
    p.el.classList.add('aq-gone');
    setTimeout(function () { if (p.el.parentNode) p.el.parentNode.removeChild(p.el); }, 260);
  };

  /* ---------- fish control ---------------------------------------------------- */

  P._nearestFood = function (x, y, maxd) {
    var best = null, bd = maxd * maxd;
    for (var i = 0; i < this.food.length; i++) {
      var p = this.food[i], dx = p.x - x, dy = p.y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };

  P._nearestAttractor = function (x, y, maxd) {
    var best = null, bd = maxd * maxd;
    for (var i = 0; i < this.attractors.length; i++) {
      var a = this.attractors[i], dx = a.x - x, dy = a.y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  };

  P._stepFish = function (dt, t) {
    var W = this.worldW, H = this.worldH;
    var ceil = H * Config.tuning.fishCeil, floor = H * Config.tuning.fishFloor;

    for (var i = 0; i < this.fish.length; i++) {
      var f = this.fish[i], base = f.def.speed * Config.tuning.fishSpeedBase, spd = base;
      var gx, gy, chasing = false;

      var fp = this._nearestFood(f.x, f.y, Config.tuning.foodRange * W);
      if (fp) { gx = fp.x; gy = fp.y; chasing = true; }
      else {
        var at = this._nearestAttractor(f.x, f.y, Config.tuning.attractRange * W);
        if (at) { gx = at.x; gy = at.y; chasing = true; }
        else {
          if (Math.abs(f.x - f.tnx * W) < W * 0.03 &&
              Math.abs(f.y - f.tny * H) < H * 0.05) this._newWander(f);
          gx = f.tnx * W; gy = f.tny * H;
        }
      }
      if (chasing) spd *= Config.tuning.seekBoost;

      var ang = Math.atan2(gy - f.y, gx - f.x);
      var turn = Math.min(1, Config.tuning.turnRate * dt);
      f.vx += (Math.cos(ang) * spd - f.vx) * turn;
      f.vy += (Math.sin(ang) * spd - f.vy) * turn;

      f.x += f.vx * dt;
      f.y += f.vy * dt + Math.sin(t * 2.3 + f.phase) * Config.tuning.bob * H * dt;

      /* Personal space: nudge away from any fish that is too close, so a crowd
         gathering on one attractor spreads into a loose shoal instead of all
         stacking on the same point. Position relaxation is self-limiting (the
         push fades to zero as fish part), so it cannot accumulate or oscillate. */
      var sx = 0, sy = 0;
      for (var j = 0; j < this.fish.length; j++) {
        if (j === i) continue;
        var o = this.fish[j];
        var ox = f.x - o.x, oy = f.y - o.y;
        var r = (f._h + o._h) * 0.6;            /* combined personal radius */
        var d2 = ox * ox + oy * oy;
        if (d2 > 0.01 && d2 < r * r) {
          var d = Math.sqrt(d2);
          var push = (1 - d / r) / d;           /* closer neighbours push harder */
          sx += ox * push; sy += oy * push;
        }
      }
      var sep = base * Config.tuning.sepGain * dt;
      f.x += sx * sep;
      f.y += sy * sep;

      if (f.x < W * 0.03) { f.x = W * 0.03; f.vx = Math.abs(f.vx); this._newWander(f); }
      if (f.x > W * 0.97) { f.x = W * 0.97; f.vx = -Math.abs(f.vx); this._newWander(f); }
      if (f.y < ceil)  { f.y = ceil;  f.vy = Math.abs(f.vy); }
      if (f.y > floor) { f.y = floor; f.vy = -Math.abs(f.vy); }

      /* Flip facing only on committed horizontal motion. The wide dead-band
         (a third of cruise speed) stops fish flickering when they slow down
         near a target or turn towards a new one. */
      var flip = base * 0.34;
      if (f.vx > flip) f.dir = 1;
      else if (f.vx < -flip) f.dir = -1;

      if (fp) {
        var dx = fp.x - f.x, dy = fp.y - f.y, ed = Config.tuning.eatDist * H;
        if (dx * dx + dy * dy < ed * ed) {
          var idx = this.food.indexOf(fp);
          if (idx >= 0) this._removeFood(idx);
          f.wiggle = t + 0.7;
          this._queueSave();
        }
      }

      f.nx = f.x / W; f.ny = f.y / H;
    }
  };

  /* ---------- taps: lure fish / poke a fish ------------------------------ */
  
  P._onTap = function (ev) {
    if (now() - this._lastScroll < 160) return;          /* ignore the tail of a scroll */
    var wr = this.world.getBoundingClientRect();
    var x = ev.clientX - wr.left;
    var y = clamp(ev.clientY - wr.top, this.worldH * 0.12, this.worldH * 0.8);
    this.attractors.push({ x: x, y: y, until: now() / 1000 + Config.tuning.lureTtl });
    this._ripple(x, y);
  };

  P._pokeFish = function (f, ev) {
    f.wiggle = now() / 1000 + 0.85;
    // this.attractors.push({ x: f.x, y: f.y, until: now() / 1000 + Config.tuning.lureTtl });
    var wr = this.world.getBoundingClientRect();
    this._ripple(ev.clientX - wr.left, ev.clientY - wr.top);
  };

  P._ripple = function (x, y) {
    var r = elem('div', 'aq-ripple');
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    this.world.appendChild(r);
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 640);
  };

  /* ---------- render ----------------------------------------------------- */
  P._render = function (t) {
    var i, e;
    for (i = 0; i < this.items.length; i++) {
      e = this.items[i];
      e.el.style.transform = 'translate(' + (e.x - e._w / 2) + 'px,' + (e.y - e._h) + 'px)';
      e.el.style.zIndex = 100 + Math.round(e.y / 4);
    }
    for (i = 0; i < this.food.length; i++) {
      e = this.food[i];
      e.el.style.transform = 'translate(' + (e.x - e._w / 2) + 'px,' + (e.y - e._h / 2) + 'px)';
    }
    for (i = 0; i < this.fish.length; i++) {
      e = this.fish[i];
      var rot = t < e.wiggle ? Math.sin(t * 34) * 16 : 0;
      e.el.style.transform =
        'translate(' + (e.x - e._w / 2) + 'px,' + (e.y - e._h / 2) + 'px) ' +
        'scaleX(' + e.dir + ') rotate(' + rot + 'deg)';
      e.el.style.zIndex = 600 + i;
    }
  };

  /* ---------- main loop -------------------------------------------------- */
  P._frame = function () {
    if (!this._running) return;
    var ms = now(), t = ms / 1000;
    var dt = clamp((ms - this._last) / 1000, 0, 0.05);
    this._last = ms;

    for (var i = this.attractors.length - 1; i >= 0; i--) {
      if (this.attractors[i].until < t) this.attractors.splice(i, 1);
    }

    if (this.worldW && this.worldH) {
      this._stepFood(dt);
      this._stepFish(dt, t);
      this._stepItems(dt);
      this._render(t);
      if (this._dirty && t - this._lastSave > Config.tuning.saveEvery) this._saveState();
    } else {
      /* The container reported no size at init (a layout race seen on some
         mobile browsers). Keep retrying so the game appears as soon as the
         container becomes measurable, even without ResizeObserver. */
      this._relayout();
    }
    this._raf = global.requestAnimationFrame(this._frameBound);
  };

  P._start = function () {
    if (this._running) return;
    this._running = true;
    this._last = now();
    this._frame();
  };

  /* ---------- events ----------------------------------------------------- */
  P._bindEvents = function () {
    var self = this;
    this._frameBound = function () { self._frame(); };

    this.world.addEventListener('click', function (ev) { self._onTap(ev); });

    this.tank.addEventListener('scroll', function () {
      self._lastScroll = now();
      self._updateHints();
    }, { passive: true });

    if (global.ResizeObserver) {
      this._ro = new ResizeObserver(function () { self._relayout(); });
      this._ro.observe(this.container);
    } else {
      global.addEventListener('resize', function () { self._relayout(); });
    }

    var save = function () { self._saveState(); };
    global.addEventListener('pagehide', save);
    global.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { self._saveState(); self._running = false; }
      else if (!self._running) { self._running = true; self._last = now(); self._frame(); }
    });
  };

  /* ======================================================================= *
   *  Public namespace
   * ======================================================================= */

  global.Aquarium = Aquarium;

})(window);
