import { Square } from "./TicTacToe";
import { isObject } from "./util";

const RENDER_TO_DOM = Symbol("渲染到dom");
export class Component {
  constructor() {
    this.children = [];
    this._root = null;
    this._range = null;
    this.props = Object.create(null);
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    this._vdom = this.vdom;
    this._vdom[RENDER_TO_DOM](range);
  }
  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        return false;
      } else {
        for (const name in newNode.props) {
          if (newNode.props[name] !== oldNode.props[name]) {
            return false;
          }
        }
        if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
          return false;
        }
        if (newNode.type === "#text") {
          if (newNode.content !== oldNode.content) {
            return false;
          }
        }
      }
      return true;
    };
    let update = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      newNode._range = oldNode._range;
      let newChildren = newNode.vchildren;
      let oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) {
        return;
      }

      let tailRange = oldChildren[oldChildren.length - 1]._range;
      for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i];
        const oldChild = oldChildren[i];
        if (i < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          let range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }
    };
    let vdom = this.vdom;
    update(this._vdom, vdom);
    this._vdom = vdom;
  }

  setState(newState) {
    if (!isObject(this.state)) {
      this.state = new State();
    } else {
      let i = 0;
      const merge = (oldState, newState) => {
        // console.log("[merge]", oldState, newState);
        i += 1;
        if (i > 20) {
          throw "递归层级过高";
        }
        for (const k in newState) {
          // console.log("[          k]", newState, k);
          if (!isObject(oldState[k])) {
            //普通值直接覆盖写
            oldState[k] = newState[k];
          } else if (Array.isArray(oldState[k])) {
            oldState[k] = newState[k];
          } else {
            /** 对象则递归复制 */
            merge(oldState, newState);
          }
        }
      };
      merge(this.state, newState);
    }
    console.log("[this.state]", this.state, newState);
    this.update();
  }

  get vdom() {
    /** render 返回的是经过 createElement 返回的对象， */
    return this.render().vdom;
  }
  // get vchildren() {
  //   return this.children.map((child) => child.vdom);
  // }
}

class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
  }
  get vdom() {
    this.vchildren = this.children.map((child) => child.vdom);
    return this;
  }
  [RENDER_TO_DOM](range) {
    if (!range) {
      throw "渲染到dom必须传入 range 对象";
    }
    this._range = range;
    let root = document.createElement(this.type);
    for (let name in this.props) {
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
          value,
        );
      } else {
        if (name === "className") {
          root.setAttribute("class", value);
        } else {
          root.setAttribute(name, value);
        }
      }
    }

    for (let child of this.vchildren) {
      let childRange = document.createRange();
      const parent = root;
      childRange.setStart(parent, parent.childNodes.length);
      childRange.setEnd(parent, parent.childNodes.length);
      child[RENDER_TO_DOM](childRange);

      // if (!child.vdom._range) {
      //   console.log(child, child.vdom._range, "[this]", this, child.vdom === this);
      // }
      // console.log(!!child._range, !!child.vdom._range);
    }
    replaceContent(range, root);
  }
}
class TextWrapper extends Component {
  constructor(content) {
    super(content);
    this.content = content;
    this.type = "#text";
  }
  get vdom() {
    return this;
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    let root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
}

/** 通过jsx生成的数据返回对应的dom元素 */
export const createElement = (type, attrs, ...children /** 这里可能是文本 */) => {
  let e;
  if (typeof type !== "string") {
    e = new type();
  } else {
    e = new ElementWrapper(type);
  }
  // 设置属性
  for (const p in attrs) {
    e.setAttribute(p, attrs[p]);
  }
  // 添加子元素
  let insertChild = (children) => {
    for (let child of children) {
      if (typeof child === "string" || typeof child === "number") {
        child = new TextWrapper(child);
      }
      if (child === null) {
        continue;
      }
      if (Array.isArray(child)) {
        insertChild(child);
      } else {
        e.appendChild(child);
      }
    }
  };
  insertChild(children);
  return e;
};

export const render = (component, parent) => {
  let range = document.createRange();
  range.setStart(parent, 0);
  range.setEnd(parent, parent.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
};

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}
