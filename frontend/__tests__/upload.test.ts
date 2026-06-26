/**
 * 图片上传工具测试
 * 只测试纯函数，不测试涉及 dynamic import 的 compressImage/uploadImage
 */

describe('upload utils', () => {
  it('getPathFromUrl extracts storage path', () => {
    const { getPathFromUrl } = require('../lib/upload');
    const path = getPathFromUrl('https://cdn.example.com/items-images/abc123.jpg');
    expect(path).toBe('abc123.jpg');
  });

  it('getPathFromUrl returns null for non-matching urls', () => {
    const { getPathFromUrl } = require('../lib/upload');
    const path = getPathFromUrl('https://example.com/other/image.jpg');
    expect(path).toBeNull();
  });

  it('getPathFromUrl handles empty string', () => {
    const { getPathFromUrl } = require('../lib/upload');
    expect(getPathFromUrl('')).toBeNull();
  });

  it('getPathFromUrl handles file paths in subdirectories', () => {
    const { getPathFromUrl } = require('../lib/upload');
    const path = getPathFromUrl('https://cdn.example.com/items-images/folder/sub/img.png');
    expect(path).toBe('folder/sub/img.png');
  });
});
