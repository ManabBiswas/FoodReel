/**
 * Magic-byte file type detection (audit V-12).
 *
 * The upload routes previously trusted file.mimetype, which is just the
 * client's Content-Type header. These lock in content-based validation and,
 * crucially, the case that motivated it: a non-image renamed to .jpg.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { detectFileType, isAllowedFileType } = await import('../src/utils/fileSignature.js');
const { ALLOWED_MIME_TYPES } = await import('../src/middlewares/fileUpload.js');

const bytes = (...b) => Buffer.from(b);
const asciiBuf = (s) => Buffer.from(s, 'ascii');

const JPEG = Buffer.concat([bytes(0xff, 0xd8, 0xff, 0xe0), Buffer.alloc(16)]);
const PNG = Buffer.concat([bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), Buffer.alloc(8)]);
const GIF87 = Buffer.concat([asciiBuf('GIF87a'), Buffer.alloc(8)]);
const GIF89 = Buffer.concat([asciiBuf('GIF89a'), Buffer.alloc(8)]);
const WEBP = Buffer.concat([asciiBuf('RIFF'), Buffer.alloc(4), asciiBuf('WEBP'), Buffer.alloc(4)]);
const MP4 = Buffer.concat([Buffer.alloc(4), asciiBuf('ftypisom'), Buffer.alloc(8)]);
const MOV = Buffer.concat([Buffer.alloc(4), asciiBuf('ftypqt  '), Buffer.alloc(8)]);
const AVI = Buffer.concat([asciiBuf('RIFF'), Buffer.alloc(4), asciiBuf('AVI '), Buffer.alloc(4)]);
const PDF = Buffer.concat([asciiBuf('%PDF-1.7'), Buffer.alloc(8)]);

test('detectFileType identifies the supported image formats', () => {
    assert.equal(detectFileType(JPEG), 'image/jpeg');
    assert.equal(detectFileType(PNG), 'image/png');
    assert.equal(detectFileType(GIF87), 'image/gif');
    assert.equal(detectFileType(GIF89), 'image/gif');
    assert.equal(detectFileType(WEBP), 'image/webp');
});

test('detectFileType identifies the supported video formats', () => {
    assert.equal(detectFileType(MP4), 'video/mp4');
    assert.equal(detectFileType(AVI), 'video/x-msvideo');
});

test('WEBP and AVI are told apart by their RIFF sub-type', () => {
    // Both begin with "RIFF"; only the bytes at offset 8 differ.
    assert.equal(detectFileType(WEBP), 'image/webp');
    assert.equal(detectFileType(AVI), 'video/x-msvideo');
});

test('a script renamed to .jpg is rejected (the V-12 case)', () => {
    const evil = Buffer.concat([asciiBuf('#!/bin/sh\nrm -rf /\n'), Buffer.alloc(64)]);
    // Declared type is attacker-controlled and would sail past a mimetype check.
    assert.equal(detectFileType(evil), null);
    assert.equal(isAllowedFileType(evil, ALLOWED_MIME_TYPES.IMAGE), false);
});

test('an HTML file cannot pose as an image', () => {
    const html = Buffer.concat([asciiBuf('<!DOCTYPE html><script>alert(1)</script>'), Buffer.alloc(32)]);
    assert.equal(detectFileType(html), null);
    assert.equal(isAllowedFileType(html, ALLOWED_MIME_TYPES.IMAGE), false);
});

test('a PDF cannot pose as a profile picture', () => {
    assert.equal(isAllowedFileType(PDF, ALLOWED_MIME_TYPES.PROFILE), false);
});

test('detection returns null for empty or non-buffer input', () => {
    assert.equal(detectFileType(Buffer.alloc(0)), null);
    assert.equal(detectFileType(null), null);
    assert.equal(detectFileType(undefined), null);
    assert.equal(detectFileType('not a buffer'), null);
});

test('a buffer too short to hold a signature is not misclassified', () => {
    assert.equal(detectFileType(bytes(0xff, 0xd8)), null);
    assert.equal(detectFileType(bytes(0x89, 0x50, 0x4e)), null);
});

test('MP4 and QuickTime are interchangeable for video routes', () => {
    // Both are ISO-BMFF containers distinguished only by a brand string, and
    // QuickTime is a valid MP4 container - rejecting it here would break
    // legitimate .mov uploads on routes that allow video/mp4.
    assert.equal(isAllowedFileType(MOV, ALLOWED_MIME_TYPES.VIDEO), true);
    assert.equal(isAllowedFileType(MP4, ALLOWED_MIME_TYPES.VIDEO), true);
});

test('a video is not accepted by an image-only route', () => {
    assert.equal(isAllowedFileType(MP4, ALLOWED_MIME_TYPES.IMAGE), false);
    assert.equal(isAllowedFileType(JPEG, ALLOWED_MIME_TYPES.VIDEO), false);
});

test('every mime the app declares for images/video is detectable', () => {
    // Guards against a route declaring a type the sniffer can never match,
    // which would reject every legitimate upload.
    const samples = {
        'image/jpeg': JPEG,
        'image/png': PNG,
        'image/gif': GIF89,
        'image/webp': WEBP,
        'video/mp4': MP4,
        'video/x-msvideo': AVI
    };
    for (const mime of ALLOWED_MIME_TYPES.IMAGE) {
        assert.ok(samples[mime], `no test sample for declared image type ${mime}`);
    }
    for (const mime of ['video/mp4', 'video/x-msvideo']) {
        assert.ok(samples[mime], `no test sample for declared video type ${mime}`);
    }
});