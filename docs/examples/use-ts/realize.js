function test(a) {
  const createGenerator = function () {
      const generator = __generator(this, function (_a) {
          switch (_a.label) {
              case 0: return [4 /*yield*/, 1];
              case 1:
                  _a.sent();
                  return [4 /*yield*/, new Promise(function (resolve) { return resolve(2); })];
              case 2:
                  _a.sent();
                  return [2 /*return*/, "1"];
          }
      });
      return generator
  }
  return __awaiter(this, void 0, void 0, createGenerator);
}

function __awaiter (thisArg, _arguments, P, createGenerator) {
  const IPromise = P || Promise
  const it = createGenerator.apply(thisArg, _arguments || []);
  const adopt = (val) => val instanceof Promise ? val : IPromise.resolve(val)
  return new IPromise((resolve, reject) => {
    const fulfilled = (val) => {
      try {
        step(it.next(val))
      } catch (e) {
        reject(e)
      }
    }
    const rejected = (val) => {
      try {
        step(it.throw(val))
      } catch (e) {
        reject(e)
      }
    }
    const step = (result) => result.done ? resolve(result.value) : adopt(result.value).then(fulfilled,rejected)
    step(it.next())
  })
}

function __generator (thisArg, body) {
  const g = {
    next() {},
    throw() {}
  }
  return g
}