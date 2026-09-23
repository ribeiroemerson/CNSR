// Encaminha rejeições de handlers assíncronos para o middleware de erro do Express
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
