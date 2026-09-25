import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createLogoCollider, getLogoContact } from '../components/logoCollision.ts';
const oval = createLogoCollider(new THREE.Mesh(new THREE.BoxGeometry(2, .1, 1)));
assert.equal(getLogoContact(oval, 0, 0, oval, 2.1, 0), null);
const hit = getLogoContact(oval, 0, 0, oval, 1.9, 0);
assert.ok(hit && hit.normalX > .99 && Math.abs(hit.depth - .1) < .00001);
// Former rectangular corners no longer catch another piece.
assert.equal(getLogoContact(oval, 0, 0, oval, 1.8, .8), null);
const diagonal = getLogoContact(oval, 0, 0, oval, 1, .5);
const reverse = getLogoContact(oval, 1, .5, oval, 0, 0);
assert.ok(diagonal && reverse && diagonal.normalX > 0 && diagonal.normalZ > 0);
assert.ok(Math.abs(diagonal.normalX + reverse.normalX) < 1e-8);
assert.ok(Math.abs(diagonal.depth - reverse.depth) < 1e-8);
const coincident = getLogoContact(oval, 0, 0, oval, 0, 0);
assert.ok(coincident && Number.isFinite(coincident.depth) && coincident.depth > 0);
console.log('PASS: oval separation, rounded corners, smooth symmetric contact and containment');
