import './index.css';

/*! 测试合法注释 */
const age /*! 不是合法注释 */ = 12; //! 默认年龄

type Ages = number[]

function sayAge() {
  return age
}

export default sayAge