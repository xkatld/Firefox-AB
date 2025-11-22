module.exports = async function(config) {
  console.log('Skipping code signing for unsigned build');
  return null;
};
