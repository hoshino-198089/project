export class Calc {
  static ease(x) {
    return x * x * x
  }
  static rotAdjust(value) {
    let rot = value
    if (value < 0) { rot = value % (2 * Math.PI) + 2 * Math.PI }
    else if (value >= (2 * Math.PI)) { rot = value % (2 * Math.PI) }
    return rot
  }
  static cross(a, b) {
    return a[0] * b[1] - a[1] * b[0];
  }
  static subVec(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }
  static intersectLines(v1, v2, v3, v4) {
    const fromV1ToV2 = Calc.subVec(v2, v1);
    const fromV1ToV3 = Calc.subVec(v3, v1);
    const fromV1ToV4 = Calc.subVec(v4, v1);
    const fromV3ToV1 = Calc.subVec(v1, v3);
    const fromV3ToV2 = Calc.subVec(v2, v3);
    const fromV3ToV4 = Calc.subVec(v4, v3);
    if (Calc.cross(fromV1ToV2, fromV3ToV4) == 0) {
      return false;
    }
    return (Calc.cross(fromV1ToV2, fromV1ToV3) * Calc.cross(fromV1ToV2, fromV1ToV4) < 0) && (Calc.cross(fromV3ToV4, fromV3ToV1) * Calc.cross(fromV3ToV4, fromV3ToV2) < 0);
  }
}