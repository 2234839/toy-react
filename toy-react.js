class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  appendChild(component) {
    this.root.appendChild(component.root);
  }
}
class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
  }
}
export class Component {
  constructor(type) {
    this.children = [];
    this._root = null;
    this.props = Object.create(null);
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }
  get root() {
    if (!this._root) {
      this._root = this.render().root;
    }
    return this._root;
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
    const v = attrs[p];
    e.setAttribute(p, v);
  }
  // 添加子元素
  let insertChild = (children) => {
    for (let child of children) {
      if (typeof child === "string") {
        child = new TextWrapper(child);
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
  parent.appendChild(component.root);
};
