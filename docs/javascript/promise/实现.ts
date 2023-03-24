// Promise/A+ 规范
// https://www.ituring.com.cn/article/66566

// 实现参考
// https://juejin.cn/post/6850037281206566919#comment

// 总结
// promise是一个状态机,通过回调函数修改内部状态, 再执行成功、失败相关操作。

interface Executor {
  (resolve: Callback, reject: Callback): void;
}

interface Callback {
  (val: any): void;
}

class IPromise {
  static PENDING = 'pending';

  static FULFILLED = 'fulfilled';

  static REJECTED = 'rejected';

  state: string;

  value: any;

  reason: any;

  onReslovedCallbacks: Callback[];

  onRejectCedallbacks: Callback[];

  constructor(executor: Executor) {
    this.state = IPromise.PENDING;
    this.value = null;
    this.reason = null;
    this.onReslovedCallbacks = [];
    this.onRejectCedallbacks = [];

    const resolve = (value) => {
      if (this.state === IPromise.PENDING) {
        this.state = IPromise.FULFILLED;
        this.value = value;
        this.onReslovedCallbacks.map((cb) => cb(this.value));
      }
    };

    const reject = (reason) => {
      if (this.state === IPromise.PENDING) {
        this.state = IPromise.REJECTED;
        this.reason = reason;
        this.onRejectCedallbacks.map((cb) => cb(reason));
      }
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  static resolvePromise(p: IPromise, x: any, resolve: Callback, reject: Callback) {
    if (p === x) {
      return reject(new Error('Type Error'));
    }
    let called = false;
    if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
      try {
        const then = x.then;
        if (typeof then === 'function') {
          (then as Executor).call(
            x,
            (y) => {
              if (called) return;
              called = true;
              IPromise.resolvePromise(p, y, resolve, reject);
            },
            (r) => {
              if (called) return;
              called = true;
              reject(r);
            },
          );
        } else {
          resolve(x);
        }
      } catch (err) {
        if (called) return;
        called = true;
        reject(err);
      }
    } else {
      resolve(x);
    }
  }

  then(onFulfilled: Callback, onRejected?: Callback) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (v) => v;
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (err) => {
          throw err;
        };
    const p2 = new IPromise((resolve, reject) => {
      if (this.state === IPromise.FULFILLED) { // Promise状态已变更为FULFILLED
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value);
            IPromise.resolvePromise(p2, x, resolve, reject);
          } catch (err) {
            reject(err);
          }
        }, 0);
      }

      if (this.state === IPromise.REJECTED) { // Promise状态已变更为REJECTED
        setTimeout(() => {
          try {
            const x = onRejected(this.reason);
            IPromise.resolvePromise(p2, x, resolve, reject);
          } catch (err) {
            reject(err);
          }
        }, 0);
      }

      if (this.state === IPromise.PENDING) { // Promise状态还是PENDING; 异步
        this.onReslovedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value);
              IPromise.resolvePromise(p2, x, resolve, reject);
            } catch (err) {
              reject(err);
            }
          }, 0);
        });

        this.onRejectCedallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason);
              IPromise.resolvePromise(p2, x, resolve, reject);
            } catch (err) {
              reject(err);
            }
          }, 0);
        });
      }
    });
    return p2;
  }
}

const p1 = new IPromise((resolve) => {
  setTimeout(() => {
    resolve('hah');
  }, 100);
});

p1.then((res) => {
  console.log(res);
});
