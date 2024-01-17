const DEBUG = true;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  frameRate(60);
  car = new Car(width / 2, height / 2);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background("gray");
  car.update(deltaTime / 1000);
  car.draw();
}

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  static constrainDistance(a, b, length, iterations = 5) {
    for (let i = 0; i < iterations; i++) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;

      const d = Math.hypot(dx, dy);
      const p = (length - d) / d / 2;

      const ox = dx * p;
      const oy = dy * p;

      b.x -= ox;
      b.y -= oy;
      a.x += ox;
      a.y += oy;
    }
  }

  dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  get length() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const length = this.length;
    this.x /= length;
    this.y /= length;
    return this;
  }

  static drawLineEquation(
    origin,
    normal,
    length = 100 // max(windowWidth, windowHeight)
  ) {
    const ax = origin.x + normal.y * length;
    const ay = origin.y - normal.x * length;
    const bx = origin.x - normal.y * length;
    const by = origin.y + normal.x * length;
    line(ax, ay, bx, by);
  }

  static drawLineAlongNormal(
    origin,
    normal,
    length = 100 // max(windowWidth, windowHeight)
  ) {
    const ax = origin.x + normal.y * length;
    const ay = origin.y + normal.x * length;
    const bx = origin.x - normal.y * length;
    const by = origin.y - normal.x * length;
    line(ax, ay, bx, by);
  }

  static sub(a, b, out = new Vector(0, 0)) {
    out.x = a.x - b.x;
    out.y = a.y - b.y;
    return out;
  }
}

const tmpv0 = new Vector(0, 0);
const tmpv1 = new Vector(0, 0);
const tmpv2 = new Vector(0, 0);
const tmpv3 = new Vector(0, 0);

class Wheel {
  constructor(x, y, offset = 0, width = 8, height = 18) {
    this.position = new Vector(x, y);
    this.offset = offset;
    this.height = height;
    this.width = width;
  }

  draw(angle) {
    push();
    rectMode(CENTER);
    noStroke();
    fill("#333");
    translate(this.position.x, this.position.y);
    rotate(angle);
    rect(this.offset, 0, this.width, this.height);
    pop();
  }
}

class Car {
  constructor(x, y, length = 64) {
    this.length = length;
    this.position = new Vector(x, y);
    this.speed = 0;
    this.heading = -90;
    this.velocity = new Vector(0, 0);
    this.trailer = new Vector(x, y + length);
    this.rotation = 0;
    this.wheels = [
      [new Wheel(-16, 0, -4), new Wheel(+16, 0, +4)],
      [new Wheel(-16, 0, -4), new Wheel(+16, 0, +4)],
    ];
  }

  update(dt) {
    // if (mouseIsPressed) {
    //   this.position.x = mouseX;
    //   this.position.y = mouseY;
    //   // this.trailer.x = mouseX;
    //   // this.trailer.y = mouseY + this.length;
    // }

    if (keyIsDown(UP_ARROW)) {
      this.speed += 10;
    }

    if (keyIsDown(DOWN_ARROW)) {
      this.speed -= 10;
    }

    this.speed *= 0.99;
    this.speed = constrain(this.speed, -300, 500);

    this.heading += 90;
    {
      if (keyIsDown(LEFT_ARROW)) {
        this.heading -= 5;
      }

      if (keyIsDown(RIGHT_ARROW)) {
        this.heading += 5;
      }

      this.heading *= 0.9;
      this.heading = constrain(this.heading, -60, 60);
    }
    this.heading -= 90;

    this.velocity.x = cos(this.heading + this.rotation) * this.speed;
    this.velocity.y = sin(this.heading + this.rotation) * this.speed;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    Vector.constrainDistance(this.position, this.trailer, this.length);

    const dx = this.trailer.x - this.position.x;
    const dy = this.trailer.y - this.position.y;

    this.rotation = atan2(dy, dx) - 90;
  }

  draw() {
    const { position, rotation, trailer, heading, length, speed, wheels } =
      this;

    if (DEBUG) {
      noStroke();

      fill(255, 0, 0);
      ellipse(position.x, position.y, 4, 4);

      fill(0, 0, 255);
      ellipse(trailer.x, trailer.y, 4, 4);

      stroke(0, 255, 0);
      noFill();

      push();
      translate(position.x, position.y);
      rotate(heading + rotation);
      line(0, 0, length * (speed / 1000), 0);
      pop();
    }

    const wheelAngle = heading + 90;
    const activeWheel = approx(wheelAngle, 0) ? -1 : wheelAngle < 0 ? 0 : 1;

    const normal = Vector.sub(position, trailer, tmpv0);

    if (DEBUG) {
      stroke(255, 0, 0);
      noFill();

      Vector.drawLineEquation(trailer, normal);
    }

    if (activeWheel !== -1) {
      const wheel = wheels[0][activeWheel];
      const px = wheel.position.x;
      const py = wheel.position.y;
      const cr = cos(rotation);
      const sr = sin(rotation);
      const x = px * cr - py * sr;
      const y = px * sr + py * cr;
      const a = rotation + wheelAngle;
      const ca = cos(a);
      const sa = sin(a);
      const o = wheel.offset;
      const ox = 100 * ca * Math.sign(o);
      const oy = 100 * sa * Math.sign(o);

      const wheelNormal = tmpv1.set(ox, oy);
      const wheelPosition = tmpv2.set(position.x + x, position.y + y);

      if (DEBUG) {
        noFill();
        stroke(255, 255, 0);
        // Vector.drawLineAlongNormal(wheelPosition, wheelNormal);

        fill(0, 255, 255);
        noStroke();
        ellipse(position.x + x, position.y + y, 2, 2);
        ellipse(position.x + x + ox, position.y + y + oy, 2, 2);
      }
    }

    this.drawWheels(activeWheel, wheels[0], position, wheelAngle);
    this.drawWheels(-1, wheels[1], trailer, 0);

    if (DEBUG) {
      stroke(0);
      fill(255);

      text("Speed: " + speed.toFixed(0), 10, 20);
      text("Heading: " + (heading + 90).toFixed(0), 10, 40);
      text("Rotation: " + rotation.toFixed(0), 10, 60);
    }
  }

  drawWheels(active, wheels, axel, angle) {
    for (let i = 0; i < wheels.length; i++) {
      const wheel = wheels[i];
      this.drawWheel(wheel, axel, active === i ? angle : 0);
    }
  }

  drawWheel(wheel, axel, angle) {
    push();
    translate(axel.x, axel.y);
    rotate(this.rotation);
    wheel.draw(angle);
    pop();
  }
}

function approx(a, b, threshold = 0.1) {
  return Math.abs(a - b) < threshold;
}
