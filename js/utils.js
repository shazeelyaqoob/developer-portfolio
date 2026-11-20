/* Shared helpers and flags used by every other script. */
"use strict";

var root = document.documentElement;
var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
var coarse = matchMedia("(pointer: coarse)").matches;
var $ = function (s) { return document.querySelector(s); };
var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
