const { exec } = require('child_process');

function getStashIds() {
  return new Promise((resolve, reject) => {
    exec('git fsck --lost-found', { encoding: 'utf8' }, (err, stdout) => {
      if (err) {
        return reject(err);
      }
      const matches = stdout.match(/([^\s\r\n]+)/g);
      const ids = matches.filter((id) => /[0-9]+/.test(id));
      resolve(ids);
    });
  });
}

function taskGenertor(id) {
  return new Promise((resolve) => {
    exec(`git show ${id}`, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        return resolve();
      }
      if (data.includes('vite')) {
        resolve(id);
      } else {
        resolve();
      }
    });
  });
}

(async () => {
  const ids = await getStashIds();
  const checkedId = await Promise.all(ids.map((id) => taskGenertor(id)));
  console.log(checkedId.filter((it) => it));
})();

// 查找到记录id, 恢复响应记录
// git stash apply 45c0a0e6d864e0401c4d2b95725991cc041221e6
