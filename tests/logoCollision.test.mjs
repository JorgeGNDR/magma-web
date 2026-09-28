import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createLogoCollider, getLogoContact} from '../components/logoCollision.ts';
const rectangle = new THREE.Mesh(new THREE.BoxGeometry(2, .1, 1));
const box = createLogoCollider(rectangle);
assert.equal(getLogoContact(box,0,0,box,2.1,0),null);
const hit = getLogoContact(box,0,0,box,1.9,0);


assert.ok(hit && hit.normalX > .9 && hit.depth > .07 && hit.depth < .13);
const shape = new THREE.Shape(); shape.moveTo(-1,-1);shape.lineTo(1,-1);shape.lineTo(1,1);shape.lineTo(-1,1);shape.closePath();
const hole = new THREE.Path();hole.moveTo(-.5,-.5);hole.lineTo(-.5,.5);hole.lineTo(.5,.5);hole.lineTo(.5,-.5);hole.closePath();shape.holes.push(hole);
const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape));mesh.rotation.x = Math.PI/2;
const ring = createLogoCollider(mesh);
const small = createLogoCollider(new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.3)));
assert.equal(getLogoContact(ring,0,0,small,0,0),null);
assert.ok(getLogoContact(ring,0,0,small,.5,0));
assert.ok(getLogoContact(box,0,0,small,0,0));
console.log('PASS: separation, contact depth/direction, empty hole, inner edge, containment');
// Visible corners must collide too; the old oval proxy missed this overlap.
assert.ok(getLogoContact(box, 0, 0, box, 1.8, .8));
const cornerHit = getLogoContact(box, 0, 0, small, .96, .46);
assert.ok(cornerHit && cornerHit.depth > 0);
// Mesh transforms are reflected in the collision contour.
const translatedMesh = new THREE.Mesh(new THREE.BoxGeometry(2, .1, 1));
translatedMesh.position.set(3, 0, 2);
const translated = createLogoCollider(translatedMesh);
assert.equal(getLogoContact(box, 0, 0, translated, 0, 0), null);
assert.ok(getLogoContact(box, 0, 0, translated, -3, -2));
console.log('PASS: visible corners and transformed mesh contour');
