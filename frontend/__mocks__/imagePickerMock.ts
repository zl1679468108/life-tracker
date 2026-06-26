module.exports = {
  MediaTypeOptions: { Images: 'images' },
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
};
