import { Param } from './param.js';
import { Calc } from './calc.js';

export class Collision {
  constructor(elems) {
    this.elems = elems
    this.enemies = []
    this.objs = []
    this.user = elems[elems.length - 1]

    for (let i = 0; i < Param.ENEMY_PARAM.count + Param.OBJ_PARAM.count; i++) {
      if (i < Param.ENEMY_PARAM.count) {
        this.enemies.push(elems[i])
      }
      else if (i < Param.ENEMY_PARAM.count + Param.OBJ_PARAM.count) {
        this.objs.push(elems[i])
      }
    }
  }
  check(indexA, indexB) {
    const elemA = this.elems[indexA]
    const elemB = this.elems[indexB]
    const dist = Math.sqrt((elemA.position.z - elemB.position.z) * (elemA.position.z - elemB.position.z) + (elemA.position.x - elemB.position.x) * (elemA.position.x - elemB.position.x))

    //ユーザーが何かと衝突した時のトンネリング回避
    if (elemB.label == "user" && dist < (elemA.width + elemB.width) / 2) {
      const fromAtoB_rot = Calc.rotAdjust(Math.atan2(elemB.position.x - elemA.position.x, elemB.position.z - elemA.position.z))
      elemB.position.z = elemA.position.z + (elemA.width + elemB.width) / 2 * Math.cos(fromAtoB_rot)
      elemB.position.x = elemA.position.x + (elemA.width + elemB.width) / 2 * Math.sin(fromAtoB_rot)
    }
    if (elemA.label == "enemy") {
      if (dist < elemA.radius + elemB.width / 2) {
        const fromAtoB_rot = Calc.rotAdjust(Math.atan2(elemB.position.x - elemA.position.x, elemB.position.z - elemA.position.z))
        const fromA_startRot = Calc.rotAdjust(elemA.rotation.y - elemA.swingRot) - 25 * (Math.PI / 180)
        const fromA_endRot = Calc.rotAdjust(elemA.rotation.y - elemA.swingRot) + 25 * (Math.PI / 180)

        if (elemB.label != "user") {
          //敵と敵、敵と障害物の衝突判定
          if (dist < (elemA.width + elemB.width) / 2) {
            return 'back'
          }
        } else {
          //敵とユーザーの衝突判定( 敵の視線をチェック )
          if (fromA_startRot < fromAtoB_rot && fromAtoB_rot < fromA_endRot || fromA_startRot < (fromAtoB_rot - Math.PI * 2) && (fromAtoB_rot - Math.PI * 2) < fromA_endRot) {
            if (!this.windDisabled(fromAtoB_rot, fromA_startRot, fromA_endRot, elemA, elemB)) {
              this.user.windForce.push(indexA)
              return 'tracking'
            }
          }
          else {
            const v1 = [elemB.position.z, elemB.position.x]
            const rightAngle_s = Calc.rotAdjust(fromA_startRot - Math.PI / 2)
            const v2_s = [
              elemB.position.z - elemB.radius * Math.cos(rightAngle_s),
              elemB.position.x - elemB.radius * Math.sin(rightAngle_s)
            ]
            const rightAngle_e = Calc.rotAdjust(fromA_endRot - Math.PI / 2)
            const v2_e = [
              elemB.position.z + elemB.radius * Math.cos(rightAngle_e),
              elemB.position.x + elemB.radius * Math.sin(rightAngle_e)
            ]
            const v3 = [elemA.position.z, elemA.position.x]
            const v4_s = [
              elemA.position.z + elemA.radius * Math.cos(fromA_startRot),
              elemA.position.x + elemA.radius * Math.sin(fromA_startRot)
            ]
            const v4_e = [
              elemA.position.z + elemA.radius * Math.cos(fromA_endRot),
              elemA.position.x + elemA.radius * Math.sin(fromA_endRot)
            ]

            //敵とユーザーの衝突判定( 判定漏れのユーザーの半径分を追加でチェック )
            if (Calc.intersectLines(v1, v2_s, v3, v4_s) || Calc.intersectLines(v1, v2_e, v3, v4_e)) {
              if (!this.windDisabled(fromAtoB_rot, fromA_startRot, fromA_endRot, elemA, elemB)) {
                this.user.windForce.push(indexA)
                return 'tracking'
              }
            }
          }
        }
      }
    }
  }
  windDisabled(fromAtoB_rot, fromA_startRot, fromA_endRot, elemA, elemB) {
    let judge = false
    const fromAtoB_rotV = fromAtoB_rot - Math.PI / 2
    for (let h = 0; h < this.objs.length; h++) {
      const obj = this.objs[h]
      if (
        Calc.intersectLines(
          [elemA.position.z, elemA.position.x],
          [elemB.position.z, elemB.position.x],
          [obj.position.z + Math.cos(fromAtoB_rotV) * obj.width / 2, obj.position.x + Math.sin(fromAtoB_rotV) * obj.width / 2],
          [obj.position.z - Math.cos(fromAtoB_rotV) * obj.width / 2, obj.position.x - Math.sin(fromAtoB_rotV) * obj.width / 2]
        )
      ) {
        const fromAtoObj_dist = Math.sqrt((obj.position.z - elemA.position.z) ** 2 + (obj.position.x - elemA.position.x) ** 2)
        const z = elemA.position.z + Math.cos(fromAtoB_rot) * fromAtoObj_dist
        const x = elemA.position.x + Math.sin(fromAtoB_rot) * fromAtoObj_dist

        const posA = { z: z + Math.cos(fromAtoB_rotV) * elemB.width / 2, x: x + Math.sin(fromAtoB_rotV) * elemB.width / 2 }
        const posB = { z: z - Math.cos(fromAtoB_rotV) * elemB.width / 2, x: x - Math.sin(fromAtoB_rotV) * elemB.width / 2 }

        const fromAtoPosA_rot = Calc.rotAdjust(Math.atan2(posA.x - elemA.position.x, posA.z - elemA.position.z))
        const fromAtoPosB_rot = Calc.rotAdjust(Math.atan2(posB.x - elemA.position.x, posB.z - elemA.position.z))

        const dz = obj.position.z - z;
        const dx = obj.position.x - x;
        const dist = Math.sqrt(dz ** 2 + dx ** 2);

        if (dist + elemB.width / 2 <= obj.width / 2) {
          judge = true
        } else {
          if (!(fromA_startRot < fromAtoPosA_rot && fromAtoPosA_rot < fromA_endRot || fromA_startRot < (fromAtoPosA_rot - Math.PI * 2) && (fromAtoPosA_rot - Math.PI * 2) < fromA_endRot)) {
            judge = true
          }
          if (!(fromA_startRot < fromAtoPosB_rot && fromAtoPosB_rot < fromA_endRot || fromA_startRot < (fromAtoPosB_rot - Math.PI * 2) && (fromAtoPosB_rot - Math.PI * 2) < fromA_endRot)) {
            judge = true
          }
        }
      }
    }
    return judge
  }
}